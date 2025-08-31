import { BaseController } from '@/app/commons/base.controller';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import {
  Body,
  Controller,
  Post,
  Put,
  Res,
  UseGuards,
  Param,
  Delete,
  Get,
  Patch,
  Query,
} from '@nestjs/common';
import {
  CreateServiceRequestDto,
  EditServiceRequestDto,
  OwnerDiscrepancyApproval,
  ReleaseVendorDto,
  ServiceRequestQueryDto,
  ServiceRequestNotesDto,
  ServiceRequestNoteImageDto,
  ClaimServiceRequestDto,
  CalenderQueryDto,
  ServiceRequestArchiveDto,
  DrawerQueryDto,
  ServiceRequestReportedIssueDto,
  CancelServiceRequestDto,
  CreateGuestConciergeServiceRequestDto,
  ServiceRequestNoteDto,
  CreateChildServiceRequestDto,
} from './serviceRequest.dto';
import { ServiceRequestService } from './serviceRequest.service';
import { Response } from 'express';
import { User } from '@/app/decorators/user.decorator';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationParam } from '@/app/commons/base.request';

@ApiTags('Service Request')
@ApiBearerAuth('JWT')
@Controller()
export class ServiceRequestController extends BaseController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {
    super();
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Post('service-request')
  async createServiceRequest(
    @Body() payload: CreateServiceRequestDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const userResponse = await this.serviceRequestService.createServiceRequest(
      payload,
      user,
      payload?.is_guest,
      payload?.is_discrepancy,
      null,
      payload?.is_child,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Put('service-request')
  async editServiceRequest(
    @Body() payload: EditServiceRequestDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const userResponse = await this.serviceRequestService.editServiceRequestV2(
      payload,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Post('service-request/discrepancy')
  async createDiscrepancyRequest(
    @Body() payload: CreateServiceRequestDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const userResponse = await this.serviceRequestService.createServiceRequest(
      payload,
      user,
      false,
      true,
      null,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Post('service-request-child')
  async createChildRequest(
    @Body() payload: CreateChildServiceRequestDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const userResponse =
      await this.serviceRequestService.createChildServiceRequest(payload, user);
    return this.OKResponse(res, userResponse);
  }

  @Post('guest-service-request')
  async createGuestServiceRequest(
    @Body() payload: CreateServiceRequestDto,
    @Res() res: Response,
  ) {
    const userResponse = await this.serviceRequestService.createServiceRequest(
      payload,
      null,
      true,
      false,
      null,
    );
    return this.OKResponse(res, userResponse);
  }

  @Post('guest-concierge-service-request')
  async createGuestConciergeServiceRequest(
    @Body() payload: CreateGuestConciergeServiceRequestDto,
    @Res() res: Response,
  ) {
    const userResponse =
      await this.serviceRequestService.createGuestConciergeServiceRequest(
        payload,
      );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Patch('service-request/claim')
  async claimServiceRequest(
    @Body() payload: ClaimServiceRequestDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const serviceResponse =
      await this.serviceRequestService.claimServiceRequest(payload, user);
    return this.OKResponse(res, serviceResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Delete('service-request/:service_request_id')
  async deleteServiceRequest(
    @Param('service_request_id') service_request_id: number,
    @User() user: JwtPayload,
    @Body() payload: CancelServiceRequestDto,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.deleteServiceRequest(
        service_request_id,
        user,
        payload,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('service-request')
  async getAllServiceRequest(
    @Query() query: ServiceRequestQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getAllServiceRequests(query, user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Get('service-request-uninvoiced')
  async getUninvoicedServiceRequest(
    @Query() query: ServiceRequestQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getUninvoicedServiceRequest(query, user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('reported-issues/:service_request_id')
  async getReportedIssues(
    @Param('service_request_id') service_request_id: number,
    @Query() query: PaginationParam,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getReportedIssues(
        query,
        service_request_id,
        user,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('service-request/:service_request_id')
  async getServiceRequest(
    @Param('service_request_id') service_request_id: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getServiceRequest(
        service_request_id,
        user,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Patch('service-request/release-vendor')
  async releaseVendor(
    @Body() payload: ReleaseVendorDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.releaseVendorFromServiceRequest(
        payload,
        user,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.StandardAdmin,
      UserType.FranchiseAdmin,
    ]),
  )
  @Patch('service-request-approval')
  async approveDiscrepancyOrGuestRequestByOwner(
    @Body() payload: OwnerDiscrepancyApproval,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.approveDiscrepancyOrGuestRequestByOwner(
        payload,
        user,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
    ]),
  )
  @Put('service-request-notes')
  async serviceRequestNotes(
    @Body() payload: ServiceRequestNotesDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.serviceRequestNotes(payload, user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('note')
  async updateServiceRequestNote(
    @Body() payload: ServiceRequestNoteDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.updateServiceRequestNote(payload, user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
    ]),
  )
  @Put('service-request-note-image')
  async serviceRequestNoteImage(
    @Body() payload: ServiceRequestNoteImageDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.serviceRequestNoteImage(payload, user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('calender')
  async getCalenderData(
    @Query() query: CalenderQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getCalenderData(query, user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Patch('service-request-archive')
  async serviceRequestArchive(
    @Body() payload: ServiceRequestArchiveDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.serviceRequestArchive(payload, user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Get('service-request-exist')
  async serviceRequestExist(@User() user: JwtPayload, @Res() res: Response) {
    const serviceRequestResponse =
      await this.serviceRequestService.serviceRequestExist(user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('drawer')
  async getDrawerData(
    @Query() query: DrawerQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getDrawerData(query, user);
    return this.OKResponse(res, serviceRequestResponse);
  }

  @Get('logic')
  async recurringServiceRequest(@Res() res: Response) {
    const data =
      await this.serviceRequestService.serviceRequestRecurringLogic();
    return this.OKResponse(res, data);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('reported-issue')
  async serviceRequestReportedIssue(
    @Body() payload: ServiceRequestReportedIssueDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.serviceRequestReportedIssue(
        payload,
        user,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('service-request-media/:service_request_id')
  async getServiceRequestImages(
    @Param('service_request_id') service_request_id: number,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getServiceRequestMedia(
        service_request_id,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Get('service-request-hourly-rates/:service_request_id')
  async getServiceRequestHourlyRate(
    @Param('service_request_id') service_request_id: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getServiceRequestHourlyRate(
        service_request_id,
        user,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('concierge-service-request')
  async getAllConciergeServiceRequest(
    @Query() query: ServiceRequestQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const serviceRequestResponse =
      await this.serviceRequestService.getGuestConciergeServiceRequests(
        query,
        user,
      );
    return this.OKResponse(res, serviceRequestResponse);
  }
}
