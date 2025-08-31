import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { EstimateDetailModel } from './estimateDetail.model';
import { EstimateStatus } from '@/app/contracts/enums/estimate.enum';
import { FranchiseModel } from '../franchise/franchise.model';
import { ServiceTypeModel } from '../serviceType/serviceType.model';
import { EstimateAssetModel } from './estimateAsset.model';
import { ServiceRequestMasterModel } from '../serviceRequest/serviceRequestMaster.model';
import { DistributionType } from '@/app/contracts/enums/distributionType';
import { UserDescriptionModel } from '../user/userDescription.model';
import { EstimateDetailRejectionModel } from './estimateDetailRejection.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { EstimateVendorDistributionModel } from './estimateVendorDistribution.model';

@Entity('estimate_masters')
export class EstimateMasterModel extends PostgresBaseModel {
  @Column({
    name: 'owner_id',
    type: 'bigint',
    nullable: false,
  })
  owner_id: number;

  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: true,
  })
  vendor_id: number;

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
    name: 'description',
    type: 'varchar',
    nullable: true,
  })
  description: string;

  @Column({
    name: 'franchise_description',
    type: 'varchar',
    nullable: true,
  })
  franchise_description: string;

  @Column({
    name: 'start_date',
    type: 'date',
    nullable: false,
  })
  start_date: Date | string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: EstimateStatus,
    nullable: false,
  })
  status: EstimateStatus;

  @Column({
    name: 'estimate_distribution_type',
    type: 'enum',
    enum: DistributionType,
    nullable: false,
  })
  estimate_distribution_type: DistributionType;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'is_archived',
    type: 'boolean',
    default: false,
  })
  is_archived: boolean;

  @Column({
    name: 'owner_consent',
    type: 'boolean',
    default: false,
  })
  owner_consent: boolean;

  estimate_status?: string;

  franchise_estimate_details?: EstimateDetailModel[];

  is_send_to_owner?: boolean;

  owner_quote_rejection_description?: string;

  quotation_date?: string;

  estimate_distribution_vendors?: {
    id: number;
    label: string;
  }[];

  @OneToMany(
    () => EstimateDetailModel,
    (estimateMasterModel) => estimateMasterModel.estimateMaster,
  )
  estimateDetail: EstimateDetailModel[];

  @OneToMany(
    () => EstimateDetailRejectionModel,
    (estimateDetailRejectionModel) =>
      estimateDetailRejectionModel.estimateMasterRejection,
  )
  estimateDetailRejection: EstimateDetailRejectionModel[];

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) => serviceRequestMasterModel.estimateMaster,
  )
  serviceRequestMasterEstimate: ServiceRequestMasterModel[];

  @OneToMany(
    () => EstimateAssetModel,
    (estimateMasterModel) => estimateMasterModel.estimateMaster,
  )
  estimateAsset: EstimateAssetModel[];

  @OneToMany(
    () => UserDescriptionModel,
    (estimateMasterModel) => estimateMasterModel.estimateMaster,
  )
  estimateDescription: UserDescriptionModel[];

  @ManyToOne(() => UserModel, (userModel) => userModel.estimateOwner)
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  owner: UserModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.estimateVendor)
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  vendor: UserModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.estimateServiceType,
  )
  @JoinColumn({ name: 'service_type_id', referencedColumnName: 'id' })
  serviceType: ServiceTypeModel;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.estimateMaster,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseEstimate: FranchiseModel;

  @ManyToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.estimateProperty,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMaster: PropertyMasterModel;

  @OneToMany(
    () => EstimateVendorDistributionModel,
    (estimateVendorDistributionModel) =>
      estimateVendorDistributionModel.estimateMasterVendorDistribution,
  )
  estimateVendorDistribution: EstimateVendorDistributionModel;
}
