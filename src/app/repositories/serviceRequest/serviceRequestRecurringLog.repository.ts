import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceRequestRecurringLogModel } from '@/app/models/serviceRequest/serviceRequestRecurringLog.model';

@Injectable()
export class ServiceRequestRecurringLogRepository extends PostgresRepository<ServiceRequestRecurringLogModel> {
  constructor(dataSource: DataSource) {
    super(ServiceRequestRecurringLogModel, dataSource);
  }
}
