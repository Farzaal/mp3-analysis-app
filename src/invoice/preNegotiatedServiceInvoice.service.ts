import { BunyanLogger } from '@/app/commons/logger.service';
import { InvoiceHandler } from '@/app/contracts/interfaces/invoiceHandler.interface';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { Injectable } from '@nestjs/common';
import { CreateInvoiceLineItemDto } from './invoice.dto';
import { In, IsNull, Not, QueryRunner } from 'typeorm';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { PropertyServiceTypeRateRepository } from '@/app/repositories/property/propertyServiceTypeRate.repository';
import { InvoiceLineItemModel } from '@/app/models/invoice/invoiceLineItem.model';
import { InvoiceLineItemRepository } from '@/app/repositories/invoice/invoiceLineItem.repository';
import { EstimateDetailModel } from '@/app/models/estimate/estimateDetail.model';
import { EstimateMasterModel } from '@/app/models/estimate/estimateMaster.model';
import { EstimateMasterRepository } from '@/app/repositories/estimate/estimateMaster.repository';
import { EstimateDetailsRepository } from '@/app/repositories/estimate/estimateDetails.repository';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import {
  InvoiceSection,
  InvoiceStatus,
  PaymentStatus,
} from '@/app/contracts/enums/invoice.enum';
import { InvoiceHandlerResponse } from '@/app/contracts/types/invoice.types';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { PropertyServiceTypeRateModel } from '@/app/models/property/propertyServiceTypeRates.model';
import { UserModel } from '@/app/models/user/user.model';
import { InvoiceLineItemComputationType } from '@/app/contracts/enums/invoiceLineItem.enum';
import { ServiceRequestLinenDetailModel } from '@/app/models/serviceRequest/serviceRequestLinenDetail.model';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
import { UserPaymentMethodModel } from '@/app/models/paymentMethod/userPaymentMethod.model';
import { PaymentMethodStatus } from '@/app/contracts/enums/payment.enum';
import { v4 as uuidv4 } from 'uuid';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { PaymentService } from '@/payment/payment.service';
import { IPayParams } from '@/app/contracts/interfaces/payment.interface';
import { OwnerPaymentDetailsModel } from '@/app/models/invoice/ownerPaymentDetails.model';
import { ServiceRequestNoteRepository } from '@/app/repositories/serviceRequest/serviceRequestNote.repository';
import { ServiceRequestNoteModel } from '@/app/models/serviceRequest/serviceRequestNote.model';
import { OwnerPaymentDetailsRepository } from '@/app/repositories/invoice/onwerPaymentDetails.repository';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';

@Injectable()
export class PreNegotiatedServiceInvoice implements InvoiceHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
    private readonly propertyServiceTypeRateRepository: PropertyServiceTypeRateRepository,
    private readonly invoiceLineItemRepository: InvoiceLineItemRepository,
    private readonly estimateMasterRepository: EstimateMasterRepository,
    private readonly estimateDetailsRepository: EstimateDetailsRepository,
    private readonly propertyMasterRepository: PropertyMasterRepository,
    private readonly userPaymentMethodRepository: UserPaymentMethodRepository,
    private readonly serviceRequestNoteRepository: ServiceRequestNoteRepository,
    private readonly paymentService: PaymentService,
    private readonly userRepository: UserRepository,
    private readonly ownerPaymentDetailsRepository: OwnerPaymentDetailsRepository,
    private readonly serviceRequestMasterRepository: ServiceRequestMasterRepository,
  ) {}

  async initInvoice(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    invLineItems: CreateInvoiceLineItemDto[],
    user: JwtPayload,
    serviceRequestNote?: string | null,
  ): Promise<InvoiceHandlerResponse> {
    let invoiceModel = await this.invoiceMasterRepository.findOne({
      where: {
        service_request_master_id: serviceRequest.id,
        franchise_id: Number(user.franchise_id),
      },
    });

    const propertyServiceTypeRates =
      await this.propertyServiceTypeRateRepository.findOne({
        where: {
          property_master_id: serviceRequest.property_master_id,
          service_type_id: serviceRequest.service_type_id,
          franchise_id: Number(user.franchise_id),
        },
      });

    const propertyMasterModel = await this.propertyMasterRepository.findOne({
      where: {
        id: serviceRequest.property_master_id,
      },
      relations: ['owner'],
    });

    const vendorLineItems: CreateInvoiceLineItemDto[] = invLineItems.map(
      (l) => ({
        ...l,
        is_vendor_line_item: true,
        vendor_id: serviceRequest.vendor_id,
        franchise_admin_id: null,
      }),
    );

    const isPropertyRatesSet =
      propertyServiceTypeRates?.owner_charge !== undefined &&
      propertyServiceTypeRates?.owner_charge > 0 &&
      propertyServiceTypeRates?.vendor_charge !== undefined &&
      propertyServiceTypeRates?.vendor_charge > 0;

    let invoiceLineItems: Partial<InvoiceLineItemModel>[] = [];

    const franchiseAdmin = await this.userRepository.findOne({
      where: {
        franchise_id: Number(user.franchise_id),
        user_type: UserType.FranchiseAdmin,
      },
    });

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
      }));

    const estimateLineItems = (
      await this.isEstimateServiceRequest(serviceRequest)
    ).map((estimateLineItem) => ({
      line_item: estimateLineItem.line_item,
      price: estimateLineItem.price,
      description: estimateLineItem.description,
      vendor_id: estimateLineItem.vendor_id,
      franchise_admin_id: estimateLineItem.franchise_admin_id,
    }));

    const estimateLineItemsVendorTotal = estimateLineItems
      .filter((el) => el.vendor_id && !el.franchise_admin_id)
      .reduce((sum, item) => sum + Number(item.price), 0);

    const estimateLineItemsFranchiseTotal = estimateLineItems
      .filter((el) => el.franchise_admin_id)
      .reduce((sum, item) => sum + Number(item.price), 0);

    let vendorTotal = 0;
    let franchiseTotal = 0;
    let vendorRemainingBalance = 0;
    let franchiseRemainingBalance = 0;

    const hasLineItems =
      invoiceLineItems.length > 0 || vendorLineItems?.length > 0;

    const vendorHasNotes: ServiceRequestNoteModel =
      await this.serviceRequestNoteRepository.findOne({
        where: {
          service_request_master_id: serviceRequest.id,
          description: Not(IsNull()),
          note_added_by: serviceRequest.vendor_id,
        },
      });

    const sendToOwner: boolean =
      !hasLineItems &&
      (estimateLineItems.length > 0 ||
        isPropertyRatesSet ||
        (serviceRequest?.serviceRequestMasterLinen !== undefined &&
          serviceRequest?.serviceRequestMasterLinen !== null));

    const payloadLineItems = vendorLineItems?.length > 0 ? vendorLineItems : [];

    let isPropertyRatesApplied = false;
    let isLinen = false;

    let newLineItems: Partial<CreateInvoiceLineItemDto>[] = [
      ...payloadLineItems,
      ...estimateLineItems,
    ];

    const lineItemsTotalAmount =
      [...payloadLineItems, ...estimateLineItems, ...invoiceLineItems].reduce(
        (sum, item) => sum + Number(item.price),
        0,
      ) || 0;

    if (invoiceLineItems.length > 0 || vendorLineItems.length > 0) {
      const franchiseLineItem = [...invoiceLineItems, ...vendorLineItems].map(
        (lineItem) => ({
          ...lineItem,
          is_vendor_line_item: false,
          vendor_id: serviceRequest.vendor_id,
          franchise_admin_id: franchiseAdmin.id,
        }),
      );
      newLineItems = newLineItems.concat(franchiseLineItem);
    }

    const prevLineItems: boolean =
      invoiceLineItems.length > 0 || invoiceModel?.deposit_amount !== undefined;

    if (sendToOwner && estimateLineItems.length > 0) {
      vendorTotal += estimateLineItemsVendorTotal;
      franchiseTotal += estimateLineItemsFranchiseTotal;
      vendorRemainingBalance += estimateLineItemsVendorTotal;
      franchiseRemainingBalance += estimateLineItemsFranchiseTotal;
    } else if (sendToOwner && isPropertyRatesSet) {
      vendorTotal += propertyServiceTypeRates?.vendor_charge;
      franchiseTotal += propertyServiceTypeRates?.owner_charge;
      vendorRemainingBalance += propertyServiceTypeRates?.vendor_charge;
      franchiseRemainingBalance += propertyServiceTypeRates?.owner_charge;
      isPropertyRatesApplied = true;
    } else if (sendToOwner && serviceRequest?.serviceRequestMasterLinen) {
      vendorTotal += serviceRequest?.serviceRequestMasterLinen?.bedroom_price;
      franchiseTotal +=
        serviceRequest?.serviceRequestMasterLinen?.total_charges;
      vendorRemainingBalance +=
        serviceRequest?.serviceRequestMasterLinen.bedroom_price;
      franchiseRemainingBalance +=
        serviceRequest?.serviceRequestMasterLinen?.total_charges;
      isLinen = true;
    } else {
      vendorTotal +=
        estimateLineItems.length > 0
          ? lineItemsTotalAmount - estimateLineItemsFranchiseTotal
          : isPropertyRatesSet
            ? lineItemsTotalAmount + propertyServiceTypeRates?.vendor_charge
            : lineItemsTotalAmount;
      franchiseTotal +=
        estimateLineItems.length > 0
          ? lineItemsTotalAmount - estimateLineItemsVendorTotal
          : isPropertyRatesSet
            ? lineItemsTotalAmount + propertyServiceTypeRates?.owner_charge
            : lineItemsTotalAmount;
      vendorRemainingBalance +=
        estimateLineItems.length > 0
          ? lineItemsTotalAmount - estimateLineItemsFranchiseTotal
          : isPropertyRatesSet
            ? lineItemsTotalAmount + propertyServiceTypeRates?.vendor_charge
            : lineItemsTotalAmount;
      franchiseRemainingBalance +=
        estimateLineItems.length > 0
          ? lineItemsTotalAmount - estimateLineItemsVendorTotal
          : isPropertyRatesSet
            ? lineItemsTotalAmount + propertyServiceTypeRates?.owner_charge
            : lineItemsTotalAmount;
      isPropertyRatesApplied =
        estimateLineItems.length === 0 && isPropertyRatesSet;
    }

    if (!invoiceModel) invoiceModel = new InvoiceMasterModel();
    else if (
      invoiceModel &&
      invoiceModel?.deposit_required_by &&
      invoiceModel?.deposit_amount &&
      invoiceModel?.deposit_paid
    ) {
      vendorRemainingBalance -= invoiceModel?.deposit_amount;
      franchiseRemainingBalance -= invoiceModel?.deposit_amount;
    }

    invoiceModel.service_request_master_id = serviceRequest.id;
    invoiceModel.property_master_id = serviceRequest.property_master_id;
    invoiceModel.vendor_id = serviceRequest.vendor_id;
    invoiceModel.owner_id = serviceRequest.owner_id;
    invoiceModel.service_type_id = serviceRequest.service_type_id;
    invoiceModel.franchise_id = serviceRequest.franchise_id;
    invoiceModel.send_to_owner_at = sendToOwner
      ? Math.floor(Date.now() / 1000)
      : null;
    invoiceModel.invoice_status =
      !isLinen && (vendorHasNotes || serviceRequestNote)
        ? InvoiceStatus.SentToAdmin
        : sendToOwner
          ? InvoiceStatus.SentToOwner
          : InvoiceStatus.Created;
    invoiceModel.auto_send_to_owner = sendToOwner ? true : false;
    invoiceModel.vendor_total = vendorTotal;
    invoiceModel.franchise_total = franchiseTotal;
    invoiceModel.vendor_remaining_balance = vendorRemainingBalance;
    invoiceModel.franchise_remaining_balance = franchiseRemainingBalance;

    if (serviceRequest.parent_id || serviceRequest.is_parent) {
      const parentInvoiceStatus = await this.isInvoiceToBeOnHold(
        serviceRequest,
        invoiceModel,
      );
      if (parentInvoiceStatus && serviceRequest.is_parent) {
        invoiceModel.invoice_status = parentInvoiceStatus;
      } else if (parentInvoiceStatus) {
        await queryRunner.manager.update(
          InvoiceMasterModel,
          {
            service_request_master_id: serviceRequest.parent_id,
          },
          { invoice_status: parentInvoiceStatus },
        );
      }
    }

    let discountSavings = 0;

    if (
      isPropertyRatesApplied &&
      Number(propertyServiceTypeRates?.discount_percentage) > 0
    ) {
      invoiceModel.discount_percentage = Number(
        propertyServiceTypeRates?.discount_percentage,
      );
      discountSavings =
        propertyServiceTypeRates.owner_charge *
        (Number(propertyServiceTypeRates?.discount_percentage) / 100);

      franchiseTotal = franchiseTotal - discountSavings;
      franchiseRemainingBalance = franchiseRemainingBalance - discountSavings;

      invoiceModel.franchise_remaining_balance = franchiseRemainingBalance;
      invoiceModel.franchise_total = franchiseTotal;
    }

    const serviceRequestInv = await queryRunner.manager.save(invoiceModel);

    if (isPropertyRatesApplied) {
      const propertyLineItems: CreateInvoiceLineItemDto[] =
        await this.decoratePreNegotiatedRateLineItems(
          serviceRequest,
          propertyServiceTypeRates,
          serviceRequestInv.id,
          franchiseAdmin,
          discountSavings,
        );
      newLineItems = newLineItems.concat(propertyLineItems);
    }

    if (isLinen) {
      const linenLineItems = await this.decorateLinenLineItems(
        serviceRequest.serviceRequestMasterLinen,
        serviceRequest.status,
        serviceRequestInv.id,
        serviceRequest.vendor_id,
        franchiseAdmin,
      );
      newLineItems = newLineItems.concat(linenLineItems);
    }

    if (sendToOwner) {
      let ownerPaymentDetailsModel: OwnerPaymentDetailsModel =
        await this.ownerPaymentDetailsRepository.findOne({
          where: { invoice_master_id: serviceRequestInv.id },
        });

      if (!ownerPaymentDetailsModel)
        ownerPaymentDetailsModel = new OwnerPaymentDetailsModel();

      ownerPaymentDetailsModel.invoice_master_id = serviceRequestInv.id;
      ownerPaymentDetailsModel.payment_status = PaymentStatus.Unpaid;
      ownerPaymentDetailsModel.franchise_admin_id = franchiseAdmin.id;
      ownerPaymentDetailsModel.invoice_total_after_sales_tax =
        franchiseRemainingBalance;

      await queryRunner.manager.save(
        OwnerPaymentDetailsModel,
        ownerPaymentDetailsModel,
      );

      if (propertyMasterModel?.enable_auto_charge) {
        await this.payInvoiceIfAutoChargeIsEnabled(
          queryRunner,
          propertyMasterModel,
          serviceRequestInv.id,
          franchiseRemainingBalance,
        );
      }
    }

    this.logger.log('Completed invoice is being processed');

    return {
      invoice_master: serviceRequestInv,
      line_items: newLineItems,
      has_prev_line_items: prevLineItems,
    };
  }

  private async isInvoiceToBeOnHold(
    serviceRequestMasterModel: ServiceRequestMasterModel,
    invoiceMaster: InvoiceMasterModel,
  ): Promise<InvoiceStatus | null> {
    if (
      !serviceRequestMasterModel?.is_parent &&
      !serviceRequestMasterModel?.parent_id
    )
      return null;

    if (
      serviceRequestMasterModel?.is_parent &&
      invoiceMaster?.invoice_status === InvoiceStatus.SentToOwner
    ) {
      const serviceRequests = await this.serviceRequestMasterRepository.find({
        parent_id: serviceRequestMasterModel.id,
      });

      if (
        !serviceRequests.every((sr) =>
          [
            ServiceRequestStatus.CompletedSuccessfully,
            ServiceRequestStatus.PartiallyCompleted,
          ].includes(sr.status),
        )
      )
        return InvoiceStatus.OnHold;

      const activeChildInvoices = await this.invoiceMasterRepository.find({
        service_request_master_id: In(serviceRequests.map((sr) => sr.id)),
        invoice_status: InvoiceStatus.SentToOwner,
      });

      return serviceRequests.length === activeChildInvoices.length
        ? null
        : InvoiceStatus.OnHold;
    }

    if (serviceRequestMasterModel?.parent_id) {
      const parentInvoiceMaster = await this.invoiceMasterRepository.findOne({
        where: {
          service_request_master_id: serviceRequestMasterModel?.parent_id,
        },
      });

      if (!parentInvoiceMaster) return null;

      if (parentInvoiceMaster?.invoice_status === InvoiceStatus.OnHold) {
        const serviceRequests = await this.serviceRequestMasterRepository.find({
          parent_id: invoiceMaster.service_request_master_id,
        });

        const serviceRequestsToCheck = serviceRequests.filter(
          (sr) => sr.id !== invoiceMaster.service_request_master_id,
        );

        if (
          !serviceRequestsToCheck.every((sr) =>
            [
              ServiceRequestStatus.CompletedSuccessfully,
              ServiceRequestStatus.PartiallyCompleted,
            ].includes(sr.status),
          )
        )
          return null;

        const activeChildInvoices = await this.invoiceMasterRepository.find({
          service_request_master_id: In(
            serviceRequestsToCheck.map((sr) => sr.id),
          ),
          invoice_status: InvoiceStatus.SentToOwner,
        });

        return serviceRequestsToCheck.length === activeChildInvoices.length
          ? InvoiceStatus.SentToOwner
          : null;
      }
    }

    return null;
  }

  private async isEstimateServiceRequest(
    serviceRequestMasterModel: ServiceRequestMasterModel,
  ): Promise<EstimateDetailModel[]> {
    if (!serviceRequestMasterModel?.estimate_master_id) return [];

    const estimateMaster: EstimateMasterModel =
      await this.estimateMasterRepository.findOne({
        where: {
          id: serviceRequestMasterModel?.estimate_master_id,
        },
      });

    if (
      estimateMaster?.service_type_id !==
      serviceRequestMasterModel?.service_type_id
    )
      return [];

    return await this.estimateDetailsRepository.find({
      estimate_master_id: serviceRequestMasterModel?.estimate_master_id,
      is_send_to_owner: true,
      is_estimate_approved: true,
      is_grand_total: false,
    });
  }

  public async decoratePreNegotiatedRateLineItems(
    serviceRequestMasterModel: ServiceRequestMasterModel,
    propertyServiceTypeRateModel: PropertyServiceTypeRateModel,
    invoiceMasterId: number,
    franchiseAdmin: UserModel,
    discountSavings: number,
  ): Promise<CreateInvoiceLineItemDto[]> {
    return [
      {
        line_item: 'Property Service Rate',
        price: propertyServiceTypeRateModel?.owner_charge - discountSavings,
        invoice_master_id: invoiceMasterId,
        is_vendor_line_item: false,
        service_request_status: serviceRequestMasterModel.status,
        computation_type: InvoiceLineItemComputationType.Add,
        description: 'Property Rates',
        vendor_id: serviceRequestMasterModel.vendor_id,
        franchise_admin_id: franchiseAdmin?.id,
        section_id: InvoiceSection.Material,
        is_readonly: false,
      },
      {
        line_item: 'Property Service Rate',
        price: propertyServiceTypeRateModel?.vendor_charge,
        invoice_master_id: invoiceMasterId,
        is_vendor_line_item: true,
        service_request_status: serviceRequestMasterModel.status,
        computation_type: InvoiceLineItemComputationType.Add,
        description: 'Property Rates',
        vendor_id: serviceRequestMasterModel.vendor_id,
        franchise_admin_id: null,
        section_id: InvoiceSection.Material,
        is_readonly: false,
      },
    ] as CreateInvoiceLineItemDto[];
  }

  public async decorateLinenLineItems(
    serviceRequestLinenDetailModel: ServiceRequestLinenDetailModel,
    serviceRequestStatus: ServiceRequestStatus,
    invoiceMasterId: number,
    vendorId: number,
    franchiseAdmin: UserModel,
  ): Promise<CreateInvoiceLineItemDto[]> {
    return [
      {
        line_item: 'Linen Total Charges',
        price: serviceRequestLinenDetailModel.bedroom_price,
        invoice_master_id: invoiceMasterId,
        is_vendor_line_item: true,
        service_request_status: serviceRequestStatus,
        computation_type: InvoiceLineItemComputationType.Add,
        vendor_id: vendorId,
        franchise_admin_id: null,
        section_id: InvoiceSection.Material,
        is_readonly: true,
      },
      {
        line_item: 'Linen Total Charges',
        price: serviceRequestLinenDetailModel.total_charges,
        invoice_master_id: invoiceMasterId,
        is_vendor_line_item: false,
        service_request_status: serviceRequestStatus,
        computation_type: InvoiceLineItemComputationType.Add,
        vendor_id: vendorId,
        franchise_admin_id: franchiseAdmin.id,
        section_id: InvoiceSection.Material,
        is_readonly: true,
      },
    ] as CreateInvoiceLineItemDto[];
  }

  public async payInvoiceIfAutoChargeIsEnabled(
    queryRunner: QueryRunner,
    propertyMasterModel: PropertyMasterModel,
    invMasterId: number,
    amount: number,
  ): Promise<boolean> {
    let userPaymentMethod: UserPaymentMethodModel =
      propertyMasterModel.propertyPaymentMethod;

    if (!userPaymentMethod) {
      userPaymentMethod = await this.userPaymentMethodRepository.findOne({
        where: {
          owner_id: propertyMasterModel.owner.id,
          status: PaymentMethodStatus.Succeeded,
          is_default: true,
          is_deleted: false,
        },
      });
    }

    if (!userPaymentMethod) {
      this.logger.log(
        `Error Auto Charging Invoice ID, ${invMasterId}, Error : No user payment method found`,
      );
      return false;
    }

    const invIdentifier = uuidv4();

    const owner: JwtPayload = {
      id: propertyMasterModel.owner_id,
      first_name: propertyMasterModel.owner.first_name,
      last_name: propertyMasterModel.owner.last_name,
      email: propertyMasterModel.owner.email,
      user_type: UserType.Owner,
      franchise_id: propertyMasterModel.franchise_id,
      franchise_admin: null,
    };

    await queryRunner.manager.update(
      InvoiceMasterModel,
      { id: invMasterId },
      {
        invoice_uuid: invIdentifier,
        invoice_status: InvoiceStatus.PaidByOwnerProcessing,
        payment_method_id: userPaymentMethod.id,
      },
    );

    const payParams: IPayParams = {
      user: owner,
      amount,
      payment_method_id: userPaymentMethod.id,
      metadata: {
        invoice_identifier: invIdentifier,
        owner_id: propertyMasterModel.owner_id,
        payment_method_id: userPaymentMethod.id,
      },
      invoice_id: invMasterId,
      owner_id: propertyMasterModel.owner_id,
    };

    const response = await this.paymentService.pay(payParams);

    if (response.error) {
      await queryRunner.manager.update(
        InvoiceMasterModel,
        { id: invMasterId },
        {
          invoice_uuid: null,
          invoice_status: InvoiceStatus.SentToOwner,
          payment_method_id: userPaymentMethod.id,
        },
      );
      this.logger.log(
        `Error Auto Charging Invoice ID, ${invMasterId}, Error : ${response.data}`,
      );
      return false;
    }

    this.logger.log(
      `Payment for invoice ID, ${invMasterId} is being processed`,
    );

    return true;
  }
}
