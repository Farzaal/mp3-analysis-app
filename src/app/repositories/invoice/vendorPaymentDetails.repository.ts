import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { VendorPaymentDetailsModel } from '@/app/models/invoice/vendorPaymentDetails.model';

@Injectable()
export class VendorPaymentDetailsRepository extends PostgresRepository<VendorPaymentDetailsModel> {
  constructor(dataSource: DataSource) {
    super(VendorPaymentDetailsModel, dataSource);
  }
}
