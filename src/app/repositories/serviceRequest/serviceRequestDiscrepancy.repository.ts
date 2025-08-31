import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceRequestDiscrepancyModel } from '@/app/models/serviceRequest/serviceRequestDiscrepancy.model';

@Injectable()
export class ServiceRequestDiscrepancyRepository extends PostgresRepository<ServiceRequestDiscrepancyModel> {
  constructor(dataSource: DataSource) {
    super(ServiceRequestDiscrepancyModel, dataSource);
  }
}
