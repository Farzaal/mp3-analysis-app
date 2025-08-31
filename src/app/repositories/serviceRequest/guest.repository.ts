import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { GuestModel } from '@/app/models/serviceRequest/guest.model';

@Injectable()
export class GuestRepository extends PostgresRepository<GuestModel> {
  constructor(dataSource: DataSource) {
    super(GuestModel, dataSource);
  }
}
