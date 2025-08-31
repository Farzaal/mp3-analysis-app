import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { InvoiceMasterModel } from './invoiceMaster.model';
import { PaymentType, PaymentStatus } from '@/app/contracts/enums/invoice.enum';

@Entity('owner_payment_details')
export class OwnerPaymentDetailsModel extends PostgresBaseModel {
  @Column({
    name: 'invoice_master_id',
    type: 'bigint',
    nullable: false,
  })
  invoice_master_id: number;

  @Column({
    name: 'payment_type',
    type: 'enum',
    enum: PaymentType,
    nullable: true,
  })
  payment_type: PaymentType;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    nullable: false,
  })
  payment_status: PaymentStatus;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    nullable: true,
    default: 0,
  })
  amount_paid: number;

  @Column({
    name: 'invoice_total_after_sales_tax',
    type: 'decimal',
    nullable: true,
    default: 0,
  })
  invoice_total_after_sales_tax: number;

  @Column({
    name: 'cheque_number',
    type: 'varchar',
    nullable: true,
  })
  cheque_number: string;

  @Column({
    name: 'send_request_to_owner',
    type: 'boolean',
    nullable: true,
    default: false,
  })
  send_request_to_owner: boolean;

  @Column({
    name: 'franchise_admin_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_admin_id: number;

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_master_owner_payment,
  )
  @JoinColumn({ name: 'invoice_master_id', referencedColumnName: 'id' })
  owner_payment_invoice_master: InvoiceMasterModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.admin_payment_details)
  @JoinColumn({ name: 'franchise_admin_id', referencedColumnName: 'id' })
  owner_payment_details_admin: UserModel;
}
