import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@/app/commons/base.controller';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { Response } from 'express';
import { User } from '@/app/decorators/user.decorator';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller()
export class DashboardController extends BaseController {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Owner,
      UserType.Vendor,
    ]),
  )
  @Get('dashboard')
  async getDashboard(@Res() res: Response, @User() user: JwtPayload) {
    const response = await this.dashboardService.getDashboard(user);

    return this.OKResponse(res, response);
  }
}
