import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CreateGuestConciergeCategoryDto,
  CreateGuestConciergeServiceDto,
  CreateOrUpdateServiceTypeCategoryDto,
  CreateServiceTypeDto,
  GetGuestConciergeCategoryDto,
  GetGuestConciergeServiceDto,
  GetGuestServiceTypeDto,
  GetServiceTypeDto,
  GetServiceTypeImagesDto,
  HandymanConciergeRatesDto,
  ServiceTypeStatusDto,
  UpsertPropertyServiceTypeRatesDto,
  UpdateGuestConciergeServiceDto,
  UpdateServiceTypeCategoryStatusDto,
  UpdateServiceTypeDto,
  UpdateServiceTypeStatusDto,
} from './serviceType.dto';
import { ServiceTypeService } from './serviceType.service';
import { BaseController } from '../app/commons/base.controller';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { JwtPayload } from './../app/contracts/types/jwtPayload.type';
import { User } from '@/app/decorators/user.decorator';
import { PaginationParam } from '@/app/commons/base.request';

@ApiTags('Service Type')
@ApiBearerAuth('JWT')
@Controller()
export class ServiceTypeController extends BaseController {
  constructor(private serviceTypeService: ServiceTypeService) {
    super();
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Post('service-type-category')
  async createServiceTypeCategory(
    @Body() payload: CreateOrUpdateServiceTypeCategoryDto,
    @Res() res: Response,
  ) {
    const serviceType =
      await this.serviceTypeService.createOrUpdateServiceTypeCategory(payload);
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Post('request-service-type-category')
  async requestServiceTypeCategory(
    @Body() payload: CreateOrUpdateServiceTypeCategoryDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const serviceType =
      await this.serviceTypeService.requestServiceTypeCategory(payload, user);
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Post('request-service-type')
  async requestServiceType(
    @Body() payload: CreateServiceTypeDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const serviceType = await this.serviceTypeService.requestServiceType(
      payload,
      user,
    );
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Put('request-service-type-status')
  async requestServiceTypeApproval(
    @Body() payload: ServiceTypeStatusDto,
    @Res() res: Response,
  ) {
    const serviceType =
      await this.serviceTypeService.requestServiceTypeApproval(payload);
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('handyman-concierge-rates')
  async handymanConciergeRates(
    @User() user: JwtPayload,
    @Body() payload: HandymanConciergeRatesDto,
    @Res() res: Response,
  ) {
    const serviceType = await this.serviceTypeService.handymanConciergeRates(
      payload,
      user,
    );
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Get('request-service-type')
  async getRequestServiceType(
    @Query() query: PaginationParam,
    @Res() res: Response,
  ) {
    const serviceType =
      await this.serviceTypeService.getRequestServiceType(query);
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Guest,
      UserType.Vendor,
      UserType.Owner,
    ]),
  )
  @Get('service-type-category')
  async getServiceTypeCategory(@Res() res: Response) {
    const serviceType = await this.serviceTypeService.getAllServiceCategories();
    return this.OKResponse(res, serviceType);
  }

  @Get('site-service-type/:franchiseId')
  async getServiceTypeForWordpress(
    @Param('franchiseId') franchiseId: number,
    @Res() res: Response,
  ) {
    const serviceType =
      await this.serviceTypeService.getServiceTypeForWordpress(franchiseId);
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Put('service-type-category/:serviceTypeCategoryId')
  async updateServiceTypeCategory(
    @Param('serviceTypeCategoryId') serviceTypeCategoryId: number,
    @Body() payload: CreateOrUpdateServiceTypeCategoryDto,
    @Res() res: Response,
  ) {
    const serviceType =
      await this.serviceTypeService.createOrUpdateServiceTypeCategory(
        payload,
        serviceTypeCategoryId,
      );
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Delete('service-type-category/:serviceTypeCategoryId')
  async deleteServiceTypeCategory(
    @Param('serviceTypeCategoryId') serviceTypeCategoryId: number,
    @Res() res: Response,
  ) {
    const serviceTypes =
      await this.serviceTypeService.deleteServiceTypeCategory(
        serviceTypeCategoryId,
      );
    return this.OKResponse(res, serviceTypes);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Delete('service-type/:serviceTypeId')
  async deleteServiceType(
    @Param('serviceTypeId') serviceTypeId: number,
    @Res() res: Response,
  ) {
    const serviceTypes =
      await this.serviceTypeService.deleteServiceType(serviceTypeId);
    return this.OKResponse(res, serviceTypes);
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Post('service-type')
  async createServiceType(
    @User() user: JwtPayload,
    @Body() payload: CreateServiceTypeDto,
    @Res() res: Response,
  ) {
    const serviceType = await this.serviceTypeService.createOrUpdateServiceType(
      payload,
      user,
    );
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Put('service-type')
  async updateServiceType(
    @User() user: JwtPayload,
    @Body() payload: UpdateServiceTypeDto,
    @Res() res: Response,
  ) {
    const serviceType = await this.serviceTypeService.createOrUpdateServiceType(
      payload,
      user,
    );
    return this.OKResponse(res, serviceType);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('property-service-type-rates')
  async updatePropertyServiceTypeRates(
    @User() user: JwtPayload,
    @Body() payload: UpsertPropertyServiceTypeRatesDto,
    @Res() res: Response,
  ) {
    const serviceTypeRates =
      await this.serviceTypeService.upsertPropertyServiceTypeRates(
        payload,
        user,
      );
    return this.OKResponse(res, serviceTypeRates);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('property-service-type-rates/:propertyMasterId')
  async getPropertyServiceTypeRates(
    @User() user: JwtPayload,
    @Param('propertyMasterId') propertyMasterId: number,
    @Res() res: Response,
  ) {
    const serviceTypeRates =
      await this.serviceTypeService.getPropertyServiceTypeRates(
        propertyMasterId,
        user,
      );
    return this.OKResponse(res, serviceTypeRates);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('service-type-category-status')
  async updateServieTypeCategoryStatus(
    @User() user: JwtPayload,
    @Body() payload: UpdateServiceTypeCategoryStatusDto,
    @Res() res: Response,
  ) {
    const serviceTypeRates =
      await this.serviceTypeService.updateServiceTypeCategoryStatus(
        payload,
        user,
      );
    return this.OKResponse(res, serviceTypeRates);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('service-type-status')
  async updateServiceTypeStatus(
    @User() user: JwtPayload,
    @Body() payload: UpdateServiceTypeStatusDto,
    @Res() res: Response,
  ) {
    const serviceTypeRates =
      await this.serviceTypeService.updateServiceTypeStatus(payload, user);
    return this.OKResponse(res, serviceTypeRates);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
      UserType.Owner,
    ]),
  )
  @Get('service-type')
  async getServiceTypes(
    @Query() query: GetServiceTypeDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceTypes = await this.serviceTypeService.getServiceTypes(
      user,
      query,
    );
    return this.OKResponse(res, serviceTypes);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('service-type/:serviceTypeId')
  async getServiceTypeById(
    @User() user: JwtPayload,
    @Param('serviceTypeId') serviceTypeId: number,
    @Res() res: Response,
  ) {
    const serviceTypes = await this.serviceTypeService.getServiceTypeById(
      user,
      serviceTypeId,
    );
    return this.OKResponse(res, serviceTypes);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
      UserType.Owner,
    ]),
  )
  @Get('franchise-service-type')
  async getFranchiseServiceType(
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceTypes =
      await this.serviceTypeService.getFranchiseServiceType(user);
    return this.OKResponse(res, serviceTypes);
  }

  @Get('franchise-guest-info')
  async getFranchiseGuestServiceType(
    @Query() query: GetGuestServiceTypeDto,
    @Res() res: Response,
  ) {
    const serviceTypes =
      await this.serviceTypeService.getFranchiseGuestServiceType(query);
    return this.OKResponse(res, serviceTypes);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('franchise-service-type/preferred-vendor')
  async getVendorsFranchiseServiceType(
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceTypes =
      await this.serviceTypeService.getVendorsFranchiseServiceType(user);
    return this.OKResponse(res, serviceTypes);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Post('guest-concierge-category')
  async createGuestConciergeCategory(
    @Body() payload: CreateGuestConciergeCategoryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const guestConciergeCategory =
      await this.serviceTypeService.createGuestConciergeCategory(payload, user);
    return this.OKResponse(res, guestConciergeCategory);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Post('guest-concierge-service')
  async createGuestConciergeService(
    @Body() payload: CreateGuestConciergeServiceDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const guestConciergeService =
      await this.serviceTypeService.createGuestConciergeService(payload, user);
    return this.OKResponse(res, guestConciergeService);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('guest-concierge-category/:categoryId')
  async updateGuestConciergeCategory(
    @Param('categoryId') categoryId: number,
    @Body() payload: CreateGuestConciergeCategoryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const guestConciergeCategory =
      await this.serviceTypeService.createGuestConciergeCategory(
        payload,
        user,
        categoryId,
      );
    return this.OKResponse(res, guestConciergeCategory);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('guest-concierge-service/:serviceTypeId')
  async updateGuestConciergeService(
    @Param('serviceTypeId') serviceTypeId: number,
    @Body() payload: UpdateGuestConciergeServiceDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const guestConciergeService =
      await this.serviceTypeService.updateGuestConciergeService(
        payload,
        user,
        serviceTypeId,
      );
    return this.OKResponse(res, guestConciergeService);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('franchise-concierge-services')
  async getGuestConciergeServices(
    @Query() query: GetServiceTypeDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const guestConciergeServices =
      await this.serviceTypeService.getGuestConciergeServices(user, query);
    return this.OKResponse(res, guestConciergeServices);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('service-type-images')
  async serviceTypeImages(
    @Query() query: GetServiceTypeImagesDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const images = await this.serviceTypeService.getServiceTypeImages(
      query,
      user,
    );
    return this.OKResponse(res, images);
  }

  @Get('guest-concierge-category')
  async getGuestConciergeCategory(
    @Query() query: GetGuestConciergeCategoryDto,
    @Res() res: Response,
  ) {
    const guestConciergeCategories =
      await this.serviceTypeService.getGuestConciergeCategories(query);
    return this.OKResponse(res, guestConciergeCategories);
  }

  @Get('guest-concierge-service')
  async getGuestConciergeService(
    @Query() query: GetGuestConciergeServiceDto,
    @Res() res: Response,
  ) {
    const guestConciergeServices =
      await this.serviceTypeService.guestConciergeServiceTypes(query);
    return this.OKResponse(res, guestConciergeServices);
  }

  @Get('guest-concierge-service/:serviceTypeSlug')
  async getGuestConciergeServiceById(
    @Param('serviceTypeSlug') serviceTypeSlug: string,
    @Res() res: Response,
  ) {
    const guestConciergeService =
      await this.serviceTypeService.getGuestConciergeServiceById(
        serviceTypeSlug,
      );
    return this.OKResponse(res, guestConciergeService);
  }
}
