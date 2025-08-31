import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceRequestMasterModel } from './serviceRequestMaster.model';
import { ServiceRequestMediaModel } from './serviceRequestMedia.model';
import { UserModel } from '../user/user.model';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';

@Entity('service_request_notes')
export class ServiceRequestNoteModel extends PostgresBaseModel {
  @Column({
    name: 'service_request_master_id',
    type: 'bigint',
    nullable: false,
  })
  service_request_master_id: number;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    name: 'note_added_by',
    type: 'bigint',
    nullable: false,
  })
  note_added_by: number;

  @Column({
    name: 'current_status',
    type: 'enum',
    enum: ServiceRequestStatus,
    nullable: false,
  })
  current_status: ServiceRequestStatus;

  @Column({
    name: 'updated_status',
    type: 'enum',
    enum: ServiceRequestStatus,
    nullable: false,
  })
  updated_status: ServiceRequestStatus;

  @ManyToOne(
    () => ServiceRequestMasterModel,
    (userModel) => userModel.serviceRequestNote,
  )
  @JoinColumn({ name: 'service_request_master_id', referencedColumnName: 'id' })
  serviceRequestMaster: ServiceRequestMasterModel;

  @OneToMany(
    () => ServiceRequestMediaModel,
    (serviceRequestMediaModel) => serviceRequestMediaModel.serviceRequestNote,
  )
  serviceRequestMedia: ServiceRequestMediaModel[];

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.serviceRequestNoteCreator,
  )
  @JoinColumn({ name: 'note_added_by', referencedColumnName: 'id' })
  serviceRequestNoteUser: UserModel;
}
