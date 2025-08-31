import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceTypeModel } from '../serviceType/serviceType.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { LinenType } from '@/app/contracts/enums/linenType.enum';
import { LinenDeliveryType } from '@/app/contracts/enums/linenDeliveryType.enum';
import { LinenProducts } from '@/app/contracts/enums/linenProducts.enum';

@Entity('franchise_linen_configs')
export class FranchiseLinenConfigModel extends PostgresBaseModel {
  @Column({
    name: 'service_type_id',
    type: 'bigint',
    nullable: false,
  })
  service_type_id: number;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  @Column({
    name: 'type',
    type: 'enum',
    enum: LinenType,
    nullable: false,
  })
  type: LinenType;

  @Column({
    name: 'delivery_type',
    type: 'enum',
    enum: LinenDeliveryType,
    nullable: false,
  })
  delivery_type: LinenDeliveryType;

  @Column({
    name: 'product_type',
    type: 'enum',
    enum: LinenProducts,
    nullable: true,
  })
  product_type: LinenProducts;

  @Column({
    name: 'number_of_bedrooms',
    type: 'int',
    nullable: true,
  })
  number_of_bedrooms: number;

  @Column({
    name: 'fees',
    type: 'float',
    nullable: false,
  })
  fees: number;

  @ManyToOne(
    () => ServiceTypeModel,
    (serviceTypeModel) => serviceTypeModel.franchiseLinenConfig,
  )
  @JoinColumn({ name: 'service_type_id', referencedColumnName: 'id' })
  serviceTypeLinen: ServiceTypeModel;

  @ManyToOne(
    () => FranchiseModel,
    (franchiseModel) => franchiseModel.franchiseLinenConfig,
  )
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseLinen: FranchiseModel;
}
