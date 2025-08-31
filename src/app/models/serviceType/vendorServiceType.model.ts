import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { ServiceTypeModel } from '../serviceType/serviceType.model';
import { FranchiseModel } from '../franchise/franchise.model';

@Entity('vendor_service_types')
export class VendorServiceTypeModel extends PostgresBaseModel {
  @Index()
  @Column({
    name: 'vendor_id',
    type: 'bigint',
    nullable: false,
  })
  vendor_id: number;

  @Index()
  @Column({
    name: 'service_type_id',
    type: 'bigint',
    nullable: false,
  })
  service_type_id: number;

  @Index()
  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'is_approved',
    type: 'boolean',
    default: true,
  })
  is_approved: boolean;

  @Column({
    name: 'hourly_rate',
    type: 'float',
    nullable: false,
    default: 0,
  })
  hourly_rate: number;

  @Column({
    name: 'service_call_fee',
    type: 'float',
    nullable: false,
    default: 0,
  })
  service_call_fee: number;

  @ManyToOne(() => UserModel, (userModel) => userModel.vendorServiceType)
  @JoinColumn({ name: 'vendor_id', referencedColumnName: 'id' })
  vendor: UserModel;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.vendorServiceType,
  )
  @JoinColumn({ name: 'service_type_id', referencedColumnName: 'id' })
  serviceType: ServiceTypeModel;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.vendorServiceType,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseVendorServiceType: FranchiseModel;
}
