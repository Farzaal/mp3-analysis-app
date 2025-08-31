import { Response } from 'express';
import { IResponseJson } from '../contracts/interfaces/response.interface';
import { ResponseCode } from '../contracts/enums/response.code';
import { ResponseMessage } from '../contracts/enums/response.message';
export class BaseController {
  constructor() {}

  private getResponse = (res: Response, data: IResponseJson) => {
    return res.status(data.code).json(data);
  };

  protected CreatedResponse = (res: Response, data: any) => {
    return this.getResponse(res, {
      data: data,
      code: ResponseCode.CREATED,
      message: ResponseMessage.SUCCESS,
    });
  };

  protected OKResponse = (res: Response, data: any) => {
    return this.getResponse(res, {
      data: data,
      code: ResponseCode.OK,
      message: ResponseMessage.SUCCESS,
    });
  };

  protected UpdatedResponse() {}

  protected DeletedResponse() {}
}
