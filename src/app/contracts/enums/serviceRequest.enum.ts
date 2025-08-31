export enum ServiceRequestStatus {
  NotYetAssigned = 1,
  Claimed = 2,
  Scheduled = 3,
  InProgress = 4,
  OnHold = 5,
  PartiallyCompleted = 6,
  CompletedSuccessfully = 7,
  Rejected = 8,
  DepositRequired = 9,
  InvalidStatus = 10,
  Cancelled = 11,
}

export enum ServiceRequestDepositStatus {
  Unpaid = 1,
  Processing = 2,
  Success = 3,
  Failed = 4,
}

export enum ServiceRequestRepeatType {
  Monthly = 1,
  Weekly = 2,
}

export enum EmailContent {
  ServiceRequestCreatedByOwner = 'service_request_created_by_owner',
  ServiceRequestCreatedByGuest = 'service_request_created_by_guest',
  ServiceRequestVendorAssign = 'service_request_vendor_assign',
  ServiceRequestCreatedByFranchiseAdmin = 'service_request_created_by_franchise_admin',
  ServiceRequestCreatedByStandardAdmin = 'service_request_created_by_standard_admin',
  ServiceRequestDiscrepancyReported = 'service_request_discrepancy_reported',
  ServiceRequestVendorReleaseFromJob = 'service_request_vendor_release_from_job',
  ServiceRequestStatusUpdate = 'service_request_status_update',
  ServiceRequestClaimByVendor = 'service_request_claim_by_vendor',
  ServiceRequestApprovedByOwner = 'service_request_approved_by_owner',
  ServiceRequestCancelByOwner = 'service_request_cancel_by_owner',
  MembershipPaymentFailed = 'membership_payment_failed',
  MembershipPaymentSuccess = 'membership_payment_success',
  PaymentMethodAttachSuccess = 'payment_method_attach_success',
  PaymentMethodAttachFailed = 'payment_method_attach_failed',
}
