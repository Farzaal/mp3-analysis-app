import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './app/config/typeorm.config';
import { PropertiesModule } from './properties/property.module';
import { AuthModule } from './auth/auth.module';
import { ServiceTypeModule } from './serviceType/serviceType.module';
import { VendorModule } from './vendor/vendor.module';
import { PaymentModule } from './payment/payment.module';
import { OwnerModule } from './owner/owner.module';
import { FranchiseModule } from './franchise/franchise.module';
import { FormModule } from './form/form.module';
import { ServiceRequestModule } from './serviceRequest/serviceRequest.module';
import { ServiceRequestController } from './serviceRequest/serviceRequest.controller';
import { ServiceRequestService } from './serviceRequest/serviceRequest.service';
import { S3Service } from './app/commons/s3.service';
import { EstimateModule } from './estimate/estimate.module';
import { BunyanLogger } from './app/commons/logger.service';
import { DocumentModule } from './document/document.module';
import { FranchiseLinenConfigModule } from './franchiseLinenConfig/franchiseLinenConfig.module';
import { InvoiceModule } from './invoice/invoice.module';
import { DecryptMiddleware } from './app/middleware/decrypt.middleware';
import { EncryptionHelper } from './app/utils/encryption.helper';
import { JwtModule } from '@nestjs/jwt';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notification.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReportDownloadListener } from './reportDownload/reportDownload.listener';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        await getTypeOrmConfig(configService),
    }),
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
    AuthModule,
    ServiceTypeModule,
    VendorModule,
    PaymentModule,
    OwnerModule,
    FranchiseModule,
    FormModule,
    ServiceRequestModule,
    EstimateModule,
    DocumentModule,
    FranchiseLinenConfigModule,
    InvoiceModule,
    DashboardModule,
    NotificationsModule,
  ],
  controllers: [AppController, ServiceRequestController],
  providers: [
    AppService,
    ServiceRequestService,
    S3Service,
    BunyanLogger,
    EncryptionHelper,
    ReportDownloadListener,
  ],
})

// Middleware enabled for following routes
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DecryptMiddleware)
      .forRoutes(
        { path: 'franchise', method: RequestMethod.PUT },
        { path: 'vendor', method: RequestMethod.POST },
        { path: 'town', method: RequestMethod.POST },
        { path: 'town', method: RequestMethod.PUT },
        { path: 'owner', method: RequestMethod.POST },
        { path: 'franchise-register', method: RequestMethod.POST },
        { path: 'franchise-site', method: RequestMethod.PUT },
      );
  }
}
