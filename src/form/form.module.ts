import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FormService } from './form.service';
import { FormSchemaModel } from '@/app/models/schema/formSchema.model';
import { FormController } from './form.controller';
import { FormRepository } from '@/app/repositories/form/form.repository';
import { S3Service } from '@/app/commons/s3.service';
import { ServiceTypeModule } from '@/serviceType/serviceType.module';
import { JwtModule } from '@nestjs/jwt';
import { SettingModel } from '@/app/models/setting/setting.model';
import { SettingRepository } from '@/app/repositories/setting/setting.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([FormSchemaModel, SettingModel]),
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
  controllers: [FormController],
  providers: [FormService, FormRepository, S3Service, SettingRepository],
})
export class FormModule {}
