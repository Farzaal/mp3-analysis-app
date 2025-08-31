import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Length,
  IsString,
  IsEmail,
  IsArray,
  ArrayMinSize,
  IsNumber,
  IsUrl,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { IsValidDate } from '@/app/decorators/dateValidator.decorator';
import { PaginationParam } from '@/app/commons/base.request';
import { Transform, Type } from 'class-transformer';

export class ServiceTypeRates {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'ID is required' })
  @IsNumber()
  id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  value: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Hourly rate is required' })
  @Type(() => Number)
  @IsNumber()
  hourly_rate: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service fee is required' })
  @Type(() => Number)
  @IsNumber()
  service_call_fee: number;
}

export class CreateVendorDto {
  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  first_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  last_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Length(4, 128)
  password: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  license_number: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Website URL is required' })
  @IsUrl()
  website_url: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Contact is required' })
  @IsString()
  contact: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Mailing address is required' })
  @IsString()
  mailing_address: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'City is required' })
  @IsString()
  city: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'State is required' })
  @IsString()
  state: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Zip is required' })
  @IsString()
  zip: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Office phone is required' })
  @IsString()
  office_phone: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Cell phone is required' })
  @IsString()
  cell_phone: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  insurance_company: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  policy_number: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsValidDate()
  policy_effective_date: Date;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsValidDate()
  policy_expire_date: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'Franchise ID is required' })
  @IsNumber()
  franchise_id: number;

  @ApiProperty({ required: true, type: [Number] })
  @IsNotEmpty({ message: 'Service types are required' })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  service_types: number[];

  @ApiProperty({ required: true, type: [Number] })
  @IsNotEmpty({ message: 'Town is required' })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  town: number[];

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  insurance_document_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_approved: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  terms_and_conditions: boolean;

  @ApiProperty({ required: false })
  @IsNotEmpty({ message: 'Alternate contact is required' })
  @IsString()
  alternate_contact: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  alternate_contact_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments: string;

  @ApiProperty({ required: false, type: [ServiceTypeRates] })
  @IsOptional()
  @IsArray()
  @Type(() => ServiceTypeRates)
  service_type_rates: ServiceTypeRates[];
}

export class UpdateVendorDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Vendor ID is required' })
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  first_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  last_name: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  @Length(4, 128)
  password: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  license_number: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Website URL is required' })
  @IsUrl()
  website_url: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Contact is required' })
  @IsString()
  contact: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Mailing address is required' })
  @IsString()
  mailing_address: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'City is required' })
  @IsString()
  city: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'State is required' })
  @IsString()
  state: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Zip is required' })
  @IsString()
  zip: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Office phone is required' })
  @IsString()
  office_phone: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Cell phone is required' })
  @IsString()
  cell_phone: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  insurance_company: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  policy_number: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsValidDate()
  policy_effective_date: Date;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsValidDate()
  policy_expire_date: Date;

  @ApiProperty({ required: true, type: [Number] })
  @IsNotEmpty({ message: 'Service types are required' })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  service_types: number[];

  @ApiProperty({ required: true, type: [Number] })
  @IsNotEmpty({ message: 'Town is required' })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  town: number[];

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  insurance_document_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_approved: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  franchise_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  alternate_contact: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  alternate_contact_name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments: string;

  @ApiProperty({ required: false, type: [ServiceTypeRates] })
  @IsOptional()
  @IsArray()
  @Type(() => ServiceTypeRates)
  service_type_rates: ServiceTypeRates[];
}

export class VendorServiceTypesDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Vendor ID is required' })
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type ID is required' })
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise admin ID is required' })
  @IsNumber()
  franchise_admin_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Is approved is required' })
  @IsBoolean()
  is_approved: boolean;
}

export class VendorApprovalDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Vendor ID is required' })
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Is approved is required' })
  @IsBoolean()
  is_approved: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments: string;
}

export class VendorSearchQueryDto extends PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  franchise_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_approved: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  insurance_active: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  service_area: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  download: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isReport: boolean;
}
