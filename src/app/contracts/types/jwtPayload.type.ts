import { UserType } from '../enums/usertype.enum';

export type JwtPayload = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  user_type: UserType;
  franchise_id: number | string | null;
  franchise_admin: number | string | null;
  role_login?: boolean;
};
