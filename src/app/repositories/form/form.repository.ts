import { Injectable } from '@nestjs/common';
import { PostgresRepository } from '../postgresBase.repository';
import { DataSource } from 'typeorm';
import { FormSchemaModel } from '@/app/models/schema/formSchema.model';

@Injectable()
export class FormRepository extends PostgresRepository<FormSchemaModel> {
  constructor(dataSource: DataSource) {
    super(FormSchemaModel, dataSource);
  }
}
