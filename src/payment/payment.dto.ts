import { PaginationParam } from '@/app/commons/base.request';
import { PaymentMethod } from '@/app/contracts/enums/payment.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SetupPaymentMethodDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Payment method type is required' })
  @IsEnum(PaymentMethod)
  payment_method_type: PaymentMethod;
}

export class SavePaymentMethodDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Payment method ID is required' })
  @IsString()
  payment_method_id: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Setup intent ID is required' })
  @IsString()
  setup_intent_id: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method_type: PaymentMethod;

  @ApiProperty()
  @IsOptional()
  @IsString()
  card_holder_name: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_default: boolean = false;
}

export class AssociatePropertyPaymentMethodDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Payment method ID is required' })
  @Type(() => Number)
  @IsNumber()
  payment_method_id: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'Property ID is required' })
  @Type(() => Number)
  @IsNumber()
  property_id: number;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_default: boolean;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  enable_auto_charge: boolean;
}

export class GetMembershipTransactionDto extends PaginationParam {
  @ApiProperty()
  @IsNotEmpty({ message: 'Property master ID is required' })
  @Type(() => Number)
  @IsNumber()
  property_master_id: number;
}

export class MembershipPaymentRetryDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Membership transaction ID is required' })
  @Type(() => Number)
  @IsNumber()
  membership_transaction_id: number;
}

export class GetConciergePublishableKeyDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  franchise_id: number;
}
