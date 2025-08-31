import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { EstimateMasterModel } from './estimateMaster.model';

@Entity('estimate_vendor_distributions')
export class EstimateVendorDistributionModel extends PostgresBaseModel {
  @Column({
    name: 'owner_id',
    type: 'bigint',
    nullable: false,
  })
  owner_id: number;

  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: false,
  })
  vendor_id: number;

  @Column({
    name: 'property_master_id',
    type: 'bigint',
    nullable: false,
  })
  property_master_id: number;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'estimate_master_id',
    type: 'bigint',
    nullable: false,
  })
  estimate_master_id: number;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.estimateOwnerVendorDistribution,
  )
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  ownerVendorDistribution: UserModel;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.estimateVendorDistribution,
  )
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  vendorDistribution: UserModel;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.estimateMasterVendorDistribution,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseEstimateVendorDistribution: FranchiseModel;

  @ManyToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) =>
      propertyMasterModel.estimatePropertyVendorDistribution,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMasterVendorDistribution: PropertyMasterModel;

  @ManyToOne(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.estimateVendorDistribution,
  )
  @JoinColumn({ name: 'estimate_master_id', referencedColumnName: 'id' })
  estimateMasterVendorDistribution: EstimateMasterModel;
}
