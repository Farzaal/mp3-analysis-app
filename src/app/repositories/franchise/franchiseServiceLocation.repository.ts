import { Injectable } from '@nestjs/common';
import { FranchiseServiceLocationModel } from '../../models/franchise/franchiseServiceLocation.model';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class FranchiseServiceLocationRepository extends PostgresRepository<FranchiseServiceLocationModel> {
  constructor(dataSource: DataSource) {
    super(FranchiseServiceLocationModel, dataSource);
  }
}
