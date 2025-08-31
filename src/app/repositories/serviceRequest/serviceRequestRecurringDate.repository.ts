import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceRequestRecurringDateModel } from '@/app/models/serviceRequest/serviceRequestRecurringDate.model';

@Injectable()
export class ServiceRequestRecurringDateRepository extends PostgresRepository<ServiceRequestRecurringDateModel> {
  constructor(dataSource: DataSource) {
    super(ServiceRequestRecurringDateModel, dataSource);
  }
}
