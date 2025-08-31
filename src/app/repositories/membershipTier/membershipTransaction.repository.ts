import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { MemberShipTransactionModel } from '@/app/models/membership/membershipTransaction.model';
import { GetMembershipTransactionDto } from '@/payment/payment.dto';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';

@Injectable()
export class MembershipTransactionRepository extends PostgresRepository<MemberShipTransactionModel> {
  constructor(dataSource: DataSource) {
    super(MemberShipTransactionModel, dataSource);
  }

  async getMembershipTransaction(
    paginationParams: IPaginationDBParams,
    query: GetMembershipTransactionDto,
  ) {
    const [data, count] = await this.repository
      .createQueryBuilder('membership_transactions')
      .leftJoinAndSelect(
        'membership_transactions.propertyMaster',
        'propertyMaster',
      )
      .leftJoinAndSelect(
        'membership_transactions.membershipTier',
        'membershipTier',
      )
      .andWhere(
        'membership_transactions.property_master_id = :property_master_id',
        {
          property_master_id: query.property_master_id,
        },
      )
      .skip(paginationParams.offset)
      .take(paginationParams.limit)
      .orderBy('membership_transactions.id', 'DESC')
      .getManyAndCount();

    return { data, count };
  }
}
