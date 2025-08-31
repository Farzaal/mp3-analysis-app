import { PaginationParam } from '@/app/commons/base.request';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateOwnerDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'First name is required' })
  @Length(1, 30)
  first_name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Last name is required' })
  @Length(1, 30)
  last_name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Franchise ID is required' })
  @IsNumber()
  franchise_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Phone is required' })
  @Length(1, 30)
  phone: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @Length(1, 30)
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  terms_and_conditions: boolean;
}

export class UpdateOwnerDto {
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
  @Length(1, 30)
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Phone is required' })
  @Length(1, 30)
  phone: string;

  @ApiProperty()
  @IsOptional()
  @Length(1, 30)
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Mailing address is required' })
  mailing_address: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'State is required' })
  state: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Zip is required' })
  zip: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Owner ID is required' })
  @IsNumber()
  owner_id: number;
}

export class OwnerSearchQueryDto extends PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  archived: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  download: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isReport: boolean;
}

export class ArchiveOwnerDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Owner ID is required' })
  @IsNumber()
  owner_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Archive status is required' })
  @IsBoolean()
  is_archived: boolean;
}
