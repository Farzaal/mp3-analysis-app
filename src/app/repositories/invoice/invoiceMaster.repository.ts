import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { DataSource, QueryRunner } from 'typeorm';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GetAllInvoicesDtoV2 } from '@/invoice/invoice.dto';
import { InvoiceStatus } from '@/app/contracts/enums/invoice.enum';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';

@Injectable()
export class InvoiceMasterRepository extends PostgresRepository<InvoiceMasterModel> {
  constructor(dataSource: DataSource) {
    super(InvoiceMasterModel, dataSource);
  }
  async getAllInvoicesV2(
    payload: GetAllInvoicesDtoV2,
    user: JwtPayload,
    paginationParams: IPaginationDBParams,
    isDownload: boolean = false,
  ) {
    const query = `SELECT
      IVM.ID,
      IVM.SERVICE_REQUEST_MASTER_ID,
      IVM.PROPERTY_MASTER_ID,
      IVM.VENDOR_ID,
      IVM.VENDOR_DESCRIPTION,
      IVM.FRANCHISE_DESCRIPTION,
      ${
        user.user_type === UserType.Vendor
          ? `IVM.VENDOR_TOTAL, 
             IVM.VENDOR_REMAINING_BALANCE,`
          : ''
      }
      ${
        [
          UserType.FranchiseAdmin,
          UserType.StandardAdmin,
          UserType.Owner,
        ].includes(user.user_type)
          ? `IVM.FRANCHISE_TOTAL, 
             IVM.FRANCHISE_REMAINING_BALANCE::TEXT,
             IVM.VENDOR_TOTAL, 
             IVM.SEND_TO_OWNER_AT,
             IVM.INVOICE_PAID_AT,
             IVM.VENDOR_REMAINING_BALANCE::TEXT,
             IVM.FRANCHISE_TOTAL - IVM.VENDOR_TOTAL AS MARGIN,
             OPD.PAYMENT_TYPE, 
            CASE
              WHEN IVM.INVOICE_STATUS = '${InvoiceStatus.SentToOwner}' AND IVM.SEND_TO_OWNER_AT IS NOT NULL AND (CURRENT_DATE - TO_TIMESTAMP(IVM.SEND_TO_OWNER_AT)::DATE) > 14 THEN '${InvoiceStatus.OverDue}'
              ELSE IVM.INVOICE_STATUS
            END AS INVOICE_STATUS,`
          : 'IVM.INVOICE_STATUS,'
      } 
      IVM.DEPOSIT_AMOUNT,
      IVM.DEPOSIT_REQUIRED_BY,
      IVM.DEPOSIT_PAID_BY,
      IVM.PAYMENT_METHOD_ID,
      IVM.FRANCHISE_ID,
      IVM.CURRENT_PAYMENT_LOG_ID,
      IVM.PAID_BY_OWNER_AT,
      IVM.CURRENT_PAYMENT_LOG_ID,
      TO_CHAR(TO_TIMESTAMP(IVM.CREATED_AT), 'MM-DD-YYYY') AS CREATED_AT,
      CONCAT(PM.PROPERTY_NICK_NAME, ' - ', PM.ADDRESS) AS PROPERTY_NAME_ADDRESS,
      CONCAT(OWN.FIRST_NAME, ' - ', OWN.LAST_NAME) AS OWNER_NAME,
      PM.ADDRESS,
      PM.PROPERTY_NICK_NAME,
      VPD.PAYMENT_STATUS AS VENDOR_PAYMENT_STATUS,
      U.ID AS VENDOR_ID,
      CONCAT(U.FIRST_NAME, ' ', U.LAST_NAME) AS VENDOR_NAME,
      ST.ID AS SERVICE_TYPE_ID,
      ST.TITLE AS SERVICE_TYPE_TITLE,
      STC.ID AS SERVICE_TYPE_CATEGORY_ID,
      STC.TITLE AS SERVICE_TYPE_CATEGORY_TITLE,
      TO_CHAR(SRM.START_DATE, 'MM-DD-YYYY') AS SERVICE_DATE,
      SRM.IS_PARENT AS IS_PARENT
    FROM INVOICE_MASTERS IVM
    LEFT JOIN PROPERTY_MASTERS PM 
    ON IVM.PROPERTY_MASTER_ID = PM.ID
    LEFT JOIN SERVICE_REQUEST_MASTERS SRM 
    ON IVM.SERVICE_REQUEST_MASTER_ID = SRM.ID
    LEFT JOIN USERS U 
    ON IVM.VENDOR_ID = U.ID
    LEFT JOIN USERS OWN
    ON IVM.OWNER_ID = OWN.ID
    LEFT JOIN VENDOR_PAYMENT_DETAILS VPD
    ON IVM.ID = VPD.INVOICE_MASTER_ID
    LEFT JOIN SERVICE_TYPES ST  
    ON IVM.SERVICE_TYPE_ID = ST.ID
    LEFT JOIN SERVICE_TYPE_CATEGORIES STC  
    ON ST.SERVICE_TYPE_CATEGORY_ID = STC.ID
    LEFT JOIN OWNER_PAYMENT_DETAILS OPD
    ON IVM.ID = OPD.INVOICE_MASTER_ID
    WHERE IVM.FRANCHISE_ID = ${user.franchise_id}
    ${payload.property_master_id ? `AND IVM.PROPERTY_MASTER_ID = ${payload.property_master_id}` : ''}
    ${
      user.user_type === UserType.Owner
        ? `
      AND IVM.OWNER_ID = ${user.id} 
      AND IVM.INVOICE_STATUS IN ('${InvoiceStatus.PaidByOwnerSuccess}', '${InvoiceStatus.PaidByOwnerProcessing}', '${InvoiceStatus.PaidByOwnerFailed}', '${InvoiceStatus.SentToOwner}')`
        : ''
    }
    ${
      user.user_type === UserType.Vendor || payload?.vendor_id
        ? `AND IVM.VENDOR_ID = ${payload?.vendor_id ?? user.id}
           AND SRM.INVOICE_MASTER_ID IS NOT NULL`
        : ''
    }
    ${
      [
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.Owner,
      ].includes(user.user_type) && payload?.owner_payment_status
        ? `${
            [InvoiceStatus.OverDue, InvoiceStatus.SentToOwner].includes(
              payload?.owner_payment_status,
            )
              ? `AND IVM.SEND_TO_OWNER_AT IS NOT NULL AND (CURRENT_DATE - TO_TIMESTAMP(IVM.SEND_TO_OWNER_AT)::DATE) ${payload?.owner_payment_status === InvoiceStatus.OverDue ? '>' : '<'} 14
                 AND IVM.INVOICE_STATUS = '${InvoiceStatus.SentToOwner}'`
              : `AND IVM.INVOICE_STATUS = '${payload.owner_payment_status}'`
          }`
        : ''
    } 
    ${
      [
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.Vendor,
      ].includes(user.user_type) && payload?.vendor_payment_status
        ? `AND VPD.PAYMENT_STATUS = '${payload?.vendor_payment_status}'`
        : ''
    } 
    ${
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        user.user_type,
      ) &&
      !payload?.vendor_payment_status &&
      !payload?.owner_payment_status
        ? `AND IVM.INVOICE_STATUS IN ('${InvoiceStatus.PaidByOwnerSuccess}', '${InvoiceStatus.PaidByOwnerProcessing}', '${InvoiceStatus.PaidByOwnerFailed}', '${InvoiceStatus.SentToOwner}', '${InvoiceStatus.SentToAdmin}')`
        : ''
    } 
    ${payload.service_type_id ? `AND IVM.SERVICE_TYPE_ID = ${payload.service_type_id}` : ''}
    ${payload.parent_service_request_id ? `AND SRM.PARENT_ID = ${payload.parent_service_request_id}` : ''}
    ${payload.is_guest_concierge !== undefined ? `AND SRM.IS_GUEST_CONCIERGE = ${payload.is_guest_concierge}` : ''}
    ${payload.query ? `AND (PM.ADDRESS ILIKE '%${payload?.query}%' OR PM.PROPERTY_NICK_NAME ILIKE '%${payload?.query}%')` : ''}
    ${payload.payment_method ? `AND OPD.PAYMENT_TYPE = '${payload.payment_method}'` : ''}
    ${
      payload?.start_date && payload?.end_date
        ? `
        AND TO_TIMESTAMP(IVM.CREATED_AT)::DATE >= '${payload?.start_date}'::DATE
        AND TO_TIMESTAMP(IVM.CREATED_AT)::DATE <= '${payload?.end_date}'::DATE`
        : ''
    }`;

    // Add sorting logic
    let orderByClause = '';
    if (paginationParams?.sort_by && paginationParams?.sort_order) {
      let sortField = 'IVM.ID';
      if (paginationParams.sort_by === 'owner_name') {
        sortField = 'OWNER_NAME';
      } else if (paginationParams.sort_by === 'property_name_address') {
        sortField = 'PROPERTY_NAME_ADDRESS';
      } else if (paginationParams.sort_by === 'service_type_title') {
        sortField = 'SERVICE_TYPE_TITLE';
      } else if (paginationParams.sort_by === 'service_date') {
        sortField = 'SERVICE_DATE';
      } else if (paginationParams.sort_by === 'created_at') {
        sortField = 'CREATED_AT';
      } else if (paginationParams.sort_by === 'vendor_name') {
        sortField = 'VENDOR_NAME';
      } else if (paginationParams.sort_by === 'franchise_remaining_balance') {
        sortField = 'FRANCHISE_REMAINING_BALANCE';
      } else if (paginationParams.sort_by === 'invoice_status') {
        sortField = 'INVOICE_STATUS';
      } else if (paginationParams.sort_by === 'vendor_remaining_balance') {
        sortField = 'VENDOR_REMAINING_BALANCE';
      } else if (paginationParams.sort_by === 'vendor_payment_status') {
        sortField = 'VENDOR_PAYMENT_STATUS';
      } else if (paginationParams.sort_by === 'service_type_category_title') {
        sortField = 'SERVICE_TYPE_CATEGORY_TITLE';
      } else if (paginationParams.sort_by === 'vendor_total') {
        sortField = 'IVM.VENDOR_TOTAL';
      } else if (paginationParams.sort_by === 'franchise_total') {
        sortField = 'IVM.FRANCHISE_TOTAL';
      } else if (paginationParams.sort_by === 'margin') {
        sortField = 'MARGIN';
      } else if (paginationParams.sort_by === 'sent_to_owner_at') {
        sortField = 'IVM.SEND_TO_OWNER_AT';
      } else if (paginationParams.sort_by === 'paid_by_owner_at') {
        sortField = 'IVM.PAID_BY_OWNER_AT';
      } else if (paginationParams.sort_by === 'deposit_amount') {
        sortField = 'IVM.DEPOSIT_AMOUNT';
      }
      orderByClause = `ORDER BY ${sortField} ${paginationParams.sort_order === 'asc' ? 'ASC' : 'DESC'}`;
    } else {
      if (
        [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        )
      ) {
        orderByClause = `ORDER BY 
          CASE 
            WHEN IVM.INVOICE_STATUS = '${InvoiceStatus.SentToAdmin}' THEN 1
            WHEN IVM.INVOICE_STATUS = '${InvoiceStatus.OverDue}' THEN 2
            WHEN IVM.INVOICE_STATUS = '${InvoiceStatus.SentToOwner}' THEN 3
            WHEN IVM.INVOICE_STATUS IN ('${InvoiceStatus.PaidByOwnerSuccess}', '${InvoiceStatus.PaidByOwnerProcessing}', '${InvoiceStatus.PaidByOwnerFailed}') THEN 4
            ELSE 5
          END,
          TO_TIMESTAMP(IVM.CREATED_AT) ASC`;
      } else if (user.user_type === UserType.Owner) {
        orderByClause = `ORDER BY CASE WHEN IVM.INVOICE_STATUS = '${InvoiceStatus.SentToOwner}'
          AND IVM.SEND_TO_OWNER_AT IS NOT NULL
          AND (CURRENT_DATE - TO_TIMESTAMP(IVM.SEND_TO_OWNER_AT)::DATE) > 14 THEN 1
        ELSE 2
      END,
      IVM.INVOICE_STATUS DESC`;
      } else {
        orderByClause = 'ORDER BY IVM.ID DESC';
      }
    }

    const finalQuery = query + ' ' + orderByClause;

    const countQuery = `SELECT COUNT(*) FROM (${finalQuery}) AS subquery`;

    const data = await this.repository.query(
      !isDownload
        ? `${finalQuery} LIMIT ${paginationParams?.limit} OFFSET ${paginationParams?.offset}`
        : finalQuery,
    );
    const [{ count }] = await this.repository.query(countQuery);

    return { data, count: Number(count) };
  }

  async getInvoiceById(invoice_master_id: number, user: JwtPayload) {
    let invoiceMasterSelect = [
      'invoiceMaster.id',
      'invoiceMaster.invoice_status',
      'invoiceMaster.deposit_amount',
      'invoiceMaster.deposit_paid_by',
      'invoiceMaster.deposit_paid',
      'invoiceMaster.vendor_id',
      'invoiceMaster.vendor_description',
      'invoiceMaster.send_to_owner_at',
      'invoiceMaster.vendor_total',
      'invoiceMaster.created_at',
      'invoiceMaster.franchise_updated_at',
    ];

    if (user.user_type === UserType.Vendor) {
      invoiceMasterSelect.push('invoiceMaster.vendor_remaining_balance');
    }

    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type)
    ) {
      invoiceMasterSelect.push(
        'invoiceMaster.franchise_total',
        'invoiceMaster.franchise_remaining_balance',
        'invoiceMaster.vendor_remaining_balance',
        'invoiceMaster.franchise_description',
        'invoiceMaster.auto_send_to_owner',
      );
    }

    if (user.user_type === UserType.Owner) {
      invoiceMasterSelect = [
        'invoiceMaster.id',
        'invoiceMaster.invoice_status',
        'invoiceMaster.deposit_amount',
        'invoiceMaster.deposit_paid_by',
        'invoiceMaster.deposit_paid',
        'invoiceMaster.franchise_total',
        'invoiceMaster.franchise_remaining_balance',
        'invoiceMaster.franchise_description',
        'invoiceMaster.owner_id',
        'invoiceMaster.created_at',
      ];
    }

    const queryBuilder = this.repository
      .createQueryBuilder('invoiceMaster')
      .select(invoiceMasterSelect)
      .leftJoinAndSelect(
        'invoiceMaster.invoice_line_items',
        'invoiceLineItems',
        user.user_type === UserType.Vendor
          ? 'invoiceLineItems.is_vendor_line_item = true AND invoiceLineItems.vendor_id = :user_id'
          : null,
        { user_id: user.id },
      )
      .leftJoinAndSelect(
        'invoiceMaster.service_request_master',
        'serviceRequestMaster',
      )
      .leftJoinAndSelect(
        'invoiceMaster.invoice_service_type',
        'invoice_service_type',
      )
      .where('invoiceMaster.is_deleted = false')
      .andWhere('invoiceMaster.id = :invoice_master_id', { invoice_master_id })
      .andWhere('invoiceMaster.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      })
      .leftJoinAndSelect('invoiceMaster.invoice_property', 'invoice_property')
      .leftJoinAndSelect('invoiceMaster.invoice_owner', 'invoice_owner')
      .leftJoinAndSelect(
        'invoice_property.propertyLocation',
        'propertyLocation',
      );

    if (user.user_type === UserType.Vendor) {
      queryBuilder.andWhere('invoiceMaster.vendor_id = :vendor_id', {
        vendor_id: user.id,
      });
    }

    if (
      [
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.Owner,
      ].includes(user.user_type)
    ) {
      queryBuilder.leftJoinAndSelect(
        'invoiceMaster.invoice_master_owner_payment',
        'invoiceMasterOwnerPayment',
      );
    }

    if (
      [
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.Vendor,
      ].includes(user.user_type)
    ) {
      queryBuilder.leftJoinAndSelect(
        'invoiceMaster.invoice_master_vendor_payment',
        'invoiceMasterVendorPayment',
      );
    }

    return queryBuilder.getOne();
  }

  async getTotalDue(user: JwtPayload) {
    let query = '';
    const userId = Number(user.id);

    if (
      user.user_type === UserType.Vendor ||
      user.user_type === UserType.Owner
    ) {
      const isVendor = user.user_type === UserType.Vendor;

      const selectClause = isVendor
        ? `ROUND(SUM(IVM.VENDOR_REMAINING_BALANCE)::NUMERIC, 2) AS TOTAL_DUE`
        : `
          ROUND(SUM(IVM.FRANCHISE_REMAINING_BALANCE)::NUMERIC, 2) AS TOTAL_DUE,
            ROUND(SUM(
            CASE 
              WHEN IVM.SEND_TO_OWNER_AT IS NOT NULL 
                AND (CURRENT_DATE - TO_TIMESTAMP(IVM.SEND_TO_OWNER_AT)::DATE) > 14 
              THEN IVM.FRANCHISE_REMAINING_BALANCE
              ELSE 0
            END
          )::NUMERIC, 2) AS TOTAL_OVERDUE`;

      const whereClause = isVendor
        ? `IVM.VENDOR_ID = ${userId}`
        : `IVM.OWNER_ID = ${userId} AND IVM.INVOICE_STATUS IN ('${InvoiceStatus.SentToOwner}')`;

      query = `
        SELECT
          ${selectClause}
        FROM INVOICE_MASTERS IVM
        WHERE ${whereClause}`;
    }

    return await this.repository.query(query);
  }

  async getTotalRemainingBalance(
    user: JwtPayload,
    invoice_master_ids?: number[],
  ) {
    const query = `
      SELECT
        ROUND(SUM(IVM.FRANCHISE_REMAINING_BALANCE)::NUMERIC, 2) AS TOTAL_REMAINING_BALANCE
      FROM INVOICE_MASTERS IVM
      WHERE IVM.FRANCHISE_ID = ${user.franchise_id}
      AND IVM.OWNER_ID = ${Number(user.id)}
      ${
        invoice_master_ids?.length
          ? `AND IVM.ID IN (${invoice_master_ids.join(',')})`
          : ''
      }
      AND IVM.INVOICE_STATUS IN ('${InvoiceStatus.SentToOwner}', '${InvoiceStatus.PaidByOwnerFailed}')
      AND IVM.IS_DELETED = FALSE
    `;

    return await this.repository.query(query);
  }
  async updateDepositPaidStatusByIdentifier(
    queryRunner: QueryRunner,
    invoiceIdentifier: string,
    invoiceStatus: InvoiceStatus,
  ) {
    return await queryRunner.query(
      `
      UPDATE INVOICE_MASTERS AS IM
      SET INVOICE_STATUS = $1,
      DEPOSIT_PAID = 
        CASE 
          WHEN SRM.STATUS = $2 THEN TRUE
          ELSE FALSE
        END
      FROM SERVICE_REQUEST_MASTERS AS SRM
      WHERE IM.SERVICE_REQUEST_MASTER_ID = SRM.ID
        AND IM.INVOICE_UUID = $3
    `,
      [invoiceStatus, ServiceRequestStatus.DepositRequired, invoiceIdentifier],
    );
  }

  async getOverdueInvoicesCount(user: JwtPayload): Promise<number> {
    const [result] = await this.repository.query(
      `
      SELECT COUNT(*) 
      FROM invoice_masters IVM 
      WHERE IVM.franchise_id = ${user.franchise_id} 
        ${user.user_type === UserType.Owner ? `AND IVM.owner_id = ${user.id}` : ''}
        AND IVM.invoice_status = '${InvoiceStatus.SentToOwner}'
        AND IVM.SEND_TO_OWNER_AT IS NOT NULL 
        AND (CURRENT_DATE - TO_TIMESTAMP(IVM.SEND_TO_OWNER_AT)::DATE) > 14
    `,
    );

    return Number(result.count);
  }
}
