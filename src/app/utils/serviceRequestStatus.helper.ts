import { PaymentMethodStatus } from '../contracts/enums/payment.enum';
import { ServiceRequestStatus } from '../contracts/enums/serviceRequest.enum';

const serviceRequestStatusMap = new Map<
  ServiceRequestStatus,
  ServiceRequestStatus[]
>([
  [
    ServiceRequestStatus.NotYetAssigned,
    [ServiceRequestStatus.Claimed, ServiceRequestStatus.Scheduled],
  ],
  [
    ServiceRequestStatus.Claimed,
    [ServiceRequestStatus.Scheduled, ServiceRequestStatus.Rejected],
  ],
  [
    ServiceRequestStatus.Scheduled,
    [ServiceRequestStatus.InProgress, ServiceRequestStatus.DepositRequired],
  ],
  [ServiceRequestStatus.DepositRequired, [ServiceRequestStatus.InProgress]],
  [
    ServiceRequestStatus.InProgress,
    [
      ServiceRequestStatus.DepositRequired,
      ServiceRequestStatus.PartiallyCompleted,
      ServiceRequestStatus.CompletedSuccessfully,
    ],
  ],
  [ServiceRequestStatus.CompletedSuccessfully, []],
  [ServiceRequestStatus.Rejected, []],
]);

export const ServiceRequestStatusDescription = new Map<number, string>([
  [1, 'Not Yet Assigned'],
  [2, 'Claimed'],
  [3, 'Scheduled'],
  [4, 'In Progress'],
  [5, 'On Hold'],
  [6, 'Closed / Not Completed'],
  [7, 'Completed Successfully'],
  [8, 'Rejected'],
  [9, 'Deposit Required'],
  [10, 'Invalid Status'],
]);

export const PaymentMethodMessages = new Map<number, string>([
  [
    PaymentMethodStatus.Created,
    'This payment method has not been verified yet',
  ],
  [PaymentMethodStatus.Failed, 'This payment method integration has failed'],
  [
    PaymentMethodStatus.VerificationPending,
    'This payment method verification is pending',
  ],
]);

export function getNextStatuses(
  currentStatus: ServiceRequestStatus,
): ServiceRequestStatus[] | undefined {
  return serviceRequestStatusMap.get(currentStatus) ?? undefined;
}
