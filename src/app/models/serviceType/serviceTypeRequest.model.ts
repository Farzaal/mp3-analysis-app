import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { ServiceTypeRequestStatus } from '@/app/contracts/enums/serviceTypeRequest.enum';
import { UserModel } from '../user/user.model';
import { ServiceTypeCategoryModel } from './serviceTypeCategory.model';

@Entity('service_type_requests')
export class ServiceTypeRequestModel extends PostgresBaseModel {
  @Column({
    name: 'service_type_category_title',
    type: 'varchar',
    nullable: true,
  })
  service_type_category_title: string;

  @Column({
    name: 'service_type_title',
    type: 'varchar',
    nullable: true,
  })
  service_type_title: string;

  @Column({
    name: 'requested_by',
    type: 'bigint',
    nullable: false,
  })
  requested_by: number;

  @Column({
    name: 'service_type_category_id',
    type: 'bigint',
    nullable: true,
  })
  service_type_category_id: number;

  @Column({
    name: 'is_linen',
    type: 'boolean',
    default: false,
  })
  is_linen: boolean;

  @Column({
    name: 'is_handyman_concierge',
    type: 'boolean',
    default: false,
  })
  is_handyman_concierge: boolean;

  @Column({
    name: 'standard_hourly',
    type: 'boolean',
    default: false,
  })
  standard_hourly: boolean;

  @Column({
    name: 'is_recurring',
    type: 'boolean',
    default: false,
  })
  is_recurring: boolean;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ServiceTypeRequestStatus,
    nullable: false,
    default: ServiceTypeRequestStatus.PendingApproval,
  })
  status: ServiceTypeRequestStatus;

  @ManyToOne(() => UserModel, (userModel) => userModel.serviceTypeRequestUser)
  @JoinColumn({ name: 'requested_by', referencedColumnName: 'id' })
  serviceTypeRequestedBy: UserModel;

  @ManyToOne(
    () => ServiceTypeCategoryModel,
    (serviceTypeCategoryModel) =>
      serviceTypeCategoryModel.serviceTypeCatRequested,
  )
  @JoinColumn({ name: 'service_type_category_id', referencedColumnName: 'id' })
  serviceTypeRequestedCat: ServiceTypeCategoryModel;
}
