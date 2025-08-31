import { Injectable } from '@nestjs/common';
import * as bunyan from 'bunyan';

@Injectable()
export class BunyanLogger {
  private readonly logger: bunyan;
  constructor() {
    this.logger = bunyan.createLogger({ name: 'We-Oversee-Logger' });
  }

  log(message: any, ...params: any[]) {
    this.logger.info(message, ...params);
  }

  debug(message: any, ...params: any[]) {
    this.logger.debug(message, ...params);
  }

  warn(message: any, ...params: any[]) {
    this.logger.warn(message, ...params);
  }

  error(message: any, ...params: any[]) {
    this.logger.error(message, ...params);
  }

  fatal(message: any, ...params: any[]) {
    this.logger.fatal(message, ...params);
  }
}
