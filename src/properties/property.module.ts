import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { PropertyMasterRepository } from '../app/repositories/property/propertyMaster.respository';
import { GeneralHelper } from '../app/utils/general.helper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyMasterModel } from '../app/models/property/propertyMaster.model';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PropertyCleaningDetailModel } from '../app/models/property/propertyCleaningDetail.model';
import { PropertyMaintenanceDetailModel } from '../app/models/property/propertyMaintainenceDetail.model';
import { PropertyCleaningDetailRepository } from '../app/repositories/property/propertyCleaningDetail.repository';
import { PropertyMaintenanceDetailRepository } from '../app/repositories/property/propertyMaintainenceDetail.repository';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { OwnerModule } from '@/owner/owner.module';
import { MembershipTierRepository } from '@/app/repositories/membershipTier/membershipTier.repository';
import { FranchiseServiceLocationRepository } from '@/app/repositories/franchise/franchiseServiceLocation.repository';
import { VendorServiceTypePriorityRepository } from '@/app/repositories/vendor/vendorServiceTypePriority.repository';
import { VendorServiceTypeRepository } from '@/app/repositories/vendor/vendorServiceType.repository';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { FranchiseServiceTypeRepository } from '../app/repositories/serviceType/franchiseServiceType.repository';
import { BunyanLogger } from '@/app/commons/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PropertyMasterModel,
      PropertyCleaningDetailModel,
      PropertyMaintenanceDetailModel,
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
    OwnerModule,
  ],
  controllers: [PropertyController],
  providers: [
    PropertyService,
    UserRepository,
    PropertyMasterRepository,
    PropertyCleaningDetailRepository,
    PropertyMaintenanceDetailRepository,
    MembershipTierRepository,
    FranchiseServiceLocationRepository,
    VendorServiceTypePriorityRepository,
    VendorServiceTypeRepository,
    FranchiseRepository,
    FranchiseServiceTypeRepository,
    GeneralHelper,
    BunyanLogger,
  ],
  exports: [
    PropertyService,
    PropertyMasterRepository,
    VendorServiceTypePriorityRepository,
  ],
})
export class PropertiesModule {}
