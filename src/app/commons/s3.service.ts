import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { BunyanLogger } from '@/app/commons/logger.service';

@Injectable()
export class S3Service {
  private readonly s3: S3;
  private readonly bucketName: string;
  private readonly expirationInSeconds: number = 1800;
  private readonly logger: BunyanLogger;
  private readonly mimeTypeMap: Map<string, string> = new Map([
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
    ['png', 'image/png'],
    ['gif', 'image/gif'],
    ['bmp', 'image/bmp'],
    ['tiff', 'image/tiff'],
    ['webp', 'image/webp'],
    ['pdf', 'application/pdf'],
    ['doc', 'application/msword'],
    [
      'docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ['xls', 'application/vnd.ms-excel'],
    [
      'xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    ['ppt', 'application/vnd.ms-powerpoint'],
    [
      'pptx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    ['txt', 'text/plain'],
    ['csv', 'text/csv'],
    ['zip', 'application/zip'],
    ['rar', 'application/x-rar-compressed'],
    ['mp4', 'video/mp4'],
    ['avi', 'video/x-msvideo'],
    ['mov', 'video/quicktime'],
    ['wmv', 'video/x-ms-wmv'],
    ['flv', 'video/x-flv'],
    ['mkv', 'video/x-matroska'],
    ['webm', 'video/webm'],
    ['3gp', 'video/3gpp'],
    ['mpeg', 'video/mpeg'],
    ['mpg', 'video/mpeg'],
  ]);

  constructor(private configService: ConfigService) {
    this.s3 = new S3({
      region: this.configService.get('AWS_S3_REGION'),
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET');
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
  ): Promise<S3.ManagedUpload.SendData[]> {
    const uploads: S3.ManagedUpload.SendData[] = [];

    for (const file of files) {
      const upload = await this.uploadFile(file);
      uploads.push(upload);
    }

    return uploads;
  }

  getFileType(filename: string): string {
    // Define supported file types
    const imageExtensions = new Set([
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'tiff',
      'webp',
    ]);
    const documentExtensions = new Set([
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'csv',
    ]);
    const videoExtensions = new Set([
      'mp4',
      'avi',
      'mov',
      'wmv',
      'flv',
      'mkv',
      'webm',
      '3gp',
      'mpeg',
      'mpg',
    ]);

    const parts = filename.split('.');
    if (parts.length < 2) {
      return 'unknown';
    }

    const extension = parts.pop()?.toLowerCase();

    if (extension && imageExtensions.has(extension)) {
      return 'image';
    } else if (extension && documentExtensions.has(extension)) {
      return 'document';
    } else if (extension && videoExtensions.has(extension)) {
      return 'video';
    }
    return 'unknown';
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<S3.ManagedUpload.SendData> {
    try {
      const key = `${uuidv4()}-${file.originalname}`;

      const params: S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      return this.s3.upload(params).promise();
    } catch (err) {
      return null;
    }
  }

  async getPreSignedURL(key: string): Promise<{
    url: string;
    mime_type: string;
    key: string;
    new_file_name: string;
  }> {
    try {
      const contentType = this.getContentTypeFromMap(key);
      const newFileName = `${uuidv4()}-${key}`;
      const params = {
        Bucket: this.configService.get('AWS_S3_BUCKET'),
        Key: newFileName,
        Expires: this.expirationInSeconds,
        ContentType: contentType,
      };
      const url = await this.s3.getSignedUrlPromise('putObject', params);
      return { url, mime_type: contentType, key, new_file_name: newFileName };
    } catch (error) {
      throw error;
    }
  }

  async getDownloadUrl(key: string): Promise<string> {
    try {
      const params = {
        Bucket: this.configService.get('AWS_S3_BUCKET'),
        Key: key,
        Expires: this.expirationInSeconds,
      };

      return await this.s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      this.logger.error(`Download URL Issue == > ${JSON.stringify(error)}`);
      return null;
    }
  }

  getContentTypeFromMap(fileName: string): string {
    const ext = fileName
      .slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2)
      .toLowerCase();
    return this.mimeTypeMap.get(ext) || 'application/octet-stream';
  }
}
