import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { Between, DataSource, MoreThan } from 'typeorm';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import {
  CalenderQueryDto,
  DrawerQueryDto,
  ServiceRequestQueryDto,
} from '@/serviceRequest/serviceRequest.dto';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import * as moment from 'moment';
import { OwnerApprovalStatus } from '@/app/contracts/enums/ownerApprovalStatus.enum';
import { EstimateStatus } from '@/app/contracts/enums/estimate.enum';
import { EstimateDetailModel } from '@/app/models/estimate/estimateDetail.model';
import { ServiceRequestPriority } from '@/app/contracts/enums/serviceRequestPriority.enum';
import { ScheduledNotificationModel } from '@/app/models/notification/scheduledNotification.model';
import {
  ScheduledNotificationConfig,
  ScheduledNotificationMedium,
  ScheduledNotificationStatus,
  ScheduledNotificationTrigger,
} from '@/app/contracts/enums/scheduledNotification.enum';
import { ServiceRequestVendorStatusModel } from '@/app/models/serviceRequest/serviceRequestVendorStatus.model';
import { PaymentStatus } from '@/app/contracts/enums/invoice.enum';

@Injectable()
export class ServiceRequestMasterRepository extends PostgresRepository<ServiceRequestMasterModel> {
  constructor(dataSource: DataSource) {
    super(ServiceRequestMasterModel, dataSource);
  }

  public async getAllServiceRequest(
    params: IPaginationDBParams,
    query: ServiceRequestQueryDto,
    user: JwtPayload,
    startTime: number = 0,
  ): Promise<IPaginatedModelResponse<ServiceRequestMasterModel>> {
    const {
      start_date,
      end_date,
      status,
      statuses,
      service_type_id,
      property_id,
      is_discrepancy,
      owner_id,
      query: queryToSearch,
      is_guest,
      is_deleted,
      invoice_status,
      vendor_payment_status,
    } = query;

    const queryBuilder = this.repository
      .createQueryBuilder('serviceRequest')
      .leftJoinAndSelect('serviceRequest.serviceType', 'serviceType')
      .leftJoinAndSelect('serviceRequest.creator', 'creator')
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      )
      .leftJoinAndSelect('serviceRequest.propertyMaster', 'property')
      .leftJoinAndSelect('serviceRequest.invoice_master', 'invoice_master')
      .leftJoinAndSelect(
        'invoice_master.invoice_master_vendor_payment',
        'invoice_master_vendor_payment',
      )
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('serviceRequest.vendor', 'vendor')
      .leftJoinAndSelect(
        'serviceRequest.serviceRequestVendorStatus',
        'serviceRequestVendorStatus',
      )
      .where('serviceRequest.is_deleted = :is_deleted', {
        is_deleted: is_deleted ?? false,
      })
      .andWhere('serviceRequest.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      });

    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(user.user_type)
    ) {
      queryBuilder.andWhere(
        'serviceRequest.is_guest_concierge = :is_guest_concierge',
        {
          is_guest_concierge: false,
        },
      );
    }

    if (vendor_payment_status) {
      const vendorPayCond = `${
        vendor_payment_status === PaymentStatus.Unpaid
          ? `(invoice_master_vendor_payment IS NULL OR invoice_master_vendor_payment.payment_status = '${PaymentStatus.Unpaid}')`
          : `(invoice_master_vendor_payment IS NOT NULL OR invoice_master_vendor_payment.payment_status = '${PaymentStatus.Paid}')`
      }`;
      queryBuilder.andWhere(vendorPayCond);
    }

    if (invoice_status) {
      queryBuilder.andWhere('invoice_master.invoice_status = :invoice_status', {
        invoice_status,
      });
    }

    if (user.user_type === UserType.Owner || owner_id) {
      queryBuilder.andWhere('serviceRequest.owner_id = :ownerId', {
        ownerId: user.user_type === UserType.Owner ? Number(user.id) : owner_id,
      });
    }

    if (
      !is_deleted &&
      statuses &&
      [
        UserType.Vendor,
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
      ].includes(user.user_type) &&
      statuses.includes(ServiceRequestStatus.Claimed)
    ) {
      queryBuilder.andWhere(
        `(
              (${user.user_type === UserType.Vendor ? `serviceRequest.vendor_id = :vendorId AND ` : ``} serviceRequest.status IN (:...statuses))
                OR
              (${user.user_type === UserType.Vendor ? `serviceRequestVendorStatus.vendor_id = :vendorId AND ` : ``} serviceRequestVendorStatus.status = :status)
            )`,
        {
          vendorId:
            user.user_type === UserType.Vendor ? user.id : query?.vendor_id,
          statuses,
          status: ServiceRequestStatus.Claimed,
        },
      );
    } else if (
      statuses &&
      [
        UserType.Vendor,
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
      ].includes(user.user_type)
    ) {
      queryBuilder.andWhere('serviceRequest.status IN (:...statuses)', {
        statuses: [
          ServiceRequestStatus.PartiallyCompleted,
          ServiceRequestStatus.CompletedSuccessfully,
        ],
      });
    }

    if (start_date && end_date) {
      queryBuilder.andWhere(
        'serviceRequest.start_date BETWEEN :start_date AND :end_date',
        {
          start_date: moment(start_date).format('YYYY-MM-DD'),
          end_date: moment(end_date).format('YYYY-MM-DD'),
        },
      );
    } else if (start_date) {
      queryBuilder.andWhere('serviceRequest.start_date < :start_date', {
        start_date: moment(start_date).format('YYYY-MM-DD'),
      });
    }

    if (status && !is_deleted) {
      queryBuilder.andWhere('serviceRequest.status = :status', {
        status: Number(status),
      });
      if (
        status === ServiceRequestStatus.NotYetAssigned &&
        user.user_type === UserType.Vendor
      ) {
        queryBuilder.andWhere(
          `serviceRequest.service_type_id IN (SELECT service_type_id FROM vendor_service_types WHERE vendor_id = ${user.id} AND franchise_id = ${user.franchise_id})`,
        );
      } else if (
        user.user_type === UserType.Vendor &&
        status === ServiceRequestStatus.Claimed
      ) {
        queryBuilder.andWhere(
          `serviceRequestVendorStatus.vendor_id = :vendorId AND serviceRequestVendorStatus.status = :srStatus`,
          {
            vendorId: user.id,
            srStatus: ServiceRequestStatus.Claimed,
          },
        );
      } else if (user.user_type === UserType.Vendor) {
        queryBuilder.andWhere(`serviceRequest.vendor_id = :vendorId`, {
          vendorId: user.id,
        });
      }
    }

    if (property_id) {
      queryBuilder.andWhere(
        'serviceRequest.property_master_id = :property_id',
        { property_id },
      );
    }

    if (service_type_id) {
      queryBuilder.andWhere(
        'serviceRequest.service_type_id = :service_type_id',
        { service_type_id },
      );
    }

    if (is_discrepancy && is_guest) {
      queryBuilder
        .andWhere(
          '(serviceRequest.is_discrepancy = :is_discrepancy OR serviceRequest.is_guest = :is_guest)',
          {
            is_discrepancy,
            is_guest,
          },
        )
        .andWhere('serviceRequest.owner_approval_status = :approvalStatus', {
          approvalStatus: OwnerApprovalStatus.UnApproved,
        });
    } else if (is_discrepancy !== undefined && is_guest) {
      queryBuilder.andWhere('serviceRequest.is_discrepancy = :is_discrepancy', {
        is_discrepancy,
      });
      if (is_discrepancy) {
        queryBuilder.andWhere(
          'serviceRequest.owner_approval_status = :approvalStatus',
          {
            approvalStatus: OwnerApprovalStatus.UnApproved,
          },
        );
      }
    } else if (is_guest !== undefined && is_discrepancy) {
      queryBuilder.andWhere('serviceRequest.is_guest = :is_guest', {
        is_guest,
      });
      if (is_guest && !is_discrepancy) {
        queryBuilder.andWhere(
          'serviceRequest.owner_approval_status = :approvalStatus',
          {
            approvalStatus: OwnerApprovalStatus.UnApproved,
          },
        );
      }
    }

    if (!is_guest && !is_discrepancy) {
      if (
        [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
          user.user_type,
        )
      ) {
        queryBuilder.andWhere(
          `(
            (serviceRequest.parent_id IS NOT NULL AND serviceRequest.owner_approval_status IN (:...parentChildApprovalStatuses))
            OR
            (serviceRequest.parent_id IS NULL AND serviceRequest.owner_approval_status = :ownerApprovalStatus)
          )`,
          {
            parentChildApprovalStatuses: [
              OwnerApprovalStatus.Approved,
              OwnerApprovalStatus.UnApproved,
            ],
            ownerApprovalStatus: OwnerApprovalStatus.Approved,
          },
        );
      } else {
        queryBuilder.andWhere(
          'serviceRequest.owner_approval_status = :ownerApprovalStatus',
          {
            ownerApprovalStatus: OwnerApprovalStatus.Approved,
          },
        );
      }
    }

    if (queryToSearch) {
      queryBuilder.andWhere(
        '(property.address ILIKE :queryToSearch OR property.property_nick_name ILIKE :queryToSearch)',
        {
          queryToSearch: `%${queryToSearch}%`,
        },
      );
    }

    if (query.download && startTime) {
      queryBuilder.andWhere('serviceRequest.created_at >= :startTime', {
        startTime,
      });
    } else if (!query.download) {
      queryBuilder.skip(params.offset).take(params.limit);
    }

    if (params?.sort_order && params?.sort_by) {
      // Handle custom sorting when sort_by is provided
      const sortField = params.sort_by;
      const sortOrder = params.sort_order === 'asc' ? 'ASC' : 'DESC';

      if (sortField === 'generated_by_role') {
        queryBuilder.orderBy('creator.first_name', sortOrder);
      } else if (sortField === 'address') {
        queryBuilder.orderBy('property.address', sortOrder);
      } else if (sortField === 'service_type') {
        queryBuilder.orderBy('serviceType.title', sortOrder);
      } else if (sortField === 'claimed_by') {
        queryBuilder.orderBy('vendor.first_name', sortOrder);
      } else if (sortField === 'service_category') {
        queryBuilder.orderBy('serviceTypeCategory.title', sortOrder);
      } else if (sortField === 'service_type') {
        queryBuilder.orderBy('serviceType.title', sortOrder);
      } else if (sortField === 'owner_name') {
        queryBuilder.orderBy('owner.first_name', sortOrder);
      } else if (sortField === 'invoice_status') {
        queryBuilder.orderBy('invoice_master.invoice_status', sortOrder);
      } else if (sortField === 'id') {
        queryBuilder.orderBy('serviceRequest.id', sortOrder);
      } else {
        queryBuilder.orderBy(
          `serviceRequest.${params.sort_by}`,
          params.sort_order === 'asc' ? 'ASC' : 'DESC',
        );
      }
    } else {
      // Default complex ordering logic when sort_by is undefined
      queryBuilder
        .addSelect(
          ` CASE
              WHEN DATE (serviceRequest.start_date) = DATE (CURRENT_DATE) THEN 1
              WHEN DATE (serviceRequest.start_date) < DATE (CURRENT_DATE) THEN 2
              ELSE 3
            END`,
          'start_date_ordering',
        )
        .addSelect(
          ` CASE
              WHEN serviceRequest.status = '${ServiceRequestStatus.Claimed}' THEN 1
              WHEN serviceRequest.status = '${ServiceRequestStatus.Scheduled}' THEN 2
              WHEN serviceRequest.status = '${ServiceRequestStatus.InProgress}' THEN 3
              ELSE 4
            END`,
          'status_ordering',
        );

      queryBuilder.orderBy('status_ordering', 'ASC');
      queryBuilder.addOrderBy('start_date_ordering', 'ASC');
      queryBuilder.addOrderBy('serviceRequest.start_date', 'DESC');
      queryBuilder.addOrderBy('serviceRequest.status', 'ASC');
    }

    const [data, count] = await queryBuilder.getManyAndCount();

    const serviceReqData = data.map((item) => ({
      ...(item as any),
      start_date: item.start_date
        ? moment(item.start_date).format('MM-DD-YYYY')
        : null,
      end_date: item.end_date
        ? moment(item.end_date).format('MM-DD-YYYY')
        : null,
      created_at: moment.unix(Number(item.created_at)).format('MM-DD-YYYY'),
    }));

    return { data: serviceReqData, count };
  }

  public async getServiceRequestById(
    serviceRequestId: number,
    user: JwtPayload,
  ): Promise<ServiceRequestMasterModel> {
    const serviceRequest = await this.repository
      .createQueryBuilder('service_request_masters')
      .leftJoinAndSelect(
        'service_request_masters.propertyMaster',
        'propertyMaster',
      )
      .leftJoinAndSelect('propertyMaster.owner', 'owner')
      .leftJoinAndSelect('service_request_masters.vendor', 'vendor')
      .leftJoinAndSelect(
        'service_request_masters.serviceRequestMasterLinen',
        'serviceRequestMasterLinen',
      )
      .leftJoinAndSelect(
        'service_request_masters.serviceRequestVendorStatus',
        'serviceRequestVendorStatus',
        'serviceRequestVendorStatus.vendor_id IS NOT NULL AND serviceRequestVendorStatus.status = :status',
        { status: ServiceRequestStatus.Claimed },
      )
      .leftJoinAndSelect('service_request_masters.serviceType', 'serviceType')
      .leftJoinAndSelect(
        'serviceType.franchiseServiceType',
        'franchiseServiceType',
        'franchiseServiceType.franchise_id = :franchiseId',
        { franchiseId: user.franchise_id },
      )
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      )
      .leftJoinAndSelect(
        'service_request_masters.serviceRequestMedia',
        'serviceRequestMedia',
      )
      .leftJoinAndSelect(
        'service_request_masters.serviceRequestDates',
        'serviceRequestDates',
      )
      .leftJoinAndSelect(
        'service_request_masters.serviceRequestNote',
        'serviceRequestNote',
      )
      .leftJoinAndSelect('serviceRequestNote.serviceRequestMedia', 'noteMedia')
      .leftJoinAndSelect(
        'serviceRequestNote.serviceRequestNoteUser',
        'noteUser',
      )
      .leftJoinAndSelect('service_request_masters.guest', 'guest')
      .leftJoinAndSelect(
        'vendor.vendorServiceType',
        'vendorServiceType',
        'vendorServiceType.service_type_id = serviceType.id AND vendorServiceType.franchise_id = :franchiseId',
        { franchiseId: user.franchise_id },
      )
      .leftJoin(
        'service_request_masters.service_request_invoice',
        'invoiceMaster',
      )
      .addSelect([
        'invoiceMaster.id',
        'invoiceMaster.deposit_amount',
        'invoiceMaster.deposit_required_by',
        'invoiceMaster.invoice_status',
        'invoiceMaster.vendor_total',
        'invoiceMaster.franchise_total',
      ])
      .where('service_request_masters.id = :id', { id: serviceRequestId })
      .andWhere('service_request_masters.franchise_id = :franchiseId', {
        franchiseId: Number(user.franchise_id),
      })
      .getOne();

    if (serviceRequest?.start_date)
      serviceRequest.start_date = moment(serviceRequest.start_date).format(
        'MM-DD-YYYY',
      );

    if (serviceRequest?.end_date)
      serviceRequest.end_date = moment(serviceRequest.end_date).format(
        'MM-DD-YYYY',
      );

    return serviceRequest;
  }

  public async getCalenderData(
    queryParams: CalenderQueryDto,
    user: JwtPayload,
    includeCount: boolean = false,
  ) {
    const query = `SELECT SRM.ID AS ID, TO_CHAR(SRM.START_DATE, 'YYYY-MM-DD') AS START, PM.ADDRESS AS TITLE, SRM.STATUS::TEXT AS STATUS, SRM.PRIORITY, SRM.TURN_OVER 
        FROM SERVICE_REQUEST_MASTERS SRM
        LEFT JOIN PROPERTY_MASTERS PM
        ON SRM.PROPERTY_MASTER_ID = PM.ID
        WHERE SRM.IS_DELETED = ${queryParams?.is_deleted ?? 'FALSE'} 
        AND SRM.FRANCHISE_ID = ${user.franchise_id}
        ${user.user_type === UserType.Vendor ? `AND SRM.VENDOR_ID = ${user.id}` : ''}
        ${
          user.user_type === UserType.Owner
            ? `
        AND SRM.OWNER_ID = ${user.id}
        `
            : ''
        }
        AND SRM.STATUS NOT IN ('${ServiceRequestStatus.NotYetAssigned}','${ServiceRequestStatus.Rejected}', '${ServiceRequestStatus.Cancelled}') 
        ${queryParams?.status ? `AND SRM.STATUS = '${queryParams?.status}'` : ''}
        ${queryParams?.service_type_id ? `AND SRM.SERVICE_TYPE_ID = '${queryParams?.service_type_id}'` : ''}
        ${queryParams?.property_id ? `AND SRM.PROPERTY_MASTER_ID = '${queryParams?.property_id}'` : ''}
        ${queryParams?.query ? `AND (PM.ADDRESS ILIKE '%${queryParams?.query}%' OR PM.PROPERTY_NICK_NAME ILIKE '%${queryParams?.query}%')` : ''}
        AND SRM.START_DATE >= '${moment(queryParams.start_date).format('YYYY-MM-DD')}'  
        AND SRM.START_DATE <= '${moment(queryParams.end_date).format('YYYY-MM-DD')}'
        AND SRM.OWNER_APPROVAL_STATUS = '${OwnerApprovalStatus.Approved}'
    ${
      user.user_type === UserType.Vendor
        ? `UNION
        SELECT SRM.ID AS ID, TO_CHAR(SRM.START_DATE, 'YYYY-MM-DD') AS START, PM.ADDRESS AS TITLE, SRVS.STATUS::TEXT AS STATUS, SRM.PRIORITY, SRM.TURN_OVER AS TURN_OVER
        FROM SERVICE_REQUEST_VENDOR_STATUSES SRVS
        LEFT JOIN SERVICE_REQUEST_MASTERS SRM 
        ON SRM.ID = SRVS.SERVICE_REQUEST_MASTER_ID
        LEFT JOIN PROPERTY_MASTERS PM 
        ON SRM.PROPERTY_MASTER_ID = PM.ID
        WHERE SRM.IS_DELETED = FALSE
        AND SRM.FRANCHISE_ID = ${user.franchise_id}
        AND SRVS.VENDOR_ID = ${user.id}
        AND SRVS.STATUS != '${ServiceRequestStatus.Rejected}'
        AND SRM.STATUS NOT IN ('${ServiceRequestStatus.NotYetAssigned}','${ServiceRequestStatus.Cancelled}') 
        AND SRM.START_DATE >= '${moment(queryParams.start_date).format('YYYY-MM-DD')}'
        AND SRM.START_DATE <= '${moment(queryParams.end_date).format('YYYY-MM-DD')}'
        ${queryParams?.status ? `AND SRM.STATUS = '${queryParams?.status}'` : ''}
        ${queryParams?.service_type_id ? `AND SRM.SERVICE_TYPE_ID = '${queryParams?.service_type_id}'` : ''}
        ${queryParams?.property_id ? `AND SRM.PROPERTY_MASTER_ID = '${queryParams?.property_id}'` : ''}
        ${queryParams?.query ? `AND PM.ADDRESS ILIKE '%${queryParams?.query}%'` : ''}
        ORDER BY START ASC`
        : 'ORDER BY srm.start_date'
    }`;

    const data = await this.repository.query(query);

    if (includeCount) {
      const countQuery = `SELECT COUNT(*) FROM (${query}) AS subquery`;
      const [{ count }] = await this.repository.query(countQuery);
      return { data, count: Number(count) };
    }

    return data;
  }

  public async getVendorAndOwnerCharges(
    serviceRequestMasterId: number,
    serviceTypeId: number,
  ) {
    const queryBuilder = this.repository
      .createQueryBuilder('serviceRequestMaster')
      .leftJoin('serviceRequestMaster.propertyMaster', 'propertyMaster')
      .leftJoin('serviceRequestMaster.serviceType', 'serviceType')
      .leftJoin(
        'propertyMaster.fracnhisePropertyMaster',
        'propertyServiceTypeRates',
        'propertyServiceTypeRates.service_type_id = :serviceTypeId',
        { serviceTypeId },
      )
      .where('serviceRequestMaster.id = :serviceRequestMasterId', {
        serviceRequestMasterId,
      })
      .select([
        'serviceRequestMaster.id',
        'serviceRequestMaster.deposit_amount',
        'serviceRequestMaster.deposit_paid',
        'propertyMaster.id',
        'propertyMaster.call_owner_charge',
        'propertyMaster.call_vendor_charge',
        'propertyServiceTypeRates.id',
        'propertyServiceTypeRates.vendor_charge',
        'propertyServiceTypeRates.owner_charge',
      ]);

    const serviceRequestMaster = await queryBuilder.getOne();

    return {
      callFeeVendorCharge:
        serviceRequestMaster?.propertyMaster?.call_vendor_charge || 0,
      callFeeOwnerCharge:
        serviceRequestMaster?.propertyMaster?.call_owner_charge || 0,
      serviceTypeVendorCharge:
        serviceRequestMaster?.propertyMaster?.fracnhisePropertyMaster?.[0]
          ?.vendor_charge || 0,
      serviceTypeOwnerCharge:
        serviceRequestMaster?.propertyMaster?.fracnhisePropertyMaster?.[0]
          ?.owner_charge || 0,
      // depositAmount: serviceRequestMaster?.deposit_amount || 0,
      // depositPaid: serviceRequestMaster?.deposit_paid,
    };
  }

  public async getApprovedEstimateLineItems(
    serviceRequestMasterId: number,
  ): Promise<EstimateDetailModel[]> {
    const serviceRequestMaster = await this.repository
      .createQueryBuilder('serviceRequestMaster')
      .leftJoin('serviceRequestMaster.estimateMaster', 'estimateMaster')
      .leftJoin('estimateMaster.estimateDetail', 'estimateLineItems')
      .where('serviceRequestMaster.id = :serviceRequestMasterId', {
        serviceRequestMasterId,
      })
      .andWhere('estimateMaster.status = :status', {
        status: EstimateStatus.EstimateApprovedByOwner,
      })
      .andWhere('estimateLineItems.is_grand_total = :isGrandTotal', {
        isGrandTotal: false,
      })
      .select([
        'serviceRequestMaster.id',
        'estimateMaster.id',
        'estimateLineItems.id',
        'estimateLineItems.line_item',
        'estimateLineItems.price',
        'estimateLineItems.franchise_admin_id',
      ])
      .getOne();

    if (!serviceRequestMaster) return [];

    return serviceRequestMaster.estimateMaster?.estimateDetail || [];
  }

  public async getLinenServiceRequestTotal(serviceRequestId: number) {
    const queryBuilder = this.repository
      .createQueryBuilder('serviceRequestMaster')
      .leftJoinAndSelect(
        'serviceRequestMaster.serviceRequestMasterLinen',
        'serviceRequestMasterLinen',
      )
      .where('serviceRequestMaster.id = :serviceRequestId', {
        serviceRequestId,
      });

    const serviceRequest = await queryBuilder.getOne();

    return serviceRequest.serviceRequestMasterLinen?.total_charges ?? 0;
  }

  public async getUninvoicedServiceRequest(
    paginationParams: IPaginationDBParams,
    query: ServiceRequestQueryDto,
    user: JwtPayload,
  ) {
    const queryBuilder = this.repository
      .createQueryBuilder('service_request_masters')
      .leftJoinAndSelect(
        'service_request_masters.propertyMaster',
        'property_master',
      )
      .leftJoinAndSelect('service_request_masters.serviceType', 'service_type')
      .where('service_request_masters.is_deleted = :is_deleted', {
        is_deleted: false,
      })
      .where('service_request_masters.vendor_id = :vendorId', {
        vendorId: Number(user.id),
      })
      .andWhere('service_request_masters.status IN (:...statuses)', {
        statuses: [
          ServiceRequestStatus.PartiallyCompleted,
          ServiceRequestStatus.CompletedSuccessfully,
        ],
      })
      .andWhere('service_request_masters.invoice_master_id IS NULL');

    if (query?.query) {
      queryBuilder.andWhere(
        '(property_master.address ILIKE :queryToSearch OR property_master.property_nick_name ILIKE :queryToSearch)',
        {
          queryToSearch: `%${query?.query}%`,
        },
      );
    }

    if (query?.property_id) {
      queryBuilder.andWhere(
        'service_request_masters.property_master_id = :property_id',
        { property_id: query?.property_id },
      );
    }

    if (query.service_type_id) {
      queryBuilder.andWhere(
        'service_request_masters.service_type_id = :serviceTypeId',
        {
          serviceTypeId: query.service_type_id,
        },
      );
    }

    if (query?.start_date && query?.end_date) {
      queryBuilder.andWhere(
        'service_request_masters.start_date BETWEEN :start_date AND :end_date',
        {
          start_date: moment(query?.start_date).format('YYYY-MM-DD'),
          end_date: moment(query?.end_date).format('YYYY-MM-DD'),
        },
      );
    }

    queryBuilder
      .skip(paginationParams.offset)
      .take(paginationParams.limit)
      .orderBy('service_request_masters.id', 'DESC');

    const [data, count] = await queryBuilder.getManyAndCount();

    return { data, count };
  }

  async handlePreferredVendorUrgentJobs() {
    /**
     * Preferred vendor urgent jobs to be reassigned
     * to all vendors after 1h if not scheduled
     *
     *  Steps:
     * - Service Request Master
     *  - Status: Claimed
     *  - Vendor ID: Null
     *  - Priority: Urgent
     *  - Created At: Over 1 hr ago (Decide buffer time)
     *  - Service Request Vendor Status:
     *    - is_deleted: False
     *
     *  - Filter:
     *    - More than 1 Service Request Vendor Status
     *    - All Service Request Vendor Status with status CLAIMED
     *
     *  - Update:
     *    - Service Request Master:
     *      - Status: NotYetAssigned
     *    - Service Request Vendor Status:
     *      - Set is_deleted to True
     */

    const oneHourAgo = Math.round((Date.now() - 1 * 60 * 60 * 1000) / 1000);

    const serviceRequests = await this.dataSource
      .getRepository(ServiceRequestMasterModel)
      .find({
        where: {
          status: ServiceRequestStatus.Claimed,
          vendor: null,
          priority: ServiceRequestPriority.Urgent,
          created_at: MoreThan(oneHourAgo),
          serviceRequestVendorStatus: {
            is_deleted: false,
          },
        },
        relations: ['serviceRequestVendorStatus'],
      });

    const filteredServiceRequests = serviceRequests.filter(
      (request) =>
        request.serviceRequestVendorStatus.length > 1 &&
        request.serviceRequestVendorStatus.every(
          (status) => status.status === ServiceRequestStatus.Claimed,
        ),
    );

    for (const request of filteredServiceRequests) {
      for (const status of request.serviceRequestVendorStatus) {
        await this.dataSource
          .getRepository(ServiceRequestVendorStatusModel)
          .update(status.id, { is_deleted: true });
      }
      await this.dataSource
        .getRepository(ServiceRequestMasterModel)
        .update(request.id, { status: ServiceRequestStatus.NotYetAssigned });
    }

    return true;
  }

  async handleUrgentVendorJobs() {
    /**
     * Distribute to all urgent jobs notification
     * to all vendors
     *
     * Steps:
     * - Query Service Request Master
     *  - Status: NotYetAssigned
     *  - Vendor ID: Null
     *  - Priority: Urgent
     *  - Created At: Over 1 hr ago (Decide buffer time)
     *
     *  - Query Service Type ID
     *  - Query Vendor Service Type
     *  - Query Vendors
     *
     * - Do:
     *  - Notify all vendors per service request
     */

    const oneHourAgo = Math.round((Date.now() - 1 * 60 * 60 * 1000) / 1000);

    const serviceRequests = await this.dataSource
      .getRepository(ServiceRequestMasterModel)
      .find({
        where: {
          status: ServiceRequestStatus.NotYetAssigned,
          priority: ServiceRequestPriority.Urgent,
          is_deleted: false,
          is_archived: false,
          serviceType: {
            vendorServiceType: {
              vendor: {
                is_deleted: false,
                is_approved: true,
              },
            },
          },
          created_at: MoreThan(oneHourAgo),
        },
        relations: [
          'serviceType',
          'serviceType.vendorServiceType',
          'serviceType.vendorServiceType.vendor',
        ],
      });

    const notificationAggregation: { [key: string]: any } = {};

    for (const serviceRequest of serviceRequests) {
      const vendors = serviceRequest.serviceType.vendorServiceType
        .map((vendorServiceType) => vendorServiceType.vendor)
        .flat();

      for (const vendor of vendors) {
        if (!notificationAggregation[vendor.id])
          notificationAggregation[vendor.id] = { service_requests: [] };

        notificationAggregation[vendor.id].email_address = vendor.email;
        notificationAggregation[vendor.id].first_name = vendor.first_name;
        notificationAggregation[vendor.id].last_name = vendor.last_name;
        notificationAggregation[vendor.id].phone_number = vendor.cell_phone;
        notificationAggregation[vendor.id].service_requests.push(
          serviceRequest.id,
        );
      }
    }

    for (const userId in notificationAggregation) {
      const notification = new ScheduledNotificationModel();

      const vendor = notificationAggregation[userId];

      notification.email_address = vendor.email_address;
      notification.phone_number = vendor.phone_number;
      notification.notification_medium = ScheduledNotificationMedium.EMAIL;
      notification.notification_status = ScheduledNotificationStatus.PENDING;
      notification.subject =
        ScheduledNotificationConfig[
          ScheduledNotificationTrigger.URGENT_VENDOR_JOBS
        ].subject;
      notification.notification_trigger =
        ScheduledNotificationTrigger.URGENT_VENDOR_JOBS;
      notification.params = {
        service_requests: vendor.service_requests,
      };

      await this.dataSource
        .getRepository(ScheduledNotificationModel)
        .save(notification);
    }

    return true;
  }

  async handleNonUrgentJobsOneWeekBefore() {
    const sevenDaysAgo = new Date(Date.now() + 1 * 7 * 24 * 60 * 60 * 1000);

    const eightDaysAgo = new Date(Date.now() + 1 * 8 * 24 * 60 * 60 * 1000);

    const serviceRequests = await this.dataSource
      .getRepository(ServiceRequestMasterModel)
      .find({
        where: {
          status: ServiceRequestStatus.Claimed,
          vendor: null,
          priority: ServiceRequestPriority.NonUrgent,
          start_date: Between(sevenDaysAgo, eightDaysAgo),
          serviceRequestVendorStatus: {
            is_deleted: false,
          },
        },
        relations: [
          'serviceRequestVendorStatus',
          'serviceType',
          'serviceType.vendorServiceType',
          'serviceType.vendorServiceType.vendor',
        ],
      });

    const filteredServiceRequests = serviceRequests.filter(
      (request) =>
        request.serviceRequestVendorStatus.length > 1 &&
        request.serviceRequestVendorStatus.every(
          (status) => status.status === ServiceRequestStatus.Claimed,
        ),
    );

    const notificationAggregation: { [key: string]: any } = {};

    for (const serviceRequest of filteredServiceRequests) {
      const vendors = serviceRequest.serviceType.vendorServiceType
        .map((vendorServiceType) => vendorServiceType.vendor)
        .flat();

      for (const vendor of vendors) {
        if (!notificationAggregation[vendor.id])
          notificationAggregation[vendor.id] = { service_requests: [] };

        notificationAggregation[vendor.id].email_address = vendor.email;
        notificationAggregation[vendor.id].first_name = vendor.first_name;
        notificationAggregation[vendor.id].last_name = vendor.last_name;
        notificationAggregation[vendor.id].phone_number = vendor.cell_phone;
        notificationAggregation[vendor.id].service_requests.push(
          serviceRequest.id,
        );
      }
    }

    for (const userId in notificationAggregation) {
      const notification = new ScheduledNotificationModel();

      const vendor = notificationAggregation[userId];

      notification.email_address = vendor.email_address;
      notification.phone_number = vendor.phone_number;
      notification.notification_medium = ScheduledNotificationMedium.EMAIL;
      notification.notification_status = ScheduledNotificationStatus.PENDING;
      notification.subject =
        ScheduledNotificationConfig[
          ScheduledNotificationTrigger.PENDING_JOBS_ONE_WEEK_BEFORE
        ].subject;
      notification.notification_trigger =
        ScheduledNotificationTrigger.PENDING_JOBS_ONE_WEEK_BEFORE;
      notification.params = {
        service_requests: vendor.service_requests,
      };

      await this.dataSource
        .getRepository(ScheduledNotificationModel)
        .save(notification);
    }

    return true;
  }

  async getDrawerData(query: DrawerQueryDto, user: JwtPayload) {
    const serviceRequest = this.repository
      .createQueryBuilder('service_request_masters')
      .select([
        'service_request_masters.id',
        'service_request_masters.status',
        'service_request_masters.is_parent',
        'service_request_masters.parent_id',
        'service_request_masters.owner_approval_status',
        'property_master.id',
        'property_master.property_nick_name',
        'property_master.address',
        'service_type_category.id',
        'service_type_category.title',
        'service_type.id',
        'service_type.title',
      ])
      .addSelect(
        `TO_CHAR(to_timestamp(service_request_masters.created_at), 'MM/DD/YYYY')`,
        'created_at',
      )
      .addSelect(
        `CASE 
          WHEN service_request_masters.start_date IS NOT NULL 
          THEN TO_CHAR(service_request_masters.start_date, 'MM/DD/YYYY')
          ELSE NULL 
         END`,
        'start_date',
      )
      .leftJoin('service_request_masters.serviceType', 'service_type')
      .leftJoin('service_type.serviceTypeCategory', 'service_type_category')
      .leftJoin('service_request_masters.propertyMaster', 'property_master')
      .andWhere('service_request_masters.franchise_id = :franchiseId', {
        franchiseId: user.franchise_id,
      });

    if (query?.parent_service_request_id) {
      serviceRequest.andWhere('service_request_masters.parent_id = :parentId', {
        parentId: query.parent_service_request_id,
      });
    } else if (query?.start_date) {
      serviceRequest.andWhere(
        'service_request_masters.start_date = :startDate',
        {
          startDate: query.start_date,
        },
      );
    } else {
      serviceRequest.andWhere(
        'DATE(service_request_masters.start_date) = :todayDate',
        {
          todayDate: moment(new Date()).format('YYYY-MM-DD'),
        },
      );
    }

    if (user.user_type === UserType.Owner) {
      serviceRequest.andWhere('service_request_masters.owner_id = :ownerId', {
        ownerId: user.id,
      });
    }

    if (user.user_type === UserType.Vendor) {
      serviceRequest.andWhere('service_request_masters.vendor_id = :vendorId', {
        vendorId: user.id,
      });
    }

    return await serviceRequest.getRawMany();
  }

  async getServiceRequestReportedIssues(
    serviceRequestId: number,
    user: JwtPayload,
    paginationParams: IPaginationDBParams,
  ) {
    const queryBuilder = this.repository
      .createQueryBuilder('service_request_masters')
      .innerJoinAndSelect('service_request_masters.serviceType', 'serviceType')
      .innerJoinAndSelect(
        'service_request_masters.serviceRequestDiscrepancy',
        'serviceRequestDiscrepancy',
        'serviceRequestDiscrepancy.root_service_request_id = :serviceRequestId',
        {
          serviceRequestId: serviceRequestId,
        },
      )
      .select([
        'service_request_masters.id AS service_request_id',
        'service_request_masters.created_at AS created_at',
        'service_request_masters.description AS description',
        'service_request_masters.owner_approval_status AS owner_approval_status',
        'serviceType.id AS service_type_id',
        'serviceType.title AS service_type_title',
        'serviceRequestDiscrepancy.root_service_request_id AS root_service_request_id',
      ])
      .where('service_request_masters.franchise_id = :franchiseId', {
        franchiseId: user.franchise_id,
      })
      .andWhere('service_request_masters.is_discrepancy = :isDiscrepancy', {
        isDiscrepancy: true,
      })
      .offset(paginationParams.offset)
      .limit(paginationParams.limit)
      .orderBy('service_request_masters.id', 'DESC');

    const data = await queryBuilder.getRawMany();

    const count = await queryBuilder.clone().getCount();

    return { data, count };
  }

  async getPendingOwnerApprovalServiceRequests(user: JwtPayload) {
    const pendingRequestCount = await this.repository
      .createQueryBuilder('service_request_masters')
      .where(
        '(service_request_masters.is_discrepancy = :isDiscrepancy OR service_request_masters.is_guest = :isGuest)',
        {
          isDiscrepancy: true,
          isGuest: true,
        },
      )
      .andWhere('service_request_masters.franchise_id = :franchiseId', {
        franchiseId: Number(user.franchise_id),
      })
      .andWhere('service_request_masters.owner_approval_status = :status', {
        status: OwnerApprovalStatus.UnApproved,
      });

    if (user.user_type === UserType.Owner) {
      pendingRequestCount.andWhere(
        'service_request_masters.owner_id = :ownerId',
        {
          ownerId: Number(user.id),
        },
      );
    }

    return await pendingRequestCount.getCount();
  }

  async getVendorAssignedJobsCount(
    user: JwtPayload,
    startDate?: Date,
    endDate?: Date,
    statuses?: ServiceRequestStatus[],
  ): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('serviceRequest')
      .leftJoin(
        'serviceRequest.serviceRequestVendorStatus',
        'serviceRequestVendorStatus',
      )
      .where('serviceRequest.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      })
      .andWhere('serviceRequest.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('serviceRequest.owner_approval_status = :ownerApprovalStatus', {
        ownerApprovalStatus: OwnerApprovalStatus.Approved,
      });

    if (user.user_type === UserType.Vendor) {
      queryBuilder.andWhere(
        `(
          (serviceRequest.vendor_id = :vendorId)
            OR
          (serviceRequestVendorStatus.vendor_id = :vendorId AND serviceRequestVendorStatus.status = :status)
        )`,
        {
          vendorId: Number(user.id),
          status: ServiceRequestStatus.Claimed,
        },
      );
    }

    if (startDate && endDate) {
      queryBuilder
        .andWhere('serviceRequest.start_date >= :startDate', {
          startDate: startDate,
        })
        .andWhere('serviceRequest.start_date <= :endDate', {
          endDate: endDate,
        });
    }

    if (statuses) {
      queryBuilder.andWhere('serviceRequest.status IN (:...statuses)', {
        statuses: statuses,
      });
    }

    return await queryBuilder.getCount();
  }

  async getUnassignedJobsCountWithServiceType(
    user: JwtPayload,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const queryBuilder = this.repository
      .createQueryBuilder('serviceRequest')
      .where('serviceRequest.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      })
      .andWhere('serviceRequest.is_deleted = :isDeleted', {
        isDeleted: false,
      })
      .andWhere('serviceRequest.owner_approval_status = :ownerApprovalStatus', {
        ownerApprovalStatus: OwnerApprovalStatus.Approved,
      })
      .andWhere('serviceRequest.status = :status', {
        status: ServiceRequestStatus.NotYetAssigned,
      });

    if (user.user_type === UserType.Vendor) {
      queryBuilder.andWhere(
        `serviceRequest.service_type_id IN (SELECT service_type_id FROM vendor_service_types WHERE vendor_id = ${user.id} AND franchise_id = ${user.franchise_id})`,
      );
    }

    if (startDate && endDate) {
      queryBuilder
        .andWhere('serviceRequest.start_date >= :startDate', {
          startDate: startDate,
        })
        .andWhere('serviceRequest.start_date <= :endDate', {
          endDate: endDate,
        });
    }

    return await queryBuilder.getCount();
  }

  async getGuestConciergeServiceRequests(
    params: IPaginationDBParams,
    query: ServiceRequestQueryDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<ServiceRequestMasterModel>> {
    const {
      start_date,
      end_date,
      status,
      service_type_id,
      property_id,
      query: queryToSearch,
      is_deleted,
    } = query;

    const queryBuilder = this.repository
      .createQueryBuilder('serviceRequest')
      .leftJoinAndSelect('serviceRequest.serviceType', 'serviceType')
      .leftJoinAndSelect(
        'serviceType.serviceTypeCategory',
        'serviceTypeCategory',
      )
      .leftJoinAndSelect('serviceRequest.propertyMaster', 'property')
      .leftJoinAndSelect('serviceRequest.invoice_master', 'invoice_master')
      .leftJoinAndSelect(
        'invoice_master.invoice_master_vendor_payment',
        'invoice_master_vendor_payment',
      )
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('serviceRequest.vendor', 'vendor')
      .leftJoinAndSelect(
        'serviceRequest.serviceRequestVendorStatus',
        'serviceRequestVendorStatus',
      )
      .leftJoinAndSelect('serviceRequest.guest', 'guest')
      .where('serviceRequest.is_deleted = :is_deleted', {
        is_deleted: is_deleted ?? false,
      })
      .andWhere('serviceRequest.franchise_id = :franchise_id', {
        franchise_id: Number(user.franchise_id),
      })
      .andWhere('serviceRequest.is_guest_concierge = :is_guest_concierge', {
        is_guest_concierge: true,
      });

    if (status && !is_deleted) {
      queryBuilder.andWhere('serviceRequest.status = :status', {
        status: Number(status),
      });
    }

    if (start_date && end_date) {
      queryBuilder.andWhere(
        'serviceRequest.start_date >= :start_date AND serviceRequest.start_date <= :end_date',
        {
          start_date: moment(start_date).format('YYYY-MM-DD'),
          end_date: moment(end_date).format('YYYY-MM-DD'),
        },
      );
    }

    if (property_id) {
      queryBuilder.andWhere(
        'serviceRequest.property_master_id = :property_id',
        { property_id },
      );
    }

    if (service_type_id) {
      queryBuilder.andWhere(
        'serviceRequest.service_type_id = :service_type_id',
        { service_type_id },
      );
    }

    if (queryToSearch) {
      queryBuilder.andWhere(
        '(property.address ILIKE :queryToSearch OR property.property_nick_name ILIKE :queryToSearch OR guest.full_name ILIKE :queryToSearch OR guest.email ILIKE :queryToSearch)',
        {
          queryToSearch: `%${queryToSearch}%`,
        },
      );
    }

    if (!query.download) {
      queryBuilder.skip(params.offset).take(params.limit);
    }

    // Ordering
    queryBuilder
      .addSelect(
        ` CASE
            WHEN DATE (serviceRequest.start_date) = DATE (CURRENT_DATE) THEN 1
            WHEN DATE (serviceRequest.start_date) < DATE (CURRENT_DATE) THEN 2
            ELSE 3
          END`,
        'start_date_ordering',
      )
      .addSelect(
        ` CASE
            WHEN serviceRequest.status = '${ServiceRequestStatus.Claimed}' THEN 1
            WHEN serviceRequest.status = '${ServiceRequestStatus.Scheduled}' THEN 2
            WHEN serviceRequest.status = '${ServiceRequestStatus.InProgress}' THEN 3
            ELSE 4
          END`,
        'status_ordering',
      );

    queryBuilder.orderBy('status_ordering', 'ASC');
    queryBuilder.addOrderBy('start_date_ordering', 'ASC');
    queryBuilder.addOrderBy('serviceRequest.start_date', 'DESC');
    queryBuilder.addOrderBy('serviceRequest.status', 'ASC');

    const [data, count] = await queryBuilder.getManyAndCount();

    // Format dates
    const serviceReqData = data.map((item) => ({
      ...(item as any),
      start_date: moment(item.start_date).format('MM-DD-YYYY'),
      end_date: item.end_date
        ? moment(item.end_date).format('MM-DD-YYYY')
        : null,
      created_at: moment.unix(Number(item.created_at)).format('MM-DD-YYYY'),
    }));

    return { data: serviceReqData, count };
  }
}
