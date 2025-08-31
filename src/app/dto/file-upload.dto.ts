import { ApiProperty } from "@nestjs/swagger";

export class FileUploadDto {
  @ApiProperty({
    type: "string",
    format: "binary",
    description: "MP3 file to analyze",
    required: true,
  })
  file: Express.Multer.File;
}

