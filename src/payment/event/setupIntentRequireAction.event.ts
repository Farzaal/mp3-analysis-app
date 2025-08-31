import { BunyanLogger } from '@/app/commons/logger.service';
import { PaymentMethodStatus } from '@/app/contracts/enums/payment.enum';
import { StripeWebhookHandler } from '@/app/contracts/interfaces/stripeWebhookHandler.interface';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SetupIntentRequireActionEvent implements StripeWebhookHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly userPaymentMethodRepository: UserPaymentMethodRepository,
  ) {}

  async run(event: any): Promise<boolean> {
    try {
      const setupIntentId = event?.data?.object?.id;
      if (!setupIntentId) {
        this.logger.error(
          '[WEBHOOK] SetupIntentRequireActionEvent : Setup intent id is not found',
        );
      }

      const updObj = await this.userPaymentMethodRepository.update(
        {
          setup_intent_id: setupIntentId,
        },
        {
          payment_info: event?.data,
          status: PaymentMethodStatus.VerificationPending,
        },
      );
      this.logger.log(
        `[WEBHOOK] SetupIntentRequireActionEvent, Update object ${JSON.stringify(updObj)}`,
      );
    } catch (err) {
      this.logger.error(`[WEBHOOK] SetupIntentRequireActionEvent, ${err}`);
      return false;
    }
  }
}
