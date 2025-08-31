import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateInvoiceV2,
  GetAllInvoicesDtoV2,
  ProcessPaymentDto,
  UpdateInvoiceStatusDto,
  UpdateInvoiceV2,
  UpdateWorkDescriptionDto,
  UpsertInvoicePaymentDetailsDto,
} from './invoice.dto';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import {
  InvoiceSection,
  InvoiceStatus,
  PaymentStatus,
} from '@/app/contracts/enums/invoice.enum';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { DataSource, QueryRunner, In, Not, IsNull } from 'typeorm';
import { CreateInvoiceLineItemDto } from './invoice.dto';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { InvoiceLineItemModel } from '@/app/models/invoice/invoiceLineItem.model';
import { InvoiceLineItemComputationType } from '@/app/contracts/enums/invoiceLineItem.enum';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from '@/app/utils/general.helper';
import { InvoiceHandler } from '@/app/contracts/interfaces/invoiceHandler.interface';
import { DepositInvoiceHandler } from './depositInvoiceHandler.service';
import { InProgressInvoiceHandler } from './inProgressInvoiceHandler.service';
import { CompletedInvoiceHandler } from './completedInvoiceHandler.service';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { InvoiceMessage } from './invoice.messages';
import { S3Service } from '@/app/commons/s3.service';
import { BunyanLogger } from '@/app/commons/logger.service';
import { OwnerPaymentDetailsRepository } from '@/app/repositories/invoice/onwerPaymentDetails.repository';
import { VendorPaymentDetailsRepository } from '@/app/repositories/invoice/vendorPaymentDetails.repository';
import { OwnerPaymentDetailsModel } from '@/app/models/invoice/ownerPaymentDetails.model';
import { VendorPaymentDetailsModel } from '@/app/models/invoice/vendorPaymentDetails.model';
import { InvoiceHandlerResponse } from '@/app/contracts/types/invoice.types';
import { MaterialItems } from '@/app/contracts/interfaces/invoice.interface';
import * as moment from 'moment';
import { PaymentService } from '@/payment/payment.service';
import { v4 as uuidv4 } from 'uuid';
import { GenericReportDownloadEvent } from '@/reportDownload/reportDownload.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DownloadReportEventName } from '@/app/contracts/enums/reportDownload.enum';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { UserModel } from '@/app/models/user/user.model';
import { Setting } from '@/app/contracts/enums/setting.enum';
import { ServiceRequestMessage } from '@/serviceRequest/serviceRequest.message';
import { InvoiceLineItemRepository } from '@/app/repositories/invoice/invoiceLineItem.repository';
import { EstimateDetailsRepository } from '@/app/repositories/estimate/estimateDetails.repository';

@Injectable()
export class InvoiceService {
  private readonly serviceRequestStatusProcessorMap: Map<
    ServiceRequestStatus,
    InvoiceHandler
  >;

  constructor(
    private readonly configService: ConfigService,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
    private readonly serviceRequestMasterRepository: ServiceRequestMasterRepository,
    private readonly userRepository: UserRepository,
    private readonly generalHelper: GeneralHelper,
    private readonly depositInvoiceHandler: DepositInvoiceHandler,
    private readonly inProgressInvoiceHandler: InProgressInvoiceHandler,
    private readonly completedInvoiceHandler: CompletedInvoiceHandler,
    private readonly dataSource: DataSource,
    private readonly s3Service: S3Service,
    private readonly logger: BunyanLogger,
    private readonly ownerPaymentDetailsRepository: OwnerPaymentDetailsRepository,
    private readonly vendorPaymentDetailsRepository: VendorPaymentDetailsRepository,
    private readonly estimateDetailsRepository: EstimateDetailsRepository,
    private readonly paymentService: PaymentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
    private readonly invoiceLineItemRepository: InvoiceLineItemRepository,
  ) {
    this.serviceRequestStatusProcessorMap = new Map<
      ServiceRequestStatus,
      InvoiceHandler
    >([
      [ServiceRequestStatus.DepositRequired, this.depositInvoiceHandler],
      [ServiceRequestStatus.InProgress, this.inProgressInvoiceHandler],
      [ServiceRequestStatus.PartiallyCompleted, this.completedInvoiceHandler],
      [
        ServiceRequestStatus.CompletedSuccessfully,
        this.completedInvoiceHandler,
      ],
    ]);
  }

  async createGuestConiergeServiceRequestInvoice(
    queryRunner: QueryRunner,
    serviceRequestMasterModels: ServiceRequestMasterModel[],
    serviceTypeRatesMap: Map<number, { [key: string]: number }>,
  ) {
    const invoiceMasters: InvoiceMasterModel[] = serviceRequestMasterModels.map(
      (serviceRequest) => {
        const invoiceMaster = new InvoiceMasterModel();
        invoiceMaster.service_request_master_id = serviceRequest.id;
        invoiceMaster.property_master_id = serviceRequest.property_master_id;
        invoiceMaster.owner_id = serviceRequest.owner_id;
        invoiceMaster.service_type_id = serviceRequest.service_type_id;
        invoiceMaster.vendor_id = serviceRequest.vendor_id;
        invoiceMaster.franchise_id = serviceRequest.franchise_id;
        invoiceMaster.invoice_status = InvoiceStatus.PaidByOwnerSuccess;
        invoiceMaster.vendor_total =
          serviceTypeRatesMap.get(serviceRequest.service_type_id)
            ?.vendor_rate || 0;
        invoiceMaster.franchise_total =
          serviceTypeRatesMap.get(serviceRequest.service_type_id)
            ?.guest_price || 0;
        invoiceMaster.vendor_remaining_balance =
          serviceTypeRatesMap.get(serviceRequest.service_type_id)
            ?.vendor_rate || 0;
        invoiceMaster.franchise_remaining_balance =
          serviceTypeRatesMap.get(serviceRequest.service_type_id)
            ?.guest_price || 0;
        invoiceMaster.auto_send_to_owner = true;
        invoiceMaster.send_to_owner_at = Math.floor(Date.now() / 1000);
        invoiceMaster.paid_by_owner_at = Math.floor(Date.now() / 1000);
        invoiceMaster.invoice_paid_at = Math.floor(Date.now() / 1000);
        return invoiceMaster;
      },
    );

    const savedInvoiceMasters = await queryRunner.manager.save(
      InvoiceMasterModel,
      invoiceMasters,
    );

    for (let i = 0; i < savedInvoiceMasters.length; i++) {
      await queryRunner.manager.update(
        ServiceRequestMasterModel,
        { id: savedInvoiceMasters[i].service_request_master_id },
        { invoice_master_id: savedInvoiceMasters[i].id },
      );
    }
    return savedInvoiceMasters;
  }

  async createInvoice(payload: CreateInvoiceV2, user: JwtPayload) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      const serviceRequestMasterModel: ServiceRequestMasterModel =
        await this.serviceRequestMasterRepository.findOne({
          where: {
            id: payload.service_request_id,
            franchise_id: Number(user.franchise_id),
            is_deleted: false,
          },
          relations: ['serviceRequestMasterLinen', 'serviceType'],
        });
      if (serviceRequestMasterModel.is_guest_concierge) {
        throw new BadRequestException(
          InvoiceMessage.GUEST_CONCIERGE_NOT_ALLOWED,
        );
      }
      if (
        serviceRequestMasterModel?.serviceRequestMasterLinen &&
        payload?.line_items?.length
      )
        throw new BadRequestException(
          InvoiceMessage.LINEN_LINE_ITEMS_NOT_ALLOWED,
        );
      if (
        ![
          ServiceRequestStatus.PartiallyCompleted,
          ServiceRequestStatus.CompletedSuccessfully,
        ].includes(serviceRequestMasterModel.status)
      )
        throw new BadRequestException(
          InvoiceMessage.SERVICE_REQUEST_NOT_COMPLETED,
        );

      const updPayload: { [key: string]: string | number } = {};

      const { invoice_master } = await this.createServiceRequestInvoice(
        queryRunner,
        serviceRequestMasterModel,
        payload?.line_items,
        user,
        serviceRequestMasterModel.status,
        null,
      );

      if (payload?.vendor_description)
        updPayload['vendor_description'] = payload?.vendor_description;

      if (invoice_master.invoice_status === InvoiceStatus.SentToOwner) {
        updPayload['send_to_owner_at'] = Math.floor(Date.now() / 1000);
      }

      if (Object.keys(updPayload).length > 0) {
        await queryRunner.manager.update(
          InvoiceMasterModel,
          { service_request_master_id: serviceRequestMasterModel.id },
          { ...updPayload, invoice_status: InvoiceStatus.SentToAdmin },
        );
      }

      await queryRunner.manager.update(
        ServiceRequestMasterModel,
        { id: serviceRequestMasterModel.id },
        { invoice_master_id: invoice_master.id },
      );
      await queryRunner.commitTransaction();
      const franchiseAdmin = await this.userRepository.findOne({
        where: {
          franchise_id: Number(user.franchise_id),
          user_type: UserType.FranchiseAdmin,
        },
      });
      this.notificationsService.sendNotification(
        NotificationAction.INVOICE_CREATED,
        {
          invoiceNumber: `${invoice_master.id}`,
          serviceRequestMasterId: `${serviceRequestMasterModel.id}`,
          link: this.configService.get('PORTAL_FRONTEND_URL'),
        },
        [franchiseAdmin.email],
        [franchiseAdmin.contact],
      );
      return invoice_master;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createServiceRequestInvoice(
    queryRunner: QueryRunner,
    serviceRequest: ServiceRequestMasterModel,
    lineItems: CreateInvoiceLineItemDto[],
    user: JwtPayload,
    status: ServiceRequestStatus,
    serviceRequestNote: string | null,
  ): Promise<InvoiceHandlerResponse> {
    if (serviceRequest.is_guest_concierge)
      throw new BadRequestException(InvoiceMessage.GUEST_CONCIERGE_NOT_ALLOWED);

    const incomingServiceRequestStatusUpdate =
      this.serviceRequestStatusProcessorMap.get(status);

    if (!incomingServiceRequestStatusUpdate) {
      throw new BadRequestException(
        InvoiceMessage.SERVICE_REQUEST_NOT_COMPLETED,
      );
    }

    const { invoice_master, line_items, has_prev_line_items } =
      await incomingServiceRequestStatusUpdate.initInvoice(
        queryRunner,
        serviceRequest,
        lineItems || [],
        user,
        serviceRequestNote,
      );

    if (line_items.length > 0)
      await this.addLineItems(
        queryRunner,
        line_items,
        invoice_master,
        user,
        status,
      );

    return { invoice_master, line_items, has_prev_line_items };
  }

  private async addLineItems(
    queryRunner: QueryRunner,
    lineItems: Partial<CreateInvoiceLineItemDto>[],
    invoice: InvoiceMasterModel,
    user: JwtPayload,
    status: ServiceRequestStatus,
  ): Promise<InvoiceLineItemModel[]> {
    const invoiceLineItems = lineItems.map((lineItem) => {
      const invLineItem = new InvoiceLineItemModel();
      invLineItem.line_item = lineItem.line_item;
      invLineItem.price = lineItem.price;
      invLineItem.invoice_master_id = invoice.id;
      invLineItem.is_vendor_line_item = lineItem?.franchise_admin_id
        ? false
        : lineItem?.vendor_id
          ? true
          : user.user_type === UserType.Vendor;
      (invLineItem.service_request_status = status),
        (invLineItem.computation_type = InvoiceLineItemComputationType.Add),
        (invLineItem.description = lineItem.description ?? null),
        (invLineItem.vendor_id = lineItem?.vendor_id
          ? lineItem?.vendor_id
          : user.user_type === UserType.Vendor
            ? user.id
            : null);
      invLineItem.franchise_admin_id = lineItem?.franchise_admin_id
        ? lineItem?.franchise_admin_id
        : null;
      invLineItem.section_id = lineItem?.section_id ?? InvoiceSection.Material;
      invLineItem.is_readonly = lineItem?.is_readonly ?? false;
      invLineItem.hours_worked = lineItem?.hours_worked ?? null;

      return invLineItem;
    });

    return await queryRunner.manager.save(invoiceLineItems);
  }

  async getAllInvoices(payload: GetAllInvoicesDtoV2, user: JwtPayload) {
    const paginationParams: IPaginationDBParams | null =
      this.generalHelper.getPaginationOptionsV2(payload);

    if (
      [
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.Vendor,
      ].includes(user.user_type) &&
      payload.download
    ) {
      this.logger.log('[EVENT] Emitting Invoices report preparation event');

      const { data, count } =
        await this.invoiceMasterRepository.getAllInvoicesV2(
          payload,
          user,
          null,
          payload.download,
        );

      if (count >= Setting.MAX_DIRECT_DOWNLOAD_ROWS) {
        // Send via email
        this.eventEmitter.emit(
          DownloadReportEventName.INVOICES,
          new GenericReportDownloadEvent(
            () =>
              this.invoiceMasterRepository.getAllInvoicesV2(
                payload,
                user,
                null,
                true,
              ),
            user,
          ),
        );
      } else {
        // Return data for download
        return { data, count };
      }
    } else {
      return await this.invoiceMasterRepository.getAllInvoicesV2(
        payload,
        user,
        paginationParams,
      );
    }
  }

  private async deleteInvoiceLineItems(
    queryRunner: QueryRunner,
    invoiceMaster: InvoiceMasterModel,
    user: JwtPayload,
  ) {
    await queryRunner.manager.delete(InvoiceLineItemModel, {
      invoice_master_id: invoiceMaster.id,
      vendor_id: invoiceMaster.vendor_id,
      ...([UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        user.user_type,
      ) && {
        franchise_admin_id:
          user.user_type === UserType.FranchiseAdmin
            ? user.id
            : user.franchise_admin,
      }),
    });
  }

  async updateInvoice(
    payload: UpdateInvoiceV2,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      if (
        [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        ) &&
        !payload.vendor_id
      )
        throw new BadRequestException(InvoiceMessage.VENDOR_ID_MISSING);

      if (
        ![UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        ) &&
        payload?.status
      )
        throw new BadRequestException(InvoiceMessage.UNAUTHORIZED);

      const invoiceMaster = await this.invoiceMasterRepository.findOne({
        where: {
          id: payload.invoice_master_id,
          franchise_id: Number(user.franchise_id),
          is_deleted: false,
          vendor_id:
            user.user_type === UserType.Vendor
              ? Number(user.id)
              : payload.vendor_id,
          // TODO: add payment success condition so that only unpaid invoices can be updated
        },
        relations: ['service_request_master', 'invoice_service_type'],
      });

      if (!invoiceMaster)
        throw new BadRequestException(InvoiceMessage.INVOICE_NOT_FOUND);

      if (
        [
          InvoiceStatus.SentToOwner,
          InvoiceStatus.PaidByOwnerSuccess,
          InvoiceStatus.PaidByOwnerProcessing,
          InvoiceStatus.PaidByOwnerFailed,
        ].includes(invoiceMaster.invoice_status) ||
        ([InvoiceStatus.SentToAdmin].includes(invoiceMaster.invoice_status) &&
          user.user_type === UserType.Vendor) ||
        (user.user_type === UserType.Vendor &&
          invoiceMaster.service_request_master.status ===
            ServiceRequestStatus.DepositRequired)
      ) {
        throw new BadRequestException(InvoiceMessage.INVALID_ACTION);
      }

      let totalAmount =
        payload.line_items?.reduce(
          (sum, item) => sum + Number(item.price),
          0,
        ) || 0;

      const isHourly =
        invoiceMaster?.invoice_service_type?.standard_hourly ||
        invoiceMaster?.invoice_service_type?.is_handyman_concierge;

      if (
        [
          ServiceRequestStatus.PartiallyCompleted,
          ServiceRequestStatus.CompletedSuccessfully,
        ].includes(invoiceMaster?.service_request_master?.status) &&
        [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        ) &&
        invoiceMaster?.deposit_paid &&
        isHourly &&
        payload?.line_items.some(
          (item) =>
            item.service_request_status ===
            ServiceRequestStatus.DepositRequired,
        )
      ) {
        const depositTotalAmount =
          payload?.line_items
            .filter(
              (item) =>
                item.service_request_status ===
                ServiceRequestStatus.DepositRequired,
            )
            .reduce((sum, item) => sum + Number(item.price), 0) || 0;
        totalAmount -= depositTotalAmount;
      }

      if (isHourly) {
        const hoursLineItem = payload.line_items?.find(
          (item) => item?.section_id === InvoiceSection.Labor,
        );

        if (hoursLineItem) {
          totalAmount -= Number(hoursLineItem.price);
          totalAmount +=
            Number(hoursLineItem.price) * Number(hoursLineItem.hours_worked);
        }
      }

      const invoiceStatus = await this.getInvoiceStatus(invoiceMaster, user);

      if (invoiceStatus === InvoiceStatus.SentToOwner && payload?.status) {
        await queryRunner.manager.update(
          InvoiceMasterModel,
          {
            service_request_master_id:
              invoiceMaster.service_request_master.parent_id,
          },
          { invoice_status: payload?.status, next_invoice_status: null },
        );
      }

      const updatePayload: Partial<InvoiceMasterModel> = {
        ...(user.user_type === UserType.Vendor && {
          vendor_description:
            payload.vendor_description ?? invoiceMaster.vendor_description,
          ...(user.user_type === UserType.Vendor && {
            vendor_total: totalAmount,
            vendor_remaining_balance: invoiceMaster.deposit_paid
              ? totalAmount - invoiceMaster.deposit_amount
              : totalAmount,
          }),
          invoice_status: InvoiceStatus.SentToAdmin,
        }),
        ...([UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        ) && {
          franchise_description:
            payload.franchise_description ??
            invoiceMaster.franchise_description,
          franchise_total: totalAmount,
          invoice_status:
            invoiceStatus && payload?.status
              ? invoiceStatus
              : payload?.status
                ? payload?.status
                : invoiceMaster.invoice_status,
          next_invoice_status:
            invoiceStatus && payload?.status ? payload?.status : null,
          send_to_owner_at: payload?.status
            ? Math.floor(Date.now() / 1000)
            : null,
          franchise_remaining_balance: invoiceMaster.deposit_paid
            ? totalAmount - invoiceMaster.deposit_amount
            : totalAmount,
          franchise_updated_at: Math.floor(Date.now() / 1000),
        }),
      };

      await queryRunner.manager.update(
        InvoiceMasterModel,
        { id: payload.invoice_master_id },
        updatePayload,
      );

      if (
        payload?.status &&
        payload?.status === InvoiceStatus.SentToOwner &&
        [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        )
      ) {
        let ownerPaymentDetailsModel: OwnerPaymentDetailsModel =
          await this.ownerPaymentDetailsRepository.findOne({
            where: { invoice_master_id: payload.invoice_master_id },
          });

        if (!ownerPaymentDetailsModel)
          ownerPaymentDetailsModel = new OwnerPaymentDetailsModel();

        ownerPaymentDetailsModel.invoice_master_id = payload.invoice_master_id;
        ownerPaymentDetailsModel.payment_status = PaymentStatus.Unpaid;
        ownerPaymentDetailsModel.franchise_admin_id = Number(
          user.user_type === UserType.FranchiseAdmin
            ? user.id
            : user.franchise_admin,
        );
        ownerPaymentDetailsModel.invoice_total_after_sales_tax =
          updatePayload.franchise_remaining_balance;

        await queryRunner.manager.save(
          OwnerPaymentDetailsModel,
          ownerPaymentDetailsModel,
        );
      }

      await this.deleteInvoiceLineItems(queryRunner, invoiceMaster, user);

      let newLineItems: Partial<CreateInvoiceLineItemDto>[] =
        payload.line_items.map((lineItem) => ({
          ...lineItem,
          is_vendor_line_item: [
            UserType.FranchiseAdmin,
            UserType.StandardAdmin,
          ].includes(user.user_type)
            ? false
            : true,
          vendor_id: invoiceMaster.vendor_id,
          franchise_admin_id: [
            UserType.FranchiseAdmin,
            UserType.StandardAdmin,
          ].includes(user.user_type)
            ? user.user_type === UserType.FranchiseAdmin
              ? Number(user.id)
              : Number(user.franchise_admin)
            : null,
        }));

      const franchiseAdmin = await this.userRepository.findOne({
        where: {
          franchise_id: Number(user.franchise_id),
          user_type: UserType.FranchiseAdmin,
        },
      });

      if (user.user_type === UserType.Vendor) {
        const faLineItems: Partial<CreateInvoiceLineItemDto>[] =
          payload.line_items.map((lineItem) => ({
            ...lineItem,
            is_vendor_line_item: false,
            vendor_id: invoiceMaster.vendor_id,
            franchise_admin_id: franchiseAdmin.id,
          }));

        if (faLineItems.length > 0) {
          newLineItems = [...newLineItems, ...faLineItems];
        }
      }

      await this.addLineItems(
        queryRunner,
        newLineItems,
        invoiceMaster,
        user,
        invoiceMaster.service_request_master.status,
      );

      await queryRunner.commitTransaction();
      if (user.user_type === UserType.Vendor) {
        this.notificationsService.sendNotification(
          NotificationAction.INVOICE_UPDATED,
          {
            invoiceNumber: `${invoiceMaster.id}`,
            serviceRequestMasterId: `${invoiceMaster.service_request_master.id}`,
            link: this.configService.get('PORTAL_FRONTEND_URL'),
          },
          [franchiseAdmin.email],
          [franchiseAdmin.contact],
        );
      } else if (
        [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        ) &&
        payload?.status
      ) {
        const owner = await this.userRepository.findOne({
          where: {
            franchise_id: Number(user.franchise_id),
            user_type: UserType.Owner,
            id: invoiceMaster.owner_id,
          },
        });
        this.notificationsService.sendNotification(
          NotificationAction.INVOICE_SENT_TO_OWNER,
          {
            invoiceNumber: `${invoiceMaster.id}`,
            serviceRequestMasterId: `${invoiceMaster.service_request_master.id}`,
            link: this.configService.get('PORTAL_FRONTEND_URL'),
          },
          [owner.email],
          [owner.contact],
        );
      }
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getInvoiceStatus(
    invoiceMaster: InvoiceMasterModel,
    user: JwtPayload,
  ): Promise<InvoiceStatus | null> {
    if (
      (!invoiceMaster?.service_request_master?.is_parent &&
        !invoiceMaster?.service_request_master?.parent_id) ||
      user.user_type === UserType.Vendor
    )
      return null;

    if (invoiceMaster?.service_request_master?.is_parent) {
      const serviceRequests = await this.serviceRequestMasterRepository.find({
        parent_id: invoiceMaster.service_request_master_id,
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
        ? InvoiceStatus.SentToOwner
        : InvoiceStatus.OnHold;
    }

    if (invoiceMaster?.service_request_master?.parent_id) {
      const parentInvoiceMaster = await this.invoiceMasterRepository.findOne({
        where: {
          service_request_master_id:
            invoiceMaster.service_request_master.parent_id,
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

  async getInvoice(
    invoice_master_id: number,
    user: JwtPayload,
  ): Promise<InvoiceMasterModel> {
    const invoiceMaster = await this.invoiceMasterRepository.getInvoiceById(
      invoice_master_id,
      user,
    );

    if (!invoiceMaster)
      throw new BadRequestException(InvoiceMessage.INVOICE_NOT_FOUND);

    const { created_date, due_date } = this.handleDates(invoiceMaster) || {};
    invoiceMaster.created_date = created_date;
    invoiceMaster.due_date = due_date;
    invoiceMaster.franchise_updated_at_formatted =
      invoiceMaster.franchise_updated_at
        ? moment
            .unix(Number(invoiceMaster.franchise_updated_at))
            .format('MM/DD/YYYY [at] hh:mm A')
        : null;
    invoiceMaster.send_to_owner_at_formatted = invoiceMaster.send_to_owner_at
      ? moment
          .unix(Number(invoiceMaster.send_to_owner_at))
          .format('MM/DD/YYYY [at] hh:mm A')
      : null;
    invoiceMaster.paid_by_owner_at_formatted = invoiceMaster.paid_by_owner_at
      ? moment
          .unix(Number(invoiceMaster.paid_by_owner_at))
          .format('MM/DD/YYYY [at] hh:mm A')
      : null;

    if (
      user.user_type === UserType.Vendor &&
      invoiceMaster.vendor_id != Number(user.id)
    ) {
      throw new BadRequestException(InvoiceMessage.INVALID_ACTION);
    }

    if (
      invoiceMaster?.send_to_owner_at &&
      invoiceMaster.invoice_status === InvoiceStatus.SentToOwner
    ) {
      invoiceMaster.invoice_status =
        moment().diff(
          moment.unix(Number(invoiceMaster?.send_to_owner_at)),
          'days',
        ) > 14
          ? InvoiceStatus.OverDue
          : invoiceMaster.invoice_status;
    }

    if (
      ![
        ServiceRequestStatus.PartiallyCompleted,
        ServiceRequestStatus.CompletedSuccessfully,
      ].includes(invoiceMaster.service_request_master.status)
    ) {
      invoiceMaster.invoice_line_items =
        invoiceMaster.invoice_line_items.filter(
          (item) =>
            item.service_request_status ===
            ServiceRequestStatus.DepositRequired,
        );
    }

    if (
      [UserType.StandardAdmin, UserType.FranchiseAdmin].includes(
        Number(user.user_type),
      ) &&
      invoiceMaster.invoice_line_items.length
    ) {
      const vendorLineItems = invoiceMaster.invoice_line_items.filter(
        (item) =>
          item.vendor_id == invoiceMaster.vendor_id &&
          item.franchise_admin_id == null,
      );

      const franchiseLineItems = invoiceMaster.invoice_line_items.filter(
        (item) => item.franchise_admin_id == Number(user.id),
      );

      invoiceMaster.invoice_line_items =
        franchiseLineItems.length > 0
          ? [...franchiseLineItems]
          : [...vendorLineItems];

      invoiceMaster.vendorLineItems =
        this.groupLineItemsBySection(vendorLineItems);
      invoiceMaster.franchiseGroupedLineItems =
        this.groupLineItemsBySection(franchiseLineItems);
    }

    if (user.user_type == UserType.Owner && invoiceMaster.invoice_line_items) {
      if (invoiceMaster.owner_id != Number(user.id)) {
        throw new BadRequestException(InvoiceMessage.INVALID_ACTION);
      }

      const filterFranchiseLineItems = invoiceMaster.invoice_line_items.filter(
        (item) => item.franchise_admin_id != null,
      );

      invoiceMaster.invoice_line_items = [...filterFranchiseLineItems];
      invoiceMaster.franchiseGroupedLineItems = this.groupLineItemsBySection(
        filterFranchiseLineItems,
      );
    }

    if (
      [
        ServiceRequestStatus.PartiallyCompleted,
        ServiceRequestStatus.CompletedSuccessfully,
      ].includes(invoiceMaster.service_request_master.status) &&
      [
        UserType.StandardAdmin,
        UserType.FranchiseAdmin,
        UserType.Vendor,
      ].includes(user.user_type)
    ) {
      invoiceMaster.invoice_line_items =
        invoiceMaster.invoice_line_items.filter(
          (item) =>
            item.service_request_status !==
            ServiceRequestStatus.DepositRequired,
        );
    }

    if (
      invoiceMaster?.service_request_master?.is_parent &&
      [
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.Owner,
      ].includes(user.user_type)
    ) {
      const { data: childInvoiceMaster } =
        await this.invoiceMasterRepository.getAllInvoicesV2(
          {
            parent_service_request_id:
              invoiceMaster?.service_request_master?.id,
          } as GetAllInvoicesDtoV2,
          user,
          { limit: 1000, offset: 0 },
        );

      invoiceMaster.child_invoices = childInvoiceMaster;

      const secondaryRequests = childInvoiceMaster.filter(
        (invoice: InvoiceMasterModel) =>
          ![
            InvoiceStatus.SentToOwner,
            InvoiceStatus.OverDue,
            InvoiceStatus.PaidByOwnerFailed,
          ].includes(invoice.invoice_status),
      );

      invoiceMaster.secondary_requests = secondaryRequests;
    }

    return invoiceMaster;
  }

  async getDownloadUrl(mediaUrl: string) {
    try {
      return await this.s3Service.getDownloadUrl(mediaUrl);
    } catch (err) {
      this.logger.error(`Download URL Issue == > ${JSON.stringify(err)}`);
      return null;
    }
  }

  async upsertInvoicePaymentDetails(
    payload: UpsertInvoicePaymentDetailsDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      let sendPaymentEmailToOwner = false;
      const invoiceMaster = await this.invoiceMasterRepository.findOne({
        where: {
          id: payload.invoice_master_id,
          is_deleted: false,
        },
      });

      if (!invoiceMaster)
        throw new BadRequestException(InvoiceMessage.INVOICE_NOT_FOUND);

      if (
        payload.owner_payment_details &&
        [
          InvoiceStatus.Created,
          InvoiceStatus.SentToAdmin,
          InvoiceStatus.RejectedAndSentToVendor,
        ].includes(invoiceMaster.invoice_status)
      )
        throw new BadRequestException(InvoiceMessage.INVALID_ATTEMPT);

      if (!payload.owner_payment_details && !payload.vendor_id) {
        throw new BadRequestException(InvoiceMessage.VENDOR_ID_MISSING);
      }

      if (
        !payload.owner_payment_details &&
        invoiceMaster.vendor_id != payload.vendor_id
      )
        throw new BadRequestException(InvoiceMessage.INVALID_SERVICE_PARTNER);

      const isInvoicePaid = [
        InvoiceStatus.PaidByOwnerSuccess,
        InvoiceStatus.PaidByOwnerProcessing,
      ].includes(invoiceMaster.invoice_status);

      if (payload.owner_payment_details) {
        let ownerPaymentDetailsModel: OwnerPaymentDetailsModel =
          await this.ownerPaymentDetailsRepository.findOne({
            where: { invoice_master_id: payload.invoice_master_id },
          });

        if (isInvoicePaid && ownerPaymentDetailsModel) {
          await queryRunner.manager.update(
            OwnerPaymentDetailsModel,
            { invoice_master_id: payload.invoice_master_id },
            {
              amount_paid:
                payload?.amount_paid ?? ownerPaymentDetailsModel.amount_paid,
            },
          );
          return true;
        }

        if (!ownerPaymentDetailsModel)
          ownerPaymentDetailsModel = new OwnerPaymentDetailsModel();

        if (!isInvoicePaid) {
          ownerPaymentDetailsModel.payment_type = payload.payment_type;
          ownerPaymentDetailsModel.payment_status =
            payload.payment_status ?? null;
          ownerPaymentDetailsModel.cheque_number =
            payload.cheque_number ?? null;
          ownerPaymentDetailsModel.invoice_total_after_sales_tax =
            invoiceMaster.franchise_remaining_balance;
          ownerPaymentDetailsModel.send_request_to_owner =
            payload.send_request_to_owner ?? false;

          if (
            payload.payment_status &&
            payload.payment_status === PaymentStatus.Paid
          ) {
            await queryRunner.manager.update(
              InvoiceMasterModel,
              { id: invoiceMaster.id },
              {
                invoice_status: InvoiceStatus.PaidByOwnerSuccess,
                invoice_paid_at: Math.floor(Date.now() / 1000),
                paid_by_owner_at: Math.floor(Date.now() / 1000),
              },
            );
            sendPaymentEmailToOwner = true;
          }
        }

        ownerPaymentDetailsModel.amount_paid = payload.amount_paid ?? 0;
        ownerPaymentDetailsModel.franchise_admin_id = user.id;
        ownerPaymentDetailsModel.invoice_master_id = payload.invoice_master_id;

        await queryRunner.manager.save(
          OwnerPaymentDetailsModel,
          ownerPaymentDetailsModel,
        );
      } else {
        let vendorPaymentDetails =
          await this.vendorPaymentDetailsRepository.findOne({
            where: { invoice_master_id: payload.invoice_master_id },
          });
        if (!vendorPaymentDetails)
          vendorPaymentDetails = new VendorPaymentDetailsModel();

        vendorPaymentDetails.invoice_master_id = payload.invoice_master_id;
        vendorPaymentDetails.payment_type = payload.payment_type;
        vendorPaymentDetails.payment_status = payload.payment_status;
        vendorPaymentDetails.amount_paid = payload.amount_paid;
        vendorPaymentDetails.vendor_id = payload.vendor_id;
        vendorPaymentDetails.franchise_admin_id = user.id;
        vendorPaymentDetails.cheque_number = payload.cheque_number ?? null;

        await queryRunner.manager.save(vendorPaymentDetails);
      }

      await queryRunner.commitTransaction();

      if (sendPaymentEmailToOwner) {
        const owner: UserModel = await this.userRepository.findOne({
          where: {
            id: invoiceMaster.owner_id,
            franchise_id: Number(user.franchise_id),
            user_type: UserType.Owner,
          },
        });
        this.notificationsService.sendNotification(
          NotificationAction.INVOICE_PAYMENT_RECORDED_BY_FRANCHISE_ADMIN,
          {
            invoiceNumbers: `${invoiceMaster.id}`,
            link: this.configService.get('PORTAL_FRONTEND_URL'),
          },
          [owner.email],
          [owner.contact],
        );
      }

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTotalDue(user: JwtPayload): Promise<
    | number
    | {
        total_due: number;
        total_overdue: number;
      }
  > {
    const totalDue = await this.invoiceMasterRepository.getTotalDue(user);

    if (user.user_type === UserType.Vendor) {
      return totalDue?.[0];
    }

    return {
      total_due: Number(totalDue?.[0]?.total_due),
      total_overdue: Number(totalDue?.[0]?.total_overdue),
    };
  }

  async updateInvoiceStatus(payload: UpdateInvoiceStatusDto) {
    const invoiceMaster = await this.invoiceMasterRepository.findOne({
      where: {
        id: payload.invoice_master_id,
        is_deleted: false,
      },
    });

    if (!invoiceMaster)
      throw new BadRequestException(InvoiceMessage.INVOICE_NOT_FOUND);

    if (
      ![InvoiceStatus.Created, InvoiceStatus.SentToAdmin].includes(
        Number(invoiceMaster.invoice_status),
      )
    ) {
      throw new BadRequestException(InvoiceMessage.INVALID_STATUS);
    }

    if (
      [
        InvoiceStatus.SentToOwner,
        InvoiceStatus.PaidByOwnerSuccess,
        InvoiceStatus.PaidByOwnerFailed,
        InvoiceStatus.PaidByOwnerProcessing,
        InvoiceStatus.RejectedAndSentToVendor,
      ].includes(invoiceMaster.invoice_status)
    ) {
      throw new BadRequestException(InvoiceMessage.INVOICE_CANNOT_UPDATE);
    }

    if (payload.status === InvoiceStatus.RejectedAndSentToVendor) {
      this.logger.log('Send Notification to Vendor');
    }

    if (payload.status === InvoiceStatus.SentToOwner) {
      this.logger.log('Send Notification to Owner');
    }

    await this.invoiceMasterRepository.update(
      { id: invoiceMaster.id },
      { invoice_status: payload.status },
    );
  }

  async invoicePay(payload: ProcessPaymentDto, user: JwtPayload) {
    if (!payload.pay_all_invoices && payload.invoice_master_ids.length) {
      const invoices = await this.invoiceMasterRepository.find({
        id: In(payload.invoice_master_ids),
        owner_id: Number(user.id),
        invoice_status: In([
          InvoiceStatus.SentToOwner,
          InvoiceStatus.PaidByOwnerFailed,
        ]),
        is_deleted: false,
      });

      if (invoices.length !== payload.invoice_master_ids.length) {
        throw new BadRequestException(InvoiceMessage.INVOICE_NOT_FOUND);
      }
    }

    const getTotal =
      await this.invoiceMasterRepository.getTotalRemainingBalance(
        user,
        payload?.invoice_master_ids || [],
      );

    if (!getTotal?.length || getTotal?.[0]?.total_remaining_balance <= 0) {
      throw new BadRequestException(InvoiceMessage.GENERATE_INVOICE_FAILED);
    }

    const invIdentifier = uuidv4();

    const updateCondition = payload?.invoice_master_ids?.length
      ? {
          id: In(payload?.invoice_master_ids),
        }
      : {
          invoice_status: In([
            InvoiceStatus.SentToOwner,
            InvoiceStatus.PaidByOwnerFailed,
          ]),
        };

    await this.invoiceMasterRepository.update(updateCondition, {
      invoice_uuid: invIdentifier,
      invoice_status: InvoiceStatus.PaidByOwnerProcessing,
      payment_method_id: payload.payment_method_id,
    });

    const response = await this.paymentService.pay({
      user,
      amount: Number(getTotal?.[0]?.total_remaining_balance),
      payment_method_id: payload.payment_method_id,
      metadata: {
        invoice_identifier: invIdentifier,
        owner_id: user.id,
        payment_method_id: payload?.payment_method_id,
      },
    });

    if (response.error) {
      await this.invoiceMasterRepository.update(updateCondition, {
        invoice_uuid: null,
        invoice_status: InvoiceStatus.SentToOwner,
        payment_method_id: null,
      });
      throw new BadRequestException(response.data);
    }

    return true;
  }

  async updateFranchiseWorkDescription(
    payload: UpdateWorkDescriptionDto,
    user: JwtPayload,
  ): Promise<boolean> {
    const invoiceMaster: InvoiceMasterModel =
      await this.invoiceMasterRepository.findOne({
        where: {
          id: payload.invoice_master_id,
          franchise_id: Number(user.franchise_id),
          auto_send_to_owner: true,
          invoice_status: Not(
            In([
              InvoiceStatus.Created,
              InvoiceStatus.RejectedAndSentToVendor,
              InvoiceStatus.SentToAdmin,
            ]),
          ),
        },
      });

    if (!invoiceMaster)
      throw new BadRequestException(InvoiceMessage.INVOICE_NOT_FOUND);

    await this.invoiceMasterRepository.update(
      {
        id: payload.invoice_master_id,
        franchise_id: Number(user.franchise_id),
      },
      {
        franchise_description: payload.franchise_description,
      },
    );

    return true;
  }

  async getTotalRemainingBalance(user: JwtPayload) {
    const getTotal =
      await this.invoiceMasterRepository.getTotalRemainingBalance(user);

    return getTotal?.[0]?.total_remaining_balance || 0;
  }

  private groupLineItemsBySection(
    items: InvoiceLineItemModel[],
  ): { section_id: InvoiceSection; data: InvoiceLineItemModel[] }[] {
    return Object.values(
      items.reduce(
        (acc, item) => {
          if (!acc[item.section_id]) {
            acc[item.section_id] = {
              section_id: item.section_id,
              data: [],
            };
          }
          acc[item.section_id].data.push(item);
          return acc;
        },
        {} as Record<
          InvoiceSection,
          { section_id: InvoiceSection; data: InvoiceLineItemModel[] }
        >,
      ),
    );
  }

  private handleDates(invoiceMaster: InvoiceMasterModel) {
    if (invoiceMaster.created_at) {
      const createdDate = moment(invoiceMaster.created_at * 1000);
      const dueDate = createdDate.clone().add(15, 'days');
      return {
        created_date: createdDate.format('MMM D, YYYY'),
        due_date: dueDate.format('MMM D, YYYY'),
      };
    }
  }

  async addGuestConciergeLineItems(
    queryRunner: QueryRunner,
    serviceRequestMaster: ServiceRequestMasterModel,
    user: JwtPayload,
  ): Promise<boolean> {
    const invoiceMaster = await this.invoiceMasterRepository.findOne({
      where: {
        service_request_master_id: Number(serviceRequestMaster.id),
      },
    });
    const franchiseAdmin = await this.userRepository.findOne({
      where: {
        franchise_id: Number(user.franchise_id),
        user_type: UserType.FranchiseAdmin,
      },
    });

    const lineItems: CreateInvoiceLineItemDto[] = [
      {
        line_item: 'Guest Rate',
        price: invoiceMaster.franchise_total,
        invoice_master_id: invoiceMaster.id,
        is_vendor_line_item: false,
        computation_type: InvoiceLineItemComputationType.Add,
        section_id: InvoiceSection.Material,
        vendor_id: serviceRequestMaster.vendor_id,
        franchise_admin_id: franchiseAdmin.id,
      },
      {
        line_item: 'Vendor Rate',
        price: invoiceMaster.vendor_total,
        invoice_master_id: invoiceMaster.id,
        is_vendor_line_item: true,
        computation_type: InvoiceLineItemComputationType.Add,
        section_id: InvoiceSection.Material,
        vendor_id: serviceRequestMaster.vendor_id,
        franchise_admin_id: null,
      },
    ];

    await this.addLineItems(
      queryRunner,
      lineItems,
      invoiceMaster,
      user,
      serviceRequestMaster.status as ServiceRequestStatus,
    );

    return true;
  }

  async getMaterialItems(
    serviceRequestId: number,
    user: JwtPayload,
  ): Promise<MaterialItems[]> {
    const serviceRequestMasterModel: ServiceRequestMasterModel =
      await this.serviceRequestMasterRepository.findOne({
        where: [
          {
            id: serviceRequestId,
            is_deleted: false,
            franchise_id: Number(user.franchise_id),
            status: ServiceRequestStatus.InProgress,
          },
          {
            id: serviceRequestId,
            is_deleted: false,
            franchise_id: Number(user.franchise_id),
            status: ServiceRequestStatus.DepositRequired,
          },
        ],
      });

    if (!serviceRequestMasterModel)
      throw new BadRequestException(
        ServiceRequestMessage.SERVICE_REQUEST_NOT_FOUND,
      );

    let estimateDetails: MaterialItems[] = [];

    if (serviceRequestMasterModel?.estimate_master_id) {
      estimateDetails = (
        await this.estimateDetailsRepository.find({
          estimate_master_id: serviceRequestMasterModel?.estimate_master_id,
          vendor_id: serviceRequestMasterModel?.vendor_id,
          is_grand_total: false,
          franchise_admin_id: IsNull(),
        })
      ).map((item) => ({
        line_item: item.line_item,
        price: item.price,
        section_id: InvoiceSection.Material,
        description: item.description,
        id: item.id,
      }));
    }

    const invoiceMaster = await this.invoiceMasterRepository.findOne({
      where: {
        service_request_master_id: serviceRequestId,
      },
    });

    if (!invoiceMaster) return [...estimateDetails];

    const invoiceLineItems = await this.invoiceLineItemRepository.find({
      invoice_master_id: invoiceMaster.id,
      service_request_status: ServiceRequestStatus.InProgress,
    });

    return invoiceLineItems.map((item) => ({
      line_item: item.line_item,
      price: item.price,
      section_id: item.section_id,
      description: item.description,
      id: item.id,
    }));
  }

  async resetVendorInvoice(
    queryRunner: QueryRunner,
    serviceRequestId: number,
    vendorId: number,
  ): Promise<boolean> {
    const invoiceMasterModel = await this.invoiceMasterRepository.findOne({
      where: {
        service_request_master_id: serviceRequestId,
        vendor_id: vendorId,
      },
    });

    if (!invoiceMasterModel) return true;

    await queryRunner.manager.delete(InvoiceLineItemModel, {
      invoice_master_id: invoiceMasterModel.id,
    });

    await queryRunner.manager.delete(OwnerPaymentDetailsModel, {
      invoice_master_id: invoiceMasterModel.id,
    });

    await queryRunner.manager.delete(InvoiceMasterModel, {
      id: invoiceMasterModel.id,
    });

    return true;
  }
}
