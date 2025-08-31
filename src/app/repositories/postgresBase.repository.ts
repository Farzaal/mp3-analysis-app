import { BaseRepository } from './base.repository';
import { DataSource, ObjectType } from 'typeorm';
import { BaseModel } from '../models/base.model';

export abstract class PostgresRepository<
  T extends BaseModel,
> extends BaseRepository<T> {
  constructor(model: ObjectType<T>, dataSource: DataSource) {
    super(model, dataSource);
    this.setRepo();
  }
}
