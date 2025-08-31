import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  LoginUserDto,
  CreateSuperAdminDto,
  RoleLoginDto,
  VerifyEmailDto,
  ResetPasswordDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { BaseController } from '../app/commons/base.controller';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { User } from '@/app/decorators/user.decorator';

@ApiTags('Auth')
@ApiBearerAuth('JWT')
@Controller()
export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  @UseGuards(AuthGuardFactory([UserType.SuperAdmin]))
  @Post('auth/super-admin')
  async createSuperAdmin(
    @Body() payload: CreateSuperAdminDto,
    @Res() res: Response,
  ) {
    const userResponse = await this.authService.createSuperAdmin(payload);
    return this.OKResponse(res, userResponse);
  }

  @Post('auth/login')
  async login(@Body() credentials: LoginUserDto, @Res() res: Response) {
    const user = await this.authService.login(credentials);
    return this.OKResponse(res, user);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
    ]),
  )
  @Post('auth/role/login')
  async roleLogin(
    @Body() body: RoleLoginDto,
    @Res() res: Response,
    @User() user: JwtPayload,
  ) {
    const roleUser = await this.authService.roleLogin(body, user);
    return this.OKResponse(res, roleUser);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.SuperAdmin,
      UserType.Owner,
      UserType.FranchiseAdmin,
      UserType.Vendor,
      UserType.StandardAdmin,
    ]),
  )
  @Get('auth/me')
  async getAuthUser(@Res() res: Response, @User() user: JwtPayload) {
    const authUser = await this.authService.getAuthUser(user);
    return this.OKResponse(res, authUser);
  }

  @Post('auth/verify-email')
  async verifyEmail(@Body() payload: VerifyEmailDto, @Res() res: Response) {
    const authUser = await this.authService.verifyEmail(payload);
    return this.OKResponse(res, authUser);
  }

  @Post('auth/reset-password')
  async verifyToken(@Body() payload: ResetPasswordDto, @Res() res: Response) {
    const authUser = await this.authService.verifyToken(payload);
    return this.OKResponse(res, authUser);
  }
}
