import { Injectable, BadRequestException } from '@nestjs/common';
import { UserModel } from '../app/models/user/user.model';
import { UserRepository } from '../app/repositories/user/user.repository';
import {
  CreateSuperAdminDto,
  LoginUserDto,
  ResetPasswordDto,
  RoleLoginDto,
  VerifyEmailDto,
} from './auth.dto';
import { comparePassword } from '../app/utils/bcrypt.helper';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse } from '@/app/response/auth/auth.response';
import { JwtPayload } from '../app/contracts/types/jwtPayload.type';
import { AuthMessages } from './auth.message';
import { UserType } from '@/app/contracts/enums/usertype.enum';
import { hashPassword } from '@/app/utils/bcrypt.helper';
import { UserTokenRepository } from '@/app/repositories/user/userToken.repository';
import { UserTokenModel } from '@/app/models/user/userToken.model';
import { EncryptionHelper } from '@/app/utils/encryption.helper';
import { TokenType } from '@/app/contracts/enums/TokenType.enum';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationAction } from '@/app/contracts/enums/notification.enum';
import { ConfigService } from '@nestjs/config';
import { URLS } from '@/app/contracts/enums/urls.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userTokenRepository: UserTokenRepository,
    private readonly encryptionHelper: EncryptionHelper,
    private readonly notificationsService: NotificationsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async createSuperAdmin(payload: CreateSuperAdminDto): Promise<UserModel> {
    const user: UserModel = await this.userRepository.findOne({
      where: { email: payload.email },
    });
    if (user) throw new BadRequestException(AuthMessages.SUPER_ADMIN_EXISTS);
    const encryptPassword: string = await hashPassword(payload?.password);

    const superAdminModal = await this.userRepository.create({
      ...payload,
      password: encryptPassword,
      user_type: UserType.SuperAdmin,
    });

    const superAdminModalSaved =
      await this.userRepository.save(superAdminModal);

    delete superAdminModalSaved['password'];

    return superAdminModalSaved;
  }

  async getAuthUser(user: JwtPayload): Promise<UserModel> {
    return await this.userRepository.findOne({
      where: { id: user.id },
    });
  }

  async verifyToken(payload: ResetPasswordDto): Promise<boolean> {
    const tokenData = this.encryptionHelper.decrypt(payload.token);

    if (!tokenData)
      throw new BadRequestException(AuthMessages.REQUEST_NOT_FOUND);

    const decryptedData = JSON.parse(tokenData);

    const userToken: UserTokenModel = await this.userTokenRepository.findOne({
      where: { user_id: decryptedData.id, token: payload.token },
    });

    if (!userToken) throw new BadRequestException(AuthMessages.INVALID_ATTEMPT);

    const password = await hashPassword(payload.password);

    await Promise.all([
      this.userRepository.update({ id: decryptedData.id }, { password }),
      this.userTokenRepository.delete({ user_id: decryptedData.id }, false),
    ]);

    return true;
  }

  async verifyEmail(payload: VerifyEmailDto): Promise<boolean> {
    const userModel: UserModel = await this.userRepository.findOne({
      where: { email: payload.email },
      relations: ['franchiseUser'],
    });
    if (
      !userModel ||
      (userModel &&
        userModel.user_type === UserType.Owner &&
        userModel.is_deleted)
    )
      throw new BadRequestException(AuthMessages.USER_NOT_FOUND);

    if (
      userModel &&
      userModel.user_type === UserType.Vendor &&
      !userModel.is_approved
    )
      throw new BadRequestException(AuthMessages.ACCOUNT_DEACTIVATED);

    // if (![UserType.Vendor, UserType.Owner].includes(userModel.user_type))
    //   throw new BadRequestException(AuthMessages.INVALID_ATTEMPT);

    if (
      (userModel.user_type === UserType.Owner ||
        userModel.user_type === UserType.Vendor) &&
      (!userModel.franchiseUser || !userModel.franchiseUser.site_url)
    )
      throw new BadRequestException(AuthMessages.INVALID_ATTEMPT);

    const isTokenExists = await this.userTokenRepository.findOne({
      where: {
        user_id: userModel.id,
      },
    });

    if (isTokenExists) {
      const tokenCreationTime = isTokenExists.created_at * 1000;
      const timeDifferenceInSeconds = (Date.now() - tokenCreationTime) / 1000;
      if (timeDifferenceInSeconds < 60) {
        throw new BadRequestException(AuthMessages.EMAIL_ERROR);
      }
    }

    await this.userTokenRepository.delete(
      {
        user_id: userModel.id,
      },
      false,
    );

    const userTokenModel = new UserTokenModel();

    const encPayload = this.encryptionHelper.encrypt(
      JSON.stringify({ email: userModel.email, id: userModel.id }),
    );

    userTokenModel.user_id = userModel.id;
    userTokenModel.token = encPayload;
    userTokenModel.token_type = TokenType.PasswordReset;

    await this.userTokenRepository.save(userTokenModel);

    let redirectUrl = `${userModel.franchiseUser.site_url}/reset-password?auth=${encPayload}`;

    if (
      [
        UserType.FranchiseAdmin,
        UserType.StandardAdmin,
        UserType.SuperAdmin,
      ].includes(userModel.user_type)
    ) {
      redirectUrl = `${this.configService.get(URLS.PORTAL_FRONTEND_URL)}/reset-password?auth=${encPayload}`;
    }

    await this.notificationsService.sendNotification(
      NotificationAction.FORGOT_PASSWORD,
      {
        Link: redirectUrl,
      },
      [userModel.email],
    );

    return true;
  }

  async roleLogin(data: RoleLoginDto, user: JwtPayload): Promise<string> {
    const userModel: UserModel = await this.userRepository.findOne({
      where: { id: data.id, is_deleted: false },
      select: [
        'id',
        'first_name',
        'last_name',
        'email',
        'user_type',
        'franchise_id',
        'profile_completion_step',
        'is_deleted',
        'is_approved',
        'is_active',
        'archived',
      ],
    });

    if (!userModel) throw new BadRequestException(AuthMessages.USER_NOT_FOUND);

    // if (userModel.user_type === UserType.Owner && userModel.archived)
    //   throw new BadRequestException(AuthMessages.OWNER_ACCOUNT_ARCHIVED);

    if (
      userModel.is_deleted ||
      (userModel.user_type === UserType.Vendor && !userModel.is_approved)
    )
      throw new BadRequestException(AuthMessages.VENDOR_ACCOUNT_DEACTIVATED);

    if (
      user.user_type === UserType.FranchiseAdmin &&
      ([UserType.SuperAdmin, UserType.FranchiseAdmin].includes(
        userModel.user_type,
      ) ||
        Number(user.franchise_id) !== Number(userModel.franchise_id))
    ) {
      throw new BadRequestException(AuthMessages.ROLE_ACCESS_ERROR);
    }

    const jwtPayload: JwtPayload = {
      id: userModel.id,
      email: userModel.email,
      user_type: userModel.user_type,
      franchise_id: userModel?.franchise_id || null,
      franchise_admin: null,
      role_login: true,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);

    return accessToken;
  }

  async login(userCredentials: LoginUserDto): Promise<LoginResponse> {
    let franchiseAdmin: UserModel | null = null;
    const user: UserModel = await this.userRepository.findOne({
      where: { email: userCredentials.email },
      select: [
        'id',
        'first_name',
        'last_name',
        'email',
        'user_type',
        'password',
        'franchise_id',
        'profile_completion_step',
        'is_active',
        'is_deleted',
        'is_approved',
        'archived',
      ],
      relations: ['userMenuItem'],
    });

    if (!user) throw new BadRequestException(AuthMessages.INVALID_EMAIL);

    if (user.user_type === UserType.Owner && user.archived)
      throw new BadRequestException(AuthMessages.ACCOUNT_ARCHIVED);

    if (
      user.is_deleted ||
      (user.user_type === UserType.Vendor && !user.is_approved)
    )
      throw new BadRequestException(AuthMessages.ACCOUNT_DEACTIVATED);

    const isPasswordValid: boolean = await comparePassword(
      userCredentials.password,
      user.password,
    );

    if (!isPasswordValid)
      throw new BadRequestException(AuthMessages.INVALID_PASSWORD);

    delete user['password'];

    if (user.user_type === UserType.StandardAdmin) {
      franchiseAdmin = await this.userRepository.findOne({
        where: {
          franchise_id: user.franchise_id,
          user_type: UserType.FranchiseAdmin,
        },
      });
    }

    const jwtPayload: JwtPayload = {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      franchise_id: user?.franchise_id ?? null,
      franchise_admin: franchiseAdmin?.id ?? null,
      role_login: false,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload);

    return { user, accessToken };
  }

  async getUserById(userId: number): Promise<UserModel> {
    return await this.userRepository.findOne({
      where: { id: userId },
    });
  }
}
