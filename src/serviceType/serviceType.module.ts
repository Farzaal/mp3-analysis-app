import { ServiceTypeModel } from '@/app/models/serviceType/serviceType.model';
import { Module } from '@nestjs/common';
import { ServiceTypeController } from './serviceType.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralHelper } from '../app/utils/general.helper';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServiceTypeService } from './serviceType.service';
import { ServiceTypeRepository } from '@/app/repositories/serviceType/serviceType.respository';
import { UserModel } from '@/app/models/user/user.model';
import { ServiceTypeCategoryRepository } from '@/app/repositories/serviceType/serviceTypeCategory.repository';
import { ServiceTypeCategoryModel } from '@/app/models/serviceType/serviceTypeCategory.model';
import { PropertyServiceTypeRateModel } from '@/app/models/property/propertyServiceTypeRates.model';
import { PropertyServiceTypeRateRepository } from '@/app/repositories/property/propertyServiceTypeRate.repository';
import { PropertiesModule } from '@/properties/property.module';
import { FranchiseServiceTypeCategoryRepository } from '@/app/repositories/serviceType/franchiseServiceTypeCategory.repository';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { FranchiseServiceTypeCategoryModel } from '@/app/models/serviceType/franchiseServiceTypeCategory.model';
import { FranchiseServiceTypeModel } from '@/app/models/serviceType/franchiseServiceType.model';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { ServiceTypeRequestRepository } from '@/app/repositories/serviceType/serviceTypeRequest.repository';
import { ServiceTypeRequestModel } from '@/app/models/serviceType/serviceTypeRequest.model';
import { VendorServiceTypeRepository } from '@/app/repositories/vendor/vendorServiceType.repository';
import { VendorServiceTypeModel } from '@/app/models/serviceType/vendorServiceType.model';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from '@/notifications/notifications.service';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { NotificationsModule } from '@/notifications/notification.module';
import { VendorServiceTypePriorityRepository } from '@/app/repositories/vendor/vendorServiceTypePriority.repository';
import { ServiceTypeImageModel } from '@/app/models/serviceType/serviceTypeImage.model';
import { ServiceTypeImageRepository } from '@/app/repositories/serviceType/serviceTypeImage.repository';
import { S3Service } from '@/app/commons/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceTypeModel,
      UserModel,
      ServiceTypeCategoryModel,
      PropertyServiceTypeRateModel,
      FranchiseServiceTypeCategoryModel,
      FranchiseServiceTypeModel,
      ServiceTypeRequestModel,
      VendorServiceTypeModel,
      ServiceTypeImageModel,
    ]),
    ConfigModule,
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
  controllers: [ServiceTypeController],
  exports: [
    ServiceTypeService,
    ServiceTypeCategoryRepository,
    PropertyServiceTypeRateRepository,
    FranchiseServiceTypeRepository,
    FranchiseServiceTypeCategoryRepository,
    ServiceTypeRequestRepository,
    VendorServiceTypeRepository,
    ServiceTypeImageRepository,
    UserRepository,
    NotificationsService,
    S3Service,
  ],
  providers: [
    VendorServiceTypePriorityRepository,
    ServiceTypeService,
    ServiceTypeRepository,
    FranchiseRepository,
    GeneralHelper,
    S3Service,
    ServiceTypeCategoryRepository,
    PropertyServiceTypeRateRepository,
    FranchiseServiceTypeCategoryRepository,
    FranchiseServiceTypeRepository,
    ServiceTypeRequestRepository,
    VendorServiceTypeRepository,
    ServiceTypeImageRepository,
    NotificationsService,
    UserRepository,
  ],
})
export class ServiceTypeModule {}
