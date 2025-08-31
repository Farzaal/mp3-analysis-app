import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { VendorServiceTypePriorityModel } from '@/app/models/serviceType/vendorServiceTypePriorities.model';

@Injectable()
export class VendorServiceTypePriorityRepository extends PostgresRepository<VendorServiceTypePriorityModel> {
  constructor(dataSource: DataSource) {
    super(VendorServiceTypePriorityModel, dataSource);
  }

  async getPropertyPreferredVendorsCount(
    vendorServiceTypeId: number,
    propertyMasterId: number,
    franchiseId: number,
  ): Promise<number> {
    const propertyPreferredVendorsCount: number = await this.repository
      .createQueryBuilder('vendor_service_type_priorities')
      .where(
        'vendor_service_type_priorities.service_type_id = :vendorServiceTypeId',
        {
          vendorServiceTypeId,
        },
      )
      .andWhere(
        'vendor_service_type_priorities.property_master_id = :propertyMasterId',
        {
          propertyMasterId,
        },
      )
      .andWhere('vendor_service_type_priorities.franchise_id = :franchiseId', {
        franchiseId,
      })
      .getCount();

    return propertyPreferredVendorsCount;
  }

  async getPropertyPreferredVendors(
    propertyMasterId: number,
    franchiseId: number,
  ): Promise<VendorServiceTypePriorityModel[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('vendor_service_type_priorities')
      .where(
        'vendor_service_type_priorities.property_master_id = :propertyMasterId',
        {
          propertyMasterId,
        },
      )
      .andWhere('vendor_service_type_priorities.franchise_id = :franchiseId', {
        franchiseId,
      })
      .leftJoinAndSelect('vendor_service_type_priorities.vendor', 'vendor')
      .leftJoinAndSelect(
        'vendor_service_type_priorities.vendorServiceType',
        'serviceType',
      );

    return await queryBuilder.getMany();
  }

  async getPropertyPreferredServiceTypeVendors(
    propertyMasterId: number,
    franchiseId: number,
    serviceTypeId: number,
  ): Promise<VendorServiceTypePriorityModel[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('vendor_service_type_priorities')
      .where(
        'vendor_service_type_priorities.property_master_id = :propertyMasterId',
        {
          propertyMasterId,
        },
      )
      .andWhere('vendor_service_type_priorities.franchise_id = :franchiseId', {
        franchiseId,
      })
      .andWhere(
        'vendor_service_type_priorities.service_type_id = :serviceTypeId',
        {
          serviceTypeId,
        },
      )
      .leftJoinAndSelect('vendor_service_type_priorities.vendor', 'vendor')
      .leftJoinAndSelect(
        'vendor_service_type_priorities.vendorServiceType',
        'serviceType',
      )
      .andWhere('vendor.is_approved = :isApproved', {
        isApproved: true,
      });

    return await queryBuilder.getMany();
  }
}
