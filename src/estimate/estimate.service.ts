import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import {
  CreateEstimateDto,
  EstimateQueryDto,
  UpdateEstimateDto,
  VendorQuotationDto,
  UpdateVendorQuotationByFranchiseAdminDto,
  UpdateEstimateStatusDto,
  RejectQuotationDto,
  ArchiveEstimateDto,
  VendorEstimateDeclineDto,
} from './estimate.dto';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { EstimateMasterModel } from '@/app/models/estimate/estimateMaster.model';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { EstimateMessage } from './estimate.messages';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { EstimateStatus } from '@/app/contracts/enums/estimate.enum';
import { EstimateMasterRepository } from '@/app/repositories/estimate/estimateMaster.repository';
import { IPaginatedModelResponse } from './../app/contracts/interfaces/paginatedModelResponse.interface';
import { IPaginationDBParams } from './../app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from './../app/utils/general.helper';
import { EstimateDetailModel } from '@/app/models/estimate/estimateDetail.model';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { BunyanLogger } from '@/app/commons/logger.service';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { FranchiseServiceTypeModel } from '@/app/models/serviceType/franchiseServiceType.model';
import { EstimateAssetModel } from '@/app/models/estimate/estimateAsset.model';
import { EstimateAssetRepository } from '@/app/repositories/estimate/estimateAsset.repository';
import { VendorServiceTypeRepository } from '@/app/repositories/vendor/vendorServiceType.repository';
import { VendorServiceTypeModel } from '@/app/models/serviceType/vendorServiceType.model';
import { ServiceRequestService } from '@/serviceRequest/serviceRequest.service';
import { CreateServiceRequestDto } from '@/serviceRequest/serviceRequest.dto';
import { DistributionType } from '@/app/contracts/enums/distributionType';
import { UserDescriptionModel } from '@/app/models/user/userDescription.model';
import { IAddEstimateDetailsParams } from '@/app/contracts/interfaces/estimate.interface';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { EstimateDetailsRepository } from '@/app/repositories/estimate/estimateDetails.repository';
import { EstimateDetailRejectionRepository } from '@/app/repositories/estimate/estimateRejection.repository';
import { S3Service } from '@/app/commons/s3.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { URLS } from '@/app/contracts/enums/urls.enum';
import { UserModel } from '@/app/models/user/user.model';
import { VendorServiceTypePriorityRepository } from '@/app/repositories/vendor/vendorServiceTypePriority.repository';
import { parse } from 'node-html-parser';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { EstimateVendorDistributionModel } from '@/app/models/estimate/estimateVendorDistribution.model';
import { EstimateVendorDistributionRepository } from '@/app/repositories/estimate/estimateVendorDistribution.repository';
import { PaginationParam } from '@/app/commons/base.request';
import { UserDescriptionRepository } from '@/app/repositories/user/userDescription.repository';
import * as moment from 'moment';

@Injectable()
export class EstimateService {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly dataSource: DataSource,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly propertyMasterRepository: PropertyMasterRepository,
    private readonly franchiseServiceTypeRepository: FranchiseServiceTypeRepository,
    private readonly estimateMasterRepository: EstimateMasterRepository,
    private readonly estimateDetailsRepository: EstimateDetailsRepository,
    private readonly estimateAssetRepository: EstimateAssetRepository,
    private readonly estimateDetailRejectionRepository: EstimateDetailRejectionRepository,
    private readonly userRepository: UserRepository,
    private readonly vendorServiceTypeRepository: VendorServiceTypeRepository,
    private readonly s3Service: S3Service,
    private readonly generalHelper: GeneralHelper,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly vendorServiceTypePrioritiesRepository: VendorServiceTypePriorityRepository,
    private readonly estimateVendorDistributionRepository: EstimateVendorDistributionRepository,
    private readonly userDescriptionRepository: UserDescriptionRepository,
  ) {}

  getFilteredLineItems = (
    estimateDetails: Array<EstimateDetailModel>,
    user: UserModel,
    payload: RejectQuotationDto,
  ): Array<{
    line_item: string;
    price: number;
  }> => {
    return estimateDetails
      .filter((item) => {
        if (
          user.user_type == UserType.Vendor &&
          item.vendor_id == payload.vendor_id &&
          item.franchise_admin_id == null &&
          !item.is_estimate_approved
        ) {
          return true;
        } else if (
          user.user_type == UserType.FranchiseAdmin &&
          item.franchise_admin_id == Number(user.id) &&
          item.is_estimate_approved
        ) {
          return true;
        }
        return false;
      })
      .map((item) => ({ line_item: item.line_item, price: item.price }));
  };

  async addEstimateDetails(params: IAddEstimateDetailsParams) {
    const estimateDetailsPayload: EstimateDetailModel[] = params.items.flatMap(
      (item) => {
        return params.queryRunner.manager.create(EstimateDetailModel, {
          estimate_master_id: params.estimate_master_id,
          line_item: item.line_item,
          price: item.price,
          description: item?.description ?? null,
          vendor_id: params.vendor_id,
          franchise_admin_id: params?.franchise_admin_id || null,
          is_send_to_owner: params?.is_send_to_owner || false,
        });
      },
    );

    estimateDetailsPayload.push(
      params.queryRunner.manager.create(EstimateDetailModel, {
        estimate_master_id: params.estimate_master_id,
        line_item: 'Total',
        price: params.estimateTotal,
        is_grand_total: true,
        vendor_id: params.vendor_id,
        franchise_admin_id: params?.franchise_admin_id || null,
        is_send_to_owner: params?.is_send_to_owner || false,
      }),
    );

    await params.queryRunner.manager.save(
      EstimateDetailModel,
      estimateDetailsPayload,
    );
  }

  async validatePropertyAndServiceType(
    payload: CreateEstimateDto | UpdateEstimateDto,
    propertyMasterId: number,
    user: JwtPayload,
  ): Promise<PropertyMasterModel> {
    const { service_type_id } = payload;
    const { franchise_id, id } = user;

    const property: PropertyMasterModel =
      await this.propertyMasterRepository.findOne({
        where: {
          id: propertyMasterId,
          franchise_id: Number(franchise_id),
          off_program: false,
          ...(user.user_type === UserType.Owner && {
            owner_id: Number(id),
          }),
        },
        relations: ['owner'],
      });

    if (!property)
      throw new BadRequestException(EstimateMessage.PROPERTY_NOT_EXIST);

    const serviceType: FranchiseServiceTypeModel =
      await this.franchiseServiceTypeRepository.findOne({
        where: {
          franchise_id: Number(user.franchise_id),
          service_type_id,
          is_active: true,
        },
      });

    if (!serviceType)
      throw new BadRequestException(EstimateMessage.SERVICE_TYPE_NOT_EXIST);

    return property;
  }

  async createEstimate(
    payload: CreateEstimateDto,
    user: JwtPayload,
  ): Promise<EstimateMasterModel> {
    const { property_id, service_type_id, images, owner_consent } = payload;

    const membershipTierValid =
      await this.serviceRequestService.isPropertyMembershipValid(property_id);

    if (!membershipTierValid)
      throw new BadRequestException(
        EstimateMessage.PROPERTY_MEMBERSHIP_INVALID,
      );

    if (!owner_consent)
      throw new BadRequestException(EstimateMessage.OWNER_CONSENT_REQUIRED);

    const property = await this.validatePropertyAndServiceType(
      payload,
      property_id,
      user,
    );

    // TODO: Enable this check with invoicing
    //   await this.userPaymentMethodRepository.findOne({
    //     where: {
    //       owner_id: propertyMasterModel.owner_id,
    //       status: PaymentMethodStatus.Succeeded,
    //     },
    //   });

    const estimateMasterModal = new EstimateMasterModel();
    (estimateMasterModal.property_master_id = property_id),
      (estimateMasterModal.franchise_id = Number(user.franchise_id));
    estimateMasterModal.service_type_id = service_type_id;
    payload.description &&
      (estimateMasterModal.description = payload.description);
    estimateMasterModal.status = EstimateStatus.EstimateRequestedByOwner;
    estimateMasterModal.owner_id = Number(property.owner_id);
    estimateMasterModal.start_date = payload.start_date;
    estimateMasterModal.owner_consent = payload.owner_consent;
    estimateMasterModal.estimate_distribution_type =
      DistributionType.SelectedVendor;

    const estimate: EstimateMasterModel =
      await this.estimateMasterRepository.save(estimateMasterModal);

    if (images && images.length > 0) {
      const estimateAssetModels = payload.images.map((img) => {
        const estimateAssetModel = new EstimateAssetModel();
        estimateAssetModel.estimate_master_id = estimate.id;
        estimateAssetModel.media_url = img;
        estimateAssetModel.media_type = this.s3Service.getFileType(img);
        estimateAssetModel.media_added_by = user
          ? user.user_type === UserType.StandardAdmin
            ? Number(user.franchise_admin)
            : Number(user.id)
          : null;
        return estimateAssetModel;
      });
      await this.estimateAssetRepository.saveAll(estimateAssetModels);
    }

    const franchiseAdmin = await this.userRepository.findOne({
      where: {
        franchise_id: Number(user.franchise_id),
        user_type: UserType.FranchiseAdmin,
        is_deleted: false,
      },
    });

    const franchiseST = await this.franchiseServiceTypeRepository.findOne({
      where: {
        franchise_id: Number(user.franchise_id),
        service_type_id: service_type_id,
      },
      relations: ['serviceType'],
    });

    const ownerName = property.owner.first_name
      ? property.owner.first_name + ' ' + property.owner.last_name
      : property.owner.email;

    if (franchiseAdmin?.email)
      await this.notificationsService.sendNotification(
        NotificationAction.ESTIMATE_CREATED,
        {
          link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
          propertyAddress: property.address,
          ownerName,
          serviceType: franchiseST.serviceType.title,
          smsBody: `${ownerName}  Created New Estimate against property ${property.address} with service type ${franchiseST.serviceType.title}`,
        },
        [franchiseAdmin.email],
        [franchiseAdmin.contact],
      );

    return estimate;
  }

  async getEstimates(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const estimates = await this.estimateMasterRepository.getEstimates(
      paginationParams,
      user,
      query,
      {
        status: EstimateStatus.EstimateRequestedByOwner,
        ...(user.user_type === UserType.Owner && {
          owner_id: Number(user.id),
        }),
      },
    );

    return estimates;
  }

  async getVendorAssignedJobs(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const { id } = user;

    const estimates = await this.estimateMasterRepository.getEstimates(
      paginationParams,
      user,
      query,
      {
        vendor_assigned_job: true,
        vendor_id: Number(id),
      },
    );

    return estimates;
  }

  async getDownloadUrl(mediaUrl: string) {
    try {
      return await this.s3Service.getDownloadUrl(mediaUrl);
    } catch (err) {
      this.logger.error(`Download URL Issue == > ${JSON.stringify(err)}`);
      return null;
    }
  }

  async getEstimate(
    estimate_id: number,
    user: JwtPayload,
    vendor_id?: number,
  ): Promise<EstimateMasterModel> {
    const estimate = await this.estimateMasterRepository.getEstimate(
      estimate_id,
      user,
      vendor_id,
    );

    if (vendor_id) {
      const estimateStatus =
        await this.estimateMasterRepository.getEstimateQuotationsById(
          estimate_id,
          { limit: 1, offset: 0 } as IPaginationDBParams,
          user,
          vendor_id,
        );
      if (estimateStatus.data.length > 0) {
        estimate.estimate_status = estimateStatus.data[0].status;
        const estimateQuote = estimateStatus.data.find(
          (e) => e.vendor_id && !e.franchise_admin_id,
        );
        if (estimateQuote) {
          estimate.quotation_date =
            typeof estimateQuote?.created_at === 'string'
              ? estimateQuote?.created_at
              : moment
                  .unix(Number(estimateQuote?.created_at))
                  .format('MM-DD-YYYY');
        }
      }
    }

    if (estimate?.estimateAsset?.length > 0) {
      estimate.estimateAsset = await Promise.all(
        estimate.estimateAsset.map(async (d) => {
          d.image_url = await this.getDownloadUrl(d.media_url);
          return d;
        }),
      );
    }

    if (!estimate)
      throw new BadRequestException(EstimateMessage.ESTIMATE_NOT_FOUND);

    estimate.start_date = moment(estimate.start_date).format('MM-DD-YYYY');

    if (
      [
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.Owner,
      ].includes(user.user_type)
    ) {
      const franchiseAdmin = await this.userRepository.findOne({
        where: {
          franchise_id: Number(user.franchise_id),
          user_type: UserType.FranchiseAdmin,
        },
      });
      const franchiseAddedQuotation = await this.estimateDetailsRepository.find(
        {
          estimate_master_id: estimate.id,
          vendor_id,
          franchise_admin_id: franchiseAdmin?.id,
          is_grand_total: false,
        },
      );

      estimate.franchise_estimate_details =
        franchiseAddedQuotation?.length > 0 ? franchiseAddedQuotation : [];
      estimate.is_send_to_owner =
        franchiseAddedQuotation?.length > 0
          ? franchiseAddedQuotation.every((detail) => detail.is_send_to_owner)
          : false;

      estimate.quotation_date = franchiseAddedQuotation?.[0]?.created_at
        ? moment
            .unix(Number(franchiseAddedQuotation?.[0]?.created_at))
            .format('MM-DD-YYYY')
        : estimate.quotation_date;

      const reject_description = await this.userDescriptionRepository.findOne({
        where: {
          estimate_master_id: estimate.id,
          vendor_id,
          is_estimate_reject_description: true,
        },
      });
      estimate.owner_quote_rejection_description =
        reject_description?.description || '';
    }

    return estimate;
  }

  async getVendorsEmail(
    distributionType: DistributionType,
    params: Record<string, any>,
  ): Promise<{ emails: string[]; contacts: string[] }> {
    switch (distributionType) {
      case DistributionType.DistributeToAllVendors:
        const dta =
          await this.vendorServiceTypeRepository.getVendorServiceTypes(
            Number(params.franchise_id),
            Number(params.service_type_id),
          );
        if (dta.length > 0)
          return {
            emails: dta.map((dta) => dta.vendor.email),
            contacts: dta
              .map((dta) => dta.vendor.contact)
              .filter((rec) => rec !== null),
          };
        break;
      case DistributionType.PreferredVendor:
        const vp =
          await this.vendorServiceTypePrioritiesRepository.getPropertyPreferredServiceTypeVendors(
            Number(params.property_master_id),
            Number(params.franchise_id),
            Number(params.service_type_id),
          );

        if (vp.length > 0)
          return {
            emails: vp.map((vp) => vp.vendor.email),
            contacts: vp
              .map((dta) => dta.vendor.contact)
              .filter((rec) => rec !== null),
          };
        break;
      case DistributionType.SelectedVendor:
        if (params?.vendor_ids && params?.vendor_ids.length === 1) {
          const vendor = await this.userRepository.findOne({
            where: {
              id: +params.vendor_ids[0],
              user_type: UserType.Vendor,
              is_deleted: false,
            },
          });
          if (vendor)
            return {
              emails: [vendor.email],
              contacts: [vendor.contact],
            };
          break;
        } else if (params?.vendor_ids && params?.vendor_ids.length > 1) {
          const vendors = await this.userRepository.find({
            id: In(params.vendor_ids),
            user_type: UserType.Vendor,
            is_deleted: false,
          });

          if (!vendors.length)
            return {
              emails: [],
              contacts: [],
            };

          return {
            emails: vendors.map((vendor) => vendor.email),
            contacts: vendors.map((vendor) => vendor.contact),
          };
        }
    }
  }

  getDistributionType(payload: UpdateEstimateDto): DistributionType {
    const vendorsLength = payload?.vendor_ids?.length;
    if (vendorsLength && vendorsLength === 1) {
      return DistributionType.SelectedVendor;
    } else if (vendorsLength && vendorsLength > 1) {
      return DistributionType.MultipleVendors;
    }
    return payload.estimate_distribution_type;
  }

  async updateEstimate(
    user: JwtPayload,
    payload: UpdateEstimateDto,
  ): Promise<EstimateMasterModel> {
    if (
      (user.user_type === UserType.FranchiseAdmin ||
        user.user_type === UserType.StandardAdmin) &&
      !payload.estimate_distribution_type
    )
      throw new BadRequestException(
        EstimateMessage.ESTIMATE_DISTRIBUTION_REQUIRED,
      );

    const vendorsLength = payload.vendor_ids?.length;

    if (
      [
        DistributionType.PreferredVendor,
        DistributionType.DistributeToAllVendors,
      ].includes(payload.estimate_distribution_type) ||
      (vendorsLength && vendorsLength > 1)
    ) {
      const vendors = await this.userRepository.getVendors(
        null,
        payload.service_type_id,
        Number(user.franchise_id),
        true,
      );
      if (vendors.count === 0)
        throw new BadRequestException(EstimateMessage.VENDOR_NOT_ASSOCIATED);
    }

    const estimate = await this.estimateMasterRepository.findOne({
      where: {
        id: payload.estimate_master_id,
        franchise_id: Number(user.franchise_id),
        is_deleted: false,
        ...(user.user_type === UserType.Owner && {
          owner_id: Number(user.id),
        }),
      },
      relations: ['propertyMaster', 'propertyMaster.owner', 'serviceType'],
    });

    if (!estimate)
      throw new BadRequestException(EstimateMessage.ESTIMATE_NOT_FOUND);

    await this.validatePropertyAndServiceType(
      payload,
      estimate.property_master_id,
      user,
    );

    if (
      vendorsLength &&
      ![UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        user.user_type,
      )
    )
      throw new BadRequestException(EstimateMessage.INVALID_UPDATE_REQUEST);

    if (
      [
        EstimateStatus.EstimateQuotationAddedByVendor,
        EstimateStatus.EstimateRejectedByOwner,
        EstimateStatus.EstimateApprovedByOwner,
      ].includes(estimate.status)
    )
      throw new BadRequestException(EstimateMessage.CANNOT_UPDATE_ESTIMATE);

    if (vendorsLength && vendorsLength === 1) {
      const vendor = await this.userRepository.findOne({
        where: {
          id: payload.vendor_ids[0],
          is_approved: true,
          franchise_id: Number(user.franchise_id),
          user_type: UserType.Vendor,
          is_deleted: false,
        },
      });

      if (!vendor)
        throw new BadRequestException(EstimateMessage.VENDOR_NOT_FOUND);

      const vendorServiceType: VendorServiceTypeModel =
        await this.vendorServiceTypeRepository.findOne({
          where: {
            vendor_id: payload.vendor_ids[0],
            service_type_id: payload.service_type_id,
            franchise_id: Number(user.franchise_id),
          },
        });

      if (!vendorServiceType)
        throw new BadRequestException(
          EstimateMessage.VENDOR_SERVICE_TYPE_ERROR,
        );

      estimate.vendor_id = payload.vendor_ids[0];
    } else if (
      !vendorsLength &&
      payload.service_type_id !== estimate.service_type_id
    ) {
      estimate.vendor_id = null;
    }

    estimate.estimate_distribution_type = this.getDistributionType(payload);
    estimate.service_type_id = payload.service_type_id;
    estimate.start_date = payload.start_date;
    [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
      user.user_type,
    ) && (estimate.status = EstimateStatus.EstimateVendorAssignment);

    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        user.user_type,
      ) &&
      payload?.description
    ) {
      payload.description &&
        (estimate.franchise_description = payload.description);
    } else if (payload?.description) {
      payload.description && (estimate.description = payload.description);
    }

    /* Multiple Vendors
     New Added Distribution Type. 
     When Franchise Admin assign multiple vendors to a single estimate.All vendors will be assigned to the same estimate. and this ids store in estimate_vendor_distribution table.
     This is for Franchise Admin. This record will delete once estimate is reject or approved by owner
     */
    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        user.user_type,
      ) &&
      vendorsLength &&
      vendorsLength > 1
    ) {
      const estimateVendorDistributions = payload.vendor_ids.map(
        (vendor_id) => {
          const estimateVendorDistribution =
            new EstimateVendorDistributionModel();
          estimateVendorDistribution.estimate_master_id = estimate.id;
          estimateVendorDistribution.owner_id = estimate.owner_id;
          estimateVendorDistribution.property_master_id =
            estimate.property_master_id;
          estimateVendorDistribution.franchise_id = Number(user.franchise_id);

          estimateVendorDistribution.vendor_id = vendor_id;
          return estimateVendorDistribution;
        },
      );
      await this.estimateVendorDistributionRepository.saveAll(
        estimateVendorDistributions,
      );
    }

    if (payload.images && payload.images.length > 0) {
      await this.estimateAssetRepository.delete(
        {
          estimate_master_id: estimate.id,
          media_added_by:
            user.user_type === UserType.StandardAdmin
              ? Number(user.franchise_admin)
              : Number(user.id),
        },
        false,
      );
      const estimateAssetModels = payload.images.map((img) => {
        const estimateAssetModel = new EstimateAssetModel();
        estimateAssetModel.estimate_master_id = estimate.id;
        estimateAssetModel.media_url = img;
        estimateAssetModel.media_type = this.s3Service.getFileType(img);
        estimateAssetModel.media_added_by = user
          ? user.user_type === UserType.StandardAdmin
            ? Number(user.franchise_admin)
            : Number(user.id)
          : null;
        return estimateAssetModel;
      });
      await this.estimateAssetRepository.saveAll(estimateAssetModels);
    }

    if (
      user.user_type === UserType.FranchiseAdmin ||
      user.user_type === UserType.StandardAdmin
    ) {
      const { emails, contacts } = await this.getVendorsEmail(
        payload.estimate_distribution_type,
        {
          franchise_id: Number(user.franchise_id),
          service_type_id: Number(payload.service_type_id),
          property_master_id: Number(estimate.property_master_id),
          vendor_ids: payload.vendor_ids,
        },
      );

      const emailAction =
        payload.estimate_distribution_type == DistributionType.SelectedVendor &&
        vendorsLength &&
        vendorsLength === 1
          ? NotificationAction.ESTIMATE_VENDOR_ASSIGNMENT_SINGLE
          : NotificationAction.ESTIMATE_VENDOR_ASSIGNMENT_MULTI;

      const ownerName =
        estimate.propertyMaster.owner.first_name +
        ' ' +
        estimate.propertyMaster.owner.last_name;

      const franchiseAdminName = user.first_name
        ? `${user.first_name} ${user.last_name}`
        : user.email;

      if (emails.length)
        await this.notificationsService.sendNotification(
          emailAction,
          {
            link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
            propertyAddress: estimate.propertyMaster.address,
            ownerName,
            serviceType: estimate.serviceType.title,
            franchiseAdminName,
            smsBody:
              franchiseAdminName +
              'assigned you to a new estimate against property ' +
              estimate.propertyMaster.address +
              ' with service type ' +
              estimate.serviceType.title,
          },
          emails,
          contacts,
        );
    }

    return await this.estimateMasterRepository.save(estimate);
  }

  async addVendorQuotation(
    payload: VendorQuotationDto,
    user: JwtPayload,
  ): Promise<EstimateMasterModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const estimate = await this.estimateMasterRepository.findOne({
        where: {
          id: payload.estimate_master_id,
          is_deleted: false,
          franchise_id: Number(user.franchise_id),
        },
        relations: ['propertyMaster', 'propertyMaster.owner', 'serviceType'],
      });

      if (!estimate)
        throw new BadRequestException(EstimateMessage.ESTIMATE_NOT_FOUND);

      if (
        [
          EstimateStatus.EstimateRejectedByOwner,
          EstimateStatus.EstimateApprovedByOwner,
        ].includes(estimate.status)
      )
        throw new BadRequestException(
          EstimateMessage.QUOTE_ALREADY_SEND_TO_OWNER,
        );

      if (
        estimate.estimate_distribution_type ===
          DistributionType.SelectedVendor &&
        estimate.vendor_id &&
        estimate.vendor_id != Number(user.id)
      )
        throw new BadRequestException(EstimateMessage.NOT_ASSIGNED_VENDOR);

      const estimateDetailModel: EstimateDetailModel[] =
        await this.estimateDetailsRepository.find({
          estimate_master_id: estimate.id,
          vendor_id: user.id,
        });
      if (estimateDetailModel.length > 0)
        throw new BadRequestException(
          EstimateMessage.ESTIMATE_ALREADY_SUBMITTED,
        );

      const vendorServiceType: VendorServiceTypeModel =
        await this.vendorServiceTypeRepository.findOne({
          where: {
            vendor_id: user.id,
            service_type_id: estimate.service_type_id,
            franchise_id: Number(user.franchise_id),
          },
        });
      if (!vendorServiceType)
        throw new BadRequestException(
          EstimateMessage.VENDOR_SERVICE_TYPE_ERROR,
        );

      await queryRunner.manager.update(
        EstimateMasterModel,
        { id: payload.estimate_master_id },
        {
          status: EstimateStatus.EstimateQuotationAddedByVendor,
        },
      );

      if (payload?.vendor_description) {
        const userEstimateDescription = new UserDescriptionModel();
        userEstimateDescription.estimate_master_id = payload.estimate_master_id;
        userEstimateDescription.description = payload.vendor_description;
        userEstimateDescription.user_id = user.id;
        userEstimateDescription.vendor_id = user.id;
        await queryRunner.manager.save(
          UserDescriptionModel,
          userEstimateDescription,
        );
      }

      const estimateDetailsParams: IAddEstimateDetailsParams = {
        estimate_master_id: payload.estimate_master_id,
        vendor_id: user.id,
        estimateTotal: payload.total,
        items: payload.items,
        queryRunner,
      };

      await this.addEstimateDetails(estimateDetailsParams);

      const franchiseAdmin = await this.userRepository.findOne({
        where: {
          franchise_id: Number(user.franchise_id),
          user_type: UserType.FranchiseAdmin,
          is_deleted: false,
        },
      });

      await this.notificationsService.sendNotification(
        NotificationAction.ESTIMATE_VENDOR_QUOTATION_ADDED,
        {
          link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
          lineItems: payload.items,
          propertyAddress: estimate.propertyMaster.address,
          serviceType: estimate.serviceType.title,
          ownerName: `${estimate.propertyMaster.owner.first_name} ${estimate.propertyMaster.owner.last_name}`,
          vendorName: user.first_name
            ? `${user.first_name} ${user.last_name}`
            : `${user.email}`,
          smsBody: `${user.first_name} ${user.last_name} added a new estimate against property ${estimate.propertyMaster.address} with service type ${estimate.serviceType.title}`,
        },
        [franchiseAdmin.email],
        [franchiseAdmin.contact],
      );

      this.logger.log('Create Estimate Details Successfully');

      await queryRunner.commitTransaction();
      return await this.getEstimate(payload.estimate_master_id, user);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getVendorQuotedJobs(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    // const estimates = await this.estimateMasterRepository.getEstimates(
    //   paginationParams,
    //   user,
    //   query,
    //   {
    //     status: EstimateStatus.EstimateQuotationAddedByVendor,
    //     estimate_details: true,
    //     is_send_to_owner: false,
    //   },
    // );

    const estimates = await this.estimateMasterRepository.getQuotedEstimates(
      paginationParams,
      user,
      query,
      {
        status: EstimateStatus.EstimateQuotationAddedByVendor,
        estimate_details: true,
        is_send_to_owner: false,
      },
    );

    return estimates;
  }

  async getVendorQuotedEstimate(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<EstimateDetailModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const estimates = await this.estimateDetailsRepository.getQuotedEstimates(
      paginationParams,
      query,
      {
        vendor_id: Number(user.id),
        is_send_to_owner: false,
      },
    );

    return estimates;
  }

  async updateVendorQuotationByFranchiseAdmin(
    payload: UpdateVendorQuotationByFranchiseAdminDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const estimate = await this.getEstimate(payload.estimate_master_id, user);
      if (
        [
          EstimateStatus.EstimateRejectedByOwner,
          EstimateStatus.EstimateApprovedByOwner,
        ].includes(estimate.status)
      )
        throw new BadRequestException(
          EstimateMessage.QUOTE_ALREADY_SEND_TO_OWNER,
        );

      if (estimate.status != EstimateStatus.EstimateQuotationAddedByVendor)
        throw new BadRequestException(EstimateMessage.INVALID_ACTION);

      const estimateDetailModel: EstimateDetailModel[] =
        await this.estimateDetailsRepository.find({
          estimate_master_id: estimate.id,
          ...(estimate.estimate_distribution_type ==
            DistributionType.SelectedVendor && {
            vendor_id: estimate.vendor_id,
          }),
        });

      if (estimateDetailModel.length === 0)
        throw new BadRequestException(
          EstimateMessage.VENDOR_ESTIMATE_NOT_FOUND,
        );

      let vendor_id = payload.vendor_id;
      if (
        estimate.estimate_distribution_type ==
          DistributionType.DistributeToAllVendors ||
        estimate.estimate_distribution_type ==
          DistributionType.PreferredVendor ||
        estimate.estimate_distribution_type == DistributionType.MultipleVendors
      ) {
        vendor_id =
          Number(payload.items.length > 0 && payload.items[0]?.vendor_id) ||
          payload.vendor_id;
      }

      const isEstimateSendToOwner: EstimateDetailModel[] =
        await this.estimateDetailsRepository.find({
          estimate_master_id: estimate.id,
          vendor_id,
          is_send_to_owner: true,
        });

      if (isEstimateSendToOwner.length > 0)
        throw new BadRequestException(
          EstimateMessage.ESTIMATE_ALREADY_SENT_TO_OWNER,
        );

      const vendorEstimates: EstimateDetailModel[] =
        await this.estimateDetailsRepository.find({
          estimate_master_id: payload.estimate_master_id,
          vendor_id,
          is_send_to_owner: false,
        });

      if (payload?.franchise_admin_description) {
        let userEstimateDescription =
          await this.userDescriptionRepository.findOne({
            where: {
              estimate_master_id: payload.estimate_master_id,
              vendor_id: payload.items[0]?.vendor_id,
              is_estimate_reject_description: false,
              user_id:
                user.user_type === UserType.StandardAdmin
                  ? Number(user.franchise_admin)
                  : Number(user.id),
            },
          });
        if (!userEstimateDescription)
          userEstimateDescription = new UserDescriptionModel();
        userEstimateDescription.estimate_master_id = payload.estimate_master_id;
        (userEstimateDescription.vendor_id =
          payload.items.length > 0 ? payload.items[0]?.vendor_id : null),
          (userEstimateDescription.description =
            payload?.franchise_admin_description);
        userEstimateDescription.user_id = user.id;

        await queryRunner.manager.save(
          UserDescriptionModel,
          userEstimateDescription,
        );
      }

      if (vendorEstimates.length > 0 && payload?.send_to_owner) {
        await queryRunner.manager.update(
          EstimateDetailModel,
          {
            estimate_master_id: payload.estimate_master_id,
            vendor_id,
          },
          { is_send_to_owner: true },
        );
      }

      await queryRunner.manager.delete(EstimateDetailModel, {
        estimate_master_id: payload.estimate_master_id,
        vendor_id,
        franchise_admin_id:
          user.user_type === UserType.StandardAdmin
            ? Number(user.franchise_admin)
            : Number(user.id),
      });

      const estimateDetailsParams: IAddEstimateDetailsParams = {
        estimate_master_id: payload.estimate_master_id,
        franchise_admin_id:
          user.user_type === UserType.StandardAdmin
            ? Number(user.franchise_admin)
            : Number(user.id),
        vendor_id,
        estimateTotal: payload.total,
        items: payload.items,
        is_send_to_owner: payload?.send_to_owner ?? false,
        queryRunner,
      };

      await this.addEstimateDetails(estimateDetailsParams);

      await this.notificationsService.sendNotification(
        NotificationAction.ESTIMATE_VENDOR_QUOTATION_UPDATE_BY_FRANCHISE_ADMIN,
        {
          link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
          lineItems: payload.items,
          title: estimate.propertyMaster.address,
          serviceType: estimate.serviceType.title,
          ownerName: `${estimate.propertyMaster.owner.first_name} ${estimate.propertyMaster.owner.last_name}`,
          franchiseAdminName: user.first_name
            ? `${user.first_name} ${user.last_name}`
            : user.email,
          smsBody: `${user.first_name} ${user.last_name} updated the estimate against property ${estimate.propertyMaster.address} with service type ${estimate.serviceType.title}`,
        },
        [estimate.propertyMaster.owner.email],
        [estimate.propertyMaster.owner.contact],
      );

      this.logger.log('Create Estimate Details Successfully');

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getQuotedEstimates(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const { id } = user;
    const estimates = await this.estimateMasterRepository.getQuotedEstimates(
      paginationParams,
      user,
      query,
      {
        status: EstimateStatus.EstimateQuotationAddedByVendor,
        is_send_to_owner: true,
        owner_id: Number(id),
      },
    );

    return estimates;
  }

  async getOwnerApprovalEstimates(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const { id } = user;
    const estimates =
      await this.estimateMasterRepository.getOwnerApprovalEstimates(
        paginationParams,
        user,
        query,
        {
          status: EstimateStatus.EstimateQuotationAddedByVendor,
          is_send_to_owner: true,
          owner_id: Number(id),
        },
      );

    return estimates;
  }

  async getAllOwnerEstimatesSubmittedToOwner(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const estimates = await this.estimateMasterRepository.getQuotedEstimates(
      paginationParams,
      user,
      query,
      {
        status: EstimateStatus.EstimateQuotationAddedByVendor,
        is_send_to_owner: true,
      },
    );

    return estimates;
  }

  async updateEstimateStatus(
    payload: UpdateEstimateStatusDto,
    user: JwtPayload,
  ): Promise<{
    estimate: EstimateMasterModel | null;
    service_request: ServiceRequestMasterModel | null;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      let serviceRequest: ServiceRequestMasterModel | null = null;
      const estimate = await this.getEstimate(payload.estimate_master_id, user);

      if (
        [
          EstimateStatus.EstimateApprovedByOwner,
          EstimateStatus.EstimateRejectedByOwner,
        ].includes(estimate.status)
      )
        throw new BadRequestException(EstimateMessage.APPROVED_REJECT_ESTIMATE);

      if (estimate.status !== EstimateStatus.EstimateQuotationAddedByVendor)
        throw new BadRequestException(EstimateMessage.INVALID_ACTION);

      const estimateDetailModel: EstimateDetailModel[] =
        await this.estimateDetailsRepository.find({
          estimate_master_id: payload.estimate_master_id,
          ...(estimate.estimate_distribution_type ==
            DistributionType.SelectedVendor && {
            vendor_id: estimate.vendor_id,
          }),
          is_send_to_owner: true,
        });

      if (estimateDetailModel.length === 0)
        throw new BadRequestException(
          EstimateMessage.VENDOR_ESTIMATE_NOT_FOUND,
        );

      let vendor_id = payload.vendor_id;
      if (
        estimate.estimate_distribution_type ==
          DistributionType.DistributeToAllVendors ||
        estimate.estimate_distribution_type ==
          DistributionType.PreferredVendor ||
        estimate.estimate_distribution_type == DistributionType.MultipleVendors
      ) {
        vendor_id =
          Number(
            estimateDetailModel.length > 0 && estimateDetailModel[0]?.vendor_id,
          ) || payload.vendor_id;
      }

      await queryRunner.manager.update(
        EstimateMasterModel,
        { id: payload.estimate_master_id },
        {
          status: payload.status,
          ...(estimate.estimate_distribution_type ==
            DistributionType.DistributeToAllVendors ||
          estimate.estimate_distribution_type ==
            DistributionType.PreferredVendor ||
          estimate.estimate_distribution_type ==
            DistributionType.MultipleVendors
            ? {
                vendor_id,
              }
            : {
                vendor_id: estimate.vendor_id || payload.vendor_id,
              }),
        },
      );

      if (payload.status === EstimateStatus.EstimateApprovedByOwner) {
        await this.estimateMasterRepository.approveVendorEstimateDetail(
          queryRunner,
          payload.estimate_master_id,
          payload?.vendor_id,
        );

        /**
         * Delete the estimate vendor distribution record for multiple vendors. when estimate is approved by owner.
         */
        if (
          estimate.estimate_distribution_type ==
          DistributionType.MultipleVendors
        ) {
          await queryRunner.manager.delete(EstimateVendorDistributionModel, {
            estimate_master_id: payload.estimate_master_id,
            vendor_id: vendor_id,
          });
        }

        const serviceRequestPayload = {
          property_master_id: estimate.property_master_id,
          service_type_id: estimate.service_type_id,
          description: estimate.description,
          priority: payload.priority,
          start_date: payload.start_date,
          vendor_ids: [payload?.vendor_id],
          ...(payload?.vendor_id && {
            distribution_type: DistributionType.SelectedVendor,
          }),
          is_guest: false,
        } as CreateServiceRequestDto;

        serviceRequest = await this.serviceRequestService.createServiceRequest(
          serviceRequestPayload,
          user,
          false,
          false,
          estimate.id,
        );
      }

      // const estimateModel = await this.getEstimate(
      //   payload.estimate_master_id,
      //   user,
      // );

      await queryRunner.commitTransaction();
      return { estimate: null, service_request: serviceRequest };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getQuotationsForEstimate(
    estimate_master_id: number,
    user: JwtPayload,
    vendor_id?: number,
  ): Promise<EstimateMasterModel> {
    const data = await this.estimateMasterRepository.getQuotationsForEstimate(
      estimate_master_id,
      user,
      vendor_id,
    );

    if (data?.estimateAsset) {
      data.estimateAsset = await Promise.all(
        data.estimateAsset.map(async (d) => {
          d.image_url = await this.getDownloadUrl(d.media_url);
          return d;
        }),
      );
    }

    return data;
  }

  async getApprovedQuotations(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const data = await this.estimateMasterRepository.getApprovedQuotations(
      paginationParams,
      user,
      query,
    );
    return data;
  }

  async estimateQuoteStatus(
    estimateMasterId: number,
    user: JwtPayload,
  ): Promise<{
    is_estimate_approved: boolean;
    all_quotes_rejected: boolean;
    quotes_available: boolean;
  }> {
    const estimate: EstimateMasterModel =
      await this.estimateMasterRepository.findOne({
        where: {
          id: estimateMasterId,
          franchise_id: Number(user.franchise_id),
        },
      });

    if (!estimate)
      throw new BadRequestException(EstimateMessage.ESTIMATE_NOT_FOUND);

    const estimateDetailModel: EstimateDetailModel[] =
      await this.estimateDetailsRepository.find({
        estimate_master_id: estimateMasterId,
        is_send_to_owner: true,
      });

    const isEstimateApproved =
      estimateDetailModel.length > 0 &&
      estimateDetailModel.some((item) => item.is_estimate_approved);

    const allQuotesRejected =
      estimateDetailModel.length > 0 &&
      estimateDetailModel.every((item) => item.is_quote_rejected);

    return {
      is_estimate_approved: isEstimateApproved,
      all_quotes_rejected: allQuotesRejected,
      quotes_available: estimateDetailModel.length > 0,
    };
  }

  async rejectQuotation(
    payload: RejectQuotationDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const estimate =
        await this.estimateMasterRepository.getEstimateByIdForRejection(
          payload.estimate_master_id,
          payload.vendor_id,
          user,
        );

      if (!estimate)
        throw new BadRequestException(EstimateMessage.ESTIMATE_NOT_FOUND);

      if (estimate.status === EstimateStatus.EstimateApprovedByOwner)
        throw new BadRequestException(
          EstimateMessage.ESTIMATE_ALREADY_SUBMITTED,
        );

      if (
        [
          EstimateStatus.EstimateRequestedByOwner,
          EstimateStatus.EstimateVendorAssignment,
        ].includes(estimate.status)
      )
        throw new BadRequestException(EstimateMessage.INVALID_ACTION);

      if (!payload?.reject_all_quotes && !estimate.estimateDetail?.length)
        throw new BadRequestException(
          EstimateMessage.VENDOR_ESTIMATE_NOT_FOUND,
        );

      if (
        estimate.estimate_distribution_type === DistributionType.SelectedVendor
      )
        queryRunner.manager.update(
          EstimateMasterModel,
          { id: payload.estimate_master_id },
          {
            status: EstimateStatus.EstimateRejectedByOwner,
          },
        );

      if (
        estimate.estimate_distribution_type == DistributionType.MultipleVendors
      ) {
        queryRunner.manager.delete(EstimateVendorDistributionModel, {
          estimate_master_id: payload.estimate_master_id,
          vendor_id: payload.vendor_id,
        });
      }

      const nonRejectedQuotations: EstimateDetailModel[] =
        await this.estimateMasterRepository.getNonRejectedQuotations(
          payload.estimate_master_id,
        );

      await queryRunner.manager.update(
        EstimateDetailModel,
        {
          estimate_master_id: payload.estimate_master_id,
          is_send_to_owner: true,
          is_decline_by_vendor: false,
          is_estimate_approved: false,
          is_quote_rejected: false,
          ...(!payload?.reject_all_quotes && { vendor_id: payload?.vendor_id }),
        },
        {
          is_quote_rejected: true,
        },
      );

      if (payload?.reject_all_quotes && nonRejectedQuotations.length > 0) {
        const userEstimateDescriptions = nonRejectedQuotations.map(
          (quote: EstimateDetailModel) => {
            const userEstimateDescription = new UserDescriptionModel();

            userEstimateDescription.estimate_master_id =
              quote.estimate_master_id;
            userEstimateDescription.description = payload.description;
            userEstimateDescription.user_id = user.id;
            userEstimateDescription.is_estimate_reject_description = true;
            userEstimateDescription.vendor_id = quote.vendor_id;

            return userEstimateDescription;
          },
        );
        queryRunner.manager.save(
          UserDescriptionModel,
          userEstimateDescriptions,
        );
      } else {
        const userEstimateDescription = new UserDescriptionModel();

        userEstimateDescription.estimate_master_id = payload.estimate_master_id;
        userEstimateDescription.description = payload.description;
        userEstimateDescription.user_id = user.id;
        userEstimateDescription.is_estimate_reject_description = true;
        userEstimateDescription.vendor_id = payload.vendor_id;

        await queryRunner.manager.save(
          UserDescriptionModel,
          userEstimateDescription,
        );
      }

      let vendor = null;

      const franchiseAdmin = await this.userRepository.findOne({
        where: {
          franchise_id: estimate.franchise_id,
          is_deleted: false,
          user_type: UserType.FranchiseAdmin,
        },
      });

      const lineItems = {
        franchiseAdmin: this.getFilteredLineItems(
          estimate.estimateDetail,
          franchiseAdmin,
          payload,
        ),
      };

      const notifications = [
        {
          action:
            NotificationAction.ESTIMATE_REJECTION_BY_OWNER_FOR_FRANCHISE_ADMIN,
          recipient: franchiseAdmin?.email,
          lineItems: lineItems.franchiseAdmin,
          contact: franchiseAdmin?.contact,
        },
      ];

      if (payload?.reject_all_quotes) {
        const estimateVendorIds = estimate.estimateDetail.map(
          (ed) => ed.vendor_id,
        );
        const vendorIds = [...new Set(estimateVendorIds)];
        const vendors = await this.userRepository.find({
          id: In(vendorIds),
          is_deleted: false,
          user_type: UserType.Vendor,
        });
        vendors.forEach((vendor) => {
          notifications.push({
            action: NotificationAction.ESTIMATE_REJECTION_BY_OWNER_FOR_VENDOR,
            recipient: vendor?.email,
            lineItems: estimate.estimateDetail
              .filter(
                (ed) => ed.vendor_id == vendor.id && !ed.franchise_admin_id,
              )
              .map((item) => ({
                line_item: item.line_item,
                price: item.price,
              })),
            contact: vendor?.contact,
          });
        });
      } else if (payload?.vendor_id) {
        vendor = await this.userRepository.findOne({
          where: {
            id: payload.vendor_id,
            is_deleted: false,
            user_type: UserType.Vendor,
          },
        });

        const vendorLineItems = this.getFilteredLineItems(
          estimate.estimateDetail,
          vendor,
          payload,
        );
        notifications.push({
          action: NotificationAction.ESTIMATE_REJECTION_BY_OWNER_FOR_VENDOR,
          recipient: vendor?.email,
          lineItems: vendorLineItems,
          contact: vendor?.contact,
        });
      }

      const notificationPayloadBase = {
        link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
        description: parse(payload.description).text,
        ownerName: estimate.owner.first_name
          ? `${estimate.owner.first_name} ${estimate.owner.last_name}`
          : estimate.owner.email,
        propertyAddress: estimate.propertyMaster.address,
        serviceType: estimate.serviceType.title,
        estimateId: String(estimate.id),
        smsBody: `${estimate.owner.first_name} ${estimate.owner.last_name} rejected the quotation against property ${estimate.propertyMaster.address} with service type ${estimate.serviceType.title} for estimate # ${estimate.id}`,
      };

      Promise.all(
        notifications.map(({ action, recipient, lineItems, contact }) =>
          this.notificationsService.sendNotification(
            action,
            { ...notificationPayloadBase, lineItems },
            [recipient],
            [contact],
          ),
        ),
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

  async groupEstimateDetails(data: any[]): Promise<any[]> {
    const groupedData: Record<string, any> = {};

    data.forEach((item) => {
      const estimateId = item.estimate_master_id;
      if (!groupedData[estimateId]) {
        groupedData[estimateId] = {
          estimate_master_id: estimateId,
          estimate_description:
            item.estimateMasterRejection?.description || null,
          estimate_franchise_description:
            item.estimateMasterRejection?.franchise_description || null,
          estimate_distribution_type:
            item.estimateMasterRejection?.estimate_distribution_type || null,
          estimate_rejection_description:
            item.estimateMasterRejection?.estimateDescription?.[0] || null,
          propertyMaster: item.estimateMasterRejection.propertyMaster || null,
          serviceType: item.estimateMasterRejection.serviceType || null,
          vendor: item.estimateVendorRejection || null,
          estimateDetail: [],
        };
      }

      // Push the line item details into the `details` array
      groupedData[estimateId].estimateDetail.push({
        id: item.id,
        line_item: item.line_item,
        price: item.price,
        vendor_id: item.vendor_id,
        franchise_admin_id: item.franchise_admin_id,
        is_estimate_approved: item.is_estimate_approved,
        is_grand_total: item.is_grand_total,
      });
    });

    const groupedValues = Object.values(groupedData);
    return groupedValues?.[0] || null;
  }

  async getRejectedQuotationById(
    estimate_master_id: number,
    vendor_id: number,
  ): Promise<any> {
    const data =
      await this.estimateDetailRejectionRepository.getRejectedQuotationById(
        estimate_master_id,
        vendor_id,
      );
    return this.groupEstimateDetails(data);
  }

  async getApprovedQuotationById(
    estimate_master_id: number,
    user: JwtPayload,
  ): Promise<EstimateMasterModel> {
    const data = await this.estimateMasterRepository.getApprovedQuotationById(
      estimate_master_id,
      user,
    );
    return data;
  }

  async archiveEstimate(
    payload: ArchiveEstimateDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const estimate: EstimateMasterModel =
      await this.estimateMasterRepository.findOne({
        where: {
          id: payload.id,
          is_deleted: false,
          franchise_id: Number(user.franchise_id),
        },
      });

    if (!estimate)
      throw new BadRequestException(EstimateMessage.ESTIMATE_NOT_FOUND);

    if (estimate.is_archived && payload.archived)
      throw new BadRequestException(EstimateMessage.ESTIMATE_ALREADY_ARCHIVE);

    if (!estimate.is_archived && !payload.archived)
      throw new BadRequestException(EstimateMessage.ESTIMATE_ALREADY_UNARCHIVE);

    await this.estimateMasterRepository.update(
      {
        id: payload.id,
        is_deleted: false,
        franchise_id: Number(user.franchise_id),
      },
      {
        is_archived: payload.archived,
      },
    );

    return true;
  }

  async archiveQuotation(payload: ArchiveEstimateDto): Promise<boolean> {
    const quotation = await this.estimateDetailsRepository.findOne({
      where: {
        id: payload.id,
        is_deleted: false,
      },
    });

    if (!quotation)
      throw new BadRequestException(EstimateMessage.QUOTE_NOT_FOUND);

    await this.estimateDetailsRepository.update(
      { id: payload.id },
      { is_archived: payload.archived },
    );

    return true;
  }

  async archiveRejectedQuotation(
    payload: ArchiveEstimateDto,
  ): Promise<boolean> {
    const rejectedQuotation =
      await this.estimateDetailRejectionRepository.findOne({
        where: {
          id: payload.id,
          is_deleted: false,
        },
      });

    if (!rejectedQuotation)
      throw new BadRequestException(EstimateMessage.QUOTE_NOT_FOUND);

    await this.estimateDetailRejectionRepository.update(
      { id: payload.id },
      { is_archived: payload.archived },
    );

    return true;
  }

  async archive(
    payload: ArchiveEstimateDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const { is_quote, is_rejected_quote } = payload;

    if (is_rejected_quote) {
      await this.archiveRejectedQuotation(payload);
      return true;
    }

    if (is_quote) {
      await this.archiveQuotation(payload);
      return true;
    }

    await this.archiveEstimate(payload, user);
    return true;
  }

  async estimateExists(user: JwtPayload): Promise<{ exists: boolean }> {
    const estimate = await this.estimateMasterRepository.findOne({
      where: {
        is_deleted: false,
        franchise_id: Number(user.franchise_id),
        owner_id: Number(user.id),
      },
    });
    return { exists: !!estimate };
  }

  async getEstimateQuotationsById(
    estimateMasterId: number,
    query: PaginationParam,
    user: JwtPayload,
  ): Promise<{ data: EstimateDetailModel[]; count: number }> {
    const paginationOpts = this.generalHelper.getPaginationOptionsV2(query);
    return await this.estimateMasterRepository.getEstimateQuotationsById(
      estimateMasterId,
      paginationOpts,
      user,
    );
  }

  async getEstimateV2(
    query: EstimateQueryDto,
    user: JwtPayload,
  ): Promise<{ data: EstimateDetailModel[]; count: number }> {
    const paginationOpts = this.generalHelper.getPaginationOptionsV2(query);

    if (user.user_type === UserType.Vendor)
      return await this.estimateMasterRepository.getVendorEstimatesV2(
        paginationOpts,
        query,
        user,
      );
    return await this.estimateMasterRepository.getEstimatesV2(
      paginationOpts,
      query,
      user,
    );
  }

  async vendorEstimateDecline(
    query: VendorEstimateDeclineDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const estimateMaster = await this.estimateMasterRepository.findOne({
      where: {
        id: query.estimate_master_id,
        is_deleted: false,
        franchise_id: Number(user.franchise_id),
      },
    });

    if (!estimateMaster)
      throw new BadRequestException(EstimateMessage.ESTIMATE_NOT_FOUND);

    const estimateDetail: EstimateDetailModel =
      await this.estimateDetailsRepository.findOne({
        where: {
          estimate_master_id: query.estimate_master_id,
          is_decline_by_vendor: true,
        },
      });

    if (estimateDetail)
      throw new BadRequestException(EstimateMessage.ESTIMATE_ALREADY_DECLINED);

    const estimateDetailModel = new EstimateDetailModel();

    estimateDetailModel.estimate_master_id = query.estimate_master_id;
    estimateDetailModel.line_item = 'N/A';
    estimateDetailModel.price = 0;
    estimateDetailModel.vendor_id = user.id;
    estimateDetailModel.franchise_admin_id = null;
    estimateDetailModel.is_estimate_approved = false;
    estimateDetailModel.is_grand_total = false;
    estimateDetailModel.is_send_to_owner = false;
    estimateDetailModel.is_archived = false;
    estimateDetailModel.is_quote_rejected = false;
    estimateDetailModel.is_decline_by_vendor = true;

    await this.estimateDetailsRepository.save(estimateDetailModel);

    return true;
  }
}
