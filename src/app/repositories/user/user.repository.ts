import { Injectable } from '@nestjs/common';
import { UserModel } from '../../models/user/user.model';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { IPaginationDBParams } from '../../contracts/interfaces/paginationDBParams.interface';
import { IPaginatedModelResponse } from '../../contracts/interfaces/paginatedModelResponse.interface';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { OwnerSearchQueryDto } from '@/owner/owner.dto';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import * as moment from 'moment';
@Injectable()
export class UserRepository extends PostgresRepository<UserModel> {
  constructor(dataSource: DataSource) {
    super(UserModel, dataSource);
  }

  public async getVendors(
    params: IPaginationDBParams | null,
    service_type_id?: number,
    franchise_id?: number,
    is_approved?: boolean | undefined | null,
    name?: string | undefined | null,
    insuranceActive?: boolean,
    service_area?: string,
    isDownload: boolean = false,
  ): Promise<IPaginatedModelResponse<UserModel>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .where('user.user_type = :userType', { userType: UserType.Vendor })
      .innerJoinAndSelect('user.franchiseUser', 'franchise');

    if (service_area) {
      queryBuilder.innerJoinAndSelect(
        'user.vendorUserLoc',
        'vendorUserLoc',
        'vendorUserLoc.service_location_id = :service_area',
        { service_area },
      );
    } else {
      queryBuilder.innerJoinAndSelect('user.vendorUserLoc', 'vendorUserLoc');
    }

    queryBuilder.innerJoinAndSelect(
      'vendorUserLoc.vendorServiceLocation',
      'vendorServiceLocation',
    );

    // Join conditionally based on `service_type_id`
    if (service_type_id) {
      queryBuilder.innerJoinAndSelect(
        'user.vendorServiceType',
        'vendorServiceType',
        'vendorServiceType.service_type_id = :service_type_id',
        { service_type_id },
      );
    } else {
      queryBuilder.innerJoinAndSelect(
        'user.vendorServiceType',
        'vendorServiceType',
      );
    }

    queryBuilder
      .innerJoinAndSelect('vendorServiceType.serviceType', 'serviceType')
      .innerJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      );

    if (franchise_id) {
      queryBuilder.andWhere('user.franchise_id = :franchise_id', {
        franchise_id,
      });
    }

    // Filter by name (case-insensitive match for first or last name)
    if (name) {
      queryBuilder.andWhere(
        '(user.first_name ILIKE :name OR user.last_name ILIKE :name)',
        {
          name: `%${name}%`,
        },
      );
    }

    // Filter by is_approved (validate boolean input)
    if (is_approved !== undefined && is_approved !== null) {
      queryBuilder.andWhere('user.is_approved = :is_approved', {
        is_approved,
      });
    }

    if (insuranceActive !== undefined) {
      queryBuilder.andWhere(
        `DATE(user.policy_expire_date) ${insuranceActive ? `<=` : `>=`} :currentDate`,
        {
          currentDate: moment().format('YYYY-MM-DD'),
        },
      );
    }

    // Select only necessary fields
    queryBuilder.select([
      'user.id',
      'user.first_name',
      'user.last_name',
      'user.contact',
      'user.cell_phone',
      'user.office_phone',
      'user.email',
      'user.mailing_address',
      'user.created_at',
      'user.is_approved',
      'user.is_active',
      'vendorServiceType.id',
      'vendorServiceType.service_type_id',
      'vendorServiceType.franchise_id',
      'serviceType.id',
      'serviceType.title',
      'serviceTypeCategory.id',
      'serviceTypeCategory.title',
      'franchise.id',
      'franchise.name',
      'user.policy_number',
      'user.policy_expire_date',
      'vendorUserLoc',
      'vendorServiceLocation',
    ]);

    // Add full_name as a computed field
    queryBuilder.addSelect(
      `CONCAT(user.first_name, ' ', user.last_name)`,
      'full_name',
    );

    // Add insurance_status as a computed field
    queryBuilder.addSelect(
      `CASE 
        WHEN user.policy_number IS NULL 
        OR user.policy_expire_date IS NULL 
        OR user.policy_expire_date < CURRENT_DATE 
        THEN false 
        ELSE true 
      END`,
      'insurance_status',
    );

    if (params && !isDownload)
      queryBuilder.skip(params?.offset).take(params?.limit);

    if (params?.sort_order && params?.sort_by) {
      if (params.sort_by === 'full_name') {
        queryBuilder.orderBy(
          'full_name',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'policy_expire_date') {
        queryBuilder.orderBy(
          'insurance_status',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else if (params.sort_by === 'franchise_name') {
        queryBuilder.orderBy(
          'franchise.name',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else {
        queryBuilder.orderBy(
          `user.${params.sort_by}`,
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      }
    }

    const [data, count] = await queryBuilder.getManyAndCount();

    return { data, count };
  }

  async getVendor(vendorId: number): Promise<UserModel> {
    return await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.vendorServiceType', 'vendorServiceType')
      .leftJoinAndSelect('user.vendorUserLoc', 'vendorUserLoc')
      .leftJoinAndSelect(
        'vendorUserLoc.vendorServiceLocation',
        'vendorServiceLocation',
      )
      .leftJoinAndSelect('vendorServiceType.serviceType', 'serviceType')
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      )
      .where('user.id = :vendorId', { vendorId })
      .getOne();
  }

  public async getOwners(
    params: IPaginationDBParams,
    queryParams: OwnerSearchQueryDto,
    franchise_id?: number,
    startTime: number = 0,
  ): Promise<IPaginatedModelResponse<UserModel>> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .where('user.user_type = :userType', { userType: UserType.Owner });

    if (franchise_id) {
      queryBuilder.andWhere('user.franchise_id = :franchise_id', {
        franchise_id,
      });
    }

    if (queryParams?.description) {
      queryBuilder.andWhere(
        '(LOWER(user.first_name) ILIKE LOWER(:description) OR LOWER(user.last_name) ILIKE LOWER(:description))',
        {
          description: `%${queryParams.description.toLowerCase()}%`,
        },
      );
    }

    if (queryParams?.archived !== undefined) {
      queryBuilder.andWhere('user.archived = :archived', {
        archived: queryParams.archived,
      });
    }

    if (queryParams.download) {
      queryBuilder.andWhere('user.created_at >= :startTime', {
        startTime,
      });
    } else {
      queryBuilder.skip(params.offset).take(params.limit);
    }

    queryBuilder.select([
      'user.id',
      'user.first_name',
      'user.last_name',
      'user.email',
      'user.cell_phone',
      'user.contact',
      'user.profile_completion_step',
      'user.franchise_id',
      'user.city',
      'user.state',
      'user.zip',
      'user.mailing_address',
      'user.archived',
      'user.created_at',
      'user.terms_and_conditions',
    ]);

    if (params?.sort_order && params?.sort_by) {
      queryBuilder.orderBy(
        params.sort_by,
        params.sort_order === 'asc' ? 'ASC' : 'DESC',
      );
    } else {
      queryBuilder.orderBy('user.id', 'DESC');
    }

    const [data, count] = await queryBuilder.getManyAndCount();
    return { data, count };
  }

  async getStandardAdmins(
    params: IPaginationDBParams,
    franchise_id?: number,
    name?: string | undefined | null,
  ): Promise<IPaginatedModelResponse<UserModel>> {
    const { offset, limit } = params;

    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .skip(offset)
      .take(limit)
      .innerJoinAndSelect('user.userMenuItem', 'userMenuItem')
      .where('user.user_type = :userType', {
        userType: UserType.StandardAdmin,
      })
      .andWhere('user.franchise_id = :franchise_id', {
        franchise_id,
      })
      .andWhere('user.is_deleted = :is_deleted', {
        is_deleted: false,
      });

    if (name) {
      queryBuilder.andWhere(
        'user.first_name ILIKE :name OR user.last_name ILIKE :name',
        {
          name: `%${name}%`,
        },
      );
    }
    queryBuilder.select([
      'user.id',
      'user.first_name',
      'user.last_name',
      'user.email',
      'user.franchise_id',
      'userMenuItem.id',
      'userMenuItem.menu_item_permission',
      'userMenuItem.menu_item',
    ]);

    // Add full_name as a computed field
    queryBuilder.addSelect(
      `CONCAT(user.first_name, ' ', user.last_name)`,
      'full_name',
    );

    if (params?.sort_order && params?.sort_by) {
      if (params.sort_by === 'full_name') {
        queryBuilder.orderBy(
          'full_name',
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      } else {
        queryBuilder.orderBy(
          `user.${params.sort_by}`,
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      }
    } else {
      queryBuilder.orderBy('user.id', 'DESC');
    }
    const [data, count] = await queryBuilder.getManyAndCount();
    return { data, count };
  }

  async getOwnerById(ownerId: number, user: JwtPayload): Promise<UserModel> {
    return await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userPaymentMethod', 'userPaymentMethod')
      .leftJoinAndMapOne(
        'user.propertyMaster',
        'user.propertyMaster',
        'propertyMaster',
        'propertyMaster.owner_id = user.id',
      )
      .where('user.id = :ownerId', { ownerId })
      .andWhere('user.franchise_id = :franchiseId', {
        franchiseId: Number(user.franchise_id),
      })
      .select([
        'user.id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.contact',
        'user.user_type',
        'user.mailing_address',
        'user.profile_completion_step',
        'user.franchise_id',
        'user.state',
        'user.zip',
        'user.city',
        'user.terms_and_conditions',
        'userPaymentMethod',
        'propertyMaster',
      ])
      .orderBy('user.id', 'DESC')
      .getOne();
  }

  async getAllVendors(user: JwtPayload): Promise<UserModel[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .where('user.user_type = :userType', { userType: UserType.Vendor })
      .andWhere('user.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('user.is_approved = :isApproved', { isApproved: true })
      .andWhere('user.franchise_id = :franchiseId', {
        franchiseId: Number(user.franchise_id),
      })
      .select(['user.id', 'user.first_name', 'user.last_name'])
      .orderBy('user.id', 'DESC');

    return await queryBuilder.getMany();
  }

  async getUserAndFranchiseAdmin(
    userId: number,
    franchiseId: number,
  ): Promise<UserModel[]> {
    return await this.repository
      .createQueryBuilder('user')
      .where('(user.id = :id OR user.user_type = :userType)', {
        id: userId,
        userType: UserType.FranchiseAdmin,
      })
      .andWhere('user.franchise_id = :franchiseId', { franchiseId })
      .getMany();
  }
}
