import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { UserDescriptionModel } from '@/app/models/user/userDescription.model';

@Injectable()
export class UserDescriptionRepository extends PostgresRepository<UserDescriptionModel> {
  constructor(dataSource: DataSource) {
    super(UserDescriptionModel, dataSource);
  }
}
