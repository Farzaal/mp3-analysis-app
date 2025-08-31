import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { EstimateMasterModel } from './estimateMaster.model';
import { UserModel } from '../user/user.model';

@Entity('estimate_details')
export class EstimateDetailModel extends PostgresBaseModel {
  @Column({
    name: 'estimate_master_id',
    type: 'bigint',
    nullable: false,
  })
  estimate_master_id: number;

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
    name: 'is_estimate_approved',
    type: 'boolean',
    default: false,
  })
  is_estimate_approved: boolean;

  @Column({
    name: 'is_send_to_owner',
    type: 'boolean',
    default: false,
  })
  is_send_to_owner: boolean;

  @Column({
    name: 'is_grand_total',
    type: 'boolean',
    default: false,
  })
  is_grand_total: boolean;

  @Column({
    name: 'description',
    type: 'varchar',
    nullable: true,
  })
  description: string;

  @Column({
    name: 'is_archived',
    type: 'boolean',
    default: false,
  })
  is_archived: boolean;

  @Column({
    name: 'is_quote_rejected',
    type: 'boolean',
    default: false,
  })
  is_quote_rejected: boolean;

  @Column({
    name: 'is_decline_by_vendor',
    type: 'boolean',
    default: false,
  })
  is_decline_by_vendor: boolean;

  status?: string;

  @ManyToOne(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.estimateDetail,
  )
  @JoinColumn({ name: 'estimate_master_id', referencedColumnName: 'id' })
  estimateMaster: EstimateMasterModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.estimateDetail)
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  estimateVendor: UserModel;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.estimateDetailByFranchiseAdmin,
  )
  @JoinColumn({ name: 'franchise_admin_id', referencedColumnName: 'id' })
  estimateFranchiseAdmin: UserModel;
}
