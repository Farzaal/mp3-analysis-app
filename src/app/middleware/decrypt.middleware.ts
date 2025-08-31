import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { EncryptionHelper } from '../utils/encryption.helper';
import { BunyanLogger } from '../commons/logger.service';

@Injectable()
export class DecryptMiddleware implements NestMiddleware {
  constructor(
    private readonly encryptionHelper: EncryptionHelper,
    private readonly logger: BunyanLogger,
  ) {}

  use(req: any, _res: any, next: () => void) {
    if (!req?.body?.payload)
      throw new BadRequestException('Payload is required.');

    try {
      const encryptedPayload = req.body.payload;
      const decryptedPayload =
        req.body?.client === 'wordpress'
          ? this.encryptionHelper.decryptWpPayload(encryptedPayload)
          : this.encryptionHelper.decrypt(encryptedPayload);

      if (!decryptedPayload) {
        throw new BadRequestException('Invalid attempt');
      }

      req.body = JSON.parse(decryptedPayload);
      next();
    } catch (error: unknown) {
      if (error instanceof Error) this.logger.error(error.message);
      throw new BadRequestException('Invalid or corrupted payload.');
    }
  }
}
