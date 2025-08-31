import { ServiceRequestPriority } from '@/app/contracts/enums/serviceRequestPriority.enum';
import { IsValidDate } from '@/app/decorators/dateValidator.decorator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { OwnerApprovalStatus } from '@/app/contracts/enums/ownerApprovalStatus.enum';
import { PaginationParam } from '@/app/commons/base.request';
import {
  ServiceRequestRepeatType,
  ServiceRequestStatus,
} from '@/app/contracts/enums/serviceRequest.enum';
import { Transform, Type } from 'class-transformer';
import { LinenDeliveryType } from '@/app/contracts/enums/linenDeliveryType.enum';
import { ServiceTypeTurnover } from '@/app/contracts/enums/serviceTypeRequest.enum';
import { DistributionType } from '@/app/contracts/enums/distributionType';
import { CreateInvoiceLineItemDto } from '@/invoice/invoice.dto';
import {
  InvoiceStatus,
  PaymentStatus,
} from '@/app/contracts/enums/invoice.enum';

export class LinenPropertiesDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Delivery type is required' })
  @IsEnum(LinenDeliveryType)
  delivery_type: LinenDeliveryType;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Number of bedrooms is required' })
  @IsNumber()
  @Min(1)
  number_of_bedrooms: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedroom_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_full_bathrooms?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  full_bathroom_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_one_fifth_bathrooms?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  one_fifth_bathroom_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_guests?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  guest_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_king_beds?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  king_bed_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_queen_beds?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  queen_bed_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_full_beds?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  full_bed_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_twin_beds?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  twin_bed_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_bath_towel_sets?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  bath_towel_set_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_kitchen_sets?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  kitchen_set_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_bath_mat_sets?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  bath_mat_set_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_beach_towels?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  beach_towel_price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number_of_hand_towel_sets?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(0)
  hand_towel_set_price?: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Total charges is required' })
  @IsNumber()
  @Min(0)
  total_charges: number;
}
export class RecurringDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Repeat value is required' })
  @IsNumber()
  repeat: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Repeat type is required' })
  @IsEnum(ServiceRequestRepeatType)
  repeat_type: ServiceRequestRepeatType;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'End date is required' })
  @IsValidDate()
  end_date: Date;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days: number[];
}

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Property master ID is required' })
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Service type ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes_for_vendor?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(ServiceRequestPriority)
  priority: ServiceRequestPriority;

  @ApiProperty()
  @IsOptional()
  @IsEnum(ServiceTypeTurnover)
  turn_over?: ServiceTypeTurnover;

  @ApiProperty()
  @IsOptional()
  @IsValidDate()
  end_date?: Date;

  @ApiProperty()
  @ValidateIf((o) => o.priority !== undefined)
  @IsNotEmpty({ message: 'Start date is required' })
  @IsValidDate()
  start_date?: Date;

  @ApiProperty()
  @ValidateIf((o) => o.distribution_type === DistributionType.SelectedVendor)
  @IsNotEmpty({ message: 'Vendor IDs are required' })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  vendor_ids?: number[];

  @ApiProperty()
  @IsOptional()
  @IsEnum(DistributionType)
  distribution_type?: DistributionType;

  @ApiProperty()
  @ValidateIf(
    (o) => o.is_guest && (o.is_guest === 'true' || o.is_guest === true),
  )
  @IsNotEmpty({ message: 'Guest contact number is required' })
  @IsString()
  guest_contact_number?: string;

  @ApiProperty()
  @ValidateIf(
    (o) => o.is_guest && (o.is_guest === 'true' || o.is_guest === true),
  )
  @IsNotEmpty({ message: 'Guest email is required' })
  @IsString()
  guest_email?: string;

  @ApiProperty()
  @ValidateIf(
    (o) => o.is_guest && (o.is_guest === 'true' || o.is_guest === true),
  )
  @IsNotEmpty({ message: 'Guest name is required' })
  @IsString()
  guest_name?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  files: string[];

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_guest?: boolean = false;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_child?: boolean = false;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  guest_consent?: boolean = false;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_discrepancy?: boolean = false;

  @ApiProperty()
  @ValidateIf(
    (o) =>
      o.is_discrepancy === 'true' ||
      o.is_discrepancy === true ||
      o.is_child === 'true' ||
      o.is_child === true,
  )
  @IsNotEmpty({ message: 'Parent service request ID is required' })
  @Type(() => Number)
  @IsNumber()
  parent_service_request_id?: number;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  display_to_vendor?: boolean = false;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_occupied?: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LinenPropertiesDto)
  linen_properties?: LinenPropertiesDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecurringDto)
  recurring?: RecurringDto;
}

export class CreateChildServiceRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Property master ID is required' })
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Service type ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  files: string[];

  @ApiProperty()
  @IsNotEmpty({ message: 'Parent service request ID is required' })
  @Type(() => Number)
  @IsNumber()
  parent_service_request_id: number;
}

export class EditServiceRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Service request ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_request_id: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(ServiceTypeTurnover)
  turn_over: ServiceTypeTurnover;

  @ApiProperty()
  @IsNotEmpty({ message: 'Service type ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes_for_vendor: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Priority is required' })
  @IsEnum(ServiceRequestPriority)
  priority: ServiceRequestPriority;

  @ApiProperty()
  @IsOptional()
  @IsValidDate()
  end_date: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'Start date is required' })
  @IsValidDate()
  start_date: Date;

  @ApiProperty()
  @ValidateIf((o) => o.distribution_type === DistributionType.SelectedVendor)
  @IsNotEmpty({ message: 'Vendor IDs are required' })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  vendor_ids: number[];

  @ApiProperty()
  @IsOptional()
  @IsEnum(DistributionType)
  distribution_type: DistributionType;

  @ApiProperty()
  @IsOptional()
  @IsString()
  guest_name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  guest_contact_number: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_recurring: boolean;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  files: string[];

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  display_to_vendor: boolean = false;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_occupied: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LinenPropertiesDto)
  linen_properties: LinenPropertiesDto;

  @ApiProperty({ required: false })
  @ValidateIf(
    (o) =>
      o.is_recurring && (o.is_recurring === 'true' || o.is_recurring === true),
  )
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RecurringDto)
  recurring: RecurringDto;
}
export class LaborDto {
  @ApiProperty({
    required: false,
    description: 'Number of hours worked',
  })
  @IsOptional()
  @IsString()
  number_of_hrs?: string;

  @ApiProperty({
    required: false,
    description: 'Hourly rate for labor',
  })
  @IsOptional()
  @IsString()
  hourly_rate?: string;
}
export class CreateDiscrepancyRequestDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Property master ID is required' })
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type ID is required' })
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Parent service request ID is required' })
  @IsNumber()
  parent_service_request_id: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  files: string[];
}
export class AdditionalCostDto {
  @ApiProperty({
    required: false,
    description: 'Name of the additional cost item',
  })
  @IsOptional()
  @IsString()
  line_item?: string;

  @ApiProperty({
    required: false,
    description: 'Price of the additional cost item',
  })
  @IsOptional()
  @IsNumber()
  price?: number;
}
export class OwnerDiscrepancyApproval {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_request_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(OwnerApprovalStatus)
  status: OwnerApprovalStatus;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsEnum(ServiceRequestPriority)
  priority: ServiceRequestPriority;

  @ApiProperty({ required: true })
  @ValidateIf((o) => o.priority !== undefined)
  @IsNotEmpty({ message: 'Start date is required' })
  @IsValidDate()
  start_date: Date;
}
export class ClaimServiceRequestDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_request_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Status is required' })
  @IsNumber()
  @IsIn([ServiceRequestStatus.Scheduled])
  status: ServiceRequestStatus.Scheduled;
}

export class ServiceCallFeeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  section_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  line_item?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;
}
export class ReleaseVendorDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request ID is required' })
  @IsNumber()
  service_request_id: number;
}

export class ServiceRequestQueryDto extends PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsValidDate()
  start_date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsValidDate()
  end_date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  property_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ServiceRequestStatus)
  @Transform(({ value }: { value: string }) => Number(value))
  status: ServiceRequestStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  query: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_discrepancy: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_guest: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  claim: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  statuses: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  owner_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_archived: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_deleted: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  owner_is_paid: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  vendor_is_paid: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  download: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isReport: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  @Transform(({ value }) => Number(value))
  @IsNumber()
  vendor_payment_status: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsEnum(InvoiceStatus)
  invoice_status: InvoiceStatus;
}

export class ServiceRequestNotesDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request ID is required' })
  @IsNumber()
  service_request_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ServiceRequestStatus)
  status: ServiceRequestStatus;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsArray()
  files: string[];

  @ApiProperty({
    required: false,
    type: [CreateInvoiceLineItemDto],
    description: 'Array of invoice line items for the service request',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineItemDto)
  @ValidateIf((o) =>
    [
      ServiceRequestStatus.DepositRequired,
      ServiceRequestStatus.PartiallyCompleted,
      ServiceRequestStatus.InProgress,
      ServiceRequestStatus.CompletedSuccessfully,
    ].includes(o.status),
  )
  line_items: CreateInvoiceLineItemDto[];

  @ApiProperty({
    required: false,
    type: [AdditionalCostDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalCostDto)
  additional_cost?: AdditionalCostDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => LaborDto)
  labor?: LaborDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ServiceCallFeeDto)
  service_call_fee?: ServiceCallFeeDto;
}

export class ServiceRequestNoteImageDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request ID is required' })
  @IsNumber()
  service_request_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request note ID is required' })
  @IsNumber()
  service_request_note_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Files are required' })
  @IsArray()
  files: string[];
}

export class CalenderQueryDto {
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
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_deleted: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  query: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsIn([
    ServiceRequestStatus.NotYetAssigned,
    ServiceRequestStatus.Claimed,
    ServiceRequestStatus.Scheduled,
    ServiceRequestStatus.InProgress,
    ServiceRequestStatus.PartiallyCompleted,
    ServiceRequestStatus.CompletedSuccessfully,
    ServiceRequestStatus.DepositRequired,
  ])
  status:
    | ServiceRequestStatus.NotYetAssigned
    | ServiceRequestStatus.Claimed
    | ServiceRequestStatus.Scheduled
    | ServiceRequestStatus.InProgress
    | ServiceRequestStatus.PartiallyCompleted
    | ServiceRequestStatus.CompletedSuccessfully
    | ServiceRequestStatus.DepositRequired;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  property_id: number;
}
export class ServiceRequestArchiveDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_request_id: number;
}

export class DrawerQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsValidDate()
  start_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parent_service_request_id?: number;
}

export class ServiceRequestReportedIssueDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request ID is required' })
  @IsNumber()
  service_request_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service type ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsArray()
  files: string[];
}

export class CancelServiceRequestDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Cancel reason is required' })
  @IsString()
  cancel_reason: string;
}
export class BillingInfoDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  zip: string;
}
export class CartItemsDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  qty: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsValidDate()
  start_date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description: string;
}
export class CreateGuestConciergeServiceRequestDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  franchise_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  payment_method_id: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => BillingInfoDto)
  billing_info: BillingInfoDto;

  @ApiProperty({ required: true, type: [CartItemsDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemsDto)
  cart_items: CartItemsDto[];
}
export class ServiceRequestNoteDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Service request ID is required' })
  @Type(() => Number)
  @IsNumber()
  service_request_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Note ID is required' })
  @Type(() => Number)
  @IsNumber()
  note_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;
}
