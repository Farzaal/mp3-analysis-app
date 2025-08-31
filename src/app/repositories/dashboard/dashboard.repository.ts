import { ServiceTypeRequestStatus } from '@/app/contracts/enums/serviceTypeRequest.enum';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { PropertyMasterRepository } from '../property/propertyMaster.respository';
import { ServiceTypeRequestRepository } from '../serviceType/serviceTypeRequest.repository';
import { ServiceRequestMasterRepository } from '../serviceRequest/serviceRequestMaster.repository';
import { InvoiceMasterRepository } from '../invoice/invoiceMaster.repository';
import { EstimateMasterRepository } from '../estimate/estimateMaster.repository';
import { IsNull, In } from 'typeorm';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import { InvoiceStatus } from '@/app/contracts/enums/invoice.enum';
import { VendorServiceTypeRepository } from '../vendor/vendorServiceType.repository';
import { FranchiseRepository } from '../franchise/franchise.repository';
import * as moment from 'moment';
import { OwnerApprovalStatus } from '@/app/contracts/enums/ownerApprovalStatus.enum';
import { CalenderQueryDto } from '@/serviceRequest/serviceRequest.dto';

@Injectable()
export class DashboardRepository {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly propertyMasterRepository: PropertyMasterRepository,
    private readonly serviceTypeRequestRepository: ServiceTypeRequestRepository,
    private readonly serviceRequestMasterRepository: ServiceRequestMasterRepository,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
    private readonly estimateMasterRepository: EstimateMasterRepository,
    private readonly vendorServiceTypeRepository: VendorServiceTypeRepository,
    private readonly franchiseRepository: FranchiseRepository,
  ) {}

  private formatDateToMMDDYYYY(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  }

  public async getSuperAdminDashboardData() {
    const standardAdminCount = await this.userRepository.count({
      user_type: UserType.StandardAdmin,
      is_deleted: false,
    });

    const ownerCount = await this.userRepository.count({
      user_type: UserType.Owner,
      is_deleted: false,
    });

    const franchiseCount = await this.franchiseRepository.count({
      is_deleted: false,
    });

    const vendorCount = await this.userRepository.count({
      user_type: UserType.Vendor,
      is_deleted: false,
    });

    const propertiesCount = await this.propertyMasterRepository.count({
      is_deleted: false,
    });

    const serviceTypeRequestCount =
      await this.serviceTypeRequestRepository.count({
        status: ServiceTypeRequestStatus.PendingApproval,
      });

    return [
      {
        key: 'total_standard_admins_count',
        title: 'Total Standard Admins',
        data: standardAdminCount,
        redirect_url: null as string | null,
      },
      {
        key: 'total_owners_count',
        title: 'Total Owners',
        data: ownerCount,
        redirect_url: null as string | null,
      },
      {
        key: 'total_properties_count',
        title: 'Total Properties',
        data: propertiesCount,
        redirect_url: null as string | null,
      },
      {
        key: 'total_franchises_count',
        title: 'Total Franchises',
        data: franchiseCount,
        redirect_url: `/franchise`,
      },
      {
        key: 'total_vendors_count',
        title: 'Total Vendors',
        data: vendorCount,
        redirect_url: `/service-partners`,
      },
      {
        key: 'total_service_type_approvals_count',
        title: 'Service Type Approvals',
        data: serviceTypeRequestCount,
        redirect_url: `/request-service-types`,
      },
    ];
  }

  public async getFranchiseAdminDashboardData(user: JwtPayload) {
    const todaysServiceRequestCount =
      await this.serviceRequestMasterRepository.count({
        franchise_id: Number(user.franchise_id),
        start_date: new Date(),
      });

    const unpaidInvoicesByVendorCount =
      await this.invoiceMasterRepository.getOverdueInvoicesCount(user);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12); // 12 months ago
    const today = new Date(); // today

    const overdueServiceRequestsCount =
      await this.serviceRequestMasterRepository.getVendorAssignedJobsCount(
        user,
        twelveMonthsAgo,
        today,
        [
          ServiceRequestStatus.Scheduled,
          ServiceRequestStatus.Claimed,
          ServiceRequestStatus.DepositRequired,
          ServiceRequestStatus.InProgress,
          ServiceRequestStatus.NotYetAssigned,
        ],
      );

    const unassignedJobsCount = await this.serviceRequestMasterRepository.count(
      {
        status: ServiceRequestStatus.NotYetAssigned,
        franchise_id: Number(user.franchise_id),
        owner_approval_status: OwnerApprovalStatus.Approved,
      },
    );

    const jobsRequiringInvoicingCount =
      await this.invoiceMasterRepository.count({
        invoice_status: InvoiceStatus.SentToAdmin,
        franchise_id: Number(user.franchise_id),
      });

    const depositRequiredCount =
      await this.serviceRequestMasterRepository.count({
        franchise_id: Number(user.franchise_id),
        status: ServiceRequestStatus.DepositRequired,
      });

    const currentMonthStart = moment().startOf('month').toDate();
    const currentMonthEnd = moment().endOf('month').toDate();

    const { count: calenderDataCount } =
      await this.serviceRequestMasterRepository.getCalenderData(
        {
          start_date: currentMonthStart,
          end_date: currentMonthEnd,
        } as CalenderQueryDto,
        user,
        true,
      );

    // const serviceRequests = await this.serviceRequestMasterRepository.find(
    //   {
    //     start_date: MoreThanOrEqual(new Date()),
    //     franchise_id: Number(user.franchise_id),
    //   },
    //   { limit: 10, offset: 0 },
    //   ['propertyMaster'],
    //   { Column: 'created_at', Direction: 'ASC' },
    // );

    const serviceRequestReportedIssues =
      await this.serviceRequestMasterRepository.getPendingOwnerApprovalServiceRequests(
        user,
      );

    return [
      {
        key: 'todays_service_request_count',
        title: "Today's Service Request",
        data: todaysServiceRequestCount,
        redirect_url: `/service-request?start_date=${this.formatDateToMMDDYYYY(new Date())}&end_date=${this.formatDateToMMDDYYYY(new Date())}`,
        tagline: 'Requests that are in-Progress',
      },
      {
        key: 'unpaid_invoices_by_vendor_count',
        title: 'Overdue Client Invoices',
        data: unpaidInvoicesByVendorCount,
        redirect_url: `/invoices?owner_payment_status=${InvoiceStatus.OverDue}`,
        tagline: 'Invoices that are Unpaid and Over the Date',
      },
      {
        key: 'overdue_service_requests_count',
        title: 'Overdue Service Request',
        data: overdueServiceRequestsCount,
        redirect_url: `/service-request?start_date=${this.formatDateToMMDDYYYY(twelveMonthsAgo)}&end_date=${this.formatDateToMMDDYYYY(today)}&action=overdue_service_requests`,
        tagline: 'Service Requests that is not started yet',
      },
      {
        key: 'unassigned_jobs_count',
        title: 'Unassigned Jobs',
        data: unassignedJobsCount,
        redirect_url: `/service-request?status=${ServiceRequestStatus.NotYetAssigned}`,
        tagline: 'Requests that are in-Progress',
      },
      {
        key: 'jobs_requiring_invoicing_count',
        title: 'Jobs That Need Invoiced',
        data: jobsRequiringInvoicingCount,
        redirect_url: `/invoices?owner_payment_status=${InvoiceStatus.SentToAdmin}`,
        tagline: 'Service Requests that Invoice has not created yet',
      },
      {
        key: 'deposit_required_count',
        title: 'Deposit Required',
        data: depositRequiredCount,
        redirect_url: `/service-request?status=${ServiceRequestStatus.DepositRequired}`,
      },
      {
        key: 'service_calendar',
        title: 'Service Calendar',
        data: calenderDataCount,
        redirect_url: `/service-request?view=calendar`,
      },
      {
        key: 'pending_estimate_requests',
        title: 'Pending Owner Approval',
        data: serviceRequestReportedIssues,
        tagline: 'Serivce Requests that require owner approval',
      },
    ];
  }

  public async getOwnerDashboardData(user: JwtPayload) {
    const todaysServiceRequestsCount =
      await this.serviceRequestMasterRepository.count({
        start_date: new Date(),
        owner_id: Number(user.id),
      });

    const invoicesDueCount =
      await this.invoiceMasterRepository.getOverdueInvoicesCount(user);

    const pendingOwnerApprovalCount =
      await this.serviceRequestMasterRepository.getPendingOwnerApprovalServiceRequests(
        user,
      );

    return [
      {
        key: 'todays_service_request_count',
        title: "Today's Service Requests",
        data: todaysServiceRequestsCount,
        redirect_url: `/service-request?start_date=${this.formatDateToMMDDYYYY(new Date())}&end_date=${this.formatDateToMMDDYYYY(new Date())}`,
        tagline: '',
      },
      {
        key: 'invoices_due_count',
        title: 'Invoices Due',
        data: invoicesDueCount,
        redirect_url: `/invoices?owner_payment_status=${InvoiceStatus.OverDue}`,
        tagline: '',
      },
      {
        key: 'issues_requiring_approval_count',
        title: 'Issues Requiring Approval',
        data: pendingOwnerApprovalCount,
        redirect_url: `/service-request`,
      },
    ];
  }

  public async getVendorDashboardData(user: JwtPayload) {
    const jobsRequiringInvoicingCount =
      await this.serviceRequestMasterRepository.count({
        invoice_master_id: IsNull(),
        status: In([
          ServiceRequestStatus.PartiallyCompleted,
          ServiceRequestStatus.CompletedSuccessfully,
        ]),
        vendor_id: Number(user.id),
      });

    const myAssignedJobsCount = await this.serviceRequestMasterRepository.count(
      {
        vendor_id: Number(user.id),
        status: In([ServiceRequestStatus.Scheduled]),
        franchise_id: Number(user.franchise_id),
      },
    );

    const vendorServiceType = await this.vendorServiceTypeRepository.find({
      vendor_id: Number(user.id),
    });

    const availableJobsCount = await this.serviceRequestMasterRepository.count({
      status: ServiceRequestStatus.NotYetAssigned,
      service_type_id: In(vendorServiceType.map((v) => v.service_type_id)),
      owner_approval_status: OwnerApprovalStatus.Approved,
    });

    const pendingEstimateRequests =
      await this.estimateMasterRepository.getVendorNotYetQuotedEstimatesCount(
        user,
      );

    // Get current month's start and end dates using moment
    const currentMonthStart = moment().startOf('month').toDate();
    const currentMonthEnd = moment().endOf('month').toDate();

    const { count: calenderDataCount } =
      await this.serviceRequestMasterRepository.getCalenderData(
        {
          start_date: currentMonthStart,
          end_date: currentMonthEnd,
        } as CalenderQueryDto,
        user,
        true,
      );

    const today = new Date();
    const todayJobsCount =
      await this.serviceRequestMasterRepository.getVendorAssignedJobsCount(
        user,
        today,
        today,
      );

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12); // 12 months ago

    const assignedOverdueServiceRequestsCount =
      await this.serviceRequestMasterRepository.getVendorAssignedJobsCount(
        user,
        twelveMonthsAgo,
        today,
        [
          ServiceRequestStatus.Scheduled,
          ServiceRequestStatus.Claimed,
          ServiceRequestStatus.DepositRequired,
          ServiceRequestStatus.InProgress,
          ServiceRequestStatus.NotYetAssigned,
        ],
      );

    const unassignedOverdueServiceRequestsCount =
      await this.serviceRequestMasterRepository.getUnassignedJobsCountWithServiceType(
        user,
        twelveMonthsAgo,
        today,
      );

    const userModel = await this.userRepository.findOne({
      where: { id: user.id },
    });

    return [
      {
        key: 'user_profile',
        title: 'user policy profile',
        policy_expire_date: userModel.policy_expire_date,
      },
      {
        key: 'my_assigned_jobs_count',
        title: 'Jobs Assigned To Me',
        data: myAssignedJobsCount,
        redirect_url: `/service-request?status=${ServiceRequestStatus.Scheduled}`,
        tagline: '',
      },
      {
        key: 'jobs_requiring_invoice_count',
        title: 'Jobs That Need Invoiced',
        data: jobsRequiringInvoicingCount,
        redirect_url: `/invoices`,
        tagline: '',
      },
      {
        key: 'available_jobs_count',
        title: 'Jobs Available To Claim',
        data: availableJobsCount,
        redirect_url: `/service-request?status=${ServiceRequestStatus.NotYetAssigned}`,
        tagline: '',
      },
      {
        key: 'today_jobs_count',
        title: 'Today Jobs',
        data: todayJobsCount,
        redirect_url: `/service-request?start_date=${this.formatDateToMMDDYYYY(new Date())}&end_date=${this.formatDateToMMDDYYYY(new Date())}`,
        tagline: '',
      },
      {
        key: 'my_calender',
        title: 'My Calender',
        data: calenderDataCount,
        redirect_url: `/service-request?view=calendar`,
        tagline: '',
      },
      {
        key: 'overdue_jobs_count',
        title: 'Overdue Jobs',
        data: Number(
          assignedOverdueServiceRequestsCount +
            unassignedOverdueServiceRequestsCount,
        ),
        redirect_url: `/service-request?start_date=${this.formatDateToMMDDYYYY(twelveMonthsAgo)}&end_date=${this.formatDateToMMDDYYYY(today)}&action=overdue_service_requests`,
        tagline: '',
      },
      {
        key: 'pending_estimate_requests',
        title: 'Jobs Available To Estimate',
        data: pendingEstimateRequests,
        redirect_url: `/estimates-request`,
        tagline: '',
      },
    ];
  }
}
