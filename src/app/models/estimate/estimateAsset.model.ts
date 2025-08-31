import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { EstimateMasterModel } from './estimateMaster.model';
import { UserModel } from '../user/user.model';

@Entity('estimate_assets')
export class EstimateAssetModel extends PostgresBaseModel {
  @Column({
    name: 'estimate_master_id',
    type: 'bigint',
    nullable: false,
  })
  estimate_master_id: number;

  @Column({
    name: 'media_url',
    type: 'varchar',
    nullable: false,
  })
  media_url: string;

  @Column({
    name: 'media_type',
    type: 'varchar',
    nullable: true,
  })
  media_type: string;

  @Column({
    name: 'media_added_by',
    type: 'bigint',
    nullable: true,
  })
  media_added_by: number;

  image_url?: string;

  url?: string;

  @ManyToOne(() => UserModel, (userModel) => userModel.estimateMediaCreator)
  @JoinColumn({ name: 'media_added_by', referencedColumnName: 'id' })
  estimateMedia: UserModel;

  @ManyToOne(
    () => EstimateMasterModel,
    (estimateMasterModel) => estimateMasterModel.estimateAsset,
  )
  @JoinColumn({ name: 'estimate_master_id', referencedColumnName: 'id' })
  estimateMaster: EstimateMasterModel;
}
