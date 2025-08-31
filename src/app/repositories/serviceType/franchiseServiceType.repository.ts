import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { FranchiseServiceTypeModel } from '@/app/models/serviceType/franchiseServiceType.model';

@Injectable()
export class FranchiseServiceTypeRepository extends PostgresRepository<FranchiseServiceTypeModel> {
  constructor(dataSource: DataSource) {
    super(FranchiseServiceTypeModel, dataSource);
  }

  async findOneWithAssociatedServiceType(
    serviceTypeIds: number[],
    franchiseId: number,
  ): Promise<FranchiseServiceTypeModel[]> {
    return await this.repository
      .createQueryBuilder('fst')
      .leftJoinAndSelect('fst.associatedServiceType', 'associatedServiceType')
      .leftJoinAndSelect(
        'associatedServiceType.associatedFranchiseServiceTypes',
        'associatedFranchiseServiceTypes',
        'associatedFranchiseServiceTypes.franchise_id = fst.franchise_id AND associatedFranchiseServiceTypes.service_type_id = fst.service_type_id',
      )
      .where('fst.service_type_id IN (:...serviceTypeIds)', {
        serviceTypeIds,
      })
      .andWhere('fst.franchise_id = :franchiseId', {
        franchiseId,
      })
      .andWhere('fst.is_active = :isActive', {
        isActive: true,
      })
      .andWhere('fst.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .getMany();
  }
}
