import { Request, Response, NextFunction } from 'express';
import { BunyanLogger } from '../commons/logger.service';

export function logRequestsMiddleware(logger: BunyanLogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { method, url, body, query, headers } = req;
    const startTime = Date.now();

    const logObject = {
      method,
      url,
      body,
      query,
      headers: {
        'user-agent': headers['user-agent'],
        referer: headers.referer,
      },
      timestamp: new Date().toISOString(),
      clientIp: req.ip || req.connection.remoteAddress,
    };

    logger.log(logObject, 'Incoming request');

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const responseLogObject = {
        method,
        url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };
      logger.log(responseLogObject, 'Response sent');
    });

    next();
  };
}
