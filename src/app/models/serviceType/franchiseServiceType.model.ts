import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { PricingType } from '../../contracts/enums/pricingType.enum';
import { FranchiseModel } from '../franchise/franchise.model';
import { FranchiseServiceTypeCategoryModel } from './franchiseServiceTypeCategory.model';
import { ServiceTypeModel } from './serviceType.model';
import { ServiceTypeImageModel } from './serviceTypeImage.model';

@Entity('franchise_service_types')
export class FranchiseServiceTypeModel extends PostgresBaseModel {
  @Column({
    name: 'door_code_access',
    type: 'boolean',
    default: false,
  })
  door_code_access: boolean;

  @Column({
    name: 'owners_phone_access',
    type: 'boolean',
    default: false,
  })
  owners_phone_access: boolean;

  @Column({
    name: 'turn_over',
    type: 'boolean',
    default: false,
  })
  turn_over: boolean;

  @Column({
    name: 'allow_recurring_request',
    type: 'boolean',
    default: false,
  })
  allow_recurring_request: boolean;

  @Column({
    name: 'notify_status_change',
    type: 'boolean',
    default: false,
  })
  notify_status_change: boolean;

  @Column({
    name: 'use_cleaning_logic',
    type: 'boolean',
    default: false,
  })
  use_cleaning_logic: boolean;

  @Column({
    name: 'use_preventive_logic',
    type: 'boolean',
    default: false,
  })
  use_preventive_logic: boolean;

  @Column({
    name: 'available_to_guest',
    type: 'boolean',
    default: false,
  })
  available_to_guest: boolean;

  @Column({
    name: 'apply_service_fee',
    type: 'boolean',
    default: false,
  })
  apply_service_fee: boolean;

  @Column({
    name: 'pricing_type',
    type: 'enum',
    enum: PricingType,
    nullable: false,
  })
  pricing_type: PricingType;

  @Column({
    name: 'price',
    type: 'float',
    default: 0,
  })
  price: number;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  title: string;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'service_type_id',
    type: 'bigint',
    nullable: false,
  })
  service_type_id: number;

  @Column({
    name: 'franchise_service_type_category_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_service_type_category_id: number;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: false,
  })
  is_active: boolean;

  @Column({
    name: 'is_guest_concierge',
    type: 'boolean',
    default: false,
  })
  is_guest_concierge: boolean;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    name: 'guest_price',
    type: 'float',
    nullable: false,
    default: 0,
  })
  guest_price: number;

  @Column({
    name: 'vendor_rate',
    type: 'float',
    nullable: false,
    default: 0,
  })
  vendor_rate: number;

  @Column({
    name: 'hourly_rate',
    type: 'float',
    nullable: false,
    default: 0,
  })
  hourly_rate: number;

  @Column({
    name: 'service_call_fee',
    type: 'float',
    nullable: false,
    default: 0,
  })
  service_call_fee: number;

  @Column({
    name: 'associated_service_type_id',
    type: 'bigint',
    nullable: true,
  })
  associated_service_type_id: number;

  @Column({
    name: 'slug',
    type: 'varchar',
    nullable: true,
  })
  slug: string;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.serviceType,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseServiceTypes: FranchiseModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.associatedFranchiseServiceTypes,
  )
  @JoinColumn({
    name: 'associated_service_type_id',
    referencedColumnName: 'id',
  })
  associatedServiceType: ServiceTypeModel;

  @ManyToOne(
    () => FranchiseServiceTypeCategoryModel,
    (franchiseServiceTypeCategoryModel) =>
      franchiseServiceTypeCategoryModel.franchiseServiceType,
  )
  @JoinColumn({
    name: 'franchise_service_type_category_id',
    referencedColumnName: 'id',
  })
  franchiseServiceTypeCategory: FranchiseServiceTypeCategoryModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.franchiseServiceType,
  )
  @JoinColumn({
    name: 'service_type_id',
    referencedColumnName: 'id',
  })
  serviceType: ServiceTypeModel;

  @OneToMany(
    () => ServiceTypeImageModel,
    (serviceTypeImageModel) => serviceTypeImageModel.franchiseServiceType,
  )
  serviceTypeImages: ServiceTypeImageModel[];
}
