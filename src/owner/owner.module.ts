import { forwardRef, Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { UserModel } from '@/app/models/user/user.model';
import { PaymentModule } from '@/payment/payment.module';
import { FranchiseModel } from '@/app/models/franchise/franchise.model';
import { FranchiseRepository } from '@/app/repositories/franchise/franchise.repository';
import { GeneralHelper } from '@/app/utils/general.helper';
import { JwtModule } from '@nestjs/jwt';
import { UserPaymentMethodRepository } from '@/app/repositories/user/userPaymentMethod.repository';
import { PropertyMasterRepository } from '@/app/repositories/property/propertyMaster.respository';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationRepository } from '@/app/repositories/notification/notification.repository';
import { BunyanLogger } from '@/app/commons/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel, FranchiseModel]),
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
    forwardRef(() => PaymentModule),
  ],
  controllers: [OwnerController],
  providers: [
    OwnerService,
    UserRepository,
    FranchiseRepository,
    GeneralHelper,
    UserPaymentMethodRepository,
    PropertyMasterRepository,
    NotificationsService,
    NotificationRepository,
    BunyanLogger,
  ],
  exports: [OwnerService, UserRepository],
})
export class OwnerModule {}
