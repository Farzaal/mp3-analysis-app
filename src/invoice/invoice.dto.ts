import { PaginationParam } from '@/app/commons/base.request';
import {
  InvoiceStatus,
  PaymentStatus,
  PaymentType,
} from '@/app/contracts/enums/invoice.enum';
import { InvoiceLineItemComputationType } from '@/app/contracts/enums/invoiceLineItem.enum';
import { ServiceRequestStatus } from '@/app/contracts/enums/serviceRequest.enum';
import { IsValidDate } from '@/app/decorators/dateValidator.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class GetInvoicesDto extends PaginationParam {
  @ApiProperty({
    required: false,
    description: 'Minimum start date for the job to filter invoices from',
  })
  @IsOptional()
  @IsNotEmpty({ message: 'Start date is required' })
  @IsValidDate()
  start_date: Date;

  @ApiProperty({
    required: false,
    description: 'Maximum end date for the job to filter invoices up to',
  })
  @IsOptional()
  @IsNotEmpty({ message: 'End date is required' })
  @IsValidDate()
  end_date: Date;

  @ApiProperty({
    required: false,
    description: 'Status to filter invoices by',
    enum: InvoiceStatus,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsEnum(InvoiceStatus)
  invoice_status: InvoiceStatus;

  @ApiProperty({
    required: false,
    description: 'Vendor ID(s) to filter by',
    type: [Number],
  })
  @Transform(({ value }) =>
    (Array.isArray(value) ? value : [value]).map(Number),
  )
  @IsOptional()
  @IsArray()
  vendor_ids: number[];

  @ApiProperty({
    required: false,
    description: 'Property ID(s) to filter by',
    type: [Number],
  })
  @Transform(({ value }) =>
    (Array.isArray(value) ? value : [value]).map(Number),
  )
  @IsOptional()
  @IsArray()
  property_ids: number[];

  @ApiProperty({
    required: false,
    description: 'Filter by whether the invoice has been paid to vendor or not',
    type: Boolean,
    default: null,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  })
  @IsBoolean()
  paid_to_vendor: boolean;

  @ApiProperty({
    required: false,
    description:
      "Search string to match against Owner or Vendor first name or last name. This is based on the way the search is done in the client's current system.",
    type: String,
    default: '',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Query is required' })
  query: string;
}

export class CreateInvoiceLineItemDto {
  @ApiProperty({ required: false, description: 'Name of the line item' })
  @IsOptional()
  @IsNotEmpty({ message: 'Line item is required' })
  @IsString()
  line_item: string;

  @ApiProperty({
    required: false,
    description: 'Billable amount for this line item',
  })
  @IsOptional()
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    required: false,
    description: 'ID for the invoice this line item is associated with',
  })
  @IsOptional()
  invoice_master_id?: number;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Whether this line item is pertains to a vendor',
  })
  @IsOptional()
  @IsBoolean()
  is_vendor_line_item: boolean;

  @ApiProperty({
    required: false,
    default: InvoiceLineItemComputationType.Add,
    enum: InvoiceLineItemComputationType,
    description: 'Computation type for this line item',
  })
  @IsOptional()
  @IsEnum(InvoiceLineItemComputationType)
  computation_type?: InvoiceLineItemComputationType;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Whether this line item is read only',
  })
  @IsOptional()
  @IsBoolean()
  is_readonly?: boolean;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Status of the service request',
  })
  @IsOptional()
  @IsEnum(ServiceRequestStatus)
  service_request_status?: ServiceRequestStatus;

  @ApiProperty({
    required: false,
    description: 'Description of the line item',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    description: 'Billable amount for this line item',
  })
  @IsOptional()
  @IsNotEmpty({ message: 'Section ID is required' })
  @IsNumber()
  @IsPositive()
  section_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  hours_worked?: number;

  @ApiProperty({
    required: false,
    description: 'ID for the invoice this line item is associated with',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  franchise_admin_id: number;
}

export class CreateInvoiceDto {
  @ApiProperty({
    required: true,
    description:
      'ID for the service request against which this invoice is generated',
  })
  @IsNotEmpty({ message: 'Service request master ID is required' })
  @IsNumber()
  service_request_master_id: number;

  @ApiProperty({
    required: false,
    description: 'Description of the invoice from vendor perspective',
  })
  @IsOptional()
  @IsString()
  vendor_description?: string;

  @ApiProperty({
    required: false,
    type: [CreateInvoiceLineItemDto],
    description: 'Array of individual line items to add to the invoice',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineItemDto)
  line_items: CreateInvoiceLineItemDto[];
}

export class UpdateInvoiceLineItemDto extends CreateInvoiceLineItemDto {
  @ApiProperty({
    required: false,
    description:
      'ID of the existing line item to update. If not provided, a new line item will be created.',
  })
  @IsOptional()
  @IsNumber()
  id?: number;
}

export class UpdateInvoiceLineItemsDto {
  @ApiProperty({
    required: false,
    description: 'Description of the invoice from franchise perspective',
  })
  @IsOptional()
  @IsString()
  franchise_description?: string;

  @ApiProperty({
    required: false,
    description: 'Description of the invoice from vendor perspective',
  })
  @IsOptional()
  @IsString()
  vendor_description?: string;

  @ApiProperty({
    required: false,
    type: [UpdateInvoiceLineItemDto],
    description: 'Array of line items to update or add to the invoice',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInvoiceLineItemDto)
  line_items: UpdateInvoiceLineItemDto[];
}

export class MarkVendorPaymentDto {
  @ApiProperty({
    required: true,
    description: 'IDs of the invoices to mark payment for',
    type: [Number],
  })
  @IsNotEmpty({ message: 'Invoice master IDs are required' })
  @IsArray()
  @IsNumber({}, { each: true })
  invoice_master_ids: number[];

  @ApiProperty({
    required: true,
    description: 'Cheque reference for the vendor payment',
  })
  @IsNotEmpty({ message: 'Vendor payment cheque reference is required' })
  @IsString()
  vendor_payment_cheque_reference: string;
}

export class MarkOwnerPaymentDto {
  @ApiProperty({
    required: true,
    description: 'IDs of the invoices to mark payment for',
    type: [Number],
  })
  @IsNotEmpty({ message: 'Invoice master IDs are required' })
  @IsArray()
  @IsNumber({}, { each: true })
  invoice_master_ids: number[];

  @ApiProperty({
    required: true,
    description: 'Cheque reference for the owner payment',
  })
  @IsOptional()
  @IsString()
  owner_payment_cheque_reference: string;

  @ApiProperty({
    required: true,
    description: 'Cheque reference for the owner payment',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  payment_method_id: number;
}

export class RejectInvoiceDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;
}
export class GetAllInvoicesDtoV2 extends PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  query: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  service_type_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsValidDate()
  start_date: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsValidDate()
  end_date: Date;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  property_master_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  parent_service_request_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  @Transform(({ value }) => Number(value))
  @IsNumber()
  vendor_payment_status: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  @Transform(({ value }) => Number(value))
  @IsNumber()
  owner_payment_status: number;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(PaymentType)
  @Type(() => Number)
  payment_method: PaymentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_guest_concierge: boolean;
}

export class CreateInvoiceV2 {
  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  service_request_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendor_description: string;

  @ApiProperty({ required: true, type: [CreateInvoiceLineItemDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineItemDto)
  line_items: CreateInvoiceLineItemDto[];
}

export class UpdateInvoiceV2 {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Invoice master ID is required' })
  @Type(() => Number)
  @IsNumber()
  invoice_master_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendor_description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  franchise_description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  line_items: CreateInvoiceLineItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  vendor_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsIn([InvoiceStatus.SentToOwner])
  status: InvoiceStatus.SentToOwner;
}

export class UpsertInvoicePaymentDetailsDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Invoice master ID is required' })
  @IsNumber()
  invoice_master_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Owner payment details are required' })
  @IsBoolean()
  owner_payment_details: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Payment status is required' })
  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(PaymentType)
  payment_type: PaymentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cheque_number: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount_paid: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  send_request_to_owner: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  vendor_id: number;
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Invoice master ID is required' })
  @IsNumber()
  invoice_master_id: number;

  @ApiProperty({
    required: true,
    enum: [InvoiceStatus.RejectedAndSentToVendor, InvoiceStatus.SentToOwner],
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn([InvoiceStatus.RejectedAndSentToVendor, InvoiceStatus.SentToOwner])
  status: InvoiceStatus;
}

export class ProcessPaymentDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Invoice master IDs are required' })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ValidateIf((o) => !o.pay_all_invoices)
  invoice_master_ids: number[];

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Payment method ID is required' })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  payment_method_id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  pay_all_invoices: boolean;
}

export class UpdateWorkDescriptionDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Invoice master ID is required' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  invoice_master_id: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Franchise description is required' })
  @IsString()
  franchise_description?: string;
}
