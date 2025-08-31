import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { SettingModel } from '@/app/models/setting/setting.model';

@Injectable()
export class SettingRepository extends PostgresRepository<SettingModel> {
  constructor(dataSource: DataSource) {
    super(SettingModel, dataSource);
  }
}
