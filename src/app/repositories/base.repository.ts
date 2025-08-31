import {
  Repository,
  DataSource,
  In,
  IsNull,
  ObjectType,
  UpdateResult,
  DeleteResult,
  FindManyOptions,
  FindOptionsWhere,
  FindOptionsOrder,
} from 'typeorm';
import { BaseModel } from '../models/base.model';
import { IPaginationDBParams } from '../contracts/interfaces/paginationDBParams.interface';
import { InjectDataSource } from '@nestjs/typeorm';

export abstract class BaseRepository<T extends BaseModel> {
  protected repository: Repository<T>;
  protected model: ObjectType<T>;
  protected dataSource: DataSource;
  protected defaultOrderByColumn = 'created_at';
  protected defaultOrderByDirection = 'ASC';
  protected primaryColumnKey = 'id';

  constructor(
    model: ObjectType<T>,
    @InjectDataSource() dataSource: DataSource,
  ) {
    this.model = model;
    this.dataSource = dataSource;
    this.setRepo();
  }

  protected setRepo(): void {
    this.repository = this.dataSource.getRepository(this.model);
  }

  protected applyPagination(
    whereParams: FindManyOptions<T>,
    options?: IPaginationDBParams,
  ): FindManyOptions<T> {
    if (options && options.limit !== -1) {
      whereParams.take = options.limit;
      whereParams.skip = options.offset;
    }
    return whereParams;
  }

  protected getPrimaryColumnKey(): string {
    return this.primaryColumnKey;
  }

  protected getPrimaryColumnValue(val: string): string {
    return val;
  }

  protected inOperator(val: string[]): any {
    return In(val);
  }

  protected prepareParams(
    whereParams: Record<string, any>,
  ): FindOptionsWhere<T> {
    const whereClauses: Record<string, any> = {};
    for (const key in whereParams) {
      let val = whereParams[key];
      if (Array.isArray(val)) {
        val = this.inOperator(val);
      } else if (val === null) {
        val = IsNull();
      }
      whereClauses[key] = val;
    }
    whereClauses['is_deleted'] = 0;

    return whereClauses as FindOptionsWhere<T>;
  }

  protected applyRelations(
    param: FindManyOptions<T>,
    relations?: string[],
  ): FindManyOptions<T> {
    if (!relations) {
      return param;
    }
    param.relations = relations;
    return param;
  }

  protected applyOrder(
    whereParams: FindManyOptions<T>,
    orderOptions?: { Column: keyof T; Direction: 'ASC' | 'DESC' },
  ): FindManyOptions<T> {
    const defaultColumn: keyof T = this.defaultOrderByColumn as keyof T;
    const defaultDirection: 'ASC' | 'DESC' = this.defaultOrderByDirection as
      | 'ASC'
      | 'DESC';

    const column: keyof T = orderOptions?.Column || defaultColumn;
    const direction: 'ASC' | 'DESC' =
      orderOptions?.Direction || defaultDirection;

    if (!whereParams.order) {
      whereParams.order = {} as FindOptionsOrder<T>;
    }

    (whereParams.order as any)[column] = direction;

    return whereParams;
  }

  public create(instance: Partial<T>): T {
    return this.repository.create(instance as T);
  }

  public async createAll(instance: Partial<T>[]): Promise<T[]> {
    return await this.saveAll(instance as T[]);
  }

  public async findOne(params?: FindManyOptions<T>): Promise<T | null> {
    return await this.repository.findOne(params as FindManyOptions<T>);
  }

  public async find(
    whereParams: FindOptionsWhere<T>,
    options?: IPaginationDBParams,
    relations?: string[],
    orderOptions?: { Column: keyof T; Direction: 'ASC' | 'DESC' },
  ): Promise<T[]> {
    let params: FindManyOptions<T> = {
      where: this.prepareParams(whereParams),
    };

    params = this.applyPagination(params, options);
    params = this.applyOrder(params, orderOptions);
    params = this.applyRelations(params, relations);
    return await this.repository.find(params);
  }

  public async count(
    whereParams: FindOptionsWhere<T>,
    relations?: string[],
  ): Promise<number> {
    let params: FindManyOptions<T> = {
      where: this.prepareParams(whereParams),
    };

    params = this.applyRelations(params, relations);

    return await this.repository.count(params);
  }

  public async findAndCount(
    whereParams: FindOptionsWhere<T>,
    options?: IPaginationDBParams,
    relations?: string[],
  ): Promise<[T[], number]> {
    let params: FindManyOptions<T> = {
      where: this.prepareParams(whereParams),
    };
    params = this.applyPagination(params, options);
    params = this.applyOrder(params);
    params = this.applyRelations(params, relations);

    return await this.repository.findAndCount(params as FindManyOptions<T>);
  }

  public async getAll(options?: IPaginationDBParams): Promise<T[]> {
    let params: FindManyOptions<T> = {};

    params = this.applyPagination(params, options);
    params = this.applyOrder(params);
    return await this.repository.find(params);
  }

  public async where(whereParams: FindOptionsWhere<T>): Promise<T[]> {
    return await this.repository.find({ where: whereParams });
  }

  public async save(instance: T): Promise<T> {
    return (await this.repository.save(instance)) as T;
  }

  public async saveAll(instance: T[]): Promise<T[]> {
    return (await this.repository.save(instance)) as T[];
  }

  public async update(
    condition: FindOptionsWhere<T>,
    updateObject: Partial<T>,
  ): Promise<UpdateResult> {
    return await this.repository.update(condition, updateObject as any);
  }

  public async delete(
    param: FindOptionsWhere<T>,
    softDelete = true,
  ): Promise<UpdateResult | DeleteResult> {
    if (softDelete) {
      return await this.repository.update(param, {
        is_deleted: 1,
      } as any);
    } else {
      //TODO: We have remove function as well.
      return await this.repository.delete(param);
    }
  }

  public async deleteById(
    id: number,
    softDelete = true,
  ): Promise<UpdateResult | DeleteResult> {
    return await this.delete(
      {
        id: id,
      } as unknown as FindOptionsWhere<T>,
      softDelete,
    );
  }

  public async deleteByIds(
    ids: number[],
    softDelete = true,
  ): Promise<UpdateResult | DeleteResult> {
    const idList: FindOptionsWhere<T>[] = [];
    for (let i = 0, l = ids.length; i < l; i++) {
      const paramObj = {
        id: ids[i],
      } as unknown as FindOptionsWhere<T>;
      idList.push(paramObj);
    }
    return await this.delete(idList as any, softDelete);
  }
}
