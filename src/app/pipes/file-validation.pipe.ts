import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // Validate file type
    if (!file.mimetype || !file.mimetype.includes("audio/mpeg")) {
      throw new BadRequestException("Only MP3 files are allowed");
    }

    // Validate file size (3GB limit)
    const maxSize = 3 * 1024 * 1024 * 1024; // 3GB
    if (file.size > maxSize) {
      throw new BadRequestException("File size too large. Maximum size is 3GB");
    }

    return file;
  }
}
