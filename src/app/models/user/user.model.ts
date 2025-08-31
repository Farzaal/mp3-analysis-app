import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { Exclude } from 'class-transformer';
import { UserType } from '../../contracts/enums/usertype.enum';
import { VendorServiceTypeModel } from '../serviceType/vendorServiceType.model';
import { NotificationModel } from '../notification/notification.model';
import { DocumentModel } from '../document/document.model';
import { UserPaymentMethodModel } from '../paymentMethod/userPaymentMethod.model';
import { EstimateMasterModel } from '../estimate/estimateMaster.model';
import { ServiceRequestMasterModel } from '../serviceRequest/serviceRequestMaster.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { VendorServiceTypePriorityModel } from '../serviceType/vendorServiceTypePriorities.model';
import { VendorServiceLocationModel } from '../franchise/vendorServiceLocation.model';
import { PropertyServiceTypeRateModel } from '../property/propertyServiceTypeRates.model';
import { ServiceRequestNoteModel } from '../serviceRequest/serviceRequestNote.model';
import { ServiceRequestMediaModel } from '../serviceRequest/serviceRequestMedia.model';
import { EstimateDetailModel } from '../estimate/estimateDetail.model';
import { UserDescriptionModel } from './userDescription.model';
import { UserMenuItemModel } from './userMenuItem.model';
import { ServiceTypeRequestModel } from '../serviceType/serviceTypeRequest.model';
import { ServiceRequestVendorStatusModel } from '../serviceRequest/serviceRequestVendorStatus.model';
import { EstimateDetailRejectionModel } from '../estimate/estimateDetailRejection.model';
import { UserTokenModel } from './userToken.model';
import { PaymentLogModel } from '../payment/paymentLog.model';
import { ScheduledNotificationModel } from '../notification/scheduledNotification.model';
import { EstimateVendorDistributionModel } from '../estimate/estimateVendorDistribution.model';
import { EstimateAssetModel } from '../estimate/estimateAsset.model';
import { InvoiceMasterModel } from '../invoice/invoiceMaster.model';
import { OwnerPaymentDetailsModel } from '../invoice/ownerPaymentDetails.model';
import { InvoiceLineItemModel } from '../invoice/invoiceLineItem.model';
import { VendorPaymentDetailsModel } from '../invoice/vendorPaymentDetails.model';
import { ServiceTypeRates } from '@/vendor/vendor.dto';
@Entity('users')
export class UserModel extends PostgresBaseModel {
  @Column({
    name: 'user_type',
    type: 'enum',
    enum: UserType,
    nullable: false,
  })
  user_type: UserType;

  @Column({
    name: 'is_approved',
    type: 'boolean',
    default: false,
  })
  is_approved: boolean;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  is_active: boolean;

  @Column({
    name: 'license_number',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  license_number: string;

  @Column({
    name: 'website_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  website_url: string;

  @Column({
    name: 'contact',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  contact: string;

  @Index({ unique: true })
  @Column({
    name: 'email',
    type: 'varchar',
    length: 80,
    nullable: false,
  })
  email: string;

  @Column({
    name: 'mailing_address',
    type: 'varchar',
    nullable: true,
  })
  mailing_address: string;

  @Column({
    name: 'city',
    type: 'varchar',
    nullable: true,
  })
  city: string;

  @Column({
    name: 'zip',
    type: 'varchar',
    nullable: true,
  })
  zip: string;

  @Column({
    name: 'state',
    type: 'varchar',
    nullable: true,
  })
  state: string;

  @Column({
    name: 'office_phone',
    type: 'varchar',
    nullable: true,
  })
  office_phone: string;

  @Column({
    name: 'cell_phone',
    type: 'varchar',
    nullable: true,
  })
  cell_phone: string;

  @Column({
    name: 'alternate_contact',
    type: 'varchar',
    nullable: true,
  })
  alternate_contact: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 128,
    nullable: false,
    select: false,
  })
  @Exclude()
  password: string;

  @Column({
    name: 'insurance_company',
    type: 'varchar',
    nullable: true,
  })
  insurance_company: string;

  @Column({
    name: 'insurance_document_name',
    type: 'varchar',
    nullable: true,
  })
  insurance_document_name: string;

  @Column({
    name: 'payment_gateway_customer_id',
    type: 'varchar',
    nullable: true,
  })
  payment_gateway_customer_id: string;

  @Column({
    name: 'policy_number',
    type: 'varchar',
    nullable: true,
  })
  policy_number: string;

  @Column({
    name: 'policy_effective_date',
    type: 'date',
    nullable: true,
  })
  policy_effective_date: Date | string;

  @Column({
    name: 'policy_expire_date',
    type: 'date',
    nullable: true,
  })
  policy_expire_date: Date | string;

  @Column({
    name: 'first_name',
    type: 'varchar',
    nullable: true,
  })
  first_name: string;

  @Column({
    name: 'last_name',
    type: 'varchar',
    nullable: true,
  })
  last_name: string;

  @Column({
    name: 'state_abbr',
    type: 'varchar',
    nullable: true,
  })
  state_abbr: string;

  @Column({
    name: 'archived',
    type: 'boolean',
    default: false,
  })
  archived: boolean;

  @Column({
    name: 'alternate_contact_name',
    type: 'varchar',
    nullable: true,
  })
  alternate_contact_name: string;

  @Column({
    name: 'profile_completion_step',
    type: 'smallint',
    default: 0,
  })
  profile_completion_step: number;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: true,
  })
  franchise_id: number;

  @Column({
    name: 'comments',
    type: 'text',
    nullable: true,
    default: null,
  })
  comments: string;

  @Column({
    name: 'terms_and_conditions',
    type: 'boolean',
    default: false,
  })
  terms_and_conditions: boolean;

  service_type_rates?: ServiceTypeRates[];

  @OneToMany(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.owner,
  )
  propertyMaster: PropertyMasterModel[];

  @OneToMany(
    () => UserTokenModel,
    (userTokenModel) => userTokenModel.userTokens,
  )
  token: UserTokenModel[];

  @OneToMany(
    () => VendorServiceTypeModel,
    (vendorServiceType) => vendorServiceType.vendor,
  )
  vendorServiceType: VendorServiceTypeModel[];

  @OneToMany(() => DocumentModel, (documentModel) => documentModel.user)
  document: DocumentModel[];

  @OneToMany(
    () => EstimateAssetModel,
    (estimateAssetModel) => estimateAssetModel.estimateMedia,
  )
  estimateMediaCreator: EstimateAssetModel[];

  @OneToMany(
    () => ServiceTypeRequestModel,
    (serviceTypeRequestModel) => serviceTypeRequestModel.serviceTypeRequestedBy,
  )
  serviceTypeRequestUser: ServiceTypeRequestModel[];

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceTypeRequestModel) =>
      serviceTypeRequestModel.serviceRequestCancelledBy,
  )
  serviceRequestCancelUser: ServiceRequestMasterModel[];

  @OneToMany(
    () => VendorServiceTypePriorityModel,
    (vendorServiceTypePriorityModel) => vendorServiceTypePriorityModel.creator,
  )
  vendorServiceTypePriorityCreator: VendorServiceTypePriorityModel[];

  @OneToMany(
    () => VendorServiceTypePriorityModel,
    (vendorServiceTypePriorityModel) => vendorServiceTypePriorityModel.vendor,
  )
  vendorServiceTypePriority: VendorServiceTypePriorityModel[];

  @OneToMany(
    () => NotificationModel,
    (notificationModel) => notificationModel.user,
  )
  notification: NotificationModel[];

  @OneToMany(
    () => ScheduledNotificationModel,
    (scheduledNotificationModel) => scheduledNotificationModel.user,
  )
  scheduledNotification: ScheduledNotificationModel[];

  @OneToMany(
    () => UserDescriptionModel,
    (userDescriptionModel) => userDescriptionModel.estimateDescriptionAddedBy,
  )
  estimateDescriptionUser: UserDescriptionModel[];

  @OneToMany(
    () => UserMenuItemModel,
    (userMenuItemModel) => userMenuItemModel.userMenu,
  )
  userMenuItem: UserMenuItemModel[];

  @OneToMany(
    () => EstimateDetailModel,
    (estimateDetailModel) => estimateDetailModel.estimateVendor,
  )
  estimateDetail: EstimateDetailModel[];

  @OneToMany(
    () => EstimateDetailRejectionModel,
    (estimateDetailRejectionModel) =>
      estimateDetailRejectionModel.estimateVendorRejection,
  )
  estimateDetailRejection: EstimateDetailRejectionModel[];

  @OneToMany(
    () => EstimateDetailRejectionModel,
    (estimateDetailRejectionModel) =>
      estimateDetailRejectionModel.estimateFranchiseAdminRejection,
  )
  estimateDetailByFranchiseAdminRejection: EstimateDetailRejectionModel[];

  @OneToMany(
    () => EstimateDetailModel,
    (estimateDetailModel) => estimateDetailModel.estimateFranchiseAdmin,
  )
  estimateDetailByFranchiseAdmin: EstimateDetailModel[];

  @OneToMany(
    () => UserPaymentMethodModel,
    (userPaymentMethodModel) => userPaymentMethodModel.owner,
  )
  userPaymentMethod: UserPaymentMethodModel[];

  @OneToMany(
    () => PaymentLogModel,
    (paymentLogModel) => paymentLogModel.ownerPaymentLog,
  )
  paymentByOwner: PaymentLogModel[];

  @OneToMany(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.owner,
  )
  estimateOwner: EstimateMasterModel[];

  @OneToMany(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.vendor,
  )
  estimateVendor: EstimateMasterModel[];

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) => serviceRequestMasterModel.creator,
  )
  serviceRequestCreator: ServiceRequestMasterModel[];

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) => serviceRequestMasterModel.owner,
  )
  serviceRequestPropertyOwner: ServiceRequestMasterModel[];

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequestMasterModel) => serviceRequestMasterModel.vendor,
  )
  serviceRequestVendor: ServiceRequestMasterModel[];

  @ManyToOne(() => FranchiseModel, (franchiseModel) => franchiseModel.user)
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseUser: FranchiseModel;

  @OneToMany(
    () => VendorServiceLocationModel,
    (vendorServiceLocationModel) => vendorServiceLocationModel.vendorUser,
  )
  vendorUserLoc: VendorServiceLocationModel[];

  @OneToMany(
    () => PropertyServiceTypeRateModel,
    (propertyServiceTypeRateModel) =>
      propertyServiceTypeRateModel.propertyFranchiseUser,
  )
  propertyRateCreator: PropertyServiceTypeRateModel;

  @OneToMany(
    () => ServiceRequestNoteModel,
    (serviceRequestNoteModel) => serviceRequestNoteModel.serviceRequestNoteUser,
  )
  serviceRequestNoteCreator: ServiceRequestNoteModel;

  @OneToMany(
    () => ServiceRequestMediaModel,
    (serviceRequestMediaModel) => serviceRequestMediaModel.serviceRequestMedia,
  )
  serviceRequestMediaCreator: ServiceRequestMediaModel;

  @OneToMany(
    () => ServiceRequestVendorStatusModel,
    (serviceRequestMediaModel) =>
      serviceRequestMediaModel.serviceRequestStatusUser,
  )
  serviceRequestStatusCreator: ServiceRequestVendorStatusModel;

  @OneToMany(
    () => EstimateVendorDistributionModel,
    (estimateVendorDistributionModel) =>
      estimateVendorDistributionModel.ownerVendorDistribution,
  )
  estimateOwnerVendorDistribution: EstimateVendorDistributionModel;

  @OneToMany(
    () => EstimateVendorDistributionModel,
    (estimateVendorDistributionModel) =>
      estimateVendorDistributionModel.vendorDistribution,
  )
  estimateVendorDistribution: EstimateVendorDistributionModel;

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_vendor,
  )
  vendor_invoice: InvoiceMasterModel;

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_deposit_user,
  )
  user_deposit_invoice: InvoiceMasterModel;

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.deposit_paid_by_user,
  )
  user_deposit_paid_by: InvoiceMasterModel;

  @OneToMany(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_owner,
  )
  owner_invoice: InvoiceMasterModel;

  @OneToMany(
    () => VendorPaymentDetailsModel,
    (vendorPaymentDetailsModel) => vendorPaymentDetailsModel.vendor_payment,
  )
  vendor_payment_details: VendorPaymentDetailsModel;

  @OneToMany(
    () => VendorPaymentDetailsModel,
    (vendorPaymentDetailsModel) => vendorPaymentDetailsModel.franchise_payment,
  )
  franchise_payment_details: VendorPaymentDetailsModel;

  @OneToMany(
    () => OwnerPaymentDetailsModel,
    (ownerPaymentDetailsModel) =>
      ownerPaymentDetailsModel.owner_payment_details_admin,
  )
  admin_payment_details: OwnerPaymentDetailsModel;

  @OneToMany(
    () => InvoiceLineItemModel,
    (invoiceLineItemModel) => invoiceLineItemModel.vendor_line_item,
  )
  vendor_line_item: InvoiceLineItemModel;

  @OneToMany(
    () => InvoiceLineItemModel,
    (invoiceLineItemModel) => invoiceLineItemModel.franchise_line_item,
  )
  franchise_line_item: InvoiceLineItemModel;
}
