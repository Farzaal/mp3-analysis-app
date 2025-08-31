import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { EstimateDetailRejectionModel } from '@/app/models/estimate/estimateDetailRejection.model';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { EstimateMasterModel } from '@/app/models/estimate/estimateMaster.model';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { EstimateQueryDto } from '@/estimate/estimate.dto';

@Injectable()
export class EstimateDetailRejectionRepository extends PostgresRepository<EstimateDetailRejectionModel> {
  constructor(dataSource: DataSource) {
    super(EstimateDetailRejectionModel, dataSource);
  }

  public async getRejectedQuotations(
    params: IPaginationDBParams,
    user: JwtPayload,
    query: EstimateQueryDto,
  ): Promise<IPaginatedModelResponse<EstimateMasterModel>> {
    const { offset, limit } = params;
    const { start_date, end_date, property_master_id, service_type_id } = query;
    const { franchise_id } = user;

    const queryBuilder = this.repository
      .createQueryBuilder('estimate_detail_rejections')
      .leftJoin(
        'estimate_detail_rejections.estimateMasterRejection',
        'estimateMaster',
      )
      .leftJoin('estimate_detail_rejections.estimateVendorRejection', 'vendor')
      .where('estimateMaster.franchise_id = :franchise_id', {
        franchise_id: Number(franchise_id),
      })
      .leftJoin('estimateMaster.propertyMaster', 'property')
      .leftJoin('estimateMaster.serviceType', 'serviceType')
      .andWhere('estimate_detail_rejections.is_deleted = false')
      .andWhere('estimate_detail_rejections.is_send_to_owner = true')
      .andWhere('estimate_detail_rejections.is_grand_total = true');

    if (start_date) {
      queryBuilder.andWhere('estimateMaster.start_date >= :start_date', {
        start_date,
      });
    }

    if (end_date) {
      queryBuilder.andWhere('estimateMaster.start_date <= :end_date', {
        end_date,
      });
    }

    if (property_master_id) {
      queryBuilder.andWhere(
        'estimateMaster.property_master_id = :property_master_id',
        { property_master_id },
      );
    }

    if (service_type_id) {
      queryBuilder.andWhere(
        'estimateMaster.service_type_id = :service_type_id',
        { service_type_id },
      );
    }

    queryBuilder.select([
      'estimateMaster.id AS estimate_master_id',
      'estimateMaster.vendor_id AS vendor_id',
      'estimateMaster.start_date AS start_date',
      'estimateMaster.status AS status',
      'estimateMaster.estimate_distribution_type AS estimate_distribution_type',
      'property.id AS property_id',
      'property.property_nick_name AS property_nick_name',
      'property.address AS property_address',
      'serviceType.id AS service_type_id',
      'serviceType.title AS service_type_title',
      'estimate_detail_rejections.id AS estimate_detail_id',
      'estimate_detail_rejections.line_item AS line_item',
      'estimate_detail_rejections.price AS price',
      'estimate_detail_rejections.is_estimate_approved AS is_estimate_approved',
      'estimate_detail_rejections.is_grand_total AS is_grand_total',
      'estimate_detail_rejections.is_send_to_owner AS is_send_to_owner',
      'vendor.id AS vendor_id',
      'vendor.first_name AS vendor_first_name',
      'vendor.last_name AS vendor_last_name',
    ]);

    queryBuilder.orderBy('estimate_detail_rejections.id', 'DESC');

    const totalCount = await queryBuilder.getCount();

    // queryBuilder.skip(offset).take(limit);
    queryBuilder.offset(offset).limit(limit);

    const rawData = await queryBuilder.getRawMany();

    return {
      data: rawData,
      count: totalCount,
    };
  }

  public async getRejectedQuotationById(
    estimate_master_id: number,
    vendor_id: number,
  ): Promise<EstimateDetailRejectionModel[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('estimate_detail_rejections')
      .where('estimate_detail_rejections.is_deleted = false')
      .andWhere('estimate_detail_rejections.is_send_to_owner = true')
      .andWhere(
        'estimate_detail_rejections.estimateMasterRejection = :estimate_master_id',
        {
          estimate_master_id,
        },
      )
      .andWhere('estimate_detail_rejections.vendor_id = :vendor_id', {
        vendor_id,
      })
      .leftJoinAndSelect(
        'estimate_detail_rejections.estimateVendorRejection',
        'vendor',
      )
      .leftJoinAndSelect(
        'estimate_detail_rejections.estimateMasterRejection',
        'estimateMaster',
      )
      .leftJoinAndSelect('estimateMaster.propertyMaster', 'property')
      .leftJoinAndSelect('estimateMaster.serviceType', 'serviceType')
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      )
      .leftJoinAndSelect(
        'estimateMaster.estimateDescription',
        'rejection_description',
        'rejection_description.is_estimate_reject_description = true AND rejection_description.estimate_master_id = :estimate_master_id AND rejection_description.vendor_id = :vendor_id',
        { estimate_master_id, vendor_id },
      );

    return queryBuilder.getMany();
  }
}
