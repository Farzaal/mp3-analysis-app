import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from '../user/user.model';
import { FranchiseModel } from '../franchise/franchise.model';
import { DocumentVisibility } from '@/app/contracts/enums/document.enum';

@Entity('documents')
export class DocumentModel extends PostgresBaseModel {
  @Column({
    name: 'name',
    type: 'varchar',
    nullable: false,
  })
  name: string;

  @Column({
    name: 'visibility',
    type: 'enum',
    enum: DocumentVisibility,
    nullable: false,
  })
  visibility: DocumentVisibility;

  @Column({
    name: 'document_url',
    type: 'varchar',
    nullable: false,
  })
  document_url: string;

  @Column({
    name: 'user_id',
    type: 'bigint',
    nullable: false,
  })
  user_id: number;

  @Column({
    name: 'franchise_id',
    type: 'bigint',
    nullable: false,
  })
  franchise_id: number;

  url?: string;

  @ManyToOne(() => UserModel, (userModel) => userModel.document)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserModel;

  @ManyToOne(() => FranchiseModel, (franchiseModel) => franchiseModel.document)
  @JoinColumn({ name: 'franchise_id', referencedColumnName: 'id' })
  franchiseDocs: FranchiseModel;
}
