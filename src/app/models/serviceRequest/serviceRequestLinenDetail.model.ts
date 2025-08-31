import { Entity, Column, JoinColumn, OneToOne, ManyToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { LinenDeliveryType } from '@/app/contracts/enums/linenDeliveryType.enum';
import { ServiceRequestMasterModel } from './serviceRequestMaster.model';
import { ServiceTypeModel } from '../serviceType/serviceType.model';

@Entity('service_request_linen_details')
export class ServiceRequestLinenDetailModel extends PostgresBaseModel {
  @Column({
    name: 'service_request_master_id',
    type: 'bigint',
    nullable: false,
  })
  service_request_master_id: number;

  @Column({
    name: 'service_type_id',
    type: 'bigint',
    nullable: false,
  })
  service_type_id: number;

  @Column({
    name: 'delivery_type',
    type: 'enum',
    enum: LinenDeliveryType,
    nullable: false,
  })
  delivery_type: LinenDeliveryType;

  @Column({
    name: 'number_of_bedrooms',
    type: 'smallint',
    nullable: false,
  })
  number_of_bedrooms: number;

  @Column({
    name: 'bedroom_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  bedroom_price: number;

  @Column({
    name: 'number_of_full_bathrooms',
    type: 'smallint',
    nullable: true,
  })
  number_of_full_bathrooms: number;

  @Column({
    name: 'full_bathroom_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  full_bathroom_price: number;

  @Column({
    name: 'number_of_one_fifth_bathrooms',
    type: 'smallint',
    nullable: true,
  })
  number_of_one_fifth_bathrooms: number;

  @Column({
    name: 'one_fifth_bathroom_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  one_fifth_bathroom_price: number;

  @Column({
    name: 'number_of_guests',
    type: 'smallint',
    nullable: true,
  })
  number_of_guests: number;

  @Column({
    name: 'guest_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  guest_price: number;

  @Column({
    name: 'number_of_king_beds',
    type: 'smallint',
    nullable: true,
  })
  number_of_king_beds: number;

  @Column({
    name: 'king_bed_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  king_bed_price: number;

  @Column({
    name: 'number_of_queen_beds',
    type: 'smallint',
    nullable: true,
  })
  number_of_queen_beds: number;

  @Column({
    name: 'queen_bed_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  queen_bed_price: number;

  @Column({
    name: 'number_of_full_beds',
    type: 'smallint',
    nullable: true,
  })
  number_of_full_beds: number;

  @Column({
    name: 'full_bed_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  full_bed_price: number;

  @Column({
    name: 'number_of_twin_beds',
    type: 'smallint',
    nullable: true,
  })
  number_of_twin_beds: number;

  @Column({
    name: 'twin_bed_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  twin_bed_price: number;

  @Column({
    name: 'number_of_bath_towel_sets',
    type: 'smallint',
    nullable: true,
  })
  number_of_bath_towel_sets: number;

  @Column({
    name: 'bath_towel_set_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  bath_towel_set_price: number;

  @Column({
    name: 'number_of_kitchen_sets',
    type: 'smallint',
    nullable: true,
  })
  number_of_kitchen_sets: number;

  @Column({
    name: 'kitchen_set_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  kitchen_set_price: number;

  @Column({
    name: 'number_of_bath_mat_sets',
    type: 'smallint',
    nullable: true,
  })
  number_of_bath_mat_sets: number;

  @Column({
    name: 'bath_mat_set_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  bath_mat_set_price: number;

  @Column({
    name: 'number_of_beach_towels',
    type: 'smallint',
    nullable: true,
  })
  number_of_beach_towels: number;

  @Column({
    name: 'beach_towel_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  beach_towel_price: number;

  @Column({
    name: 'number_of_hand_towel_sets',
    type: 'smallint',
    nullable: true,
  })
  number_of_hand_towel_sets: number;

  @Column({
    name: 'hand_towel_set_price',
    type: 'float',
    nullable: true,
    default: 0,
  })
  hand_towel_set_price: number;

  @Column({
    name: 'total_charges',
    type: 'float',
    nullable: false,
  })
  total_charges: number;

  @OneToOne(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) =>
      serviceRequestMasterModel.serviceRequestMasterLinen,
  )
  @JoinColumn({ name: 'service_request_master_id', referencedColumnName: 'id' })
  linenServiceRequest: ServiceRequestMasterModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.serviceRequestTypeLinen,
  )
  @JoinColumn({ name: 'service_type_id', referencedColumnName: 'id' })
  serviceTypeRequestLinen: ServiceTypeModel;
}
