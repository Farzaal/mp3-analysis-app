import { Injectable } from '@nestjs/common';
import { FranchiseModel } from '../../models/franchise/franchise.model';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { IPaginationDBParams } from '../../contracts/interfaces/paginationDBParams.interface';
import { IPaginatedModelResponse } from '../../contracts/interfaces/paginatedModelResponse.interface';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { DocumentVisibility } from '@/app/contracts/enums/document.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';

@Injectable()
export class FranchiseRepository extends PostgresRepository<FranchiseModel> {
  constructor(dataSource: DataSource) {
    super(FranchiseModel, dataSource);
  }

  public async getAllFranchise(
    params: IPaginationDBParams,
    name?: string,
  ): Promise<IPaginatedModelResponse<FranchiseModel>> {
    const { offset, limit } = params;

    const queryBuilder = this.repository
      .createQueryBuilder('franchises')
      .leftJoinAndSelect(
        'franchises.user',
        'user',
        'user.user_type = :userType',
        { userType: UserType.FranchiseAdmin },
      )
      .leftJoinAndSelect(
        'franchises.franchiseServiceLocation',
        'serviceLocation',
      )
      .where('franchises.is_deleted = :isDeleted', { isDeleted: false })
      .skip(offset)
      .take(limit);

    if (name) {
      queryBuilder.where('LOWER(franchises.name) ILIKE :name', {
        name: `%${name.toLowerCase()}%`,
      });
    }

    if (params?.sort_order && params?.sort_by) {
      queryBuilder.orderBy(
        `franchises.${params.sort_by}`,
        params.sort_order === 'asc' ? 'ASC' : 'DESC',
      );
    } else {
      queryBuilder.orderBy('franchises.id', 'DESC');
    }

    const [data, count] = await queryBuilder.getManyAndCount();
    return { data, count };
  }

  public async getFranchiseDetails(
    id: number,
    user?: JwtPayload,
  ): Promise<FranchiseModel> {
    const queryBuilder = await this.repository
      .createQueryBuilder('franchise')
      .leftJoinAndSelect(
        'franchise.franchiseServiceLocation',
        'serviceLocation',
      )
      .leftJoinAndSelect(
        'franchise.user',
        'user',
        'user.user_type = :userType',
        { userType: UserType.FranchiseAdmin },
      )
      .where('franchise.id = :id', { id: Number(id) })
      .andWhere('franchise.is_deleted = false');

    const dataSelect = [
      'franchise.id',
      'franchise.name',
      'franchise.location',
      'franchise.site_url',
      'serviceLocation',
      'user.id',
      'user.first_name',
      'user.last_name',
      'user.email',
      'user.contact',
      'user.franchise_id',
      'franchise.stripe_public_key',
      'franchise.stripe_secret_key',
      'franchise.twilio_sid',
      'franchise.twilio_token',
      'franchise.twilio_from_number',
      'franchise.twilio_your_cell_number',
      'franchise.google_review_number',
      'franchise.facebook_review_link',
      'franchise.royalty_percentage',
      'franchise.credit_card_processing_fee',
      'franchise.stripe_verified',
      'franchise.twilio_verified',
    ];
    if (user?.user_type === UserType.SuperAdmin) {
      queryBuilder.leftJoinAndSelect(
        'franchise.document',
        'document',
        'document.visibility = :visibility AND document.user_id = :userId AND document.franchise_id = :franchiseId',
        {
          visibility: DocumentVisibility.ShowToAdmin,
          userId: user.id,
          franchiseId: Number(id),
        },
      );

      dataSelect.push('document.id', 'document.name', 'document.document_url');
    }

    return queryBuilder.select(dataSelect).getOne();
  }
}
