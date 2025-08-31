import { BunyanLogger } from '@/app/commons/logger.service';
import {
  InvoicePaymentStatus,
  InvoiceStatus,
} from '@/app/contracts/enums/invoice.enum';
import { StripeWebhookHandler } from '@/app/contracts/interfaces/stripeWebhookHandler.interface';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { MemberShipTransactionModel } from '@/app/models/membership/membershipTransaction.model';
import { PaymentLogModel } from '@/app/models/payment/paymentLog.model';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PaymentIntentProcessingEvent implements StripeWebhookHandler {
  constructor(
    private readonly logger: BunyanLogger,
    private readonly invoiceMasterRepository: InvoiceMasterRepository,
    private readonly dataSource: DataSource,
  ) {}

  async run(event: any): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      this.logger.log(
        `[WEBHOOK] PaymentIntentProcessingEvent === >  ${JSON.stringify(event?.data?.object?.metadata)}`,
      );

      const {
        owner_id,
        invoice_identifier,
        payment_method_id,
        membership_tier_id,
        membership_transaction_id,
      } = event?.data?.object?.metadata;

      if (!owner_id) {
        this.logger.error(
          `[WEBHOOK] PaymentIntentProcessingEvent, Owner ID is missing, ${event?.data?.object?.metadata}`,
        );
      }

      if (invoice_identifier) {
        await this.invoiceMasterRepository.updateDepositPaidStatusByIdentifier(
          queryRunner,
          invoice_identifier,
          InvoiceStatus.PaidByOwnerProcessing,
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
            status: InvoicePaymentStatus.Processing,
            payment_info: {
              ...event?.data?.object,
              event_type: event.type,
            },
          },
        );
      }

      await queryRunner.commitTransaction();
      return false;
    } catch (error) {
      this.logger.log(
        `[WEBHOOK] Error in PaymentIntentProcessingEvent === >  ${event?.data?.object?.metadata}`,
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
