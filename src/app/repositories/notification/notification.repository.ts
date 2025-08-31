import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { NotificationModel } from '@/app/models/notification/notification.model';

@Injectable()
export class NotificationRepository extends PostgresRepository<NotificationModel> {
  constructor(dataSource: DataSource) {
    super(NotificationModel, dataSource);
  }
}
