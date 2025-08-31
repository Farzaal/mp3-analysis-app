import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { VendorServiceLocationModel } from './../../models/franchise/vendorServiceLocation.model';

@Injectable()
export class VendorServiceLocationRepository extends PostgresRepository<VendorServiceLocationModel> {
  constructor(dataSource: DataSource) {
    super(VendorServiceLocationModel, dataSource);
  }
}
