import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CreateVendorDto,
  ServiceTypeRates,
  UpdateVendorDto,
  VendorApprovalDto,
  VendorSearchQueryDto,
} from './vendor.dto';
import { UserModel } from '@/app/models/user/user.model';
import { vendorMessages } from './vendor.messages';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { hashPassword } from '@/app/utils/bcrypt.helper';
import { VendorServiceTypeModel } from '@/app/models/serviceType/vendorServiceType.model';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { DataSource, In, QueryRunner } from 'typeorm';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from '@/app/utils/general.helper';
import { FranchiseServiceLocationRepository } from '../app/repositories/franchise/franchiseServiceLocation.repository';
import { FranchiseServiceLocationModel } from '@/app/models/franchise/franchiseServiceLocation.model';
import { VendorServiceLocationModel } from '@/app/models/franchise/vendorServiceLocation.model';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { FranchiseServiceTypeModel } from '@/app/models/serviceType/franchiseServiceType.model';
import { NotificationsService } from '@/notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import * as moment from 'moment';
import { Setting } from '@/app/contracts/enums/setting.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DownloadReportEventName } from '@/app/contracts/enums/reportDownload.enum';
import { GenericReportDownloadEvent } from '@/reportDownload/reportDownload.event';
import { BunyanLogger } from '@/app/commons/logger.service';
import { OwnerProfileStatus } from '@/app/contracts/enums/ownerProfile.enum';
import { UserTokenRepository } from '@/app/repositories/user/userToken.repository';
import { UserTokenModel } from '@/app/models/user/userToken.model';
import { TokenType } from '@/app/contracts/enums/TokenType.enum';
import { EncryptionHelper } from '@/app/utils/encryption.helper';

@Injectable()
export class VendorService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly franchiseRepository: FranchiseRepository,
    private readonly franchiseServiceTypeRepository: FranchiseServiceTypeRepository,
    private readonly franchiseServiceLocationRepository: FranchiseServiceLocationRepository,
    private readonly logger: BunyanLogger,
    private readonly generalHelper: GeneralHelper,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly userTokenRepository: UserTokenRepository,
    private readonly encryptionHelper: EncryptionHelper,
  ) {}

  async createVendorServiceType(
    validServiceTypes: FranchiseServiceTypeModel[],
    vendor: UserModel,
    franchiseId: number,
    queryRunner: QueryRunner,
    serviceTypeRatesMap?: Map<number, ServiceTypeRates>,
  ) {
    const vendorServiceTypesPayload: VendorServiceTypeModel[] =
      validServiceTypes.map((serviceType) => {
        const rateInfo = serviceTypeRatesMap?.get(
          Number(serviceType.service_type_id),
        );
        return queryRunner.manager.create(VendorServiceTypeModel, {
          vendor_id: vendor.id,
          service_type_id: serviceType.service_type_id,
          franchise_id: franchiseId,
          is_approved: true,
          hourly_rate: rateInfo?.hourly_rate ? rateInfo.hourly_rate : 0,
          service_call_fee: rateInfo?.service_call_fee
            ? rateInfo.service_call_fee
            : 0,
        });
      });

    return await queryRunner.manager.save(
      VendorServiceTypeModel,
      vendorServiceTypesPayload,
    );
  }

  async createVendorServiceLocation(
    validTowns: FranchiseServiceLocationModel[],
    vendor: UserModel,
    franchiseId: number,
    queryRunner: QueryRunner,
  ) {
    const vendorServiceLocationPayload: VendorServiceLocationModel[] =
      validTowns.map((town) => {
        return queryRunner.manager.create(VendorServiceLocationModel, {
          vendor_id: vendor.id,
          franchise_id: franchiseId,
          service_location_id: town.id,
        });
      });

    return await queryRunner.manager.save(
      VendorServiceLocationModel,
      vendorServiceLocationPayload,
    );
  }

  async createVendor(
    payload: CreateVendorDto,
    sendResetPasswordEmail: boolean = false,
  ): Promise<UserModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const vendor: UserModel = await this.userRepository.findOne({
        where: { email: payload.email },
      });

      if (vendor) throw new BadRequestException(vendorMessages.VENDOR_EXISTS);

      const franchiseModel: FranchiseModel =
        await this.franchiseRepository.findOne({
          where: { id: payload.franchise_id },
        });

      if (!franchiseModel)
        throw new BadRequestException(vendorMessages.FRANCHISE_NOT_EXIST);

      const { service_types, town, ...rest } = payload;
      let { password } = payload;

      const validServiceTypes: FranchiseServiceTypeModel[] =
        await this.franchiseServiceTypeRepository.find(
          {
            franchise_id: franchiseModel.id,
            service_type_id: In(service_types),
            is_active: true,
            is_deleted: false,
          },
          null,
          ['serviceType'],
        );

      if (validServiceTypes.length !== service_types.length) {
        throw new BadRequestException(vendorMessages.INVALID_SERVICE_TYPE_IDS);
      }

      const standardHourlyServiceTypeRateMap = new Map<
        number,
        FranchiseServiceTypeModel
      >();

      validServiceTypes.forEach((franchiseServiceType) => {
        if (franchiseServiceType.serviceType?.standard_hourly) {
          standardHourlyServiceTypeRateMap.set(
            Number(franchiseServiceType.service_type_id),
            franchiseServiceType,
          );
        }
      });

      const serviceTypeRatesMap = new Map<number, ServiceTypeRates>();

      if (payload?.service_type_rates) {
        payload.service_type_rates.forEach((serviceTypeRate) => {
          if (
            standardHourlyServiceTypeRateMap.has(Number(serviceTypeRate.id))
          ) {
            serviceTypeRatesMap.set(
              Number(serviceTypeRate.id),
              serviceTypeRate,
            );
          }
        });
      }

      const validTowns: FranchiseServiceLocationModel[] =
        await this.franchiseServiceLocationRepository.find({
          id: In(town),
          franchise_id: franchiseModel.id,
        });

      if (validTowns.length !== town.length) {
        throw new BadRequestException(vendorMessages.INVALID_TOWN_IDS);
      }

      password = await hashPassword(payload.password);
      const vendorType = await this.userRepository.create({
        ...rest,
        password,
        franchise_id: franchiseModel.id,
        user_type: UserType.Vendor,
        is_approved: payload.is_approved ?? false,
        is_active: payload.is_approved ?? false,
        ...(payload?.terms_and_conditions && {
          terms_and_conditions: payload.terms_and_conditions,
        }),
        ...(payload.insurance_document_name && {
          insurance_document_name: payload.insurance_document_name,
        }),
        ...(payload?.alternate_contact && {
          alternate_contact: payload.alternate_contact,
        }),
      });

      const newVendor = await queryRunner.manager.save(UserModel, vendorType);

      await this.createVendorServiceType(
        validServiceTypes,
        newVendor,
        franchiseModel.id,
        queryRunner,
        serviceTypeRatesMap,
      );

      await this.createVendorServiceLocation(
        validTowns,
        newVendor,
        franchiseModel.id,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      const emailPayload = {
        link: `${this.configService.get('PORTAL_FRONTEND_URL')}/login`,
        vendor_name: `${newVendor.first_name} ${newVendor.last_name}`,
        smsBody: `${newVendor.first_name} ${newVendor.last_name} created a new vendor account`,
      };

      if (sendResetPasswordEmail) {
        const userTokenModel = new UserTokenModel();
        const encPayload = this.encryptionHelper.encrypt(
          JSON.stringify({ email: newVendor.email, id: newVendor.id }),
        );

        userTokenModel.user_id = newVendor.id;
        userTokenModel.token = encPayload;
        userTokenModel.token_type = TokenType.PasswordReset;

        await this.userTokenRepository.save(userTokenModel);

        emailPayload.link = `${this.configService.get(
          'PORTAL_FRONTEND_URL',
        )}/reset-password?auth=${encPayload}`;

        emailPayload.smsBody = `${newVendor.first_name} ${newVendor.last_name} created a new vendor account, please reset your password using the link below to login ${emailPayload.link}`;

        this.logger.log(
          `Reset Password URL for vendor ${newVendor.email}: ${emailPayload.link}`,
        );
      }

      await this.notificationsService.sendNotification(
        NotificationAction.VENDOR_CREATED,
        emailPayload,
        [payload.email],
        [payload.contact],
      );
      return newVendor;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getVendors(
    params: VendorSearchQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<UserModel>> {
    let paginationParams: IPaginationDBParams | null = null;
    if (params?.page) {
      paginationParams = this.generalHelper.getPaginationOptionsV2(params);
    }
    const { service_type_id, is_approved, insurance_active } = params;
    const franchiseId: number = [
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ].includes(user.user_type)
      ? Number(user.franchise_id)
      : params?.franchise_id;

    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        user.user_type,
      ) &&
      params.download
    ) {
      this.logger.log('[EVENT] Emitting vendors report preparation event');

      const { data, count } = await this.userRepository.getVendors(
        null,
        service_type_id,
        franchiseId,
        is_approved === undefined ? null : is_approved,
        params.name,
        insurance_active,
        params.service_area,
        params.download,
      );

      if (count >= Setting.MAX_DIRECT_DOWNLOAD_ROWS) {
        // Send via email
        this.eventEmitter.emit(
          DownloadReportEventName.VENDORS,
          new GenericReportDownloadEvent(
            () =>
              this.userRepository.getVendors(
                null,
                service_type_id,
                franchiseId,
                is_approved === undefined ? null : is_approved,
                params.name,
                insurance_active,
                params.service_area,
                params.download,
              ),
            user,
          ),
        );
      } else {
        // Return data for download
        return { data, count };
      }
    } else {
      return await this.userRepository.getVendors(
        paginationParams,
        service_type_id,
        franchiseId,
        is_approved === undefined ? null : is_approved,
        params.name,
        insurance_active,
        params.service_area,
      );
    }
  }

  async getVendor(vendorId: number): Promise<{ vendor: UserModel }> {
    const vendor: UserModel = await this.userRepository.getVendor(vendorId);

    if (!vendor || vendor.user_type !== UserType.Vendor)
      throw new BadRequestException(vendorMessages.VENDOR_NOT_FOUND);

    vendor.policy_effective_date = vendor?.policy_effective_date
      ? moment(vendor.policy_effective_date).format('MM-DD-YYYY')
      : vendor?.policy_effective_date;

    vendor.policy_expire_date = vendor?.policy_expire_date
      ? moment(vendor.policy_expire_date).format('MM-DD-YYYY')
      : vendor.policy_expire_date;

    vendor.service_type_rates = vendor.vendorServiceType
      .map((vst) => {
        if (!vst.serviceType.standard_hourly) return null;
        return {
          id: vst.service_type_id,
          value: vst.serviceType.title,
          hourly_rate: vst.hourly_rate,
          service_call_fee: vst.service_call_fee,
        };
      })
      .filter((vst) => vst);

    return { vendor };
  }

  async update(payload: UpdateVendorDto, user: JwtPayload): Promise<UserModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const vendor: UserModel = await this.userRepository.findOne({
        where: {
          id: payload.vendor_id,
          user_type: UserType.Vendor,
          franchise_id: Number(user.franchise_id),
        },
      });

      if (!vendor)
        throw new BadRequestException(vendorMessages.VENDOR_NOT_FOUND);

      if (
        ![UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        ) &&
        payload.hasOwnProperty('is_approved')
      )
        throw new BadRequestException(vendorMessages.INVALID_UPDATE_REQUEST);

      const sendStatusUpdateEmail: boolean =
        payload?.is_approved !== vendor.is_approved;

      const validServiceTypes: FranchiseServiceTypeModel[] =
        await this.franchiseServiceTypeRepository.find(
          {
            franchise_id: Number(user.franchise_id),
            service_type_id: In(payload.service_types),
            is_active: true,
            is_deleted: false,
          },
          null,
          ['serviceType'],
        );

      const standardHourlyServiceTypeRateMap = new Map<
        number,
        FranchiseServiceTypeModel
      >();

      validServiceTypes.forEach((franchiseServiceType) => {
        if (franchiseServiceType.serviceType.standard_hourly) {
          standardHourlyServiceTypeRateMap.set(
            Number(franchiseServiceType.service_type_id),
            franchiseServiceType,
          );
        }
      });

      if (validServiceTypes.length !== payload.service_types.length) {
        throw new BadRequestException(vendorMessages.INVALID_SERVICE_TYPE_IDS);
      }

      const validTowns: FranchiseServiceLocationModel[] =
        await this.franchiseServiceLocationRepository.find(
          {
            id: In(payload.town),
            franchise_id: Number(vendor.franchise_id),
          },
          null,
        );

      if (validTowns.length !== payload.town.length) {
        throw new BadRequestException(vendorMessages.INVALID_TOWN_IDS);
      }

      vendor.first_name = payload.first_name ?? vendor.first_name;
      vendor.last_name = payload.last_name ?? vendor.last_name;
      // vendor.email = payload.email ?? vendor.email;
      vendor.license_number = payload.license_number ?? vendor.license_number;
      vendor.website_url = payload.website_url ?? vendor.website_url;
      vendor.contact = payload.contact ?? vendor.contact;
      vendor.mailing_address =
        payload.mailing_address ?? vendor.mailing_address;
      vendor.city = payload.city ?? vendor.city;
      vendor.state = payload.state ?? vendor.state;
      vendor.zip = payload.zip ?? vendor.zip;
      vendor.office_phone = payload.office_phone ?? vendor.office_phone;
      vendor.cell_phone = payload.cell_phone ?? vendor.cell_phone;
      vendor.insurance_company =
        payload.insurance_company ?? vendor.insurance_company;
      vendor.policy_number = payload.policy_number ?? vendor.policy_number;
      vendor.policy_effective_date =
        payload.policy_effective_date ?? vendor.policy_effective_date;
      vendor.policy_expire_date =
        payload.policy_expire_date ?? vendor.policy_expire_date;
      vendor.policy_number = payload.policy_number ?? vendor.policy_number;
      vendor.is_approved = payload?.is_approved ?? vendor?.is_approved;
      vendor.alternate_contact_name =
        payload?.alternate_contact_name ?? vendor?.alternate_contact_name;
      vendor.profile_completion_step =
        payload?.is_approved &&
        Number(vendor?.profile_completion_step) !==
          Number(OwnerProfileStatus.ProfileCompleted)
          ? OwnerProfileStatus.ProfileCompleted
          : vendor?.profile_completion_step;
      if (payload.insurance_document_name)
        vendor.insurance_document_name = payload.insurance_document_name;

      if (payload?.alternate_contact)
        vendor.alternate_contact = payload?.alternate_contact;

      if (payload?.comments) vendor.comments = payload?.comments;

      if (payload.password) {
        vendor.password = await hashPassword(payload.password);
      }

      await queryRunner.manager.delete(VendorServiceTypeModel, {
        vendor_id: vendor.id,
      });

      await queryRunner.manager.delete(VendorServiceLocationModel, {
        vendor_id: vendor.id,
        franchise_id: vendor.franchise_id,
      });

      const serviceTypeRatesMap = new Map<number, ServiceTypeRates>();

      if (payload?.service_type_rates) {
        payload.service_type_rates.forEach((serviceTypeRate) => {
          if (
            standardHourlyServiceTypeRateMap.has(Number(serviceTypeRate.id))
          ) {
            serviceTypeRatesMap.set(
              Number(serviceTypeRate.id),
              serviceTypeRate,
            );
          }
        });
      }

      await this.createVendorServiceType(
        validServiceTypes,
        vendor,
        vendor.franchise_id,
        queryRunner,
        serviceTypeRatesMap,
      );

      await this.createVendorServiceLocation(
        validTowns,
        vendor,
        vendor.franchise_id,
        queryRunner,
      );

      const vendorModel = await queryRunner.manager.save(UserModel, vendor);
      await queryRunner.commitTransaction();

      if (sendStatusUpdateEmail) {
        await this.notificationsService.sendNotification(
          NotificationAction.VENDOR_STATUS_CHANGED,
          {
            vendor_name: `${vendor.first_name} ${vendor.last_name}`,
            status: payload.is_approved ? 'activated' : 'deactivated',
            message: payload.is_approved
              ? 'Your account has been approved. You can now login to your account.'
              : 'Your account has been deactivated. Please contact Franchise Admin for more information.',
            smsBody: `${vendor.first_name} ${vendor.last_name} account has been ${payload.is_approved ? 'activated' : 'deactivated'}`,
          },
          [vendor.email],
          [vendor.contact],
        );
      }

      return vendorModel;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateVendorApproval(
    payload: VendorApprovalDto,
    user: JwtPayload,
  ): Promise<UserModel> {
    const vendor: UserModel = await this.userRepository.findOne({
      where: { id: payload.vendor_id, franchise_id: Number(user.franchise_id) },
    });

    if (!vendor) throw new BadRequestException(vendorMessages.VENDOR_NOT_FOUND);

    vendor.is_approved = payload.is_approved ? true : false;
    vendor.comments = payload.is_approved ? null : payload?.comments;

    this.notificationsService.sendNotification(
      NotificationAction.VENDOR_STATUS_CHANGED,
      {
        vendor_name: `${vendor.first_name} ${vendor.last_name}`,
        status: payload.is_approved ? 'activated' : 'deactivated',
        message: payload.is_approved
          ? 'Your account has been activated. You can now login to your account.'
          : 'Your account has been deactivated. Please contact Franchise Admin for more information.',
        smsBody: `${vendor.first_name} ${vendor.last_name} account has been ${payload.is_approved ? 'activated' : 'deactivated'}`,
      },
      [vendor.email],
      [vendor.contact],
    );

    return await this.userRepository.save(vendor);
  }

  async getAllVendors(user: JwtPayload): Promise<UserModel[]> {
    return await this.userRepository.getAllVendors(user);
  }
}
