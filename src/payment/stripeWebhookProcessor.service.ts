import { StripeWebhookHandler } from '@/app/contracts/interfaces/stripeWebhookHandler.interface';
import { Injectable } from '@nestjs/common';
import { SetupIntentRequireActionEvent } from './event/setupIntentRequireAction.event';
import { SetupIntentFailedEvent } from './event/setupIntentFailed.event';
import { SetupIntentSucceededEvent } from './event/setupIntentSucceeded.event';
import { StripeWebhookEvents } from '@/app/contracts/enums/payment.enum';
import { BunyanLogger } from '@/app/commons/logger.service';
import { PaymentIntentProcessingEvent } from './event/paymentIntentProcessing.event';
import { PaymentIntentFailedEvent } from './event/paymentIntentFailed.event';
import { PaymentIntentSucceededEvent } from './event/paymentIntentSucceeded.event';

@Injectable()
export class StripeWebhookProcessor {
  private readonly eventMap: Map<string, StripeWebhookHandler>;

  constructor(
    private readonly setupIntentRequireActionHandler: SetupIntentRequireActionEvent,
    private readonly setupIntentFailedHandler: SetupIntentFailedEvent,
    private readonly setupIntentSucceededHandler: SetupIntentSucceededEvent,
    private readonly paymentIntentProcessingEvent: PaymentIntentProcessingEvent,
    private readonly paymentIntentFailedEvent: PaymentIntentFailedEvent,
    private readonly paymentIntentSucceededEvent: PaymentIntentSucceededEvent,
    private readonly logger: BunyanLogger,
  ) {
    this.eventMap = new Map<string, StripeWebhookHandler>([
      [
        StripeWebhookEvents.SetupIntentRequireAction,
        this.setupIntentRequireActionHandler,
      ],
      [StripeWebhookEvents.SetupIntentFailed, this.setupIntentFailedHandler],
      [
        StripeWebhookEvents.SetupIntentSucceeded,
        this.setupIntentSucceededHandler,
      ],
      [
        StripeWebhookEvents.PaymentIntentProcessing,
        this.paymentIntentProcessingEvent,
      ],
      [StripeWebhookEvents.PaymentIntentFailed, this.paymentIntentFailedEvent],
      [
        StripeWebhookEvents.PaymentIntentSucceeded,
        this.paymentIntentSucceededEvent,
      ],
    ]);
  }

  async process(event: any): Promise<boolean> {
    const incomingEvent = this.eventMap.get(event.type);
    if (!incomingEvent) {
      this.logger.log(
        `StripeWebhookProcessor : No handler found for event, ${event.type}`,
      );
      return false;
    }
    await incomingEvent.run(event);
    return true;
  }
}
