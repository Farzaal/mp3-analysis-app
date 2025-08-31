import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import {
  PaymentMethod,
  PaymentMethodStatus,
} from '@/app/contracts/enums/payment.enum';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { PaymentLogModel } from '../payment/paymentLog.model';
import { InvoiceMasterModel } from '../invoice/invoiceMaster.model';

@Entity('user_payment_methods')
export class UserPaymentMethodModel extends PostgresBaseModel {
  @Column({
    name: 'owner_id',
    type: 'bigint',
    nullable: false,
  })
  owner_id: number;

  @Column({
    name: 'payment_method_type',
    type: 'enum',
    enum: PaymentMethod,
    nullable: false,
  })
  payment_method_type: PaymentMethod;

  @Column({
    name: 'stripe_payment_method_id',
    type: 'varchar',
    nullable: true,
  })
  stripe_payment_method_id: string;

  @Column({
    name: 'setup_intent_id',
    type: 'varchar',
    nullable: false,
  })
  setup_intent_id: string;

  @Column({
    name: 'payment_info',
    type: 'jsonb',
    nullable: false,
  })
  payment_info: object;

  @Column({
    name: 'payment_method_info',
    type: 'jsonb',
    nullable: true,
  })
  payment_method_info: object;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PaymentMethodStatus,
    nullable: true,
  })
  status: PaymentMethodStatus;

  @Column({
    name: 'card_holder_name',
    type: 'varchar',
    nullable: true,
  })
  card_holder_name: string;

  @Column({
    name: 'is_default',
    type: 'boolean',
    default: false,
  })
  is_default: boolean;

  @OneToMany(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.propertyPaymentMethod,
  )
  userPropertyPaymentMethod: PropertyMasterModel[];

  @ManyToOne(() => UserModel, (userModel) => userModel.userPaymentMethod)
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  owner: UserModel;

  @OneToMany(
    () => PaymentLogModel,
    (paymentLogModel) => paymentLogModel.paymentMethod,
  )
  paymentLog: PaymentLogModel;

  @OneToOne(
    () => InvoiceMasterModel,
    (invoiceMasterModel) => invoiceMasterModel.invoice_payment_method,
  )
  owner_payment_method: InvoiceMasterModel;
}
