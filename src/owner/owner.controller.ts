import { BaseController } from '@/app/commons/base.controller';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  CreateOwnerDto,
  OwnerSearchQueryDto,
  UpdateOwnerDto,
  ArchiveOwnerDto,
} from './owner.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OwnerService } from './owner.service';
import { Response } from 'express';
import { User } from '@/app/decorators/user.decorator';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';

@ApiTags('Owner')
@ApiBearerAuth('JWT')
@Controller()
export class OwnerController extends BaseController {
  constructor(private ownerService: OwnerService) {
    super();
  }

  @Post('owner')
  async createOwner(
    @Body() createOwnerDto: CreateOwnerDto,
    @Res() res: Response,
  ) {
    const userResponse =
      await this.ownerService.createOwnerProfile(createOwnerDto);
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Put('owner')
  async updateOwnerProfile(
    @Body() createOwnerDto: UpdateOwnerDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const userResponse = await this.ownerService.updateOwnerProfile(
      createOwnerDto,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('owner')
  async getOwners(
    @Query() ownerSearchDto: OwnerSearchQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const userResponse = await this.ownerService.getOwners(
      ownerSearchDto,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.Owner,
      UserType.StandardAdmin,
    ]),
  )
  @Get('owner/:ownerId')
  async getPropertyById(
    @Param('ownerId') ownerId: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const propertyResponse = await this.ownerService.getOwnerById(
      ownerId,
      user,
    );
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Put('onboarding/completed')
  async onboardingCompleted(@User() user: JwtPayload, @Res() res: Response) {
    const propertyResponse =
      await this.ownerService.ownerOnboardingCompleted(user);
    return this.OKResponse(res, propertyResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Get('payment-methods')
  async getOwnerPaymentMethods(@User() user: JwtPayload, @Res() res: Response) {
    const paymentMethods = await this.ownerService.getOwnerPaymentMethods(user);
    return this.OKResponse(res, paymentMethods);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Get('properties-payment-methods')
  async getPropertiesPaymentMethods(
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const paymentMethods =
      await this.ownerService.getPropertiesPaymentMethods(user);
    return this.OKResponse(res, paymentMethods);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Patch('owner/archive')
  async archiveOwner(
    @Body() payload: ArchiveOwnerDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const paymentMethods = await this.ownerService.archiveOwner(payload, user);
    return this.OKResponse(res, paymentMethods);
  }
}
