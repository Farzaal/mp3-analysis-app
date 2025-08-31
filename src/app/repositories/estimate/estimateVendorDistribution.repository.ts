import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { EstimateVendorDistributionModel } from '@/app/models/estimate/estimateVendorDistribution.model';

@Injectable()
export class EstimateVendorDistributionRepository extends PostgresRepository<EstimateVendorDistributionModel> {
  constructor(dataSource: DataSource) {
    super(EstimateVendorDistributionModel, dataSource);
  }
}
