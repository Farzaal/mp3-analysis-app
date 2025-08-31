import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { UserModel } from '../user/user.model';
import { ServiceTypeModel } from './serviceType.model';

@Entity('vendor_service_type_priorities')
export class VendorServiceTypePriorityModel extends PostgresBaseModel {
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
    name: 'vendor_id',
    type: 'bigint',
    nullable: false,
  })
  vendor_id: number;

  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: false,
  })
  created_by: number;

  @ManyToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.vendorServiceTypePriority,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMaster: PropertyMasterModel;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.vendorServiceTypePriority,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseVendorServiceTypePriority: FranchiseModel;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.vendorServiceTypePriorityCreator,
  )
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  creator: UserModel;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.vendorServiceTypePriority,
  )
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  vendor: UserModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.vendorServiceTypePriority,
  )
  @JoinColumn({ name: 'service_type_id', referencedColumnName: 'id' })
  vendorServiceType: ServiceTypeModel;
}
