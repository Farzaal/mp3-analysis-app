import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceTypeCategoryModel } from '@/app/models/serviceType/serviceTypeCategory.model';
import { GetServiceTypeDto } from '@/serviceType/serviceType.dto';

@Injectable()
export class ServiceTypeCategoryRepository extends PostgresRepository<ServiceTypeCategoryModel> {
  constructor(dataSource: DataSource) {
    super(ServiceTypeCategoryModel, dataSource);
  }

  async getServiceTypes(
    franchiseId: number | null = null,
    query: GetServiceTypeDto | null,
    activeOnly: boolean = false,
  ): Promise<ServiceTypeCategoryModel[]> {
    const serviceTypeData = this.repository
      .createQueryBuilder('service_type_categories')
      .leftJoinAndSelect(
        'service_type_categories.serviceType',
        'serviceType',
        'serviceType.is_deleted = :serviceTypeDeleted AND serviceType.is_guest_concierge = :isGuestConcierge',
        { serviceTypeDeleted: false, isGuestConcierge: false },
      )
      .where('service_type_categories.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere(
        'service_type_categories.is_guest_concierge = :isGuestConcierge',
        {
          isGuestConcierge: false,
        },
      )
      .andWhere(
        '(serviceType.id IS NULL OR serviceType.is_guest_concierge = :isGuestConcierge)',
        {
          isGuestConcierge: false,
        },
      );

    if (query?.service_type_category_id) {
      serviceTypeData.andWhere(
        'service_type_categories.id = :service_type_category_id',
        {
          service_type_category_id: query.service_type_category_id,
        },
      );
    }

    if (query?.service_type_title) {
      serviceTypeData.andWhere('serviceType.title ILIKE :service_type_title', {
        service_type_title: `%${query.service_type_title}%`,
      });
    }

    if (query?.show_linen !== undefined) {
      serviceTypeData.andWhere('service_type_categories.is_linen = :isLinen', {
        isLinen: false,
      });
      serviceTypeData.andWhere('serviceType.is_linen = :isLinen', {
        isLinen: false,
      });
    }

    if (query?.show_handyman_concierge !== undefined) {
      serviceTypeData.andWhere(
        'service_type_categories.is_handyman_concierge = :isHandymanConcierge',
        {
          isHandymanConcierge: query.show_handyman_concierge,
        },
      );
      serviceTypeData.andWhere(
        'serviceType.is_handyman_concierge = :isHandymanConcierge',
        {
          isHandymanConcierge: query.show_handyman_concierge,
        },
      );
    }

    if (query?.show_standard_hourly !== undefined) {
      serviceTypeData.andWhere(
        'service_type_categories.standard_hourly = :isStandardHourly',
        {
          isStandardHourly: query.show_standard_hourly,
        },
      );
      serviceTypeData.andWhere(
        'serviceType.standard_hourly = :isStandardHourly',
        {
          isStandardHourly: query.show_standard_hourly,
        },
      );
    }

    if (franchiseId) {
      let franchiseServiceTypeCondition =
        'franchiseServiceType.is_deleted = :serviceTypeDeleted AND franchiseServiceType.franchise_id = :franchiseId AND franchiseServiceType.is_guest_concierge = :isGuestConcierge';
      let franchiseServiceTypeCatCondition =
        'serviceTypeCat.is_deleted = :serviceTypeDeleted AND serviceTypeCat.franchise_id = :franchiseId AND serviceTypeCat.is_guest_concierge = :isGuestConcierge';
      const sericeTypeFilter: Record<string, boolean | number> = {
        serviceTypeDeleted: false,
        franchiseId,
        isGuestConcierge: false,
      };
      if (activeOnly) {
        sericeTypeFilter.serviceTypeActive = true;
        franchiseServiceTypeCondition +=
          ' AND franchiseServiceType.is_active = :serviceTypeActive';
        franchiseServiceTypeCatCondition +=
          ' AND serviceTypeCat.is_active = :serviceTypeActive';
      }
      serviceTypeData
        .leftJoinAndSelect(
          'serviceType.franchiseServiceType',
          'franchiseServiceType',
          franchiseServiceTypeCondition,
          sericeTypeFilter,
        )
        .leftJoinAndSelect(
          'service_type_categories.serviceTypeCat',
          'serviceTypeCat',
          franchiseServiceTypeCatCondition,
          sericeTypeFilter,
        )
        .andWhere(
          '(serviceTypeCat.franchise_id = :franchiseId OR serviceTypeCat.id IS NULL)',
          { franchiseId },
        );
      // .andWhere('serviceTypeCat.franchise_id = :franchiseId', {
      //   franchiseId,
      // })
      // .andWhere('franchiseServiceType.franchise_id = :franchiseId', {
      //   franchiseId,
      // });
    }

    let selectCols = [
      'service_type_categories.id',
      'service_type_categories.title',
      'service_type_categories.is_linen',
      'service_type_categories.is_handyman_concierge',
      'service_type_categories.standard_hourly',
      'serviceType.id',
      'serviceType.title',
      'serviceType.is_linen',
      'serviceType.is_recurring',
      'serviceType.is_handyman_concierge',
      'serviceType.standard_hourly',
    ];

    if (franchiseId)
      selectCols = [
        'serviceTypeCat.id',
        'serviceTypeCat.is_active',
        'serviceTypeCat.service_type_category_id',
        'franchiseServiceType.id',
        'franchiseServiceType.service_type_id',
        'franchiseServiceType.is_active',
        'franchiseServiceType.turn_over',
        'franchiseServiceType.allow_recurring_request',
        'franchiseServiceType.hourly_rate',
        'franchiseServiceType.service_call_fee',
        ...selectCols,
      ];

    serviceTypeData.select(selectCols);

    return await serviceTypeData
      .orderBy('service_type_categories.id', 'DESC')
      .getMany();
  }

  async getGuestConcierge(
    franchiseId: number | null = null,
    query: GetServiceTypeDto | null,
    activeOnly: boolean = false,
  ): Promise<ServiceTypeCategoryModel[]> {
    const serviceTypeData = this.repository
      .createQueryBuilder('service_type_categories')
      .leftJoinAndSelect(
        'service_type_categories.serviceType',
        'serviceType',
        'serviceType.is_deleted = :serviceTypeDeleted AND serviceType.is_guest_concierge = :isGuestConcierge',
        { serviceTypeDeleted: false, isGuestConcierge: true },
      )
      .where('service_type_categories.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere(
        'service_type_categories.is_guest_concierge = :isGuestConcierge',
        {
          isGuestConcierge: true,
        },
      );

    if (query?.service_type_category_id) {
      serviceTypeData.andWhere(
        'service_type_categories.id = :service_type_category_id',
        {
          service_type_category_id: query.service_type_category_id,
        },
      );
    }

    if (query?.service_type_title) {
      serviceTypeData.andWhere('serviceType.title ILIKE :service_type_title', {
        service_type_title: `%${query.service_type_title}%`,
      });
    }

    if (franchiseId) {
      let franchiseServiceTypeCondition =
        'franchiseServiceType.is_deleted = :serviceTypeDeleted AND franchiseServiceType.franchise_id = :franchiseId AND franchiseServiceType.is_guest_concierge = :isGuestConcierge';
      let franchiseServiceTypeCatCondition =
        'serviceTypeCat.is_deleted = :serviceTypeDeleted AND serviceTypeCat.franchise_id = :franchiseId AND serviceTypeCat.is_guest_concierge = :isGuestConcierge';
      const sericeTypeFilter: Record<string, boolean | number> = {
        serviceTypeDeleted: false,
        franchiseId,
        isGuestConcierge: true,
      };
      if (activeOnly) {
        sericeTypeFilter.serviceTypeActive = true;
        franchiseServiceTypeCondition +=
          ' AND franchiseServiceType.is_active = :serviceTypeActive';
        franchiseServiceTypeCatCondition +=
          ' AND serviceTypeCat.is_active = :serviceTypeActive';
      }
      serviceTypeData
        .leftJoinAndSelect(
          'serviceType.franchiseServiceType',
          'franchiseServiceType',
          franchiseServiceTypeCondition,
          sericeTypeFilter,
        )
        .leftJoinAndSelect(
          'service_type_categories.serviceTypeCat',
          'serviceTypeCat',
          franchiseServiceTypeCatCondition,
          sericeTypeFilter,
        )
        .andWhere(
          '(serviceTypeCat.franchise_id = :franchiseId OR serviceTypeCat.id IS NULL)',
          { franchiseId },
        );
    }

    let selectCols = [
      'service_type_categories.id',
      'service_type_categories.title',
      'service_type_categories.description',
      'service_type_categories.is_linen',
      'serviceType.id',
      'serviceType.title',
      'serviceType.is_linen',
      'serviceType.is_recurring',
    ];

    if (franchiseId)
      selectCols = [
        'serviceTypeCat.id',
        'serviceTypeCat.is_active',
        'serviceTypeCat.service_type_category_id',
        'serviceTypeCat.slug',
        'serviceTypeCat.image_url',
        'franchiseServiceType.id',
        'franchiseServiceType.service_type_id',
        'franchiseServiceType.is_active',
        'franchiseServiceType.slug',
        'franchiseServiceType.turn_over',
        'franchiseServiceType.allow_recurring_request',
        'franchiseServiceType.description',
        'franchiseServiceType.guest_price',
        'franchiseServiceType.vendor_rate',
        'franchiseServiceType.associated_service_type_id',
        ...selectCols,
      ];

    serviceTypeData.select(selectCols);

    return await serviceTypeData
      .orderBy('service_type_categories.id', 'DESC')
      .getMany();
  }

  async getAllCategoriesForFormBuilder(): Promise<ServiceTypeCategoryModel[]> {
    const serviceTypeData = this.repository
      .createQueryBuilder('service_type_categories')
      .where('service_type_categories.is_deleted = :isDeleted', {
        isDeleted: false,
      });

    const selectCols = [
      'service_type_categories.id',
      'service_type_categories.title',
    ];
    serviceTypeData.select(selectCols);
    return await serviceTypeData.getMany();
  }
}
