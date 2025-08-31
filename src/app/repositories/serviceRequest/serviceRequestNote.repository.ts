import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { ServiceRequestNoteModel } from '@/app/models/serviceRequest/serviceRequestNote.model';

@Injectable()
export class ServiceRequestNoteRepository extends PostgresRepository<ServiceRequestNoteModel> {
  constructor(dataSource: DataSource) {
    super(ServiceRequestNoteModel, dataSource);
  }
}
