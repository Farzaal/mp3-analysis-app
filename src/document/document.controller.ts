import { BaseController } from '@/app/commons/base.controller';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { AuthGuardFactory } from '@/app/guards/auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  CreateDocumentDto,
  EditDocumentDto,
  GetDocumentDto,
} from './document.dto';
import { DocumentService } from './document.service';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { User } from '@/app/decorators/user.decorator';

@ApiTags('Document')
@ApiBearerAuth('JWT')
@Controller()
export class DocumentController extends BaseController {
  constructor(private readonly documentService: DocumentService) {
    super();
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Post('document')
  async createDocument(
    @User() user: JwtPayload,
    @Body() payload: CreateDocumentDto,
    @Res() res: Response,
  ) {
    const userResponse = await this.documentService.createDocument(
      payload,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Put('document')
  async editDocument(
    @User() user: JwtPayload,
    @Body() payload: EditDocumentDto,
    @Res() res: Response,
  ) {
    const userResponse = await this.documentService.editDocument(payload, user);
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Delete('document/:documentId')
  async deleteDocument(
    @User() user: JwtPayload,
    @Param('documentId') documentId: number,
    @Res() res: Response,
  ) {
    const userResponse = await this.documentService.deleteDocument(
      documentId,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([
      UserType.FranchiseAdmin,
      UserType.StandardAdmin,
      UserType.Vendor,
      UserType.Owner,
    ]),
  )
  @Get('document')
  async getDocuments(
    @User() user: JwtPayload,
    @Query() queryParams: GetDocumentDto,
    @Res() res: Response,
  ) {
    const userResponse = await this.documentService.getDocument(
      queryParams,
      user,
    );
    return this.OKResponse(res, userResponse);
  }

  @UseGuards(
    AuthGuardFactory([UserType.FranchiseAdmin, UserType.StandardAdmin]),
  )
  @Get('document-details/:documentId')
  async getDocument(
    @User() user: JwtPayload,
    @Param('documentId') documentId: number,
    @Res() res: Response,
  ) {
    const userResponse = await this.documentService.getDocumentById(
      documentId,
      user,
    );
    return this.OKResponse(res, userResponse);
  }
}
