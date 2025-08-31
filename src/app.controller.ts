import { Controller, Get, Res } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags } from "@nestjs/swagger";
import { BaseController } from "./app/commons/base.controller";
import { Response } from "express";

@ApiTags("App")
@Controller()
export class AppController extends BaseController {
  constructor(private readonly appService: AppService) {
    super();
  }

  @Get("/ping")
  getHello(@Res() res: Response) {
    const pingResponse = this.appService.getHello();
    return this.OKResponse(res, pingResponse);
  }
}
