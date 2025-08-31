import { Entity, Column, OneToMany } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceRequestMasterModel } from './serviceRequestMaster.model';

@Entity('guests')
export class GuestModel extends PostgresBaseModel {
  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  full_name: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  email: string;

  @Column({
    name: 'contact',
    type: 'varchar',
    length: 32,
    nullable: false,
  })
  contact: string;

  @Column({
    name: 'address',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  address: string;

  @Column({
    name: 'city',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  city: string;

  @Column({
    name: 'state',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  state: string;

  @Column({
    name: 'zip',
    type: 'varchar',
    length: 16,
    nullable: false,
  })
  zip: string;

  @Column({
    name: 'guest_consent',
    type: 'boolean',
    default: false,
  })
  guest_consent: boolean;

  @Column({
    name: 'is_guest_concierge',
    type: 'boolean',
    default: false,
  })
  is_guest_concierge: boolean;

  @Column({
    name: 'payment_info',
    type: 'jsonb',
    nullable: true,
  })
  payment_info: object;

  @Column({
    name: 'order_info',
    type: 'jsonb',
    nullable: true,
  })
  order_info: object;

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequest) => serviceRequest.guest,
  )
  serviceRequests: ServiceRequestMasterModel[];
}
