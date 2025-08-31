import { BunyanLogger } from '@/app/commons/logger.service';
import { InvoiceHandler } from '@/app/contracts/interfaces/invoiceHandler.interface';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateInvoiceLineItemDto } from './invoice.dto';
import { QueryRunner } from 'typeorm';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { ServiceRequestMessage } from '@/serviceRequest/serviceRequest.message';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import {
  InvoiceSection,
  InvoiceStatus,
} from '@/app/contracts/enums/invoice.enum';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { InvoiceHandlerResponse } from '@/app/contracts/types/invoice.types';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { UserModel } from '@/app/models/user/user.model';
import { InvoiceLineItemComputationType } from '@/app/contracts/enums/invoiceLineItem.enum';

@Injectable()
export class DepositInvoiceHandler implements InvoiceHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async initInvoice(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    lineItems: CreateInvoiceLineItemDto[],
    user: JwtPayload,
  ): Promise<InvoiceHandlerResponse> {
    if (!lineItems || (lineItems && lineItems.length === 0))
      throw new BadRequestException(
        ServiceRequestMessage.INVOICE_LINE_ITEMS_REQUIRED,
      );

    const totalAmount =
      lineItems.reduce((sum, item) => sum + Number(item.price), 0) || 0;

    let invoiceMaster = await this.invoiceMasterRepository.findOne({
      where: { service_request_master_id: serviceRequest.id },
    });

    if (!invoiceMaster) invoiceMaster = new InvoiceMasterModel();

    invoiceMaster.service_request_master_id = serviceRequest.id;
    invoiceMaster.property_master_id = serviceRequest.propertyMaster.id;
    invoiceMaster.vendor_id = serviceRequest.vendor_id;
    invoiceMaster.owner_id = serviceRequest.owner_id;
    invoiceMaster.service_type_id = serviceRequest.service_type_id;
    invoiceMaster.franchise_id = serviceRequest.franchise_id;
    invoiceMaster.invoice_status = [
      UserType.StandardAdmin,
      UserType.FranchiseAdmin,
    ].includes(user.user_type)
      ? InvoiceStatus.SentToOwner
      : InvoiceStatus.SentToAdmin;
    invoiceMaster.deposit_amount = totalAmount;
    invoiceMaster.vendor_total = totalAmount;
    invoiceMaster.franchise_total = totalAmount;
    invoiceMaster.vendor_remaining_balance = totalAmount;
    invoiceMaster.franchise_remaining_balance = totalAmount;
    invoiceMaster.deposit_required_by =
      user.user_type === UserType.StandardAdmin
        ? Number(user.franchise_admin)
        : Number(user.id);

    this.logger.log(`Deposit required status processed`);

    const serviceRequestInv = await queryRunner.manager.save(invoiceMaster);

    const franchiseAdmin: UserModel = await this.userRepository.findOne({
      where: {
        franchise_id: Number(user.franchise_id),
        user_type: UserType.FranchiseAdmin,
      },
    });

    const vendorLineItems: Partial<CreateInvoiceLineItemDto>[] = lineItems.map(
      (lineItem) => ({
        ...lineItem,
        vendor_id: serviceRequest.vendor_id,
        is_vendor_line_item: true,
        franchise_admin_id: null,
        invoice_master_id: serviceRequestInv.id,
        computation_type: InvoiceLineItemComputationType.Add,
        section_id: InvoiceSection.Material,
        is_readonly: false,
        description: '',
      }),
    );

    const franchiseLineItems: Partial<CreateInvoiceLineItemDto>[] =
      lineItems.map((lineItem) => ({
        ...lineItem,
        vendor_id: serviceRequest.vendor_id,
        is_vendor_line_item: false,
        franchise_admin_id: franchiseAdmin.id,
        invoice_master_id: serviceRequestInv.id,
        computation_type: InvoiceLineItemComputationType.Add,
        section_id: InvoiceSection.Material,
        is_readonly: false,
        description: '',
      }));

    return {
      invoice_master: serviceRequestInv,
      line_items: [...vendorLineItems, ...franchiseLineItems],
    };
  }
}
