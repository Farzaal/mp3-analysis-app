import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  CreateServiceRequestDto,
  EditServiceRequestDto,
  ReleaseVendorDto,
  OwnerDiscrepancyApproval,
  ServiceRequestQueryDto,
  ServiceRequestNotesDto,
  ServiceRequestNoteImageDto,
  ClaimServiceRequestDto,
  LinenPropertiesDto,
  RecurringDto,
  CalenderQueryDto,
  ServiceRequestArchiveDto,
  DrawerQueryDto,
  ServiceRequestReportedIssueDto,
  CancelServiceRequestDto,
  CreateGuestConciergeServiceRequestDto,
  ServiceRequestNoteDto,
  CreateChildServiceRequestDto,
} from './serviceRequest.dto';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
import { ServiceRequestMessage } from './serviceRequest.message';
import { FranchiseServiceTypeModel } from '@/app/models/serviceType/franchiseServiceType.model';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { UserModel } from '@/app/models/user/user.model';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { OwnerProfileStatus } from '@/app/contracts/enums/ownerProfile.enum';
import { VendorServiceTypePriorityRepository } from '@/app/repositories/vendor/vendorServiceTypePriority.repository';
import {
  ServiceRequestRepeatType,
  ServiceRequestStatus,
} from '@/app/contracts/enums/serviceRequest.enum';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { VendorServiceTypeRepository } from '@/app/repositories/vendor/vendorServiceType.repository';
import { VendorServiceTypeModel } from '@/app/models/serviceType/vendorServiceType.model';
import { VendorServiceLocationRepository } from '@/app/repositories/vendor/vendorServiceLocation.repository';
import { VendorServiceLocationModel } from '@/app/models/franchise/vendorServiceLocation.model';
import { OwnerApprovalStatus } from '@/app/contracts/enums/ownerApprovalStatus.enum';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from '@/app/utils/general.helper';
import { ServiceRequestMediaModel } from '@/app/models/serviceRequest/serviceRequestMedia.model';
import { ServiceRequestNoteModel } from '@/app/models/serviceRequest/serviceRequestNote.model';
import { ServiceRequestNoteRepository } from '@/app/repositories/serviceRequest/serviceRequestNote.repository';
import { S3Service } from '@/app/commons/s3.service';
import { BunyanLogger } from '@/app/commons/logger.service';
import { DataSource, In, IsNull, Not, QueryRunner, Raw } from 'typeorm';
import { getNextStatuses } from '@/app/utils/serviceRequestStatus.helper';
import { ServiceRequestVendorStatusRepository } from '@/app/repositories/serviceRequest/serviceRequestVendorStatus.repository';
import { ServiceRequestVendorStatusModel } from '@/app/models/serviceRequest/serviceRequestVendorStatus.model';
import { IServiceRequestParams } from '@/app/contracts/interfaces/serviceRequest.interface';
import { ServiceRequestLinenDetailModel } from '@/app/models/serviceRequest/serviceRequestLinenDetail.model';
import { ServiceRequestLinenDetailRepository } from '@/app/repositories/serviceRequest/serviceRequestLinenDetail.repository';
import { ServiceRequestRecurringDateModel } from '@/app/models/serviceRequest/serviceRequestRecurringDate.model';
import { ServiceRequestNotificationService } from './serviceRequestNotification.service';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';
import { DownloadReportEventName } from '@/app/contracts/enums/reportDownload.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GenericReportDownloadEvent } from '@/reportDownload/reportDownload.event';
import { ServiceRequestPriority } from '@/app/contracts/enums/serviceRequestPriority.enum';
import * as moment from 'moment';
import { ServiceRequestRecurringDateRepository } from '@/app/repositories/serviceRequest/serviceRequestRecurringDate.repository';
import { ServiceRequestRecurringLogModel } from '@/app/models/serviceRequest/serviceRequestRecurringLog.model';
import { ServiceRequestRecurringLogRepository } from '@/app/repositories/serviceRequest/serviceRequestRecurringLog.repository';
import { SettingRepository } from '@/app/repositories/setting/setting.repository';
import { SettingModel } from '@/app/models/setting/setting.model';
import { ServiceRequestDiscrepancyModel } from '@/app/models/serviceRequest/serviceRequestDiscrepancy.model';
import { PaginationParam } from '@/app/commons/base.request';
import { ServiceRequestMediaRepository } from '@/app/repositories/serviceRequest/serviceRequestMedia.repository';
import { VendorServiceTypePriorityModel } from '@/app/models/serviceType/vendorServiceTypePriorities.model';
import { InvoiceService } from '@/invoice/invoice.service';
import { Setting } from '@/app/contracts/enums/setting.enum';
import { MembershipTierRepository } from '@/app/repositories/membershipTier/membershipTier.repository';
import { GuestModel } from '@/app/models/serviceRequest/guest.model';
import {
  InvoiceSection,
  InvoiceStatus,
} from '@/app/contracts/enums/invoice.enum';
import { IGuestPayload } from '@/app/contracts/interfaces/guest.interface';
import { PaymentService } from '@/payment/payment.service';
import { DistributionType } from '@/app/contracts/enums/distributionType';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { NotificationsService } from '@/notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ServiceRequestService {
  constructor(
    private readonly propertyMasterRepository: PropertyMasterRepository,
    private readonly userRepository: UserRepository,
    private readonly settingRepository: SettingRepository,
    private readonly franchiseServiceTypeRepository: FranchiseServiceTypeRepository,
    private readonly vendorServiceTypePriorityRepository: VendorServiceTypePriorityRepository,
    private readonly serviceRequestMasterRepository: ServiceRequestMasterRepository,
    private readonly serviceRequestVendorStatusRepository: ServiceRequestVendorStatusRepository,
    private readonly serviceRequestNoteRepository: ServiceRequestNoteRepository,
    private readonly serviceRequestMediaRepository: ServiceRequestMediaRepository,
    private readonly vendorServiceTypeRepository: VendorServiceTypeRepository,
    private readonly vendorServiceLocationRepository: VendorServiceLocationRepository,
    private readonly serviceRequestLinenDetailRepository: ServiceRequestLinenDetailRepository,
    private readonly serviceRequestRecurringDateRepository: ServiceRequestRecurringDateRepository,
    private readonly serviceRequestRecurringLogRepository: ServiceRequestRecurringLogRepository,
    private readonly serviceRequestNotificationService: ServiceRequestNotificationService,
    private readonly invoiceService: InvoiceService,
    private readonly generalHelper: GeneralHelper,
    private readonly s3Service: S3Service,
    private readonly logger: BunyanLogger,
    private readonly dataSource: DataSource,
    private readonly paymentService: PaymentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly membershipTierRepository: MembershipTierRepository,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async createGuestConciergeServiceRequest(
    payload: CreateGuestConciergeServiceRequestDto,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const propertyMasterModel = await this.propertyMasterRepository.findOne({
        where: {
          id: payload.property_master_id,
          is_deleted: false,
          franchise_id: payload.franchise_id,
        },
      });

      const franchiseServiceTypeModel =
        await this.franchiseServiceTypeRepository.findOneWithAssociatedServiceType(
          payload.cart_items.map((item) => item.service_type_id),
          propertyMasterModel.franchise_id,
        );

      const franchiseServiceTypeValid = franchiseServiceTypeModel.every(
        (item) => item.is_active && item.is_guest_concierge,
      );

      const uniqueCartServiceTypeIds = [
        ...new Set(payload.cart_items.map((item) => item.service_type_id)),
      ];

      if (
        !franchiseServiceTypeModel ||
        !franchiseServiceTypeValid ||
        franchiseServiceTypeModel.length !== uniqueCartServiceTypeIds.length
      )
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_TYPE_NOT_AVAILABLE,
        );

      const preferredVendors =
        await this.vendorServiceTypePriorityRepository.find({
          service_type_id: In(
            franchiseServiceTypeModel.map(
              (item) => item.associatedServiceType.id,
            ),
          ),
          property_master_id: payload.property_master_id,
          franchise_id: propertyMasterModel.franchise_id,
        });

      const serviceTypePrefVendorsMap = new Map<number, number[]>();
      const serviceTypeRatesMap = new Map<number, { [key: string]: number }>();
      franchiseServiceTypeModel.forEach((item) => {
        const vendors = preferredVendors
          .filter(
            (vendor) =>
              vendor.service_type_id === item.associatedServiceType.id,
          )
          .map((vendor) => vendor.vendor_id);
        serviceTypePrefVendorsMap.set(item.associatedServiceType.id, vendors);
        serviceTypeRatesMap.set(Number(item.service_type_id), {
          vendor_rate: item.vendor_rate,
          guest_price: item.guest_price,
        });
      });

      let guest: GuestModel = null;
      let total = 0;

      if (payload?.billing_info) {
        const guestPayload: IGuestPayload = {
          full_name: payload.billing_info.full_name,
          email: payload.billing_info.email,
          contact: payload.billing_info.phone,
          address: payload.billing_info.address,
          city: payload.billing_info.city,
          state: payload.billing_info.state,
          zip: payload.billing_info.zip,
          guest_consent: false,
          is_guest_concierge: true,
          order_info: payload.cart_items.map((item) => ({
            service_type_id: item.service_type_id,
            qty: item.qty,
            start_date: item.start_date,
            unit_price:
              serviceTypeRatesMap.get(item.service_type_id)?.guest_price || 0,
          })),
        };
        guest = await this.createGuest(guestPayload, queryRunner);
      }

      const serviceRequestModels: ServiceRequestMasterModel[] =
        payload.cart_items.flatMap((item) =>
          Array.from({ length: item.qty }, () => {
            const serviceRequestMasterModel = new ServiceRequestMasterModel();
            serviceRequestMasterModel.service_type_id = item.service_type_id;
            serviceRequestMasterModel.owner_id = propertyMasterModel.owner_id;
            serviceRequestMasterModel.description = item?.description ?? null;
            serviceRequestMasterModel.start_date = item.start_date;
            serviceRequestMasterModel.is_guest_concierge = true;
            serviceRequestMasterModel.status =
              serviceTypePrefVendorsMap.get(item.service_type_id)?.length > 0
                ? ServiceRequestStatus.Claimed
                : ServiceRequestStatus.NotYetAssigned;
            serviceRequestMasterModel.vendor_distribution_type =
              serviceTypePrefVendorsMap.get(item.service_type_id)?.length > 0
                ? DistributionType.PreferredVendor
                : DistributionType.DistributeToAllVendors;
            serviceRequestMasterModel.property_master_id =
              payload.property_master_id;
            serviceRequestMasterModel.owner_approval_status =
              OwnerApprovalStatus.Approved;
            serviceRequestMasterModel.franchise_id =
              propertyMasterModel.franchise_id;
            serviceRequestMasterModel.is_occupied = true;
            serviceRequestMasterModel.guest_id = guest.id;
            const guestPrice =
              serviceTypeRatesMap.get(item.service_type_id)?.guest_price || 0;
            total = Math.round((total + guestPrice) * 100) / 100;
            return serviceRequestMasterModel;
          }),
        );

      const serviceRequestMasterModels = await queryRunner.manager.save(
        ServiceRequestMasterModel,
        serviceRequestModels,
      );

      if (preferredVendors.length > 0) {
        const serviceRequestVendorStatusModels: ServiceRequestVendorStatusModel[] =
          serviceRequestMasterModels.flatMap((serviceRequest) =>
            franchiseServiceTypeModel.flatMap((item) => {
              const vendorIds =
                serviceTypePrefVendorsMap.get(item.associatedServiceType.id) ||
                [];
              return vendorIds.map((vendorId) => {
                const serviceRequestVendorStatusModel =
                  new ServiceRequestVendorStatusModel();
                serviceRequestVendorStatusModel.service_request_master_id =
                  serviceRequest.id;
                serviceRequestVendorStatusModel.vendor_id = vendorId;
                serviceRequestVendorStatusModel.status =
                  ServiceRequestStatus.Claimed;
                return serviceRequestVendorStatusModel;
              });
            }),
          );

        await queryRunner.manager.save(
          ServiceRequestVendorStatusModel,
          serviceRequestVendorStatusModels,
        );
      }
      const response = await this.paymentService.payGuestConcierge({
        amount: total,
        paymentMethodId: payload.payment_method_id,
        franchiseId: propertyMasterModel.franchise_id,
        guestEmail: guest.email,
        guestName: guest.full_name,
        guestId: guest.id,
      });

      if (response.error) throw new BadRequestException(response.data);

      await this.invoiceService.createGuestConiergeServiceRequestInvoice(
        queryRunner,
        serviceRequestMasterModels,
        serviceTypeRatesMap,
      );
      await queryRunner.manager.update(
        GuestModel,
        { id: guest.id },
        {
          payment_info:
            typeof response.data === 'string'
              ? { error: response.data }
              : response.data,
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

  async createGuest(
    payload: IGuestPayload,
    queryRunner: QueryRunner,
  ): Promise<GuestModel> {
    const guestModel = new GuestModel();
    guestModel.full_name = payload.full_name ?? '';
    guestModel.email = payload.email ?? '';
    guestModel.contact = payload.contact ?? '';
    guestModel.guest_consent = payload?.guest_consent ?? false;
    guestModel.is_guest_concierge = payload?.is_guest_concierge ?? true;
    guestModel.order_info = payload?.order_info ?? [];
    guestModel.address = payload.address ?? '';
    guestModel.city = payload.city ?? '';
    guestModel.state = payload.state ?? '';
    guestModel.zip = payload.zip ?? '';

    return await queryRunner.manager.save(GuestModel, guestModel);
  }

  async createChildServiceRequest(
    payload: CreateChildServiceRequestDto,
    user: JwtPayload | null,
  ): Promise<boolean> {
    const serviceRequestMaster =
      await this.serviceRequestMasterRepository.findOne({
        where: {
          id: payload.parent_service_request_id,
          is_deleted: false,
          franchise_id: Number(user.franchise_id),
          property_master_id: payload.property_master_id,
        },
      });

    if (!serviceRequestMaster)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
      );

    const canCreateChildRequest = await this.canCreateChildRequest(
      serviceRequestMaster,
      user,
    );

    if (!canCreateChildRequest)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_CHILD_ERROR_UNAUTHORIZED,
      );

    if (serviceRequestMaster.status !== ServiceRequestStatus.PartiallyCompleted)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_STATUS_ERROR,
      );

    if (serviceRequestMaster.parent_id)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_CHILD_ERROR,
      );

    if (
      user.user_type === UserType.Vendor &&
      Number(serviceRequestMaster.vendor_id) !== Number(user.id)
    )
      throw new BadRequestException(ServiceRequestMessage.INVALID_ATTEMPT);

    const serviceRequestPayload: CreateServiceRequestDto = {
      property_master_id: payload.property_master_id,
      service_type_id: payload.service_type_id,
      description: payload.description,
      priority: ServiceRequestPriority.NonUrgent,
      files: payload.files,
      parent_service_request_id: payload.parent_service_request_id,
    };

    await this.createServiceRequest(
      serviceRequestPayload,
      user,
      false,
      false,
      null,
      true,
    );

    return true;
  }

  async updateChildServiceRequestInfo(
    queryRunner: QueryRunner,
    serviceRequestMasterModel: ServiceRequestMasterModel,
    payload: CreateServiceRequestDto,
    user: JwtPayload,
  ): Promise<ServiceRequestMasterModel> {
    const parentServiceRequestMasterModel =
      await this.serviceRequestMasterRepository.findOne({
        where: {
          id: payload.parent_service_request_id,
          is_deleted: false,
          franchise_id: Number(user.franchise_id),
        },
      });

    const canCreateChildRequest = await this.canCreateChildRequest(
      parentServiceRequestMasterModel,
      user,
    );

    if (!canCreateChildRequest)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_CHILD_ERROR_UNAUTHORIZED,
      );

    serviceRequestMasterModel.parent_id = payload?.parent_service_request_id
      ? payload?.parent_service_request_id
      : null;
    await queryRunner.manager.update(
      ServiceRequestMasterModel,
      { id: payload.parent_service_request_id },
      { is_parent: true },
    );
    if (user.user_type === UserType.Vendor) {
      const serviceRequestNote = new ServiceRequestNoteModel();
      serviceRequestNote.service_request_master_id =
        payload.parent_service_request_id;
      serviceRequestNote.description = payload?.description ?? null;
      serviceRequestNote.note_added_by = Number(user.id);
      serviceRequestNote.current_status =
        parentServiceRequestMasterModel.status;
      serviceRequestNote.updated_status =
        parentServiceRequestMasterModel.status;
      const serviceRequestNoteModel = await queryRunner.manager.save(
        ServiceRequestNoteModel,
        serviceRequestNote,
      );
      await this.addServiceRequestMedia(
        payload.parent_service_request_id,
        payload.files,
        user,
        queryRunner,
        serviceRequestNoteModel.id,
      );
    } else if (
      [UserType.StandardAdmin, UserType.FranchiseAdmin].includes(user.user_type)
    ) {
      serviceRequestMasterModel.owner_approval_status =
        OwnerApprovalStatus.Approved;
    }

    return serviceRequestMasterModel;
  }

  async createServiceRequest(
    payload: CreateServiceRequestDto,
    user: JwtPayload | null,
    isGuest: boolean = false,
    isDiscrepancy: boolean = false,
    estimateMasterId: number | null = null,
    isChild: boolean = false,
  ): Promise<ServiceRequestMasterModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      if (
        !estimateMasterId &&
        (((payload.vendor_ids || payload.distribution_type) && isGuest) ||
          ((payload.vendor_ids || payload.distribution_type) &&
            !isGuest &&
            user &&
            ![UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
              user.user_type,
            )))
      )
        throw new ForbiddenException(
          ServiceRequestMessage.CANNOT_ASSIGN_VENDOR,
        );

      if (!estimateMasterId && user && user.user_type === UserType.Owner) {
        const membershipTierValid = await this.isPropertyMembershipValid(
          payload?.property_master_id,
        );

        if (!membershipTierValid)
          throw new BadRequestException(
            ServiceRequestMessage.PROPERTY_MEMBERSHIP_INVALID,
          );
      }

      let serviceRequestStatus = ServiceRequestStatus.NotYetAssigned;
      const propertyCond: Record<string, string | number | boolean> = {
        id: payload.property_master_id,
        is_deleted: false,
        off_program: false,
      };
      if (user) propertyCond['franchise_id'] = Number(user.franchise_id);
      const propertyMasterModel: PropertyMasterModel =
        await this.propertyMasterRepository.findOne({
          where: propertyCond,
          relations: ['membershipTier'],
        });

      if (!propertyMasterModel)
        throw new BadRequestException(ServiceRequestMessage.PROPERTY_NOT_EXIST);

      if (payload?.is_discrepancy && !payload?.parent_service_request_id)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_DISCREPANCY_ISSUE,
        );

      const franchiseServiceTypeModel: FranchiseServiceTypeModel =
        await this.franchiseServiceTypeRepository.findOne({
          where: {
            franchise_id: user
              ? Number(user.franchise_id)
              : propertyMasterModel.franchise_id,
            service_type_id: payload.service_type_id,
            is_active: true,
            is_deleted: false,
          },
          relations: ['associatedServiceType', 'serviceType'],
        });

      if (!franchiseServiceTypeModel)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_TYPE_NOT_EXIST,
        );

      if (isGuest && !franchiseServiceTypeModel.available_to_guest)
        throw new BadRequestException(
          ServiceRequestMessage.GUEST_SERVICE_TYPE_ERROR,
        );

      if (
        isGuest &&
        (!propertyMasterModel?.membershipTier ||
          propertyMasterModel.membershipTier.membership_type !==
            MemberShipStatus.Paid)
      )
        throw new BadRequestException(
          ServiceRequestMessage.PROPERTY_MEMBERSHIP_ERROR,
        );

      // TODO: Enable this check with invoicing
      // const userPaymentMethod: UserPaymentMethodModel =
      //   await this.userPaymentMethodRepository.findOne({
      //     where: {
      //       owner_id: propertyMasterModel.owner_id,
      //       status: PaymentMethodStatus.Succeeded,
      //     },
      //   });

      const owner: UserModel = await this.userRepository.findOne({
        where: {
          id: propertyMasterModel.owner_id,
          is_deleted: false,
          user_type: UserType.Owner,
          profile_completion_step: OwnerProfileStatus.OnboardingCompleted,
        },
      });

      const franchiseAdmin: UserModel = await this.userRepository.findOne({
        where: {
          user_type: UserType.FranchiseAdmin,
          franchise_id: Number(propertyMasterModel.franchise_id),
        },
      });

      if (!owner)
        throw new BadRequestException(ServiceRequestMessage.INVALID_OWNER);

      let vendors = null;

      if (payload.vendor_ids) {
        vendors = await this.verifyVendor(
          payload.vendor_ids,
          payload.service_type_id,
          propertyMasterModel.city,
          user,
        );
      }

      const preferredVendors =
        await this.vendorServiceTypePriorityRepository.find({
          service_type_id: payload.service_type_id,
          property_master_id: propertyMasterModel.id,
          franchise_id: Number(propertyMasterModel.franchise_id),
        });

      const serviceRequestMasterModel = new ServiceRequestMasterModel();

      if (payload?.distribution_type) {
        serviceRequestMasterModel.vendor_distribution_type =
          payload?.distribution_type;
        if (
          payload?.distribution_type === DistributionType.DistributeToAllVendors
        ) {
          serviceRequestStatus = ServiceRequestStatus.NotYetAssigned;
        } else if (
          payload?.distribution_type === DistributionType.PreferredVendor
        ) {
          serviceRequestStatus =
            preferredVendors.length > 0
              ? ServiceRequestStatus.Claimed
              : ServiceRequestStatus.NotYetAssigned;
        } else if (
          payload?.distribution_type === DistributionType.SelectedVendor
        ) {
          serviceRequestStatus = ServiceRequestStatus.Claimed;
        }
      } else {
        serviceRequestStatus =
          preferredVendors.length > 0
            ? ServiceRequestStatus.Claimed
            : ServiceRequestStatus.NotYetAssigned;
        payload.distribution_type =
          preferredVendors.length > 0
            ? DistributionType.PreferredVendor
            : DistributionType.DistributeToAllVendors;
        serviceRequestMasterModel.vendor_distribution_type =
          payload?.distribution_type;
      }

      serviceRequestMasterModel.property_master_id = propertyMasterModel.id;
      serviceRequestMasterModel.service_type_id = payload.service_type_id;
      serviceRequestMasterModel.description = payload.description;
      serviceRequestMasterModel.owner_id = propertyMasterModel.owner_id;
      serviceRequestMasterModel.priority = payload?.priority ?? null;
      serviceRequestMasterModel.start_date = payload?.start_date ?? null;
      serviceRequestMasterModel.end_date = payload?.end_date ?? null;
      serviceRequestMasterModel.status = serviceRequestStatus;
      serviceRequestMasterModel.owner_approval_status =
        isGuest || isDiscrepancy || isChild
          ? OwnerApprovalStatus.UnApproved
          : OwnerApprovalStatus.Approved;
      serviceRequestMasterModel.franchise_id = user
        ? Number(user.franchise_id)
        : propertyMasterModel.franchise_id;
      serviceRequestMasterModel.is_recurring = payload?.is_recurring ?? false;
      serviceRequestMasterModel.is_guest = user ? false : true;
      serviceRequestMasterModel.is_discrepancy = isDiscrepancy ? true : false;
      serviceRequestMasterModel.turn_over = payload.turn_over ?? null;
      serviceRequestMasterModel.display_to_vendor =
        payload?.display_to_vendor ?? false;
      serviceRequestMasterModel.is_occupied = payload?.is_occupied ?? false;

      if (isChild && payload?.parent_service_request_id) {
        await this.updateChildServiceRequestInfo(
          queryRunner,
          serviceRequestMasterModel,
          payload,
          user,
        );
      }

      if (
        payload?.guest_name &&
        payload?.guest_email &&
        payload?.guest_contact_number
      ) {
        const guestPayload: IGuestPayload = {
          full_name: payload.guest_name,
          email: payload.guest_email,
          contact: payload.guest_contact_number,
          guest_consent: payload.guest_consent ?? false,
        };
        const savedGuest = await this.createGuest(guestPayload, queryRunner);
        serviceRequestMasterModel.guest_id = savedGuest.id;
      }

      user &&
        user.user_type === UserType.FranchiseAdmin &&
        (serviceRequestMasterModel.notes_for_vendor =
          payload?.notes_for_vendor ?? null);
      user &&
        (serviceRequestMasterModel.created_by =
          user.user_type === UserType.StandardAdmin
            ? Number(user.franchise_admin)
            : Number(user.id));
      estimateMasterId &&
        (serviceRequestMasterModel.estimate_master_id = estimateMasterId);

      const serviceRequestMaster = await queryRunner.manager.save(
        ServiceRequestMasterModel,
        serviceRequestMasterModel,
      );

      if (
        (payload?.vendor_ids || (user && preferredVendors.length > 0)) &&
        serviceRequestStatus === ServiceRequestStatus.Claimed
      ) {
        const vendorIds = payload?.vendor_ids
          ? [...payload.vendor_ids]
          : preferredVendors.map((vendor) => vendor.vendor_id);
        await this.createServiceRequestVendorStatus(
          serviceRequestMaster.id,
          vendorIds,
          ServiceRequestStatus.Claimed,
          queryRunner,
        );
      }

      if (payload?.is_discrepancy && payload?.parent_service_request_id) {
        const serviceReqDisModel = new ServiceRequestDiscrepancyModel();
        serviceReqDisModel.root_service_request_id =
          payload.parent_service_request_id;
        serviceReqDisModel.service_request_discrepancy_id =
          serviceRequestMaster.id;

        await queryRunner.manager.save(
          ServiceRequestDiscrepancyModel,
          serviceReqDisModel,
        );
      }

      if (payload.files && payload.files.length)
        await this.addServiceRequestMedia(
          serviceRequestMaster.id,
          payload.files,
          user,
          queryRunner,
        );

      if (payload?.linen_properties)
        await this.createLinenOrder(
          payload.linen_properties,
          serviceRequestMaster.id,
          serviceRequestMaster.service_type_id,
          queryRunner,
        );

      if (payload?.is_recurring && payload?.recurring) {
        await this.processRecurringServiceRequest(
          queryRunner,
          payload,
          serviceRequestMaster,
          user,
          preferredVendors,
        );
      }

      await queryRunner.commitTransaction();
      await this.serviceRequestNotificationService.sendCreateServiceRequestNotification(
        serviceRequestMasterModel.id,
        user,
        franchiseAdmin,
        vendors,
      );
      return serviceRequestMaster;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async isPropertyMembershipValid(propertyMasterId: number) {
    const membershipTierCheck = await this.membershipTierRepository.findOne({
      where: {
        property_master_id: propertyMasterId,
      },
    });

    if (
      membershipTierCheck &&
      !membershipTierCheck.next_due_date &&
      membershipTierCheck.membership_type === MemberShipStatus.Paid
    ) {
      return false;
    }

    return true;
  }

  async processRecurringServiceRequest(
    queryRunner: QueryRunner,
    payload: CreateServiceRequestDto | EditServiceRequestDto,
    serviceRequestMaster: ServiceRequestMasterModel,
    user: JwtPayload,
    preferredVendors: VendorServiceTypePriorityModel[],
  ) {
    let serviceRequestVendorStatusModels: ServiceRequestVendorStatusModel[] =
      [];
    await this.createServiceRequestRecurringDate(
      serviceRequestMaster.id,
      payload.recurring,
      queryRunner,
    );
    const serviceRequestCreationDate = moment(payload.start_date);
    const serviceRequestEndDate = moment(payload.recurring.end_date);
    const maxEndDate = moment(payload.start_date).add(1, 'year');

    if (serviceRequestEndDate.isAfter(maxEndDate))
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_MAX_END_DATE_REACHED,
      );

    const serviceRequestCalcDates = payload.recurring.days
      .map((d) => {
        return payload.recurring.repeat_type === ServiceRequestRepeatType.Weekly
          ? this.getNextServiceDateWeekly(
              serviceRequestCreationDate,
              payload.recurring.repeat,
              d,
              serviceRequestEndDate,
              [],
            )
          : this.getNextServiceDateMonthly(
              serviceRequestCreationDate,
              payload.recurring.repeat,
              d,
              serviceRequestEndDate,
              [],
            );
      })
      .flat();
    const recurringServiceRequests =
      this.createServiceRequestMasterRecurringLog(
        serviceRequestMaster,
        user,
        serviceRequestCalcDates,
        preferredVendors.length > 0
          ? ServiceRequestStatus.Claimed
          : ServiceRequestStatus.NotYetAssigned,
      );
    const newServiceRequestMasters = await queryRunner.manager.save(
      ServiceRequestMasterModel,
      recurringServiceRequests,
    );
    if (payload?.linen_properties) {
      const linenModels = newServiceRequestMasters.map((sr) => {
        return this.createLinenOrderModel(
          sr.id,
          payload.service_type_id,
          payload.linen_properties,
        );
      });
      await queryRunner.manager.save(
        ServiceRequestLinenDetailModel,
        linenModels,
      );
    }
    const newSr = newServiceRequestMasters.map((sr) => {
      const serviceRequestRecurringLog = new ServiceRequestRecurringLogModel();
      serviceRequestRecurringLog.main_service_request_master_id =
        serviceRequestMaster.id;
      serviceRequestRecurringLog.new_service_request_master_id = sr.id;

      const srPrefVendors = preferredVendors.map((vendor) => {
        const serviceRequestVendorStatusModel =
          new ServiceRequestVendorStatusModel();
        serviceRequestVendorStatusModel.service_request_master_id = sr.id;
        serviceRequestVendorStatusModel.vendor_id = vendor.vendor_id;
        serviceRequestVendorStatusModel.status = ServiceRequestStatus.Claimed;
        return serviceRequestVendorStatusModel;
      });
      serviceRequestVendorStatusModels = [
        ...serviceRequestVendorStatusModels,
        ...srPrefVendors,
      ];
      return serviceRequestRecurringLog;
    });

    if (serviceRequestVendorStatusModels.length > 0)
      await queryRunner.manager.save(
        ServiceRequestVendorStatusModel,
        serviceRequestVendorStatusModels,
      );

    return await queryRunner.manager.save(
      ServiceRequestRecurringLogModel,
      newSr,
    );
  }

  createServiceRequestMasterRecurringLog(
    mainServiceRequest: ServiceRequestMasterModel,
    user: JwtPayload,
    dates: moment.Moment[],
    status: ServiceRequestStatus,
  ) {
    return dates.map((date) => {
      const serviceRequestMaster = new ServiceRequestMasterModel();
      let computedEndDate = null;

      if (mainServiceRequest?.start_date && mainServiceRequest?.end_date) {
        const startDate = moment(mainServiceRequest?.start_date);
        const endDate = moment(mainServiceRequest?.end_date);
        const differenceInDays = endDate.diff(startDate, 'days');
        computedEndDate = moment(date).add(differenceInDays, 'days');
      }
      serviceRequestMaster.start_date = date.toDate();
      serviceRequestMaster.end_date = computedEndDate
        ? computedEndDate.toDate()
        : null;
      serviceRequestMaster.created_by =
        user.user_type === UserType.StandardAdmin
          ? Number(user.franchise_admin)
          : Number(user.id);
      serviceRequestMaster.status = status;
      serviceRequestMaster.franchise_id = Number(user.franchise_id);
      serviceRequestMaster.owner_id = mainServiceRequest.owner_id;
      serviceRequestMaster.priority = mainServiceRequest.priority;
      serviceRequestMaster.description = mainServiceRequest.description;
      serviceRequestMaster.turn_over = mainServiceRequest.turn_over;
      serviceRequestMaster.service_type_id = mainServiceRequest.service_type_id;
      serviceRequestMaster.is_occupied = mainServiceRequest.is_occupied;
      serviceRequestMaster.property_master_id =
        mainServiceRequest.property_master_id;
      serviceRequestMaster.owner_approval_status = OwnerApprovalStatus.Approved;

      return serviceRequestMaster;
    });
  }

  async addServiceRequestMedia(
    serviceRequestMasterId: number,
    files: string[],
    user: JwtPayload,
    queryRunner: QueryRunner,
    noteId: number | null = null,
  ) {
    const serviceReqMediaModels = files.map((file) => {
      const serviceReqMedia = new ServiceRequestMediaModel();
      serviceReqMedia.service_request_master_id = serviceRequestMasterId;
      serviceReqMedia.media_url = file;
      serviceReqMedia.media_type = this.s3Service.getFileType(file);
      noteId && (serviceReqMedia.service_request_note_id = noteId);
      serviceReqMedia.media_added_by = user
        ? user.user_type === UserType.StandardAdmin
          ? Number(user.franchise_admin)
          : Number(user.id)
        : null;
      return serviceReqMedia;
    });

    return await queryRunner.manager.save(
      ServiceRequestMediaModel,
      serviceReqMediaModels,
    );
  }

  createLinenOrderModel(
    serviceRequestMasterId: number,
    serviceTypeId: number,
    linenProperties: LinenPropertiesDto,
  ): ServiceRequestLinenDetailModel {
    const serviceRequestLinenDetailModel = new ServiceRequestLinenDetailModel();

    serviceRequestLinenDetailModel.service_request_master_id =
      serviceRequestMasterId;
    serviceRequestLinenDetailModel.service_type_id = serviceTypeId;
    serviceRequestLinenDetailModel.delivery_type =
      linenProperties.delivery_type;
    serviceRequestLinenDetailModel.number_of_bedrooms =
      linenProperties.number_of_bedrooms;
    serviceRequestLinenDetailModel.number_of_full_bathrooms =
      linenProperties.number_of_full_bathrooms ?? null;
    serviceRequestLinenDetailModel.number_of_one_fifth_bathrooms =
      linenProperties.number_of_one_fifth_bathrooms ?? null;
    serviceRequestLinenDetailModel.number_of_guests =
      linenProperties.number_of_guests ?? null;
    serviceRequestLinenDetailModel.number_of_king_beds =
      linenProperties.number_of_king_beds ?? null;
    serviceRequestLinenDetailModel.number_of_queen_beds =
      linenProperties.number_of_queen_beds ?? null;
    serviceRequestLinenDetailModel.number_of_full_beds =
      linenProperties.number_of_full_beds ?? null;
    serviceRequestLinenDetailModel.number_of_twin_beds =
      linenProperties.number_of_twin_beds ?? null;
    serviceRequestLinenDetailModel.number_of_bath_towel_sets =
      linenProperties.number_of_bath_towel_sets ?? null;
    serviceRequestLinenDetailModel.number_of_kitchen_sets =
      linenProperties.number_of_kitchen_sets ?? null;
    serviceRequestLinenDetailModel.number_of_bath_mat_sets =
      linenProperties.number_of_bath_mat_sets ?? null;
    serviceRequestLinenDetailModel.number_of_beach_towels =
      linenProperties.number_of_beach_towels ?? null;
    serviceRequestLinenDetailModel.number_of_hand_towel_sets =
      linenProperties.number_of_hand_towel_sets ?? null;
    serviceRequestLinenDetailModel.total_charges =
      linenProperties.total_charges;

    return serviceRequestLinenDetailModel;
  }

  async createLinenOrder(
    linenProperties: LinenPropertiesDto,
    serviceRequestMasterId: number,
    serviceTypeId: number,
    queryRunner: QueryRunner,
  ): Promise<ServiceRequestLinenDetailModel> {
    let serviceRequestLinenDetailModel: ServiceRequestLinenDetailModel =
      await this.serviceRequestLinenDetailRepository.findOne({
        where: {
          service_request_master_id: serviceRequestMasterId,
        },
      });

    if (!serviceRequestLinenDetailModel)
      serviceRequestLinenDetailModel = new ServiceRequestLinenDetailModel();

    serviceRequestLinenDetailModel.service_request_master_id =
      serviceRequestMasterId;
    serviceRequestLinenDetailModel.service_type_id = serviceTypeId;
    serviceRequestLinenDetailModel.delivery_type =
      linenProperties.delivery_type;
    serviceRequestLinenDetailModel.number_of_bedrooms =
      linenProperties.number_of_bedrooms;
    serviceRequestLinenDetailModel.bedroom_price =
      linenProperties.bedroom_price ?? 0;
    serviceRequestLinenDetailModel.number_of_full_bathrooms =
      linenProperties.number_of_full_bathrooms ?? null;
    serviceRequestLinenDetailModel.full_bathroom_price =
      linenProperties.full_bathroom_price ?? 0;
    serviceRequestLinenDetailModel.number_of_one_fifth_bathrooms =
      linenProperties.number_of_one_fifth_bathrooms ?? null;
    serviceRequestLinenDetailModel.one_fifth_bathroom_price =
      linenProperties.one_fifth_bathroom_price ?? 0;
    serviceRequestLinenDetailModel.number_of_guests =
      linenProperties.number_of_guests ?? null;
    serviceRequestLinenDetailModel.guest_price =
      linenProperties.guest_price ?? 0;
    serviceRequestLinenDetailModel.number_of_king_beds =
      linenProperties.number_of_king_beds ?? null;
    serviceRequestLinenDetailModel.king_bed_price =
      linenProperties.king_bed_price ?? 0;
    serviceRequestLinenDetailModel.number_of_queen_beds =
      linenProperties.number_of_queen_beds ?? null;
    serviceRequestLinenDetailModel.queen_bed_price =
      linenProperties.queen_bed_price ?? 0;
    serviceRequestLinenDetailModel.number_of_full_beds =
      linenProperties.number_of_full_beds ?? null;
    serviceRequestLinenDetailModel.full_bed_price =
      linenProperties.full_bed_price ?? 0;
    serviceRequestLinenDetailModel.number_of_twin_beds =
      linenProperties.number_of_twin_beds ?? null;
    serviceRequestLinenDetailModel.twin_bed_price =
      linenProperties.twin_bed_price ?? 0;
    serviceRequestLinenDetailModel.number_of_bath_towel_sets =
      linenProperties.number_of_bath_towel_sets ?? null;
    serviceRequestLinenDetailModel.bath_towel_set_price =
      linenProperties.bath_towel_set_price ?? 0;
    serviceRequestLinenDetailModel.number_of_kitchen_sets =
      linenProperties.number_of_kitchen_sets ?? null;
    serviceRequestLinenDetailModel.kitchen_set_price =
      linenProperties.kitchen_set_price ?? 0;
    serviceRequestLinenDetailModel.number_of_bath_mat_sets =
      linenProperties.number_of_bath_mat_sets ?? null;
    serviceRequestLinenDetailModel.bath_mat_set_price =
      linenProperties.bath_mat_set_price ?? 0;
    serviceRequestLinenDetailModel.number_of_beach_towels =
      linenProperties.number_of_beach_towels ?? null;
    serviceRequestLinenDetailModel.beach_towel_price =
      linenProperties.beach_towel_price ?? 0;
    serviceRequestLinenDetailModel.number_of_hand_towel_sets =
      linenProperties.number_of_hand_towel_sets ?? null;
    serviceRequestLinenDetailModel.hand_towel_set_price =
      linenProperties.hand_towel_set_price ?? 0;
    serviceRequestLinenDetailModel.total_charges =
      linenProperties.total_charges;

    return await queryRunner.manager.save(
      ServiceRequestLinenDetailModel,
      serviceRequestLinenDetailModel,
    );
  }

  async createServiceRequestRecurringDate(
    serviceRequestMasterId: number,
    recurring: RecurringDto,
    queryRunner: QueryRunner,
  ) {
    const serviceRequestRecurringDate = new ServiceRequestRecurringDateModel();

    serviceRequestRecurringDate.service_request_master_id =
      serviceRequestMasterId;
    serviceRequestRecurringDate.repeat_type = recurring.repeat_type;
    serviceRequestRecurringDate.repeat = recurring.repeat;
    serviceRequestRecurringDate.end_date = recurring.end_date;
    serviceRequestRecurringDate.days = recurring.days;

    await queryRunner.manager.save(
      ServiceRequestRecurringDateModel,
      serviceRequestRecurringDate,
    );
  }

  async deleteServiceRequestRecurringDate(
    serviceRequestMasterId: number,
    queryRunner: QueryRunner,
  ) {
    await queryRunner.manager.delete(ServiceRequestRecurringDateModel, {
      service_request_master_id: serviceRequestMasterId,
    });
  }

  async editServiceRequestV2(payload: EditServiceRequestDto, user: JwtPayload) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      if (
        payload.vendor_ids &&
        payload?.distribution_type !== DistributionType.SelectedVendor &&
        [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        )
      )
        throw new ForbiddenException(
          ServiceRequestMessage.CANNOT_ASSIGN_VENDOR,
        );

      const serviceRequestMasterModel: ServiceRequestMasterModel =
        await this.serviceRequestMasterRepository.findOne({
          where: {
            id: payload.service_request_id,
            franchise_id: Number(user.franchise_id),
            is_deleted: false,
          },
        });

      if (!serviceRequestMasterModel)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      if (
        ![
          ServiceRequestStatus.NotYetAssigned,
          ServiceRequestStatus.Claimed,
          ServiceRequestStatus.Scheduled,
        ].includes(serviceRequestMasterModel.status)
      )
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_EDIT_STATUS,
        );

      serviceRequestMasterModel.description = payload.description;
      serviceRequestMasterModel.priority = payload.priority;
      serviceRequestMasterModel.start_date = payload.start_date;
      serviceRequestMasterModel.turn_over =
        payload?.turn_over ?? serviceRequestMasterModel.turn_over;
      serviceRequestMasterModel.display_to_vendor =
        payload?.display_to_vendor === undefined
          ? serviceRequestMasterModel.display_to_vendor
          : payload?.display_to_vendor;
      serviceRequestMasterModel.is_occupied =
        payload?.is_occupied === undefined
          ? serviceRequestMasterModel.is_occupied
          : payload?.is_occupied;
      serviceRequestMasterModel.end_date = payload?.end_date
        ? payload.end_date
        : null;
      serviceRequestMasterModel.is_recurring =
        payload?.is_recurring !== undefined
          ? payload?.is_recurring
          : serviceRequestMasterModel.is_recurring;
      user.user_type === UserType.FranchiseAdmin &&
        payload?.notes_for_vendor &&
        (serviceRequestMasterModel.notes_for_vendor =
          payload?.notes_for_vendor ??
          serviceRequestMasterModel.notes_for_vendor);

      const franchiseServiceType =
        await this.franchiseServiceTypeRepository.findOne({
          where: {
            service_type_id: payload.service_type_id,
            franchise_id: Number(user.franchise_id),
          },
          relations: ['serviceType'],
        });

      const preferredVendors: VendorServiceTypePriorityModel[] =
        await this.vendorServiceTypePriorityRepository.find(
          {
            service_type_id: franchiseServiceType?.serviceType
              ?.is_guest_concierge
              ? franchiseServiceType.associated_service_type_id
              : payload.service_type_id,
            property_master_id: serviceRequestMasterModel.property_master_id,
            franchise_id: Number(user.franchise_id),
          },
          null,
          ['vendor'],
        );

      if (
        Number(serviceRequestMasterModel.service_type_id) !==
        Number(payload.service_type_id)
      ) {
        serviceRequestMasterModel.vendor_id = null;
        serviceRequestMasterModel.service_type_id = payload.service_type_id;
        serviceRequestMasterModel.vendor_distribution_type =
          payload?.distribution_type ??
          (preferredVendors.length > 0
            ? DistributionType.PreferredVendor
            : DistributionType.DistributeToAllVendors);
        serviceRequestMasterModel.status =
          serviceRequestMasterModel.vendor_distribution_type ===
          DistributionType.DistributeToAllVendors
            ? ServiceRequestStatus.NotYetAssigned
            : ServiceRequestStatus.Claimed;
        payload.distribution_type =
          serviceRequestMasterModel.vendor_distribution_type;
      }

      if (
        (payload?.distribution_type &&
          payload?.distribution_type !==
            serviceRequestMasterModel.vendor_distribution_type) ||
        Number(serviceRequestMasterModel.service_type_id) !==
          Number(payload.service_type_id) ||
        (payload?.distribution_type === DistributionType.SelectedVendor &&
          serviceRequestMasterModel.vendor_distribution_type ===
            DistributionType.SelectedVendor)
      ) {
        serviceRequestMasterModel.vendor_distribution_type =
          payload?.distribution_type;
        await this.handleVendorDistributionType(
          serviceRequestMasterModel,
          payload,
          queryRunner,
          preferredVendors,
          user,
        );
      } else {
        const serviceRequestVendors =
          await this.serviceRequestVendorStatusRepository.find({
            service_request_master_id: payload.service_request_id,
            status: ServiceRequestStatus.Claimed,
          });
        const vendorIds =
          serviceRequestMasterModel.status === ServiceRequestStatus.Scheduled
            ? [serviceRequestMasterModel.vendor_id]
            : serviceRequestVendors.map((vendor) => vendor.vendor_id);
        const [vendors, franchiseAdmin] = await Promise.all([
          this.userRepository.find({
            id: In(vendorIds),
            user_type: UserType.Vendor,
            franchise_id: Number(user.franchise_id),
          }),
          this.userRepository.findOne({
            where: {
              user_type: UserType.FranchiseAdmin,
              franchise_id: Number(user.franchise_id),
            },
          }),
        ]);
        await this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_UPDATE,
          {
            link: `${this.configService.get('PORTAL_FRONTEND_URL')}/login`,
            job_id: serviceRequestMasterModel.id.toString(),
          },
          [...vendors.map((vendor) => vendor.email), franchiseAdmin.email],
          [...vendors.map((vendor) => vendor.contact), franchiseAdmin.contact],
        );
      }

      const serviceRequestModel = await queryRunner.manager.save(
        ServiceRequestMasterModel,
        serviceRequestMasterModel,
      );

      if (payload.files && payload.files.length > 0) {
        await queryRunner.manager.delete(ServiceRequestMediaModel, {
          service_request_master_id: payload.service_request_id,
          service_request_note_id: IsNull(),
          // media_added_by: Number(user.id),
        });
        await this.addServiceRequestMedia(
          payload.service_request_id,
          payload.files,
          user,
          queryRunner,
        );
      }

      if (payload?.linen_properties)
        await this.createLinenOrder(
          payload?.linen_properties,
          payload.service_request_id,
          payload.service_type_id,
          queryRunner,
        );

      if (payload?.is_recurring !== undefined) {
        await this.deleteServiceRequestRecurringDate(
          payload.service_request_id,
          queryRunner,
        );
        const newServiceRequests =
          await this.serviceRequestRecurringLogRepository.find({
            main_service_request_master_id: payload.service_request_id,
          });
        const newServiceRequestIds = newServiceRequests.map(
          (sr) => sr.new_service_request_master_id,
        );
        await queryRunner.manager.delete(ServiceRequestRecurringLogModel, {
          main_service_request_master_id: payload.service_request_id,
        });
        await queryRunner.manager.delete(ServiceRequestLinenDetailModel, {
          service_request_master_id: In(newServiceRequestIds),
        });
        await queryRunner.manager.delete(ServiceRequestVendorStatusModel, {
          service_request_master_id: In(newServiceRequestIds),
          status: ServiceRequestStatus.Claimed,
        });
        await queryRunner.manager.delete(ServiceRequestMasterModel, {
          id: In(newServiceRequestIds),
          status: In([
            ServiceRequestStatus.NotYetAssigned,
            ServiceRequestStatus.Claimed,
          ]),
        });
        if (payload?.is_recurring && payload?.recurring) {
          await this.processRecurringServiceRequest(
            queryRunner,
            payload,
            serviceRequestModel,
            user,
            preferredVendors,
          );
        }
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handleVendorDistributionType(
    serviceRequestMasterModel: ServiceRequestMasterModel,
    payload: EditServiceRequestDto,
    queryRunner: QueryRunner,
    preferredVendors: VendorServiceTypePriorityModel[],
    user: JwtPayload,
  ): Promise<ServiceRequestMasterModel> {
    if (!payload?.distribution_type) return serviceRequestMasterModel;

    if (
      payload?.distribution_type === DistributionType.DistributeToAllVendors
    ) {
      serviceRequestMasterModel.status = ServiceRequestStatus.NotYetAssigned;
      serviceRequestMasterModel.vendor_id = null;
      await queryRunner.manager.delete(ServiceRequestVendorStatusModel, {
        service_request_master_id: serviceRequestMasterModel.id,
        status: ServiceRequestStatus.Claimed,
      });
      return serviceRequestMasterModel;
    }

    if (payload?.distribution_type === DistributionType.PreferredVendor) {
      serviceRequestMasterModel.vendor_id = null;
      await queryRunner.manager.delete(ServiceRequestVendorStatusModel, {
        service_request_master_id: serviceRequestMasterModel.id,
        status: ServiceRequestStatus.Claimed,
      });
      const srPrefVendors = preferredVendors.map((vendor) => {
        const serviceRequestVendorStatusModel =
          new ServiceRequestVendorStatusModel();
        serviceRequestVendorStatusModel.service_request_master_id =
          serviceRequestMasterModel.id;
        serviceRequestVendorStatusModel.vendor_id = vendor.vendor_id;
        serviceRequestVendorStatusModel.status = ServiceRequestStatus.Claimed;
        return serviceRequestVendorStatusModel;
      });
      await queryRunner.manager.save(
        ServiceRequestVendorStatusModel,
        srPrefVendors,
      );
      serviceRequestMasterModel.status =
        preferredVendors.length > 0
          ? ServiceRequestStatus.Claimed
          : ServiceRequestStatus.NotYetAssigned;

      this.notificationsService.sendNotification(
        NotificationAction.BULK_VENDOR_ASSIGNED,
        {
          link: `${this.configService.get('PORTAL_FRONTEND_URL')}/login`,
          job_id: serviceRequestMasterModel.id.toString(),
        },
        preferredVendors.map((vendor) => vendor.vendor.email),
        preferredVendors.map((vendor) => vendor.vendor.contact),
      );
      return serviceRequestMasterModel;
    }

    if (
      payload?.distribution_type === DistributionType.SelectedVendor &&
      payload?.vendor_ids?.length
    ) {
      if (
        serviceRequestMasterModel.status === ServiceRequestStatus.Scheduled &&
        serviceRequestMasterModel.vendor_distribution_type ===
          DistributionType.SelectedVendor &&
        payload?.vendor_ids.length === 1 &&
        Number(serviceRequestMasterModel.vendor_id) ===
          Number(payload?.vendor_ids[0])
      ) {
        const vendor: UserModel = await this.userRepository.findOne({
          where: {
            id: serviceRequestMasterModel.vendor_id,
            user_type: UserType.Vendor,
            franchise_id: Number(serviceRequestMasterModel.franchise_id),
          },
        });
        this.notificationsService.sendNotification(
          NotificationAction.SERVICE_REQUEST_UPDATE,
          {
            link: `${this.configService.get('PORTAL_FRONTEND_URL')}/login`,
            job_id: serviceRequestMasterModel.id.toString(),
          },
          [vendor.email],
          [vendor.contact],
        );
        return serviceRequestMasterModel;
      }
      serviceRequestMasterModel.vendor_id = null;
      await queryRunner.manager.delete(ServiceRequestVendorStatusModel, {
        service_request_master_id: serviceRequestMasterModel.id,
        status: ServiceRequestStatus.Claimed,
      });
      serviceRequestMasterModel.status = ServiceRequestStatus.Claimed;
      const srPrefVendors = payload.vendor_ids.map((vendor) => {
        const serviceRequestVendorStatusModel =
          new ServiceRequestVendorStatusModel();
        serviceRequestVendorStatusModel.service_request_master_id =
          serviceRequestMasterModel.id;
        serviceRequestVendorStatusModel.vendor_id = vendor;
        serviceRequestVendorStatusModel.status = ServiceRequestStatus.Claimed;
        return serviceRequestVendorStatusModel;
      });
      await queryRunner.manager.save(
        ServiceRequestVendorStatusModel,
        srPrefVendors,
      );
      const users = await this.userRepository.find({
        id: In(payload.vendor_ids),
        user_type: UserType.Vendor,
        franchise_id: Number(user.franchise_id),
      });
      this.notificationsService.sendNotification(
        NotificationAction.BULK_VENDOR_ASSIGNED,
        {
          link: `${this.configService.get('PORTAL_FRONTEND_URL')}/login`,
          job_id: serviceRequestMasterModel.id.toString(),
        },
        users.map((user) => user.email),
        users.map((user) => user.contact),
      );
      return serviceRequestMasterModel;
    }

    return serviceRequestMasterModel;
  }

  async createServiceRequestVendorStatus(
    serviceRequestMasterd: number,
    vendorIds: number[],
    status: ServiceRequestStatus,
    queryRunner: QueryRunner,
  ): Promise<ServiceRequestVendorStatusModel[]> {
    const serviceRequestVendorStatusModels: ServiceRequestVendorStatusModel[] =
      vendorIds.map((vendorId) => {
        const serviceRequestVendorStatusModel =
          new ServiceRequestVendorStatusModel();
        serviceRequestVendorStatusModel.service_request_master_id =
          serviceRequestMasterd;
        serviceRequestVendorStatusModel.vendor_id = vendorId;
        serviceRequestVendorStatusModel.status = status;
        return serviceRequestVendorStatusModel;
      });

    return await queryRunner.manager.save(
      ServiceRequestVendorStatusModel,
      serviceRequestVendorStatusModels,
    );
  }

  async verifyVendor(
    vendorIds: number[],
    serviceTypeId: number,
    serviceLocationId: number,
    user: JwtPayload,
  ): Promise<UserModel[]> {
    const vendors: UserModel[] = await this.userRepository.find({
      id: In(vendorIds),
      is_deleted: false,
      is_approved: true,
      user_type: UserType.Vendor,
      franchise_id: Number(user.franchise_id),
    });
    if (vendors.length !== vendorIds.length)
      throw new BadRequestException(ServiceRequestMessage.VENDORS_INACTIVE);

    const vendorServiceTypeModels: VendorServiceTypeModel[] =
      await this.vendorServiceTypeRepository.find({
        service_type_id: serviceTypeId,
        franchise_id: Number(user.franchise_id),
      });

    if (
      !vendorServiceTypeModels.some((v) =>
        vendorIds.includes(Number(v.vendor_id)),
      )
    )
      throw new BadRequestException(ServiceRequestMessage.VENDOR_SERVICE_TYPE);

    const vendorServiceLocationModel: VendorServiceLocationModel[] =
      await this.vendorServiceLocationRepository.find({
        franchise_id: Number(user.franchise_id),
        service_location_id: serviceLocationId,
      });

    if (
      !vendorServiceLocationModel.some(
        (v) => !vendorIds.includes(Number(v.vendor_id)),
      )
    )
      throw new BadRequestException(ServiceRequestMessage.VENDOR_SERVICE_LOC);

    return vendors;
  }

  async claimServiceRequest(
    payload: ClaimServiceRequestDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const [serviceRequest, franchiseAdmin] = await Promise.all([
        this.serviceRequestMasterRepository.findOne({
          where: {
            id: payload.service_request_id,
            franchise_id: Number(user.franchise_id),
            is_deleted: false,
          },
          relations: ['propertyMaster', 'vendor', 'owner', 'creator'],
        }),
        this.userRepository.findOne({
          where: {
            user_type: UserType.FranchiseAdmin,
            franchise_id: Number(user.franchise_id),
          },
        }),
      ]);

      if (
        !serviceRequest ||
        Number(user.franchise_id) !== Number(serviceRequest.franchise_id)
      )
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      const vendorServiceType: VendorServiceTypeModel =
        await this.vendorServiceTypeRepository.findOne({
          where: {
            vendor_id: user.id,
            franchise_id: Number(user.franchise_id),
            service_type_id: serviceRequest.service_type_id,
          },
        });

      if (!vendorServiceType)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_EDIT_STATUS,
        );

      if (
        ![
          ServiceRequestStatus.Claimed,
          ServiceRequestStatus.NotYetAssigned,
        ].includes(serviceRequest.status)
      )
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_EDIT_STATUS,
        );

      const nextPossibleStatuses = getNextStatuses(serviceRequest.status);

      if (
        !nextPossibleStatuses ||
        (nextPossibleStatuses.length > 0 &&
          !nextPossibleStatuses.includes(payload.status))
      )
        throw new BadRequestException(ServiceRequestMessage.INVALID_ATTEMPT);

      if (serviceRequest.vendor_id)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_ALREADY_ASSIGN,
        );

      if (serviceRequest.status === ServiceRequestStatus.Claimed) {
        const isAssignedToVendor =
          await this.serviceRequestVendorStatusRepository.findOne({
            where: {
              service_request_master_id: serviceRequest.id,
              status: ServiceRequestStatus.Claimed,
              vendor_id: user.id,
            },
          });

        if (!isAssignedToVendor)
          throw new BadRequestException(
            ServiceRequestMessage.SERVICE_ALREADY_ASSIGN,
          );
      }

      const vendorInformation: UserModel = await this.userRepository.findOne({
        where: {
          id: user.id,
          franchise_id: Number(user.franchise_id),
          is_approved: true,
        },
      });

      if (!vendorInformation)
        throw new BadRequestException(ServiceRequestMessage.VENDOR_NOT_ACTIVE);

      await queryRunner.manager.update(
        ServiceRequestMasterModel,
        { id: serviceRequest.id },
        { vendor_id: user.id, status: payload.status },
      );

      await queryRunner.manager.delete(ServiceRequestVendorStatusModel, {
        service_request_master_id: serviceRequest.id,
        status: ServiceRequestStatus.Claimed,
      });

      await queryRunner.commitTransaction();

      this.serviceRequestNotificationService.sendServiceRequestClaimNotifications(
        serviceRequest,
        franchiseAdmin,
        vendorInformation,
        payload.status,
      );

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteServiceRequest(
    serviceRequestId: number,
    user: JwtPayload,
    payload: CancelServiceRequestDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      let vendorIds: number[] = [],
        vendors: UserModel[] = [];
      const [serviceRequestMasterModel, franchiseAdmin] = await Promise.all([
        this.serviceRequestMasterRepository.findOne({
          where: {
            id: serviceRequestId,
            franchise_id: Number(user.franchise_id),
            is_deleted: false,
          },
          relations: ['propertyMaster', 'vendor', 'owner', 'creator'],
        }),
        this.userRepository.findOne({
          where: {
            franchise_id: Number(user.franchise_id),
            user_type: UserType.FranchiseAdmin,
          },
        }),
      ]);

      if (!serviceRequestMasterModel)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      if (
        [
          ServiceRequestStatus.PartiallyCompleted,
          ServiceRequestStatus.CompletedSuccessfully,
          ServiceRequestStatus.Cancelled,
        ].includes(serviceRequestMasterModel.status)
      )
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_DELETE_STATUS,
        );

      if (
        [
          ServiceRequestStatus.Scheduled,
          ServiceRequestStatus.InProgress,
        ].includes(serviceRequestMasterModel.status)
      ) {
        vendorIds = [serviceRequestMasterModel.vendor_id];
      } else if (
        serviceRequestMasterModel.status === ServiceRequestStatus.Claimed
      ) {
        const serviceRequestAssignVendors =
          await this.serviceRequestVendorStatusRepository.find({
            service_request_master_id: serviceRequestMasterModel.id,
            status: ServiceRequestStatus.Claimed,
          });
        vendorIds = serviceRequestAssignVendors.map(
          (vendor) => vendor.vendor_id,
        );
        await queryRunner.manager.delete(ServiceRequestVendorStatusModel, {
          service_request_master_id: serviceRequestMasterModel.id,
          status: ServiceRequestStatus.Claimed,
        });
      }

      if (vendorIds.length > 0) {
        vendors = await this.userRepository.find({
          id: In(vendorIds),
        });
      }

      serviceRequestMasterModel.is_deleted = true;
      serviceRequestMasterModel.cancelled_at_status =
        serviceRequestMasterModel.status;
      serviceRequestMasterModel.cancelled_by = user.id;
      serviceRequestMasterModel.status = ServiceRequestStatus.Cancelled;
      serviceRequestMasterModel.cancel_reason = payload.cancel_reason ?? null;

      const updServiceRequest = await queryRunner.manager.save(
        ServiceRequestMasterModel,
        serviceRequestMasterModel,
      );
      await queryRunner.commitTransaction();
      await this.serviceRequestNotificationService.sendServiceRequestCancellationNotifications(
        serviceRequestMasterModel,
        franchiseAdmin,
        vendors,
      );
      return updServiceRequest;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getServiceRequestMedia(serviceRequestId: number) {
    const serviceRequestMedias = await this.serviceRequestMediaRepository.find({
      service_request_master_id: serviceRequestId,
      service_request_note_id: IsNull(),
    });

    return await Promise.all(
      serviceRequestMedias.map(async (d) => {
        d.image_url = await this.getDownloadUrl(d.media_url);
        return d;
      }),
    );
  }

  async getServiceRequest(serviceRequestId: number, user: JwtPayload) {
    const serviceRequestMasterModel: ServiceRequestMasterModel =
      await this.serviceRequestMasterRepository.getServiceRequestById(
        serviceRequestId,
        user,
      );

    if (!serviceRequestMasterModel)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
      );

    if (
      user.user_type === UserType.Vendor &&
      [
        ServiceRequestStatus.Scheduled,
        ServiceRequestStatus.InProgress,
        ServiceRequestStatus.PartiallyCompleted,
        ServiceRequestStatus.CompletedSuccessfully,
        ServiceRequestStatus.DepositRequired,
      ].includes(serviceRequestMasterModel.status) &&
      Number(serviceRequestMasterModel.vendor_id) !== Number(user.id)
    )
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
      );

    if (
      user.user_type === UserType.Vendor &&
      serviceRequestMasterModel.status === ServiceRequestStatus.Claimed
    ) {
      const isClaimedByVendor =
        await this.serviceRequestVendorStatusRepository.findOne({
          where: {
            service_request_master_id: serviceRequestMasterModel.id,
            status: ServiceRequestStatus.Claimed,
            vendor_id: user.id,
          },
        });

      if (!isClaimedByVendor)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );
    }

    if (
      user.user_type === UserType.Owner &&
      Number(serviceRequestMasterModel.owner_id) !== Number(user.id)
    )
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
      );

    if (serviceRequestMasterModel.serviceRequestMedia) {
      serviceRequestMasterModel.serviceRequestMedia = await Promise.all(
        serviceRequestMasterModel.serviceRequestMedia.map(async (d) => {
          d.image_url = await this.getDownloadUrl(d.media_url);
          return d;
        }),
      );
    }

    serviceRequestMasterModel.serviceRequestNote = await Promise.all(
      serviceRequestMasterModel.serviceRequestNote.map(async (note) => {
        note.serviceRequestMedia = await Promise.all(
          note.serviceRequestMedia.map(async (media) => {
            media.image_url = await this.getDownloadUrl(media.media_url);
            return media;
          }),
        );
        return note;
      }),
    );

    if (
      serviceRequestMasterModel?.serviceType?.standard_hourly &&
      serviceRequestMasterModel?.vendor?.vendorServiceType?.length > 0
    ) {
      serviceRequestMasterModel.hourly_rate =
        serviceRequestMasterModel?.vendor?.vendorServiceType[0].hourly_rate;
      serviceRequestMasterModel.service_call_fee =
        serviceRequestMasterModel?.vendor?.vendorServiceType[0].service_call_fee;
    } else if (
      serviceRequestMasterModel?.serviceType?.is_handyman_concierge &&
      serviceRequestMasterModel?.serviceType?.franchiseServiceType?.length
    ) {
      serviceRequestMasterModel.hourly_rate =
        serviceRequestMasterModel?.serviceType?.franchiseServiceType[0].hourly_rate;
      serviceRequestMasterModel.service_call_fee =
        serviceRequestMasterModel?.serviceType?.franchiseServiceType[0].service_call_fee;
    }

    serviceRequestMasterModel.can_create_child_request =
      await this.canCreateChildRequest(serviceRequestMasterModel, user);

    return serviceRequestMasterModel;
  }

  async canCreateChildRequest(
    serviceRequestMasterModel: ServiceRequestMasterModel,
    user: JwtPayload,
  ): Promise<boolean> {
    if (
      !serviceRequestMasterModel ||
      serviceRequestMasterModel.parent_id ||
      serviceRequestMasterModel.is_guest_concierge ||
      ![
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.Vendor,
      ].includes(user.user_type)
    ) {
      return false;
    }

    if (user.user_type === UserType.Vendor) {
      return await this.canVendorCreateChildRequest(
        serviceRequestMasterModel,
        user,
      );
    }

    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type)
    ) {
      return this.canFranchiseAdminCreateChildRequest(
        serviceRequestMasterModel,
      );
    }

    return false;
  }

  private async canVendorCreateChildRequest(
    serviceRequestMasterModel: ServiceRequestMasterModel,
    user: JwtPayload,
  ): Promise<boolean> {
    if (
      serviceRequestMasterModel.status !==
      ServiceRequestStatus.PartiallyCompleted
    ) {
      return false;
    }

    const existingChildRequest =
      await this.serviceRequestMasterRepository.findOne({
        where: {
          parent_id: serviceRequestMasterModel.id,
          created_by: user.id,
        },
      });

    return !existingChildRequest;
  }

  private canFranchiseAdminCreateChildRequest(
    serviceRequestMasterModel: ServiceRequestMasterModel,
  ): boolean {
    return [
      ServiceRequestStatus.PartiallyCompleted,
      ServiceRequestStatus.CompletedSuccessfully,
      ServiceRequestStatus.InProgress,
    ].includes(serviceRequestMasterModel.status);
  }

  async getDownloadUrl(mediaUrl: string) {
    try {
      return await this.s3Service.getDownloadUrl(mediaUrl);
    } catch (err) {
      this.logger.error(`Download URL Issue == > ${JSON.stringify(err)}`);
      return null;
    }
  }

  async getAllServiceRequests(
    query: ServiceRequestQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<ServiceRequestMasterModel>> {
    if (query.download) {
      this.logger.log(
        '[EVENT] Emitting Service Request Listing report preparation event',
      );

      const { data, count } =
        await this.serviceRequestMasterRepository.getAllServiceRequest(
          null,
          query,
          user,
        );

      if (count >= Setting.MAX_DIRECT_DOWNLOAD_ROWS) {
        // Send via email
        this.eventEmitter.emit(
          DownloadReportEventName.SERVICE_REQUEST_LISTING,
          new GenericReportDownloadEvent(
            () =>
              this.serviceRequestMasterRepository.getAllServiceRequest(
                null,
                query,
                user,
                this.generalHelper.getDownloadableCsvCutoffTime(),
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
        this.generalHelper.getPaginationOptionsV2(query);

      const serviceRequestMasterModel =
        await this.serviceRequestMasterRepository.getAllServiceRequest(
          paginationParams,
          query,
          user,
        );

      if (!serviceRequestMasterModel)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      return serviceRequestMasterModel;
    }
  }

  async getUninvoicedServiceRequest(
    query: ServiceRequestQueryDto,
    user: JwtPayload,
  ) {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    return await this.serviceRequestMasterRepository.getUninvoicedServiceRequest(
      paginationParams,
      query,
      user,
    );
  }

  async releaseVendorFromServiceRequest(
    payload: ReleaseVendorDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const [serviceRequest, franchiseAdmin] = await Promise.all([
        this.serviceRequestMasterRepository.findOne({
          where: {
            id: payload.service_request_id,
            franchise_id: Number(user.franchise_id),
            is_deleted: false,
          },
          relations: ['propertyMaster', 'vendor', 'owner', 'creator'],
        }),
        this.userRepository.findOne({
          where: {
            user_type: UserType.FranchiseAdmin,
            franchise_id: Number(user.franchise_id),
          },
        }),
      ]);

      if (!serviceRequest)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      if (!serviceRequest.vendor_id)
        throw new BadRequestException(
          ServiceRequestMessage.VENDOR_NOT_ASSIGNED_YET,
        );

      if (
        user.user_type === UserType.Vendor &&
        Number(user.id) !== Number(serviceRequest.vendor_id)
      )
        throw new BadRequestException(
          ServiceRequestMessage.ONLY_ASSIGNED_VENDOR_CAN_RELEASE_ITSELF,
        );

      if (
        ![
          ServiceRequestStatus.Scheduled,
          ServiceRequestStatus.InProgress,
        ].includes(serviceRequest.status)
      )
        throw new BadRequestException(
          ServiceRequestMessage.CANNOT_RELEASE_VENDOR,
        );

      await queryRunner.manager.update(
        ServiceRequestMasterModel,
        { id: serviceRequest.id },
        {
          vendor_id: null,
          status: ServiceRequestStatus.NotYetAssigned,
          vendor_distribution_type: DistributionType.DistributeToAllVendors,
          invoice_master_id: null,
        },
      );

      await queryRunner.manager.delete(ServiceRequestVendorStatusModel, {
        service_request_master_id: serviceRequest.id,
      });

      await this.invoiceService.resetVendorInvoice(
        queryRunner,
        serviceRequest.id,
        serviceRequest.vendor_id,
      );

      serviceRequest.vendor_id = null;
      serviceRequest.status = ServiceRequestStatus.NotYetAssigned;

      await queryRunner.commitTransaction();
      await this.serviceRequestNotificationService.sendVendorReleaseFromJobNotifications(
        serviceRequest,
        user,
        franchiseAdmin,
      );

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async approveDiscrepancyOrGuestRequestByOwner(
    payload: OwnerDiscrepancyApproval,
    user: JwtPayload,
  ): Promise<ServiceRequestMasterModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const [serviceRequest, franchiseAdmin] = await Promise.all([
        await this.serviceRequestMasterRepository.findOne({
          where: [
            {
              id: payload.service_request_id,
              franchise_id: Number(user.franchise_id),
              is_deleted: false,
              is_discrepancy: true,
            },
            {
              id: payload.service_request_id,
              franchise_id: Number(user.franchise_id),
              is_deleted: false,
              is_guest: true,
            },
            {
              id: payload.service_request_id,
              franchise_id: Number(user.franchise_id),
              is_deleted: false,
              parent_id: Not(IsNull()),
            },
          ],
          relations: ['propertyMaster', 'owner'],
        }),
        this.userRepository.findOne({
          where: {
            user_type: UserType.FranchiseAdmin,
            franchise_id: Number(user.franchise_id),
          },
        }),
      ]);

      if (!serviceRequest)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      if (serviceRequest.parent_id) {
        const updSrModel = await this.approveChildServiceRequest(
          queryRunner,
          serviceRequest,
          user,
          payload,
        );
        await queryRunner.commitTransaction();
        return updSrModel;
      }

      if (!serviceRequest.is_discrepancy && !serviceRequest.is_guest)
        throw new BadRequestException(
          ServiceRequestMessage.DISCREPANCY_REQUEST_ALLOW_TO_APPROVED,
        );

      if (serviceRequest.propertyMaster.off_program)
        throw new BadRequestException(
          ServiceRequestMessage.PROPERTY_OFF_PROGRAM,
        );

      if (
        !payload.start_date &&
        payload.status === OwnerApprovalStatus.Approved
      )
        throw new BadRequestException(ServiceRequestMessage.VALID_START_DATE);

      if (Number(user.id) != Number(serviceRequest.propertyMaster.owner_id))
        throw new BadRequestException(
          ServiceRequestMessage.PROPERTY_OWNER_APPROVE_REQUEST,
        );

      if (
        serviceRequest.owner_approval_status !== OwnerApprovalStatus.UnApproved
      )
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_ALREADY_HAVE_THIS_STATUS,
        );

      serviceRequest.owner_approval_status = payload.status;

      if (payload.status === OwnerApprovalStatus.Reject) {
        serviceRequest.status = ServiceRequestStatus.Rejected;
        serviceRequest.is_archived = true;
      }

      if (payload.status === OwnerApprovalStatus.Approved) {
        serviceRequest.priority = ServiceRequestPriority.NonUrgent;
        serviceRequest.start_date = payload.start_date;

        const preferredVendors =
          await this.vendorServiceTypePriorityRepository.find({
            service_type_id: serviceRequest.service_type_id,
            property_master_id: serviceRequest.property_master_id,
            franchise_id: serviceRequest.franchise_id,
          });

        if (preferredVendors.length > 0)
          serviceRequest.status = ServiceRequestStatus.Claimed;

        const vendorIds = preferredVendors.map((vendor) => vendor.vendor_id);
        await this.createServiceRequestVendorStatus(
          serviceRequest.id,
          vendorIds,
          ServiceRequestStatus.Claimed,
          queryRunner,
        );
      }

      const serviceRequestMaster: ServiceRequestMasterModel =
        await queryRunner.manager.save(
          ServiceRequestMasterModel,
          serviceRequest,
        );

      await queryRunner.commitTransaction();
      await this.serviceRequestNotificationService.sendGuestAndDiscrepancyApprovalNotifications(
        serviceRequest,
        franchiseAdmin,
      );
      return serviceRequestMaster;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async approveChildServiceRequest(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    user: JwtPayload,
    payload: OwnerDiscrepancyApproval,
  ): Promise<ServiceRequestMasterModel> {
    if (
      ![UserType.StandardAdmin, UserType.FranchiseAdmin].includes(
        user.user_type,
      )
    )
      throw new BadRequestException(ServiceRequestMessage.INVALID_REQUEST);

    if (
      [OwnerApprovalStatus.Approved, OwnerApprovalStatus.Reject].includes(
        serviceRequest.owner_approval_status,
      )
    )
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_ALREADY_HAVE_THIS_STATUS,
      );

    serviceRequest.owner_approval_status = payload.status;
    serviceRequest.status =
      payload.status === OwnerApprovalStatus.Approved
        ? serviceRequest.status
        : ServiceRequestStatus.Rejected;

    return await queryRunner.manager.save(
      ServiceRequestMasterModel,
      serviceRequest,
    );
  }

  async serviceRequestNotes(
    payload: ServiceRequestNotesDto,
    user: JwtPayload,
  ): Promise<{
    note: ServiceRequestNoteModel;
    invoice_master_id: number | null;
    is_send_to_owner: boolean;
    property_master_id?: number;
    can_create_child_request?: boolean;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      if (user.user_type === UserType.Owner && payload.status)
        throw new BadRequestException(
          ServiceRequestMessage.CANNOT_UPDATE_STATUS,
        );

      if (user.user_type !== UserType.Owner && !payload.status)
        throw new BadRequestException(ServiceRequestMessage.STATUS_REQUIRED);

      if (
        payload?.status &&
        [
          ServiceRequestStatus.NotYetAssigned,
          ServiceRequestStatus.Scheduled,
          ServiceRequestStatus.Claimed,
        ].includes(payload.status)
      )
        throw new BadRequestException(ServiceRequestMessage.INVALID_STATUS);

      const [serviceRequest, franchiseAdmin] = await Promise.all([
        this.serviceRequestMasterRepository.findOne({
          where: {
            id: payload.service_request_id,
            franchise_id: Number(user.franchise_id),
            is_deleted: false,
          },
          relations: [
            'propertyMaster',
            'vendor',
            'owner',
            'creator',
            'serviceRequestMasterLinen',
            'serviceType',
          ],
        }),
        this.userRepository.findOne({
          where: {
            user_type: UserType.FranchiseAdmin,
            franchise_id: Number(user.franchise_id),
          },
        }),
      ]);

      if (!serviceRequest)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      if (
        ![
          ServiceRequestStatus.PartiallyCompleted,
          ServiceRequestStatus.CompletedSuccessfully,
        ].includes(payload.status) &&
        !(
          serviceRequest?.serviceType?.standard_hourly ||
          serviceRequest?.serviceType?.is_handyman_concierge
        ) &&
        (payload?.additional_cost ||
          payload?.labor ||
          payload?.service_call_fee)
      ) {
        throw new BadRequestException(ServiceRequestMessage.INVALID_REQUEST);
      }

      if (serviceRequest?.parent_id) {
        const parentServiceRequest =
          await this.serviceRequestMasterRepository.findOne({
            where: {
              id: serviceRequest.parent_id,
              franchise_id: Number(user.franchise_id),
              is_deleted: false,
              status: ServiceRequestStatus.DepositRequired,
            },
          });

        if (parentServiceRequest)
          throw new BadRequestException(
            ServiceRequestMessage.PARENT_DEPOSIT_REQUIRED,
          );
      }

      const nextPossibleStatuses = getNextStatuses(serviceRequest.status);

      if (
        user.user_type !== UserType.Owner &&
        payload.status !== serviceRequest.status &&
        (!nextPossibleStatuses ||
          (nextPossibleStatuses.length > 0 &&
            !nextPossibleStatuses.includes(payload.status)))
      )
        throw new BadRequestException(ServiceRequestMessage.INVALID_ATTEMPT);

      if (
        payload.status === ServiceRequestStatus.InProgress &&
        serviceRequest.status === ServiceRequestStatus.DepositRequired &&
        ![UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        )
      )
        throw new BadRequestException(ServiceRequestMessage.IN_PROGRESS_STATUS);

      if (
        serviceRequest?.serviceRequestMasterLinen &&
        payload?.line_items?.length &&
        payload?.status !== ServiceRequestStatus.DepositRequired
      )
        throw new BadRequestException(
          ServiceRequestMessage.LINEN_LINE_ITEMS_NOT_ALLOWED,
        );

      let invoiceId: number = null;
      let isSendToOwner: boolean = false;

      if (
        (payload?.line_items?.length ||
          [
            ServiceRequestStatus.PartiallyCompleted,
            ServiceRequestStatus.CompletedSuccessfully,
          ].includes(payload.status)) &&
        !serviceRequest.is_guest_concierge
      ) {
        const { invoice_master, line_items, has_prev_line_items } =
          await this.invoiceService.createServiceRequestInvoice(
            queryRunner,
            serviceRequest,
            payload?.line_items,
            user,
            payload.status,
            user.user_type === UserType.Vendor ? payload?.description : null,
          );
        invoiceId =
          [
            ServiceRequestStatus.DepositRequired,
            ServiceRequestStatus.PartiallyCompleted,
            ServiceRequestStatus.CompletedSuccessfully,
          ].includes(payload.status) &&
          (line_items.length > 0 || has_prev_line_items)
            ? invoice_master.id
            : null;
        isSendToOwner =
          invoiceId &&
          [InvoiceStatus.SentToOwner, InvoiceStatus.SentToAdmin].includes(
            invoice_master.invoice_status,
          );
      }

      const serviceReqUpdatePayload: IServiceRequestParams = {
        status: payload.status,
        ...(invoiceId &&
          !serviceRequest.is_guest_concierge && {
            invoice_master_id: invoiceId,
          }),
      };

      if (payload?.status && user.user_type !== UserType.Owner) {
        await queryRunner.manager.update(
          ServiceRequestMasterModel,
          { id: serviceRequest.id },
          serviceReqUpdatePayload,
        );
      }

      if (
        serviceRequest.is_guest_concierge &&
        [
          ServiceRequestStatus.PartiallyCompleted,
          ServiceRequestStatus.CompletedSuccessfully,
        ].includes(payload.status)
      ) {
        await this.invoiceService.addGuestConciergeLineItems(
          queryRunner,
          serviceRequest,
          user,
        );
      }

      const serviceReqNote = new ServiceRequestNoteModel();
      serviceReqNote.service_request_master_id = serviceRequest.id;
      serviceReqNote.description = payload?.description ?? null;
      serviceReqNote.note_added_by =
        user.user_type === UserType.StandardAdmin
          ? Number(user.franchise_admin)
          : Number(user.id);
      serviceReqNote.current_status = serviceRequest.status;
      serviceReqNote.updated_status =
        user.user_type === UserType.Owner
          ? serviceRequest.status
          : payload.status;

      const serviceRequestStatusUpdate = await queryRunner.manager.save(
        ServiceRequestNoteModel,
        serviceReqNote,
      );

      if (payload?.files && payload?.files.length)
        await this.updateServiceRequestNoteImage(
          queryRunner,
          serviceRequest,
          serviceReqNote,
          user,
          payload.files,
        );

      await queryRunner.commitTransaction();
      await this.serviceRequestNotificationService.sendServiceRequestUpdateStatusNotifications(
        serviceRequest,
        franchiseAdmin,
        user,
        payload.status,
      );

      serviceRequest.status = payload.status;

      const canCreateChildRequest = await this.canCreateChildRequest(
        serviceRequest,
        user,
      );

      return {
        note: serviceRequestStatusUpdate,
        invoice_master_id: invoiceId,
        property_master_id: serviceRequest.property_master_id,
        can_create_child_request: canCreateChildRequest,
        is_send_to_owner: serviceRequest.is_guest_concierge
          ? true
          : isSendToOwner,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateServiceRequestNote(
    payload: ServiceRequestNoteDto,
    user: JwtPayload,
  ): Promise<ServiceRequestNoteModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      // Verify service request exists and user has access
      const serviceRequest = await this.serviceRequestMasterRepository.findOne({
        where: {
          id: payload.service_request_id,
          franchise_id: Number(user.franchise_id),
          is_deleted: false,
        },
      });

      if (!serviceRequest) {
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );
      }

      const existingNote = await this.serviceRequestNoteRepository.findOne({
        where: {
          id: payload.note_id,
          service_request_master_id: payload.service_request_id,
          is_deleted: false,
        },
      });

      if (!existingNote) {
        throw new BadRequestException(ServiceRequestMessage.NOTE_NOT_FOUND);
      }

      existingNote.description = payload.description;

      const updatedNote = await queryRunner.manager.save(
        ServiceRequestNoteModel,
        existingNote,
      );

      await queryRunner.commitTransaction();
      return updatedNote;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateServiceRequestNoteImage(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    serviceRequestNote: ServiceRequestNoteModel,
    user: JwtPayload,
    files: string[],
  ) {
    await queryRunner.manager.delete(ServiceRequestMediaModel, {
      service_request_master_id: serviceRequest.id,
      service_request_note_id: serviceRequestNote.id,
      media_added_by:
        user.user_type === UserType.StandardAdmin
          ? Number(user.franchise_admin)
          : Number(user.id),
    });

    const serviceRequestMediaModels: ServiceRequestMediaModel[] = files.map(
      (file) => {
        return queryRunner.manager.create(ServiceRequestMediaModel, {
          service_request_master_id: serviceRequest.id,
          service_request_note_id: serviceRequestNote.id,
          media_url: file,
          media_type: this.s3Service.getFileType(file),
          media_added_by:
            user.user_type === UserType.StandardAdmin
              ? Number(user.franchise_admin)
              : Number(user.id),
        });
      },
    );
    return await queryRunner.manager.save(
      ServiceRequestMediaModel,
      serviceRequestMediaModels,
    );
  }

  async serviceRequestNoteImage(
    payload: ServiceRequestNoteImageDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const serviceRequest: ServiceRequestMasterModel =
        await this.serviceRequestMasterRepository.findOne({
          where: {
            id: payload.service_request_id,
            franchise_id: Number(user.franchise_id),
            is_deleted: false,
          },
        });

      if (!serviceRequest)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      const serviceRequestNote: ServiceRequestNoteModel =
        await this.serviceRequestNoteRepository.findOne({
          where: {
            id: payload.service_request_note_id,
            service_request_master_id: payload.service_request_id,
            is_deleted: false,
          },
        });

      if (!serviceRequestNote)
        throw new BadRequestException(ServiceRequestMessage.NOTE_NOT_FOUND);

      await this.updateServiceRequestNoteImage(
        queryRunner,
        serviceRequest,
        serviceRequestNote,
        user,
        payload.files,
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

  async getCalenderData(query: CalenderQueryDto, user: JwtPayload) {
    if (!query.start_date && !query.end_date) {
      query.start_date = moment().subtract(1, 'month').toDate();
      query.end_date = moment().add(1, 'month').toDate();
    }
    return await this.serviceRequestMasterRepository.getCalenderData(
      query,
      user,
    );
  }

  async getDrawerData(query: DrawerQueryDto, user: JwtPayload) {
    return await this.serviceRequestMasterRepository.getDrawerData(query, user);
  }

  async serviceRequestArchive(
    payload: ServiceRequestArchiveDto,
    user: JwtPayload,
  ) {
    const serviceRequestMasterModel: ServiceRequestMasterModel =
      await this.serviceRequestMasterRepository.findOne({
        where: {
          id: payload.service_request_id,
          is_deleted: false,
          owner_id: Number(user.id),
          status: ServiceRequestStatus.NotYetAssigned,
          is_archived: false,
        },
      });

    if (!serviceRequestMasterModel)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
      );

    serviceRequestMasterModel.is_archived = true;

    return await this.serviceRequestMasterRepository.save(
      serviceRequestMasterModel,
    );
  }

  async serviceRequestExist(
    user: JwtPayload,
  ): Promise<{ exists: boolean; settings: SettingModel[] }> {
    const [serviceRequestMasterModel, settings] = await Promise.all([
      this.serviceRequestMasterRepository.findOne({
        where: {
          owner_id: Number(user.id),
        },
      }),
      this.settingRepository.find({}),
    ]);

    return { exists: serviceRequestMasterModel ? true : false, settings };
  }

  async serviceRequestRecurringLogic(): Promise<moment.Moment[]> {
    let finalResult: moment.Moment[] = [];
    const todayDay = moment().toDate().getDay();
    const serviceRequestRecurringDateModel: ServiceRequestRecurringDateModel[] =
      await this.serviceRequestRecurringDateRepository.find({
        id: 102,
        days: Raw((alias) => `${alias} @> '[${todayDay}]'`),
      });

    for (let i = 0; i < serviceRequestRecurringDateModel.length; i++) {
      const serviceRequestEndDate = moment(
        serviceRequestRecurringDateModel[i].end_date,
      );
      const serviceRequestMasterModel: ServiceRequestMasterModel =
        await this.serviceRequestMasterRepository.findOne({
          where: {
            id: serviceRequestRecurringDateModel[i].service_request_master_id,
          },
        });

      const serviceRequestCreationDate = moment.unix(
        serviceRequestMasterModel.created_at,
      );

      if (
        serviceRequestRecurringDateModel[i].repeat_type ===
        ServiceRequestRepeatType.Weekly
      ) {
        finalResult = this.getNextServiceDateWeekly(
          serviceRequestCreationDate,
          serviceRequestRecurringDateModel[i].repeat,
          todayDay,
          serviceRequestEndDate,
          [],
        );
      } else if (
        serviceRequestRecurringDateModel[i].repeat_type ===
        ServiceRequestRepeatType.Monthly
      ) {
        finalResult = this.getNextServiceDateMonthly(
          serviceRequestCreationDate,
          serviceRequestRecurringDateModel[i].repeat,
          todayDay,
          serviceRequestEndDate,
          [],
        );
      }
      // const isTodayInArray = finalResult.some((date) =>
      //   date.isSame(today, 'day'),
      // );
    }
    return finalResult;
  }

  async getReportedIssues(
    query: PaginationParam,
    serviceRequestId: number,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<ServiceRequestMasterModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);
    return await this.serviceRequestMasterRepository.getServiceRequestReportedIssues(
      serviceRequestId,
      user,
      paginationParams,
    );
  }

  getNextServiceDateMonthly(
    dateString: moment.Moment,
    interval: number,
    serviceRequestDay: number,
    endDate: moment.Moment,
    result: moment.Moment[],
  ): moment.Moment[] {
    let dayOccurrenceInServiceMonth: number = 0,
      dayOccurrenceInNextServiceMonth: number = 0,
      nextServiceDate: moment.Moment = null;

    const firstDayOfServiceDateMonth = moment(dateString).startOf('month');

    while (firstDayOfServiceDateMonth.isSameOrBefore(dateString)) {
      if (
        moment(firstDayOfServiceDateMonth).toDate().getDay() ===
        serviceRequestDay
      )
        dayOccurrenceInServiceMonth++;
      firstDayOfServiceDateMonth.add(1, 'days');
    }

    const nextServiceDateMonth = moment(dateString).add(interval, 'months');
    const firstDayOfNextServiceDateMonth =
      moment(nextServiceDateMonth).startOf('month');
    const lastDayOfNextServiceDateMonth =
      moment(nextServiceDateMonth).endOf('month');

    while (
      firstDayOfNextServiceDateMonth.isSameOrBefore(
        lastDayOfNextServiceDateMonth,
      )
    ) {
      if (
        moment(firstDayOfNextServiceDateMonth).toDate().getDay() ===
        serviceRequestDay
      )
        dayOccurrenceInNextServiceMonth++;
      if (dayOccurrenceInNextServiceMonth === dayOccurrenceInServiceMonth) {
        nextServiceDate = firstDayOfNextServiceDateMonth;
        break;
      }
      firstDayOfNextServiceDateMonth.add(1, 'days');
    }

    if (nextServiceDate > endDate) return result;

    return this.getNextServiceDateMonthly(
      nextServiceDate,
      interval,
      serviceRequestDay,
      endDate,
      [...result, nextServiceDate],
    );
  }

  getNextServiceDateWeekly(
    serviceDate: moment.Moment,
    interval: number,
    serviceRequestDay: number,
    endDate: moment.Moment,
    result: moment.Moment[],
  ): moment.Moment[] {
    const futureDate = moment(serviceDate).add(interval, 'weeks');

    const startOfWeek = futureDate.clone().startOf('week');

    const calcDate = [...Array(7)]
      .map((_, i) => {
        return {
          date: startOfWeek.clone().add(i, 'days'),
          day: i,
        };
      })
      .filter((d) => d.day === serviceRequestDay);

    if (calcDate[0].date > endDate) return result;

    return this.getNextServiceDateWeekly(
      calcDate[0].date,
      interval,
      serviceRequestDay,
      endDate,
      [...result, calcDate[0].date],
    );
  }

  async serviceRequestReportedIssue(
    payload: ServiceRequestReportedIssueDto,
    user: JwtPayload,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const serviceRequestMasterModel: ServiceRequestMasterModel =
        await this.serviceRequestMasterRepository.findOne({
          where: {
            id: payload.service_request_id,
            is_deleted: false,
            franchise_id: Number(user.franchise_id),
            owner_approval_status: OwnerApprovalStatus.UnApproved,
            is_discrepancy: true,
          },
        });

      if (!serviceRequestMasterModel)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      await queryRunner.manager.update(
        ServiceRequestMasterModel,
        { id: payload.service_request_id },
        {
          service_type_id: payload.service_type_id,
          description: payload.description,
        },
      );

      if (payload.files && payload.files.length > 0) {
        await queryRunner.manager.delete(ServiceRequestMediaModel, {
          service_request_master_id: payload.service_request_id,
          service_request_note_id: IsNull(),
        });
        await this.addServiceRequestMedia(
          payload.service_request_id,
          payload.files,
          user,
          queryRunner,
        );
      }
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getGuestConciergeServiceRequests(
    query: ServiceRequestQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<ServiceRequestMasterModel>> {
    if (query.download) {
      this.logger.log(
        '[EVENT] Emitting Guest Concierge Service Request Listing report preparation event',
      );

      const { data, count } =
        await this.serviceRequestMasterRepository.getGuestConciergeServiceRequests(
          null,
          query,
          user,
        );

      if (count >= Setting.MAX_DIRECT_DOWNLOAD_ROWS) {
        // Send via email
        this.eventEmitter.emit(
          DownloadReportEventName.SERVICE_REQUEST_LISTING,
          new GenericReportDownloadEvent(
            () =>
              this.serviceRequestMasterRepository.getGuestConciergeServiceRequests(
                null,
                query,
                user,
              ),
            user,
          ),
        );
      } else {
        return { data, count };
      }
    } else {
      const paginationParams: IPaginationDBParams =
        this.generalHelper.getPaginationOptionsV2(query);

      const serviceRequestMasterModel =
        await this.serviceRequestMasterRepository.getGuestConciergeServiceRequests(
          paginationParams,
          query,
          user,
        );

      if (!serviceRequestMasterModel)
        throw new BadRequestException(
          ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
        );

      return serviceRequestMasterModel;
    }
  }

  async getServiceRequestHourlyRate(
    serviceRequestId: number,
    user: JwtPayload,
  ) {
    const serviceRequestMasterModel =
      await this.serviceRequestMasterRepository.findOne({
        where: { id: serviceRequestId, is_deleted: false },
        relations: ['serviceType'],
      });

    if (!serviceRequestMasterModel)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
      );

    if (
      ![
        ServiceRequestStatus.CompletedSuccessfully,
        ServiceRequestStatus.PartiallyCompleted,
      ].includes(serviceRequestMasterModel.status) ||
      serviceRequestMasterModel.invoice_master_id
    )
      throw new BadRequestException(ServiceRequestMessage.INVALID_ATTEMPT);

    const franchiseServiceType =
      await this.franchiseServiceTypeRepository.findOne({
        where: {
          service_type_id: serviceRequestMasterModel.service_type_id,
          franchise_id: serviceRequestMasterModel.franchise_id,
        },
        relations: ['serviceType'],
      });

    if (franchiseServiceType?.serviceType?.is_handyman_concierge) {
      return [
        {
          line_item: 'Service Charge - Regular Business Hours',
          price: franchiseServiceType?.service_call_fee ?? 0,
          is_vendor_line_item: true,
          section_id: InvoiceSection.ServiceCallFeeRegularBusinessHours,
          service_request_status: serviceRequestMasterModel.status,
          hours_worked: null as any,
          vendor_id: user.id,
          franchise_admin_id: null as any,
        },
        {
          line_item: 'Hourly Rate',
          price: franchiseServiceType?.hourly_rate ?? 0,
          is_vendor_line_item: true,
          section_id: InvoiceSection.Labor,
          hours_worked: null as any,
          service_request_status: serviceRequestMasterModel.status,
          vendor_id: user.id,
          franchise_admin_id: null as any,
        },
      ];
    }

    if (franchiseServiceType?.serviceType?.standard_hourly) {
      const vendorServiceType = await this.vendorServiceTypeRepository.findOne({
        where: {
          service_type_id: serviceRequestMasterModel.service_type_id,
          franchise_id: serviceRequestMasterModel.franchise_id,
          vendor_id: user.id,
        },
      });
      return [
        {
          line_item: 'Service Charge - Regular Business Hours',
          price: vendorServiceType?.service_call_fee ?? 0,
          is_vendor_line_item: true,
          section_id: InvoiceSection.ServiceCallFeeRegularBusinessHours,
          service_request_status: serviceRequestMasterModel.status,
          hours_worked: null as any,
          vendor_id: user.id,
          franchise_admin_id: null as any,
        },
        {
          line_item: 'Hourly Rate',
          price: vendorServiceType?.hourly_rate ?? 0,
          is_vendor_line_item: true,
          section_id: InvoiceSection.Labor,
          hours_worked: null as any,
          service_request_status: serviceRequestMasterModel.status,
          vendor_id: user.id,
          franchise_admin_id: null as any,
        },
      ];
    }

    return null;
  }
}
