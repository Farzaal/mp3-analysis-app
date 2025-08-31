import { UserRepository } from '@/app/repositories/user/user.repository';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ArchiveOwnerDto,
  CreateOwnerDto,
  OwnerSearchQueryDto,
  UpdateOwnerDto,
} from './owner.dto';
import { UserModel } from '@/app/models/user/user.model';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { hashPassword } from '@/app/utils/bcrypt.helper';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { OwnerProfileStatus } from '@/app/contracts/enums/ownerProfile.enum';
import { OwnerMessages } from './owner.message';
import { PaymentService } from '@/payment/payment.service';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from '@/app/utils/general.helper';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { UserPaymentMethodModel } from '@/app/models/paymentMethod/userPaymentMethod.model';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { ConfigService } from '@nestjs/config';
import { URLS } from '@/app/contracts/enums/urls.enum';
import { GenericReportDownloadEvent } from '@/reportDownload/reportDownload.event';
import { DownloadReportEventName } from '@/app/contracts/enums/reportDownload.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BunyanLogger } from '@/app/commons/logger.service';
import { Setting } from '@/app/contracts/enums/setting.enum';

@Injectable()
export class OwnerService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly userRepository: UserRepository,
    private readonly paymentService: PaymentService,
    private readonly franchiseRepository: FranchiseRepository,
    private readonly generalHelper: GeneralHelper,
    private readonly userPaymentMethodRepository: UserPaymentMethodRepository,
    private readonly propertyMasterRepository: PropertyMasterRepository,
    private readonly notificationService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly logger: BunyanLogger,
  ) {}

  async createOwnerProfile(ownerDetails: CreateOwnerDto): Promise<UserModel> {
    const franchiseModel: FranchiseModel =
      await this.franchiseRepository.findOne({
        where: { id: ownerDetails.franchise_id },
      });

    if (!franchiseModel)
      throw new BadRequestException(OwnerMessages.FRANCHISE_NOT_EXISTS);

    if (!ownerDetails?.terms_and_conditions)
      throw new BadRequestException(OwnerMessages.TERMS_AND_CONDITIONS);

    let userModel: UserModel = await this.userRepository.findOne({
      where: { email: ownerDetails.email },
    });

    if (userModel)
      throw new BadRequestException(OwnerMessages.OWNER_EMAIL_EXITSTS);

    userModel = new UserModel();
    const customer = await this.paymentService.createStripeCustomer(
      ownerDetails.first_name,
      ownerDetails.email,
      ownerDetails.franchise_id,
    );
    if (!customer)
      throw new BadRequestException(OwnerMessages.CUSTOMER_CREATION_ERROR);

    userModel.payment_gateway_customer_id = customer.id;

    userModel.franchise_id = franchiseModel.id;

    userModel.user_type = UserType.Owner;

    ownerDetails?.terms_and_conditions &&
      (userModel.terms_and_conditions = ownerDetails.terms_and_conditions);

    const owner = await this.createOrUpdateOwnerProfile(
      ownerDetails,
      userModel,
      null,
      OwnerProfileStatus.ProfileCompleted,
    );

    await this.notificationService.sendNotification(
      NotificationAction.OWNER_CREATED,
      {
        email: userModel.email,
        link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
      },
      [userModel.email],
      [userModel.cell_phone],
    );

    return owner;
  }

  async updateOwnerProfile(
    ownerDetails: UpdateOwnerDto,
    user: JwtPayload,
  ): Promise<UserModel> {
    const userModel: UserModel = await this.userRepository.findOne({
      where: {
        id: ownerDetails.owner_id,
        franchise_id: Number(user.franchise_id),
      },
    });
    if (!userModel)
      throw new BadRequestException(OwnerMessages.OWNER_EMAIL_NOT_EXITSTS);

    const owner = await this.createOrUpdateOwnerProfile(
      ownerDetails,
      userModel,
      user,
      userModel.profile_completion_step === OwnerProfileStatus.ProfileCompleted
        ? OwnerProfileStatus.PropertyAdded
        : null,
    );

    return owner;
  }

  private async createOrUpdateOwnerProfile(
    ownerDetails: CreateOwnerDto | UpdateOwnerDto,
    userModel: UserModel,
    authUser: JwtPayload | null,
    profileCompletionStep: OwnerProfileStatus | null,
  ): Promise<UserModel> {
    !authUser && (userModel.email = ownerDetails.email);
    userModel.first_name = ownerDetails.first_name;
    userModel.last_name = ownerDetails.last_name;
    userModel.contact = ownerDetails.phone;
    profileCompletionStep &&
      (userModel.profile_completion_step = profileCompletionStep);
    ownerDetails?.password &&
      (userModel.password = await hashPassword(ownerDetails.password));

    if (authUser) {
      const updOwnerDetails = ownerDetails as UpdateOwnerDto;
      userModel.mailing_address =
        updOwnerDetails?.mailing_address ?? userModel.mailing_address;
      userModel.city = updOwnerDetails?.city ?? userModel.city;
      userModel.state = updOwnerDetails?.state ?? userModel.state;
      userModel.zip = updOwnerDetails.zip ?? userModel.zip;
    }

    userModel.is_approved = true;

    const saveUser = await this.userRepository.save(userModel);

    delete saveUser['password'];

    return saveUser;
  }

  async updateOwnerProfileCompletionStep(
    user: JwtPayload,
    completionStep: OwnerProfileStatus,
  ): Promise<boolean> {
    const userModel: UserModel = await this.userRepository.findOne({
      where: { id: user.id },
    });
    if (
      !userModel ||
      userModel.profile_completion_step ===
        OwnerProfileStatus.OnboardingCompleted ||
      (userModel.profile_completion_step === OwnerProfileStatus.PropertyAdded &&
        completionStep !== OwnerProfileStatus.PaymentMethodAdded)
    )
      return false;

    await this.userRepository.update(
      { id: user.id },
      { profile_completion_step: completionStep },
    );

    return true;
  }

  async getOwners(
    params: OwnerSearchQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<UserModel>> {
    if (params.download) {
      this.logger.log(
        '[EVENT] Emitting Owner Listing report preparation event',
      );

      const { data, count } = await this.userRepository.getOwners(
        null,
        params,
        Number(user.franchise_id),
      );

      if (count >= Setting.MAX_DIRECT_DOWNLOAD_ROWS) {
        // Emit event for async report
        const rawStartTime = this.generalHelper.getDownloadableCsvCutoffTime();
        const startTime =
          typeof rawStartTime === 'number' && !isNaN(rawStartTime)
            ? rawStartTime
            : 45;

        this.eventEmitter.emit(
          DownloadReportEventName.OWNER_LISTING,
          new GenericReportDownloadEvent(
            () =>
              this.userRepository.getOwners(
                null,
                params,
                Number(user.franchise_id),
                startTime,
              ),
            user,
          ),
        );
      } else {
        // Return data for download
        return { data, count };
      }
    } else {
      const paginationParams: IPaginationDBParams =
        this.generalHelper.getPaginationOptionsV2(params);
      return await this.userRepository.getOwners(
        paginationParams,
        params,
        Number(user.franchise_id),
      );
    }
  }

  async getOwnerById(ownerId: number, user: JwtPayload): Promise<UserModel> {
    const userModel: UserModel = await this.userRepository.getOwnerById(
      ownerId,
      user,
    );

    if (!userModel)
      throw new BadRequestException(OwnerMessages.OWNER_EMAIL_NOT_EXITSTS);

    return userModel;
  }

  async ownerOnboardingCompleted(user: JwtPayload): Promise<UserModel> {
    const userModel: UserModel = await this.userRepository.findOne({
      where: {
        id: user.id,
        user_type: UserType.Owner,
        franchise_id: Number(user.franchise_id),
      },
    });

    if (!userModel)
      throw new BadRequestException(OwnerMessages.OWNER_EMAIL_NOT_EXITSTS);

    userModel.profile_completion_step = OwnerProfileStatus.OnboardingCompleted;
    return await this.userRepository.save(userModel);
  }

  async getOwnerPaymentMethods(
    user: JwtPayload,
  ): Promise<UserPaymentMethodModel[]> {
    return await this.userPaymentMethodRepository.getOwnerPaymentMethods(user);
  }

  async getPropertiesPaymentMethods(
    user: JwtPayload,
  ): Promise<PropertyMasterModel[]> {
    const properties =
      await this.propertyMasterRepository.getPropertiesPaymentMethods(
        Number(user.id),
        Number(user.franchise_id),
      );

    return properties;
  }

  async archiveOwner(
    payload: ArchiveOwnerDto,
    user: JwtPayload,
  ): Promise<UserModel> {
    const userModel: UserModel = await this.userRepository.findOne({
      where: {
        id: payload.owner_id,
        franchise_id: Number(user.franchise_id),
        user_type: UserType.Owner,
        is_deleted: false,
      },
    });

    if (!userModel)
      throw new BadRequestException(OwnerMessages.OWNER_EMAIL_EXITSTS);

    if (payload.is_archived) {
      this.notificationService.sendNotification(
        NotificationAction.OWNER_ARCHIVED,
        {
          name: ` ${userModel.first_name} ${userModel.last_name}`,
        },
        [userModel.email],
        [userModel.cell_phone],
      );
    } else {
      this.notificationService.sendNotification(
        NotificationAction.OWNER_UNARCHIVE,
        {
          name: ` ${userModel.first_name} ${userModel.last_name}`,
          link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
        },
        [userModel.email],
        [userModel.cell_phone],
      );
    }

    await this.userRepository.update(
      { id: payload.owner_id },
      { archived: payload.is_archived },
    );

    return userModel;
  }
}
