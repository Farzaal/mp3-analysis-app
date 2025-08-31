import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
  Param,
  Put,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import {
  CreateEstimateDto,
  EstimateQueryDto,
  UpdateEstimateDto,
  VendorQuotationDto,
  UpdateVendorQuotationByFranchiseAdminDto,
  UpdateEstimateStatusDto,
  RejectQuotationDto,
  ArchiveEstimateDto,
  VendorEstimateDeclineDto,
} from './estimate.dto';
import { BaseController } from '../app/commons/base.controller';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EstimateService } from './estimate.service';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { User } from '@/app/decorators/user.decorator';
import { PaginationParam } from '@/app/commons/base.request';

@ApiTags('Estimate')
@ApiBearerAuth('JWT')
@Controller()
export class EstimateController extends BaseController {
  constructor(private estimateService: EstimateService) {
    super();
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Post('estimate')
  async create(
    @Body() payload: CreateEstimateDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.createEstimate(payload, user);
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.Owner,
      UserType.StandardAdmin,
    ]),
  )
  @Put('estimate')
  async updateEstimate(
    @Body() payload: UpdateEstimateDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.updateEstimate(user, payload);
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Post('estimate-quotation')
  async addVendorQuotation(
    @Body() payload: VendorQuotationDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const quote = await this.estimateService.addVendorQuotation(payload, user);
    return this.OKResponse(res, quote);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('estimate-quotation')
  async updateVendorQuotationByFranchiseAdmin(
    @Body() payload: UpdateVendorQuotationByFranchiseAdminDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const quote =
      await this.estimateService.updateVendorQuotationByFranchiseAdmin(
        payload,
        user,
      );
    return this.OKResponse(res, quote);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Put('estimate-status')
  async updateEstimateStatus(
    @Body() payload: UpdateEstimateStatusDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.updateEstimateStatus(
      payload,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('estimates')
  async getEstimates(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getEstimates(query, user);
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Get('estimate/vendor-assign')
  async getVendorAssignedJobs(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getVendorAssignedJobs(
      query,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
      UserType.Vendor,
    ]),
  )
  @Get('estimate/:estimate_id')
  async getEstimate(
    @Param('estimate_id') estimate_id: number,
    @Query() query: { vendor_id?: number },
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getEstimate(
      estimate_id,
      user,
      query?.vendor_id,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('estimate/quoted/vendor')
  async getVendorQuotesEstimates(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getVendorQuotedJobs(
      query,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Get('estimate/quoted/vendor-quoted')
  async getVendorQuotedEstimate(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getVendorQuotedEstimate(
      query,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Get('estimate/approval/quotations')
  async getQuotedEstimates(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getQuotedEstimates(query, user);
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Get('estimate/approval/estimates')
  async getOwnerApprovalEstimates(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getOwnerApprovalEstimates(
      query,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('estimate/owner/submitted')
  async getAllOwnerSubmittedEstimates(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate =
      await this.estimateService.getAllOwnerEstimatesSubmittedToOwner(
        query,
        user,
      );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
    ]),
  )
  @Get('estimate/get-quotations/:estimate_master_id')
  async getQuotationsForEstimate(
    @Param('estimate_master_id') estimate_master_id: number,
    @Query() query: { vendor_id?: number },
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getQuotationsForEstimate(
      estimate_master_id,
      user,
      query?.vendor_id,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('estimate/quotations/approved')
  async getApprovedQuotations(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getApprovedQuotations(
      query,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Put('estimate/quotation/reject')
  async rejectQuotation(
    @Body() payload: RejectQuotationDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.rejectQuotation(payload, user);
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Get('estimate-quote-status/:estimate_master_id')
  async estimateQuoteStatus(
    @Param('estimate_master_id') estimateMasterId: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.estimateQuoteStatus(
      estimateMasterId,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('estimate/quotation/rejected/:estimate_master_id/:vendor_id')
  async getRejectedQuotationById(
    @Param('estimate_master_id') estimate_master_id: number,
    @Param('vendor_id') vendor_id: number,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getRejectedQuotationById(
      estimate_master_id,
      vendor_id,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('estimate/quotation/approved/:estimate_master_id')
  async getApprovedQuotationById(
    @Param('estimate_master_id') estimate_master_id: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getApprovedQuotationById(
      estimate_master_id,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.FranchiseAdmin]))
  @Patch('archive')
  async archive(
    @Body() payload: ArchiveEstimateDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.archive(payload, user);
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Get('estimate-exists')
  async estimateExists(@User() user: JwtPayload, @Res() res: Response) {
    const estimate = await this.estimateService.estimateExists(user);
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('estimate-quotation/:estimateMasterId')
  async getEstimateQuotationsById(
    @Query() query: PaginationParam,
    @User() user: JwtPayload,
    @Param('estimateMasterId') estimateMasterId: number,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getEstimateQuotationsById(
      estimateMasterId,
      query,
      user,
    );
    return this.OKResponse(res, estimate);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('v2/estimates')
  async getEstimateV2(
    @Query() query: EstimateQueryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.getEstimateV2(query, user);
    return this.OKResponse(res, estimate);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Put('vendor-estimate-decline')
  async vendorEstimateDecline(
    @Body() payload: VendorEstimateDeclineDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const estimate = await this.estimateService.vendorEstimateDecline(
      payload,
      user,
    );
    return this.OKResponse(res, estimate);
  }
}
