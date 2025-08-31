import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { PropertyCleaningDetailModel } from './propertyCleaningDetail.model';
import { MemberShipTierModel } from '../membership/membershipTier.model';
import { ServiceRequestMasterModel } from '../serviceRequest/serviceRequestMaster.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { VendorServiceTypePriorityModel } from '../serviceType/vendorServiceTypePriorities.model';
import { PropertyStatus } from '@/app/contracts/enums/property.enum';
import { PropertyMaintenanceDetailModel } from './propertyMaintainenceDetail.model';
import { FranchiseServiceLocationModel } from '../franchise/franchiseServiceLocation.model';
import { PropertyServiceTypeRateModel } from './propertyServiceTypeRates.model';
import { UserPaymentMethodModel } from '../paymentMethod/userPaymentMethod.model';
import { EstimateMasterModel } from '../estimate/estimateMaster.model';
import { MemberShipTransactionModel } from '../membership/membershipTransaction.model';
import { EstimateVendorDistributionModel } from '../estimate/estimateVendorDistribution.model';
import { InvoiceMasterModel } from '../invoice/invoiceMaster.model';
@Entity('property_masters')
export class PropertyMasterModel extends PostgresBaseModel {
  @Index()
  @Column({
    name: 'owner_id',
    type: 'bigint',
    nullable: false,
  })
  owner_id: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PropertyStatus,
    nullable: false,
  })
  status: PropertyStatus;

  @Column({
    name: 'off_program',
    type: 'boolean',
    default: false,
  })
  off_program: boolean;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'city',
    type: 'bigint',
    nullable: false,
  })
  city: number;

  @Column({
    name: 'qr_code',
    type: 'varchar',
    nullable: true,
  })
  qr_code: string;

  @Column({
    name: 'lock_brand_required_battery_type',
    type: 'varchar',
    nullable: true,
  })
  lock_brand_required_battery_type: string;

  @Column({
    name: 'property_nick_name',
    type: 'varchar',
    nullable: true,
  })
  property_nick_name: string;

  @Column({
    name: 'address',
    type: 'varchar',
    nullable: true,
  })
  address: string;

  @Column({
    name: 'state',
    type: 'varchar',
    nullable: true,
  })
  state: string;

  @Column({
    name: 'zip',
    type: 'varchar',
    nullable: true,
  })
  zip: string;

  @Column({
    name: 'alternate_contact_name',
    type: 'varchar',
    nullable: true,
  })
  alternate_contact_name: string;

  @Column({
    name: 'alarm_system',
    type: 'varchar',
    nullable: true,
  })
  alarm_system: string;

  @Column({
    name: 'alternate_contact_phone',
    type: 'varchar',
    nullable: true,
  })
  alternate_contact_phone?: string;

  @Column({
    name: 'parking_details',
    type: 'varchar',
    nullable: true,
  })
  parking_details?: string;

  @Column({
    name: 'community_gate_code',
    type: 'varchar',
    nullable: true,
  })
  community_gate_code?: string;

  @Column({
    name: 'front_door_lock_type',
    type: 'varchar',
    nullable: true,
  })
  front_door_lock_type?: string;

  @Column({
    name: 'door_code',
    type: 'varchar',
    nullable: true,
  })
  door_code?: string;

  @Column({
    name: 'lock_box_code',
    type: 'varchar',
    nullable: true,
  })
  lock_box_code?: string;

  @Column({
    name: 'supply_closet_code',
    type: 'varchar',
    nullable: true,
  })
  supply_closet_code?: string;

  @Column({
    name: 'supply_closet_location',
    type: 'varchar',
    nullable: true,
  })
  supply_closet_location?: string;

  @Column({
    name: 'storage_room_code',
    type: 'varchar',
    nullable: true,
  })
  storage_room_code?: string;

  @Column({
    name: 'vrbo_number',
    type: 'varchar',
    nullable: true,
  })
  vrbo_number?: string;

  @Column({
    name: 'airbnb_number',
    type: 'varchar',
    nullable: true,
  })
  airbnb_number?: string;

  @Column({
    name: 'smart_home_devices',
    type: 'varchar',
    nullable: true,
  })
  smart_home_devices?: string;

  @Column({
    name: 'isp_info',
    type: 'varchar',
    nullable: true,
  })
  isp_info?: string;

  @Column({
    name: 'wifi_network',
    type: 'varchar',
    nullable: true,
  })
  wifi_network?: string;

  @Column({
    name: 'wifi_router_location',
    type: 'varchar',
    nullable: true,
  })
  wifi_router_location?: string;

  @Column({
    name: 'wifi_password',
    type: 'varchar',
    nullable: true,
  })
  wifi_password?: string;

  @Column({
    name: 'account_name_is_in',
    type: 'varchar',
    nullable: true,
  })
  account_name_is_in?: string;

  @Column({
    name: 'account_phone_number',
    type: 'varchar',
    nullable: true,
  })
  account_phone_number?: string;

  @Column({
    name: 'account_code',
    type: 'varchar',
    nullable: true,
  })
  account_code?: string;

  @Column({
    name: 'heated_sq_ft',
    type: 'varchar',
    nullable: true,
  })
  heated_sq_ft?: string;

  @Column({
    name: 'hoa_management_info',
    type: 'varchar',
    nullable: true,
  })
  hoa_management_info?: string;

  @Column({
    name: 'other_management_company',
    type: 'varchar',
    nullable: true,
  })
  other_management_company?: string;

  @Column({
    name: 'pool_hot_tub',
    type: 'varchar',
    nullable: true,
  })
  pool_hot_tub: string;

  @Column({
    name: 'owner_payment_method_id',
    type: 'bigint',
    nullable: true,
  })
  owner_payment_method_id: number;

  @Column({
    name: 'call_owner_charge',
    type: 'float',
    default: 0,
  })
  call_owner_charge: number;

  @Column({
    name: 'call_vendor_charge',
    type: 'float',
    default: 0,
  })
  call_vendor_charge: number;

  @Column({
    name: 'enable_auto_charge',
    type: 'boolean',
    default: false,
  })
  enable_auto_charge: boolean;

  @OneToMany(
    () => VendorServiceTypePriorityModel,
    (vendorServiceTypePriorityModel) =>
      vendorServiceTypePriorityModel.propertyMaster,
  )
  vendorServiceTypePriority: VendorServiceTypePriorityModel[];

  @ManyToOne(() => UserModel, (userModel) => userModel.propertyMaster)
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  owner: UserModel;

  @ManyToOne(
    () => FranchiseServiceLocationModel,
    (franchiseServiceLocationModel) =>
      franchiseServiceLocationModel.propertyMaster,
  )
  @JoinColumn({ name: 'city', referencedColumnName: 'id' })
  propertyLocation: FranchiseServiceLocationModel;

  @OneToOne(
    () => MemberShipTierModel,
    (propertyMaintainenceDetailModel) =>
      propertyMaintainenceDetailModel.propertyMaster,
  )
  membershipTier: MemberShipTierModel;

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_property,
  )
  property_invoice: InvoiceMasterModel;

  @ManyToOne(
    () => UserPaymentMethodModel,
    (userPaymentMethodModel) =>
      userPaymentMethodModel.userPropertyPaymentMethod,
  )
  @JoinColumn({ name: 'owner_payment_method_id', referencedColumnName: 'id' })
  propertyPaymentMethod: UserPaymentMethodModel;

  @OneToOne(
    () => PropertyCleaningDetailModel,
    (propertyCleaningDetailModel) =>
      propertyCleaningDetailModel.propertyMasterModel,
  )
  propertyCleaningDetail: PropertyCleaningDetailModel;

  @OneToOne(
    () => PropertyMaintenanceDetailModel,
    (propertyMaintainenceDetailModel) =>
      propertyMaintainenceDetailModel.propertyMasterModel,
  )
  propertyMaintenanceDetail: PropertyMaintenanceDetailModel;

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) => serviceRequestMasterModel.propertyMaster,
  )
  serviceRequestMaster: ServiceRequestMasterModel[];

  @OneToMany(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.propertyMaster,
  )
  estimateProperty: EstimateMasterModel[];

  @OneToMany(
    () => MemberShipTransactionModel,
    (memberShipTransaction) => memberShipTransaction.propertyMaster,
  )
  memberShipTransaction: MemberShipTransactionModel[];

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.propertyMaster,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseProperty: FranchiseModel;

  @OneToMany(
    () => PropertyServiceTypeRateModel,
    (propertyServiceTypeRateModel) =>
      propertyServiceTypeRateModel.propertyMasterRate,
  )
  fracnhisePropertyMaster: PropertyServiceTypeRateModel[];

  @OneToMany(
    () => EstimateVendorDistributionModel,
    (estimateVendorDistributionModel) =>
      estimateVendorDistributionModel.propertyMasterVendorDistribution,
  )
  estimatePropertyVendorDistribution: EstimateVendorDistributionModel;
}
