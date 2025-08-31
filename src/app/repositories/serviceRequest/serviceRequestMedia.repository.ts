import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceRequestMediaModel } from '@/app/models/serviceRequest/serviceRequestMedia.model';

@Injectable()
export class ServiceRequestMediaRepository extends PostgresRepository<ServiceRequestMediaModel> {
  constructor(dataSource: DataSource) {
    super(ServiceRequestMediaModel, dataSource);
  }
}
