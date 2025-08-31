import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BaseController } from '../app/commons/base.controller';
import { PropertyService } from './property.service';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '../app/contracts/enums/usertype.enum';
import {
  CreatePropertyDto,
  OffProgramDto,
  PropertySearchDto,
  CreatePreferredVendorDto,
  GetPreferredVendorCountDto,
} from './property.dto';
import { JwtPayload } from '../app/contracts/types/jwtPayload.type';
import { User } from '../app/decorators/user.decorator';

@ApiTags('Property')
@ApiBearerAuth('JWT')
@Controller()
export class PropertyController extends BaseController {
  constructor(private readonly propertyService: PropertyService) {
    super();
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Post('property')
  async ownerProfile(
    @User() user: JwtPayload,
    @Body() property: CreatePropertyDto,
    @Res() res: Response,
  ) {
    const propertyResponse = await this.propertyService.createOwnerProperty(
      property,
      user,
    );
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('property')
  async getProperty(
    @User() user: JwtPayload,
    @Query() query: PropertySearchDto,
    @Res() res: Response,
  ) {
    const propertyResponse = await this.propertyService.getOwnerProperty(
      user,
      query,
    );
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
    ]),
  )
  @Get('owner/property')
  async getOwnerProperty(@User() user: JwtPayload, @Res() res: Response) {
    const propertyResponse = await this.propertyService.getOwnerProperty(
      user,
      null,
      true,
    );
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
    ]),
  )
  @Put('property/:propertyId')
  async updatePropertyById(
    @User() user: JwtPayload,
    @Param('propertyId') propertyId: number,
    @Body() payload: CreatePropertyDto,
    @Res() res: Response,
  ) {
    const propertyResponse = await this.propertyService.updatePropertyById(
      payload,
      propertyId,
      user,
    );
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
    ]),
  )
  @Get('property/:propertyId')
  async getPropertyById(
    @Param('propertyId') propertyId: number,
    @Res() res: Response,
  ) {
    const propertyResponse =
      await this.propertyService.getPropertyById(propertyId);
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Patch('property/:propertyId/off-program')
  async propertyOffProgram(
    @Param('propertyId') propertyId: number,
    @User() user: JwtPayload,
    @Body() payload: OffProgramDto,
    @Res() res: Response,
  ) {
    const propertyResponse = await this.propertyService.propertyOffProgram(
      propertyId,
      payload,
      user,
    );
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Delete('property/:propertyId')
  async deleteProperty(
    @Param('propertyId') propertyId: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const propertyResponse = await this.propertyService.deleteProperty(
      propertyId,
      user,
    );
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('preferred-vendor')
  async createPreferredVendor(
    @Body() payload: CreatePreferredVendorDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const preferredVendor =
      await this.propertyService.createAndUpdatePreferredVendor(payload, user);
    return this.OKResponse(res, preferredVendor);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('preferred-vendor/:propertyId')
  async getPropertyPreferredVendor(
    @Param('propertyId') propertyId: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const preferredVendor =
      await this.propertyService.getPropertyPreferredVendor(propertyId, user);
    return this.OKResponse(res, preferredVendor);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('get-preferred-vendor-count')
  async getPreferredVendorCount(
    @Query() payload: GetPreferredVendorCountDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const preferredVendor = await this.propertyService.getPreferredVendorCount(
      payload,
      user,
    );
    return this.OKResponse(res, preferredVendor);
  }

  @Get('property-franchise-info/:propertyId')
  async getFranchisePropertyInfo(
    @Param('propertyId') propertyId: number,
    @Res() res: Response,
  ) {
    const preferredVendor =
      await this.propertyService.getFranchisePropertyInfo(propertyId);
    return this.OKResponse(res, preferredVendor);
  }
}
