import { BaseModel } from './base.model';
import { AfterLoad, PrimaryGeneratedColumn, AfterInsert } from 'typeorm';

export abstract class PostgresBaseModel extends BaseModel {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @AfterInsert()
  castId() {
    this.id = parseInt(this.id.toString()); // to convert string id into number
  }

  @AfterLoad()
  convertDates() {
    this.id = parseInt(this.id.toString()); // to convert string id into number
  }
}
