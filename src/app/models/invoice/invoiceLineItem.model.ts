import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { InvoiceMasterModel } from './invoiceMaster.model';
import { InvoiceLineItemComputationType } from '@/app/contracts/enums/invoiceLineItem.enum';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import { UserModel } from '../user/user.model';
import { InvoiceSection } from '@/app/contracts/enums/invoice.enum';

@Entity('invoice_line_items')
export class InvoiceLineItemModel extends PostgresBaseModel {
  @Column({
    name: 'line_item',
    type: 'varchar',
    nullable: false,
  })
  line_item: string;

  @Column({
    name: 'price',
    type: 'float',
    nullable: false,
  })
  price: number;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string;

  @Column({
    name: 'invoice_master_id',
    type: 'bigint',
    nullable: false,
  })
  invoice_master_id: number;

  @Column({
    name: 'is_vendor_line_item',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  is_vendor_line_item: boolean;

  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: false,
  })
  vendor_id: number;

  @Column({
    name: 'franchise_admin_id',
    type: 'bigint',
    nullable: true,
  })
  franchise_admin_id: number;

  @Column({
    name: 'service_request_status',
    type: 'enum',
    enum: ServiceRequestStatus,
    nullable: false,
  })
  service_request_status: ServiceRequestStatus;

  @Column({
    name: 'computation_type',
    type: 'enum',
    enum: InvoiceLineItemComputationType,
    nullable: false,
    default: InvoiceLineItemComputationType.Add,
  })
  computation_type: InvoiceLineItemComputationType;

  @Column({
    name: 'is_readonly',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  is_readonly: boolean;

  @Column({
    name: 'section_id',
    type: 'enum',
    enum: InvoiceSection,
    nullable: false,
    default: InvoiceSection.Material,
  })
  section_id: InvoiceSection;

  @Column({
    name: 'hours_worked',
    type: 'float',
    nullable: true,
  })
  hours_worked: number;

  @ManyToOne(
    () => InvoiceMasterModel,
    (invoiceMaster) => invoiceMaster.invoice_line_items,
  )
  @JoinColumn({ name: 'invoice_master_id', referencedColumnName: 'id' })
  invoice_master: InvoiceMasterModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.vendor_line_item)
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  vendor_line_item: UserModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.franchise_line_item)
  @JoinColumn({ name: 'franchise_admin_id', referencedColumnName: 'id' })
  franchise_line_item: UserModel;
}
