import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { UserTokenModel } from '@/app/models/user/userToken.model';

@Injectable()
export class UserTokenRepository extends PostgresRepository<UserTokenModel> {
  constructor(dataSource: DataSource) {
    super(UserTokenModel, dataSource);
  }
}
