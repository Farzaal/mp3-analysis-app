import { Injectable } from '@nestjs/common';
import { PropertyMaintenanceDetailModel } from '../../models/property/propertyMaintainenceDetail.model';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class PropertyMaintenanceDetailRepository extends PostgresRepository<PropertyMaintenanceDetailModel> {
  constructor(dataSource: DataSource) {
    super(PropertyMaintenanceDetailModel, dataSource);
  }
}
