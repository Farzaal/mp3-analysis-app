import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { PropertyServiceTypeRateModel } from '@/app/models/property/propertyServiceTypeRates.model';

@Injectable()
export class PropertyServiceTypeRateRepository extends PostgresRepository<PropertyServiceTypeRateModel> {
  constructor(dataSource: DataSource) {
    super(PropertyServiceTypeRateModel, dataSource);
  }
}
