import { BunyanLogger } from '@/app/commons/logger.service';
import {
  InvoicePaymentStatus,
  InvoiceStatus,
} from '@/app/contracts/enums/invoice.enum';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { EmailContent } from '@/app/contracts/enums/serviceRequest.enum';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { StripeWebhookHandler } from '@/app/contracts/interfaces/stripeWebhookHandler.interface';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { MemberShipTierModel } from '@/app/models/membership/membershipTier.model';
import { MemberShipTransactionModel } from '@/app/models/membership/membershipTransaction.model';
import { PaymentLogModel } from '@/app/models/payment/paymentLog.model';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { MembershipTransactionRepository } from '@/app/repositories/membershipTier/membershipTransaction.repository';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { emailContent } from '@/app/utils/serviceRequestContent.helper';
import { NotificationsService } from '@/notifications/notifications.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PaymentIntentFailedEvent implements StripeWebhookHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
    private readonly notificationsService: NotificationsService,
    private readonly userRepository: UserRepository,
    private readonly membershipTransactionRepository: MembershipTransactionRepository,
    private readonly dataSource: DataSource,
  ) {}

  async run(event: any): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      this.logger.log(
        `[WEBHOOK] PaymentIntentFailedEvent === >  ${JSON.stringify(event?.data?.object?.metadata)}`,
      );

      const {
        owner_id,
        invoice_identifier,
        payment_method_id,
        membership_tier_id,
        membership_transaction_id,
        is_first_transaction,
      } = event?.data?.object?.metadata;

      if (!owner_id) {
        this.logger.error(
          `[WEBHOOK] PaymentIntentFailedEvent === >, Owner ID is missing, ${event?.data?.object?.metadata}`,
        );
      }

      if (invoice_identifier) {
        await this.invoiceMasterRepository.updateDepositPaidStatusByIdentifier(
          queryRunner,
          invoice_identifier,
          InvoiceStatus.PaidByOwnerFailed,
        );
        const invMaster: InvoiceMasterModel[] =
          await this.invoiceMasterRepository.find({
            invoice_uuid: invoice_identifier,
          });
        const paymentLogs = invMaster.map((invMaster) => {
          const log = new PaymentLogModel();
          log.owner_id = owner_id;
          log.invoice_master_id = invMaster.id;
          log.payment_method_id = payment_method_id;
          log.payment_info = {
            ...event?.data?.object,
            event_type: event.type,
          };
          return log;
        });
        await queryRunner.manager.save(PaymentLogModel, paymentLogs);
      }

      if (membership_tier_id && membership_transaction_id) {
        await queryRunner.manager.update(
          MemberShipTransactionModel,
          {
            id: membership_transaction_id,
            membership_id: membership_tier_id,
          },
          {
            status: InvoicePaymentStatus.Failed,
            payment_info: {
              ...event?.data?.object,
              event_type: event.type,
            },
          },
        );

        await queryRunner.manager.update(
          MemberShipTierModel,
          {
            id: membership_tier_id,
          },
          {
            next_due_date: null,
            is_last_transaction_success: false,
            ...(is_first_transaction && {
              membership_type: MemberShipStatus.Free,
            }),
          },
        );
      }

      await queryRunner.commitTransaction();

      if (membership_tier_id && membership_transaction_id) {
        const membershipTransaction =
          await this.membershipTransactionRepository.findOne({
            where: {
              id: membership_transaction_id,
            },
            relations: ['propertyMaster', 'propertyMaster.owner'],
          });
        const franchiseAdmin = await this.userRepository.findOne({
          where: {
            franchise_id: Number(
              membershipTransaction.propertyMaster.franchise_id,
            ),
            user_type: UserType.FranchiseAdmin,
          },
        });
        this.notificationsService.sendNotification(
          NotificationAction.MEMBERSHIP_PAYMENT_FAILED,
          {
            content: emailContent
              .get(EmailContent.MembershipPaymentFailed)
              .replace(
                '{{address}}',
                membershipTransaction.propertyMaster.address,
              ),
          },
          [
            franchiseAdmin.email,
            membershipTransaction.propertyMaster.owner.email,
          ],
        );
      }
      return true;
    } catch (error) {
      this.logger.log(
        `[WEBHOOK] Error in PaymentIntentFailedEvent === >  ${event?.data?.object?.metadata}`,
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
