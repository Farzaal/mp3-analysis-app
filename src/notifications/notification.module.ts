// notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationRepository } from '@/app/repositories/notification/notification.repository';
import { NotificationModel } from '@/app/models/notification/notification.model';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationModel]),
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
  providers: [NotificationsService, NotificationRepository],
  exports: [NotificationsService, NotificationRepository],
})
export class NotificationsModule {}
