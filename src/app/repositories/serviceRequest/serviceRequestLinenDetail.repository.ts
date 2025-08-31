import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceRequestLinenDetailModel } from '@/app/models/serviceRequest/serviceRequestLinenDetail.model';

@Injectable()
export class ServiceRequestLinenDetailRepository extends PostgresRepository<ServiceRequestLinenDetailModel> {
  constructor(dataSource: DataSource) {
    super(ServiceRequestLinenDetailModel, dataSource);
  }
}
