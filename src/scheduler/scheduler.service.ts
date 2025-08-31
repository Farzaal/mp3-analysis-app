import { BunyanLogger } from '@/app/commons/logger.service';
import { MemberShipStatus } from '@/app/contracts/enums/membership.enum';
// import { OwnerApprovalStatus } from '@/app/contracts/enums/ownerApprovalStatus.enum';
import { PaymentMethodStatus } from '@/app/contracts/enums/payment.enum';
// import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import { IProcessPaymentParams } from '@/app/contracts/interfaces/payment.interface';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { UserPaymentMethodModel } from '@/app/models/paymentMethod/userPaymentMethod.model';
import { MemberShipTransactionModel } from '@/app/models/membership/membershipTransaction.model';
import { PropertyMasterModel } from '@/app/models/property/propertyMaster.model';
// import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { MembershipTierRepository } from '@/app/repositories/membershipTier/membershipTier.repository';
import { MembershipTransactionRepository } from '@/app/repositories/membershipTier/membershipTransaction.repository';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { ServiceRequestRecurringDateRepository } from '@/app/repositories/serviceRequest/serviceRequestRecurringDate.repository';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { StripeService } from '@/payment/stripe.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as moment from 'moment';
import { ScheduledNotificationRepository } from '@/app/repositories/notification/scheduledNotification.repository';
import { NotificationMessage } from '@/notifications/notification.message';
import {
  ScheduledNotificationConfig,
  ScheduledNotificationStatus,
} from '@/app/contracts/enums/scheduledNotification.enum';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { In } from 'typeorm';
import { ServiceRequestRecurringLogRepository } from '@/app/repositories/serviceRequest/serviceRequestRecurringLog.repository';
import { InvoicePaymentStatus } from '@/app/contracts/enums/invoice.enum';

@Injectable()
export class SchedulerService extends StripeService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    protected readonly logger: BunyanLogger,
    protected readonly configService: ConfigService,
    protected readonly serviceRequestRecurringDateRepository: ServiceRequestRecurringDateRepository,
    protected readonly serviceRequestRecurringLogRepository: ServiceRequestRecurringLogRepository,
    protected readonly serviceRequestMasterRepository: ServiceRequestMasterRepository,
    protected readonly membershipTierRepository: MembershipTierRepository,
    protected readonly propertyMasterRepository: PropertyMasterRepository,
    protected readonly membershipTransactionRepository: MembershipTransactionRepository,
    protected readonly userPaymentMethodRepository: UserPaymentMethodRepository,
    protected readonly scheduledNotificationRepository: ScheduledNotificationRepository,
    protected readonly franchiseRepository: FranchiseRepository,
  ) {
    super(configService, logger);

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  @Cron('1 0 * * *')
  async membershipPayments() {
    const membershipTiers = await this.membershipTierRepository.find({
      next_due_date: new Date(moment().format('YYYY-MM-DD')),
      membership_type: MemberShipStatus.Paid,
    });

    this.logger.log(
      `[CRON] Triggered for membership payments at ${new Date(moment().format('YYYY-MM-DD'))}, Total Tiers ${membershipTiers.length}`,
    );

    for (const membershipTier of membershipTiers) {
      try {
        const propertyMasterModel: PropertyMasterModel =
          await this.propertyMasterRepository.findOne({
            where: {
              id: membershipTier.property_master_id,
              is_deleted: false,
              off_program: false,
            },
            relations: ['owner', 'propertyPaymentMethod'],
          });

        if (!propertyMasterModel) {
          this.logger.error(
            `[CRON] Property not found for ${propertyMasterModel?.id}`,
          );
          continue;
        }

        let userPaymentMethod: UserPaymentMethodModel =
          propertyMasterModel.propertyPaymentMethod;

        if (!userPaymentMethod) {
          userPaymentMethod = await this.userPaymentMethodRepository.findOne({
            where: {
              owner_id: propertyMasterModel.owner.id,
              status: PaymentMethodStatus.Succeeded,
              is_default: true,
              is_deleted: false,
            },
          });
        }

        const franchiseModel: FranchiseModel =
          await this.franchiseRepository.getFranchiseDetails(
            Number(propertyMasterModel.franchise_id),
          );

        this.logger.log(
          `[CRON] Processing membership payment params for ${membershipTier.id} at ${new Date(
            moment().format('YYYY-MM-DD'),
          )}`,
        );

        const membershipTransactionModel = new MemberShipTransactionModel();

        membershipTransactionModel.membership_id = membershipTier.id;
        membershipTransactionModel.property_master_id = propertyMasterModel.id;
        membershipTransactionModel.transaction_amount = membershipTier.price;
        membershipTransactionModel.discount_percentage = 0;
        membershipTransactionModel.discount_amount = 0;
        membershipTransactionModel.transaction_date = new Date(
          moment().format('YYYY-MM-DD'),
        );

        const membershipTransaction =
          await this.membershipTransactionRepository.save(
            membershipTransactionModel,
          );

        this.logger.log(
          `[CRON] Membership transaction entry created for Membership Tier ${membershipTier.id} and Property ${propertyMasterModel.id} at ${new Date(
            moment().format('YYYY-MM-DD'),
          )}`,
        );

        if (!userPaymentMethod) {
          this.logger.log(
            `[CRON] No Owner Payment Method found for Property : ${propertyMasterModel.id}, Owner ${propertyMasterModel.owner_id}`,
          );
          await this.membershipTierRepository.update(
            { id: membershipTier.id },
            {
              next_due_date: null,
            },
          );
          await this.membershipTransactionRepository.update(
            { id: membershipTransaction.id },
            {
              status: InvoicePaymentStatus.Failed,
              payment_info: {
                error: true,
                data: `No Owner Payment Method found for ${propertyMasterModel.address}`,
              },
            },
          );
          continue;
        }

        const paymentParams: IProcessPaymentParams = {
          customerId: propertyMasterModel.owner.payment_gateway_customer_id,
          paymentMethodId: userPaymentMethod.stripe_payment_method_id,
          amount: membershipTier.price,
        };

        const { error, data } = await this.processPayment(
          paymentParams,
          franchiseModel.stripe_secret_key,
          {
            property_id: propertyMasterModel.id,
            owner_id: propertyMasterModel.owner.id,
            membership_tier_id: membershipTier.id,
            membership_transaction_id: membershipTransaction.id,
            payment_method_id: userPaymentMethod.id,
            next_due_date_success: moment()
              .add(30, 'days')
              .format('YYYY-MM-DD'),
          },
        );

        if (!error) {
          this.logger.log(
            `[CRON] Membership payment intent created successfully for ${membershipTier.id} at ${new Date(
              moment().format('YYYY-MM-DD'),
            )}`,
          );
        } else if (error) {
          this.logger.log(
            `[CRON] Error creating membership payment intent for MembershipTier ${membershipTier.id}, Error : ${data} at ${new Date(
              moment().format('YYYY-MM-DD'),
            )}`,
          );
          await this.membershipTierRepository.update(
            { id: membershipTier.id },
            {
              next_due_date: null,
            },
          );
          await this.membershipTransactionRepository.update(
            { id: membershipTransaction.id },
            {
              payment_info: { error, data },
            },
          );
        }
        continue;
      } catch (err) {
        this.logger.error(err);
        continue;
      }
    }

    const membershipTiersFree = await this.membershipTierRepository.find({
      next_due_date: new Date(moment().format('YYYY-MM-DD')),
      membership_type: MemberShipStatus.Free,
    });

    if (membershipTiersFree.length > 0) {
      await this.membershipTierRepository.update(
        {
          id: In(
            membershipTiersFree.map((membershipTier) => membershipTier.id),
          ),
        },
        {
          next_due_date: null,
        },
      );
    }

    this.logger.log('[CRON] Execution Completed');
  }

  /**
   * Scheduled Notification Service notification below
   *
   * @author Syed Mohammed Hassan
   */
  @Cron('0 * * * *')
  public async handlePreferredVendorUrgentJobs() {
    try {
      this.logger.log('[CRON] handling preferred vendor urgent jobs');

      await this.serviceRequestMasterRepository.handlePreferredVendorUrgentJobs();
    } catch (error) {
      this.logger.error(
        '[CRON] Failed to handle preferred vendor urgent jobs',
        error,
      );
    }
  }

  @Cron('5 * * * *')
  public async handleUrgentVendorJobs() {
    try {
      this.logger.log('[CRON] handling non preferred vendor urgent jobs');

      await this.serviceRequestMasterRepository.handleUrgentVendorJobs();
    } catch (error) {
      this.logger.error(
        '[CRON] Failed to handle non preferred vendor urgent jobs',
        error,
      );
    }
  }

  @Cron('0 0 * * *')
  public async handleNonUrgentJobsOneWeekBefore() {
    try {
      this.logger.log('[CRON] handling non urgent jobs one week before');

      await this.serviceRequestMasterRepository.handleNonUrgentJobsOneWeekBefore();
    } catch (error) {
      this.logger.error(
        '[CRON] Failed to handle non urgent jobs one week before',
        error,
      );
    }
  }

  @Cron('0 0 */5 * *')
  public async deleteSuccessfulNotifications() {
    try {
      this.logger.log('[CRON] deleteting notifications');

      await this.scheduledNotificationRepository.delete(
        {
          notification_status: ScheduledNotificationStatus.SUCCESS,
        },
        false,
      );
    } catch (error) {
      this.logger.error('[CRON] Failed to delete notifications', error);
    }
  }

  @Cron('10 * * * *')
  public async sendNotifications() {
    this.logger.log('[CRON] sending notifications');

    try {
      const pendingNotifications =
        await this.scheduledNotificationRepository.find({
          notification_status: In([
            ScheduledNotificationStatus.PENDING,
            ScheduledNotificationStatus.FAILURE,
          ]),
        });

      let notificationIndex = 1;

      for (const notification of pendingNotifications) {
        try {
          const config =
            ScheduledNotificationConfig[notification.notification_trigger];
          if (!config) {
            this.logger.error(
              `No configuration found for trigger ${notification.notification_trigger}`,
            );
            continue;
          }

          if (config.templates.email) {
            await this.sendEmail(
              notification.email_address,
              config.subject,
              `${config.message} ${notification.params.service_requests.join(', ')}`,
            );
          }

          // Uncomment to enable SMS
          // if (notification.notification_medium === ScheduledNotificationMedium.SMS && notification.phone_number) {
          //   const plainText = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
          //   await this.twilioClient.messages.create({
          //     body: plainText,
          //     from: this.configService.get('TWILIO_PHONE_NUMBER'),
          //     to: notification.phone_number,
          //   });
          // }

          // Update notification status to success
          await this.scheduledNotificationRepository.update(
            { id: notification.id },
            { notification_status: ScheduledNotificationStatus.SUCCESS },
          );

          this.logger.log(
            `[CRON] notification ${notificationIndex++} of ${pendingNotifications.length} sent successfully`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send notification ${notification.id}`,
            error,
          );

          // Update notification status to failure
          await this.scheduledNotificationRepository.update(
            { id: notification.id },
            { notification_status: ScheduledNotificationStatus.FAILURE },
          );
        }
      }

      this.logger.log(
        `[CRON] ${pendingNotifications.length} notifications sent successfully`,
      );
    } catch (error) {
      this.logger.error('Failed to process notifications', error);
    }
  }

  private readHTMLTemplate(templateName: string): string {
    try {
      const templatePath = path.resolve(
        process.cwd(),
        'src/notifications/templates',
        templateName,
      );

      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      this.logger.error(`Error reading HTML template: ${templateName}`, error);

      throw new Error(NotificationMessage.TEMPLATE_NOT_FOUND);
    }
  }

  private async sendEmail(to: string, subject: string, message: string) {
    const compiledTemplate = handlebars.compile(
      this.readHTMLTemplate('genericTemplate.html'),
    );

    const htmlToSend = compiledTemplate({
      title: subject,
      message,
    });

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: this.configService.get('DEBUG_REPORT_DOWNLOAD_EMAIL') || to,
      subject,
      html: htmlToSend,
    });
  }
}
