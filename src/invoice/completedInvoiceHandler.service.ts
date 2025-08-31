import { BunyanLogger } from '@/app/commons/logger.service';
import { InvoiceHandler } from '@/app/contracts/interfaces/invoiceHandler.interface';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { Injectable } from '@nestjs/common';
import { CreateInvoiceLineItemDto } from './invoice.dto';
import { QueryRunner } from 'typeorm';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { InvoiceHandlerResponse } from '@/app/contracts/types/invoice.types';
import { PreNegotiatedServiceInvoice } from './preNegotiatedServiceInvoice.service';
import { HourlyServiceInvoice } from './hourlyServiceInvoice.service';
@Injectable()
export class CompletedInvoiceHandler implements InvoiceHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly preNegotiatedServiceInvoice: PreNegotiatedServiceInvoice,
    private readonly hourlyServiceInvoice: HourlyServiceInvoice,
  ) {}

  async initInvoice(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    invLineItems: CreateInvoiceLineItemDto[],
    user: JwtPayload,
    serviceRequestNote?: string | null,
  ): Promise<InvoiceHandlerResponse> {
    this.logger.log(
      `CompletedInvoiceHandler - routing to appropriate invoice handler for service request ID: ${serviceRequest.id}`,
    );

    switch (true) {
      case serviceRequest?.serviceType?.standard_hourly === true:
        this.logger.log(
          `Routing to HourlyServiceInvoice - StandardHourly for service request ID: ${serviceRequest.id}`,
        );
        return await this.hourlyServiceInvoice.initInvoice(
          queryRunner,
          serviceRequest,
          invLineItems,
          user,
          serviceRequestNote,
        );
      case serviceRequest?.serviceType?.is_handyman_concierge === true:
        this.logger.log(
          `Routing to HourlyServiceInvoice - HandymanConcierge for service request ID: ${serviceRequest.id}`,
        );
        return await this.hourlyServiceInvoice.initInvoice(
          queryRunner,
          serviceRequest,
          invLineItems,
          user,
          serviceRequestNote,
        );

      default:
        this.logger.log(
          `Routing to PreNegotiatedServiceInvoice - PreNegotiated for service request ID: ${serviceRequest.id}`,
        );
        return await this.preNegotiatedServiceInvoice.initInvoice(
          queryRunner,
          serviceRequest,
          invLineItems,
          user,
          serviceRequestNote,
        );
    }
  }
}
