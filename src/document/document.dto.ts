import { DocumentVisibility } from '@/app/contracts/enums/document.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationParam } from '@/app/commons/base.request';

export class CreateDocumentDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Document name is required' })
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Document file is required' })
  @IsString()
  file: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Document visibility is required' })
  @IsEnum(DocumentVisibility)
  visibility: DocumentVisibility;
}

export class EditDocumentDto extends CreateDocumentDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Document ID is required' })
  @IsNumber()
  document_id: number;
}

export class GetDocumentDto extends PaginationParam {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(DocumentVisibility)
  visibility: DocumentVisibility;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name: string;
}
