import { forwardRef, Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPaymentMethodModel } from '@/app/models/paymentMethod/userPaymentMethod.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { StripeService } from './stripe.service';
import { AuthModule } from '@/auth/auth.module';
import { OwnerModule } from '@/owner/owner.module';
import { EncryptionHelper } from '@/app/utils/encryption.helper';
import { PropertiesModule } from '@/properties/property.module';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { SetupIntentRequireActionEvent } from './event/setupIntentRequireAction.event';
import { SetupIntentFailedEvent } from './event/setupIntentFailed.event';
import { SetupIntentSucceededEvent } from './event/setupIntentSucceeded.event';
import { StripeWebhookProcessor } from './stripeWebhookProcessor.service';
import { BunyanLogger } from '@/app/commons/logger.service';
import { PaymentIntentFailedEvent } from './event/paymentIntentFailed.event';
import { PaymentIntentProcessingEvent } from './event/paymentIntentProcessing.event';
import { PaymentIntentRequireAction } from './event/paymentIntentRequireAction.event';
import { PaymentIntentSucceededEvent } from './event/paymentIntentSucceeded.event';
import { PaymentLogModel } from '@/app/models/payment/paymentLog.model';
import { PaymentLogRepository } from '@/app/repositories/payment/paymentLog.repository';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { MembershipTransactionRepository } from '@/app/repositories/membershipTier/membershipTransaction.repository';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationRepository } from '@/app/repositories/notification/notification.repository';
import { GeneralHelper } from '@/app/utils/general.helper';
import { MembershipTierRepository } from '@/app/repositories/membershipTier/membershipTier.repository';
import { MemberShipTierModel } from '@/app/models/membership/membershipTier.model';
import { MemberShipTransactionModel } from '@/app/models/membership/membershipTransaction.model';
import { OwnerPaymentDetailsRepository } from '@/app/repositories/invoice/onwerPaymentDetails.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPaymentMethodModel,
      PaymentLogModel,
      MemberShipTierModel,
      MemberShipTransactionModel,
    ]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get('JWT_SECRET_KEY'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRY') },
      }),
    }),
    AuthModule,
    forwardRef(() => PropertiesModule),
    forwardRef(() => OwnerModule),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    StripeService,
    EncryptionHelper,
    UserPaymentMethodRepository,
    FranchiseRepository,
    SetupIntentRequireActionEvent,
    SetupIntentFailedEvent,
    SetupIntentSucceededEvent,
    PaymentIntentFailedEvent,
    PaymentIntentProcessingEvent,
    PaymentIntentRequireAction,
    PaymentIntentSucceededEvent,
    GeneralHelper,
    StripeWebhookProcessor,
    BunyanLogger,
    PaymentLogRepository,
    InvoiceMasterRepository,
    ServiceRequestMasterRepository,
    MembershipTransactionRepository,
    MembershipTierRepository,
    NotificationsService,
    NotificationRepository,
    OwnerPaymentDetailsRepository,
  ],
  exports: [
    PaymentService,
    UserPaymentMethodRepository,
    MembershipTierRepository,
  ],
})
export class PaymentModule {}
