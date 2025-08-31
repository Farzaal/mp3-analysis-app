import { BadRequestException, Injectable } from '@nestjs/common';
import { PropertyMasterRepository } from '../app/repositories/property/propertyMaster.respository';
import { PropertyMasterModel } from '../app/models/property/propertyMaster.model';
import {
  CreatePropertyDto,
  OffProgramDto,
  PropertySearchDto,
  CreatePreferredVendorDto,
  GetPreferredVendorCountDto,
} from './property.dto';
import { JwtPayload } from '../app/contracts/types/jwtPayload.type';
import { PropertyMaintenanceDetailRepository } from '../app/repositories/property/propertyMaintainenceDetail.repository';
import { PropertyStatus } from '../app/contracts/enums/property.enum';
import { OwnerService } from '@/owner/owner.service';
import { OwnerProfileStatus } from '@/app/contracts/enums/ownerProfile.enum';
import { PropertyMessage } from './property.message';
import { MemberShipTierModel } from '@/app/models/membership/membershipTier.model';
import { FranchiseServiceLocationRepository } from '@/app/repositories/franchise/franchiseServiceLocation.repository';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from '@/app/utils/general.helper';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { VendorServiceTypePriorityModel } from '@/app/models/serviceType/vendorServiceTypePriorities.model';
import { VendorServiceTypeRepository } from './../app/repositories/vendor/vendorServiceType.repository';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { DataSource, QueryRunner } from 'typeorm';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { PropertyCleaningDetailModel } from '@/app/models/property/propertyCleaningDetail.model';
import { PropertyMaintenanceDetailModel } from '@/app/models/property/propertyMaintainenceDetail.model';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';
import { VendorServiceTypePriorityRepository } from '@/app/repositories/vendor/vendorServiceTypePriority.repository';
import { DownloadReportEventName } from '@/app/contracts/enums/reportDownload.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GenericReportDownloadEvent } from '@/reportDownload/reportDownload.event';
import { BunyanLogger } from '@/app/commons/logger.service';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { Setting } from '@/app/contracts/enums/setting.enum';

@Injectable()
export class PropertyService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly propertyMasterRepository: PropertyMasterRepository,
    private readonly propertyMaintainenceDetailRepository: PropertyMaintenanceDetailRepository,
    private readonly franchiseServiceLocationRepository: FranchiseServiceLocationRepository,
    private readonly vendorServiceTypeRepository: VendorServiceTypeRepository,
    private readonly franchiseServiceTypeRepository: FranchiseServiceTypeRepository,
    private readonly vendorServiceTypePriorityRepository: VendorServiceTypePriorityRepository,
    private readonly generalHelper: GeneralHelper,
    private readonly ownerService: OwnerService,
    private readonly userRepository: UserRepository,
    private readonly franchiseRepository: FranchiseRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: BunyanLogger,
  ) {}

  async createOwnerProperty(
    property: CreatePropertyDto,
    user: JwtPayload,
  ): Promise<PropertyMasterModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const franchiseServiceLocation =
        await this.franchiseServiceLocationRepository.findOne({
          where: {
            franchise_id: Number(user.franchise_id),
            id: Number(property.property_info.city),
          },
        });

      if (!franchiseServiceLocation)
        throw new BadRequestException(PropertyMessage.INVALID_SERVICE_LOCATION);

      const propertyMasterModel = queryRunner.manager.create(
        PropertyMasterModel,
        {
          ...property.property_info,
          owner_id: user.id,
          status: PropertyStatus.Active,
          franchise_id: Number(user.franchise_id),
          city: property.property_info.city,
        },
      );

      const propertyMaster = await queryRunner.manager.save(
        PropertyMasterModel,
        propertyMasterModel,
      );

      const propertyCleaningDetailModel = queryRunner.manager.create(
        PropertyCleaningDetailModel,
        {
          ...property.property_cleaning_info,
          property_master_id: propertyMaster.id,
        },
      );

      await queryRunner.manager.save(
        PropertyCleaningDetailModel,
        propertyCleaningDetailModel,
      );

      if (
        property.property_maintenance_info &&
        Object.keys(property.property_maintenance_info).length > 0
      ) {
        const propertyMaintainDetailModel = queryRunner.manager.create(
          PropertyMaintenanceDetailModel,
          {
            ...property.property_maintenance_info,
            property_master_id: propertyMaster.id,
          },
        );

        await queryRunner.manager.save(
          PropertyMaintenanceDetailModel,
          propertyMaintainDetailModel,
        );
      }

      const membershipTierModel = new MemberShipTierModel();

      membershipTierModel.price = 0;
      membershipTierModel.discount_percentage = 0;
      membershipTierModel.property_master_id = propertyMaster.id;
      membershipTierModel.membership_type = MemberShipStatus.Free;
      membershipTierModel.franchise_id = propertyMaster.franchise_id;

      await queryRunner.manager.save(MemberShipTierModel, membershipTierModel);

      await this.ownerService.updateOwnerProfileCompletionStep(
        user,
        OwnerProfileStatus.PaymentMethodAdded,
      );

      await queryRunner.commitTransaction();
      return await this.getPropertyById(propertyMaster.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePropertyById(
    payload: CreatePropertyDto,
    propertyId: number,
    user: JwtPayload,
  ): Promise<PropertyMasterModel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const propertyMasterModel = await this.propertyMasterRepository.findOne({
        where: { id: propertyId },
      });

      if (!propertyMasterModel)
        throw new BadRequestException(PropertyMessage.PROPERTY_NOT_EXISTS);

      if (payload.property_info.city) {
        const franchiseServiceLocation =
          await this.franchiseServiceLocationRepository.findOne({
            where: {
              franchise_id: Number(user.franchise_id),
              id: payload.property_info.city,
            },
          });

        if (!franchiseServiceLocation)
          throw new BadRequestException(
            PropertyMessage.INVALID_SERVICE_LOCATION,
          );
      }

      await queryRunner.manager.update(
        PropertyMasterModel,
        { id: propertyId },
        payload.property_info,
      );

      await queryRunner.manager.update(
        PropertyCleaningDetailModel,
        { property_master_id: propertyId },
        payload.property_cleaning_info,
      );

      if (
        payload.property_maintenance_info &&
        Object.keys(payload.property_maintenance_info).length > 0
      ) {
        let propertyMaintenanceDetailModel: PropertyMaintenanceDetailModel =
          await this.propertyMaintainenceDetailRepository.findOne({
            where: { property_master_id: propertyId },
          });
        if (!propertyMaintenanceDetailModel) {
          propertyMaintenanceDetailModel = new PropertyMaintenanceDetailModel();
          propertyMaintenanceDetailModel = queryRunner.manager.create(
            PropertyMaintenanceDetailModel,
            {
              property_master_id: propertyId,
              ...propertyMaintenanceDetailModel,
            },
          );
          await queryRunner.manager.save(
            PropertyMaintenanceDetailModel,
            propertyMaintenanceDetailModel,
          );
        } else {
          await queryRunner.manager.update(
            PropertyMaintenanceDetailModel,
            { property_master_id: propertyId },
            payload.property_maintenance_info,
          );
        }
      }

      await queryRunner.commitTransaction();
      return await this.getPropertyById(propertyId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getOwnerProperty(
    user: JwtPayload,
    query: PropertySearchDto | null,
    returnAll: boolean = false,
  ): Promise<IPaginatedModelResponse<PropertyMasterModel>> {
    const userId: number =
      user.user_type === UserType.Owner
        ? Number(user.id)
        : [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
              user.user_type,
            ) && query?.owner_id
          ? Number(query?.owner_id)
          : null;

    if (query?.download) {
      this.logger.log(
        '[EVENT] Emitting Property Listing report preparation event',
      );

      const { data, count } = await this.propertyMasterRepository.getProperties(
        userId,
        Number(user.franchise_id),
        query,
        null,
      );

      if (count >= Setting.MAX_DIRECT_DOWNLOAD_ROWS) {
        // Send via email
        this.eventEmitter.emit(
          DownloadReportEventName.PROPERTY_LISTING,
          new GenericReportDownloadEvent(
            () =>
              this.propertyMasterRepository.getProperties(
                userId,
                Number(user.franchise_id),
                query,
                null,
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
      const paginationParams: IPaginationDBParams | null = returnAll
        ? null
        : this.generalHelper.getPaginationOptionsV2(query);

      return await this.propertyMasterRepository.getProperties(
        userId,
        Number(user.franchise_id),
        query,
        paginationParams,
      );
    }
  }

  async getPropertyById(
    id: number,
    params: object | null = null,
  ): Promise<PropertyMasterModel> {
    const where = params ? { ...params, id } : { id };
    return await this.propertyMasterRepository.findOne({
      where,
      relations: [
        'propertyCleaningDetail',
        'propertyMaintenanceDetail',
        'membershipTier',
        'owner',
      ],
    });
  }

  async validateProperty(
    propertyId: number,
    user: JwtPayload,
  ): Promise<PropertyMasterModel> {
    const property = await this.propertyMasterRepository.findOne({
      where: {
        id: propertyId,
        franchise_id: Number(user.franchise_id),
        is_deleted: false,
      },
    });

    if (!property)
      throw new BadRequestException(PropertyMessage.PROPERTY_NOT_EXISTS);

    return property;
  }

  async propertyOffProgram(
    propertyId: number,
    payload: OffProgramDto,
    user: JwtPayload,
  ): Promise<PropertyMasterModel> {
    const property = await this.validateProperty(propertyId, user);

    property.off_program = payload.off_program;

    return await this.propertyMasterRepository.save(property);
  }

  async deleteProperty(propertyId: number, user: JwtPayload): Promise<void> {
    const property = await this.validateProperty(propertyId, user);

    if (
      user.user_type === UserType.Owner &&
      Number(property?.owner_id) !== Number(user.id)
    )
      throw new BadRequestException(PropertyMessage.UNAUTHORIZED_ACCESS);

    property.is_deleted = true;
    await this.propertyMasterRepository.save(property);
    return;
  }

  async validateFranchiseServiceType(
    service_type_id: number,
    franchise_id: number,
  ): Promise<void> {
    const franchiseServiceType =
      await this.franchiseServiceTypeRepository.findOne({
        where: {
          franchise_id,
          service_type_id,
        },
      });

    if (
      !franchiseServiceType ||
      !franchiseServiceType.is_active ||
      franchiseServiceType.is_deleted
    )
      throw new BadRequestException(PropertyMessage.SERVICE_NOT_FOUND);
  }

  async validatePreferredVendorPayload(
    payload: CreatePreferredVendorDto,
    user: JwtPayload,
  ): Promise<void> {
    const { property_master_id, preferences } = payload;
    const { franchise_id } = user;

    if (!franchise_id)
      throw new BadRequestException(PropertyMessage.FRANCHISE_ID_NOT_FOUND);

    await this.validateProperty(property_master_id, user);

    for (const preference of preferences) {
      const { service_type_id, vendors } = preference;

      // await this.validateFranchiseServiceType(
      //   service_type_id,
      //   Number(franchise_id),
      // );

      for (const vendor of vendors) {
        const validService = await this.vendorServiceTypeRepository.findOne({
          where: {
            vendor_id: vendor,
            service_type_id,
            franchise_id: Number(franchise_id),
          },
        });

        if (!validService) {
          throw new BadRequestException(PropertyMessage.SERVICE_NOT_FOUND);
        }
      }
    }
  }

  async savePreferredVendor(
    payload: CreatePreferredVendorDto,
    user: JwtPayload,
    queryRunner: QueryRunner,
  ): Promise<VendorServiceTypePriorityModel[]> {
    const { property_master_id, preferences } = payload;
    const { id, franchise_id } = user;

    const preferredVendors = preferences.flatMap((preference) => {
      return preference.vendors.map((vendor) => {
        return queryRunner.manager.create(VendorServiceTypePriorityModel, {
          property_master_id: property_master_id,
          franchise_id: Number(franchise_id),
          vendor_id: Number(vendor),
          created_by: Number(id),
          service_type_id: preference.service_type_id,
        });
      });
    });
    return await queryRunner.manager.save(
      VendorServiceTypePriorityModel,
      preferredVendors,
    );
  }

  async deletePreferredVendor(
    payload: CreatePreferredVendorDto,
    user: JwtPayload,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const { property_master_id, preferences } = payload;
    const { franchise_id } = user;

    const deletePromises = preferences.flatMap((preference) => {
      const { service_type_id } = preference;
      return queryRunner.manager.delete(VendorServiceTypePriorityModel, {
        property_master_id: property_master_id,
        franchise_id: Number(franchise_id),
        service_type_id: Number(service_type_id),
        // created_by: Number(id),
      });
    });

    await Promise.all(deletePromises);
  }

  async createAndUpdatePreferredVendor(
    payload: CreatePreferredVendorDto,
    user: JwtPayload,
  ): Promise<VendorServiceTypePriorityModel[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      await this.validatePreferredVendorPayload(payload, user);
      await this.deletePreferredVendor(payload, user, queryRunner);

      const updatedPreferredVendors = await this.savePreferredVendor(
        payload,
        user,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return updatedPreferredVendors;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateProperty(
    propertyId: number,
    payload: Record<string, string | number | boolean>,
  ) {
    return await this.propertyMasterRepository.update(
      { id: propertyId },
      payload,
    );
  }

  async transformedPreferredVendorResponse(response: any[]) {
    const result: any = [];
    response.forEach((item) => {
      const serviceTypeId = Number(item.service_type_id);
      const vendorId = Number(item.vendor_id);
      if (!result[serviceTypeId]) {
        result[serviceTypeId] = { service_type_id: serviceTypeId, vendors: [] };
      }
      result[serviceTypeId].vendors.push(vendorId);
    });
    return Object.values(result);
  }

  async getPropertyPreferredVendor(
    propertyId: number,
    user: JwtPayload,
  ): Promise<any[]> {
    const response =
      await this.vendorServiceTypePriorityRepository.getPropertyPreferredVendors(
        propertyId,
        Number(user.franchise_id),
      );
    return this.transformedPreferredVendorResponse(response);
  }

  async getPreferredVendorCount(
    payload: GetPreferredVendorCountDto,
    user: JwtPayload,
  ): Promise<number> {
    const { property_master_id, service_type_id } = payload;
    const { franchise_id } = user;

    const response =
      await this.vendorServiceTypePriorityRepository.getPropertyPreferredVendorsCount(
        service_type_id,
        property_master_id,
        Number(franchise_id),
      );

    return response;
  }

  async getFranchisePropertyInfo(propertyId: number): Promise<{
    email: string;
    franchise_id: number;
    user_type: UserType;
    contact: string;
    about_us_link: string;
    how_it_works_link: string;
  }> {
    const property: PropertyMasterModel =
      await this.propertyMasterRepository.findOne({
        where: {
          id: propertyId,
        },
      });

    const [franchiseModel, userModel] = await Promise.all([
      this.franchiseRepository.findOne({
        where: {
          id: property.franchise_id,
        },
      }),
      this.userRepository.findOne({
        where: {
          franchise_id: property.franchise_id,
          user_type: UserType.FranchiseAdmin,
        },
      }),
    ]);

    return {
      email: userModel.email,
      franchise_id: property.franchise_id,
      user_type: UserType.FranchiseAdmin,
      contact: userModel.contact,
      about_us_link: franchiseModel.site_url,
      how_it_works_link: franchiseModel.site_url,
    };
  }
}
