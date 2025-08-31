import { PostgresRepository } from '../postgresBase.repository';
import { OwnerPaymentDetailsModel } from '@/app/models/invoice/ownerPaymentDetails.model';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OwnerPaymentDetailsRepository extends PostgresRepository<OwnerPaymentDetailsModel> {
  constructor(dataSource: DataSource) {
    super(OwnerPaymentDetailsModel, dataSource);
  }
}
