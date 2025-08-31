import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../contracts/types/jwtPayload.type';

export const User = createParamDecorator(
  (_data: string | undefined, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
