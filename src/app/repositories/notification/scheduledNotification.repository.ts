import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ScheduledNotificationModel } from '@/app/models/notification/scheduledNotification.model';

@Injectable()
export class ScheduledNotificationRepository extends PostgresRepository<ScheduledNotificationModel> {
  constructor(dataSource: DataSource) {
    super(ScheduledNotificationModel, dataSource);
  }
}
