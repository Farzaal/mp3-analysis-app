import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { MemberShipTierModel } from './membershipTier.model';
import { InvoicePaymentStatus } from '@/app/contracts/enums/invoice.enum';
@Entity('membership_transactions')
export class MemberShipTransactionModel extends PostgresBaseModel {
  @Column({
    name: 'membership_id',
    type: 'bigint',
    nullable: false,
  })
  membership_id: number;

  @Column({
    name: 'property_master_id',
    type: 'bigint',
    nullable: false,
  })
  property_master_id: number;

  @Column({
    name: 'transaction_amount',
    type: 'float',
    default: 0,
  })
  transaction_amount: number;

  @Column({
    name: 'transaction_date',
    type: 'date',
    nullable: false,
  })
  transaction_date: Date;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InvoicePaymentStatus,
    default: InvoicePaymentStatus.Unpaid,
    nullable: false,
  })
  status: InvoicePaymentStatus;

  @Column({
    name: 'discount_percentage',
    type: 'float',
    default: 0,
  })
  discount_percentage: number;

  @Column({
    name: 'discount_amount',
    type: 'float',
    default: 0,
  })
  discount_amount: number;

  @Column({
    name: 'payment_info',
    type: 'jsonb',
    nullable: true,
  })
  payment_info: object;

  @ManyToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.memberShipTransaction,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMaster: PropertyMasterModel;

  @ManyToOne(
    () => MemberShipTierModel,
    (memberShipTierModel) => memberShipTierModel.memberShipTransaction,
  )
  @JoinColumn({ name: 'membership_id', referencedColumnName: 'id' })
  membershipTier: MemberShipTierModel;
}
