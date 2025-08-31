import { LineItemDto } from '@/estimate/estimate.dto';
import { EstimateStatus } from '../enums/estimate.enum';
import { QueryRunner } from 'typeorm';

export interface IEstimateRequestParams {
  vendor_id?: number;
  status?: EstimateStatus;
  owner_id?: number;
  estimate_details?: boolean;
  is_send_to_owner?: boolean;
  vendor_assigned_job?: boolean;
}

export interface IQuotedEstimateRequestParams {
  vendor_id?: number;
  estimate_master_id?: number;
  is_send_to_owner?: boolean;
  is_grand_total?: boolean;
}

export interface IAddEstimateDetailsParams {
  vendor_id: number;
  franchise_admin_id?: number;
  items: LineItemDto[];
  estimate_master_id: number;
  estimateTotal: number;
  is_send_to_owner?: boolean;
  queryRunner: QueryRunner;
}
