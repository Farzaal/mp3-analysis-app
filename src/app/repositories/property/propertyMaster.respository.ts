import { Injectable } from '@nestjs/common';
import { PropertyMasterModel } from '../../models/property/propertyMaster.model';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { IPaginationDBParams } from '../../contracts/interfaces/paginationDBParams.interface';
import { IPaginatedModelResponse } from '../../contracts/interfaces/paginatedModelResponse.interface';
import { PropertySearchDto } from '@/properties/property.dto';

@Injectable()
export class PropertyMasterRepository extends PostgresRepository<PropertyMasterModel> {
  constructor(dataSource: DataSource) {
    super(PropertyMasterModel, dataSource);
  }

  public async getProperties(
    ownerId: number,
    franchiseId: number,
    queryParams: PropertySearchDto,
    params: IPaginationDBParams | null,
    startTime: number = 0,
  ): Promise<IPaginatedModelResponse<PropertyMasterModel>> {
    const query = this.repository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.propertyCleaningDetail', 'cleaningDetail')
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('property.membershipTier', 'membershipTier')
      .leftJoinAndSelect('property.propertyLocation', 'propertyLocation')
      .leftJoinAndSelect(
        'property.propertyPaymentMethod',
        'propertyPaymentMethod',
        'propertyPaymentMethod.is_deleted = :isDeleted',
        { isDeleted: false },
      )
      .leftJoinAndSelect(
        'property.propertyMaintenanceDetail',
        'maintenanceDetail',
      )
      .where('property.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('property.franchise_id = :franchiseId', { franchiseId });

    if (ownerId) query.andWhere('property.owner_id = :ownerId', { ownerId });

    if (queryParams?.title) {
      query.andWhere(
        '((property.property_nick_name ILIKE :title) OR (property.address ILIKE :title))',
        {
          title: `%${queryParams?.title}%`,
        },
      );
    }

    if (queryParams?.membership_tier) {
      query.andWhere(`membershipTier.membership_type = :membership_tier`, {
        membership_tier: queryParams?.membership_tier,
      });
    }

    if (queryParams?.service_area) {
      query.andWhere(`property.city = :service_area`, {
        service_area: queryParams?.service_area,
      });
    }

    if (!params || queryParams?.off_program !== undefined) {
      query.andWhere('property.off_program = :offProgram', {
        offProgram: queryParams?.off_program || false,
      });
    }

    if (params && !queryParams?.download)
      query.skip(params.offset).take(params.limit);

    if (queryParams?.download && startTime) {
      query.andWhere('property.created_at >= :startTime', {
        startTime,
      });
    }

    if (params?.sort_order && params?.sort_by) {
      if (params.sort_by === 'owner_name') {
        query.orderBy(
          'owner.first_name',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'first_name') {
        query.orderBy(
          'owner.first_name',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'last_name') {
        query.orderBy(
          'owner.last_name',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'address') {
        query.orderBy(
          'property.address',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'property_nick_name') {
        query.orderBy(
          'property.property_nick_name',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'off_program') {
        query.orderBy(
          'property.off_program',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'city') {
        query.orderBy(
          'propertyLocation.service_area',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'state') {
        query.orderBy(
          'property.state',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'zip') {
        query.orderBy(
          'property.zip',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'property_membership_status') {
        query.orderBy(
          'membershipTier.membership_type',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'membership_charge') {
        query.orderBy(
          'membershipTier.price',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'next_due_date') {
        query.orderBy(
          'membershipTier.next_due_date',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'number_of_bedrooms') {
        query.orderBy(
          'cleaningDetail.number_of_bedrooms',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'number_of_baths') {
        query.orderBy(
          'cleaningDetail.number_of_baths',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else {
        query.orderBy(
          `property.${params.sort_by}`,
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      }
    } else if (queryParams?.payment_methods) {
      query.orderBy('property.owner_payment_method_id', 'ASC', 'NULLS LAST');
    } else {
      query.orderBy('property.id', 'DESC');
    }

    const [data, count] = await query.getManyAndCount();

    return { data, count };
  }

  public async getPropertiesPaymentMethods(
    ownerId: number,
    franchiseId: number,
  ): Promise<PropertyMasterModel[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('property')
      .where('property.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('property.franchise_id = :franchiseId', { franchiseId })
      .andWhere('property.owner_id = :ownerId', { ownerId })
      .andWhere('property.owner_payment_method_id IS NOT NULL')
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect(
        'property.propertyPaymentMethod',
        'propertyPaymentMethod',
      );

    const records = await queryBuilder.getMany();
    return records;
  }
}
