import { BunyanLogger } from '@/app/commons/logger.service';
import {
  InvoicePaymentStatus,
  InvoiceStatus,
  PaymentStatus,
  PaymentType,
} from '@/app/contracts/enums/invoice.enum';
import { StripeWebhookHandler } from '@/app/contracts/interfaces/stripeWebhookHandler.interface';
import { PaymentLogModel } from '@/app/models/payment/paymentLog.model';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { MemberShipTransactionModel } from '@/app/models/membership/membershipTransaction.model';
import { MemberShipTierModel } from '@/app/models/membership/membershipTier.model';
import { MembershipTransactionRepository } from '@/app/repositories/membershipTier/membershipTransaction.repository';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { emailContent } from '@/app/utils/serviceRequestContent.helper';
import { EmailContent } from '@/app/contracts/enums/serviceRequest.enum';
import { OwnerPaymentDetailsModel } from '@/app/models/invoice/ownerPaymentDetails.model';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { PaymentMethod } from '@/app/contracts/enums/payment.enum';

@Injectable()
export class PaymentIntentSucceededEvent implements StripeWebhookHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly configService: ConfigService,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly membershipTransactionRepository: MembershipTransactionRepository,
    private readonly userPaymentMethodRepository: UserPaymentMethodRepository,
  ) {}

  async run(event: any): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      this.logger.log(
        `[WEBHOOK] PaymentIntentSucceedEvent === >  ${JSON.stringify(event?.data?.object?.metadata)}`,
      );

      const {
        owner_id,
        invoice_identifier,
        payment_method_id,
        membership_tier_id,
        membership_transaction_id,
        next_due_date_success,
      } = event?.data?.object?.metadata;

      if (!owner_id) {
        this.logger.error(
          `[WEBHOOK] PaymentIntentSucceedEvent === >, Owner ID is missing, ${event?.data?.object?.metadata}`,
        );
      }

      let invoiceNumbers: number[] = [],
        ownerId: number = null,
        franchiseId: number = null;

      if (invoice_identifier) {
        const paymentMethod = await this.userPaymentMethodRepository.findOne({
          where: {
            id: payment_method_id,
          },
        });
        await this.invoiceMasterRepository.updateDepositPaidStatusByIdentifier(
          queryRunner,
          invoice_identifier,
          InvoiceStatus.PaidByOwnerSuccess,
        );
        const invMaster: InvoiceMasterModel[] =
          await this.invoiceMasterRepository.find({
            invoice_uuid: invoice_identifier,
          });
        if (invMaster.length) {
          ownerId = invMaster[0].owner_id;
          franchiseId = invMaster[0].franchise_id;
        }
        invoiceNumbers = invMaster.map((invMaster) => invMaster.id);
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
        await queryRunner.manager.update(
          InvoiceMasterModel,
          {
            invoice_uuid: invoice_identifier,
          },
          {
            invoice_paid_at: Math.floor(Date.now() / 1000),
            paid_by_owner_at: Math.floor(Date.now() / 1000),
          },
        );
        await queryRunner.manager.update(
          OwnerPaymentDetailsModel,
          {
            invoice_master_id: In(invoiceNumbers),
          },
          {
            payment_status: PaymentStatus.Paid,
            payment_type:
              paymentMethod &&
              paymentMethod.payment_method_type === PaymentMethod.Card
                ? PaymentType.Card
                : paymentMethod.payment_method_type ===
                    PaymentMethod.BankAccount
                  ? PaymentType.ACH
                  : null,
          },
        );
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
            status: InvoicePaymentStatus.Success,
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
            is_last_transaction_success: true,
            next_due_date: next_due_date_success,
          },
        );
      }

      await queryRunner.commitTransaction();

      if (invoiceNumbers.length > 0) {
        const users = await this.userRepository.getUserAndFranchiseAdmin(
          ownerId,
          franchiseId,
        );
        Promise.all([
          users.map((user) =>
            this.notificationsService.sendNotification(
              NotificationAction.INVOICE_PAYMENT_MADE_BY_OWNER,
              {
                invoiceNumbers: invoiceNumbers.join(','),
                link: `${this.configService.get('PORTAL_FRONTEND_URL')}`,
              },
              [user.email],
              [user.contact],
            ),
          ),
        ]);
      }
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
          NotificationAction.MEMBERSHIP_PAYMENT_SUCCESS,
          {
            content: emailContent
              .get(EmailContent.MembershipPaymentSuccess)
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
        `[WEBHOOK] Error in PaymentIntentSucceedEvent === >  ${event?.data?.object?.metadata}`,
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
