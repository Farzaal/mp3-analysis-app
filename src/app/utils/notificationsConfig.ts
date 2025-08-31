import {
  NotificationAction,
  NotificationType,
  NotificationTemplate,
} from '../contracts/enums/notification.enum';
import { NotificationParams } from '../contracts/interfaces/notificationParams.interface';

export const NotificationConfig = new Map<
  NotificationAction,
  NotificationParams
>([
  [
    NotificationAction.FORGOT_PASSWORD,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.FORGOT_PASSWORD,
      subject: 'Forgot Password',
      options: ['email'],
    },
  ],
  [
    NotificationAction.FRANCHISE_ADMIN_CREATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.FRANCHISE_ADMIN_CREATED,
      subject: 'Franchise Admin Created',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.SERVICE_TYPE_CATEGORY_CREATED,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.SERVICE_TYPE_CATEGORY_CREATED,
      subject: 'Service Type Category Created',
      options: ['email'], // SMS not supported yet
    },
  ],
  [
    NotificationAction.SERVICE_TYPE_CATEGORY_DELETED,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.SERVICE_TYPE_CATEGORY_DELETED,
      subject: 'Service Type Category Deleted',
      options: ['email'], // SMS not supported yet
    },
  ],
  [
    NotificationAction.SERVICE_TYPE_REQUEST_CREATED,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.SERVICE_TYPE_CREATED,
      subject: 'New Service Type Request',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.STANDARD_ADMIN_CREATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.STANDARD_ADMIN_CREATED,
      subject: 'Welcome to We Oversee!',
      options: ['email'], // 'sms' is not supported for this action as dont have number.
    },
  ],
  [
    NotificationAction.STANDARD_ADMIN_UPDATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.STANDARD_ADMIN_UPDATED,
      subject: 'Your account has been updated',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.VENDOR_CREATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.VENDOR_CREATED,
      subject: 'Welcome to We Oversee!',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.VENDOR_STATUS_CHANGED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.VENDOR_STATUS_CHANGED,
      subject: 'Your account status has been changed',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.ESTIMATE_CREATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.ESTIMATE_CREATED,
      subject: 'New Estimate Created',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.ESTIMATE_REJECTION_BY_OWNER_FOR_VENDOR,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.ESTIMATE_REJECTION_BY_OWNER_FOR_VENDOR,
      subject: 'Estimate Rejected by Owner',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.ESTIMATE_REJECTION_BY_OWNER_FOR_FRANCHISE_ADMIN,
    {
      type: NotificationType.Single,
      template:
        NotificationTemplate.ESTIMATE_REJECTION_BY_OWNER_FOR_FRANCHISE_ADMIN,
      subject: 'Estimate Rejected by Owner',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.ESTIMATE_VENDOR_ASSIGNMENT_SINGLE,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.ESTIMATE_VENDOR_ASSIGNMENT,
      subject: 'You have been assigned an estimate',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.ESTIMATE_VENDOR_ASSIGNMENT_MULTI,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.ESTIMATE_VENDOR_ASSIGNMENT,
      subject: 'You have been assigned an estimate',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.ESTIMATE_VENDOR_QUOTATION_UPDATE_BY_FRANCHISE_ADMIN,
    {
      type: NotificationType.Single,
      template:
        NotificationTemplate.ESTIMATE_VENDOR_QUOTATION_UPDATE_BY_FRANCHISE_ADMIN,
      subject: 'Quotation Received For Your Estimate',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.ESTIMATE_VENDOR_QUOTATION_ADDED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.ESTIMATE_VENDOR_QUOTATION_ADDED,
      subject: 'New Quotation Added For Your Estimate',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.INVOICE_REJECTED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.INVOICE_REJECTED,
      subject: 'Invoice Rejected',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.INVOICE_CREATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.INVOICE_CREATED,
      subject: 'Invoice Created',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.INVOICE_UPDATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.INVOICE_UPDATED,
      subject: 'Invoice Updated',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.INVOICE_SENT_TO_OWNER,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.INVOICE_SENT_TO_OWNER,
      subject: 'Invoice Sent to Owner',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.INVOICE_PAYMENT_RECORDED_BY_FRANCHISE_ADMIN,
    {
      type: NotificationType.Single,
      template:
        NotificationTemplate.INVOICE_PAYMENT_RECORDED_BY_FRANCHISE_ADMIN,
      subject: 'Invoice Payment Recorded by Franchise Admin',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.INVOICE_PAYMENT_MADE_BY_OWNER,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.INVOICE_PAYMENT_MADE_BY_OWNER,
      subject: 'Invoice Payment Made by Owner',
      options: ['email'],
    },
  ],
  [
    NotificationAction.INVOICE_PAYMENT_FAILED_BY_OWNER,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.INVOICE_PAYMENT_FAILED_BY_OWNER,
      subject: 'Invoice Payment Failed by Owner',
      options: ['email'],
    },
  ],
  [
    NotificationAction.INVOICE_PAYMENT_INITIATED_BY_OWNER,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.INVOICE_PAYMENT_INITIATED_BY_OWNER,
      subject: 'Invoice Payment Initiated by Owner',
      options: ['email'],
    },
  ],
  [
    NotificationAction.OWNER_CREATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.OWNER_CREATED,
      subject: 'Welcome to We Oversee!',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.SERVICE_REQUEST_CREATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'New Service Request Notification',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.OWNER_ARCHIVED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.OWNER_ARCHIVED,
      subject: 'Your account has been archived',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.SERVICE_REQUEST_DISCREPANCY_CREATED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Service Request Discrepancy Notification',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.SERVICE_REQUEST_RELEASE_VENDOR,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Vendor Service Request Release Notification',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.SERVICE_REQUEST_STATUS_UPDATE,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Service Request Update',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.SERVICE_REQUEST_CLAIMED,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Service Request Claim Notification',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.OWNER_UNARCHIVE,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.OWNER_UNARCHIVED,
      subject: 'Your account has been unarchived',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.SERVICE_REQUEST_UPDATE,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.SERVICE_REQUEST_UPDATE,
      subject: 'Service Request Update',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.VENDOR_UNASSIGNED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.VENDOR_UNASSIGNED,
      subject: 'You have been unassigned from Job',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.VENDOR_ASSIGNED,
    {
      type: NotificationType.Single,
      template: NotificationTemplate.VENDOR_ASSIGNED,
      subject: 'You have been assigned to Job',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.BULK_VENDOR_ASSIGNED,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.VENDOR_ASSIGNED,
      subject: 'You have been assigned to Job',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.SERVICE_REQUEST_CANCEL,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Job Cancel Notification',
      options: ['email', 'sms'],
    },
  ],
  [
    NotificationAction.MEMBERSHIP_PAYMENT_FAILED,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Membership Payment Failed',
      options: ['email'],
    },
  ],
  [
    NotificationAction.MEMBERSHIP_PAYMENT_SUCCESS,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Membership Payment Success',
      options: ['email'],
    },
  ],
  [
    NotificationAction.PAYMENT_METHOD_ATTACHED_SUCCESS,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Payment Method Attach Update',
      options: ['email'],
    },
  ],
  [
    NotificationAction.PAYMENT_METHOD_ATTACHED_FAILED,
    {
      type: NotificationType.Multi,
      template: NotificationTemplate.GENERAL_TEMPLATE,
      subject: 'Payment Method Attach Update',
      options: ['email'],
    },
  ],
]);
