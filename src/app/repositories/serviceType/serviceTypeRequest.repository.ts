import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceTypeRequestModel } from '@/app/models/serviceType/serviceTypeRequest.model';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { ServiceTypeRequestStatus } from '@/app/contracts/enums/serviceTypeRequest.enum';

@Injectable()
export class ServiceTypeRequestRepository extends PostgresRepository<ServiceTypeRequestModel> {
  constructor(dataSource: DataSource) {
    super(ServiceTypeRequestModel, dataSource);
  }

  public async getServiceTypeRequest(
    params: IPaginationDBParams,
  ): Promise<IPaginatedModelResponse<ServiceTypeRequestModel>> {
    const { offset, limit } = params;

    const [data, count] = await this.repository
      .createQueryBuilder('service_type_requests')
      .where('service_type_requests.status = :status', {
        status: ServiceTypeRequestStatus.PendingApproval,
      })
      .leftJoinAndSelect(
        'service_type_requests.serviceTypeRequestedBy',
        'serviceTypeRequestedBy',
      )
      .leftJoinAndSelect(
        'serviceTypeRequestedBy.franchiseUser',
        'franchiseUser',
      )
      .leftJoinAndSelect(
        'service_type_requests.serviceTypeRequestedCat',
        'serviceTypeRequestedCat',
      )
      .select([
        'service_type_requests.id',
        'service_type_requests.service_type_category_title',
        'service_type_requests.service_type_title',
        'service_type_requests.service_type_category_id',
        'service_type_requests.is_linen',
        'service_type_requests.is_recurring',
        'service_type_requests.status',
        'serviceTypeRequestedBy.id',
        'serviceTypeRequestedBy.user_type',
        'serviceTypeRequestedBy.first_name',
        'serviceTypeRequestedBy.last_name',
        'serviceTypeRequestedBy.email',
        'serviceTypeRequestedBy.contact',
        'serviceTypeRequestedBy.city',
        'serviceTypeRequestedBy.state',
        'franchiseUser',
        'serviceTypeRequestedCat.id',
        'serviceTypeRequestedCat.title',
      ])
      .skip(offset)
      .take(limit)
      .orderBy('service_type_requests.id', 'DESC')
      .getManyAndCount();

    return { data, count };
  }
}
