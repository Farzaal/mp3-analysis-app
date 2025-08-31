import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { VendorServiceTypeModel } from '@/app/models/serviceType/vendorServiceType.model';

@Injectable()
export class VendorServiceTypeRepository extends PostgresRepository<VendorServiceTypeModel> {
  constructor(dataSource: DataSource) {
    super(VendorServiceTypeModel, dataSource);
  }

  async getVendorServiceTypes(
    franchiseId: number,
    serviceTypeId?: number,
  ): Promise<VendorServiceTypeModel[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('vendor_service_types')
      .where('vendor_service_types.franchise_id = :franchiseId', {
        franchiseId,
      })
      .andWhere('vendor_service_types.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .leftJoinAndSelect('vendor_service_types.serviceType', 'serviceType')
      .leftJoinAndSelect('vendor_service_types.vendor', 'vendor')
      .andWhere('vendor.is_approved = :isApproved', {
        isApproved: true,
      });

    if (serviceTypeId) {
      queryBuilder.andWhere(
        'vendor_service_types.service_type_id = :serviceTypeId',
        {
          serviceTypeId,
        },
      );
    }

    return await queryBuilder.getMany();
  }
}
