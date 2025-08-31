import { BunyanLogger } from '@/app/commons/logger.service';
import { InvoiceHandler } from '@/app/contracts/interfaces/invoiceHandler.interface';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateInvoiceLineItemDto } from './invoice.dto';
import { QueryRunner } from 'typeorm';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { InvoiceStatus } from '@/app/contracts/enums/invoice.enum';
import { InvoiceHandlerResponse } from '@/app/contracts/types/invoice.types';
import { ServiceRequestMessage } from '@/serviceRequest/serviceRequest.message';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';

@Injectable()
export class InProgressInvoiceHandler implements InvoiceHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
  ) {}

  async initInvoice(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    lineItems: CreateInvoiceLineItemDto[],
  ): Promise<InvoiceHandlerResponse> {
    if (
      [
        ServiceRequestStatus.PartiallyCompleted,
        ServiceRequestStatus.CompletedSuccessfully,
      ].includes(serviceRequest.status)
    )
      throw new BadRequestException(
        ServiceRequestMessage.INVOICE_LINE_ITEMS_REQUIRED,
      );

    let invoiceMaster = await this.invoiceMasterRepository.findOne({
      where: { service_request_master_id: serviceRequest.id },
    });

    if (!invoiceMaster) {
      invoiceMaster = new InvoiceMasterModel();

      invoiceMaster.service_request_master_id = serviceRequest.id;
      invoiceMaster.property_master_id = serviceRequest.propertyMaster.id;
      invoiceMaster.vendor_id = serviceRequest.vendor_id;
      invoiceMaster.owner_id = serviceRequest.owner_id;
      invoiceMaster.service_type_id = serviceRequest.service_type_id;
      invoiceMaster.franchise_id = serviceRequest.franchise_id;
      invoiceMaster.invoice_status = InvoiceStatus.Created;

      invoiceMaster = await queryRunner.manager.save(
        InvoiceMasterModel,
        invoiceMaster,
      );
    }

    this.logger.log(`In Progress status processed`);

    const vendorLineItems = lineItems.map((lineItem) => ({
      ...lineItem,
      vendor_id: serviceRequest.vendor_id,
      is_vendor_line_item: true,
      franchise_admin_id: null,
    }));

    return {
      invoice_master: invoiceMaster,
      line_items: vendorLineItems,
    };
  }
}
