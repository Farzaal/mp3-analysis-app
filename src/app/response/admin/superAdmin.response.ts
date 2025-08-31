import { UserModel } from '@/app/models/user/user.model';

export interface CreateSuperAdminResponse {
  user: UserModel;
}

export interface SuperAdminLoginResponse {
  user: UserModel;
  accessToken: string;
}
