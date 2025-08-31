import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { FranchiseModel } from './franchise.model';
import { UserModel } from '../user/user.model';
import { FranchiseServiceLocationModel } from './franchiseServiceLocation.model';

@Entity('vendor_service_locations')
export class VendorServiceLocationModel extends PostgresBaseModel {
  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: false,
  })
  vendor_id: number;

  @Column({
    name: 'service_location_id',
    type: 'bigint',
    nullable: false,
  })
  service_location_id: number;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.vendorFranchise,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchise: FranchiseModel;

  @ManyToOne(() => UserModel, (userModel) => userModel.vendorUserLoc)
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  vendorUser: UserModel;

  @ManyToOne(
    () => FranchiseServiceLocationModel,
    (franchiseServiceLocationModel) =>
      franchiseServiceLocationModel.franchiseServiceLocation,
  )
  @JoinColumn({ name: 'service_location_id', referencedColumnName: 'id' })
  vendorServiceLocation: FranchiseServiceLocationModel;
}
