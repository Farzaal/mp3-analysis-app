import { Injectable } from '@nestjs/common';
import { PropertyCleaningDetailModel } from '../../models/property/propertyCleaningDetail.model';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class PropertyCleaningDetailRepository extends PostgresRepository<PropertyCleaningDetailModel> {
  constructor(dataSource: DataSource) {
    super(PropertyCleaningDetailModel, dataSource);
  }
}
