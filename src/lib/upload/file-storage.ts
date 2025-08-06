/**
 * File Storage Utility
 * Handles image uploads and storage management
 * Works with Prisma database for metadata storage
 */

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  storagePath: string;
  publicId?: string;
}

export interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  quality?: number; // 0-100 for compression
}

export class FileStorageService {
  private uploadDir: string;
  private publicUrl: string;

  constructor(
    uploadDir: string = 'public/uploads',
    publicUrl: string = '/uploads'
  ) {
    this.uploadDir = uploadDir;
    this.publicUrl = publicUrl;
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      folder = 'products',
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      maxSize = 5 * 1024 * 1024, // 5MB default
      quality = 85,
    } = options;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Validate file size
    if (file.size > maxSize) {
      throw new Error(
        `File size ${file.size} exceeds maximum allowed size ${maxSize}`
      );
    }

    // Optimize image before upload
    const optimizedFile = await this.optimizeImage(file, quality);

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomId}.${extension}`;
    const storagePath = `${folder}/${filename}`;

    // For now, we'll use a data URL approach but store it efficiently
    // In production, you'd upload to a cloud service here
    const dataUrl = await this.fileToDataUrl(optimizedFile);

    return {
      url: dataUrl, // This will be replaced with actual file URL in production
      filename: file.name,
      size: optimizedFile.size,
      mimeType: optimizedFile.type,
      storagePath,
      publicId: `${folder}/${filename}`,
    };
  }

  /**
   * Convert file to data URL (temporary solution)
   */
  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Optimize image before upload
   */
  private async optimizeImage(file: File, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate optimal dimensions (max 1920x1920)
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          file.type,
          quality / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(_storagePath: string): Promise<void> {
    // In production, this would delete from cloud storage
    // For now, we just return success
    // Debug logging removed for production
  }

  /**
   * Get upload progress (for future implementation)
   */
  onUploadProgress(callback: (_progress: number) => void): void {
    // This can be implemented with XMLHttpRequest or fetch with progress tracking
    // For now, we'll use a simple implementation
    callback(100);
  }

  /**
   * Generate thumbnail URL
   */
  generateThumbnailUrl(
    originalUrl: string,
    _width: number = 150,
    _height: number = 150
  ): string {
    // In production, this would generate a thumbnail URL from your image service
    // For now, return the original URL
    return originalUrl;
  }
}

// Export a default instance
export const fileStorage = new FileStorageService();
