import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { InvoiceMasterModel } from './invoiceMaster.model';
import { PaymentType, PaymentStatus } from '@/app/contracts/enums/invoice.enum';

@Entity('vendor_payment_details')
export class VendorPaymentDetailsModel extends PostgresBaseModel {
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
    name: 'vendor_id',
    type: 'bigint',
    nullable: false,
  })
  vendor_id: number;

  @Column({
    name: 'franchise_admin_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_admin_id: number;

  @Column({
    name: 'cheque_number',
    type: 'varchar',
    nullable: true,
  })
  cheque_number: string;

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_master_vendor_payment,
  )
  @JoinColumn({ name: 'invoice_master_id', referencedColumnName: 'id' })
  vendor_payment_invoice_master: InvoiceMasterModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.vendor_payment_details)
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  vendor_payment: UserModel;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.franchise_payment_details,
  )
  @JoinColumn({ name: 'franchise_admin_id', referencedColumnName: 'id' })
  franchise_payment: UserModel;
}
