import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { EstimateMasterModel } from './estimateMaster.model';
import { UserModel } from '../user/user.model';

@Entity('estimate_detail_rejections')
export class EstimateDetailRejectionModel extends PostgresBaseModel {
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
    name: 'is_archived',
    type: 'boolean',
    default: false,
  })
  is_archived: boolean;

  @ManyToOne(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.estimateDetailRejection,
  )
  @JoinColumn({ name: 'estimate_master_id', referencedColumnName: 'id' })
  estimateMasterRejection: EstimateMasterModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.estimateDetailRejection)
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  estimateVendorRejection: UserModel;

  @ManyToOne(
    () => UserModel,
    (userModel) => userModel.estimateDetailByFranchiseAdminRejection,
  )
  @JoinColumn({ name: 'franchise_admin_id', referencedColumnName: 'id' })
  estimateFranchiseAdminRejection: UserModel;
}
