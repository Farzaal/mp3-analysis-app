import { Entity, Column, OneToMany } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { ServiceRequestMasterModel } from '../serviceRequest/serviceRequestMaster.model';
import { EstimateMasterModel } from '../estimate/estimateMaster.model';

import { DocumentModel } from '../document/document.model';
import { VendorServiceTypeModel } from '../serviceType/vendorServiceType.model';
import { VendorServiceTypePriorityModel } from '../serviceType/vendorServiceTypePriorities.model';
import { FranchiseServiceLocationModel } from './franchiseServiceLocation.model';
import { VendorServiceLocationModel } from './vendorServiceLocation.model';
import { PropertyServiceTypeRateModel } from '../property/propertyServiceTypeRates.model';
import { FranchiseServiceTypeCategoryModel } from '../serviceType/franchiseServiceTypeCategory.model';
import { FranchiseServiceTypeModel } from '../serviceType/franchiseServiceType.model';
import { ServiceTypeImageModel } from '../serviceType/serviceTypeImage.model';
import { FranchiseLinenConfigModel } from '../linen/franchiseLinenConfig.model';
import { Exclude } from 'class-transformer';
import { InvoiceMasterModel } from '../invoice/invoiceMaster.model';
import { EstimateVendorDistributionModel } from '../estimate/estimateVendorDistribution.model';

@Entity('franchises')
export class FranchiseModel extends PostgresBaseModel {
  @Column({
    name: 'name',
    type: 'varchar',
    nullable: true,
  })
  name: string;

  @Column({
    name: 'location',
    type: 'varchar',
    nullable: true,
  })
  location: string;

  @Column({
    name: 'site_url',
    type: 'varchar',
    nullable: true,
  })
  site_url: string;

  @Column({
    name: 'franchise_site_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_site_id: number;

  @Column({
    name: 'is_approved',
    type: 'boolean',
    default: true,
  })
  is_approved: boolean;

  @Column({
    name: 'comments',
    type: 'varchar',
    nullable: true,
  })
  comments: string;

  @Column({
    name: 'stripe_public_key',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  stripe_public_key: string;

  @Column({
    name: 'stripe_secret_key',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  stripe_secret_key: string;

  @Column({
    name: 'twilio_sid',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  twilio_sid: string;

  @Column({
    name: 'twilio_token',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  twilio_token: string;

  @Column({
    name: 'twilio_from_number',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  twilio_from_number: string;

  @Column({
    name: 'twilio_your_cell_number',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  twilio_your_cell_number: string;

  @Column({
    name: 'google_review_number',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  google_review_number: string;

  @Column({
    name: 'facebook_review_link',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @Exclude()
  facebook_review_link: string;

  @Column({
    name: 'royalty_percentage',
    type: 'float',
    nullable: true,
    select: false,
  })
  @Exclude()
  royalty_percentage: number;

  @Column({
    name: 'credit_card_processing_fee',
    type: 'float',
    nullable: true,
    select: false,
  })
  @Exclude()
  credit_card_processing_fee: number;

  @Column({
    name: 'stripe_verified',
    type: 'boolean',
    default: false,
  })
  stripe_verified: boolean;

  @Column({
    name: 'twilio_verified',
    type: 'boolean',
    default: false,
  })
  twilio_verified: boolean;

  @OneToMany(() => UserModel, (userModel) => userModel.franchiseUser)
  user: UserModel[];

  @OneToMany(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.franchiseProperty,
  )
  propertyMaster: PropertyMasterModel[];

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) =>
      serviceRequestMasterModel.franchiseServiceRequest,
  )
  serviceRequestMaster: ServiceRequestMasterModel[];

  @OneToMany(
    () => EstimateMasterModel,
    (serviceRequestMasterModel) => serviceRequestMasterModel.franchiseEstimate,
  )
  estimateMaster: EstimateMasterModel[];

  @OneToMany(
    () => DocumentModel,
    (documentModel) => documentModel.franchiseDocs,
  )
  document: DocumentModel[];

  @OneToMany(
    () => FranchiseServiceTypeCategoryModel,
    (franchiseServiceTypeCategoryModel) =>
      franchiseServiceTypeCategoryModel.franchiseCategories,
  )
  serviceTypeCategory: FranchiseServiceTypeCategoryModel[];

  @OneToMany(
    () => FranchiseServiceTypeModel,
    (franchiseServiceTypeModel) =>
      franchiseServiceTypeModel.franchiseServiceTypes,
  )
  serviceType: FranchiseServiceTypeModel[];

  @OneToMany(
    () => VendorServiceTypeModel,
    (VendorServiceTypeModel) =>
      VendorServiceTypeModel.franchiseVendorServiceType,
  )
  vendorServiceType: VendorServiceTypeModel[];

  @OneToMany(
    () => VendorServiceTypePriorityModel,
    (vendorServiceTypePriorityModel) =>
      vendorServiceTypePriorityModel.franchiseVendorServiceTypePriority,
  )
  vendorServiceTypePriority: VendorServiceTypePriorityModel[];

  @OneToMany(
    () => FranchiseServiceLocationModel,
    (franchiseServiceLocationModel) => franchiseServiceLocationModel.franchise,
  )
  franchiseServiceLocation: FranchiseServiceLocationModel;

  @OneToMany(
    () => VendorServiceLocationModel,
    (vendorServiceLocationModel) => vendorServiceLocationModel.franchise,
  )
  vendorFranchise: VendorServiceLocationModel;

  @OneToMany(
    () => PropertyServiceTypeRateModel,
    (propertyServiceTypeRateModel) =>
      propertyServiceTypeRateModel.propertyFranchiseRate,
  )
  franchisePropertyRate: PropertyServiceTypeRateModel;

  @OneToMany(
    () => FranchiseLinenConfigModel,
    (franchiseLinenConfigModel) => franchiseLinenConfigModel.franchiseLinen,
  )
  franchiseLinenConfig: FranchiseLinenConfigModel[];

  @OneToMany(
    () => InvoiceMasterModel,
    (invoiceMaster) => invoiceMaster.franchise,
  )
  invoiceMaster: InvoiceMasterModel[];

  @OneToMany(
    () => EstimateVendorDistributionModel,
    (estimateVendorDistributionModel) =>
      estimateVendorDistributionModel.franchiseEstimateVendorDistribution,
  )
  estimateMasterVendorDistribution: EstimateVendorDistributionModel;

  @OneToMany(
    () => ServiceTypeImageModel,
    (serviceTypeImageModel) => serviceTypeImageModel.franchise,
  )
  serviceTypeImages: ServiceTypeImageModel[];
}
