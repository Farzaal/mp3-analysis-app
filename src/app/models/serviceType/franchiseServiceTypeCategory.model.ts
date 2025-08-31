import { Entity, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { ServiceTypeCategoryModel } from './serviceTypeCategory.model';
import { FranchiseServiceTypeModel } from './franchiseServiceType.model';

@Entity('franchise_service_type_categories')
export class FranchiseServiceTypeCategoryModel extends PostgresBaseModel {
  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'service_type_category_id',
    type: 'bigint',
    nullable: false,
  })
  service_type_category_id: number;

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
    name: 'image_url',
    type: 'varchar',
    nullable: true,
  })
  image_url: string;

  @Column({
    name: 'slug',
    type: 'varchar',
    nullable: true,
  })
  slug: string;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.serviceTypeCategory,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseCategories: FranchiseModel;

  @ManyToOne(
    () => ServiceTypeCategoryModel,
    (serviceTypeCategoryModel) => serviceTypeCategoryModel.serviceTypeCat,
  )
  @JoinColumn({ name: 'service_type_category_id', referencedColumnName: 'id' })
  franchiseServiceTypeCategory: ServiceTypeCategoryModel;

  @OneToMany(
    () => FranchiseServiceTypeModel,
    (franchiseServiceTypeModel) =>
      franchiseServiceTypeModel.franchiseServiceTypeCategory,
  )
  franchiseServiceType: FranchiseServiceTypeModel[];
}
