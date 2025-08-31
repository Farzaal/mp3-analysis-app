import { createTransport, Transporter } from 'nodemailer';
import * as handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
// import { Twilio } from 'twilio';
import * as path from 'path';
import {
  getNotificationConfig,
  NotificationBodyParams,
} from '@/app/utils/notificationConfig.helper';
import { NotificationMessage } from './notification.message';
import {
  NotificationAction,
  NotificationOption,
  NotificationStatus,
  NotificationTemplate,
  NotificationType,
} from '@/app/contracts/enums/notification.enum';
import { NotificationRepository } from '@/app/repositories/notification/notification.repository';

@Injectable()
export class NotificationsService {
  private readonly transporter: Transporter;

  // Todo: Uncomment this when we need to send SMS
  //   private readonly twilioClient: Twilio;

  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationRepository: NotificationRepository,
  ) {
    this.transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_EMAIL_USER'),
        pass: this.configService.get<string>('SMTP_EMAIL_PASSWORD'),
      },
    });

    // Todo: Uncomment this when we need to send SMS

    // this.twilioClient = new Twilio(
    //   this.configService.get<string>('TWILIO_SID'),
    //   this.configService.get<string>('TWILIO_AUTH_TOKEN'),
    // );
  }

  //   private async isValidNumber(phoneNumber: number): Promise<boolean> {
  //     const usPhoneNumberRegex =
  //       /^(?:\+1\s?)?\(?([2-9][0-9]{2})\)?[-.\s]?([2-9][0-9]{2})[-.\s]?([0-9]{4})$/;
  //     return usPhoneNumberRegex.test(phoneNumber.toString());
  //   }

  private async readHTMLTemplate(templateName: string): Promise<string> {
    try {
      const templatePath = path.resolve(
        process.cwd(),
        'src/notifications/templates',
        templateName,
      );
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      this.logger.error(`Error reading HTML template: ${templateName}`, error);
      throw new Error(NotificationMessage.TEMPLATE_NOT_FOUND);
    }
  }

  private async sendEmail(
    action: NotificationAction,
    params: NotificationBodyParams,
    template: NotificationTemplate,
    type: NotificationType,
    subject: string,
    html: string,
    receivers: string[],
  ): Promise<void> {
    if (!receivers.length) return;

    const logBaseBody = {
      notification_action: action,
      notification_option: NotificationOption.EMAIL,
      type,
      notification_template: template,
      params,
      subject,
    };

    this.logger.log(logBaseBody);

    const emailsToBeSend = receivers.map(async (receiver) => {
      try {
        if (receiver === 'test@email.com') throw new Error('Invalid Email');
        const mailOptions = {
          from: this.configService.get<string>('SMTP_EMAIL_USER'),
          to: receiver,
          subject,
          html,
        };

        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(`Email sent successfully: ${info.messageId}`);
      } catch (error) {
        this.logger.error('Failed to send email', error);
        const logMask = this.notificationRepository.create({
          ...logBaseBody,
          notification_status: NotificationStatus.FAILURE,
          sent_to: receiver,
        });
        await this.notificationRepository.save(logMask);
        this.logger.log(NotificationMessage.EMAIL_SEND_FAILURE);
      }
    });

    await Promise.allSettled(emailsToBeSend);
    this.logger.log('All email sending tasks have been processed.');
  }

  //   private async sendSMS(
  //     body: string,
  //     receiver: string[],
  //     action: NotificationAction,
  //     type: NotificationType,
  //   ): Promise<void> {
  //     const logBaseBody = {
  //       notification_action: action,
  //       notification_option: NotificationOption.SMS,
  //       type,
  //     };

  //     const smsPromise = receiver.map(async (recipient) => {
  //       try {
  //         // const validNumber = await this.isValidNumber(Number(recipient));
  //         // if (!validNumber) throw new Error('Invalid Phone Number');

  //         const message = await this.twilioClient.messages.create({
  //           body,
  //           from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
  //           to: recipient,
  //         });

  //         const logMask = this.notificationRepository.create({
  //           ...logBaseBody,
  //           notification_status: NotificationStatus.SUCCESS,
  //           number: Number(recipient),
  //           body,
  //         });

  //         await this.notificationRepository.save(logMask);
  //         this.logger.log(`SMS sent successfully: ${message.sid}`);
  //       } catch (error) {
  //         this.logger.error('Failed to send SMS', error);
  //         const logMask = this.notificationRepository.create({
  //           ...logBaseBody,
  //           notification_status: NotificationStatus.FAILURE,
  //           number: Number(recipient),
  //           body,
  //         });
  //         await this.notificationRepository.save(logMask);
  //       }
  //     });

  //     await Promise.allSettled(smsPromise);
  //     this.logger.log('All SMS sending tasks have been processed.');
  //   }

  public async sendNotification(
    action: NotificationAction,
    params: NotificationBodyParams,
    receiver: string[],
    smsReceivers?: string[],
  ): Promise<void> {
    if (receiver.length === 0) return;
    const config = getNotificationConfig(action, params, receiver);
    try {
      if (!config) {
        this.logger.error('Invalid notification configuration');
        throw new Error(NotificationMessage.GENERIC_ERROR);
      }

      if (config.options.includes('email')) {
        const htmlTemplate = await this.readHTMLTemplate(config.template);
        const compiledTemplate = handlebars.compile(htmlTemplate);
        const htmlToSend = compiledTemplate(params);

        await this.sendEmail(
          action,
          params,
          config.template as NotificationTemplate,
          config.type,
          config.subject,
          htmlToSend,
          receiver,
        );
      }

      if (config.options.includes('sms')) {
        this.logger.log(`SMS receiver list, ${JSON.stringify(smsReceivers)}`);
        // await this.sendSMS(
        //   params?.smsBody as string,
        //   smsReceivers,
        //   action,
        //   config.type,
        // );
      }
    } catch (error) {
      this.logger.error('Failed to send notification', error);
    }
  }
}
