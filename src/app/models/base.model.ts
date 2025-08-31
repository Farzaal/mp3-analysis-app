import { BaseEntity, BeforeInsert, BeforeUpdate, Column } from 'typeorm';

export abstract class BaseModel extends BaseEntity {
  @Column({
    name: 'created_at',
    type: 'bigint',
    nullable: false,
  })
  created_at: number;

  @Column({
    name: 'updated_at',
    type: 'bigint',
    nullable: false,
  })
  updated_at: number;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
  })
  is_deleted: boolean;

  @BeforeInsert()
  createDates() {
    this.created_at = Math.floor(Date.now() / 1000);
    this.updated_at = Math.floor(Date.now() / 1000);
    this.is_deleted = false;
  }

  @BeforeUpdate()
  updateDates() {
    this.updated_at = Math.floor(Date.now() / 1000);
  }
}
