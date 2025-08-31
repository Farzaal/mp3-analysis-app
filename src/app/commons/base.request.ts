import { IsOptional, IsNumber, IsIn, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  page: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  return_till_current_page?: boolean;

  @ApiProperty({
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  sort_by?: string;
}

export class PaginationParamForBody {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  page: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit: number;
}
