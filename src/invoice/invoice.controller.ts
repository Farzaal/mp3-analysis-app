import {
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  Body,
  Patch,
} from '@nestjs/common';
import { BaseController } from '@/app/commons/base.controller';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import {
  CreateInvoiceV2,
  GetAllInvoicesDtoV2,
  ProcessPaymentDto,
  UpdateInvoiceStatusDto,
  UpdateInvoiceV2,
  UpdateWorkDescriptionDto,
  UpsertInvoicePaymentDetailsDto,
} from './invoice.dto';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { User } from '@/app/decorators/user.decorator';
import { InvoiceService } from './invoice.service';
import { Response } from 'express';

@ApiTags('Invoice')
@ApiBearerAuth('JWT')
@Controller()
export class InvoiceController extends BaseController {
  constructor(private invoiceService: InvoiceService) {
    super();
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
    ]),
  )
  @Get('invoice')
  async getInvoices(
    @Query() payload: GetAllInvoicesDtoV2,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const getInvoicesResponse = await this.invoiceService.getAllInvoices(
      payload,
      user,
    );

    return this.OKResponse(res, getInvoicesResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Post('invoice')
  async createInvoice(
    @Body() payload: CreateInvoiceV2,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const getInvoicesResponse = await this.invoiceService.createInvoice(
      payload,
      user,
    );

    return this.OKResponse(res, getInvoicesResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Put('invoice')
  async updateInvoice(
    @Body() payload: UpdateInvoiceV2,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const getInvoicesResponse = await this.invoiceService.updateInvoice(
      payload,
      user,
    );

    return this.OKResponse(res, getInvoicesResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Vendor,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
    ]),
  )
  @Get('invoice/:invoice_master_id')
  async getInvoice(
    @Param('invoice_master_id') invoice_master_id: string,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const getInvoicesResponse = await this.invoiceService.getInvoice(
      Number(invoice_master_id),
      user,
    );

    return this.OKResponse(res, getInvoicesResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('invoice/payment-details')
  async upsertInvoicePaymentDetails(
    @Body() payload: UpsertInvoicePaymentDetailsDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const getInvoicesResponse =
      await this.invoiceService.upsertInvoicePaymentDetails(payload, user);

    return this.OKResponse(res, getInvoicesResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor, UserType.Owner]))
  @Get('invoice-due')
  async getTotalDue(@User() user: JwtPayload, @Res() res: Response) {
    const getTotalDueResponse = await this.invoiceService.getTotalDue(user);
    return this.OKResponse(res, getTotalDueResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Patch('invoice/status')
  async updateInvoiceStatus(
    @Body() payload: UpdateInvoiceStatusDto,
    @Res() res: Response,
  ) {
    const getInvoiceStatusResponse =
      await this.invoiceService.updateInvoiceStatus(payload);
    return this.OKResponse(res, getInvoiceStatusResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Put('invoice-pay')
  async processPayment(
    @Body() payload: ProcessPaymentDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const getInvoiceStatusResponse = await this.invoiceService.invoicePay(
      payload,
      user,
    );
    return this.OKResponse(res, getInvoiceStatusResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Get('invoice-remaining-balance')
  async getTotalRemainingBalance(
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const getTotalRemainingBalanceResponse =
      await this.invoiceService.getTotalRemainingBalance(user);
    return this.OKResponse(res, getTotalRemainingBalanceResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('franchise-work-description')
  async updateWorkDescription(
    @User() user: JwtPayload,
    @Body() payload: UpdateWorkDescriptionDto,
    @Res() res: Response,
  ) {
    const response = await this.invoiceService.updateFranchiseWorkDescription(
      payload,
      user,
    );
    return this.OKResponse(res, response);
  }

  @UseGuards(AuthGuardFactory([UserType.Vendor]))
  @Get('material-items/:service_request_id')
  async getMaterialItems(
    @Param('service_request_id') service_request_id: number,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const response = await this.invoiceService.getMaterialItems(
      service_request_id,
      user,
    );
    return this.OKResponse(res, response);
  }
}
