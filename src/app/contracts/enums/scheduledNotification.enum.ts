export enum ScheduledNotificationStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PENDING = 'PENDING',
}

export enum ScheduledNotificationMedium {
  EMAIL = 'email',
  SMS = 'sms',
}

export enum ScheduledNotificationTrigger {
  URGENT_VENDOR_JOBS = 'URGENT_VENDOR_JOBS',
  PENDING_JOBS_ONE_WEEK_BEFORE = 'PENDING_JOBS_ONE_WEEK_BEFORE',
}

export const ScheduledNotificationConfig = {
  [ScheduledNotificationTrigger.URGENT_VENDOR_JOBS]: {
    subject: 'Urgent Jobs Available',
    message:
      'The following service requests are urgent and need to be claimed by a vendor:',
    templates: {
      email: 'urgentVendorJobs.html',
      sms: 'urgentVendorJobs.txt',
    },
  },
  [ScheduledNotificationTrigger.PENDING_JOBS_ONE_WEEK_BEFORE]: {
    subject: 'Pending Jobs Available',
    message:
      'The following service requests are pending and need to be claimed within the next week:',
    templates: {
      email: 'pendingJobsOneWeekBefore.html',
      sms: 'pendingJobsOneWeekBefore.txt',
    },
  },
};
