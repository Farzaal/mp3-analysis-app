import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceRequestMediaModel } from './serviceRequestMedia.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { ServiceTypeModel } from '../serviceType/serviceType.model';
import { UserModel } from '../user/user.model';
import { ServiceRequestStatus } from '../../contracts/enums/serviceRequest.enum';
import { ServiceRequestDiscrepancyModel } from './serviceRequestDiscrepancy.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { ServiceRequestNoteModel } from './serviceRequestNote.model';
import { ServiceRequestPriority } from '@/app/contracts/enums/serviceRequestPriority.enum';
import { OwnerApprovalStatus } from '@/app/contracts/enums/ownerApprovalStatus.enum';
import { EstimateMasterModel } from '../estimate/estimateMaster.model';
import { ServiceRequestVendorStatusModel } from './serviceRequestVendorStatus.model';
import { ServiceRequestLinenDetailModel } from './serviceRequestLinenDetail.model';
import { ServiceRequestRecurringDateModel } from './serviceRequestRecurringDate.model';
import { InvoiceMasterModel } from '../invoice/invoiceMaster.model';
import { PaymentLogModel } from '../payment/paymentLog.model';
import { ServiceTypeTurnover } from '@/app/contracts/enums/serviceTypeRequest.enum';
import { ServiceRequestRecurringLogModel } from './serviceRequestRecurringLog.model';
import { GuestModel } from './guest.model';
import { DistributionType } from '@/app/contracts/enums/distributionType';

@Entity('service_request_masters')
export class ServiceRequestMasterModel extends PostgresBaseModel {
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
    name: 'status',
    type: 'enum',
    enum: ServiceRequestStatus,
    nullable: false,
  })
  status: ServiceRequestStatus;

  @Column({
    name: 'turn_over',
    type: 'enum',
    enum: ServiceTypeTurnover,
    nullable: true,
  })
  turn_over: ServiceTypeTurnover;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    name: 'vendor_distribution_type',
    type: 'enum',
    enum: DistributionType,
    nullable: true,
  })
  vendor_distribution_type: DistributionType;

  @Column({
    name: 'cancel_reason',
    type: 'text',
    nullable: true,
  })
  cancel_reason: string;

  @Column({
    name: 'notes_for_vendor',
    type: 'text',
    nullable: true,
  })
  notes_for_vendor: string;

  @Column({
    name: 'created_by',
    type: 'bigint',
    nullable: true,
  })
  created_by: number;

  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: true,
  })
  vendor_id: number;

  @Column({
    name: 'start_date',
    type: 'date',
    nullable: true,
  })
  start_date: Date | string;

  @Column({
    name: 'end_date',
    type: 'date',
    nullable: true,
  })
  end_date: Date | string;

  @Column({
    name: 'priority',
    type: 'enum',
    enum: ServiceRequestPriority,
    nullable: true,
  })
  priority: ServiceRequestPriority;

  @Column({
    name: 'is_occupied',
    type: 'boolean',
    default: false,
  })
  is_occupied: boolean;

  @Column({
    name: 'owner_id',
    type: 'bigint',
    nullable: false,
  })
  owner_id: number;

  @Column({
    name: 'cancelled_at_status',
    type: 'enum',
    enum: ServiceRequestStatus,
    nullable: true,
  })
  cancelled_at_status: ServiceRequestStatus;

  @Column({
    name: 'cancelled_by',
    type: 'bigint',
    nullable: true,
  })
  cancelled_by: number;

  @Column({
    name: 'is_guest',
    type: 'boolean',
    default: false,
  })
  is_guest: boolean;

  @Column({
    name: 'is_parent',
    type: 'boolean',
    default: false,
  })
  is_parent: boolean;

  @Column({
    name: 'is_guest_concierge',
    type: 'boolean',
    default: false,
  })
  is_guest_concierge: boolean;

  @Column({
    name: 'is_archived',
    type: 'boolean',
    default: false,
  })
  is_archived: boolean;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'invoice_master_id',
    type: 'bigint',
    nullable: true,
  })
  invoice_master_id: number;

  @Column({
    name: 'display_to_vendor',
    type: 'boolean',
    default: true,
  })
  display_to_vendor: boolean;

  @Column({
    name: 'is_discrepancy',
    type: 'boolean',
    default: false,
  })
  is_discrepancy: boolean;

  @Column({
    name: 'owner_approval_status',
    type: 'enum',
    enum: OwnerApprovalStatus,
    nullable: false,
    default: OwnerApprovalStatus.UnApproved,
  })
  owner_approval_status: OwnerApprovalStatus;

  @Column({
    name: 'estimate_master_id',
    type: 'bigint',
    nullable: true,
  })
  estimate_master_id: number;

  @Column({
    name: 'is_recurring',
    type: 'boolean',
    default: false,
  })
  is_recurring: boolean;

  payment_log?: PaymentLogModel;

  @Column({
    name: 'guest_id',
    type: 'bigint',
    nullable: true,
  })
  guest_id: number;

  @Column({
    name: 'parent_id',
    type: 'bigint',
    nullable: true,
  })
  parent_id: number;

  service_call_fee?: number;

  hourly_rate?: number;

  can_create_child_request?: boolean;

  @OneToMany(
    () => ServiceRequestMediaModel,
    (serviceRequestMediaModel) => serviceRequestMediaModel.serviceRequestMaster,
  )
  serviceRequestMedia: ServiceRequestMediaModel[];

  @OneToMany(
    () => ServiceRequestVendorStatusModel,
    (serviceRequestVendorStatusModel) =>
      serviceRequestVendorStatusModel.vendorServiceRequestStatus,
  )
  serviceRequestVendorStatus: ServiceRequestVendorStatusModel[];

  @OneToMany(
    () => ServiceRequestNoteModel,
    (serviceRequestNoteModel) => serviceRequestNoteModel.serviceRequestMaster,
  )
  serviceRequestNote: ServiceRequestNoteModel[];

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMaster) => invoiceMaster.service_request_master,
  )
  invoice_master: InvoiceMasterModel;

  @OneToMany(
    () => ServiceRequestDiscrepancyModel,
    (serviceRequestDiscrepancyModel) =>
      serviceRequestDiscrepancyModel.rootServiceRequestMaster,
  )
  rootServiceRequestDiscrepancy: ServiceRequestDiscrepancyModel[];

  @OneToOne(
    () => ServiceRequestRecurringDateModel,
    (serviceRequestRecurringDateModel) =>
      serviceRequestRecurringDateModel.serviceRequestRecurringDate,
  )
  serviceRequestDates: ServiceRequestRecurringDateModel[];

  @OneToOne(
    () => ServiceRequestDiscrepancyModel,
    (serviceRequestDiscrepancyModel) =>
      serviceRequestDiscrepancyModel.serviceRequestMaster,
  )
  serviceRequestDiscrepancy: ServiceRequestDiscrepancyModel;

  @ManyToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.serviceRequestMaster,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMaster: PropertyMasterModel;

  @ManyToOne(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.serviceRequestMasterEstimate,
  )
  @JoinColumn({ name: 'estimate_master_id', referencedColumnName: 'id' })
  estimateMaster: EstimateMasterModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.serviceRequestMaster,
  )
  @JoinColumn({ name: 'service_type_id', referencedColumnName: 'id' })
  serviceType: ServiceTypeModel;

  @ManyToOne(
    () => UserModel,
    (serviceTypeModel) => serviceTypeModel.serviceRequestCreator,
  )
  @JoinColumn({ name: 'created_by', referencedColumnName: 'id' })
  creator: UserModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.serviceRequestCancelUser)
  @JoinColumn({ name: 'cancelled_by', referencedColumnName: 'id' })
  serviceRequestCancelledBy: UserModel;

  @ManyToOne(
    () => UserModel,
    (serviceTypeModel) => serviceTypeModel.serviceRequestPropertyOwner,
  )
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  owner: UserModel;

  @ManyToOne(
    () => UserModel,
    (serviceTypeModel) => serviceTypeModel.serviceRequestVendor,
  )
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  vendor: UserModel;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.serviceRequestMaster,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseServiceRequest: FranchiseModel;

  @OneToOne(
    () => ServiceRequestLinenDetailModel,
    (serviceRequestLinenDetailModel) =>
      serviceRequestLinenDetailModel.linenServiceRequest,
  )
  serviceRequestMasterLinen: ServiceRequestLinenDetailModel;

  @OneToMany(
    () => ServiceRequestRecurringLogModel,
    (serviceRequestRecurringLogModel) =>
      serviceRequestRecurringLogModel.mainServiceRequestRecurring,
  )
  mainServiceRequestRecurringLog: ServiceRequestRecurringLogModel;

  @OneToMany(
    () => ServiceRequestRecurringLogModel,
    (serviceRequestRecurringLogModel) =>
      serviceRequestRecurringLogModel.newServiceRequestRecurring,
  )
  newServiceRequestRecurringLog: ServiceRequestRecurringLogModel;

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_service_request,
  )
  @JoinColumn({ name: 'invoice_master_id', referencedColumnName: 'id' })
  service_request_invoice: InvoiceMasterModel;

  @ManyToOne(() => GuestModel, (guest) => guest.serviceRequests)
  @JoinColumn({ name: 'guest_id', referencedColumnName: 'id' })
  guest: GuestModel;

  @ManyToOne(
    () => ServiceRequestMasterModel,
    (serviceRequest) => serviceRequest.childServiceRequests,
    { nullable: true },
  )
  @JoinColumn({ name: 'parent_id', referencedColumnName: 'id' })
  parentServiceRequest: ServiceRequestMasterModel;

  @OneToMany(
    () => ServiceRequestMasterModel,
    (serviceRequest) => serviceRequest.parentServiceRequest,
  )
  childServiceRequests: ServiceRequestMasterModel[];
}
