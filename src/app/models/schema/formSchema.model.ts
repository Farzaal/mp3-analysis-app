import { Entity, Column } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';

@Entity('form_schema')
export class FormSchemaModel extends PostgresBaseModel {
  @Column({
    name: 'type',
    type: 'varchar',
    nullable: true,
  })
  type: string;

  @Column({
    name: 'schema',
    type: 'jsonb',
    nullable: true,
  })
  schema: object;

  @Column({
    name: 'mapping_values',
    type: 'jsonb',
    nullable: true,
  })
  mapping_values: object;
}
