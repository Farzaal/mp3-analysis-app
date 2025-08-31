import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { FranchiseModel } from './franchise.model';
import { PropertyMasterModel } from '../property/propertyMaster.model';
import { VendorServiceLocationModel } from './vendorServiceLocation.model';

@Entity('franchise_service_locations')
export class FranchiseServiceLocationModel extends PostgresBaseModel {
  @Column({
    name: 'service_area',
    type: 'varchar',
    nullable: false,
  })
  service_area: string;

  @Column({
    name: 'comments',
    type: 'varchar',
    nullable: true,
  })
  comments: string;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'franchise_site_service_location_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_site_service_location_id: number;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.franchiseServiceLocation,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchise: FranchiseModel;

  @OneToMany(
    () => PropertyMasterModel,
    (propertyMasterModel) => propertyMasterModel.propertyLocation,
  )
  propertyMaster: PropertyMasterModel[];

  @OneToMany(
    () => VendorServiceLocationModel,
    (vendorServiceLocationModel) =>
      vendorServiceLocationModel.vendorServiceLocation,
  )
  franchiseServiceLocation: VendorServiceLocationModel;
}
