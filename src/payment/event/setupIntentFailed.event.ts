import { BunyanLogger } from '@/app/commons/logger.service';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { PaymentMethodStatus } from '@/app/contracts/enums/payment.enum';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { StripeWebhookHandler } from '@/app/contracts/interfaces/stripeWebhookHandler.interface';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { NotificationsService } from '@/notifications/notifications.service';
import { Injectable } from '@nestjs/common';
import { PaymentService } from '../payment.service';
import { emailContent } from '@/app/utils/serviceRequestContent.helper';
import { EmailContent } from '@/app/contracts/enums/serviceRequest.enum';

@Injectable()
export class SetupIntentFailedEvent implements StripeWebhookHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly userPaymentMethodRepository: UserPaymentMethodRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationsService: NotificationsService,
    private readonly paymentService: PaymentService,
  ) {}

  async run(event: any): Promise<boolean> {
    try {
      const setupIntentId = event?.data?.object?.id;
      if (!setupIntentId) {
        this.logger.error(
          '[WEBHOOK] SetupIntentFailedEvent : Setup intent id is not found',
        );
      }
      const updObj = await this.userPaymentMethodRepository.update(
        {
          setup_intent_id: setupIntentId,
        },
        {
          payment_info: event?.data,
          status: PaymentMethodStatus.Failed,
        },
      );
      const paymentMethod = await this.userPaymentMethodRepository.findOne({
        where: {
          setup_intent_id: setupIntentId,
        },
        relations: ['owner'],
      });

      const ownerPaymentMethodInfo =
        await this.paymentService.retrieveOwnerPaymentMethod(
          paymentMethod?.owner?.franchise_id,
          event?.data?.object?.payment_method,
        );

      if (paymentMethod && ownerPaymentMethodInfo) {
        const franchiseAdmin = await this.userRepository.findOne({
          where: {
            franchise_id: paymentMethod.owner.franchise_id,
            user_type: UserType.FranchiseAdmin,
          },
        });
        const { card, us_bank_account } = ownerPaymentMethodInfo;
        this.notificationsService.sendNotification(
          NotificationAction.PAYMENT_METHOD_ATTACHED_FAILED,
          {
            content: emailContent
              .get(EmailContent.PaymentMethodAttachFailed)
              .replace('{{paymentMethodType}}', card ? 'Card' : 'ACH')
              .replace(
                '{{endingNumber}}',
                card ? card.last4 : us_bank_account.last4,
              )
              .replace(
                '{{ownerName}}',
                `${paymentMethod?.owner?.first_name} ${paymentMethod?.owner?.last_name}`,
              ),
          },
          [franchiseAdmin.email, paymentMethod?.owner.email],
        );
      }
      this.logger.log(
        `[WEBHOOK] SetupIntentFailedEvent, Update object ${JSON.stringify(updObj)}`,
      );
    } catch (err) {
      this.logger.error(`[WEBHOOK] SetupIntentFailedEvent, ${err}`);
      return false;
    }
  }
}
