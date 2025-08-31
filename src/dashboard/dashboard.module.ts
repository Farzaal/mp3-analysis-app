import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { ServiceTypeRequestRepository } from '@/app/repositories/serviceType/serviceTypeRequest.repository';
import { ServiceRequestMasterRepository } from '@/app/repositories/serviceRequest/serviceRequestMaster.repository';
import { InvoiceMasterRepository } from '@/app/repositories/invoice/invoiceMaster.repository';
import { EstimateMasterRepository } from '@/app/repositories/estimate/estimateMaster.repository';
import { DashboardRepository } from '@/app/repositories/dashboard/dashboard.repository';
import { VendorServiceTypeRepository } from '@/app/repositories/vendor/vendorServiceType.repository';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
@Module({
  imports: [
    TypeOrmModule.forFeature([]),
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
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardRepository,
    UserRepository,
    PropertyMasterRepository,
    ServiceTypeRequestRepository,
    ServiceRequestMasterRepository,
    InvoiceMasterRepository,
    EstimateMasterRepository,
    VendorServiceTypeRepository,
    FranchiseRepository,
  ],
})
export class DashboardModule {}
