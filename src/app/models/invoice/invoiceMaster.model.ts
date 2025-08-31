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
import { InvoiceLineItemModel } from './invoiceLineItem.model';
import {
  InvoiceSection,
  InvoiceStatus,
} from '@/app/contracts/enums/invoice.enum';
import { ServiceRequestMasterModel } from '../serviceRequest/serviceRequestMaster.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { PaymentLogModel } from '../payment/paymentLog.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { UserModel } from '../user/user.model';
import { UserPaymentMethodModel } from '../paymentMethod/userPaymentMethod.model';
import { ServiceTypeModel } from '../serviceType/serviceType.model';
import { VendorPaymentDetailsModel } from './vendorPaymentDetails.model';
import { OwnerPaymentDetailsModel } from './ownerPaymentDetails.model';

@Entity('invoice_masters')
export class InvoiceMasterModel extends PostgresBaseModel {
  @Index({ unique: true })
  @Column({
    name: 'service_request_master_id',
    type: 'bigint',
    nullable: false,
  })
  service_request_master_id: number;

  @Column({
    name: 'property_master_id',
    type: 'bigint',
    nullable: false,
  })
  property_master_id: number;

  @Column({
    name: 'owner_id',
    type: 'bigint',
    nullable: false,
  })
  owner_id: number;

  @Column({
    name: 'service_type_id',
    type: 'bigint',
    nullable: false,
  })
  service_type_id: number;

  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: true,
  })
  vendor_id: number;

  @Column({
    name: 'vendor_description',
    type: 'text',
    nullable: true,
  })
  vendor_description: string;

  @Column({
    name: 'franchise_description',
    type: 'text',
    nullable: true,
  })
  franchise_description: string;

  @Column({
    name: 'vendor_total',
    type: 'float',
    nullable: false,
    default: 0,
  })
  vendor_total: number;

  @Column({
    name: 'discount_percentage',
    type: 'float',
    nullable: false,
    default: 0,
  })
  discount_percentage: number;

  @Column({
    name: 'franchise_total',
    type: 'float',
    nullable: false,
    default: 0,
  })
  franchise_total: number;

  @Column({
    name: 'invoice_status',
    type: 'enum',
    enum: InvoiceStatus,
    nullable: false,
  })
  invoice_status: InvoiceStatus;

  @Column({
    name: 'next_invoice_status',
    type: 'enum',
    enum: InvoiceStatus,
    nullable: true,
  })
  next_invoice_status: InvoiceStatus;

  @Column({
    name: 'invoice_uuid',
    type: 'varchar',
    nullable: true,
  })
  invoice_uuid: string;

  @Column({
    name: 'vendor_remaining_balance',
    type: 'float',
    nullable: false,
    default: 0,
  })
  vendor_remaining_balance: number;

  @Column({
    name: 'franchise_remaining_balance',
    type: 'float',
    nullable: false,
    default: 0,
  })
  franchise_remaining_balance: number;

  @Column({
    name: 'deposit_amount',
    type: 'float',
    nullable: false,
    default: 0,
  })
  deposit_amount: number;

  @Column({
    name: 'deposit_required_by',
    type: 'bigint',
    nullable: true,
  })
  deposit_required_by: number;

  @Column({
    name: 'deposit_paid_by',
    type: 'bigint',
    nullable: true,
  })
  deposit_paid_by: number;

  @Column({
    name: 'deposit_paid',
    type: 'boolean',
    default: false,
  })
  deposit_paid: boolean;

  @Column({
    name: 'payment_method_id',
    type: 'bigint',
    nullable: true,
  })
  payment_method_id: number;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    comment: 'Franchise ID for this invoice',
  })
  franchise_id: number;

  @Column({
    name: 'current_payment_log_id',
    type: 'bigint',
    nullable: true,
    comment:
      'This has been added to reference the current payment log, logs could be many',
  })
  current_payment_log_id: number;

  @Column({
    name: 'send_to_owner_at',
    type: 'bigint',
    nullable: true,
  })
  send_to_owner_at: number;

  @Column({
    name: 'auto_send_to_owner',
    type: 'boolean',
    default: false,
  })
  auto_send_to_owner: boolean;

  @Column({
    name: 'invoice_paid_at',
    type: 'bigint',
    nullable: true,
  })
  invoice_paid_at: number;

  @Column({
    name: 'franchise_updated_at',
    type: 'bigint',
    nullable: true,
  })
  franchise_updated_at: number;

  @Column({
    name: 'paid_by_owner_at',
    type: 'bigint',
    nullable: true,
  })
  paid_by_owner_at: number;

  vendorLineItems?: {
    section_id: InvoiceSection;
    data: InvoiceLineItemModel[];
  }[];
  franchiseGroupedLineItems?: {
    section_id: InvoiceSection;
    data: InvoiceLineItemModel[];
  }[];
  due_date?: string;
  created_date?: string;
  send_to_owner_at_formatted?: string;
  franchise_updated_at_formatted?: string;
  paid_by_owner_at_formatted?: string;
  child_invoices?: InvoiceMasterModel[];
  secondary_requests?: ServiceRequestMasterModel[];

  @OneToMany(
    () => PaymentLogModel,
    (userDescription) => userDescription.paymentLog,
  )
  invoice_master_payment: PaymentLogModel[];

  @OneToMany(
    () => InvoiceLineItemModel,
    (invoiceLineItem) => invoiceLineItem.invoice_master,
  )
  invoice_line_items: InvoiceLineItemModel[];

  @ManyToOne(
    () => ServiceRequestMasterModel,
    (serviceRequestMaster) => serviceRequestMaster.invoice_master,
  )
  @JoinColumn({ name: 'service_request_master_id', referencedColumnName: 'id' })
  service_request_master: ServiceRequestMasterModel;

  @ManyToOne(() => FranchiseModel, (franchise) => franchise.invoiceMaster)
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchise: FranchiseModel;

  @OneToOne(
    () => ServiceRequestMasterModel,
    (invServiceRequestMasterModel) =>
      invServiceRequestMasterModel.service_request_invoice,
  )
  invoice_service_request: ServiceRequestMasterModel;

  @ManyToOne(
    () => PropertyMasterModel,
    (serviceRequestMaster) => serviceRequestMaster.property_invoice,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  invoice_property: PropertyMasterModel;

  @ManyToOne(
    () => UserModel,
    (serviceRequestMaster) => serviceRequestMaster.vendor_invoice,
  )
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  invoice_vendor: UserModel;

  @ManyToOne(
    () => UserModel,
    (serviceRequestMaster) => serviceRequestMaster.user_deposit_invoice,
  )
  @JoinColumn({ name: 'deposit_required_by', referencedColumnName: 'id' })
  invoice_deposit_user: UserModel;

  @ManyToOne(
    () => UserModel,
    (serviceRequestMaster) => serviceRequestMaster.user_deposit_paid_by,
  )
  @JoinColumn({ name: 'deposit_paid_by', referencedColumnName: 'id' })
  deposit_paid_by_user: UserModel;

  @ManyToOne(
    () => UserPaymentMethodModel,
    (serviceRequestMaster) => serviceRequestMaster.owner_payment_method,
  )
  @JoinColumn({ name: 'payment_method_id', referencedColumnName: 'id' })
  invoice_payment_method: UserPaymentMethodModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.owner_invoice)
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  invoice_owner: UserModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.service_type_invoice,
  )
  @JoinColumn({ name: 'service_type_id', referencedColumnName: 'id' })
  invoice_service_type: ServiceTypeModel;

  @OneToOne(
    () => VendorPaymentDetailsModel,
    (vendorPaymentDetailsModel) =>
      vendorPaymentDetailsModel.vendor_payment_invoice_master,
  )
  invoice_master_vendor_payment: VendorPaymentDetailsModel;

  @OneToOne(
    () => OwnerPaymentDetailsModel,
    (ownerPaymentDetailsModel) =>
      ownerPaymentDetailsModel.owner_payment_invoice_master,
  )
  invoice_master_owner_payment: OwnerPaymentDetailsModel;
}
