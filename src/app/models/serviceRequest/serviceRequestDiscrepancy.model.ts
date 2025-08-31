import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceRequestMasterModel } from './serviceRequestMaster.model';
@Entity('service_request_discrepancies')
export class ServiceRequestDiscrepancyModel extends PostgresBaseModel {
  @Column({
    name: 'root_service_request_id',
    type: 'bigint',
    nullable: false,
  })
  root_service_request_id: number;

  @Column({
    name: 'service_request_discrepancy_id',
    type: 'bigint',
    nullable: false,
  })
  service_request_discrepancy_id: number;

  @ManyToOne(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) =>
      serviceRequestMasterModel.rootServiceRequestDiscrepancy,
  )
  @JoinColumn({ name: 'root_service_request_id', referencedColumnName: 'id' })
  rootServiceRequestMaster: ServiceRequestMasterModel;

  @OneToOne(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) =>
      serviceRequestMasterModel.serviceRequestDiscrepancy,
  )
  @JoinColumn({
    name: 'service_request_discrepancy_id',
    referencedColumnName: 'id',
  })
  serviceRequestMaster: ServiceRequestMasterModel;
}
