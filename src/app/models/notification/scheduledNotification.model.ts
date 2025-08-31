import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '@/app/models/postgresBase.model';
import { UserModel } from '@/app/models/user/user.model';
import {
  ScheduledNotificationTrigger,
  ScheduledNotificationMedium,
  ScheduledNotificationStatus,
} from '@/app/contracts/enums/scheduledNotification.enum';

@Entity('scheduled_notifications')
export class ScheduledNotificationModel extends PostgresBaseModel {
  @Column({
    name: 'notification_trigger',
    type: 'enum',
    enum: ScheduledNotificationTrigger,
    nullable: false,
  })
  notification_trigger: ScheduledNotificationTrigger;

  @Column({
    name: 'notification_medium',
    type: 'enum',
    enum: ScheduledNotificationMedium,
    nullable: false,
  })
  notification_medium: ScheduledNotificationMedium;

  @Column({
    name: 'notification_status',
    type: 'enum',
    nullable: false,
    enum: ScheduledNotificationStatus,
  })
  notification_status: ScheduledNotificationStatus;

  @Column({
    name: 'email_address',
    type: 'varchar',
    nullable: true,
  })
  email_address: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    nullable: true,
  })
  phone_number: string;

  @Column({
    name: 'params',
    type: 'jsonb',
    nullable: true,
  })
  params: Record<string, any>;

  @Column({
    name: 'subject',
    type: 'varchar',
    nullable: true,
  })
  subject: string;

  @ManyToOne(() => UserModel, (userModel) => userModel.scheduledNotification)
  @JoinColumn({ name: 'email_address', referencedColumnName: 'email' })
  user: UserModel;
}
