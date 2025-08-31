import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceTypeImageModel } from '@/app/models/serviceType/serviceTypeImage.model';

@Injectable()
export class ServiceTypeImageRepository extends PostgresRepository<ServiceTypeImageModel> {
  constructor(dataSource: DataSource) {
    super(ServiceTypeImageModel, dataSource);
  }
}
