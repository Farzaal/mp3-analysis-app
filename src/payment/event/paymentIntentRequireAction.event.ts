import { BunyanLogger } from '@/app/commons/logger.service';
import { StripeWebhookHandler } from '@/app/contracts/interfaces/stripeWebhookHandler.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentIntentRequireAction implements StripeWebhookHandler {
  constructor(private readonly logger: BunyanLogger) {}

  async run(event: any): Promise<boolean> {
    try {
      this.logger.log(`PaymentIntentRequireAction === >  ${event}`);
    } catch (err) {
      return false;
    }
  }
}
