import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
  Param,
  Get,
  Delete,
  Put,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CreateFormDto,
  CreatePreSignedUrlDto,
  UpdateSettingDto,
} from './form.dto';
import { BaseController } from '../app/commons/base.controller';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FormService } from './form.service';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';

@ApiTags('Form')
@ApiBearerAuth('JWT')
@Controller()
export class FormController extends BaseController {
  constructor(private formService: FormService) {
    super();
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
      UserType.Vendor,
      UserType.SuperAdmin,
    ]),
  )
  @Post('form')
  async upsertForm(@Body() payload: CreateFormDto, @Res() res: Response) {
    const form = await this.formService.upsertForm(payload);
    return this.OKResponse(res, form);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
      UserType.Vendor,
      UserType.SuperAdmin,
    ]),
  )
  @Get('form/:formType')
  async getFormByType(
    @Res() res: Response,
    @Param('formType') formType: string,
  ) {
    const forms = await this.formService.getFormByType(formType);
    return this.OKResponse(res, forms);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
      UserType.Vendor,
      UserType.SuperAdmin,
    ]),
  )
  @Delete('form/:formId')
  async deleteForm(@Res() res: Response, @Param('formId') formId: number) {
    const form = await this.formService.deleteForm(formId);
    return this.OKResponse(res, form);
  }

  @Post('/presigned-url')
  async getPreSignedUrl(
    @Body() payload: CreatePreSignedUrlDto,
    @Res() res: Response,
  ) {
    const preSignedUrls = await this.formService.getPresignedUrls(payload);
    return this.OKResponse(res, preSignedUrls);
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Put('/setting')
  async updateSetting(@Body() payload: UpdateSettingDto, @Res() res: Response) {
    const form = await this.formService.updateSetting(payload);
    return this.OKResponse(res, form);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
      UserType.Vendor,
      UserType.SuperAdmin,
    ]),
  )
  @Get('/setting')
  async getAllSetting(@Res() res: Response) {
    const form = await this.formService.getSetting();
    return this.OKResponse(res, form);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
      UserType.Vendor,
      UserType.SuperAdmin,
    ]),
  )
  @Get('/setting/:key')
  async getSetting(@Param('key') key: string, @Res() res: Response) {
    const form = await this.formService.getSetting(key);
    return this.OKResponse(res, form);
  }
}
