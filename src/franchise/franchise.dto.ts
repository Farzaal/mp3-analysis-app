import { PaginationParam } from '@/app/commons/base.request';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ServiceLocationDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'ID is required' })
  @IsNumber()
  id: number;
}

export class CreateFranchiseDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString()
  @Length(1, 254)
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Location is required' })
  @IsString()
  @Length(1, 254)
  location: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Site URL is required' })
  @IsString()
  site_url: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise site ID is required' })
  @IsNumber()
  franchise_site_id: number;
}

export class UpdateFranchiseDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  first_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  last_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Email is required' })
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Contact is required' })
  @IsString()
  contact: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise ID is required' })
  @IsNumber()
  franchise_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stripe_public_key: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stripe_secret_key: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  twilio_sid: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  twilio_token: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  twilio_from_number: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  twilio_your_cell_number: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  google_review_number: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  facebook_review_link: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  royalty_percentage: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  credit_card_processing_fee: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  file_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  document_url: string;
}

export class SearchFranchiseDto extends PaginationParam {
  @ApiProperty({ required: false })
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  name: string;
}

export class CreateTownDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise ID is required' })
  @IsNumber()
  franchise_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service area is required' })
  @IsString()
  @Length(1, 80)
  service_area: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise site service location ID is required' })
  @IsNumber()
  franchise_site_service_location_id: number;
}

export class UpdateTownDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise ID is required' })
  @IsNumber()
  franchise_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service area is required' })
  @IsString()
  @Length(1, 80)
  service_area: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise service location ID is required' })
  @IsNumber()
  franchise_service_location_id: number;
}

export class PermissionsDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Dashboard permission is required' })
  @IsBoolean()
  dashboard: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Properties permission is required' })
  @IsBoolean()
  properties: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Owners permission is required' })
  @IsBoolean()
  owners: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Vendor management permission is required' })
  @IsBoolean()
  vendor_management: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service requests permission is required' })
  @IsBoolean()
  service_requests: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Linen permission is required' })
  @IsBoolean()
  linen: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'My services permission is required' })
  @IsBoolean()
  my_services: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Estimate request permission is required' })
  @IsBoolean()
  estimate_request: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Payment settings permission is required' })
  @IsBoolean()
  payment_settings: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Invoices permission is required' })
  @IsBoolean()
  invoices: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Documents permission is required' })
  @IsBoolean()
  documents: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Reporting permission is required' })
  @IsBoolean()
  reporting: boolean;
}

export class CreateStandardAdminDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  first_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  last_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;

  @ApiProperty({ required: true, type: PermissionsDto })
  @IsNotEmpty({ message: 'Permissions are required' })
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions: PermissionsDto;
}

export class UpdateStandardAdminDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @Length(1, 30)
  first_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @Length(1, 30)
  last_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Standard admin ID is required' })
  @IsNumber()
  standard_admin_id: number;

  @ApiProperty({ required: true, type: PermissionsDto })
  @IsNotEmpty({ message: 'Permissions are required' })
  @ValidateNested()
  @Type(() => PermissionsDto)
  permissions: PermissionsDto;
}

export class StandardAdminSearchQueryDto extends PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name: string;
}

export class UpdateFranchiseSiteDto {
  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  @Length(1, 254)
  name: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  @Length(1, 254)
  location: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  site_url: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise ID is required' })
  @Type(() => Number)
  @IsNumber()
  franchise_id: number;
}
