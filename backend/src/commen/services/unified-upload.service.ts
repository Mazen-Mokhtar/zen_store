import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary, AdminAndResourceOptions } from 'cloudinary';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import * as crypto from 'crypto';

// File validation configurations
export const FileValidation = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  },
  video: {
    mimeTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/quicktime'],
    maxSize: 500 * 1024 * 1024, // 500MB
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.qt']
  },
  document: {
    mimeTypes: ['application/pdf', 'text/plain', 'application/json'],
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: ['.pdf', '.txt', '.json']
  }
};

// Upload configurations for different contexts
export const UploadConfigs = {
  game: {
    folder: 'games',
    allowedTypes: ['image', 'video'],
    maxFiles: 10,
    maxTotalSize: 1024 * 1024 * 1024, // 1GB total
  },
  profile: {
    folder: 'profiles',
    allowedTypes: ['image'],
    maxFiles: 1,
    maxTotalSize: 10 * 1024 * 1024, // 10MB
  },
  category: {
    folder: 'categories',
    allowedTypes: ['image'],
    maxFiles: 1,
    maxTotalSize: 5 * 1024 * 1024, // 5MB
  },
  package: {
    folder: 'packages',
    allowedTypes: ['image'],
    maxFiles: 1,
    maxTotalSize: 5 * 1024 * 1024, // 5MB
  }
};

export interface IAttachments {
  secure_url?: string;
  public_id?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  created_at?: string;
}

export interface UploadResult {
  success: boolean;
  data?: IAttachments | IAttachments[];
  error?: string;
  metadata?: {
    totalSize: number;
    fileCount: number;
    processingTime: number;
  };
}

export interface UploadOptions {
  folder?: string;
  context?: keyof typeof UploadConfigs;
  transformation?: any;
  eager?: boolean;
  quality?: string | number;
  format?: string;
}

@Injectable()
export class UnifiedUploadService {
  private readonly logger = new Logger(UnifiedUploadService.name);
  private readonly uploadStats = new Map<string, { count: number; totalSize: number; lastUpload: Date }>();

  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
      cloud_name: process.env.CLOUD_NAME,
      secure: true,
    });
  }

  /**
   * Create multer configuration for file uploads
   */
  createMulterConfig(context?: keyof typeof UploadConfigs) {
    const config = context ? UploadConfigs[context] : null;
    
    return {
      storage: diskStorage({
        destination: './temp-uploads',
        filename: (req, file, callback) => {
          // Generate secure filename
          const uniqueSuffix = crypto.randomBytes(16).toString('hex');
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: config?.maxTotalSize || 1024 * 1024 * 1024, // Default 1GB
        files: config?.maxFiles || 10,
        fieldSize: 50 * 1024 * 1024, // 50MB max field size
        fieldNameSize: 200,
        fields: 30,
        parts: 1000,
        headerPairs: 2000,
      },
      fileFilter: (req: Request, file: Express.Multer.File, callback: Function) => {
        this.validateFile(file, context, callback);
      },
    };
  }

  /**
   * Upload single file to Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const startTime = Date.now();
    
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Validate file
      this.validateFileSync(file, options.context);

      // Generate folder path
      const folderPath = this.generateFolderPath(options);

      // Prepare upload options
      const uploadOptions = {
        folder: folderPath,
        resource_type: 'auto' as const,
        timeout: 600000, // 10 minutes
        chunk_size: 6000000, // 6MB chunks
        eager_async: options.eager || true,
        use_filename: true,
        unique_filename: true,
        quality: options.quality || 'auto',
        format: options.format,
        transformation: options.transformation,
        // Add metadata
        context: {
          upload_context: options.context || 'general',
          upload_time: new Date().toISOString(),
        },
      };

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, uploadOptions);

      // Update statistics
      this.updateUploadStats(options.context || 'general', file.size);

      const processingTime = Date.now() - startTime;
      
      this.logger.log(
        `File uploaded successfully: ${result.public_id} (${file.size} bytes, ${processingTime}ms)`
      );

      return {
        success: true,
        data: {
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          created_at: result.created_at,
        },
        metadata: {
          totalSize: file.size,
          fileCount: 1,
          processingTime,
        },
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Upload failed',
        metadata: {
          totalSize: file?.size || 0,
          fileCount: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadFiles(
    files: Express.Multer.File[],
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const startTime = Date.now();
    
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      // Validate total size and count
      const config = options.context ? UploadConfigs[options.context] : null;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      if (config) {
        if (files.length > config.maxFiles) {
          throw new BadRequestException(`Too many files. Maximum allowed: ${config.maxFiles}`);
        }
        if (totalSize > config.maxTotalSize) {
          throw new BadRequestException(`Total file size too large. Maximum allowed: ${config.maxTotalSize} bytes`);
        }
      }

      // Upload files concurrently with limit
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.allSettled(uploadPromises);

      // Process results
      const successful: IAttachments[] = [];
      const errors: string[] = [];
      let totalProcessedSize = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successful.push(result.value.data as IAttachments);
          totalProcessedSize += files[index].size;
        } else {
          const error = result.status === 'rejected' 
            ? result.reason.message 
            : (result.value as UploadResult).error;
          errors.push(`File ${index + 1}: ${error}`);
        }
      });

      const processingTime = Date.now() - startTime;

      if (successful.length === 0) {
        throw new BadRequestException(`All uploads failed: ${errors.join(', ')}`);
      }

      // Log partial failures
      if (errors.length > 0) {
        this.logger.warn(`Partial upload failure: ${errors.join(', ')}`);
      }

      return {
        success: true,
        data: successful,
        metadata: {
          totalSize: totalProcessedSize,
          fileCount: successful.length,
          processingTime,
        },
      };
    } catch (error) {
      this.logger.error(`Batch upload failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Batch upload failed',
        metadata: {
          totalSize: files?.reduce((sum, file) => sum + file.size, 0) || 0,
          fileCount: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Delete single file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        this.logger.log(`File deleted successfully: ${publicId}`);
        return { success: true };
      } else {
        throw new Error(`Deletion failed: ${result.result}`);
      }
    } catch (error) {
      this.logger.error(`Delete failed for ${publicId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete multiple files from Cloudinary
   */
  async deleteFiles(
    publicIds: string[],
    options?: AdminAndResourceOptions
  ): Promise<{ success: boolean; deleted: string[]; failed: string[]; error?: string }> {
    try {
      const result = await cloudinary.api.delete_resources(
        publicIds,
        options || { type: 'upload', resource_type: 'auto' }
      );

      const deleted = Object.keys(result.deleted).filter(
        id => result.deleted[id] === 'deleted'
      );
      const failed = Object.keys(result.deleted).filter(
        id => result.deleted[id] !== 'deleted'
      );

      this.logger.log(`Batch delete completed: ${deleted.length} deleted, ${failed.length} failed`);

      return {
        success: true,
        deleted,
        failed,
      };
    } catch (error) {
      this.logger.error(`Batch delete failed: ${error.message}`);
      return {
        success: false,
        deleted: [],
        failed: publicIds,
        error: error.message,
      };
    }
  }

  /**
   * Delete all files in a folder
   */
  async deleteFolderAssets(folderPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await cloudinary.api.delete_resources_by_prefix(folderPath);
      this.logger.log(`Folder assets deleted: ${folderPath}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Folder deletion failed for ${folderPath}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get upload statistics
   */
  getUploadStats(context?: string) {
    if (context) {
      return this.uploadStats.get(context) || { count: 0, totalSize: 0, lastUpload: null };
    }
    
    const allStats = Array.from(this.uploadStats.entries()).reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, any>
    );
    
    return allStats;
  }

  /**
   * Clear upload statistics
   */
  clearUploadStats(context?: string) {
    if (context) {
      this.uploadStats.delete(context);
    } else {
      this.uploadStats.clear();
    }
  }

  // Private helper methods

  private validateFile(
    file: Express.Multer.File,
    context: keyof typeof UploadConfigs | undefined,
    callback: Function
  ) {
    try {
      this.validateFileSync(file, context);
      callback(null, true);
    } catch (error) {
      callback(error, false);
    }
  }

  private validateFileSync(file: Express.Multer.File, context?: keyof typeof UploadConfigs) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Get allowed types for context
    const config = context ? UploadConfigs[context] : null;
    const allowedTypes = config?.allowedTypes || ['image', 'video', 'document'];

    // Check file type
    let isValidType = false;
    for (const type of allowedTypes) {
      const validation = FileValidation[type as keyof typeof FileValidation];
      if (validation.mimeTypes.includes(file.mimetype)) {
        // Check file size for this type
        if (file.size > validation.maxSize) {
          throw new BadRequestException(
            `File too large. Maximum size for ${type}: ${validation.maxSize} bytes`
          );
        }
        isValidType = true;
        break;
      }
    }

    if (!isValidType) {
      const allowedMimeTypes = allowedTypes
        .flatMap(type => FileValidation[type as keyof typeof FileValidation].mimeTypes)
        .join(', ');
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes}`
      );
    }

    // Additional security checks
    this.performSecurityChecks(file);
  }

  private performSecurityChecks(file: Express.Multer.File) {
    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.(php|jsp|asp|aspx|exe|bat|cmd|sh|ps1)$/i,
      /\.(htaccess|\.env)$/i,
      /[<>:"|?*]/,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.originalname)) {
        throw new BadRequestException('Suspicious file name detected');
      }
    }

    // Check file size limits
    if (file.size <= 0) {
      throw new BadRequestException('Empty file not allowed');
    }

    if (file.size > 1024 * 1024 * 1024) { // 1GB absolute limit
      throw new BadRequestException('File too large (absolute limit: 1GB)');
    }
  }

  private generateFolderPath(options: UploadOptions): string {
    const baseFolder = process.env.APP_NAME || 'zen-store';
    const contextFolder = options.context ? UploadConfigs[options.context].folder : 'general';
    const customFolder = options.folder || '';
    
    // Generate unique subfolder
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const randomId = crypto.randomInt(100000, 999999).toString();
    
    return `${baseFolder}/${contextFolder}/${timestamp}/${randomId}${customFolder ? '/' + customFolder : ''}`;
  }

  private updateUploadStats(context: string, fileSize: number) {
    const current = this.uploadStats.get(context) || { count: 0, totalSize: 0, lastUpload: new Date() };
    
    this.uploadStats.set(context, {
      count: current.count + 1,
      totalSize: current.totalSize + fileSize,
      lastUpload: new Date(),
    });
  }
}

// Export factory function for multer configuration
export function createUploadConfig(context?: keyof typeof UploadConfigs) {
  const uploadService = new UnifiedUploadService();
  return uploadService.createMulterConfig(context);
}