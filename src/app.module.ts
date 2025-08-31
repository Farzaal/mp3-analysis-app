import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { BunyanLogger } from "./app/commons/logger.service";
import { Mp3AnalysisService } from "./mp3-analysis.service";
import { FileValidationPipe } from "./app/pipes/file-validation.pipe";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
  ],
  controllers: [AppController],
  providers: [AppService, BunyanLogger, Mp3AnalysisService, FileValidationPipe],
})
export class AppModule {}
