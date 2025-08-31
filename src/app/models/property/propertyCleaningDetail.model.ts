import { Entity, Column, Index, JoinColumn, OneToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { PropertyMasterModel } from './propertyMaster.model';

@Entity('property_cleaning_details')
export class PropertyCleaningDetailModel extends PostgresBaseModel {
  @Index()
  @Column({
    name: 'property_master_id',
    type: 'bigint',
    nullable: false,
  })
  property_master_id: number;

  @Column({
    name: 'number_of_bedrooms',
    type: 'smallint',
    nullable: false,
  })
  number_of_bedrooms: number;

  @Column({
    name: 'number_of_baths',
    type: 'smallint',
    nullable: false,
  })
  number_of_baths: number;

  @Column({
    name: 'number_of_king_beds',
    type: 'smallint',
    nullable: false,
  })
  number_of_king_beds: number;

  @Column({
    name: 'number_of_queen_beds',
    type: 'smallint',
    nullable: false,
  })
  number_of_queen_beds: number;

  @Column({
    name: 'number_of_full_beds',
    type: 'smallint',
    nullable: false,
  })
  number_of_full_beds: number;

  @Column({
    name: 'number_of_twin_beds',
    type: 'smallint',
    nullable: false,
  })
  number_of_twin_beds: number;

  @Column({
    name: 'guest_sleeping_capacity',
    type: 'int',
    nullable: true,
  })
  guest_sleeping_capacity: number;

  @Column({
    name: 'cleaning_team_instruction',
    type: 'text',
    nullable: true,
  })
  cleaning_team_instruction: string;

  @Column({
    name: 'location_of_dumpster',
    type: 'text',
    nullable: true,
  })
  location_of_dumpster: string;

  @OneToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.propertyCleaningDetail,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMasterModel: PropertyMasterModel;
}
