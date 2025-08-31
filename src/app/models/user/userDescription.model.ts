import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { EstimateMasterModel } from '../estimate/estimateMaster.model';
import { UserModel } from './user.model';

@Entity('user_descriptions')
export class UserDescriptionModel extends PostgresBaseModel {
  @Column({
    name: 'estimate_master_id',
    type: 'bigint',
    nullable: true,
  })
  estimate_master_id: number;

  @Column({
    name: 'description',
    type: 'text',
    nullable: false,
  })
  description: string;

  @Column({
    name: 'user_id',
    type: 'bigint',
    nullable: false,
  })
  user_id: number;

  @Column({
    name: 'is_estimate_reject_description',
    type: 'boolean',
    nullable: true,
    default: false,
  })
  is_estimate_reject_description: boolean;

  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: true,
  })
  vendor_id: number;

  @ManyToOne(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.estimateDescription,
  )
  @JoinColumn({ name: 'estimate_master_id', referencedColumnName: 'id' })
  estimateMaster: EstimateMasterModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.estimateDescriptionUser)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  estimateDescriptionAddedBy: UserModel;
}
