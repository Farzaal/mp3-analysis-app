import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  Length,
  IsEmail,
  IsNumber,
  IsString,
} from 'class-validator';

export class LoginUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class RoleLoginDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'ID is required' })
  @Type(() => Number)
  @IsNumber()
  id: number;
}

export class CreateSuperAdminDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'First name is required' })
  @Length(1, 30)
  first_name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Last name is required' })
  @Length(1, 30)
  last_name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @Length(1, 30)
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Token is required' })
  @IsString()
  token: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}
