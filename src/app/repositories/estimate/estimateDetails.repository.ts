import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { EstimateDetailModel } from '@/app/models/estimate/estimateDetail.model';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { EstimateQueryDto } from '@/estimate/estimate.dto';
import { IQuotedEstimateRequestParams } from '@/app/contracts/interfaces/estimate.interface';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';

@Injectable()
export class EstimateDetailsRepository extends PostgresRepository<EstimateDetailModel> {
  constructor(dataSource: DataSource) {
    super(EstimateDetailModel, dataSource);
  }

  public async getQuotedEstimates(
    params: IPaginationDBParams,
    query: EstimateQueryDto,
    estimateParams?: IQuotedEstimateRequestParams,
  ): Promise<IPaginatedModelResponse<EstimateDetailModel>> {
    const { offset, limit } = params;
    const { start_date, end_date } = query;
    const { vendor_id, estimate_master_id, is_send_to_owner } =
      estimateParams || {};

    const queryBuilder = this.repository
      .createQueryBuilder('estimate_details')
      .where('estimate_details.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('estimate_details.is_grand_total = :is_grand_total', {
        is_grand_total: true,
      })
      .skip(offset)
      .take(limit)
      .leftJoinAndSelect('estimate_details.estimateMaster', 'estimate_masters')
      .leftJoinAndSelect('estimate_masters.propertyMaster', 'property')
      .leftJoinAndSelect('estimate_masters.serviceType', 'serviceType')
      .leftJoinAndSelect('estimate_details.estimateVendor', 'user');

    if (start_date) {
      queryBuilder.andWhere('estimate_masters.start_date = :start_date', {
        start_date,
      });
    }

    if (end_date) {
      queryBuilder.andWhere('estimate_masters.start_date <= :end_date', {
        end_date,
      });
    }

    if (vendor_id) {
      queryBuilder.andWhere('estimate_details.vendor_id = :vendor_id', {
        vendor_id,
      });
      queryBuilder.andWhere(
        'estimate_details.franchise_admin_id IS NULL AND estimate_details.is_estimate_approved = :is_estimate_approved',
        {
          is_estimate_approved: false,
        },
      );
    }

    if (estimate_master_id !== undefined) {
      queryBuilder.andWhere(
        'estimate_details.estimate_master_id = :estimate_master_id',
        {
          estimate_master_id,
        },
      );
    }

    if (is_send_to_owner !== undefined) {
      queryBuilder.andWhere(
        'estimate_details.is_send_to_owner = :is_send_to_owner',
        {
          is_send_to_owner,
        },
      );
    }

    const selectCols = [
      'estimate_masters.id',
      'estimate_masters.start_date',
      'estimate_masters.status',
      'serviceType.id',
      'serviceType.title',
      'property.id',
      'property.property_nick_name',
      'property.address',
      'estimate_details.id',
      'estimate_details.line_item',
      'estimate_details.price',
      'estimate_details.is_estimate_approved',
      'estimate_details.is_grand_total',
      'estimate_details.estimate_master_id',
      'user.id',
      'user.first_name',
      'user.last_name',
    ];

    queryBuilder.select(selectCols);

    const [data, count] = await queryBuilder.getManyAndCount();

    return { data, count };
  }

  public async getEstimateQuotationsCountForRejections(
    estimate_master_id: number,
  ): Promise<number> {
    return await this.repository
      .createQueryBuilder('estimate_details')
      .where('estimate_details.estimate_master_id = :estimate_master_id', {
        estimate_master_id,
      })
      .andWhere('estimate_details.is_grand_total = true')
      .andWhere('estimate_details.franchise_admin_id IS NOT NULL')
      .andWhere('estimate_details.is_send_to_owner = true')
      .getCount();
  }
}
