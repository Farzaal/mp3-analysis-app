export enum EstimateStatus {
  EstimateRequestedByOwner = 1,
  EstimateVendorAssignment = 2,
  EstimateQuotationAddedByVendor = 3,
  EstimateSendToOwner = 4,
  EstimateApprovedByOwner = 5,
  EstimateRejectedByOwner = 6,
}

export enum EstimateOwnerStatus {
  AwaitingVendorQuote = 1,
  PendingOwnerApproval = 2,
  QuoteRecieved = 3,
  QuoteAccepted = 4,
  Reject = 5,
  UnAssigned = 10,
}

export enum EstimateVendorStatus {
  AwaitingVendorQuote = 1,
  PendingOwnerApproval = 2,
  NotYetQuoted = 3,
  Quoted = 4,
  QuoteAccepted = 5,
  Reject = 6,
}

export enum QuoteStatus {
  PendingOwnerApproval = 1,
  QuoteAccepted = 2,
  QuoteRejected = 3,
  QuoteReceived = 4,
}
