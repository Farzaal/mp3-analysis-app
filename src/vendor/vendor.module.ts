import { ServiceTypeService } from './../serviceType/serviceType.service';
import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralHelper } from '../app/utils/general.helper';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModel } from '@/app/models/user/user.model';
import { VendorService } from './vendor.service';
import { ServiceTypeRepository } from '@/app/repositories/serviceType/serviceType.respository';
import { VendorServiceTypeRepository } from '../app/repositories/vendor/vendorServiceType.repository';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { ServiceTypeModule } from '@/serviceType/serviceType.module';
import { VendorServiceLocationRepository } from '@/app/repositories/vendor/vendorServiceLocation.repository';
import { FranchiseServiceLocationRepository } from '@/app/repositories/franchise/franchiseServiceLocation.repository';
import { PropertiesModule } from '@/properties/property.module';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsModule } from '@/notifications/notification.module';
import { BunyanLogger } from '@/app/commons/logger.service';
import { UserTokenRepository } from '@/app/repositories/user/userToken.repository';
import { EncryptionHelper } from '@/app/utils/encryption.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel, FranchiseModel]),
    ConfigModule,
    ServiceTypeModule,
    PropertiesModule,
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
  ],
  controllers: [VendorController],
  exports: [
    VendorService,
    VendorServiceTypeRepository,
    VendorServiceLocationRepository,
  ],
  providers: [
    VendorService,
    ServiceTypeService,
    UserRepository,
    ServiceTypeRepository,
    VendorServiceTypeRepository,
    GeneralHelper,
    FranchiseRepository,
    BunyanLogger,
    VendorServiceLocationRepository,
    FranchiseServiceTypeRepository,
    FranchiseServiceLocationRepository,
    NotificationsService,
    UserTokenRepository,
    EncryptionHelper,
  ],
})
export class VendorModule {}
