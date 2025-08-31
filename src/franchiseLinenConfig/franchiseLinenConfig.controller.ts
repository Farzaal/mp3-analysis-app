import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
  Get,
  Delete,
  Put,
} from '@nestjs/common';
import { User } from '@/app/decorators/user.decorator';
import { Response } from 'express';
import {
  CreateFranchiseLinenConfigDto,
  UpdateFranchiseLinenConfigDto,
} from './franchiseLinenConfig.dto';
import { BaseController } from '../app/commons/base.controller';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FranchiseLinenConfigService } from './franchiseLinenConfig.service';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { PaginationParam } from '@/app/commons/base.request';
import { LinenType } from '@/app/contracts/enums/linenType.enum';

@ApiTags('Linen Config')
@ApiBearerAuth('JWT')
@Controller()
export class FranchiseLinenConfigController extends BaseController {
  constructor(
    private readonly franchiselinenConfigService: FranchiseLinenConfigService,
  ) {
    super();
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Post('linen-config')
  async create(
    @Body() payload: CreateFranchiseLinenConfigDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const linenConfig = await this.franchiselinenConfigService.create(
      payload,
      user,
    );
    return this.OKResponse(res, linenConfig);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
    ]),
  )
  @Get('linen-config/:type')
  async getLinenConfigs(
    @Param('type') type: LinenType,
    @Query() query: PaginationParam,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const linenConfigs = await this.franchiselinenConfigService.getLinenConfigs(
      type,
      query,
      user,
    );
    return this.OKResponse(res, linenConfigs);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('linen-config-details/:configId')
  async getLinenConfig(
    @Param('configId') configId: string,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const linenConfig = await this.franchiselinenConfigService.getLinenConfig(
      configId,
      user,
    );
    return this.OKResponse(res, linenConfig);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('linen-config')
  async updateLinenConfig(
    @Body() payload: UpdateFranchiseLinenConfigDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const linenConfig =
      await this.franchiselinenConfigService.updateLinenConfig(payload, user);
    return this.OKResponse(res, linenConfig);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Delete('linen-config/:configId')
  async deleteLinenConfig(
    @Param('configId') configId: string,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const linenConfig =
      await this.franchiselinenConfigService.deleteLinenConfig(configId, user);
    return this.OKResponse(res, linenConfig);
  }
}
