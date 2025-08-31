import { UserType } from '@/app/contracts/enums/usertype.enum';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
  Put,
  Get,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import {
  CreateFranchiseDto,
  SearchFranchiseDto,
  CreateTownDto,
  CreateStandardAdminDto,
  UpdateStandardAdminDto,
  StandardAdminSearchQueryDto,
  UpdateFranchiseDto,
  UpdateFranchiseSiteDto,
  UpdateTownDto,
} from './franchise.dto';
import { BaseController } from '@/app/commons/base.controller';
import { Response } from 'express';
import { FranchiseService } from './franchise.service';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { User } from '@/app/decorators/user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Franchise')
@ApiBearerAuth('JWT')
@Controller()
export class FranchiseController extends BaseController {
  constructor(private franchiseService: FranchiseService) {
    super();
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Get('franchise-admin/:id')
  async getFranchiseAdmin(@Param('id') id: string, @Res() res: Response) {
    const userResponse =
      await this.franchiseService.getFranchiseAdminDetails(id);
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Get('franchise')
  async getAllFranchise(
    @Query() query: SearchFranchiseDto,
    @Res() res: Response,
  ) {
    const franchiseResponse =
      await this.franchiseService.getAllFranchise(query);
    return this.OKResponse(res, franchiseResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Get('franchise/:id')
  async getFranchiseById(
    @Param('id') id: string,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const franchiseResponse = await this.franchiseService.getFranchiseDetails(
      id,
      user,
    );
    return this.OKResponse(res, franchiseResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
      UserType.Owner,
    ]),
  )
  @Get('town')
  async getTowns(@User() user: JwtPayload, @Res() res: Response) {
    const towns = await this.franchiseService.getTowns(user, null);
    return this.OKResponse(res, towns);
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Get('town/:franchise_id')
  async getTownsForSuperAdmin(
    @Param('franchise_id') franchise_id: string,
    @Res() res: Response,
  ) {
    const towns = await this.franchiseService.getTowns(null, franchise_id);
    return this.OKResponse(res, towns);
  }

  @Post('town')
  async addTown(@Body() payload: CreateTownDto, @Res() res: Response) {
    const towns = await this.franchiseService.addTown(payload);
    return this.OKResponse(res, towns);
  }

  @Put('town')
  async updateTown(@Body() payload: UpdateTownDto, @Res() res: Response) {
    const towns = await this.franchiseService.updateTown(payload);
    return this.OKResponse(res, towns);
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Put('franchise')
  async updateFranchise(
    @Body() payload: UpdateFranchiseDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const userResponse = await this.franchiseService.updateFranchise(
      payload,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @Post('franchise-register')
  async createFranchise(
    @Body() franchise: CreateFranchiseDto,
    @Res() res: Response,
  ) {
    const userResponse = await this.franchiseService.createFranchise(franchise);
    return this.OKResponse(res, userResponse);
  }

  @Put('franchise-site')
  async updateFranchiseSite(
    @Body() payload: UpdateFranchiseSiteDto,
    @Res() res: Response,
  ) {
    const userResponse =
      await this.franchiseService.updateFranchiseSite(payload);
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.FranchiseAdmin]))
  @Post('standard-admin-register')
  async createStandardAdmin(
    @Body() standardAdmin: CreateStandardAdminDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const userResponse = await this.franchiseService.createStandardAdmin(
      standardAdmin,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.FranchiseAdmin]))
  @Put('standard-admin')
  async updateStandardAdmin(
    @Body() standardAdmin: UpdateStandardAdminDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const userResponse = await this.franchiseService.updateStandardAdmin(
      standardAdmin,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.FranchiseAdmin]))
  @Delete('standard-admin/:id')
  async deleteStandardAdmin(
    @Param('id') id: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const userResponse = await this.franchiseService.deleteStandardAdmin(
      id,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.FranchiseAdmin]))
  @Get('standard-admin/:id')
  async getStandardAdminById(
    @Param('id') id: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const userResponse = await this.franchiseService.getStandardAdminDetails(
      id,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.FranchiseAdmin]))
  @Get('standard-admin')
  async getStandardAdmins(
    @Query() query: StandardAdminSearchQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const userResponse = await this.franchiseService.getStandardAdmins(
      query,
      user,
    );
    return this.OKResponse(res, userResponse);
  }
}
