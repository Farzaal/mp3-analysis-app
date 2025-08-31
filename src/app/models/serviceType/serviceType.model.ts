import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { VendorServiceTypeModel } from './vendorServiceType.model';
import { ServiceRequestMasterModel } from '../serviceRequest/serviceRequestMaster.model';
import { ServiceTypeCategoryModel } from './serviceTypeCategory.model';
import { FranchiseServiceTypeModel } from './franchiseServiceType.model';
import { PropertyServiceTypeRateModel } from '../property/propertyServiceTypeRates.model';
import { VendorServiceTypePriorityModel } from './vendorServiceTypePriorities.model';
import { EstimateMasterModel } from '../estimate/estimateMaster.model';
import { FranchiseLinenConfigModel } from '../linen/franchiseLinenConfig.model';
import { ServiceRequestLinenDetailModel } from '../serviceRequest/serviceRequestLinenDetail.model';
import { InvoiceMasterModel } from '../invoice/invoiceMaster.model';

@Entity('service_types')
export class ServiceTypeModel extends PostgresBaseModel {
  @Column({
    name: 'title',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  title: string;

  @Column({
    name: 'service_type_category_id',
    type: 'bigint',
    nullable: false,
  })
  service_type_category_id: number;

  @Column({
    name: 'is_linen',
    type: 'boolean',
    default: false,
  })
  is_linen: boolean;

  @Column({
    name: 'is_recurring',
    type: 'boolean',
    default: false,
  })
  is_recurring: boolean;

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
    () => VendorServiceTypeModel,
    (vendorServiceTypeModel) => vendorServiceTypeModel.serviceType,
  )
  vendorServiceType: VendorServiceTypeModel[];

  @OneToMany(
    () => FranchiseServiceTypeModel,
    (franchiseServiceTypeModel) => franchiseServiceTypeModel.serviceType,
  )
  franchiseServiceType: FranchiseServiceTypeModel[];

  @OneToMany(
    () => FranchiseServiceTypeModel,
    (franchiseServiceTypeModel) =>
      franchiseServiceTypeModel.associatedServiceType,
  )
  associatedFranchiseServiceTypes: FranchiseServiceTypeModel[];

  @OneToMany(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.serviceType,
  )
  estimateServiceType: EstimateMasterModel[];

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) => serviceRequestMasterModel.serviceType,
  )
  serviceRequestMaster: ServiceRequestMasterModel[];

  @OneToMany(
    () => PropertyServiceTypeRateModel,
    (propertyServiceTypeRateModel) =>
      propertyServiceTypeRateModel.propertyServiceTypeRate,
  )
  serviceTypeRate: PropertyServiceTypeRateModel[];

  @OneToMany(
    () => FranchiseLinenConfigModel,
    (propertyServiceTypeRateModel) =>
      propertyServiceTypeRateModel.serviceTypeLinen,
  )
  franchiseLinenConfig: FranchiseLinenConfigModel[];

  @OneToMany(
    () => ServiceRequestLinenDetailModel,
    (serviceRequestLinenDetailModel) =>
      serviceRequestLinenDetailModel.serviceTypeRequestLinen,
  )
  serviceRequestTypeLinen: ServiceRequestLinenDetailModel[];

  @OneToMany(
    () => VendorServiceTypePriorityModel,
    (vendorServiceTypePriorityModel) =>
      vendorServiceTypePriorityModel.vendorServiceType,
  )
  vendorServiceTypePriority: VendorServiceTypePriorityModel[];

  @ManyToOne(
    () => ServiceTypeCategoryModel,
    (serviceTypeCategoryModel) => serviceTypeCategoryModel.serviceType,
  )
  @JoinColumn({ name: 'service_type_category_id', referencedColumnName: 'id' })
  serviceTypeCategory: ServiceTypeCategoryModel;

  @OneToMany(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_service_type,
  )
  service_type_invoice: InvoiceMasterModel[];
}
