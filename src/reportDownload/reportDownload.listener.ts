import { BunyanLogger } from '@/app/commons/logger.service';
import { GeneralHelper } from '@/app/utils/general.helper';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as path from 'path';
import { GenericReportDownloadEvent } from '@/reportDownload/reportDownload.event';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';
import { NotificationMessage } from '@/notifications/notification.message';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { UserModel } from '@/app/models/user/user.model';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
import { DownloadReportEventName } from '@/app/contracts/enums/reportDownload.enum';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import {
  InvoiceStatus,
  PaymentStatus,
} from '@/app/contracts/enums/invoice.enum';
import { InvoiceReport } from '@/app/contracts/interfaces/invoice.interface';

@Injectable()
export class ReportDownloadListener {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly generalHelper: GeneralHelper,
    private readonly logger: BunyanLogger,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_EMAIL_USER'),
        pass: this.configService.get('SMTP_EMAIL_PASSWORD'),
      },
    });
  }

  private formatCSVString = (val: string) => val.replace(/,/g, ' ');

  @OnEvent(DownloadReportEventName.VENDOR_INVOICE_REPORT)
  async handleVendorInvoiceReport(
    event: GenericReportDownloadEvent<InvoiceMasterModel>,
  ) {
    this.logger.log(
      '[EVENT] Vendor invoice report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Invoice #',
      'Property',
      'Address',
      'Service Category',
      'Service Type',
      'Created',
      'Service Date',
      'Payment Status',
      'Vendor Paid Date',
      'Amount Paid',
    ];

    const rows = report.data.map((invoice) => {
      return [
        invoice.id,
        invoice.service_request_master.propertyMaster.property_nick_name,
        invoice.service_request_master.propertyMaster.address,
        invoice.service_request_master.serviceType.serviceTypeCategory.title,
        invoice.service_request_master.serviceType.title,
        invoice.created_at
          ? new Date(invoice.created_at * 1000).toISOString().split('T')[0]
          : '',
        invoice.service_request_master.start_date
          ? new Date(invoice.service_request_master.start_date)
              .toISOString()
              .split('T')[0]
          : '',
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Vendor Invoice Report',
      'Please find the Vendor Invoice Report that you requested attached with this email.',
      [
        {
          filename: `vendor-invoice-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Vendor invoice report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.OWNER_INVOICE_REPORT)
  async handleOwnerInvoiceReport(
    event: GenericReportDownloadEvent<InvoiceMasterModel>,
  ) {
    this.logger.log(
      '[EVENT] Owner invoice report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Invoice #',
      'Owner',
      'Property',
      'Address',
      'Created',
      'Service Date',
      'Service Category',
      'Service Type',
      'Total Due',
      'Amount Paid',
      'Balance',
      'Invoice Status',
      'Date Paid',
      'Payment Method',
    ];

    const rows = report.data.map((invoice) => {
      return [
        invoice.id,
        invoice.service_request_master.owner.first_name +
          ' ' +
          invoice.service_request_master.owner.last_name,
        invoice.service_request_master.propertyMaster.property_nick_name,
        invoice.service_request_master.propertyMaster.address,
        invoice.created_at
          ? new Date(invoice.created_at * 1000).toISOString().split('T')[0]
          : '',
        invoice.service_request_master.start_date
          ? new Date(invoice.service_request_master.start_date)
              .toISOString()
              .split('T')[0]
          : '',
        invoice.service_request_master.serviceType.serviceTypeCategory.title,
        invoice.service_request_master.serviceType.title,
        invoice.franchise_total,
        invoice.paid_by_owner_at
          ? new Date(invoice.paid_by_owner_at).toISOString().split('T')[0]
          : '',
        invoice.invoice_master_payment?.[0]?.paymentMethod?.[0]
          ?.payment_method_type ?? '',
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Owner Invoice Report',
      'Please find the Owner Invoice Report that you requested attached with this email.',
      [
        {
          filename: `owner-invoice-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Owner invoice report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.ADMIN_INVOICE_REPORT)
  async handleAdminInvoiceReport(
    event: GenericReportDownloadEvent<InvoiceMasterModel>,
  ) {
    this.logger.log(
      '[EVENT] Admin invoice report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Invoice #',
      'Owner',
      'Property',
      'Address',
      'Service Category',
      'Service Type',
      'Service Date',
      'Invoice Created',
      'Inv.Sent To Owner',
      'Owner Paid Invoice',
      'Owner Invoice Total',
      'Owner Invoice Status',
      'Partner',
      'Partner Payment Status',
      'Partner Invoice Total',
      'Partner Invoice Margin',
    ];

    const rows = report.data.map((invoice) => {
      return [
        invoice.id,
        invoice.service_request_master.owner.first_name +
          ' ' +
          invoice.service_request_master.owner.last_name,
        invoice.service_request_master.propertyMaster.property_nick_name,
        invoice.service_request_master.propertyMaster.address,
        invoice.service_request_master.serviceType.serviceTypeCategory.title,
        invoice.service_request_master.serviceType.title,
        invoice.service_request_master.start_date
          ? new Date(invoice.service_request_master.start_date)
              .toISOString()
              .split('T')[0]
          : '',
        invoice.created_at
          ? new Date(invoice.created_at * 1000).toISOString().split('T')[0]
          : '',
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Admin Invoice Report',
      'Please find the Admin Invoice Report that you requested attached with this email.',
      [
        {
          filename: `admin-invoice-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Admin invoice report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.OWNER_SERVICE_REQUEST_REPORT)
  async handleOwnerServiceRequestReport(
    event: GenericReportDownloadEvent<ServiceRequestMasterModel>,
  ) {
    this.logger.log(
      '[EVENT] Owner service request report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Service Request #',
      'Generated By',
      'Property',
      'Address',
      'Property Owner',
      'Service Category',
      'Service Type',
      'Date Created',
      'Status',
      'Invoice Status',
      'Owner Payment Status',
    ];

    const rows = report.data.map((serviceRequest) => {
      return [
        serviceRequest.id,
        serviceRequest.creator?.first_name +
          ' ' +
          serviceRequest.creator?.last_name,
        serviceRequest.propertyMaster.property_nick_name,
        serviceRequest.propertyMaster.address,
        serviceRequest.owner.first_name + ' ' + serviceRequest.owner.last_name,
        serviceRequest.serviceType.serviceTypeCategory.title,
        serviceRequest.serviceType.title,
        serviceRequest.created_at
          ? new Date(serviceRequest.created_at * 1000)
              .toISOString()
              .split('T')[0]
          : '',
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Owner Service Request Report',
      'Please find the Owner Service Request Report that you requested attached with this email.',
      [
        {
          filename: `owner-service-request-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Owner service request report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.VENDOR_REPORT)
  async handleVendorReport(event: GenericReportDownloadEvent<UserModel>) {
    this.logger.log(
      '[EVENT] Vendor service request report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Business Name',
      'Contact',
      'Mobile Number',
      'Office Number',
      'Email',
      'Mailing Address',
      'City',
      'State',
      'Zip Code',
      'Date Joined',
      'Service Area(s)',
      'Insurance Expiration',
      'Status',
    ];

    const rows = report.data.map((vendor) => {
      return [
        vendor.first_name + ' ' + vendor.last_name,
        vendor.contact,
        vendor.cell_phone,
        vendor.office_phone,
        vendor.email,
        vendor.mailing_address,
        vendor.city,
        vendor.state,
        vendor.zip,
        vendor.created_at
          ? new Date(vendor.created_at * 1000).toISOString().split('T')[0]
          : '',
        vendor.vendorUserLoc
          .map((location) => location.vendorServiceLocation.service_area)
          .join(' | '),
        vendor.policy_expire_date
          ? new Date(vendor.policy_expire_date).toISOString().split('T')[0]
          : '',
        vendor.is_active ? 'Active' : 'Inactive',
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Vendor Report',
      'Please find the Vendor Report that you requested attached with this email.',
      [
        {
          filename: `vendor-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log('[EVENT] Vendor report preparation process completed');
  }

  @OnEvent(DownloadReportEventName.VENDORS)
  async handleVendor(event: GenericReportDownloadEvent<UserModel>) {
    this.logger.log('[EVENT] Vendors download preparation process initiated');

    const report = await event.getter();

    const headers = [
      'Service Partner',
      'Contact Name',
      'Mobile No.',
      'Office Phone',
      'Email',
      'Mailing Address',
      'Date Joined',
      'Service Area(s)',
      'Insurance Expiry',
    ];

    const rows = report.data.map((vendor) => {
      return [
        this.formatCSVString(vendor.first_name),
        this.formatCSVString(vendor.last_name),
        this.formatCSVString(vendor.cell_phone),
        this.formatCSVString(vendor.office_phone),
        this.formatCSVString(vendor.email),
        this.formatCSVString(vendor.mailing_address),
        vendor.created_at
          ? new Date(vendor.created_at * 1000).toISOString().split('T')[0]
          : '',
        vendor.vendorUserLoc
          .map((location) => location.vendorServiceLocation.service_area)
          .join(' | '),
        vendor.policy_expire_date
          ? new Date(vendor.policy_expire_date).toISOString().split('T')[0]
          : '',
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);
    this.logger.log('Vendor Report email sent to ', event.user.email);

    await this.sendEmail(
      event.user.email,
      'Vendor Report',
      'Please find the Vendor Report that you requested attached with this email.',
      [
        {
          filename: `vendor-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log('[EVENT] Vendor report preparation process completed');
  }

  @OnEvent(DownloadReportEventName.OWNER_REPORT)
  async handleOwnerReport(event: GenericReportDownloadEvent<UserModel>) {
    this.logger.log('[EVENT] Owner report preparation process initiated');

    const report = await event.getter();

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone #',
      'Mailing Address',
      'Office #',
      'Membership Status',
      'Date Joined',
    ];

    const rows = [];

    for (const owner of report.data) {
      if (!owner.propertyMaster.length) {
        rows.push([
          owner.first_name,
          owner.last_name,
          owner.email,
          owner.contact,
          owner.mailing_address,
          owner.office_phone,
          'N/A',
          owner.created_at
            ? new Date(owner.created_at * 1000).toISOString().split('T')[0]
            : '',
        ]);

        continue;
      }

      for (const property of owner.propertyMaster) {
        rows.push([
          owner.first_name,
          owner.last_name,
          owner.email,
          owner.contact,
          owner.mailing_address,
          property.alternate_contact_phone,
          MemberShipStatus[property.membershipTier.membership_type],
          owner.created_at
            ? new Date(owner.created_at * 1000).toISOString().split('T')[0]
            : '',
        ]);
      }
    }

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Owner Report',
      'Please find the Owner Report that you requested attached with this email.',
      [
        {
          filename: `owner-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log('[EVENT] Owner report preparation process completed');
  }

  @OnEvent(DownloadReportEventName.FRANCHISE_SERVICE_REQUEST_REPORT)
  async handleFranchiseServiceRequestReport(
    event: GenericReportDownloadEvent<ServiceRequestMasterModel>,
  ) {
    this.logger.log(
      '[EVENT] Franchise service request report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Service Request #',
      'Generated By',
      'Property',
      'Address',
      'Property Owner',
      'Service Category',
      'Service Type',
      'Date Created',
      'Status',
      'Invoice Status',
      'Owner Payment Status',
      'Vendor Payment Status',
    ];

    const rows = report.data.map((serviceRequest) => {
      return [
        serviceRequest.id,
        serviceRequest.creator?.first_name +
          ' ' +
          serviceRequest.creator?.last_name,
        serviceRequest.propertyMaster.property_nick_name,
        serviceRequest.propertyMaster.address,
        serviceRequest.owner.first_name + ' ' + serviceRequest.owner.last_name,
        serviceRequest.serviceType.serviceTypeCategory.title,
        serviceRequest.serviceType.title,
        serviceRequest.created_at
          ? new Date(serviceRequest.created_at * 1000)
              .toISOString()
              .split('T')[0]
          : '',
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Franchise Service Request Report',
      'Please find the Franchise Service Request Report that you requested attached with this email.',
      [
        {
          filename: `franchise-service-request-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Franchise service request report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.ADMIN_PROPERTY_REPORT)
  async handleAdminPropertyReport(
    event: GenericReportDownloadEvent<PropertyMasterModel>,
  ) {
    this.logger.log(
      '[EVENT] Admin property report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Owner',
      'Property Name',
      'Address',
      'City',
      'Zip Code',
      'Property Membership Status',
      'Membership Charge',
      'Next Due',
      'Number of Bedrooms',
      'Number of Bathrooms',
    ];

    const rows = report.data.map((property) => {
      return [
        property.owner.first_name + ' ' + property.owner.last_name,
        property.property_nick_name,
        property.address,
        property.propertyLocation.service_area,
        property.owner.zip,
        MemberShipStatus[property.membershipTier.membership_type],
        property.membershipTier.price,
        property.membershipTier.next_due_date || 'N/A',
        property.propertyCleaningDetail.number_of_bedrooms,
        property.propertyCleaningDetail.number_of_baths,
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Admin Property Report',
      'Please find the Admin Property Report that you requested attached with this email.',
      [
        {
          filename: `admin-property-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Admin property report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.SERVICE_REQUEST_LISTING)
  async handleServiceRequestListingReport(
    event: GenericReportDownloadEvent<ServiceRequestMasterModel>,
  ) {
    const report = await event.getter();

    let headers: string[];
    let rows: (string | number | Date)[][];

    if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        event.user.user_type,
      )
    ) {
      headers = [
        'Job #',
        'Generated By (Role)',
        'Generated By (Name)',
        'Property Address',
        'Service Category',
        'Service Type',
        'Service Date (If Requested)',
        'Date Created',
        'Job Status',
        'Claimed By',
      ];

      rows = report.data.map((serviceRequest) => {
        return [
          serviceRequest.id,
          UserType[serviceRequest.creator?.user_type],
          serviceRequest.creator?.first_name +
            ' ' +
            serviceRequest.creator?.last_name,
          this.formatCSVString(serviceRequest.propertyMaster.address),
          serviceRequest.serviceType.serviceTypeCategory.title,
          serviceRequest.serviceType.title,
          serviceRequest.start_date &&
          !isNaN(new Date(serviceRequest.start_date).getTime())
            ? new Date(serviceRequest.start_date).toISOString().split('T')[0]
            : '',
          serviceRequest.created_at &&
          !isNaN(new Date(serviceRequest.created_at).getTime())
            ? new Date(serviceRequest.created_at).toISOString().split('T')[0]
            : '',
          serviceRequest.created_at,
          ServiceRequestStatus[serviceRequest.status],
          serviceRequest.vendor?.first_name +
            ' ' +
            serviceRequest.vendor?.last_name,
          serviceRequest.invoice_master?.invoice_status
            ? serviceRequest.invoice_master?.invoice_status ==
              InvoiceStatus.PaidByOwnerSuccess
              ? 'Paid'
              : 'UnPaid'
            : 'UnPaid',
          serviceRequest.invoice_master?.invoice_master_vendor_payment
            ?.payment_status
            ? serviceRequest.invoice_master?.invoice_master_vendor_payment
                ?.payment_status === PaymentStatus.Paid
              ? 'Paid'
              : 'UnPaid'
            : 'UnPaid',
          serviceRequest.invoice_master?.invoice_status
            ? serviceRequest.invoice_master?.invoice_status ==
              InvoiceStatus.PaidByOwnerSuccess
              ? 'Paid'
              : 'UnPaid'
            : 'UnPaid',
        ];
      });
    }

    if (event.user.user_type === UserType.Owner) {
      headers = [
        'Job #',
        'Property Address',
        'Service Type',
        'Service Date (If Requested)',
        'Date Created',
        'Job Status',
        'Invoice Status',
      ];

      rows = report.data.map((serviceRequest) => {
        return [
          serviceRequest.id,
          this.formatCSVString(serviceRequest.propertyMaster.address),
          serviceRequest.serviceType.title,
          serviceRequest.start_date &&
          !isNaN(new Date(serviceRequest.start_date).getTime())
            ? new Date(serviceRequest.start_date).toISOString().split('T')[0]
            : '',
          serviceRequest.created_at &&
          !isNaN(new Date(serviceRequest.created_at).getTime())
            ? new Date(serviceRequest.created_at).toISOString().split('T')[0]
            : '',
          ServiceRequestStatus[serviceRequest.status],
          serviceRequest.invoice_master?.invoice_status
            ? serviceRequest.invoice_master?.invoice_status ==
              InvoiceStatus.PaidByOwnerSuccess
              ? 'Paid'
              : 'UnPaid'
            : 'UnPaid',
        ];
      });
    }

    if (event.user.user_type === UserType.Vendor) {
      headers = [
        'Job #',
        'Property Address',
        'Service Type',
        'Service Date (If Requested)',
        'Priority',
        'Job Status',
        'Invoice Status',
      ];

      rows = report.data.map((serviceRequest) => {
        return [
          serviceRequest.id,
          this.formatCSVString(serviceRequest.propertyMaster.address),
          serviceRequest.serviceType.title,
          serviceRequest.start_date &&
          !isNaN(new Date(serviceRequest.start_date).getTime())
            ? new Date(serviceRequest.start_date).toISOString().split('T')[0]
            : '',
          serviceRequest.priority,
          ServiceRequestStatus[serviceRequest.status],
        ];
      });
    }

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Service Request Listing',
      'Please find the Service Request Listing that you requested attached with this email.',
      [
        {
          filename: `service-request-listing-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Service request listing report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.PROPERTY_LISTING)
  async handlePropertyListingReport(
    event: GenericReportDownloadEvent<PropertyMasterModel>,
  ) {
    if (
      ![UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        event.user.user_type,
      )
    ) {
      this.logger.log(
        `[EVENT] Property listing report preparation process skipped for user type ${event.user.user_type}`,
      );

      return;
    }

    this.logger.log(
      '[EVENT] Property listing report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Sno',
      'First Name',
      'Last Name',
      'Address',
      'City',
      'State',
      'Zip code',
      'Property MemberShip',
      'Property Charge',
      'Next Due',
      'Number of Bedrooms',
      'Number of Bathrooms',
    ];

    const rows = report.data.map((property, index) => {
      return [
        index + 1,
        property.owner.first_name,
        property.owner.last_name,
        this.formatCSVString(property.address),
        property.city,
        property.state,
        property.owner.zip,
        MemberShipStatus[property.membershipTier.membership_type],
        property.membershipTier.price,
        property.membershipTier.next_due_date || 'N/A',
        property.propertyCleaningDetail.number_of_bedrooms,
        property.propertyCleaningDetail.number_of_baths,
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Property Listing',
      'Please find the Property Listing that you requested attached with this email.',
      [
        {
          filename: `property-listing-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Property listing report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.OWNER_LISTING)
  async handleOwnerListingReport(event: GenericReportDownloadEvent<UserModel>) {
    if (
      ![UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        event.user.user_type,
      )
    ) {
      this.logger.log(
        `[EVENT] Owner listing report preparation process skipped for user type ${event.user.user_type}`,
      );

      return;
    }

    this.logger.log(
      '[EVENT] Owner listing report preparation process initiated',
    );

    const report = await event.getter();

    const headers = [
      'Sno',
      'First Name',
      'Last Name',
      'Email',
      'Phone No.',
      'Mailing Address',
      'Secondary Contact Name',
      'Secondary Contact Phone',
      'Agreed to Terms',
      'Date Joined',
    ];

    const rows = report.data?.map((owner, index) => {
      return [
        index + 1,
        owner.first_name,
        owner.last_name,
        owner.email,
        owner.contact || 'N/A',
        this.formatCSVString(owner.mailing_address || 'N/A'),
        owner.office_phone || '',
        owner.office_phone || '',
        owner.terms_and_conditions
          ? 'Yes'
          : 'No' +
            ' | ' +
            (owner.created_at
              ? new Date(owner.created_at * 1000).toISOString().split('T')[0]
              : ''),
        owner.created_at
          ? new Date(owner.created_at * 1000).toISOString().split('T')[0]
          : '',
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Owner Listing',
      'Please find the Owner Listing that you requested attached with this email.',
      [
        {
          filename: `owner-listing-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log(
      '[EVENT] Owner listing report preparation process completed',
    );
  }

  @OnEvent(DownloadReportEventName.INVOICES)
  async handleInvoicesReport(event: GenericReportDownloadEvent<InvoiceReport>) {
    this.logger.log('[EVENT] Invoices report preparation process initiated');

    const report = await event.getter();

    const headers = [
      'Invoice #',
      'Owner',
      'Property',
      'Service Category',
      'Service Type',
      'Service Date',
      'Date Created',
      'Service Partner',
      'Owner Due',
      'Owner Payment Status',
      'Service Partner Due',
    ];

    const rows = report.data.map((invoice) => {
      return [
        invoice.id,
        invoice.owner_name,
        `${this.formatCSVString(invoice.property_name_address)} - ${this.formatCSVString(invoice.property_nick_name)}`,
        invoice.service_type_category_title,
        invoice.service_type_title,
        invoice.service_date,
        invoice.created_at,
        invoice.vendor_name,
        invoice.franchise_total,
        InvoiceStatus[invoice.invoice_status],
        invoice.vendor_remaining_balance,
      ];
    });

    const csv = this.generalHelper.generateCsv(headers, rows);

    await this.sendEmail(
      event.user.email,
      'Invoices',
      'Please find the Invoices that you requested attached with this email.',
      [
        {
          filename: `invoices-report-${new Date().toISOString()}.csv`,
          content: csv,
        },
      ],
    );

    this.logger.log('[EVENT] Invoices report preparation process completed');
  }

  private async sendEmail(
    to: string,
    subject: string,
    message: string,
    attachments: any[],
  ) {
    const compiledTemplate = handlebars.compile(
      this.readHTMLTemplate('genericTemplate.html'),
    );

    const htmlToSend = compiledTemplate({
      title: subject,
      message,
    });

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: this.configService.get('DEBUG_REPORT_DOWNLOAD_EMAIL') || to,
      subject,
      html: htmlToSend,
      attachments,
    });
  }

  private readHTMLTemplate(templateName: string): string {
    try {
      const templatePath = path.resolve(
        process.cwd(),
        'src/notifications/templates',
        templateName,
      );

      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      this.logger.error(`Error reading HTML template: ${templateName}`, error);
      throw new Error(NotificationMessage.TEMPLATE_NOT_FOUND);
    }
  }
}
