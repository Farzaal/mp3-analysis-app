import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  mixin,
  Type,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Request } from 'express';
import { UserType } from '../contracts/enums/usertype.enum';
import { JwtPayload } from '../contracts/types/jwtPayload.type';
import { UserRepository } from '../repositories/user/user.repository';
import { UserModel } from '../models/user/user.model';
import { OwnerProfileStatus } from '../contracts/enums/ownerProfile.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly roles: UserType[],
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) throw new UnauthorizedException(`Token not found.`);

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET_KEY'),
      });

      request['user'] = payload as JwtPayload;

      if (this.roles && !this.roles.includes(payload.user_type)) {
        throw new ForbiddenException(
          `You do not have permission to access this resource.`,
        );
      }

      const userModel: UserModel = await this.userRepository.findOne({
        where: {
          id: payload.id,
        },
      });

      if (
        userModel.user_type === UserType.Owner &&
        userModel.archived &&
        !payload.role_login
      )
        throw new UnauthorizedException(`Your account has been archived`);

      if (
        (payload.user_type === UserType.Owner && userModel.is_deleted) ||
        (payload.user_type === UserType.Vendor &&
          !userModel.is_approved &&
          Number(userModel.profile_completion_step) ===
            Number(OwnerProfileStatus.ProfileCompleted))
      )
        throw new UnauthorizedException(`Your account has been deactivated`);
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Session expired, please login again');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export function AuthGuardFactory(roles: UserType[]): Type<CanActivate> {
  class AuthGuardMixin extends AuthGuard {
    constructor(
      @Inject(JwtService) jwtService: JwtService,
      @Inject(ConfigService) configService: ConfigService,
      @Inject(DataSource) dataSource: DataSource,
    ) {
      const userRepository = new UserRepository(dataSource);
      super(jwtService, configService, userRepository, roles);
    }
  }

  return mixin(AuthGuardMixin);
}
