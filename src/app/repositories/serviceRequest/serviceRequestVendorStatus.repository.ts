import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceRequestVendorStatusModel } from '@/app/models/serviceRequest/serviceRequestVendorStatus.model';

@Injectable()
export class ServiceRequestVendorStatusRepository extends PostgresRepository<ServiceRequestVendorStatusModel> {
  constructor(dataSource: DataSource) {
    super(ServiceRequestVendorStatusModel, dataSource);
  }
}
