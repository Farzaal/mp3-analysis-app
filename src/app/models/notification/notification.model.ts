import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import {
  NotificationOption,
  NotificationStatus,
  NotificationType,
} from '@/app/contracts/enums/notification.enum';

@Entity('notifications')
export class NotificationModel extends PostgresBaseModel {
  @Column({
    name: 'notification_action',
    type: 'varchar',
    nullable: false,
  })
  notification_action: string;

  @Column({
    name: 'notification_option',
    type: 'enum',
    enum: NotificationOption,
    nullable: false,
  })
  notification_option: NotificationOption;

  @Column({
    name: 'notification_status',
    type: 'enum',
    nullable: false,
    enum: NotificationStatus,
  })
  notification_status: NotificationStatus;

  @Column({
    name: 'sent_to',
    type: 'varchar',
    nullable: true,
  })
  sent_to: string;

  @Column({
    name: 'number',
    type: 'bigint',
    nullable: true,
  })
  number: number;

  @Column({
    name: 'body',
    type: 'varchar',
    nullable: true,
  })
  body: string;

  @Column({
    name: 'params',
    type: 'jsonb',
    nullable: true,
  })
  params: Record<string, any>;

  @Column({
    name: 'notification_template',
    type: 'varchar',
    nullable: true,
  })
  notification_template: string;

  @Column({
    name: 'subject',
    type: 'varchar',
    nullable: true,
  })
  subject: string;

  @Column({
    name: 'type',
    type: 'enum',
    nullable: true,
    enum: NotificationType,
  })
  type: NotificationType;

  @ManyToOne(() => UserModel, (userModel) => userModel.notification)
  @JoinColumn({ name: 'sent_to', referencedColumnName: 'email' })
  user: UserModel;
}
