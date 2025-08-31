import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { FranchiseServiceTypeModel } from './franchiseServiceType.model';
import { FranchiseModel } from '../franchise/franchise.model';

@Entity('service_type_images')
export class ServiceTypeImageModel extends PostgresBaseModel {
  @Column({
    name: 'franchise_service_type_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_service_type_id: number;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'image_url',
    type: 'varchar',
    nullable: false,
  })
  image_url: string;

  @ManyToOne(
    () => FranchiseServiceTypeModel,
    (franchiseServiceTypeModel) => franchiseServiceTypeModel.serviceTypeImages,
  )
  @JoinColumn({ name: 'franchise_service_type_id', referencedColumnName: 'id' })
  franchiseServiceType: FranchiseServiceTypeModel;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.serviceTypeImages,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchise: FranchiseModel;
}
