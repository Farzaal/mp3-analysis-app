import { NestFactory } from '@nestjs/core';
import { CronModule } from './cron.module';
import { ConfigService } from '@nestjs/config';
import { BunyanLogger } from './app/commons/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(CronModule);
  const configService = app.get(ConfigService);
  const appPort = configService.get('CRON_PORT');

  app.useLogger(new BunyanLogger());

  const logger = app.get(BunyanLogger);

  logger.log('Cron Job Started');

  await app.listen(appPort);
}

bootstrap();
