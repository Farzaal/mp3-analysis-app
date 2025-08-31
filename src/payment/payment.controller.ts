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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { User } from '@/app/decorators/user.decorator';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import {
  AssociatePropertyPaymentMethodDto,
  GetConciergePublishableKeyDto,
  GetMembershipTransactionDto,
  MembershipPaymentRetryDto,
  SavePaymentMethodDto,
  SetupPaymentMethodDto,
} from './payment.dto';
import { BaseController } from '@/app/commons/base.controller';
import { Response } from 'express';
import { StripeWebhookProcessor } from './stripeWebhookProcessor.service';
import { CreateMembershipDto } from '@/properties/property.dto';

@ApiTags('Payment Method Setup')
@ApiBearerAuth('JWT')
@Controller()
export class PaymentController extends BaseController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeWebhookProcessor: StripeWebhookProcessor,
  ) {
    super();
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Post('setup-payment-method')
  async setupPaymentMethod(
    @User() user: JwtPayload,
    @Body() setupPaymentMethodDto: SetupPaymentMethodDto,
    @Res() res: Response,
  ) {
    const paymentResponse = await this.paymentService.setupPaymentMethod(
      setupPaymentMethodDto,
      user,
    );
    return this.OKResponse(res, paymentResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Post('save-payment-method')
  async savePaymentMethodSetup(
    @User() user: JwtPayload,
    @Body() savePaymentMethodDto: SavePaymentMethodDto,
    @Res() res: Response,
  ) {
    const paymentResponse = await this.paymentService.savePaymentMethod(
      savePaymentMethodDto,
      user,
    );
    return this.OKResponse(res, paymentResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Delete('payment-method/:paymentMethodId')
  async deletePaymentMethod(
    @User() user: JwtPayload,
    @Param('paymentMethodId') paymentMethodId: number,
    @Res() res: Response,
  ) {
    const userResponse = await this.paymentService.deletePaymentMethod(
      paymentMethodId,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Put('payment-method/:paymentMethodId')
  async setPaymentMethodAsDefault(
    @User() user: JwtPayload,
    @Param('paymentMethodId') paymentMethodId: number,
    @Res() res: Response,
  ) {
    const userResponse = await this.paymentService.setPaymentMethodAsDefault(
      paymentMethodId,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(AuthGuardFactory([UserType.Owner]))
  @Put('property-payment-method')
  async associatePropertyPaymentMethod(
    @User() user: JwtPayload,
    @Body() payload: AssociatePropertyPaymentMethodDto,
    @Res() res: Response,
  ) {
    const paymentResponse =
      await this.paymentService.associatePropertyPaymentMethod(payload, user);
    return this.OKResponse(res, paymentResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.SuperAdmin,
    ]),
  )
  @Get('publishable-key')
  async getPaymentPublishableKey(
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const paymentResponse = await this.paymentService.getPublishableKey(
      Number(user.franchise_id),
    );
    return this.OKResponse(res, paymentResponse);
  }

  @Get('concierge-publishable-key')
  async getConciergePublishableKey(
    @Query() query: GetConciergePublishableKeyDto,
    @Res() res: Response,
  ) {
    const paymentResponse = await this.paymentService.getPublishableKey(
      query.franchise_id,
    );
    return this.OKResponse(res, paymentResponse);
  }

  @Post('payment-webhooks')
  async paymentWebhooks(@Body() payload: any, @Res() res: Response) {
    await this.stripeWebhookProcessor.process(payload);
    return this.OKResponse(res, true);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Get('membership-transaction')
  async getMembershipTransactions(
    @Query() query: GetMembershipTransactionDto,
    @Res() res: Response,
  ) {
    const paymentResponse =
      await this.paymentService.getMembershipTransaction(query);
    return this.OKResponse(res, paymentResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Post('membership-payment-retry')
  async membershipPaymentRetry(
    @Body() payload: MembershipPaymentRetryDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const paymentResponse = await this.paymentService.membershipPaymentRetry(
      payload,
      user,
    );
    return this.OKResponse(res, paymentResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('membership')
  async createMembership(
    @Body() payload: CreateMembershipDto,
    @User() user: JwtPayload,
    @Res() res: Response,
  ) {
    const membershipResponse =
      await this.paymentService.createOrUpdateMembership(payload, user);
    return this.OKResponse(res, membershipResponse);
  }
}
