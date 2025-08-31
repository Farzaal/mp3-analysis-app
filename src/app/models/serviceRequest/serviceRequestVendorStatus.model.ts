import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceRequestMasterModel } from './serviceRequestMaster.model';
import { UserModel } from '../user/user.model';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';

@Entity('service_request_vendor_statuses')
export class ServiceRequestVendorStatusModel extends PostgresBaseModel {
  @Column({
    name: 'service_request_master_id',
    type: 'bigint',
    nullable: false,
  })
  service_request_master_id: number;

  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: false,
  })
  vendor_id: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ServiceRequestStatus,
    nullable: false,
  })
  status: ServiceRequestStatus;

  @ManyToOne(
    () => ServiceRequestMasterModel,
    (userModel) => userModel.serviceRequestVendorStatus,
  )
  @JoinColumn({ name: 'service_request_master_id', referencedColumnName: 'id' })
  vendorServiceRequestStatus: ServiceRequestMasterModel;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.serviceRequestStatusCreator,
  )
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  serviceRequestStatusUser: UserModel;
}
