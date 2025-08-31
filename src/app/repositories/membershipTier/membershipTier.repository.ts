import { Injectable } from '@nestjs/common';
import { MemberShipTierModel } from '@/app/models/membership/membershipTier.model';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class MembershipTierRepository extends PostgresRepository<MemberShipTierModel> {
  constructor(dataSource: DataSource) {
    super(MemberShipTierModel, dataSource);
  }
}
