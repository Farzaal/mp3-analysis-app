import {
  PaymentPayResponse,
  SetupIntentParamsType,
  StripeCustomerCreateResponse,
  StripeDetachCustomerPaymentMethodResponse,
  StripePaymentIntentRetrieveResponse,
  StripePaymentMethodRetrieveResponse,
  StripeRegisterWebhooksResponse,
  StripeSetupIntentCreateResponse,
  StripeSetupIntentRetrieveResponse,
} from '@/app/contracts/types/stripe.types';
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import {
  PaymentMethod,
  StripeWebhookEvents,
} from '@/app/contracts/enums/payment.enum';
import {
  IProcessGuestConciergePaymentParams,
  IProcessPaymentParams,
} from '@/app/contracts/interfaces/payment.interface';
import { ConfigService } from '@nestjs/config';
import { BunyanLogger } from '@/app/commons/logger.service';

@Injectable()
export class StripeService {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly logger: BunyanLogger,
  ) {}

  protected initStripe(stripeSecretKey: string) {
    return new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });
  }

  protected async createCustomer(
    name: string,
    email: string,
    stripeSecretKey: string,
  ): Promise<StripeCustomerCreateResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      return await stripeInstance.customers.create({ name, email });
    } catch (error) {
      this.logger.error(`[STRIPE] Error in createCustomer : ${error}`);
      return null;
    }
  }

  protected async createSetupIntent(
    customer: string,
    paymentMethodType: PaymentMethod,
    stripeSecretKey: string,
  ): Promise<StripeSetupIntentCreateResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      const params: SetupIntentParamsType = {
        customer,
      };
      if (paymentMethodType === PaymentMethod.BankAccount) {
        (params['payment_method_types'] = ['us_bank_account']),
          (params['payment_method_options'] = {
            us_bank_account: {
              financial_connections: {
                permissions: ['payment_method', 'balances'],
              },
            },
          });
      }
      return await stripeInstance.setupIntents.create(params);
    } catch (error) {
      this.logger.error(`[STRIPE] Error in createSetupIntent : ${error}`);
      return null;
    }
  }

  protected async retrieveSetupIntent(
    setupIntentId: string,
    stripeSecretKey: string,
  ): Promise<StripeSetupIntentRetrieveResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      return await stripeInstance.setupIntents.retrieve(setupIntentId);
    } catch (error) {
      this.logger.error(`[STRIPE] Error in retrieveSetupIntent : ${error}`);
      return null;
    }
  }

  protected async detachCustomerPaymentMethod(
    paymentMethodId: string,
    stripeSecretKey: string,
  ): Promise<StripeDetachCustomerPaymentMethodResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      return await stripeInstance.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      this.logger.error(
        `[STRIPE] Error in detachCustomerPaymentMethod : ${error}`,
      );
      return null;
    }
  }

  protected async retrievePaymentMethod(
    paymentMethodId: string,
    stripeSecretKey: string,
  ): Promise<StripePaymentMethodRetrieveResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      return await stripeInstance.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      this.logger.error(`[STRIPE] Error in retrievePaymentMethod : ${error}`);
      return null;
    }
  }

  protected async processPayment(
    params: IProcessPaymentParams,
    stripeSecretKey: string,
    metadata: object = {},
  ): Promise<PaymentPayResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      const paymentIntent = await stripeInstance.paymentIntents.create({
        customer: params.customerId,
        amount: params.amount * 100,
        currency: 'usd',
        payment_method: params.paymentMethodId,
        confirm: true,
        metadata: { ...metadata, ...params },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });
      return { error: false, data: paymentIntent };
    } catch (error) {
      this.logger.error(`[STRIPE] Error in processPayment : ${error}`);
      return {
        error: true,
        data:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  async processGuestConciergePayment(
    params: IProcessGuestConciergePaymentParams,
    stripeSecretKey: string,
    metadata: object = {},
  ): Promise<PaymentPayResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: params.amount * 100,
        currency: 'usd',
        payment_method: params.paymentMethodId,
        confirm: true,
        metadata: {
          ...metadata,
          amount: params.amount,
          paymentMethodId: params.paymentMethodId,
          franchiseId: params.franchiseId,
          guestEmail: params?.guestEmail,
          guestName: params?.guestName,
          guestId: params?.guestId,
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      });
      return { error: false, data: paymentIntent };
    } catch (error) {
      this.logger.error(
        `[STRIPE] Error in processGuestConciergePayment : ${error}`,
      );
      return {
        error: true,
        data:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  protected async retrievePayment(
    paymentIntentId: string,
    stripeSecretKey: string,
  ): Promise<StripePaymentIntentRetrieveResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      return await stripeInstance.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`[STRIPE] Error in retrievePayment : ${error}`);
      return null;
    }
  }

  protected async registerWebhooks(
    stripeSecretKey: string,
  ): Promise<StripeRegisterWebhooksResponse> {
    try {
      const stripeInstance = this.initStripe(stripeSecretKey);
      return await stripeInstance.webhookEndpoints.create({
        enabled_events: [
          StripeWebhookEvents.SetupIntentRequireAction,
          StripeWebhookEvents.SetupIntentFailed,
          StripeWebhookEvents.SetupIntentSucceeded,
          StripeWebhookEvents.PaymentMethodAttached,
          StripeWebhookEvents.PaymentIntentCreated,
          StripeWebhookEvents.PaymentIntentProcessing,
          StripeWebhookEvents.PaymentIntentFailed,
          StripeWebhookEvents.PaymentIntentRequireAction,
          StripeWebhookEvents.PaymentIntentPartiallyFunded,
          StripeWebhookEvents.PaymentIntentCanceled,
          StripeWebhookEvents.PaymentIntentSucceeded,
          StripeWebhookEvents.ChargeDisputeCreated,
          StripeWebhookEvents.ChargeDisputeFundsWithdrawn,
          StripeWebhookEvents.ChargeDisputeClosed,
        ],
        url: `${this.configService.get('APP_URL')}api/payment-webhooks`,
      });
    } catch (error) {
      this.logger.error(`[STRIPE] Error in registerWebhooks : ${error}`);
      return null;
    }
  }
}
