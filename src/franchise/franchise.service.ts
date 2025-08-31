import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateFranchiseDto,
  SearchFranchiseDto,
  CreateTownDto,
  CreateStandardAdminDto,
  PermissionsDto,
  UpdateStandardAdminDto,
  StandardAdminSearchQueryDto,
  UpdateFranchiseDto,
  UpdateFranchiseSiteDto,
  UpdateTownDto,
} from './franchise.dto';
import { UserModel } from '@/app/models/user/user.model';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { hashPassword } from '@/app/utils/bcrypt.helper';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { AuthMessages } from '@/auth/auth.message';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { FranchiseServiceLocationRepository } from '@/app/repositories/franchise/franchiseServiceLocation.repository';
import { FranchiseMessages } from './franchise.message';
import { FranchiseServiceLocationModel } from '@/app/models/franchise/franchiseServiceLocation.model';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { GeneralHelper } from '@/app/utils/general.helper';
import { DataSource } from 'typeorm';
import { ServiceTypeService } from '@/serviceType/serviceType.service';
import { UserMenuItemModel } from '@/app/models/user/userMenuItem.model';
import { QueryRunner } from 'typeorm';
import { EncryptionHelper } from '@/app/utils/encryption.helper';
import { StripeService } from '@/payment/stripe.service';
import { BunyanLogger } from '@/app/commons/logger.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { URLS } from '@/app/contracts/enums/urls.enum';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { DocumentModel } from '@/app/models/document/document.model';
import { DocumentVisibility } from '@/app/contracts/enums/document.enum';
import { DocumentRepository } from '@/app/repositories/document/document.repository';
import { S3Service } from '@/app/commons/s3.service';
import { UserTokenModel } from '@/app/models/user/userToken.model';
import { TokenType } from '@/app/contracts/enums/TokenType.enum';
import { UserTokenRepository } from '@/app/repositories/user/userToken.repository';

@Injectable()
export class FranchiseService extends StripeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly franchiseRepository: FranchiseRepository,
    private readonly franchiseServiceLocationRepository: FranchiseServiceLocationRepository,
    private readonly userTokenRepository: UserTokenRepository,
    private readonly generalHelper: GeneralHelper,
    private readonly serviceTypeService: ServiceTypeService,
    private readonly encryptionHelper: EncryptionHelper,
    protected readonly configService: ConfigService,
    protected readonly logger: BunyanLogger,
    private readonly notificationsService: NotificationsService,
    private readonly documentRepository: DocumentRepository,
    private readonly s3Service: S3Service,
  ) {
    super(configService, logger);
  }

  async getFranchiseAdminDetails(id: string): Promise<UserModel> {
    const franchiseAdmin = await this.userRepository.findOne({
      where: {
        id: Number(id),
        user_type: UserType.FranchiseAdmin,
        is_deleted: false,
      },
      // relations: ['franchise'],
    });

    if (!franchiseAdmin)
      throw new BadRequestException(
        FranchiseMessages.FRANCHISE_ADMIN_NOT_FOUND,
      );

    return franchiseAdmin;
  }

  async getAllFranchise(
    params: SearchFranchiseDto,
  ): Promise<IPaginatedModelResponse<FranchiseModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(params);
    const { name } = params;

    return await this.franchiseRepository.getAllFranchise(
      paginationParams,
      name,
    );
  }

  async getFranchiseDetails(
    franchiseId: string,
    user?: JwtPayload,
  ): Promise<string> {
    const franchise = await this.franchiseRepository.getFranchiseDetails(
      Number(franchiseId),
      user,
    );
    if (!franchise)
      throw new BadRequestException(FranchiseMessages.FRANCHISE_NOT_FOUND);

    const ecnryptedFranchiseData: string = this.encryptionHelper.encrypt(
      JSON.stringify(franchise),
    );
    return ecnryptedFranchiseData;
  }

  async getTowns(
    user: JwtPayload | null,
    franchise_id: string | null,
  ): Promise<FranchiseServiceLocationModel[]> {
    const franchiseId = user?.franchise_id || franchise_id;

    if (!franchiseId) {
      throw new BadRequestException(FranchiseMessages.FRANCHISE_ID_NOT_FOUND);
    }

    return this.franchiseServiceLocationRepository.find({
      franchise_id: +franchiseId,
    });
  }

  async addTown(
    payload: CreateTownDto,
  ): Promise<FranchiseServiceLocationModel> {
    const franchise = await this.franchiseRepository.findOne({
      where: { id: payload.franchise_id },
    });

    if (!franchise)
      throw new BadRequestException(FranchiseMessages.FRANCHISE_NOT_FOUND);

    const franchiseServiceLocationModel = new FranchiseServiceLocationModel();

    franchiseServiceLocationModel.franchise_id = payload.franchise_id;
    franchiseServiceLocationModel.franchise_site_service_location_id =
      payload.franchise_site_service_location_id;
    franchiseServiceLocationModel.service_area = payload.service_area;

    return await this.franchiseServiceLocationRepository.save(
      franchiseServiceLocationModel,
    );
  }

  async updateTown(
    payload: UpdateTownDto,
  ): Promise<FranchiseServiceLocationModel> {
    const franchise = await this.franchiseRepository.findOne({
      where: { id: payload.franchise_id },
    });

    if (!franchise)
      throw new BadRequestException(FranchiseMessages.FRANCHISE_NOT_FOUND);

    const franchiseServiceLoc: FranchiseServiceLocationModel =
      await this.franchiseServiceLocationRepository.findOne({
        where: {
          franchise_id: payload.franchise_id,
          id: payload.franchise_service_location_id,
        },
      });

    if (!franchiseServiceLoc)
      throw new BadRequestException(FranchiseMessages.TOWN_NOT_FOUND);

    franchiseServiceLoc.service_area = payload?.service_area;

    return await this.franchiseServiceLocationRepository.save(
      franchiseServiceLoc,
    );
  }

  async getDownloadUrl(mediaUrl: string) {
    try {
      return await this.s3Service.getDownloadUrl(mediaUrl);
    } catch (err) {
      this.logger.error(`Download URL Issue == > ${JSON.stringify(err)}`);
      return null;
    }
  }

  async updateFranchise(
    payload: UpdateFranchiseDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      let sendResetPassEmailToAdmin = false;
      const franchiseUser: UserModel = await this.userRepository.findOne({
        where: {
          franchise_id: payload.franchise_id,
          user_type: UserType.FranchiseAdmin,
          is_deleted: false,
        },
      });

      const franchiseModel: FranchiseModel =
        await this.franchiseRepository.getFranchiseDetails(
          payload.franchise_id,
        );

      if (!franchiseModel)
        throw new BadRequestException(FranchiseMessages.FRANCHISE_NOT_FOUND);

      if (!franchiseUser) {
        if (!payload.stripe_secret_key || !payload.stripe_public_key)
          throw new BadRequestException(FranchiseMessages.STRIPE_KEYS_ERROR);

        const stripeKeysValid = this.generalHelper.checkStripeKeyMode(
          payload.stripe_public_key,
          payload.stripe_secret_key,
        );

        if (!stripeKeysValid)
          throw new BadRequestException(FranchiseMessages.STRIPE_KEYS_ERROR);

        const webhooksRegistered = await this.registerWebhooks(
          payload.stripe_secret_key,
        );

        if (!webhooksRegistered)
          throw new BadRequestException(FranchiseMessages.INVALID_SECRET);

        const emailExists: UserModel = await this.userRepository.findOne({
          where: {
            email: payload.email,
          },
        });

        if (emailExists)
          throw new BadRequestException(FranchiseMessages.EMAIL_EXISTS);

        const randomPassword = this.generalHelper.generateRandomString();
        sendResetPassEmailToAdmin = true;
        const userModel = new UserModel();
        userModel.first_name = payload.first_name;
        userModel.last_name = payload.last_name;
        userModel.email = payload.email;
        userModel.contact = payload.contact;
        userModel.user_type = UserType.FranchiseAdmin;
        userModel.franchise_id = payload.franchise_id;
        userModel.password = await hashPassword(randomPassword);
        await queryRunner.manager.save(UserModel, userModel);
      } else {
        await queryRunner.manager.update(
          UserModel,

          {
            id: franchiseUser.id,
          },
          {
            first_name: payload.first_name,
            last_name: payload.last_name,
            email: payload.email,
            contact: payload.contact,
          },
        );
        if (payload?.email !== franchiseUser.email)
          sendResetPassEmailToAdmin = true;
      }

      await queryRunner.manager.update(
        FranchiseModel,
        {
          id: payload.franchise_id,
        },
        {
          stripe_public_key:
            franchiseModel.stripe_public_key ?? payload?.stripe_public_key,
          stripe_secret_key:
            franchiseModel.stripe_secret_key ?? payload?.stripe_secret_key,
          twilio_sid: franchiseModel.twilio_sid ?? payload?.twilio_sid,
          twilio_token: franchiseModel.twilio_token ?? payload?.twilio_token,
          twilio_from_number:
            franchiseModel.twilio_from_number ?? payload?.twilio_from_number,
          twilio_your_cell_number:
            franchiseModel.twilio_your_cell_number ??
            payload?.twilio_your_cell_number,
          google_review_number:
            payload?.google_review_number ??
            franchiseModel.google_review_number,
          facebook_review_link:
            payload?.facebook_review_link ??
            franchiseModel?.facebook_review_link,
          royalty_percentage: payload?.credit_card_processing_fee
            ? Number(payload?.credit_card_processing_fee)
            : franchiseModel.credit_card_processing_fee,
          credit_card_processing_fee: payload?.credit_card_processing_fee
            ? Number(payload?.credit_card_processing_fee)
            : franchiseModel.credit_card_processing_fee,
          stripe_verified: true,
        },
      );

      /**
       * @info
       * This is to handle the case when the franchise admin is updating the file name
       * and the file name is already present in the database. (This is CR From Client)
       */

      if (user?.user_type === UserType.SuperAdmin) {
        if (payload.file_name) {
          let documentModel = await this.documentRepository.findOne({
            where: {
              franchise_id: payload.franchise_id,
              user_id: Number(user.id),
              visibility: DocumentVisibility.ShowToAdmin,
              is_deleted: false,
            },
          });

          if (!documentModel) documentModel = new DocumentModel();

          documentModel.name = payload.file_name;
          documentModel.visibility = DocumentVisibility.ShowToAdmin;
          documentModel.document_url = payload.document_url;
          documentModel.user_id = user.id;
          documentModel.franchise_id = payload.franchise_id;

          await queryRunner.manager.save(DocumentModel, documentModel);
        } else {
          /**
           * @info
           * As Document is an optional field so if super Admin delete the field then we need to delete the document from the database
           */
          await queryRunner.manager.delete(DocumentModel, {
            user_id: user.id,
            franchise_id: payload.franchise_id,
            visibility: DocumentVisibility.ShowToAdmin,
          });
        }
      }

      await queryRunner.commitTransaction();

      if (sendResetPassEmailToAdmin) {
        const resetPasswordLink = await this.makeResetLinkForStandardAdmin({
          email: payload.email,
        });
        this.notificationsService.sendNotification(
          NotificationAction.FRANCHISE_ADMIN_CREATED,
          {
            resetPasswordLink,
          },
          [payload.email],
        );
      }
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateFranchiseSite(payload: UpdateFranchiseSiteDto): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const franchiseModel: FranchiseModel =
        await this.franchiseRepository.findOne({
          where: { id: payload.franchise_id },
        });

      if (!franchiseModel)
        throw new BadRequestException(FranchiseMessages.FRANCHISE_NOT_FOUND);

      franchiseModel.name = payload?.name ?? franchiseModel.name;
      franchiseModel.location = payload?.location ?? franchiseModel.location;
      franchiseModel.site_url = payload?.site_url ?? franchiseModel.site_url;

      await queryRunner.manager.save(FranchiseModel, franchiseModel);
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createFranchise(payload: CreateFranchiseDto): Promise<{
    franchise: Partial<FranchiseModel>;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const { franchise_site_id } = payload;

      let franchiseModel: FranchiseModel =
        await this.franchiseRepository.findOne({
          where: { franchise_site_id },
        });

      if (franchiseModel)
        throw new BadRequestException(
          FranchiseMessages.FRANCHISE_ALREADY_EXITSTS,
        );

      franchiseModel = new FranchiseModel();

      franchiseModel.name = payload.name;
      franchiseModel.location = payload.location;
      franchiseModel.site_url = payload.site_url;
      franchiseModel.franchise_site_id = payload.franchise_site_id;
      franchiseModel.is_approved = true;

      const franchiseData = await queryRunner.manager.save(
        FranchiseModel,
        franchiseModel,
      );

      await this.serviceTypeService.addNewFranchiseServices(
        franchiseData,
        queryRunner,
      );
      await queryRunner.commitTransaction();
      return {
        franchise: {
          id: franchiseData?.id,
          name: franchiseData?.name,
          location: franchiseData?.location,
          site_url: franchiseData?.site_url,
          franchise_site_id: franchiseData?.franchise_site_id,
          is_approved: true,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async validateStandardAdmin(
    userId: number,
    franchise_id: number,
  ): Promise<UserModel> {
    const standardAdmin = await this.userRepository.findOne({
      where: {
        id: userId,
        user_type: UserType.StandardAdmin,
        franchise_id,
        is_deleted: false,
      },
      relations: ['userMenuItem'],
    });

    if (!standardAdmin)
      throw new BadRequestException(AuthMessages.STANDARD_ADMIN_NOT_FOUND);

    return standardAdmin;
  }

  async addStandardAdminPermissions(
    payload: PermissionsDto,
    userId: number,
    queryRunner: QueryRunner,
  ): Promise<UserMenuItemModel[]> {
    const permissionMap = {
      dashboard: payload.dashboard,
      properties: payload.properties,
      owners: payload.owners,
      vendor_management: payload.vendor_management,
      service_requests: payload.service_requests,
      linen: payload.linen,
      my_services: payload.my_services,
      estimate_request: payload.estimate_request,
      payment_settings: payload.payment_settings,
      invoices: payload.invoices,
      documents: payload.documents,
      reporting: payload.reporting,
    };

    const userMenuItems: UserMenuItemModel[] = Object.entries(
      permissionMap,
    ).map(([menuItem, permissionValue]) => {
      const userMenuItemModel = new UserMenuItemModel();
      userMenuItemModel.menu_item = menuItem;
      userMenuItemModel.menu_item_permission = permissionValue;
      userMenuItemModel.user_id = userId;
      return userMenuItemModel;
    });

    return await queryRunner.manager.save(UserMenuItemModel, userMenuItems);
  }

  async deleteStandardAdminPermissions(
    userId: number,
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.manager.delete(UserMenuItemModel, { user_id: userId });
  }

  async makeResetLinkForStandardAdmin(payload: any): Promise<any> {
    const userModel: UserModel = await this.userRepository.findOne({
      where: { email: payload.email },
      relations: ['franchiseUser'],
    });

    const userTokenModel = new UserTokenModel();

    const encPayload = this.encryptionHelper.encrypt(
      JSON.stringify({ email: userModel.email, id: userModel.id }),
    );

    userTokenModel.user_id = userModel.id;
    userTokenModel.token = encPayload;
    userTokenModel.token_type = TokenType.PasswordReset;

    await this.userTokenRepository.save(userTokenModel);

    let redirectUrl = `${userModel.franchiseUser.site_url}/reset-password?auth=${encPayload}`;

    if (
      [UserType.StandardAdmin, UserType.FranchiseAdmin].includes(
        userModel.user_type,
      )
    ) {
      redirectUrl = `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/reset-password?auth=${encPayload}`;
    }
    return redirectUrl;
  }

  async createStandardAdmin(
    payload: CreateStandardAdminDto,
    franchiseAdmin: JwtPayload,
  ): Promise<UserModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const user: UserModel = await this.userRepository.findOne({
        where: {
          email: payload.email.toLowerCase(),
        },
      });

      if (user) throw new BadRequestException(AuthMessages.USER_EXISTS);

      const encryptPassword: string = await hashPassword(payload?.password);

      const standardAdminMap = await this.userRepository.create({
        ...payload,
        franchise_id: Number(franchiseAdmin.franchise_id),
        password: encryptPassword,
        user_type: UserType.StandardAdmin,
        is_active: true,
        is_approved: true,
      });

      const standardAdminMapSaved = await queryRunner.manager.save(
        UserModel,
        standardAdminMap,
      );

      delete standardAdminMapSaved['password'];

      await this.deleteStandardAdminPermissions(
        standardAdminMapSaved?.id,
        queryRunner,
      );

      await this.addStandardAdminPermissions(
        payload.permissions,
        standardAdminMapSaved?.id,
        queryRunner,
      );

      // Email the standard admin

      const franchise = await this.franchiseRepository.findOne({
        where: { id: Number(franchiseAdmin.franchise_id) },
      });
      await queryRunner.commitTransaction();

      const redirectUrl = await this.makeResetLinkForStandardAdmin(payload);
      await this.notificationsService.sendNotification(
        NotificationAction.STANDARD_ADMIN_CREATED,
        {
          link: redirectUrl,
          franchise_name: franchise?.name || '',
          standardAdmin_email: payload.email,
        },
        [payload.email],
      );
      return standardAdminMapSaved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStandardAdmin(
    payload: UpdateStandardAdminDto,
    franchiseAdmin: JwtPayload,
  ): Promise<UserModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const user: UserModel = await this.userRepository.findOne({
        where: {
          id: payload.standard_admin_id,
          franchise_id: Number(franchiseAdmin.franchise_id),
          user_type: UserType.StandardAdmin,
          is_deleted: false,
        },
      });
      if (!user)
        throw new BadRequestException(AuthMessages.STANDARD_ADMIN_NOT_FOUND);

      user.first_name = payload.first_name;
      user.last_name = payload.last_name;
      user.email = payload.email;

      const standardAdminMapSaved = await queryRunner.manager.save(
        UserModel,
        user,
      );
      await this.deleteStandardAdminPermissions(
        standardAdminMapSaved?.id,
        queryRunner,
      );

      await this.addStandardAdminPermissions(
        payload.permissions,
        standardAdminMapSaved?.id,
        queryRunner,
      );

      await this.notificationsService.sendNotification(
        NotificationAction.STANDARD_ADMIN_UPDATED,
        {
          link: `${this.configService.get(`${URLS.PORTAL_FRONTEND_URL}`)}/login`,
          franchise_admin_name: franchiseAdmin?.first_name
            ? `${franchiseAdmin?.first_name} ${franchiseAdmin?.last_name}`
            : franchiseAdmin?.email,
        },
        [payload.email],
      );

      await queryRunner.commitTransaction();
      return standardAdminMapSaved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStandardAdminDetails(
    standardAdminId: number,
    franchiseAdmin: JwtPayload,
  ): Promise<UserModel> {
    const standardAdmin = await this.validateStandardAdmin(
      standardAdminId,
      Number(franchiseAdmin.franchise_id),
    );

    return standardAdmin;
  }

  async deleteStandardAdmin(
    standardAdminId: number,
    franchiseAdmin: JwtPayload,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      await this.validateStandardAdmin(
        standardAdminId,
        Number(franchiseAdmin?.franchise_id),
      );
      await this.deleteStandardAdminPermissions(standardAdminId, queryRunner);
      await queryRunner.manager.update(
        UserModel,
        { id: standardAdminId },
        { is_deleted: true },
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStandardAdmins(
    params: StandardAdminSearchQueryDto,
    franchiseAdmin: JwtPayload,
  ): Promise<IPaginatedModelResponse<UserModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(params);
    const { name } = params;

    return await this.userRepository.getStandardAdmins(
      paginationParams,
      Number(franchiseAdmin?.franchise_id),
      name !== undefined ? name : null,
    );
  }
}
