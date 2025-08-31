import { Entity, Column, OneToMany } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceTypeModel } from './serviceType.model';
import { FranchiseServiceTypeCategoryModel } from './franchiseServiceTypeCategory.model';
import { ServiceTypeRequestModel } from './serviceTypeRequest.model';

@Entity('service_type_categories')
export class ServiceTypeCategoryModel extends PostgresBaseModel {
  @Column({
    name: 'title',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  title: string;

  @Column({
    name: 'is_linen',
    type: 'boolean',
    default: false,
  })
  is_linen: boolean;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    name: 'is_guest_concierge',
    type: 'boolean',
    default: false,
  })
  is_guest_concierge: boolean;

  @Column({
    name: 'is_handyman_concierge',
    type: 'boolean',
    default: false,
  })
  is_handyman_concierge: boolean;

  @Column({
    name: 'standard_hourly',
    type: 'boolean',
    default: false,
  })
  standard_hourly: boolean;

  @OneToMany(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.serviceTypeCategory,
  )
  serviceType: ServiceTypeModel[];

  @OneToMany(
    () => FranchiseServiceTypeCategoryModel,
    (franchiseServiceTypeCategoryModel) =>
      franchiseServiceTypeCategoryModel.franchiseServiceTypeCategory,
  )
  serviceTypeCat: FranchiseServiceTypeCategoryModel[];

  @OneToMany(
    () => ServiceTypeRequestModel,
    (serviceTypeRequestModel) =>
      serviceTypeRequestModel.serviceTypeRequestedCat,
  )
  serviceTypeCatRequested: ServiceTypeRequestModel[];
}
