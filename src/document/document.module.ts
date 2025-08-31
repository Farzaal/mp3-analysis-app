import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentRepository } from '@/app/repositories/document/document.repository';
import { GeneralHelper } from '@/app/utils/general.helper';
import { S3Service } from '@/app/commons/s3.service';
import { BunyanLogger } from '@/app/commons/logger.service';
import { DocumentModel } from '@/app/models/document/document.model';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentModel]),
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
  controllers: [DocumentController],
  providers: [
    DocumentService,
    DocumentRepository,
    GeneralHelper,
    S3Service,
    BunyanLogger,
  ],
})
export class DocumentModule {}
