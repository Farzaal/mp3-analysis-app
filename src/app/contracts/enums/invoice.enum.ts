export enum InvoiceStatus {
  SentToAdmin = 1,
  SentToOwner = 2,
  PaidByOwnerSuccess = 3,
  PaidByOwnerFailed = 4,
  PaidByOwnerProcessing = 5,
  RejectedAndSentToVendor = 6,
  Created = 7,
  OverDue = 8,
  OnHold = 9,
}

export enum InvoiceSection {
  HoursWorked = 1,
  Material = 2,
  Labor = 3,
  ServiceCallFeeRegularBusinessHours = 4,
  ServiceCallFeeAfterHoursWeekendHoliday = 5,
  AdditionalCost = 6,
}

export enum InvoicePaymentStatus {
  Unpaid = 1,
  Processing = 2,
  Success = 3,
  Failed = 4,
}

export enum PaymentType {
  Cheque = 1,
  Card = 2,
  ACH = 3,
}

export enum PaymentStatus {
  Paid = 1,
  Unpaid = 2,
}
