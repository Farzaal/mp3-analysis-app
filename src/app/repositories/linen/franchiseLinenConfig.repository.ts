import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { FranchiseLinenConfigModel } from '../../models/linen/franchiseLinenConfig.model';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { LinenType } from '@/app/contracts/enums/linenType.enum';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';

@Injectable()
export class FranchiseLinenConfigRepository extends PostgresRepository<FranchiseLinenConfigModel> {
  constructor(dataSource: DataSource) {
    super(FranchiseLinenConfigModel, dataSource);
  }

  public async getAllLinenConfigs(
    params: IPaginationDBParams,
    type: LinenType,
    franchise_id: number,
  ): Promise<IPaginatedModelResponse<FranchiseLinenConfigModel>> {
    const { offset, limit } = params;

    const queryBuilder = this.repository
      .createQueryBuilder('franchise_linen_configs')
      .where('franchise_linen_configs.type = :type', {
        type,
      })
      .andWhere('franchise_linen_configs.franchise_id = :franchise_id', {
        franchise_id,
      })
      .andWhere('franchise_linen_configs.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .skip(offset)
      .take(limit);

    if (params?.sort_order && params?.sort_by) {
      queryBuilder.orderBy(
        params.sort_by,
        params.sort_order === 'asc' ? 'ASC' : 'DESC',
      );
    }

    const [data, count] = await queryBuilder.getManyAndCount();
    return { data, count };
  }
}
