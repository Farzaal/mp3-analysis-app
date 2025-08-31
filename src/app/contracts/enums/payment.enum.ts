export enum PaymentMethod {
  Card = 'card',
  BankAccount = 'us_bank_account',
}

export enum PaymentMethodStatus {
  Created = 1,
  Succeeded = 2,
  VerificationPending = 3,
  Failed = 4,
}

export enum StripeWebhookEvents {
  SetupIntentRequireAction = 'setup_intent.requires_action',
  SetupIntentFailed = 'setup_intent.setup_failed',
  SetupIntentSucceeded = 'setup_intent.succeeded',
  PaymentMethodAttached = 'payment_method.attached',
  PaymentIntentCreated = 'payment_intent.created',
  PaymentIntentProcessing = 'payment_intent.processing',
  PaymentIntentFailed = 'payment_intent.payment_failed',
  PaymentIntentRequireAction = 'payment_intent.requires_action',
  PaymentIntentPartiallyFunded = 'payment_intent.partially_funded',
  PaymentIntentCanceled = 'payment_intent.canceled',
  PaymentIntentSucceeded = 'payment_intent.succeeded',
  ChargeDisputeCreated = 'charge.dispute.created',
  ChargeDisputeFundsWithdrawn = 'charge.dispute.funds_withdrawn',
  ChargeDisputeClosed = 'charge.dispute.closed',
}
