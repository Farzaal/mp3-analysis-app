import { Module } from '@nestjs/common';
import { FranchiseController } from './franchise.controller';
import { FranchiseService } from './franchise.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { FranchiseServiceLocationModel } from '@/app/models/franchise/franchiseServiceLocation.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModel } from '@/app/models/user/user.model';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { FranchiseServiceLocationRepository } from '@/app/repositories/franchise/franchiseServiceLocation.repository';
import { GeneralHelper } from '@/app/utils/general.helper';
import { ServiceTypeModule } from '@/serviceType/serviceType.module';
import { UserMenuItemModel } from '@/app/models/user/userMenuItem.model';
import { EncryptionHelper } from '@/app/utils/encryption.helper';
import { StripeService } from '@/payment/stripe.service';
import { BunyanLogger } from '@/app/commons/logger.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsModule } from '@/notifications/notification.module';
import { DocumentRepository } from '@/app/repositories/document/document.repository';
import { S3Service } from '@/app/commons/s3.service';
import { UserTokenRepository } from '@/app/repositories/user/userToken.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FranchiseModel,
      FranchiseServiceLocationModel,
      UserModel,
      UserMenuItemModel,
    ]),
    ConfigModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get('JWT_SECRET_KEY'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRY') },
      }),
    }),
    ServiceTypeModule,
  ],
  exports: [FranchiseService],
  controllers: [FranchiseController],
  providers: [
    FranchiseService,
    UserRepository,
    FranchiseRepository,
    FranchiseServiceLocationRepository,
    GeneralHelper,
    EncryptionHelper,
    StripeService,
    BunyanLogger,
    NotificationsService,
    DocumentRepository,
    S3Service,
    UserTokenRepository,
  ],
})
export class FranchiseModule {}
