import { BunyanLogger } from '@/app/commons/logger.service';
import { InvoiceHandler } from '@/app/contracts/interfaces/invoiceHandler.interface';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { Injectable } from '@nestjs/common';
import { CreateInvoiceLineItemDto } from './invoice.dto';
import { In, QueryRunner } from 'typeorm';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { InvoiceHandlerResponse } from '@/app/contracts/types/invoice.types';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import {
  InvoiceSection,
  InvoiceStatus,
} from '@/app/contracts/enums/invoice.enum';
import { InvoiceLineItemRepository } from '@/app/repositories/invoice/invoiceLineItem.repository';
import { InvoiceLineItemModel } from '@/app/models/invoice/invoiceLineItem.model';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { UserRepository } from '@/app/repositories/user/user.repository';

@Injectable()
export class HourlyServiceInvoice implements InvoiceHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
    private readonly invoiceLineItemRepository: InvoiceLineItemRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async initInvoice(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    invLineItems: CreateInvoiceLineItemDto[],
    user: JwtPayload,
    serviceRequestNote?: string | null,
  ): Promise<InvoiceHandlerResponse> {
    this.logger.log(
      `HourlyServiceInvoice - initInvoice called for service request ID: ${serviceRequest.id} | ${serviceRequestNote}`,
    );

    const franchiseAdmin = await this.userRepository.findOne({
      where: {
        franchise_id: Number(user.franchise_id),
        user_type: UserType.FranchiseAdmin,
      },
    });

    let invoiceModel = await this.invoiceMasterRepository.findOne({
      where: {
        service_request_master_id: serviceRequest.id,
        franchise_id: Number(user.franchise_id),
      },
    });

    let invoiceLineItems: Partial<InvoiceLineItemModel>[] = [];
    let newLineItems: Partial<InvoiceLineItemModel>[] = [];

    const laborLineItem = invLineItems.find(
      (item) => item.section_id === InvoiceSection.Labor,
    );

    if (invoiceModel)
      invoiceLineItems = (
        await this.invoiceLineItemRepository.find({
          invoice_master_id: invoiceModel.id,
          service_request_status: In([ServiceRequestStatus.InProgress]),
        })
      ).map((invoiceLineItem) => ({
        line_item: invoiceLineItem.line_item,
        price: invoiceLineItem.price,
        description: invoiceLineItem.description,
        is_vendor_line_item: invoiceLineItem?.franchise_admin_id ? false : true,
        vendor_id: invoiceLineItem.vendor_id,
        franchise_admin_id: invoiceLineItem.franchise_admin_id,
        hours_worked: invoiceLineItem.hours_worked,
        section_id: invoiceLineItem.section_id,
      }));
    else invoiceModel = new InvoiceMasterModel();

    let invoiceTotal = 0;

    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type)
    ) {
      newLineItems = invoiceLineItems.map((lineItem) => ({
        ...lineItem,
        is_vendor_line_item: false,
        vendor_id: serviceRequest.vendor_id,
        franchise_admin_id: franchiseAdmin.id,
        hours_worked: lineItem.hours_worked,
        section_id: lineItem.section_id,
      }));
      invoiceTotal = invoiceLineItems.reduce(
        (sum, item) => sum + Number(item.price),
        0,
      );
    } else {
      await queryRunner.manager.delete(InvoiceLineItemModel, {
        invoice_master_id: invoiceModel.id,
        service_request_status: ServiceRequestStatus.InProgress,
      });
      invoiceTotal = invLineItems
        .filter((item) => item.section_id !== InvoiceSection.Labor)
        .reduce((sum, item) => sum + Number(item.price), 0);
      if (
        laborLineItem &&
        laborLineItem?.hours_worked &&
        laborLineItem?.price
      ) {
        invoiceTotal +=
          Number(laborLineItem.price) * Number(laborLineItem.hours_worked);
      }
      const vendorLineItems = invLineItems.map((lineItem) => ({
        ...lineItem,
        is_vendor_line_item: true,
        vendor_id: serviceRequest.vendor_id,
        franchise_admin_id: null,
        hours_worked: lineItem.hours_worked,
        section_id: lineItem.section_id,
      }));
      const franchiseLineItems = invLineItems.map((lineItem) => ({
        ...lineItem,
        is_vendor_line_item: false,
        vendor_id: serviceRequest.vendor_id,
        franchise_admin_id: franchiseAdmin.id,
        hours_worked: lineItem.hours_worked,
        section_id: lineItem.section_id,
      }));
      newLineItems = [...vendorLineItems, ...franchiseLineItems];
    }

    let invoiceRemainingAmount = invoiceTotal;

    if (
      invoiceModel &&
      invoiceModel?.deposit_required_by &&
      invoiceModel?.deposit_amount &&
      invoiceModel?.deposit_paid
    ) {
      invoiceRemainingAmount -= Number(invoiceModel?.deposit_amount);
    }

    invoiceModel.service_request_master_id = serviceRequest.id;
    invoiceModel.property_master_id = serviceRequest.property_master_id;
    invoiceModel.vendor_id = serviceRequest.vendor_id;
    invoiceModel.owner_id = serviceRequest.owner_id;
    invoiceModel.service_type_id = serviceRequest.service_type_id;
    invoiceModel.franchise_id = serviceRequest.franchise_id;
    invoiceModel.invoice_status =
      invLineItems.length > 0 && user.user_type === UserType.Vendor
        ? InvoiceStatus.SentToAdmin
        : InvoiceStatus.Created;
    invoiceModel.auto_send_to_owner = false;
    invoiceModel.vendor_total = invoiceTotal;
    invoiceModel.franchise_total = invoiceTotal;
    invoiceModel.vendor_remaining_balance = invoiceRemainingAmount;
    invoiceModel.franchise_remaining_balance = invoiceRemainingAmount;

    const savedInvoiceModel = await queryRunner.manager.save(
      InvoiceMasterModel,
      invoiceModel,
    );

    this.logger.log(
      `Invoice master saved with ID: ${savedInvoiceModel.id} for service request ID: ${serviceRequest.id}`,
    );

    return {
      invoice_master: savedInvoiceModel,
      line_items: newLineItems,
      has_prev_line_items: false,
    };
  }
}
