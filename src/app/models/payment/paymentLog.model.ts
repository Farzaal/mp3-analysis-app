import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { InvoiceMasterModel } from '../invoice/invoiceMaster.model';
import { UserPaymentMethodModel } from '../paymentMethod/userPaymentMethod.model';

@Entity('payment_logs')
export class PaymentLogModel extends PostgresBaseModel {
  @Column({
    name: 'owner_id',
    type: 'bigint',
    nullable: false,
  })
  owner_id: number;

  @Column({
    name: 'invoice_master_id',
    type: 'bigint',
    nullable: true,
  })
  invoice_master_id: number;

  @Column({
    name: 'service_request_master_id',
    type: 'bigint',
    nullable: true,
  })
  service_request_master_id: number;

  @Column({
    name: 'payment_method_id',
    type: 'bigint',
    nullable: false,
  })
  payment_method_id: number;

  @Column({
    name: 'payment_info',
    type: 'jsonb',
    nullable: false,
  })
  payment_info: object;

  @ManyToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_master_payment,
  )
  @JoinColumn({ name: 'invoice_master_id', referencedColumnName: 'id' })
  paymentLog: InvoiceMasterModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.paymentByOwner)
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  ownerPaymentLog: UserModel;

  @ManyToOne(
    () => UserPaymentMethodModel,
    (userPaymentMethodModel) => userPaymentMethodModel.paymentLog,
  )
  @JoinColumn({ name: 'payment_method_id', referencedColumnName: 'id' })
  paymentMethod: UserPaymentMethodModel[];
}
