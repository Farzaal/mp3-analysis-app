import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from '../app/models/user/user.model';
import { GeneralHelper } from '../app/utils/general.helper';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from '@/app/repositories/user/user.repository';
import { UserTokenModel } from '@/app/models/user/userToken.model';
import { UserTokenRepository } from '@/app/repositories/user/userToken.repository';
import { EncryptionHelper } from '@/app/utils/encryption.helper';
import { NotificationsModule } from '@/notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserModel, UserTokenModel]),
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
    NotificationsModule,
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    GeneralHelper,
    UserTokenRepository,
    EncryptionHelper,
  ],
  exports: [AuthService],
})
export class AuthModule {}
