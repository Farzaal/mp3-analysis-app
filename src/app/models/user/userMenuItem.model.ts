import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PostgresBaseModel } from '../postgresBase.model';
import { UserModel } from './user.model';

@Entity('user_menu_items')
export class UserMenuItemModel extends PostgresBaseModel {
  @Column({
    name: 'menu_item_description',
    type: 'varchar',
    nullable: false,
  })
  menu_item: string;

  @Column({
    name: 'menu_item_permission',
    type: 'boolean',
    default: false,
  })
  menu_item_permission: boolean;

  @Column({
    name: 'menu_item_url',
    type: 'varchar',
    nullable: true,
  })
  menu_item_url: string;

  @Column({
    name: 'user_id',
    type: 'bigint',
    nullable: false,
  })
  user_id: number;

  @ManyToOne(() => UserModel, (userModel) => userModel.userMenuItem)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  userMenu: UserModel;
}
