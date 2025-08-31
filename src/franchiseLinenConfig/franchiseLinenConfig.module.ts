import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FranchiseLinenConfigService } from './franchiseLinenConfig.service';
import { FranchiseLinenConfigController } from './franchiseLinenConfig.controller';
import { ServiceTypeModule } from '@/serviceType/serviceType.module';
import { FranchiseLinenConfigModel } from '@/app/models/linen/franchiseLinenConfig.model';
import { ServiceTypeCategoryRepository } from '@/app/repositories/serviceType/serviceTypeCategory.repository';
import { ServiceTypeRepository } from '@/app/repositories/serviceType/serviceType.respository';
import { FranchiseLinenConfigRepository } from '@/app/repositories/linen/franchiseLinenConfig.repository';
import { GeneralHelper } from '@/app/utils/general.helper';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([FranchiseLinenConfigModel]),
    ConfigModule,
    ServiceTypeModule,
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
  controllers: [FranchiseLinenConfigController],
  providers: [
    FranchiseLinenConfigService,
    FranchiseLinenConfigRepository,
    ServiceTypeCategoryRepository,
    ServiceTypeRepository,
    GeneralHelper,
  ],
})
export class FranchiseLinenConfigModule {}
