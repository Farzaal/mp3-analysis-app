import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class FileUploadDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "MP3 file to analyze",
    required: false, // Make it optional so pipe can handle undefined case
  })
  @IsOptional()
  file?: Express.Multer.File;
}
