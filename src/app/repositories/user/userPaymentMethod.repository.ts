import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { UserPaymentMethodModel } from '@/app/models/paymentMethod/userPaymentMethod.model';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { PaymentMethodStatus } from '@/app/contracts/enums/payment.enum';

@Injectable()
export class UserPaymentMethodRepository extends PostgresRepository<UserPaymentMethodModel> {
  constructor(dataSource: DataSource) {
    super(UserPaymentMethodModel, dataSource);
  }

  async getOwnerPaymentMethods(
    user: JwtPayload,
  ): Promise<UserPaymentMethodModel[]> {
    return await this.repository
      .createQueryBuilder('user_payment_methods')
      .andWhere('user_payment_methods.owner_id = :owner_id', {
        owner_id: user.id,
      })
      .andWhere('user_payment_methods.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('user_payment_methods.status IN (:...statuses)', {
        statuses: [
          PaymentMethodStatus.VerificationPending,
          PaymentMethodStatus.Succeeded,
        ],
      })
      .select([
        'user_payment_methods.id',
        'user_payment_methods.owner_id',
        'user_payment_methods.payment_method_type',
        'user_payment_methods.payment_method_type',
        'user_payment_methods.status',
        'user_payment_methods.payment_method_info',
        'user_payment_methods.is_default',
      ])
      .orderBy('user_payment_methods.id', 'DESC')
      .getMany();
  }
}
