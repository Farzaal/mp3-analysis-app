import { Entity, Column, Index, JoinColumn, OneToOne } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { PropertyMasterModel } from './propertyMaster.model';

@Entity('property_maintenance_details')
export class PropertyMaintenanceDetailModel extends PostgresBaseModel {
  @Index()
  @Column({
    name: 'property_master_id',
    type: 'bigint',
    nullable: false,
  })
  property_master_id: number;

  @Column({
    name: 'air_filters',
    type: 'varchar',
    nullable: true,
  })
  air_filters: string;

  @Column({
    name: 'storm_preparation_instructions',
    type: 'varchar',
    nullable: true,
  })
  storm_preparation_instructions: string;

  @Column({
    name: 'emergency_procedures',
    type: 'varchar',
    nullable: true,
  })
  emergency_procedures: string;

  @Column({
    name: 'heating_cooling_system_type',
    type: 'varchar',
    nullable: true,
  })
  heating_cooling_system_type: string;

  @Column({
    name: 'heating_cooling_system_info',
    type: 'varchar',
    nullable: true,
  })
  heating_cooling_system_info: string;

  @Column({
    name: 'water_shutoff',
    type: 'varchar',
    nullable: true,
  })
  water_shutoff: string;

  @Column({
    name: 'bulb_type_preference',
    type: 'varchar',
    nullable: true,
  })
  bulb_type_preference: string;

  @Column({
    name: 'water_heater',
    type: 'varchar',
    nullable: true,
  })
  water_heater: string;

  @Column({
    name: 'water_heater_location',
    type: 'varchar',
    nullable: true,
  })
  water_heater_location: string;

  @Column({
    name: 'preventive_maintenance_instructions',
    type: 'varchar',
    nullable: true,
  })
  preventive_maintenance_instructions: string;

  @Column({
    name: 'breaker_box_location',
    type: 'varchar',
    nullable: true,
  })
  breaker_box_location: string;

  @Column({
    name: 'microwave_info',
    type: 'varchar',
    nullable: true,
  })
  microwave_info: string;

  @Column({
    name: 'stove_info',
    type: 'varchar',
    nullable: true,
  })
  stove_info: string;

  @Column({
    name: 'dishwasher_info',
    type: 'varchar',
    nullable: true,
  })
  dishwasher_info: string;

  @Column({
    name: 'washer_info',
    type: 'varchar',
    nullable: true,
  })
  washer_info: string;

  @Column({
    name: 'dryer_info',
    type: 'varchar',
    nullable: true,
  })
  dryer_info: string;

  @Column({
    name: 'refrigerator_info',
    type: 'varchar',
    nullable: true,
  })
  refrigerator_info: string;

  @Column({
    name: 'other_info',
    type: 'text',
    nullable: true,
  })
  other_info: string;

  @OneToOne(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.propertyMaintenanceDetail,
  )
  @JoinColumn({ name: 'property_master_id', referencedColumnName: 'id' })
  propertyMasterModel: PropertyMasterModel;
}
