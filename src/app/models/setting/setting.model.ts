import { Column, Entity } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';

@Entity('settings')
export class SettingModel extends PostgresBaseModel {
  @Column({
    name: 'key',
    type: 'varchar',
    nullable: false,
  })
  key: string;

  @Column({
    name: 'value',
    type: 'jsonb',
    nullable: true,
  })
  value: object;
}
