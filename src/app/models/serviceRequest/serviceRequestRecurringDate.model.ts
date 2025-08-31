import { Entity, Column, JoinColumn, OneToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceRequestMasterModel } from './serviceRequestMaster.model';
import { ServiceRequestRepeatType } from '@/app/contracts/enums/serviceRequest.enum';

@Entity('service_request_recurring_dates')
export class ServiceRequestRecurringDateModel extends PostgresBaseModel {
  @Column({
    name: 'service_request_master_id',
    type: 'bigint',
    nullable: false,
  })
  service_request_master_id: number;

  @Column({
    name: 'repeat_type',
    type: 'enum',
    enum: ServiceRequestRepeatType,
    nullable: false,
  })
  repeat_type: ServiceRequestRepeatType;

  @Column({
    name: 'repeat',
    type: 'smallint',
    nullable: false,
  })
  repeat: number;

  @Column({
    name: 'end_date',
    type: 'date',
    nullable: false,
  })
  end_date: Date;

  @Column({
    name: 'days',
    type: 'jsonb',
    nullable: false,
  })
  days: object;

  @Column({
    name: 'service_request_created_at',
    type: 'boolean',
    default: false,
  })
  service_request_created_at: boolean;

  @OneToOne(
    () => ServiceRequestMasterModel,
    (userModel) => userModel.serviceRequestDates,
  )
  @JoinColumn({ name: 'service_request_master_id', referencedColumnName: 'id' })
  serviceRequestRecurringDate: ServiceRequestMasterModel;
}
