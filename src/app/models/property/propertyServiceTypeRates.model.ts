import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceTypeModel } from '../serviceType/serviceType.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { UserModel } from '../user/user.model';
import { PropertyMasterModel } from './propertyMaster.model';

@Entity('property_service_type_rates')
export class PropertyServiceTypeRateModel extends PostgresBaseModel {
  @Column({
    name: 'property_master_id',
    type: 'bigint',
    nullable: false,
  })
  property_master_id: number;

  @Column({
    name: 'service_type_id',
    type: 'bigint',
    nullable: false,
  })
  service_type_id: number;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'franchise_admin_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_admin_id: number;

  @Column({
    name: 'owner_charge',
    type: 'float',
    nullable: true,
  })
  owner_charge: number;

  @Column({
    name: 'vendor_charge',
    type: 'float',
    nullable: true,
  })
  vendor_charge: number;

  @Column({
    name: 'discount_percentage',
    type: 'float',
    default: 0,
  })
  discount_percentage: number;

  @ManyToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.fracnhisePropertyMaster,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMasterRate: PropertyMasterModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.serviceTypeRate,
  )
  @JoinColumn({ name: 'service_type_id', referencedColumnName: 'id' })
  propertyServiceTypeRate: ServiceTypeModel;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.franchisePropertyRate,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  propertyFranchiseRate: FranchiseModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.propertyRateCreator)
  @JoinColumn({ name: 'franchise_admin_id', referencedColumnName: 'id' })
  propertyFranchiseUser: UserModel;
}
