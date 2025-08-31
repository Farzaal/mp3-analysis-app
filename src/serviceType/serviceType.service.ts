import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CreateGuestConciergeCategoryDto,
  CreateGuestConciergeServiceDto,
  CreateOrUpdateServiceTypeCategoryDto,
  CreateServiceTypeDto,
  GetGuestConciergeCategoryDto,
  GetGuestServiceTypeDto,
  GetServiceTypeDto,
  GetServiceTypeImagesDto,
  HandymanConciergeRatesDto,
  ServiceTypeStatusDto,
  UpdateGuestConciergeServiceDto,
  UpdateServiceTypeCategoryStatusDto,
  UpdateServiceTypeDto,
  UpdateServiceTypeStatusDto,
  UpsertPropertyServiceTypeRatesDto,
} from './serviceType.dto';
import { ServiceTypeRepository } from '@/app/repositories/serviceType/serviceType.respository';
import { ServiceTypeModel } from '@/app/models/serviceType/serviceType.model';
import { ServiceTypeMessages } from './serviceType.messages';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { PricingType } from '@/app/contracts/enums/pricingType.enum';
import { ServiceTypeCategoryRepository } from '@/app/repositories/serviceType/serviceTypeCategory.repository';
import { ServiceTypeCategoryModel } from '@/app/models/serviceType/serviceTypeCategory.model';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { PropertyServiceTypeRateRepository } from '@/app/repositories/property/propertyServiceTypeRate.repository';
import { PropertyServiceTypeRateModel } from '@/app/models/property/propertyServiceTypeRates.model';
import { PropertyService } from '@/properties/property.service';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { FranchiseServiceTypeCategoryRepository } from '@/app/repositories/serviceType/franchiseServiceTypeCategory.repository';
import { DataSource, In, QueryRunner } from 'typeorm';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { FranchiseServiceTypeCategoryModel } from '@/app/models/serviceType/franchiseServiceTypeCategory.model';
import { FranchiseServiceTypeModel } from '@/app/models/serviceType/franchiseServiceType.model';
import { ServiceTypeRequestRepository } from '@/app/repositories/serviceType/serviceTypeRequest.repository';
import { ServiceTypeRequestModel } from '@/app/models/serviceType/serviceTypeRequest.model';
import { ServiceTypeRequestStatus } from '@/app/contracts/enums/serviceTypeRequest.enum';
import { PaginationParam } from '@/app/commons/base.request';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from '@/app/utils/general.helper';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
import { VendorServiceTypeRepository } from '@/app/repositories/vendor/vendorServiceType.repository';
import { NotificationsService } from '@/notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { URLS } from '@/app/contracts/enums/urls.enum';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { VendorServiceTypePriorityRepository } from '@/app/repositories/vendor/vendorServiceTypePriority.repository';
import { VendorServiceTypeModel } from '@/app/models/serviceType/vendorServiceType.model';
import { VendorServiceTypePriorityModel } from '@/app/models/serviceType/vendorServiceTypePriorities.model';
import { ServiceTypeImageModel } from '@/app/models/serviceType/serviceTypeImage.model';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';
import { GetGuestConciergeServiceDto } from './serviceType.dto';
import { S3Service } from '@/app/commons/s3.service';

@Injectable()
export class ServiceTypeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly serviceTypeRepository: ServiceTypeRepository,
    private readonly serviceTypeRequestRepository: ServiceTypeRequestRepository,
    private readonly franchiseServiceTypeRepository: FranchiseServiceTypeRepository,
    private readonly serviceTypeCategoryRepository: ServiceTypeCategoryRepository,
    private readonly franchiseServiceTypeCategoryRepository: FranchiseServiceTypeCategoryRepository,
    private readonly propertyServiceTypeRateRepository: PropertyServiceTypeRateRepository,
    private readonly vendorServiceTypeRepository: VendorServiceTypeRepository,
    private readonly propertyService: PropertyService,
    private readonly franchiseRepository: FranchiseRepository,
    private readonly generalHelper: GeneralHelper,
    private readonly notificationsService: NotificationsService,
    private readonly vendorServiceTypePriorityRepository: VendorServiceTypePriorityRepository,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createOrUpdateServiceType(
    payload: CreateServiceTypeDto | UpdateServiceTypeDto,
    user: JwtPayload,
  ): Promise<ServiceTypeModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const castedPayload = payload as UpdateServiceTypeDto;
      const where: Record<string, string | number | boolean> =
        castedPayload?.service_type_id
          ? {
              id: castedPayload?.service_type_id,
              is_deleted: false,
            }
          : { title: castedPayload?.title, is_deleted: false };
      const serviceType: ServiceTypeModel =
        await this.serviceTypeRepository.findOne({
          where,
        });

      if (serviceType && !castedPayload?.service_type_id)
        throw new BadRequestException(ServiceTypeMessages.SERVICE_TYPE_EXISTS);

      if (!serviceType && castedPayload?.service_type_id)
        throw new BadRequestException(
          ServiceTypeMessages.SERVICE_TYPE_NOT_FOUND,
        );

      const serviceTypeModel = serviceType || new ServiceTypeModel();

      if (user.user_type === UserType.SuperAdmin) {
        const serviceTypeCatModel: ServiceTypeCategoryModel =
          await this.serviceTypeCategoryRepository.findOne({
            where: {
              id: payload.service_type_category_id,
              is_deleted: false,
            },
          });
        if (!serviceTypeCatModel)
          throw new BadRequestException(
            ServiceTypeMessages.SERVICE_TYPE_CATEGORY_NOT_EXISTS,
          );
        serviceTypeModel.title = payload.title;
        serviceTypeModel.service_type_category_id =
          payload.service_type_category_id;
        if (!castedPayload?.service_type_id) {
          serviceTypeModel.is_recurring = serviceTypeCatModel.is_linen
            ? true
            : payload?.is_recurring;
          serviceTypeModel.is_linen = serviceTypeCatModel.is_linen;
          serviceTypeModel.is_handyman_concierge =
            serviceTypeCatModel.is_handyman_concierge;
          serviceTypeModel.standard_hourly =
            serviceTypeCatModel.standard_hourly;
        }

        const newServiceType = await queryRunner.manager.save(
          ServiceTypeModel,
          serviceTypeModel,
        );
        if (!castedPayload?.service_type_id)
          await this.addServiceTypeToAllFranchises(newServiceType, queryRunner);
      }

      if (
        [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        ) &&
        castedPayload?.service_type_id
      ) {
        const franchiseServiceTypeCatModel: FranchiseServiceTypeCategoryModel =
          await this.franchiseServiceTypeCategoryRepository.findOne({
            where: {
              franchise_id: Number(user.franchise_id),
              service_type_category_id: payload.service_type_category_id,
            },
          });
        if (!franchiseServiceTypeCatModel)
          throw new BadRequestException(
            ServiceTypeMessages.SERVICE_TYPE_CATEGORY_NOT_EXISTS,
          );
        const franchiseServiceTypeModel: FranchiseServiceTypeModel =
          await this.franchiseServiceTypeRepository.findOne({
            where: {
              franchise_id: Number(user.franchise_id),
              service_type_id: castedPayload?.service_type_id,
              franchise_service_type_category_id:
                franchiseServiceTypeCatModel.id,
            },
          });
        if (!franchiseServiceTypeModel)
          throw new BadRequestException(
            ServiceTypeMessages.FRANCHISE_SERVICE_TYPE_NOT_FOUND,
          );
        if (franchiseServiceTypeModel) {
          franchiseServiceTypeModel.pricing_type = PricingType.Manual;
          franchiseServiceTypeModel.door_code_access =
            payload?.door_code_access ??
            franchiseServiceTypeModel.door_code_access;
          franchiseServiceTypeModel.owners_phone_access =
            payload?.owners_phone_access ??
            franchiseServiceTypeModel.owners_phone_access;
          franchiseServiceTypeModel.allow_recurring_request =
            payload?.allow_recurring_request ??
            franchiseServiceTypeModel?.allow_recurring_request;
          franchiseServiceTypeModel.notify_status_change =
            payload?.notify_status_change ??
            franchiseServiceTypeModel?.notify_status_change;
          franchiseServiceTypeModel.turn_over =
            payload?.turn_over ?? franchiseServiceTypeModel?.turn_over;
          franchiseServiceTypeModel.use_cleaning_logic =
            payload.use_cleaning_logic ??
            franchiseServiceTypeModel.use_cleaning_logic;
          franchiseServiceTypeModel.use_preventive_logic =
            payload?.use_preventive_logic ??
            franchiseServiceTypeModel?.use_preventive_logic;
          franchiseServiceTypeModel.available_to_guest =
            payload?.available_to_guest ??
            franchiseServiceTypeModel?.available_to_guest;
          franchiseServiceTypeModel.apply_service_fee =
            payload?.apply_service_fee ??
            franchiseServiceTypeModel?.apply_service_fee;
          franchiseServiceTypeModel.price = 0;
          user?.franchise_id &&
            (franchiseServiceTypeModel.franchise_id = Number(
              user.franchise_id,
            ));
          await queryRunner.manager.save(
            FranchiseServiceTypeModel,
            franchiseServiceTypeModel,
          );

          const associatedFranchiseServiceTypes =
            await this.franchiseServiceTypeRepository.find({
              franchise_id: Number(user.franchise_id),
              associated_service_type_id: castedPayload?.service_type_id,
            });

          if (associatedFranchiseServiceTypes.length > 0) {
            const updatedAssociatedServiceTypes =
              associatedFranchiseServiceTypes.map(
                (associatedFranchiseServiceType) => {
                  const {
                    door_code_access,
                    owners_phone_access,
                    turn_over,
                    allow_recurring_request,
                    notify_status_change,
                    use_cleaning_logic,
                    use_preventive_logic,
                    available_to_guest,
                    apply_service_fee,
                  } = franchiseServiceTypeModel;

                  associatedFranchiseServiceType.door_code_access =
                    door_code_access;
                  associatedFranchiseServiceType.owners_phone_access =
                    owners_phone_access;
                  associatedFranchiseServiceType.turn_over = turn_over;
                  associatedFranchiseServiceType.allow_recurring_request =
                    allow_recurring_request;
                  associatedFranchiseServiceType.notify_status_change =
                    notify_status_change;
                  associatedFranchiseServiceType.use_cleaning_logic =
                    use_cleaning_logic;
                  associatedFranchiseServiceType.use_preventive_logic =
                    use_preventive_logic;
                  associatedFranchiseServiceType.available_to_guest =
                    available_to_guest;
                  associatedFranchiseServiceType.apply_service_fee =
                    apply_service_fee;

                  return associatedFranchiseServiceType;
                },
              );
            await queryRunner.manager.save(
              FranchiseServiceTypeModel,
              updatedAssociatedServiceTypes,
            );
          }
        }
      }
      await queryRunner.commitTransaction();
      return serviceTypeModel;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createOrUpdateServiceTypeCategory(
    payload: CreateOrUpdateServiceTypeCategoryDto,
    serviceTypeCatId?: number,
  ): Promise<ServiceTypeCategoryModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const where: Record<string, string | number | boolean> = serviceTypeCatId
        ? {
            id: serviceTypeCatId,
            is_deleted: false,
          }
        : { title: payload.title, is_deleted: false };

      let serviceTypeCategory: ServiceTypeCategoryModel =
        await this.serviceTypeCategoryRepository.findOne({
          where,
        });

      if (serviceTypeCategory && !serviceTypeCatId)
        throw new BadRequestException(
          ServiceTypeMessages.SERVICE_TYPE_CATEGORY_EXISTS,
        );

      if (serviceTypeCatId && !serviceTypeCategory)
        throw new BadRequestException(
          ServiceTypeMessages.SERVICE_TYPE_CATEGORY_NOT_EXISTS,
        );

      if (!serviceTypeCategory) {
        serviceTypeCategory = new ServiceTypeCategoryModel();
        serviceTypeCategory.is_linen = payload.is_linen;
        serviceTypeCategory.is_handyman_concierge =
          payload.is_handyman_concierge;
        serviceTypeCategory.standard_hourly = payload.standard_hourly;
      }

      serviceTypeCategory.title = payload.title;

      const serviceTypeCatModel = await queryRunner.manager.save(
        ServiceTypeCategoryModel,
        serviceTypeCategory,
      );

      if (!serviceTypeCatId)
        await this.addServiceTypeCategoryToAllFranchises(
          serviceTypeCategory,
          queryRunner,
        );

      if (!serviceTypeCatId) {
        const franchiseAdmins = await this.userRepository.find({
          user_type: UserType.FranchiseAdmin,
        });

        const emails = franchiseAdmins.map((admin) => admin.email);

        const smsReceivers = franchiseAdmins
          .map((admin) => admin.contact)
          .filter((rec) => rec !== null);

        if (emails.length) {
          await this.notificationsService.sendNotification(
            NotificationAction.SERVICE_TYPE_CATEGORY_CREATED,
            {
              link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
              title: payload.title,
              smsBody: `Congratulations! New service type category added named as ${payload.title}`,
            },
            emails,
            smsReceivers,
          );
        }
      }

      await queryRunner.commitTransaction();
      return serviceTypeCatModel;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteServiceTypeCategory(
    serviceTypeCategoryId: number,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const serviceTypeCategory: ServiceTypeCategoryModel =
        await this.serviceTypeCategoryRepository.findOne({
          where: { id: serviceTypeCategoryId, is_deleted: false },
        });

      if (!serviceTypeCategory)
        throw new BadRequestException(
          ServiceTypeMessages.SERVICE_TYPE_CATEGORY_NOT_EXISTS,
        );

      await queryRunner.manager.update(
        ServiceTypeCategoryModel,
        {
          id: serviceTypeCategoryId,
        },
        { is_deleted: true },
      );

      await queryRunner.manager.update(
        ServiceTypeModel,
        {
          service_type_category_id: serviceTypeCategoryId,
        },
        { is_deleted: true },
      );

      await queryRunner.manager.update(
        FranchiseServiceTypeCategoryModel,
        {
          service_type_category_id: serviceTypeCategoryId,
        },
        { is_deleted: true },
      );

      const serviceTypeModel: ServiceTypeModel[] =
        await this.serviceTypeRepository.find({
          service_type_category_id: serviceTypeCategoryId,
          is_deleted: false,
        });

      const serviceTypeIds = serviceTypeModel.map(
        (serviceType) => serviceType.id,
      );

      if (serviceTypeIds.length > 0) {
        await queryRunner.manager.update(
          FranchiseServiceTypeModel,
          {
            service_type_id: In(serviceTypeIds),
          },
          { is_deleted: true },
        );
      }
      await queryRunner.commitTransaction();
      const franchiseAdmins = await this.userRepository.find({
        user_type: UserType.FranchiseAdmin,
      });

      const emails = franchiseAdmins.map((admin) => admin.email);

      const smsReceivers = franchiseAdmins
        .map((admin) => admin.contact)
        .filter((rec) => rec !== null);

      if (emails.length) {
        await this.notificationsService.sendNotification(
          NotificationAction.SERVICE_TYPE_CATEGORY_DELETED,
          {
            link: `${this.configService.get('PORTAL_FRONTEND_URL')}/login`,
            title: serviceTypeCategory.title,
            smsBody: `Service type category named as ${serviceTypeCategory.title} has been deleted`,
          },
          emails,
          smsReceivers,
        );
      }
      return true;
    } catch (error) {
      // this.logger.error('Error in deleting service type category', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteServiceType(serviceTypeId: number): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const serviceTypeModel: ServiceTypeModel =
        await this.serviceTypeRepository.findOne({
          where: { id: serviceTypeId, is_deleted: false },
        });

      if (!serviceTypeModel)
        throw new BadRequestException(
          ServiceTypeMessages.SERVICE_TYPE_NOT_FOUND,
        );

      await queryRunner.manager.update(
        ServiceTypeModel,
        {
          id: serviceTypeId,
        },
        { is_deleted: true },
      );

      await queryRunner.manager.update(
        FranchiseServiceTypeModel,
        {
          service_type_id: serviceTypeId,
        },
        { is_deleted: true, is_active: false },
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

  async upsertPropertyServiceTypeRates(
    payload: UpsertPropertyServiceTypeRatesDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      await this.propertyService.validateProperty(
        payload.property_master_id,
        user,
      );

      const userId: number =
        user.user_type === UserType.StandardAdmin
          ? Number(user.franchise_admin)
          : Number(user.id);

      await queryRunner.manager.delete(PropertyServiceTypeRateModel, {
        property_master_id: payload.property_master_id,
        franchise_id: Number(user.franchise_id),
        franchise_admin_id: userId,
        service_type_id: In(payload.charges.map((charge) => charge.id)),
      });

      await queryRunner.manager.delete(VendorServiceTypePriorityModel, {
        property_master_id: payload.property_master_id,
        franchise_id: Number(user.franchise_id),
        service_type_id: In(payload.charges.map((charge) => charge.id)),
      });

      let prefVendorModel: VendorServiceTypePriorityModel[] = [];

      const propertyServiceTypePayload: PropertyServiceTypeRateModel[] =
        payload.charges.map((charge) => {
          const propertyServiceTypeRateModel =
            new PropertyServiceTypeRateModel();
          propertyServiceTypeRateModel.property_master_id =
            payload.property_master_id;
          propertyServiceTypeRateModel.service_type_id = charge.id;
          propertyServiceTypeRateModel.franchise_id = Number(user.franchise_id);
          propertyServiceTypeRateModel.franchise_admin_id = userId;
          propertyServiceTypeRateModel.owner_charge = charge.owner_charge || 0;
          propertyServiceTypeRateModel.vendor_charge =
            charge.vendor_charge || 0;
          propertyServiceTypeRateModel.discount_percentage =
            charge.discount_percentage || 0;

          if (charge?.pref_vendors && charge.pref_vendors.length > 0) {
            prefVendorModel = prefVendorModel.concat(
              charge.pref_vendors.map((vendor) => {
                const vendorServiceTypePriorityModel =
                  new VendorServiceTypePriorityModel();
                vendorServiceTypePriorityModel.property_master_id =
                  payload.property_master_id;
                vendorServiceTypePriorityModel.franchise_id = Number(
                  user.franchise_id,
                );
                vendorServiceTypePriorityModel.vendor_id = vendor;
                vendorServiceTypePriorityModel.created_by = userId;
                vendorServiceTypePriorityModel.service_type_id = charge.id;
                return vendorServiceTypePriorityModel;
              }),
            );
          }
          return propertyServiceTypeRateModel;
        });

      await queryRunner.manager.save(
        PropertyServiceTypeRateModel,
        propertyServiceTypePayload,
      );

      if (prefVendorModel.length > 0)
        await queryRunner.manager.save(
          VendorServiceTypePriorityModel,
          prefVendorModel,
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

  // Deprecated
  async getPropertyServiceTypeRates(
    propertyMasterId: number,
    user: JwtPayload,
  ): Promise<PropertyServiceTypeRateModel[]> {
    return await this.propertyServiceTypeRateRepository.find({
      property_master_id: propertyMasterId,
      franchise_id: Number(user.franchise_id),
    });
  }

  private async addServiceTypeCategoryToAllFranchises(
    serviceTypeCategoryModel: ServiceTypeCategoryModel,
    queryRunner: QueryRunner,
    isActive: boolean = true,
  ): Promise<FranchiseServiceTypeCategoryModel[]> {
    const franchises: FranchiseModel[] = await this.franchiseRepository.find(
      {},
    );

    const franchiseServiceTypeCategoryData: FranchiseServiceTypeCategoryModel[] =
      franchises.map((franchise) =>
        queryRunner.manager.create(FranchiseServiceTypeCategoryModel, {
          franchise_id: franchise.id,
          service_type_category_id: serviceTypeCategoryModel.id,
          is_deleted: false,
          is_active: isActive,
        }),
      );

    return await queryRunner.manager.save(
      FranchiseServiceTypeCategoryModel,
      franchiseServiceTypeCategoryData,
    );
  }

  private async addServiceTypeToAllFranchises(
    serviceTypeModel: ServiceTypeModel,
    queryRunner: QueryRunner,
    isActive: boolean = true,
  ): Promise<FranchiseServiceTypeModel[]> {
    const franchises: FranchiseModel[] = await this.franchiseRepository.find(
      {},
    );
    const franchiseServiceTypeCat: FranchiseServiceTypeCategoryModel[] =
      await this.franchiseServiceTypeCategoryRepository.find({
        service_type_category_id: serviceTypeModel.service_type_category_id,
      });
    const franchiseServiceTypeData: FranchiseServiceTypeModel[] =
      franchises.map((franchise) =>
        queryRunner.manager.create(FranchiseServiceTypeModel, {
          franchise_id: franchise.id,
          service_type_id: serviceTypeModel.id,
          pricing_type: PricingType.Manual,
          is_active: isActive,
          is_deleted: false,
          franchise_service_type_category_id:
            franchiseServiceTypeCat.find((c) => c.franchise_id == franchise.id)
              ?.id || null,
        }),
      );
    return await queryRunner.manager.save(
      FranchiseServiceTypeModel,
      franchiseServiceTypeData,
    );
  }

  public async updateServiceTypeCategoryStatus(
    payload: UpdateServiceTypeCategoryStatusDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const franchiseServiceTypeCats =
        await this.franchiseServiceTypeCategoryRepository.findOne({
          where: {
            service_type_category_id: payload.service_type_category_id,
            franchise_id: Number(user.franchise_id),
            is_deleted: false,
          },
        });

      if (!franchiseServiceTypeCats)
        throw new BadRequestException(
          ServiceTypeMessages.SERVICE_TYPE_CATEGORY_NOT_EXISTS,
        );

      await queryRunner.manager.update(
        FranchiseServiceTypeCategoryModel,
        {
          service_type_category_id: payload.service_type_category_id,
          franchise_id: Number(user.franchise_id),
        },
        { is_active: payload.is_active },
      );

      await queryRunner.manager.update(
        FranchiseServiceTypeModel,
        {
          franchise_service_type_category_id: franchiseServiceTypeCats.id,
          franchise_id: Number(user.franchise_id),
        },
        { is_active: payload.is_active },
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

  public async updateServiceTypeStatus(
    payload: UpdateServiceTypeStatusDto,
    user: JwtPayload,
  ): Promise<boolean> {
    await this.franchiseServiceTypeRepository.update(
      {
        service_type_id: payload.service_type_id,
        franchise_id: Number(user.franchise_id),
      },
      { is_active: payload.is_active },
    );
    return true;
  }

  public async getServiceTypes(
    user: JwtPayload,
    query: GetServiceTypeDto,
  ): Promise<ServiceTypeCategoryModel[]> {
    const serviceTypes: ServiceTypeCategoryModel[] =
      await this.serviceTypeCategoryRepository.getServiceTypes(
        user.franchise_id ? Number(user.franchise_id) : null,
        query,
        query?.show_active ? true : false,
      );

    if (query?.property_master_id) {
      const serviceTypeIds = serviceTypes
        .flatMap((st) => st.serviceType)
        .map((s) => s.id);

      const vendorServiceTypes: VendorServiceTypeModel[] =
        await this.vendorServiceTypeRepository.find(
          {
            franchise_id: Number(user?.franchise_id),
            service_type_id: In(serviceTypeIds),
          },
          null,
          ['vendor'],
        );

      const propertyServiceTypeRate: PropertyServiceTypeRateModel[] =
        await this.getPropertyServiceTypeRates(query?.property_master_id, user);

      const prefVendors =
        await this.vendorServiceTypePriorityRepository.getPropertyPreferredVendors(
          query?.property_master_id,
          Number(user.franchise_id),
        );

      return serviceTypes.map((stc) => {
        return {
          ...stc,
          serviceType: stc.serviceType.map((st) => {
            const propertyRate = propertyServiceTypeRate.find(
              (r) => r.service_type_id == st.id,
            );
            return {
              owner_charge: propertyRate?.owner_charge || 0,
              vendor_charge: propertyRate?.vendor_charge || 0,
              discount_percentage: propertyRate?.discount_percentage || 0,
              property_rate: propertyServiceTypeRate.find(
                (r) => r.service_type_id == st.id,
              ),
              ...st,
              pref_vendors: prefVendors
                .filter((r) => r.service_type_id == st.id)
                .map((r) => ({
                  id: r.vendor.id,
                  first_name: r.vendor.first_name,
                  last_name: r.vendor.last_name,
                  email: r.vendor.email,
                })),
              vendors: vendorServiceTypes
                .filter((r) => r.service_type_id == st.id)
                .map((r) => ({
                  id: r.vendor.id,
                  first_name: r.vendor.first_name,
                  last_name: r.vendor.last_name,
                  email: r.vendor.email,
                })),
            };
          }),
        };
      }) as any;
    }

    return serviceTypes;
  }

  public async getServiceTypeById(
    user: JwtPayload,
    serviceTypeId: number,
  ): Promise<FranchiseServiceTypeModel> {
    const serviceType: ServiceTypeModel =
      await this.serviceTypeRepository.findOne({
        where: { id: serviceTypeId, is_deleted: false },
      });

    if (!serviceType)
      throw new BadRequestException(ServiceTypeMessages.SERVICE_TYPE_NOT_FOUND);

    const franchiseServiceTypeModel: FranchiseServiceTypeModel =
      await this.franchiseServiceTypeRepository.findOne({
        where: {
          franchise_id: Number(user.franchise_id),
          service_type_id: serviceTypeId,
        },
        relations: ['serviceType', 'serviceType.serviceTypeCategory'],
      });

    if (!franchiseServiceTypeModel)
      throw new BadRequestException(
        ServiceTypeMessages.FRANCHISE_SERVICE_TYPE_NOT_FOUND,
      );

    return franchiseServiceTypeModel;
  }

  public async addNewFranchiseServices(
    franchise: FranchiseModel,
    queryRunner: QueryRunner,
  ): Promise<boolean> {
    const serviceTypes =
      await this.serviceTypeCategoryRepository.getServiceTypes(null, null);

    const franchiseServiceTypeCats = serviceTypes.map((stc) => {
      const franchiseServiceTypeCatModel =
        new FranchiseServiceTypeCategoryModel();
      franchiseServiceTypeCatModel.franchise_id = franchise.id;
      franchiseServiceTypeCatModel.service_type_category_id = stc.id;
      franchiseServiceTypeCatModel.is_active = true;
      return franchiseServiceTypeCatModel;
    });

    const franchiseServiceTypeCatModels = await queryRunner.manager.save(
      FranchiseServiceTypeCategoryModel,
      franchiseServiceTypeCats,
    );

    const franchiseServiceTypeModelsCol: FranchiseServiceTypeModel[] = [];

    serviceTypes.forEach((stc) => {
      const category = franchiseServiceTypeCatModels.find(
        (f) => f.service_type_category_id == stc.id,
      );
      stc.serviceType.forEach((st) => {
        const franchiseSTModel = new FranchiseServiceTypeModel();
        franchiseSTModel.franchise_id = franchise.id;
        franchiseSTModel.service_type_id = st.id;
        franchiseSTModel.pricing_type = PricingType.Manual;
        franchiseSTModel.is_active = true;
        franchiseSTModel.franchise_service_type_category_id =
          category?.id || null;
        franchiseServiceTypeModelsCol.push(franchiseSTModel);
      });
    });
    await queryRunner.manager.save(
      FranchiseServiceTypeModel,
      franchiseServiceTypeModelsCol,
    );
    return true;
  }

  public async getAllServiceCategories(): Promise<ServiceTypeCategoryModel[]> {
    const serviceTypesCategories =
      await this.serviceTypeCategoryRepository.getAllCategoriesForFormBuilder();
    return serviceTypesCategories;
  }

  async getServiceTypeForWordpress(
    franchiseId: number,
  ): Promise<ServiceTypeCategoryModel[]> {
    const serviceTypes =
      await this.serviceTypeCategoryRepository.getServiceTypes(
        franchiseId,
        null,
        true,
      );
    return serviceTypes;
  }

  async getFranchiseServiceType(user: JwtPayload): Promise<ServiceTypeModel[]> {
    return await this.serviceTypeRepository.getFranchiseSerivceTypes(
      Number(user.franchise_id),
    );
  }

  async getFranchiseGuestServiceType(query: GetGuestServiceTypeDto): Promise<{
    serviceTypes: ServiceTypeModel[];
    property: PropertyMasterModel;
  }> {
    let serviceTypes: ServiceTypeModel[] = [];
    const property = await this.propertyService.getPropertyById(
      Number(query.property_master_id),
      { is_deleted: false, off_program: false },
    );

    if (
      !property ||
      !property.membershipTier ||
      property.membershipTier.membership_type === MemberShipStatus.Free ||
      (property.membershipTier.membership_type === MemberShipStatus.Paid &&
        !property.membershipTier.next_due_date)
    ) {
      throw new BadRequestException(
        ServiceTypeMessages.PROPERTY_MEMBERSHIP_INVALID,
      );
    }

    if (property) {
      serviceTypes = await this.serviceTypeRepository.getFranchiseSerivceTypes(
        property.franchise_id,
        { ...query, is_active: true, available_to_guest: true },
      );
    }

    return { serviceTypes, property };
  }

  async requestServiceTypeCategory(
    payload: CreateOrUpdateServiceTypeCategoryDto,
    user: JwtPayload,
  ): Promise<ServiceTypeRequestModel> {
    const serviceTypeCategory: ServiceTypeCategoryModel =
      await this.serviceTypeCategoryRepository.findOne({
        where: { title: payload.title, is_deleted: false },
      });

    if (serviceTypeCategory)
      throw new BadRequestException(
        ServiceTypeMessages.SERVICE_TYPE_CATEGORY_EXISTS,
      );

    const serviceTypeRequestModel = new ServiceTypeRequestModel();

    serviceTypeRequestModel.service_type_category_title = payload.title;
    serviceTypeRequestModel.requested_by =
      user.user_type === UserType.StandardAdmin
        ? Number(user.franchise_admin)
        : Number(user.id);
    serviceTypeRequestModel.is_linen = payload.is_linen;
    serviceTypeRequestModel.is_handyman_concierge =
      payload.is_handyman_concierge;
    serviceTypeRequestModel.standard_hourly = payload.standard_hourly;
    serviceTypeRequestModel.is_recurring = payload.is_linen ? true : false;
    serviceTypeRequestModel.status = ServiceTypeRequestStatus.PendingApproval;

    const franchiseAdmin = await this.userRepository.findOne({
      where: {
        user_type: UserType.FranchiseAdmin,
        franchise_id: Number(user.franchise_id),
      },
    });
    const superAdmin = await this.userRepository.findOne({
      where: { user_type: UserType.SuperAdmin },
    });

    this.notificationsService.sendNotification(
      NotificationAction.SERVICE_TYPE_CATEGORY_REQUESTED,
      {
        link: `${this.configService.get('PORTAL_FRONTEND_URL')}/login`,
        title: payload.title,
        name: `${franchiseAdmin.first_name} ${franchiseAdmin.last_name}`,
        smsBody: `${user.first_name} ${user.last_name} requested a new service type category with title ${payload.title}`,
      },
      [superAdmin.email],
    );

    return await this.serviceTypeRequestRepository.save(
      serviceTypeRequestModel,
    );
  }

  async requestServiceType(
    payload: CreateServiceTypeDto,
    user: JwtPayload,
  ): Promise<ServiceTypeRequestModel> {
    const serviceType: ServiceTypeModel =
      await this.serviceTypeRepository.findOne({
        where: { title: payload.title, is_deleted: false },
      });

    if (serviceType)
      throw new BadRequestException(ServiceTypeMessages.SERVICE_TYPE_EXISTS);

    const serviceTypeCategory: ServiceTypeCategoryModel =
      await this.serviceTypeCategoryRepository.findOne({
        where: { id: payload.service_type_category_id },
      });

    const serviceTypeRequestModel = new ServiceTypeRequestModel();

    serviceTypeRequestModel.service_type_title = payload.title;
    serviceTypeRequestModel.service_type_category_id =
      payload.service_type_category_id;
    serviceTypeRequestModel.requested_by =
      user.user_type === UserType.StandardAdmin
        ? Number(user.franchise_admin)
        : Number(user.id);
    serviceTypeRequestModel.status = ServiceTypeRequestStatus.PendingApproval;
    serviceTypeRequestModel.is_linen = serviceTypeCategory.is_linen;
    serviceTypeRequestModel.is_handyman_concierge =
      serviceTypeCategory.is_handyman_concierge;
    serviceTypeRequestModel.standard_hourly =
      serviceTypeCategory.standard_hourly;
    serviceTypeRequestModel.is_recurring = serviceTypeCategory.is_linen
      ? true
      : payload.is_recurring;

    if (user.user_type === UserType.FranchiseAdmin) {
      const superAdmins = await this.userRepository.find({
        user_type: UserType.SuperAdmin,
      });

      const emails = superAdmins.map((admin) => admin.email);
      const contacts = superAdmins.map((admin) => admin.contact);

      if (emails.length)
        this.notificationsService.sendNotification(
          NotificationAction.SERVICE_TYPE_REQUEST_CREATED,
          {
            link: `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/login`,
            title: payload.title,
            is_linen: serviceTypeCategory.is_linen ? 'Yes' : 'No',
            status: 'Approval Pending',
            category: serviceTypeCategory.title,
            name: user.first_name
              ? `${user.first_name} ${user.last_name}`
              : `${user.email}`,
            smsBody: `${user.first_name} ${user.last_name} requested a new service type ${payload.title} with category ${serviceTypeCategory.title}`,
          },
          emails,
          contacts,
        );
    }

    return await this.serviceTypeRequestRepository.save(
      serviceTypeRequestModel,
    );
  }

  async requestServiceTypeApproval(
    payload: ServiceTypeStatusDto,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const serviceTypeRequestModel: ServiceTypeRequestModel =
        await this.serviceTypeRequestRepository.findOne({
          where: {
            id: payload.service_type_request_id,
            status: ServiceTypeRequestStatus.PendingApproval,
          },
        });

      if (!serviceTypeRequestModel)
        throw new BadRequestException(
          ServiceTypeMessages.SERVICE_TYPE_REQUEST_NOT_FOUND,
        );

      if (
        serviceTypeRequestModel?.service_type_category_title &&
        payload.status === ServiceTypeRequestStatus.Approved
      ) {
        const serviceTypeCategory = queryRunner.manager.create(
          ServiceTypeCategoryModel,
          {
            title: serviceTypeRequestModel?.service_type_category_title,
            is_linen: serviceTypeRequestModel?.is_linen,
            is_handyman_concierge:
              serviceTypeRequestModel?.is_handyman_concierge,
            standard_hourly: serviceTypeRequestModel?.standard_hourly,
          },
        );
        const serviceTypeCategoryModel = await queryRunner.manager.save(
          ServiceTypeCategoryModel,
          serviceTypeCategory,
        );
        await this.addServiceTypeCategoryToAllFranchises(
          serviceTypeCategoryModel,
          queryRunner,
          false,
        );
      } else if (payload.status === ServiceTypeRequestStatus.Approved) {
        const serviceType = queryRunner.manager.create(ServiceTypeModel, {
          title: serviceTypeRequestModel?.service_type_title,
          service_type_category_id:
            serviceTypeRequestModel?.service_type_category_id,
          is_linen: serviceTypeRequestModel?.is_linen,
          is_handyman_concierge: serviceTypeRequestModel?.is_handyman_concierge,
          standard_hourly: serviceTypeRequestModel?.standard_hourly,
          is_recurring: serviceTypeRequestModel?.is_recurring,
        });
        const serviceTypeModel = await queryRunner.manager.save(
          ServiceTypeModel,
          serviceType,
        );
        await this.addServiceTypeToAllFranchises(
          serviceTypeModel,
          queryRunner,
          false,
        );
      }

      serviceTypeRequestModel.status = payload.status;

      await queryRunner.manager.update(
        ServiceTypeRequestModel,
        {
          id: payload.service_type_request_id,
        },
        { status: payload.status },
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

  async getRequestServiceType(
    query: PaginationParam,
  ): Promise<IPaginatedModelResponse<ServiceTypeRequestModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const serviceTypeRequests =
      await this.serviceTypeRequestRepository.getServiceTypeRequest(
        paginationParams,
      );

    return serviceTypeRequests;
  }

  async transformPreferredVendorResponse(response: any[]) {
    const serviceTypeMap: any = {};
    response.forEach((item) => {
      const serviceTypeId = item.serviceType.id;
      const serviceTypeTitle = item.serviceType.title;
      if (!serviceTypeMap[serviceTypeId]) {
        serviceTypeMap[serviceTypeId] = {
          id: serviceTypeId,
          name: serviceTypeTitle,
          vendors: [],
        };
      }

      const vendor = {
        id: item.vendor.id,
        first_name: item.vendor.first_name,
        last_name: item.vendor.last_name,
        email: item.vendor.email,
      };

      serviceTypeMap[serviceTypeId].vendors.push(vendor);
    });

    return Object.values(serviceTypeMap);
  }

  async getVendorsFranchiseServiceType(user: JwtPayload): Promise<any[]> {
    const response =
      await this.vendorServiceTypeRepository.getVendorServiceTypes(
        Number(user.franchise_id),
      );
    return this.transformPreferredVendorResponse(response);
  }

  async createGuestConciergeCategory(
    payload: CreateGuestConciergeCategoryDto,
    user: JwtPayload,
    categoryId?: number,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      let serviceTypeCategoryModel = new ServiceTypeCategoryModel();
      let franchiseServiceTypeCategoryModel =
        new FranchiseServiceTypeCategoryModel();

      if (categoryId) {
        serviceTypeCategoryModel =
          await this.serviceTypeCategoryRepository.findOne({
            where: { id: categoryId, is_guest_concierge: true },
          });

        if (!serviceTypeCategoryModel) {
          throw new BadRequestException(
            ServiceTypeMessages.SERVICE_TYPE_CATEGORY_NOT_EXISTS,
          );
        }

        franchiseServiceTypeCategoryModel =
          await this.franchiseServiceTypeCategoryRepository.findOne({
            where: {
              service_type_category_id: categoryId,
              is_guest_concierge: true,
            },
          });
      }

      serviceTypeCategoryModel.title = payload.title;
      serviceTypeCategoryModel.description = payload.description;
      serviceTypeCategoryModel.is_guest_concierge = true;

      const savedServiceTypeCategory = await queryRunner.manager.save(
        ServiceTypeCategoryModel,
        serviceTypeCategoryModel,
      );

      franchiseServiceTypeCategoryModel.franchise_id = Number(
        user.franchise_id,
      );
      franchiseServiceTypeCategoryModel.service_type_category_id =
        savedServiceTypeCategory.id;
      franchiseServiceTypeCategoryModel.image_url =
        payload?.image_url ?? franchiseServiceTypeCategoryModel?.image_url;
      franchiseServiceTypeCategoryModel.is_guest_concierge = true;
      franchiseServiceTypeCategoryModel.is_active = categoryId
        ? franchiseServiceTypeCategoryModel.is_active
        : false;

      const slug = payload.title.replace(/\s+/g, '-').toLowerCase();
      franchiseServiceTypeCategoryModel.slug = slug;

      await queryRunner.manager.save(
        FranchiseServiceTypeCategoryModel,
        franchiseServiceTypeCategoryModel,
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

  async createGuestConciergeService(
    payload: CreateGuestConciergeServiceDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const franchiseServiceTypeCategory =
        await this.franchiseServiceTypeCategoryRepository.findOne({
          where: {
            service_type_category_id: payload.service_type_category_id,
            franchise_id: Number(user.franchise_id),
            is_guest_concierge: true,
          },
        });

      if (!franchiseServiceTypeCategory) {
        throw new BadRequestException(
          ServiceTypeMessages.FRANCHISE_SERVICE_TYPE_NOT_FOUND,
        );
      }

      const associatedServiceType =
        await this.franchiseServiceTypeRepository.findOneWithAssociatedServiceType(
          [payload.associated_service_type_id],
          Number(user.franchise_id),
        );

      const serviceTypeModel = new ServiceTypeModel();

      serviceTypeModel.title = payload.title;
      serviceTypeModel.service_type_category_id =
        payload.service_type_category_id;
      serviceTypeModel.is_guest_concierge = true;

      const savedServiceType = await queryRunner.manager.save(
        ServiceTypeModel,
        serviceTypeModel,
      );

      const franchiseServiceTypeModel = new FranchiseServiceTypeModel();

      franchiseServiceTypeModel.franchise_id = Number(user.franchise_id);
      franchiseServiceTypeModel.service_type_id = savedServiceType.id;
      franchiseServiceTypeModel.franchise_service_type_category_id =
        franchiseServiceTypeCategory.id;
      franchiseServiceTypeModel.description = payload.description;
      franchiseServiceTypeModel.guest_price = payload.guest_price;
      franchiseServiceTypeModel.pricing_type = PricingType.Manual;
      franchiseServiceTypeModel.vendor_rate = payload.vendor_rate;
      franchiseServiceTypeModel.associated_service_type_id =
        payload.associated_service_type_id;
      franchiseServiceTypeModel.is_guest_concierge = true;
      franchiseServiceTypeModel.is_active = true;

      const slug = payload.title.replace(/\s+/g, '-').toLowerCase();
      franchiseServiceTypeModel.slug = slug;

      if (associatedServiceType && associatedServiceType.length > 0) {
        const associatedFranchiseServiceType = associatedServiceType[0];
        const {
          door_code_access,
          owners_phone_access,
          turn_over,
          allow_recurring_request,
          notify_status_change,
          use_cleaning_logic,
          use_preventive_logic,
          available_to_guest,
          apply_service_fee,
        } = associatedFranchiseServiceType;

        franchiseServiceTypeModel.door_code_access = door_code_access;
        franchiseServiceTypeModel.owners_phone_access = owners_phone_access;
        franchiseServiceTypeModel.turn_over = turn_over;
        franchiseServiceTypeModel.allow_recurring_request =
          allow_recurring_request;
        franchiseServiceTypeModel.notify_status_change = notify_status_change;
        franchiseServiceTypeModel.use_cleaning_logic = use_cleaning_logic;
        franchiseServiceTypeModel.use_preventive_logic = use_preventive_logic;
        franchiseServiceTypeModel.available_to_guest = available_to_guest;
        franchiseServiceTypeModel.apply_service_fee = apply_service_fee;
      }

      const savedFranchiseServiceType = await queryRunner.manager.save(
        FranchiseServiceTypeModel,
        franchiseServiceTypeModel,
      );

      await this.associateVendorsToServiceType(
        queryRunner,
        payload.associated_service_type_id,
        savedServiceType.id,
        user,
      );

      if (payload.images && payload.images.length > 0) {
        const serviceTypeImages: ServiceTypeImageModel[] = payload.images.map(
          (imageUrl) => {
            const serviceTypeImage = new ServiceTypeImageModel();
            serviceTypeImage.franchise_service_type_id =
              savedFranchiseServiceType.id;
            serviceTypeImage.franchise_id = Number(user.franchise_id);
            serviceTypeImage.image_url = imageUrl;

            return serviceTypeImage;
          },
        );

        await queryRunner.manager.save(
          ServiceTypeImageModel,
          serviceTypeImages,
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

  async updateGuestConciergeService(
    payload: UpdateGuestConciergeServiceDto,
    user: JwtPayload,
    serviceTypeId: number,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const existingServiceType = await this.serviceTypeRepository.findOne({
        where: { id: serviceTypeId, is_guest_concierge: true },
      });

      if (!existingServiceType)
        throw new BadRequestException(
          ServiceTypeMessages.SERVICE_TYPE_NOT_FOUND,
        );

      const existingFranchiseServiceType =
        await this.franchiseServiceTypeRepository.findOne({
          where: {
            service_type_id: serviceTypeId,
            franchise_id: Number(user.franchise_id),
            is_guest_concierge: true,
          },
        });

      if (!existingFranchiseServiceType)
        throw new BadRequestException(
          ServiceTypeMessages.FRANCHISE_SERVICE_TYPE_NOT_FOUND,
        );

      // Retrieve associated service type if provided
      const associatedServiceType =
        await this.franchiseServiceTypeRepository.findOneWithAssociatedServiceType(
          [payload?.associated_service_type_id],
          Number(user.franchise_id),
        );

      existingServiceType.title = payload.title;
      await queryRunner.manager.save(ServiceTypeModel, existingServiceType);

      if (
        Number(payload.associated_service_type_id) !==
        Number(existingFranchiseServiceType.associated_service_type_id)
      ) {
        await queryRunner.manager.delete(VendorServiceTypeModel, {
          service_type_id: existingServiceType.id,
          franchise_id: Number(user.franchise_id),
        });
        await this.associateVendorsToServiceType(
          queryRunner,
          payload.associated_service_type_id,
          existingServiceType.id,
          user,
        );
      }

      existingFranchiseServiceType.description = payload.description;
      existingFranchiseServiceType.guest_price = payload.guest_price;
      existingFranchiseServiceType.vendor_rate = payload.vendor_rate;
      existingFranchiseServiceType.associated_service_type_id =
        payload?.associated_service_type_id;
      const slug = payload.title.replace(/\s+/g, '-').toLowerCase();
      existingFranchiseServiceType.slug = slug;

      if (associatedServiceType && associatedServiceType.length > 0) {
        const associatedFranchiseServiceType = associatedServiceType[0];
        const {
          door_code_access,
          owners_phone_access,
          turn_over,
          allow_recurring_request,
          notify_status_change,
          use_cleaning_logic,
          use_preventive_logic,
          available_to_guest,
          apply_service_fee,
        } = associatedFranchiseServiceType;

        existingFranchiseServiceType.door_code_access = door_code_access;
        existingFranchiseServiceType.owners_phone_access = owners_phone_access;
        existingFranchiseServiceType.turn_over = turn_over;
        existingFranchiseServiceType.allow_recurring_request =
          allow_recurring_request;
        existingFranchiseServiceType.notify_status_change =
          notify_status_change;
        existingFranchiseServiceType.use_cleaning_logic = use_cleaning_logic;
        existingFranchiseServiceType.use_preventive_logic =
          use_preventive_logic;
        existingFranchiseServiceType.available_to_guest = available_to_guest;
        existingFranchiseServiceType.apply_service_fee = apply_service_fee;
      }

      const updatedFranchiseServiceType = await queryRunner.manager.save(
        FranchiseServiceTypeModel,
        existingFranchiseServiceType,
      );

      if (payload.images && payload.images.length > 0) {
        await queryRunner.manager.delete(ServiceTypeImageModel, {
          franchise_service_type_id: updatedFranchiseServiceType.id,
        });
        const serviceTypeImages: ServiceTypeImageModel[] = payload.images.map(
          (imageUrl) => {
            const serviceTypeImage = new ServiceTypeImageModel();
            serviceTypeImage.franchise_service_type_id =
              updatedFranchiseServiceType.id;
            serviceTypeImage.franchise_id = Number(user.franchise_id);
            serviceTypeImage.image_url = imageUrl;

            return serviceTypeImage;
          },
        );
        await queryRunner.manager.save(
          ServiceTypeImageModel,
          serviceTypeImages,
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

  async getGuestConciergeServices(
    user: JwtPayload,
    query: GetServiceTypeDto,
  ): Promise<any[]> {
    const guestConciergeCategories =
      await this.serviceTypeCategoryRepository.getGuestConcierge(
        Number(user.franchise_id),
        query,
      );

    const processedData: any[] =
      guestConciergeCategories.length > 0
        ? await Promise.all(
            guestConciergeCategories.map(async (category: any) => {
              if (
                category.serviceTypeCat &&
                category.serviceTypeCat.length > 0
              ) {
                for (const serviceTypeCat of category.serviceTypeCat) {
                  if (serviceTypeCat.image_url) {
                    serviceTypeCat.image_url =
                      await this.s3Service.getDownloadUrl(
                        serviceTypeCat.image_url,
                      );
                  }
                }
              }
              return category;
            }),
          )
        : [];

    return processedData;
  }

  async getGuestConciergeCategories(
    query: GetGuestConciergeCategoryDto,
  ): Promise<IPaginatedModelResponse<ServiceTypeCategoryModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const { data, count } =
      await this.serviceTypeRepository.getGuestConciergeCategories(
        query.franchise_id,
        paginationParams,
      );

    const processedData = await Promise.all(
      data.map(async (category: any) => {
        if (category.image_url) {
          category.image_url = await this.s3Service.getDownloadUrl(
            category.image_url,
          );
        }
        return category;
      }),
    );

    return { data: processedData, count };
  }

  async guestConciergeServiceTypes(
    query: GetGuestConciergeServiceDto,
  ): Promise<IPaginatedModelResponse<ServiceTypeModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(query);

    const { data, count } =
      await this.serviceTypeRepository.getGuestConciergeServiceTypes(
        query,
        paginationParams,
      );

    const processedData = await Promise.all(
      data.map(async (serviceType: any) => {
        if (serviceType.image_url) {
          serviceType.image_url = await this.s3Service.getDownloadUrl(
            serviceType.image_url,
          );
        }
        return serviceType;
      }),
    );

    return { data: processedData, count };
  }

  async getGuestConciergeServiceById(serviceTypeSlug: string): Promise<any> {
    const data =
      await this.serviceTypeRepository.getGuestConciergeServiceById(
        serviceTypeSlug,
      );

    let processedImages: any[] = [];

    if (
      data?.franchiseServiceType?.length > 0 &&
      data?.franchiseServiceType[0]?.serviceTypeImages.length > 0
    ) {
      processedImages = await Promise.all(
        data?.franchiseServiceType[0]?.serviceTypeImages.map(
          async (image: any) => {
            const downloadUrl = await this.s3Service.getDownloadUrl(
              image.image_url,
            );
            return {
              id: image.id,
              media_url: image.image_url,
              media_type: 'image',
              url: downloadUrl,
            };
          },
        ),
      );
    }

    return {
      ...data,
      franchiseServiceType:
        data?.franchiseServiceType?.length > 0
          ? data.franchiseServiceType[0]
          : null,
      serviceTypeCategory:
        data?.serviceTypeCategory?.serviceTypeCat?.length > 0
          ? {
              ...data?.serviceTypeCategory,
              slug: data?.serviceTypeCategory?.serviceTypeCat[0].slug,
            }
          : data?.serviceTypeCategory,
      serviceTypeImages: processedImages,
    };
  }

  async getServiceTypeImages(
    query: GetServiceTypeImagesDto,
    user: JwtPayload,
  ): Promise<any[]> {
    const franchiseServiceType =
      await this.franchiseServiceTypeRepository.findOne({
        where: {
          id: query.franchise_service_type_id,
          franchise_id: Number(user.franchise_id),
          is_deleted: false,
        },
        relations: ['serviceTypeImages'],
      });

    if (!franchiseServiceType) {
      throw new BadRequestException(
        ServiceTypeMessages.FRANCHISE_SERVICE_TYPE_NOT_FOUND,
      );
    }

    if (
      franchiseServiceType.serviceTypeImages &&
      franchiseServiceType.serviceTypeImages.length > 0
    ) {
      const processedImages = await Promise.all(
        franchiseServiceType.serviceTypeImages.map(async (image) => {
          const downloadUrl = await this.s3Service.getDownloadUrl(
            image.image_url,
          );
          return {
            id: image.id,
            media_url: image.image_url,
            media_type: 'image',
            url: downloadUrl,
          };
        }),
      );
      return processedImages;
    }

    return [];
  }

  async handymanConciergeRates(
    payload: HandymanConciergeRatesDto,
    user: JwtPayload,
  ): Promise<ServiceTypeModel> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: {
        id: payload.service_type_id,
        is_deleted: false,
      },
    });

    if (!serviceType)
      throw new BadRequestException(ServiceTypeMessages.SERVICE_TYPE_NOT_FOUND);

    if (!serviceType.is_handyman_concierge)
      throw new BadRequestException(
        ServiceTypeMessages.SERVICE_TYPE_IS_NOT_HANDYMAN_CONCIERGE,
      );

    const franchiseServiceType =
      await this.franchiseServiceTypeRepository.findOne({
        where: {
          service_type_id: payload.service_type_id,
          franchise_id: Number(user.franchise_id),
          is_deleted: false,
        },
      });

    if (!franchiseServiceType)
      throw new BadRequestException(
        ServiceTypeMessages.FRANCHISE_SERVICE_TYPE_NOT_FOUND,
      );

    franchiseServiceType.service_call_fee = payload.service_call_fee;
    franchiseServiceType.hourly_rate = payload.hourly_rate;

    await this.franchiseServiceTypeRepository.save(franchiseServiceType);

    return serviceType;
  }

  async associateVendorsToServiceType(
    queryRunner: QueryRunner,
    serviceTypeId: number,
    newServiceTypeId: number,
    user: JwtPayload,
  ): Promise<boolean> {
    const vendorServiceTypes = await this.vendorServiceTypeRepository.find({
      franchise_id: Number(user.franchise_id),
      service_type_id: serviceTypeId,
      is_deleted: false,
    });

    if (!vendorServiceTypes || vendorServiceTypes.length === 0) return true;

    const newVendorServiceTypes: VendorServiceTypeModel[] =
      vendorServiceTypes.map((vendorServiceType) => {
        const newVendorServiceType = new VendorServiceTypeModel();
        newVendorServiceType.vendor_id = vendorServiceType.vendor_id;
        newVendorServiceType.franchise_id = vendorServiceType.franchise_id;
        newVendorServiceType.is_approved = vendorServiceType.is_approved;
        newVendorServiceType.service_type_id = newServiceTypeId;
        return newVendorServiceType;
      });

    await queryRunner.manager.save(
      VendorServiceTypeModel,
      newVendorServiceTypes,
    );

    return true;
  }
}
