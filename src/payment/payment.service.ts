import {
  PaymentPayResponse,
  StripeCustomerCreateResponse,
  StripePaymentMethodRetrieveResponse,
  StripeSetupIntentCreateResponse,
} from '@/app/contracts/types/stripe.types';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  SetupPaymentMethodDto,
  SavePaymentMethodDto,
  AssociatePropertyPaymentMethodDto,
  MembershipPaymentRetryDto,
  GetMembershipTransactionDto,
} from './payment.dto';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { AuthService } from '@/auth/auth.service';
import { PaymentMessages } from './payment.message';
import { StripeService } from './stripe.service';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { UserPaymentMethodModel } from '@/app/models/paymentMethod/userPaymentMethod.model';
import {
  PaymentMethod,
  PaymentMethodStatus,
} from '@/app/contracts/enums/payment.enum';
import { ConfigService } from '@nestjs/config';
import { OwnerService } from '@/owner/owner.service';
import { OwnerProfileStatus } from '@/app/contracts/enums/ownerProfile.enum';
import { EncryptionHelper } from '@/app/utils/encryption.helper';
import { PropertyService } from '@/properties/property.service';
import { UserModel } from '@/app/models/user/user.model';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import {
  IPayParams,
  IProcessGuestConciergePaymentParams,
  IProcessPaymentParams,
} from '@/app/contracts/interfaces/payment.interface';
import { BunyanLogger } from '@/app/commons/logger.service';
import { MembershipTransactionRepository } from '@/app/repositories/membershipTier/membershipTransaction.repository';
import { GeneralHelper } from '@/app/utils/general.helper';
import { PaymentMethodMessages } from '@/app/utils/serviceRequestStatus.helper';
import { MembershipTierRepository } from '@/app/repositories/membershipTier/membershipTier.repository';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
import * as moment from 'moment';
import { MemberShipTransactionModel } from '@/app/models/membership/membershipTransaction.model';
import { DataSource } from 'typeorm';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { InvoicePaymentStatus } from '@/app/contracts/enums/invoice.enum';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';
import { MemberShipTierModel } from '@/app/models/membership/membershipTier.model';
import { CreateMembershipDto } from '@/properties/property.dto';
@Injectable()
export class PaymentService extends StripeService {
  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => OwnerService))
    private readonly ownerService: OwnerService,
    @Inject(forwardRef(() => PropertyService))
    protected readonly propertyService: PropertyService,
    private readonly userPaymentMethodRepository: UserPaymentMethodRepository,
    private readonly membershipTransactionRepository: MembershipTransactionRepository,
    private readonly propertyMasterRepository: PropertyMasterRepository,
    private readonly userRepository: UserRepository,
    private readonly franchiseRepository: FranchiseRepository,
    protected readonly configService: ConfigService,
    protected readonly encryptionHelper: EncryptionHelper,
    protected readonly property: EncryptionHelper,
    protected readonly logger: BunyanLogger,
    protected readonly generalHelper: GeneralHelper,
    protected readonly membershipTierRepository: MembershipTierRepository,
    private readonly dataSource: DataSource,
  ) {
    super(configService, logger);
  }

  async setupPaymentMethod(
    paymentMethod: SetupPaymentMethodDto,
    user: JwtPayload,
  ): Promise<StripeSetupIntentCreateResponse> {
    const owner = await this.authService.getUserById(user.id);
    if (!owner || !owner.payment_gateway_customer_id)
      throw new BadRequestException(PaymentMessages.USER_NOT_FOUND);
    const franchiseModel: FranchiseModel =
      await this.franchiseRepository.getFranchiseDetails(owner.franchise_id);

    const setupIntentObject = await this.createSetupIntent(
      owner.payment_gateway_customer_id,
      paymentMethod.payment_method_type,
      franchiseModel.stripe_secret_key,
    );

    const userPaymentMethodModel = new UserPaymentMethodModel();

    userPaymentMethodModel.owner_id = user.id;
    userPaymentMethodModel.payment_method_type =
      paymentMethod.payment_method_type === PaymentMethod.Card
        ? PaymentMethod.Card
        : PaymentMethod.BankAccount;
    userPaymentMethodModel.setup_intent_id = setupIntentObject.id;
    userPaymentMethodModel.payment_info = setupIntentObject;
    userPaymentMethodModel.status = PaymentMethodStatus.Created;

    await this.userPaymentMethodRepository.save(userPaymentMethodModel);

    return setupIntentObject;
  }

  async savePaymentMethod(
    savePaymentMethodDto: SavePaymentMethodDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const franchiseModel: FranchiseModel =
      await this.franchiseRepository.getFranchiseDetails(
        Number(user.franchise_id),
      );
    const [setupIntent, paymentMethod] = await Promise.all([
      this.retrieveSetupIntent(
        savePaymentMethodDto.setup_intent_id,
        franchiseModel.stripe_secret_key,
      ),
      this.retrievePaymentMethod(
        savePaymentMethodDto.payment_method_id,
        franchiseModel.stripe_secret_key,
      ),
    ]);
    if (!setupIntent)
      throw new BadRequestException(PaymentMessages.SETUP_INTENT_NOT_FOUND);

    if (!paymentMethod)
      throw new BadRequestException(PaymentMessages.PAYMENT_METHOD_NOT_FOUND);

    await this.userPaymentMethodRepository.update(
      {
        setup_intent_id: setupIntent.id,
      },
      {
        stripe_payment_method_id: savePaymentMethodDto.payment_method_id,
        payment_method_info: paymentMethod,
        card_holder_name: savePaymentMethodDto?.card_holder_name,
      },
    );

    return true;
  }

  async retrieveOwnerPaymentMethod(
    franchiseId: number,
    paymentMethodId: string,
  ): Promise<StripePaymentMethodRetrieveResponse | null> {
    if (!franchiseId || !paymentMethodId) return null;

    const franchiseModel: FranchiseModel =
      await this.franchiseRepository.getFranchiseDetails(franchiseId);

    return this.retrievePaymentMethod(
      paymentMethodId,
      franchiseModel.stripe_secret_key,
    );
  }

  async createStripeCustomer(
    name: string,
    email: string,
    franchiseId: number,
  ): Promise<StripeCustomerCreateResponse> {
    const franchiseModel: FranchiseModel =
      await this.franchiseRepository.getFranchiseDetails(Number(franchiseId));
    return await this.createCustomer(
      name,
      email,
      franchiseModel.stripe_secret_key,
    );
  }

  async getPublishableKey(franchiseId: number): Promise<{ key: string }> {
    const franchiseModel: FranchiseModel =
      await this.franchiseRepository.getFranchiseDetails(Number(franchiseId));
    if (!franchiseModel || !franchiseModel?.stripe_public_key) {
      throw new BadRequestException(PaymentMessages.FRANCHISE_CONFIG_NOT_FOUND);
    }
    const encryptedKey = this.encryptionHelper.encrypt(
      franchiseModel.stripe_public_key,
    );
    return { key: encryptedKey };
  }

  async associatePropertyPaymentMethod(
    payload: AssociatePropertyPaymentMethodDto,
    user: JwtPayload,
  ) {
    const userPaymentMethodModel =
      await this.userPaymentMethodRepository.findOne({
        where: {
          id: payload.payment_method_id,
          owner_id: user.id,
          is_deleted: false,
        },
      });

    if (!userPaymentMethodModel)
      throw new BadRequestException(PaymentMessages.PAYMENT_METHOD_NOT_FOUND);

    userPaymentMethodModel.is_default =
      payload?.is_default !== undefined
        ? payload?.is_default
        : userPaymentMethodModel.is_default;
    userPaymentMethodModel.owner_id = user.id;

    await this.ownerService.updateOwnerProfileCompletionStep(
      user,
      OwnerProfileStatus.OnboardingCompleted,
    );

    await this.propertyService.updateProperty(payload.property_id, {
      owner_payment_method_id: payload.payment_method_id,
      ...(payload?.enable_auto_charge !== undefined && {
        enable_auto_charge: payload?.enable_auto_charge,
      }),
    });

    return this.userPaymentMethodRepository.save(userPaymentMethodModel);
  }

  async pay(params: IPayParams): Promise<PaymentPayResponse> {
    const userModel: UserModel = await this.userRepository.findOne({
      where: {
        id: params.user.id,
        user_type: UserType.Owner,
        is_deleted: false,
      },
    });

    if (!userModel)
      throw new BadRequestException(PaymentMessages.USER_NOT_FOUND);

    const franchiseModel: FranchiseModel =
      await this.franchiseRepository.getFranchiseDetails(
        Number(params.user.franchise_id),
      );

    const userPaymentMethodModel: UserPaymentMethodModel =
      await this.userPaymentMethodRepository.findOne({
        where: {
          owner_id: params.user.id,
          is_deleted: false,
          ...(params?.payment_method_id && {
            id: params.payment_method_id,
          }),
          ...(!params?.payment_method_id && {
            is_default: true,
          }),
        },
      });

    if (!userPaymentMethodModel)
      throw new BadRequestException(PaymentMessages.PAYMENT_METHOD_NOT_FOUND);

    if (
      userPaymentMethodModel &&
      userPaymentMethodModel.status !== PaymentMethodStatus.Succeeded
    )
      throw new BadRequestException(
        PaymentMethodMessages.get(userPaymentMethodModel.status),
      );

    this.logger.log(`[PAYMENT] Processing pay for ${params.user.id}`);

    return await this.processPayment(
      {
        customerId: userModel.payment_gateway_customer_id,
        paymentMethodId: userPaymentMethodModel.stripe_payment_method_id,
        amount: params.amount,
      },
      franchiseModel.stripe_secret_key,
      { ...params.metadata, payment_method_id: userPaymentMethodModel.id },
    );
  }

  async getMembershipTransaction(query: GetMembershipTransactionDto) {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    return await this.membershipTransactionRepository.getMembershipTransaction(
      paginationParams,
      query,
    );
  }

  async payGuestConcierge(
    params: IProcessGuestConciergePaymentParams,
  ): Promise<PaymentPayResponse> {
    const franchiseModel: FranchiseModel =
      await this.franchiseRepository.getFranchiseDetails(
        Number(params.franchiseId),
      );

    this.logger.log(`[PAYMENT] Processing pay for guest concierge`);

    return await this.processGuestConciergePayment(
      {
        amount: params.amount,
        paymentMethodId: params.paymentMethodId,
        franchiseId: params.franchiseId,
        guestEmail: params.guestEmail,
        guestName: params.guestName,
        guestId: params.guestId,
      },
      franchiseModel.stripe_secret_key,
    );
  }

  async createOrUpdateMembership(
    payload: CreateMembershipDto,
    user: JwtPayload,
  ): Promise<{ pay_for_membership: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      let payForMembership = false;

      const propertyMasterModel: PropertyMasterModel =
        await this.propertyMasterRepository.findOne({
          where: {
            id: payload.property_master_id,
            franchise_id: Number(user.franchise_id),
            off_program: false,
          },
          relations: ['owner', 'propertyPaymentMethod'],
        });

      let propertyMembershipModel = await this.membershipTierRepository.findOne(
        {
          where: {
            property_master_id: propertyMasterModel.id,
            franchise_id: Number(user.franchise_id),
          },
        },
      );

      if (
        propertyMembershipModel &&
        propertyMembershipModel?.membership_type === MemberShipStatus.Free &&
        payload.membership_type === MemberShipStatus.Paid &&
        !propertyMembershipModel?.next_due_date
      )
        payForMembership = true;

      if (!propertyMembershipModel)
        propertyMembershipModel = new MemberShipTierModel();

      propertyMembershipModel.membership_type = payload.membership_type;
      propertyMembershipModel.franchise_id = Number(user.franchise_id);
      propertyMembershipModel.property_master_id = propertyMasterModel.id;
      propertyMembershipModel.is_last_transaction_success = payForMembership
        ? false
        : propertyMembershipModel.is_last_transaction_success;
      propertyMembershipModel.price =
        payload.membership_type === MemberShipStatus.Paid ? payload?.price : 0;

      const membershipTier = await queryRunner.manager.save(
        MemberShipTierModel,
        propertyMembershipModel,
      );

      if (payForMembership) {
        let userPaymentMethod: UserPaymentMethodModel =
          propertyMasterModel.propertyPaymentMethod;

        if (!userPaymentMethod) {
          userPaymentMethod = await this.userPaymentMethodRepository.findOne({
            where: {
              owner_id: propertyMasterModel.owner.id,
              status: PaymentMethodStatus.Succeeded,
              is_default: true,
              is_deleted: false,
            },
          });
        }

        if (!userPaymentMethod)
          throw new BadRequestException(
            PaymentMessages.PAYMENT_METHOD_NOT_FOUND,
          );

        const paymentParams: IProcessPaymentParams = {
          customerId: propertyMasterModel.owner.payment_gateway_customer_id,
          paymentMethodId: userPaymentMethod.stripe_payment_method_id,
          amount: payload.price,
        };

        const franchiseModel: FranchiseModel =
          await this.franchiseRepository.getFranchiseDetails(
            Number(propertyMasterModel.franchise_id),
          );

        const membershipTransactionModel = new MemberShipTransactionModel();

        membershipTransactionModel.membership_id = membershipTier.id;
        membershipTransactionModel.property_master_id = propertyMasterModel.id;
        membershipTransactionModel.transaction_amount = payload.price;
        membershipTransactionModel.status = InvoicePaymentStatus.Processing;
        membershipTransactionModel.transaction_date = new Date(
          moment().format('YYYY-MM-DD'),
        );

        const membershipTransaction = await queryRunner.manager.save(
          MemberShipTransactionModel,
          membershipTransactionModel,
        );

        const { error, data } = await this.processPayment(
          paymentParams,
          franchiseModel.stripe_secret_key,
          {
            property_id: propertyMasterModel.id,
            owner_id: propertyMasterModel.owner.id,
            membership_tier_id: membershipTier.id,
            membership_transaction_id: membershipTransaction.id,
            payment_method_id: userPaymentMethod.id,
            is_first_transaction: true,
            next_due_date_success: moment()
              .add(30, 'days')
              .format('YYYY-MM-DD'),
          },
        );

        if (error) throw new BadRequestException(data);
      }

      await queryRunner.commitTransaction();
      return { pay_for_membership: payForMembership };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async membershipPaymentRetry(
    payload: MembershipPaymentRetryDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const membershipTransaction =
        await this.membershipTransactionRepository.findOne({
          where: {
            id: payload.membership_transaction_id,
          },
        });

      if (!membershipTransaction)
        throw new BadRequestException(PaymentMessages.MEMBERSHIP_NOT_FOUND);

      const propertyMasterModel: PropertyMasterModel =
        await this.propertyMasterRepository.findOne({
          where: {
            id: membershipTransaction.property_master_id,
          },
          relations: ['owner', 'propertyPaymentMethod'],
        });

      if (
        user.user_type === UserType.Owner &&
        Number(propertyMasterModel.owner_id) !== Number(user.id)
      )
        throw new BadRequestException(PaymentMessages.MEMBERSHIP_NOT_FOUND);

      let userPaymentMethod: UserPaymentMethodModel =
        propertyMasterModel.propertyPaymentMethod;

      if (!userPaymentMethod) {
        userPaymentMethod = await this.userPaymentMethodRepository.findOne({
          where: {
            owner_id: propertyMasterModel.owner.id,
            status: PaymentMethodStatus.Succeeded,
            is_default: true,
            is_deleted: false,
          },
        });
      }

      if (!userPaymentMethod)
        throw new BadRequestException(PaymentMessages.PAYMENT_METHOD_NOT_FOUND);

      const paymentParams: IProcessPaymentParams = {
        customerId: propertyMasterModel.owner.payment_gateway_customer_id,
        paymentMethodId: userPaymentMethod.stripe_payment_method_id,
        amount: membershipTransaction.transaction_amount,
      };

      const franchiseModel: FranchiseModel =
        await this.franchiseRepository.getFranchiseDetails(
          Number(propertyMasterModel.franchise_id),
        );

      const membershipTier = await this.membershipTierRepository.findOne({
        where: {
          property_master_id: membershipTransaction.property_master_id,
        },
      });

      await queryRunner.manager.update(
        MemberShipTransactionModel,
        {
          id: payload.membership_transaction_id,
        },
        {
          status: InvoicePaymentStatus.Processing,
        },
      );

      const { error, data } = await this.processPayment(
        paymentParams,
        franchiseModel.stripe_secret_key,
        {
          property_id: propertyMasterModel.id,
          owner_id: propertyMasterModel.owner.id,
          membership_tier_id: membershipTier.id,
          membership_transaction_id: payload?.membership_transaction_id,
          payment_method_id: userPaymentMethod.id,
          next_due_date_success: moment().add(30, 'days').format('YYYY-MM-DD'),
        },
      );

      if (error) throw new BadRequestException(data);

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deletePaymentMethod(
    paymentMethodId: number,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const ownerPaymentMethodCount =
        await this.userPaymentMethodRepository.count({
          owner_id: user.id,
          status: PaymentMethodStatus.Succeeded,
          is_deleted: false,
        });

      if (ownerPaymentMethodCount === 1)
        throw new BadRequestException(PaymentMessages.PAYMENT_METHOD_DEL_ALL);

      const paymentMethod: UserPaymentMethodModel =
        await this.userPaymentMethodRepository.findOne({
          where: {
            id: paymentMethodId,
            owner_id: user.id,
            status: PaymentMethodStatus.Succeeded,
            is_deleted: false,
          },
        });

      if (!paymentMethod)
        throw new BadRequestException(PaymentMessages.PAYMENT_METHOD_NOT_FOUND);

      if (paymentMethod.is_default)
        throw new BadRequestException(
          PaymentMessages.DEFAULT_PAYMENT_METHOD_DELETE,
        );

      const franchiseModel: FranchiseModel =
        await this.franchiseRepository.getFranchiseDetails(
          Number(user.franchise_id),
        );

      const paymentMethodDetach = await this.detachCustomerPaymentMethod(
        paymentMethod.stripe_payment_method_id,
        franchiseModel.stripe_secret_key,
      );

      if (!paymentMethodDetach)
        throw new BadRequestException(
          PaymentMessages.DETACH_PAYMENT_METHOD_ERROR,
        );

      await queryRunner.manager.update(
        PropertyMasterModel,
        {
          owner_payment_method_id: paymentMethodId,
        },
        {
          owner_payment_method_id: null,
        },
      );
      await queryRunner.manager.update(
        UserPaymentMethodModel,
        {
          id: paymentMethodId,
        },
        {
          is_deleted: true,
        },
      );
      await await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async setPaymentMethodAsDefault(paymentMethodId: number, user: JwtPayload) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const paymentMethod: UserPaymentMethodModel =
        await this.userPaymentMethodRepository.findOne({
          where: {
            id: paymentMethodId,
            owner_id: user.id,
            status: PaymentMethodStatus.Succeeded,
            is_deleted: false,
          },
        });

      if (!paymentMethod)
        throw new BadRequestException(PaymentMessages.PAYMENT_METHOD_NOT_FOUND);

      await queryRunner.manager.update(
        UserPaymentMethodModel,
        {},
        {
          is_default: false,
        },
      );
      await queryRunner.manager.update(
        UserPaymentMethodModel,
        { id: paymentMethodId },
        {
          is_default: true,
        },
      );
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
