import { LinenDeliveryType } from '@/app/contracts/enums/linenDeliveryType.enum';
import { LinenProducts } from '@/app/contracts/enums/linenProducts.enum';
import { LinenType } from '@/app/contracts/enums/linenType.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateFranchiseLinenConfigDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(LinenType)
  type: LinenType;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Delivery type is required' })
  @IsEnum(LinenDeliveryType)
  delivery_type: LinenDeliveryType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(LinenProducts)
  product_type: LinenProducts;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  number_of_bedrooms: number;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Fees are required' })
  @IsNumber()
  fees: number;
}

export class UpdateFranchiseLinenConfigDto extends CreateFranchiseLinenConfigDto {
  @ApiProperty({ required: false })
  @IsNotEmpty({ message: 'Linen config ID is required' })
  @IsNumber()
  linen_config_id: number;
}
