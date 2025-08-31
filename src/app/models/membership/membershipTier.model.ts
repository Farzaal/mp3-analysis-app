import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { MemberShipTransactionModel } from './membershipTransaction.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';

@Entity('membership_tiers')
export class MemberShipTierModel extends PostgresBaseModel {
  @Column({
    name: 'comments',
    type: 'varchar',
    nullable: true,
  })
  comments: string;

  @Column({
    name: 'price',
    type: 'float',
    default: 0,
  })
  price: number;

  @Column({
    name: 'discount_percentage',
    type: 'float',
    default: 0,
  })
  discount_percentage: number;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'membership_type',
    type: 'enum',
    enum: MemberShipStatus,
  })
  membership_type: MemberShipStatus;

  @Column({
    name: 'property_master_id',
    type: 'bigint',
    nullable: false,
  })
  property_master_id: number;

  @Column({
    name: 'is_last_transaction_success',
    type: 'boolean',
    default: false,
  })
  is_last_transaction_success: boolean;

  @Column({
    name: 'next_due_date',
    type: 'date',
    nullable: true,
  })
  next_due_date: Date;

  @OneToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.membershipTier,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMaster: PropertyMasterModel;

  @OneToMany(
    () => MemberShipTransactionModel,
    (memberShipTransaction) => memberShipTransaction.membershipTier,
  )
  memberShipTransaction: MemberShipTransactionModel[];

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.propertyMaster,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseProperty: FranchiseModel;
}
