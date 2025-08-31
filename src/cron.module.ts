import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from './app/config/typeorm.config';
import { BunyanLogger } from './app/commons/logger.service';
// import { SchedulerModule } from './scheduler/scheduler.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        await getTypeOrmConfig(configService),
    }),
    ScheduleModule.forRoot(),
    SchedulerModule,
  ],
  controllers: [],
  providers: [BunyanLogger],
})
export class CronModule {}
