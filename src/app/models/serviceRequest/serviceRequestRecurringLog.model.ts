import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceRequestMasterModel } from './serviceRequestMaster.model';

@Entity('service_request_recurring_logs')
export class ServiceRequestRecurringLogModel extends PostgresBaseModel {
  @Column({
    name: 'main_service_request_master_id',
    type: 'bigint',
    nullable: false,
  })
  main_service_request_master_id: number;

  @Column({
    name: 'new_service_request_master_id',
    type: 'bigint',
    nullable: false,
  })
  new_service_request_master_id: number;

  @ManyToOne(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) =>
      serviceRequestMasterModel.mainServiceRequestRecurringLog,
  )
  @JoinColumn({
    name: 'main_service_request_master_id',
    referencedColumnName: 'id',
  })
  mainServiceRequestRecurring: ServiceRequestMasterModel;

  @ManyToOne(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) =>
      serviceRequestMasterModel.newServiceRequestRecurringLog,
  )
  @JoinColumn({
    name: 'new_service_request_master_id',
    referencedColumnName: 'id',
  })
  newServiceRequestRecurring: ServiceRequestMasterModel;
}
