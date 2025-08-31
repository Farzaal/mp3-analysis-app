import { UserModel } from '@/app/models/user/user.model';

export interface LoginResponse {
  user: UserModel;
  accessToken: string;
}
