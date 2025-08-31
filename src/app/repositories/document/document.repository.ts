import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { DocumentModel } from '@/app/models/document/document.model';
import { GetDocumentDto } from '@/document/document.dto';
import { JwtPayload } from '@/app/contracts/types/jwtPayload.type';
import { IPaginationDBParams } from '@/app/contracts/interfaces/paginationDBParams.interface';
import { DocumentVisibility } from '@/app/contracts/enums/document.enum';
import { IPaginatedModelResponse } from '@/app/contracts/interfaces/paginatedModelResponse.interface';

@Injectable()
export class DocumentRepository extends PostgresRepository<DocumentModel> {
  constructor(dataSource: DataSource) {
    super(DocumentModel, dataSource);
  }

  async getDocumentsWithQueryBuilder(
    queryParams: GetDocumentDto,
    user: JwtPayload,
    paginationParams: IPaginationDBParams,
    visibility: DocumentVisibility[],
  ): Promise<IPaginatedModelResponse<DocumentModel>> {
    const queryBuilder = this.repository
      .createQueryBuilder('document')
      .where('document.franchise_id = :franchiseId', {
        franchiseId: Number(user.franchise_id),
      });

    if (visibility.length > 0) {
      queryBuilder.andWhere('document.visibility IN (:...visibility)', {
        visibility,
      });
    }

    if (queryParams.name) {
      queryBuilder.andWhere('document.name ILIKE :name', {
        name: `%${queryParams.name}%`,
      });
    }

    // Add sorting logic
    if (paginationParams?.sort_by && paginationParams?.sort_order) {
      let sortField = 'document.id';
      if (paginationParams.sort_by === 'created_at') {
        sortField = 'document.created_at';
      } else if (paginationParams.sort_by === 'name') {
        sortField = 'document.name';
      } else if (paginationParams.sort_by === 'visibility') {
        sortField = 'document.visibility';
      }
      queryBuilder.orderBy(
        sortField,
        paginationParams.sort_order === 'asc' ? 'ASC' : 'DESC',
      );
    } else {
      queryBuilder.orderBy('document.id', 'DESC');
    }

    queryBuilder.skip(paginationParams.offset).take(paginationParams.limit);

    const [data, count] = await queryBuilder.getManyAndCount();

    return { data, count };
  }
}
