import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceTypeModel } from '@/app/models/serviceType/serviceType.model';
import {
  GetGuestConciergeServiceDto,
  GetGuestServiceTypeDto,
} from '@/serviceType/serviceType.dto';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { ServiceTypeCategoryModel } from '@/app/models/serviceType/serviceTypeCategory.model';

@Injectable()
export class ServiceTypeRepository extends PostgresRepository<ServiceTypeModel> {
  constructor(dataSource: DataSource) {
    super(ServiceTypeModel, dataSource);
  }

  async getFranchiseSerivceTypes(
    franchiseId: number,
    query?: GetGuestServiceTypeDto,
  ): Promise<ServiceTypeModel[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('service_types')
      .innerJoinAndSelect(
        'service_types.franchiseServiceType',
        'franchiseServiceType',
        'franchiseServiceType.franchise_id = :franchiseId',
        {
          franchiseId,
        },
      )
      .where('service_types.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('franchiseServiceType.is_active = :isActive', {
        isActive: true,
      });

    if (query?.is_guest_concierge) {
      queryBuilder
        .where('service_types.is_guest_concierge = :is_guest_concierge', {
          is_guest_concierge: query.is_guest_concierge,
        })
        .andWhere(
          'franchiseServiceType.is_guest_concierge = :is_guest_concierge',
          {
            is_guest_concierge: query.is_guest_concierge,
          },
        );
    }
    if (query?.available_to_guest) {
      queryBuilder.andWhere(
        'franchiseServiceType.available_to_guest = :available_to_guest',
        {
          available_to_guest: query.available_to_guest,
        },
      );
    }
    if (query?.is_active) {
      queryBuilder.andWhere('franchiseServiceType.is_active = :is_active', {
        is_active: query.is_active,
      });
    }
    queryBuilder.select([
      'service_types.id',
      'service_types.title',
      'service_types.service_type_category_id',
      'franchiseServiceType.id',
      'franchiseServiceType.is_active',
    ]);

    return await queryBuilder.getMany();
  }

  async getGuestConciergeCategories(
    franchiseId: number,
    params: IPaginationDBParams,
  ): Promise<IPaginatedModelResponse<ServiceTypeCategoryModel>> {
    const rawQuery = `
      SELECT 
        STC.ID AS CATEGORY_ID,
        STC.TITLE AS TITLE,
        STC.DESCRIPTION AS DESCRIPTION,
        FSTC.ID AS FRANCHISE_CATEGORY_ID,
        FSTC.IMAGE_URL,
        FSTC.SLUG,
        FSTC.IS_ACTIVE
      FROM SERVICE_TYPE_CATEGORIES STC
      INNER JOIN FRANCHISE_SERVICE_TYPE_CATEGORIES FSTC 
        ON STC.ID = FSTC.SERVICE_TYPE_CATEGORY_ID
      WHERE FSTC.FRANCHISE_ID = ${franchiseId} 
        AND STC.IS_GUEST_CONCIERGE = TRUE 
        AND FSTC.IS_GUEST_CONCIERGE = TRUE
        AND STC.IS_DELETED = FALSE
        AND FSTC.IS_DELETED = FALSE
        AND FSTC.IS_ACTIVE = TRUE
      ORDER BY STC.ID DESC`;

    const countQuery = `SELECT COUNT(*) FROM (${rawQuery}) AS subquery`;

    const data = await this.repository.query(
      `${rawQuery} LIMIT ${params?.limit} OFFSET ${params?.offset}`,
    );
    const [{ count }] = await this.repository.query(countQuery);

    return { data, count: Number(count) };
  }

  async getGuestConciergeServiceTypes(
    query: GetGuestConciergeServiceDto,
    params: IPaginationDBParams,
  ): Promise<IPaginatedModelResponse<ServiceTypeModel>> {
    const rawQuery = `
      SELECT 
        ST.ID AS SERVICE_TYPE_ID,
        ST.TITLE AS TITLE,
        ST.SERVICE_TYPE_CATEGORY_ID,
        FST.ID AS FRANCHISE_SERVICE_TYPE_ID,
        FST.DESCRIPTION,
        FST.GUEST_PRICE,
        FST.SLUG,
        FST.IS_ACTIVE,
        (
          SELECT STI.IMAGE_URL 
          FROM SERVICE_TYPE_IMAGES STI 
          WHERE STI.FRANCHISE_SERVICE_TYPE_ID = FST.ID 
          LIMIT 1
        ) AS IMAGE_URL
      FROM SERVICE_TYPES ST
      INNER JOIN FRANCHISE_SERVICE_TYPES FST 
        ON ST.ID = FST.SERVICE_TYPE_ID
      INNER JOIN FRANCHISE_SERVICE_TYPE_CATEGORIES FSTC 
        ON FST.FRANCHISE_SERVICE_TYPE_CATEGORY_ID = FSTC.ID
      WHERE ${query?.category_id ? `ST.SERVICE_TYPE_CATEGORY_ID = ${query?.category_id}` : `FSTC.SLUG = '${query?.category_slug}'`} 
        AND FSTC.FRANCHISE_ID = ${query?.franchise_id}
        AND ST.IS_GUEST_CONCIERGE = TRUE 
        AND FST.IS_GUEST_CONCIERGE = TRUE
        AND ST.IS_DELETED = FALSE
        AND FST.IS_DELETED = FALSE
        AND FST.IS_ACTIVE = TRUE
      ORDER BY ST.ID DESC`;

    const countQuery = `SELECT COUNT(*) FROM (${rawQuery}) AS subquery`;

    const data = await this.repository.query(
      `${rawQuery} LIMIT ${params?.limit} OFFSET ${params?.offset}`,
    );
    const [{ count }] = await this.repository.query(countQuery);

    return { data, count: Number(count) };
  }

  async getGuestConciergeServiceById(serviceTypeSlug: string): Promise<any> {
    const queryBuilder = this.repository
      .createQueryBuilder('service_types')
      .leftJoinAndSelect(
        'service_types.franchiseServiceType',
        'franchiseServiceType',
      )
      .leftJoinAndSelect(
        'franchiseServiceType.serviceTypeImages',
        'serviceTypeImages',
        'serviceTypeImages.franchise_service_type_id = franchiseServiceType.id',
      )
      .leftJoinAndSelect(
        'franchiseServiceType.associatedServiceType',
        'associatedServiceType',
      )
      .leftJoinAndSelect(
        'service_types.serviceTypeCategory',
        'serviceTypeCategory',
      )
      .leftJoinAndSelect('serviceTypeCategory.serviceTypeCat', 'serviceTypeCat')
      .andWhere('service_types.is_guest_concierge = :isGuestConcierge', {
        isGuestConcierge: true,
      })
      .andWhere('franchiseServiceType.is_guest_concierge = :isGuestConcierge', {
        isGuestConcierge: true,
      })
      .andWhere('service_types.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('franchiseServiceType.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('franchiseServiceType.is_active = :isActive', {
        isActive: true,
      })
      .andWhere('franchiseServiceType.slug = :serviceTypeSlug', {
        serviceTypeSlug: serviceTypeSlug,
      });

    return await queryBuilder.getOne();
  }
}
