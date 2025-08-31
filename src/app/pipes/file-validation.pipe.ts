import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File | undefined) {
    // Handle case where no file is uploaded
    if (!file) {
      throw new BadRequestException(
        "No file uploaded. Please select an MP3 file to analyze.",
      );
    }

    // Validate file type
    if (!file.mimetype || !file.mimetype.includes("audio/mpeg")) {
      throw new BadRequestException("Only MP3 files are allowed");
    }

    // Validate file size using config value
    const maxSize = 5 * 1024 * 1024 * 1024; // Default to 3GB
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new BadRequestException(
        `File size too large. Maximum size is ${maxSizeMB}MB`,
      );
    }

    return file;
  }
}
