import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from './user.model';
import { TokenType } from '@/app/contracts/enums/TokenType.enum';

@Entity('user_tokens')
export class UserTokenModel extends PostgresBaseModel {
  @Column({
    name: 'user_id',
    type: 'bigint',
    nullable: false,
  })
  user_id: number;

  @Column({
    name: 'token',
    type: 'varchar',
    nullable: false,
  })
  token: string;

  @Column({
    name: 'token_type',
    type: 'enum',
    enum: TokenType,
    nullable: false,
  })
  token_type: TokenType;

  @ManyToOne(() => UserModel, (userModel) => userModel.token)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  userTokens: UserModel;
}
