import { forwardRef, Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServiceRequestModule } from '@/serviceRequest/serviceRequest.module';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { UserModel } from '@/app/models/user/user.model';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { InvoiceLineItemRepository } from '@/app/repositories/invoice/invoiceLineItem.repository';
import { UserDescriptionRepository } from '@/app/repositories/user/userDescription.repository';
import { PaymentModule } from '@/payment/payment.module';
import { BunyanLogger } from '@/app/commons/logger.service';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationRepository } from '@/app/repositories/notification/notification.repository';
import { InvoiceService } from './invoice.service';
import { InvoiceMasterModel } from '@/app/models/invoice/invoiceMaster.model';
import { ServiceTypeModule } from '@/serviceType/serviceType.module';
import { EstimateModule } from '@/estimate/estimate.module';
import { DepositInvoiceHandler } from './depositInvoiceHandler.service';
import { InProgressInvoiceHandler } from './inProgressInvoiceHandler.service';
import { CompletedInvoiceHandler } from './completedInvoiceHandler.service';
import { PreNegotiatedServiceInvoice } from './preNegotiatedServiceInvoice.service';
import { HourlyServiceInvoice } from './hourlyServiceInvoice.service';
import { S3Service } from '@/app/commons/s3.service';
import { OwnerPaymentDetailsRepository } from '@/app/repositories/invoice/onwerPaymentDetails.repository';
import { VendorPaymentDetailsRepository } from '@/app/repositories/invoice/vendorPaymentDetails.repository';
import { NotificationsModule } from '@/notifications/notification.module';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { EstimateDetailsRepository } from '@/app/repositories/estimate/estimateDetails.repository';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequestMasterModel,
      FranchiseModel,
      UserModel,
      InvoiceMasterModel,
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
    forwardRef(() => ServiceRequestModule),
    PaymentModule,
    ServiceTypeModule,
    forwardRef(() => EstimateModule),
    NotificationsModule,
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceMasterRepository,
    InvoiceLineItemRepository,
    EstimateDetailsRepository,
    UserDescriptionRepository,
    ServiceRequestMasterRepository,
    InvoiceService,
    DepositInvoiceHandler,
    InProgressInvoiceHandler,
    CompletedInvoiceHandler,
    PreNegotiatedServiceInvoice,
    HourlyServiceInvoice,
    UserRepository,
    BunyanLogger,
    NotificationsService,
    NotificationRepository,
    S3Service,
    OwnerPaymentDetailsRepository,
    VendorPaymentDetailsRepository,
    PropertyMasterRepository,
  ],
  exports: [
    InvoiceService,
    InvoiceLineItemRepository,
    DepositInvoiceHandler,
    InProgressInvoiceHandler,
    CompletedInvoiceHandler,
  ],
})
export class InvoiceModule {}
