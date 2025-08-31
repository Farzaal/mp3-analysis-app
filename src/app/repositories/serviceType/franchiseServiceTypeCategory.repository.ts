import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { FranchiseServiceTypeCategoryModel } from '@/app/models/serviceType/franchiseServiceTypeCategory.model';

@Injectable()
export class FranchiseServiceTypeCategoryRepository extends PostgresRepository<FranchiseServiceTypeCategoryModel> {
  constructor(dataSource: DataSource) {
    super(FranchiseServiceTypeCategoryModel, dataSource);
  }
}
