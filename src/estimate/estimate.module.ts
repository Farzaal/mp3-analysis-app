import { forwardRef, Module } from '@nestjs/common';
import { EstimateController } from './estimate.controller';
import { BunyanLogger } from '../app/commons/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EstimateMasterModel } from '@/app/models/estimate/estimateMaster.model';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { EstimateMasterRepository } from '@/app/repositories/estimate/estimateMaster.repository';
import { EstimateService } from './estimate.service';
import { GeneralHelper } from '@/app/utils/general.helper';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { EstimateDetailsRepository } from '@/app/repositories/estimate/estimateDetails.repository';
import { FranchiseServiceTypeRepository } from '@/app/repositories/serviceType/franchiseServiceType.repository';
import { EstimateAssetRepository } from '@/app/repositories/estimate/estimateAsset.repository';
import { VendorServiceTypeRepository } from '@/app/repositories/vendor/vendorServiceType.repository';
import { ServiceRequestModule } from '@/serviceRequest/serviceRequest.module';
import { EstimateDetailModel } from '@/app/models/estimate/estimateDetail.model';
import { EstimateAssetModel } from '@/app/models/estimate/estimateAsset.model';
import { UserDescriptionRepository } from '@/app/repositories/user/userDescription.repository';
import { UserDescriptionModel } from '@/app/models/user/userDescription.model';
import { EstimateDetailRejectionRepository } from '@/app/repositories/estimate/estimateRejection.repository';
import { EstimateDetailRejectionModel } from '@/app/models/estimate/estimateDetailRejection.model';
import { S3Service } from '@/app/commons/s3.service';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from '@/notifications/notifications.service';
import { VendorServiceTypePriorityRepository } from '@/app/repositories/vendor/vendorServiceTypePriority.repository';
import { NotificationsModule } from '@/notifications/notification.module';
import { EstimateVendorDistributionModel } from '@/app/models/estimate/estimateVendorDistribution.model';
import { EstimateVendorDistributionRepository } from '@/app/repositories/estimate/estimateVendorDistribution.repository';
import { ServiceTypeRepository } from '@/app/repositories/serviceType/serviceType.respository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EstimateMasterModel,
      EstimateDetailModel,
      EstimateAssetModel,
      UserDescriptionModel,
      EstimateDetailRejectionModel,
      EstimateVendorDistributionModel,
    ]),
    ConfigModule,
    forwardRef(() => ServiceRequestModule),
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
  controllers: [EstimateController],
  exports: [EstimateMasterRepository, EstimateDetailsRepository],
  providers: [
    EstimateService,
    PropertyMasterRepository,
    FranchiseServiceTypeRepository,
    EstimateMasterRepository,
    UserDescriptionRepository,
    EstimateDetailsRepository,
    EstimateAssetRepository,
    UserRepository,
    ServiceTypeRepository,
    VendorServiceTypeRepository,
    EstimateDetailRejectionRepository,
    GeneralHelper,
    BunyanLogger,
    S3Service,
    NotificationsService,
    VendorServiceTypePriorityRepository,
    EstimateVendorDistributionRepository,
  ],
})
export class EstimateModule {}
