import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceRequestMasterModel } from './serviceRequestMaster.model';
import { ServiceRequestNoteModel } from './serviceRequestNote.model';
import { UserModel } from '../user/user.model';

@Entity('service_request_medias')
export class ServiceRequestMediaModel extends PostgresBaseModel {
  @Column({
    name: 'service_request_master_id',
    type: 'bigint',
    nullable: false,
  })
  service_request_master_id: number;

  @Column({
    name: 'service_request_note_id',
    type: 'bigint',
    nullable: true,
  })
  service_request_note_id: number;

  @Column({
    name: 'media_url',
    type: 'varchar',
    nullable: false,
  })
  media_url: string;

  @Column({
    name: 'media_type',
    type: 'varchar',
    nullable: true,
  })
  media_type: string;

  @Column({
    name: 'media_added_by',
    type: 'bigint',
    nullable: true,
  })
  media_added_by: number;

  image_url?: string;

  @ManyToOne(
    () => ServiceRequestMasterModel,
    (userModel) => userModel.serviceRequestMedia,
  )
  @JoinColumn({ name: 'service_request_master_id', referencedColumnName: 'id' })
  serviceRequestMaster: ServiceRequestMasterModel;

  @ManyToOne(
    () => ServiceRequestNoteModel,
    (userModel) => userModel.serviceRequestMedia,
  )
  @JoinColumn({ name: 'service_request_note_id', referencedColumnName: 'id' })
  serviceRequestNote: ServiceRequestNoteModel;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.serviceRequestMediaCreator,
  )
  @JoinColumn({ name: 'media_added_by', referencedColumnName: 'id' })
  serviceRequestMedia: UserModel;
}
