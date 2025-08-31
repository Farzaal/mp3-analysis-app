import { forwardRef, Module } from '@nestjs/common';
import { ServiceRequestController } from './serviceRequest.controller';
import { ServiceRequestService } from './serviceRequest.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServiceRequestMasterModel } from '@/app/models/serviceRequest/serviceRequestMaster.model';
import { ServiceRequestNoteModel } from '@/app/models/serviceRequest/serviceRequestNote.model';
import { ServiceRequestMediaModel } from '@/app/models/serviceRequest/serviceRequestMedia.model';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { ServiceRequestMediaRepository } from '@/app/repositories/serviceRequest/serviceRequestMedia.repository';
import { ServiceRequestNoteRepository } from '@/app/repositories/serviceRequest/serviceRequestNote.repository';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { PropertiesModule } from '@/properties/property.module';
import { VendorModule } from '@/vendor/vendor.module';
import { VendorServiceLocationRepository } from '@/app/repositories/vendor/vendorServiceLocation.repository';
import { GeneralHelper } from '@/app/utils/general.helper';
import { S3Service } from '@/app/commons/s3.service';
import { BunyanLogger } from '@/app/commons/logger.service';
import { ServiceRequestVendorStatusRepository } from '@/app/repositories/serviceRequest/serviceRequestVendorStatus.repository';
import { ServiceRequestVendorStatusModel } from '@/app/models/serviceRequest/serviceRequestVendorStatus.model';
import { ServiceRequestLinenDetailModel } from '@/app/models/serviceRequest/serviceRequestLinenDetail.model';
import { ServiceRequestLinenDetailRepository } from '@/app/repositories/serviceRequest/serviceRequestLinenDetail.repository';
import { PaymentModule } from '@/payment/payment.module';
import { NotificationsModule } from '@/notifications/notification.module';
import { ServiceRequestNotificationService } from './serviceRequestNotification.service';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { PaymentLogRepository } from '@/app/repositories/payment/paymentLog.repository';
import { ScheduledNotificationModel } from '@/app/models/notification/scheduledNotification.model';
import { ServiceRequestRecurringDateRepository } from '@/app/repositories/serviceRequest/serviceRequestRecurringDate.repository';
import { ServiceRequestRecurringLogModel } from '@/app/models/serviceRequest/serviceRequestRecurringLog.model';
import { ServiceRequestRecurringLogRepository } from '@/app/repositories/serviceRequest/serviceRequestRecurringLog.repository';
import { SettingRepository } from '@/app/repositories/setting/setting.repository';
import { ServiceRequestDiscrepancyRepository } from '@/app/repositories/serviceRequest/serviceRequestDiscrepancy.repository';
import { ServiceRequestDiscrepancyModel } from '@/app/models/serviceRequest/serviceRequestDiscrepancy.model';
import { InvoiceModule } from '@/invoice/invoice.module';
import { InvoiceService } from '@/invoice/invoice.service';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { ServiceTypeModule } from '@/serviceType/serviceType.module';
import { EstimateModule } from '@/estimate/estimate.module';
import { OwnerPaymentDetailsRepository } from '@/app/repositories/invoice/onwerPaymentDetails.repository';
import { VendorPaymentDetailsRepository } from '@/app/repositories/invoice/vendorPaymentDetails.repository';
import { MembershipTierRepository } from '@/app/repositories/membershipTier/membershipTier.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequestMasterModel,
      ServiceRequestNoteModel,
      ServiceRequestMediaModel,
      ServiceRequestVendorStatusModel,
      ServiceRequestLinenDetailModel,
      ScheduledNotificationModel,
      ServiceRequestRecurringLogModel,
      ServiceRequestDiscrepancyModel,
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
    PropertiesModule,
    VendorModule,
    PaymentModule,
    NotificationsModule,
    InvoiceModule,
    ServiceTypeModule,
    EstimateModule,
    forwardRef(() => InvoiceModule),
  ],
  controllers: [ServiceRequestController],
  exports: [
    ServiceRequestService,
    ServiceRequestMasterRepository,
    ServiceRequestNoteRepository,
    ServiceRequestMediaRepository,
    ServiceRequestVendorStatusRepository,
    ServiceRequestLinenDetailRepository,
    ServiceRequestNotificationService,
    ServiceRequestRecurringDateRepository,
    ServiceRequestRecurringLogRepository,
    PaymentLogRepository,
    SettingRepository,
    GeneralHelper,
  ],
  providers: [
    ServiceRequestService,
    PropertyMasterRepository,
    UserPaymentMethodRepository,
    FranchiseServiceTypeRepository,
    ServiceRequestMasterRepository,
    ServiceRequestMediaRepository,
    ServiceRequestDiscrepancyRepository,
    ServiceRequestVendorStatusRepository,
    VendorServiceLocationRepository,
    ServiceRequestNoteRepository,
    ServiceRequestLinenDetailRepository,
    ServiceRequestRecurringDateRepository,
    ServiceRequestRecurringLogRepository,
    ServiceRequestNotificationService,
    SettingRepository,
    GeneralHelper,
    PaymentLogRepository,
    UserRepository,
    FranchiseRepository,
    InvoiceService,
    InvoiceMasterRepository,
    S3Service,
    BunyanLogger,
    OwnerPaymentDetailsRepository,
    VendorPaymentDetailsRepository,
    MembershipTierRepository,
  ],
})
export class ServiceRequestModule {}
