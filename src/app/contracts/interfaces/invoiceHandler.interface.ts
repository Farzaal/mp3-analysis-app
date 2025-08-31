import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { CreateInvoiceLineItemDto } from '@/invoice/invoice.dto';
import { QueryRunner } from 'typeorm';
import { JwtPayload } from '../types/jwtPayload.type';
import { InvoiceHandlerResponse } from '../types/invoice.types';

export interface InvoiceHandler {
  initInvoice(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    lineItems: CreateInvoiceLineItemDto[],
    user?: JwtPayload,
    serviceRequestNote?: string | null,
  ): Promise<InvoiceHandlerResponse>;
}
