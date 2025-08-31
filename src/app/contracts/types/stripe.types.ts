import stripe from 'stripe';

export type StripeCustomerCreateResponse = Awaited<
  ReturnType<stripe['customers']['create']>
>;

export type StripeSetupIntentCreateResponse = Awaited<
  ReturnType<stripe['setupIntents']['create']>
>;

export type StripeSetupIntentRetrieveResponse = Awaited<
  ReturnType<stripe['setupIntents']['retrieve']>
>;

export type StripeDetachCustomerPaymentMethodResponse = Awaited<
  ReturnType<stripe['paymentMethods']['detach']>
>;

export type StripePaymentMethodRetrieveResponse = Awaited<
  ReturnType<stripe['paymentMethods']['retrieve']>
>;

export type StripePaymentIntentCreateResponse = Awaited<
  ReturnType<stripe['paymentIntents']['create']>
>;

export type StripePaymentIntentRetrieveResponse = Awaited<
  ReturnType<stripe['paymentIntents']['retrieve']>
>;

export type StripeRegisterWebhooksResponse = Awaited<
  ReturnType<stripe['webhookEndpoints']['create']>
>;

export type SetupIntentParamsType = Record<string, object | string | string[]>;

export type PaymentPayResponse = {
  error: boolean;
  data: StripePaymentIntentCreateResponse | string;
};
