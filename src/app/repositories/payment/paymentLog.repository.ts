import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { PaymentLogModel } from '@/app/models/payment/paymentLog.model';

@Injectable()
export class PaymentLogRepository extends PostgresRepository<PaymentLogModel> {
  constructor(dataSource: DataSource) {
    super(PaymentLogModel, dataSource);
  }

  async getLatestServiceRequestPaymentLog(
    serviceRequestId: number,
  ): Promise<PaymentLogModel> {
    return await this.repository
      .createQueryBuilder('payment_logs')
      .where('payment_logs.service_request_master_id = :serviceRequestId', {
        serviceRequestId,
      })
      .orderBy('payment_logs.id', 'DESC')
      .getOne();
  }
}
