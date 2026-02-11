import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { UploadFileDto } from '@app/types';

/**
 * Service for handling file uploads to S3-compatible storage providers.
 * Supports MinIO, Yandex Object Storage, Mail.ru Cloud, Selectel, and other S3-compatible services.
 */
@Injectable()
export class FileService implements OnModuleInit {
  private readonly logger = new Logger(FileService.name);
  private readonly s3Client: S3Client;
  private readonly s3PresignClient: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService
      .getOrThrow<string>('S3_ENDPOINT')
      .replace('localhost', 'minio');
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const credentials = {
      accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow<string>(
        'S3_SECRET_ACCESS_KEY',
      ),
    };
    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials,
      forcePathStyle: true,
    });
    this.bucketName = this.configService.getOrThrow<string>('S3_BUCKET');
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL', endpoint);
    this.s3PresignClient = new S3Client({
      region,
      endpoint: this.publicUrl,
      credentials,
      forcePathStyle: true,
    });
    this.logger.log(`S3 client initialized with endpoint: ${endpoint}`);
    this.logger.log(
      `S3 presign client initialized with public URL: ${this.publicUrl}`,
    );
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.logger.log(`Bucket ${this.bucketName} exists.`);
    } catch {
      this.logger.warn(
        `Bucket ${this.bucketName} not found or inaccessible. Attempting to create...`,
      );
      try {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(`Bucket ${this.bucketName} created successfully.`);
      } catch (createError) {
        this.logger.error(
          `Failed to create bucket ${this.bucketName}: ${createError}`,
        );
        throw createError;
      }
    }
  }

  /**
   * Uploads a file to S3-compatible storage.
   * @param uploadDto - File upload data including buffer, filename, and metadata.
   * @returns Public URL of the uploaded file.
   */
  async uploadFile(uploadDto: UploadFileDto): Promise<string> {
    const { file, fileName, mimeType, userId, folder } = uploadDto;
    const fileExt = extname(fileName);
    const uploadFolder = folder || 'avatars';
    const key = `${uploadFolder}/${userId}-${randomUUID()}${fileExt}`;
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: Buffer.from(file),
          ContentType: mimeType,
        }),
      );
      const url = this.buildPublicUrl(key);
      this.logger.log(`File uploaded successfully: ${url}`);
      return url;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error uploading file to S3-compatible storage: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Builds the public URL for the uploaded file.
   * Uses path-style URL format for compatibility with most S3-compatible providers.
   * @param key - The object key in the bucket.
   * @returns Full public URL for the file.
   */
  private buildPublicUrl(key: string): string {
    const baseUrl = this.publicUrl.replace(/\/$/, '');
    return `${baseUrl}/${this.bucketName}/${key}`;
  }

  async getSignedUrl(keyOrUrl: string): Promise<string> {
    const key = this.extractKey(keyOrUrl);
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    // Link valid for 1 hour
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const url = await getSignedUrl(this.s3PresignClient as any, command, {
      expiresIn: 3600,
    });
    return url;
  }

  async getSignedUrls(keysOrUrls: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    // Use Promise.all to sign concurrently
    await Promise.all(
      keysOrUrls.map(async (url) => {
        if (!url) return;
        try {
          result[url] = await this.getSignedUrl(url);
        } catch (error) {
          this.logger.error(`Failed to sign URL: ${url}`, error);
          result[url] = url; // Fallback to original if failed
        }
      }),
    );
    return result;
  }

  private extractKey(url: string): string {
    // If it's a full URL, extract the key
    // Expected format: http://host/bucket/folder/file.ext
    // or just folder/file.ext
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      // pathParts might be ['social-network', 'avatars', 'file.png']
      // shift bucket name if present
      if (pathParts[0] === this.bucketName) {
        pathParts.shift();
      }
      return pathParts.join('/');
    }
    return url;
  }
}
