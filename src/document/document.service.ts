import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateDocumentDto,
  EditDocumentDto,
  GetDocumentDto,
} from './document.dto';
import { DocumentRepository } from '@/app/repositories/document/document.repository';
import { DocumentModel } from '@/app/models/document/document.model';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { DocumentMessages } from './document.message';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { DocumentVisibility } from '@/app/contracts/enums/document.enum';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { GeneralHelper } from '@/app/utils/general.helper';
import { S3Service } from '@/app/commons/s3.service';
import { BunyanLogger } from '@/app/commons/logger.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly generalHelper: GeneralHelper,
    private readonly s3Service: S3Service,
    private readonly logger: BunyanLogger,
  ) {}

  async createDocument(
    payload: CreateDocumentDto,
    user: JwtPayload,
  ): Promise<DocumentModel> {
    const docModel = new DocumentModel();

    docModel.name = payload.name;
    docModel.document_url = payload.file;
    docModel.visibility = payload.visibility;
    docModel.franchise_id = Number(user.franchise_id);
    docModel.user_id =
      user.user_type === UserType.StandardAdmin
        ? Number(user.franchise_admin)
        : Number(user.id);

    return await this.documentRepository.save(docModel);
  }

  async deleteDocument(documentId: number, user: JwtPayload): Promise<boolean> {
    const documentModel: DocumentModel = await this.documentRepository.findOne({
      where: { id: documentId, franchise_id: Number(user.franchise_id) },
    });

    if (!documentModel)
      throw new BadRequestException(DocumentMessages.DOCUMENT_NOT_FOUND);

    await this.documentRepository.delete(
      { id: documentId, franchise_id: Number(user.franchise_id) },
      false,
    );

    return true;
  }

  async editDocument(
    payload: EditDocumentDto,
    user: JwtPayload,
  ): Promise<DocumentModel> {
    const docModel: DocumentModel = await this.documentRepository.findOne({
      where: {
        id: payload.document_id,
        franchise_id: Number(user.franchise_id),
      },
    });

    if (!docModel)
      throw new BadRequestException(DocumentMessages.DOCUMENT_NOT_FOUND);

    docModel.name = payload.name;
    docModel.document_url = payload.file;
    docModel.visibility = payload.visibility;
    docModel.franchise_id = Number(user.franchise_id);
    docModel.user_id =
      user.user_type === UserType.StandardAdmin
        ? Number(user.franchise_admin)
        : Number(user.id);

    return await this.documentRepository.save(docModel);
  }

  async getDownloadUrl(mediaUrl: string) {
    try {
      return await this.s3Service.getDownloadUrl(mediaUrl);
    } catch (err) {
      this.logger.error(`Download URL Issue == > ${JSON.stringify(err)}`);
      return null;
    }
  }

  async getDocument(
    queryParams: GetDocumentDto,
    user: JwtPayload,
  ): Promise<IPaginatedModelResponse<DocumentModel>> {
    const paginationParams: IPaginationDBParams =
      this.generalHelper.getPaginationOptionsV2(queryParams);

    // Calculate visibility based on user type
    let visibility: DocumentVisibility[] = [];
    if (user.user_type === UserType.Owner) {
      visibility = [
        DocumentVisibility.ShowOnboth,
        DocumentVisibility.ShowToOwner,
      ];
    } else if (user.user_type === UserType.Vendor) {
      visibility = [
        DocumentVisibility.ShowOnboth,
        DocumentVisibility.ShowToVendor,
      ];
    } else if (
      [UserType.FranchiseAdmin, UserType.StandardAdmin].includes(
        user.user_type,
      ) &&
      queryParams?.visibility
    ) {
      visibility = [queryParams.visibility];
    }

    const { data: rawData, count } =
      await this.documentRepository.getDocumentsWithQueryBuilder(
        queryParams,
        user,
        paginationParams,
        visibility,
      );

    const data: DocumentModel[] =
      rawData.length > 0
        ? await Promise.all(
            rawData.map(async (doc) => {
              doc.url = await this.getDownloadUrl(doc.document_url);
              return doc;
            }),
          )
        : [];

    return { data, count };
  }

  async getDocumentById(
    documentId: number,
    user: JwtPayload,
  ): Promise<DocumentModel> {
    const documentModel: DocumentModel = await this.documentRepository.findOne({
      where: { id: documentId, franchise_id: Number(user.franchise_id) },
    });

    if (!documentModel)
      throw new BadRequestException(DocumentMessages.DOCUMENT_NOT_FOUND);

    return documentModel;
  }
}
