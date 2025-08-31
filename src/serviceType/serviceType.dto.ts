import { ServiceTypeRequestStatus } from '@/app/contracts/enums/serviceTypeRequest.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsBoolean,
  Length,
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  ValidateNested,
  IsArray,
  ValidateIf,
  Min,
} from 'class-validator';
import { PaginationParam } from '@/app/commons/base.request';

export class CreateServiceTypeDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  door_code_access: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  owners_phone_access: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  allow_recurring_request: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  notify_status_change: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  use_cleaning_logic: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  turn_over: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  use_preventive_logic: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  available_to_guest: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  apply_service_fee: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  title: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Service type category ID is required' })
  @IsNumber()
  service_type_category_id: number;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_recurring: boolean = false;
}

export class UpdateServiceTypeDto extends CreateServiceTypeDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Service type ID is required' })
  @IsNumber()
  service_type_id: number;
}

export class ChargesDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'ID is required' })
  @Type(() => Number)
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  owner_charge: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendor_charge: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount_percentage: number;

  @ApiProperty({ required: true, type: [Number] })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsNumber({}, { each: true })
  pref_vendors: number[];
}

export class UpsertPropertyServiceTypeRatesDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Property master ID is required' })
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;

  @ApiProperty({ type: [ChargesDto] })
  @IsNotEmpty({ message: 'Charges are required' })
  @ValidateNested({ each: true })
  @Type(() => ChargesDto)
  charges: ChargesDto[];
}

export class CreateOrUpdateServiceTypeCategoryDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  title: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Is linen is required' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_linen: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Is handyman concierge is required' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_handyman_concierge: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Standard hourly is required' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  standard_hourly: boolean;
}

export class UpdateServiceTypeCategoryStatusDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Is active is required' })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty()
  @IsNotEmpty({ message: 'Service type category ID is required' })
  @IsNumber()
  service_type_category_id: number;
}

export class UpdateServiceTypeStatusDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Is active is required' })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty()
  @IsNotEmpty({ message: 'Service type ID is required' })
  @IsNumber()
  service_type_id: number;
}

export class GetServiceTypeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_type_category_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  service_type_title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_active: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_linen: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  property_master_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_handyman_concierge: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_standard_hourly: boolean;
}

export class GetGuestServiceTypeDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Property master ID is required' })
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;

  @ApiProperty({ required: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({ required: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  available_to_guest: boolean;

  @ApiProperty({ required: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_guest_concierge: boolean;
}

export class ServiceTypeStatusDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Status is required' })
  @Type(() => Number)
  @IsNumber()
  @IsIn([ServiceTypeRequestStatus.Approved, ServiceTypeRequestStatus.Rejected])
  status: ServiceTypeRequestStatus.Approved | ServiceTypeRequestStatus.Rejected;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type request ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_type_request_id: number;
}

export class CreateGuestConciergeCategoryDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  image_url: string;
}

export class CreateGuestConciergeServiceDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  service_type_category_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: true, type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  guest_price: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  vendor_rate: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  associated_service_type_id: number;
}

export class UpdateGuestConciergeServiceDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  service_type_category_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: true, type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  guest_price: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  vendor_rate: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  associated_service_type_id: number;
}

export class GetGuestConciergeCategoryDto extends PaginationParam {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  franchise_id: number;
}

export class GetGuestConciergeServiceDto extends PaginationParam {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  franchise_id: number;

  @ApiProperty({
    required: false,
  })
  @ValidateIf((o) => !o.category_slug)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  category_id?: number;

  @ApiProperty({ required: false })
  @ValidateIf((o) => !o.category_id)
  @IsNotEmpty()
  @IsString()
  category_slug?: string;
}

export class GetServiceTypeImagesDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  franchise_service_type_id: number;
}

export class HandymanConciergeRatesDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service call fee is required' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Service call fee must be greater than zero' })
  service_call_fee: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Hourly rate is required' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Hourly rate must be greater than zero' })
  hourly_rate: number;
}
