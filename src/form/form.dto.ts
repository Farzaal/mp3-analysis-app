import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsArray } from 'class-validator';

export class CreateFormDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Type is required' })
  @IsString()
  type: string;

  @ApiProperty({ required: true, type: 'object' })
  @IsNotEmpty({ message: 'Schema is required' })
  @IsObject()
  schema: object;
}

export class CreatePreSignedUrlDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Images are required' })
  @IsArray()
  images: string[];
}

export class UpdateSettingDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Settings are required' })
  @IsArray()
  settings: SettingDto[];
}

export class SettingDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Key is required' })
  @IsString()
  key: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'Value is required' })
  @IsObject()
  value: object;
}
