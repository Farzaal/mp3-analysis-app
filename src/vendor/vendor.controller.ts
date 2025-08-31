import {
  Body,
  Controller,
  Post,
  Put,
  Res,
  UseGuards,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CreateVendorDto,
  UpdateVendorDto,
  VendorApprovalDto,
  VendorSearchQueryDto,
} from './vendor.dto';
import { BaseController } from '../app/commons/base.controller';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { User } from '@/app/decorators/user.decorator';

@ApiTags('Vendor')
@ApiBearerAuth('JWT')
@Controller()
export class VendorController extends BaseController {
  constructor(private vendorServices: VendorService) {
    super();
  }

  @Post('vendor')
  async create(@Body() payload: CreateVendorDto, @Res() res: Response) {
    const vendor = await this.vendorServices.createVendor(payload);
    return this.OKResponse(res, vendor);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Post('vendor-create')
  async createNewVendor(
    @Body() payload: CreateVendorDto,
    @Res() res: Response,
  ) {
    const vendor = await this.vendorServices.createVendor(payload, true);
    return this.OKResponse(res, vendor);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('vendor')
  async getVendors(
    @Query() query: VendorSearchQueryDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const vendor = await this.vendorServices.getVendors(query, user);
    return this.OKResponse(res, vendor);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
    ]),
  )
  @Get('vendor/:vendor_id')
  async getVendor(@Param('vendor_id') vendor_id: number, @Res() res: Response) {
    const vendor = await this.vendorServices.getVendor(vendor_id);
    return this.OKResponse(res, vendor);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
    ]),
  )
  @Put('vendor')
  async update(
    @Body() payload: UpdateVendorDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const vendor = await this.vendorServices.update(payload, user);
    return this.OKResponse(res, vendor);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('vendor/status')
  async active(
    @Body() payload: VendorApprovalDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const vendor = await this.vendorServices.updateVendorApproval(
      payload,
      user,
    );
    return this.OKResponse(res, vendor);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('vendors/all')
  async getAllVendors(@User() user: JwtPayload, @Res() res: Response) {
    const vendor = await this.vendorServices.getAllVendors(user);
    return this.OKResponse(res, vendor);
  }
}
