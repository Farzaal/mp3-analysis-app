import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): Record<string, boolean> {
    return { success: true };
  }
}
