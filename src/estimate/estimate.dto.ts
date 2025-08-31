import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsIn,
  IsEnum,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsValidDate } from '@/app/decorators/dateValidator.decorator';
import { PaginationParam } from '@/app/commons/base.request';
import { EstimateStatus } from '@/app/contracts/enums/estimate.enum';
import { ServiceRequestPriority } from '@/app/contracts/enums/serviceRequestPriority.enum';
import { DistributionType } from '@/app/contracts/enums/distributionType';

export class CreateEstimateDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Property ID is required' })
  @IsNumber()
  property_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type ID is required' })
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsValidDate()
  start_date: Date;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional({ each: true })
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Owner consent is required' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  owner_consent: boolean;
}

export class EstimateQueryDto extends PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsValidDate()
  start_date: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsValidDate()
  end_date: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  query: string;
}

export class UpdateEstimateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value.map(Number))
  @IsArray()
  @IsNumber({}, { each: true })
  vendor_ids?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(DistributionType)
  estimate_distribution_type: DistributionType;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Estimate master ID is required' })
  @IsNumber()
  estimate_master_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type ID is required' })
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsValidDate()
  start_date: Date;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional({ each: true })
  @IsString({ each: true })
  images: string[];
}

export class LineItemDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Line item is required' })
  @IsString()
  line_item: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber()
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendor_id: number;
}

export class VendorQuotationDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Estimate master ID is required' })
  @IsNumber()
  estimate_master_id: number;

  @ApiProperty({ required: true, type: [LineItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  items: LineItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendor_description?: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Total is required' })
  @IsNumber()
  total: number;
}

export class UpdateVendorQuotationByFranchiseAdminDto extends VendorQuotationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  franchise_admin_description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  send_to_owner: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Vendor ID is required' })
  @IsNumber()
  vendor_id: number;
}

export class UpdateEstimateStatusDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Estimate master ID is required' })
  @IsNumber()
  estimate_master_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Vendor ID is required' })
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Status is required' })
  @IsNumber()
  @IsIn([
    EstimateStatus.EstimateApprovedByOwner,
    EstimateStatus.EstimateRejectedByOwner,
  ])
  status:
    | EstimateStatus.EstimateApprovedByOwner
    | EstimateStatus.EstimateRejectedByOwner;

  @ApiProperty()
  @IsNotEmpty({ message: 'Priority is required' })
  @IsEnum(ServiceRequestPriority)
  priority: ServiceRequestPriority;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.status === EstimateStatus.EstimateApprovedByOwner)
  @IsNotEmpty({ message: 'Start date is required' })
  @IsValidDate()
  start_date: Date;
}

export class RejectQuotationDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Estimate master ID is required' })
  @IsNumber()
  estimate_master_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @ValidateIf((o) => !o.reject_all_quotes)
  @IsNotEmpty({ message: 'Vendor ID is required' })
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  reject_all_quotes: boolean;
}

export class ArchiveEstimateDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'ID is required' })
  @IsNumber()
  id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Archived status is required' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  archived: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Is quote is required' })
  @IsBoolean()
  is_quote: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_rejected_quote: boolean;
}

export class VendorEstimateDeclineDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Estimate master ID is required' })
  @Type(() => Number)
  @IsNumber()
  estimate_master_id: number;
}
