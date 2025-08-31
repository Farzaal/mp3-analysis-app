import { EmailContent } from '../contracts/enums/serviceRequest.enum';

export const emailContent = new Map<EmailContent, string>([
  [
    EmailContent.ServiceRequestCreatedByOwner,
    'Service Request has been created by {{name}} for property {{address}}.',
  ],
  [
    EmailContent.ServiceRequestCreatedByGuest,
    'Service Request has been requested by guest {{name}} for property {{address}}.',
  ],
  [
    EmailContent.ServiceRequestVendorAssign,
    'You have been assigned service request by {{name}} for property {{address}}.',
  ],
  [
    EmailContent.ServiceRequestCreatedByFranchiseAdmin,
    'Service Request has been created by {{name}} for property {{address}}.',
  ],
  [
    EmailContent.ServiceRequestCreatedByStandardAdmin,
    'Service Request has been created by {{name}} for property {{address}}.',
  ],
  [
    EmailContent.ServiceRequestDiscrepancyReported,
    'Discrepancy has been reported by {{name}} for property {{address}}.',
  ],
  [
    EmailContent.ServiceRequestVendorReleaseFromJob,
    'Vendor {{name}} has been release from job #{{jobId}}.',
  ],
  [
    EmailContent.ServiceRequestStatusUpdate,
    'Service request status has been updated to {{status}} by {{name}}, job #{{jobId}}.',
  ],
  [
    EmailContent.ServiceRequestClaimByVendor,
    'Service request has been {{status}} by {{name}}, job #{{jobId}}.',
  ],
  [
    EmailContent.ServiceRequestApprovedByOwner,
    '{{type}} Service request has been approved by owner {{name}} for property {{address}}, job #{{jobId}}.',
  ],
  [
    EmailContent.ServiceRequestCancelByOwner,
    'Service request has been cancelled by owner {{name}} for property {{address}}, job #{{jobId}}.',
  ],
  [
    EmailContent.MembershipPaymentFailed,
    'This is to inform you that membership payment for property {{address}} has failed',
  ],
  [
    EmailContent.MembershipPaymentSuccess,
    'This is to inform you that membership payment for property {{address}} has succeeded',
  ],
  [
    EmailContent.PaymentMethodAttachSuccess,
    'Your {{paymentMethodType}} ending with {{endingNumber}} has been successfully attached to, {{ownerName}} account. You can now use this method for future transactions.',
  ],
  [
    EmailContent.PaymentMethodAttachFailed,
    'We were unable to attach {{paymentMethodType}} ending with {{endingNumber}} to {{ownerName}} account. Please review the details and try again.',
  ],
]);
