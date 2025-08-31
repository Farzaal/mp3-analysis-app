import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { EstimateAssetModel } from '@/app/models/estimate/estimateAsset.model';

@Injectable()
export class EstimateAssetRepository extends PostgresRepository<EstimateAssetModel> {
  constructor(dataSource: DataSource) {
    super(EstimateAssetModel, dataSource);
  }
}
