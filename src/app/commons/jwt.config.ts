// src/auth/jwt.config.ts
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConstants = {
  secret: 'your_jwt_secret', // Use a more secure secret in production
};

export const jwtConfig: JwtModuleOptions = {
  secret: jwtConstants.secret,
  signOptions: {
    expiresIn: '60m',
  },
};
