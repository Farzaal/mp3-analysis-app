import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags, ApiOperation, ApiBody, ApiConsumes } from "@nestjs/swagger";
import { BaseController } from "./app/commons/base.controller";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { Mp3AnalysisService } from "./app/mp3-analysis.service";
import { FileUploadDto } from "./app/dto/file-upload.dto";
import { FileValidationPipe } from "./app/pipes/file-validation.pipe";
import { FILE_UPLOAD_API_DOCS } from "./app/constants/api-docs.constants";

@ApiTags("App")
@Controller()
export class AppController extends BaseController {
  constructor(
    private readonly appService: AppService,
    private readonly mp3AnalysisService: Mp3AnalysisService,
  ) {
    super();
  }

  @Get("/ping")
  getHello(@Res() res: Response) {
    const pingResponse = this.appService.getHello();
    return this.OKResponse(res, pingResponse);
  }

  @Post("/file-upload")
  @UseInterceptors(FileInterceptor("file"))
  @UsePipes(FileValidationPipe)
  @ApiOperation(FILE_UPLOAD_API_DOCS)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: FileUploadDto,
    description: "Upload MP3 file for analysis",
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ): Promise<Response> {
    const result = await this.mp3AnalysisService.analyzeMp3File(file.buffer);
    return this.OKResponse(res, result);
  }
}
