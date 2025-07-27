/**
 * Cloud Storage Utility
 * Handles image uploads to cloud storage services
 * Currently implements a simple file upload that can be replaced with any cloud provider
 */

import { logger } from '@/lib/logger';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  publicId?: string; // For cloud storage services that return public IDs
}

export interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  quality?: number; // 0-100 for compression
}

export class CloudStorageService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api/upload', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Upload a file to cloud storage
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

    // Create form data
    const formData = new FormData();
    formData.append('file', optimizedFile);
    formData.append('folder', folder);
    formData.append('quality', quality.toString());

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
        headers: this.apiKey
          ? {
              Authorization: `Bearer ${this.apiKey}`,
            }
          : {},
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();

      return {
        url: result.url,
        filename: result.filename || file.name,
        size: result.size || optimizedFile.size,
        mimeType: result.mimeType || optimizedFile.type,
        publicId: result.publicId,
      };
    } catch (error) {
      logger.upload('Cloud storage upload failed', {
        filename: file.name,
        size: file.size,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
   * Delete a file from cloud storage
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}?publicId=${publicId}`, {
        method: 'DELETE',
        headers: this.apiKey
          ? {
              Authorization: `Bearer ${this.apiKey}`,
            }
          : {},
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }
    } catch (error) {
      logger.upload('Cloud storage deletion failed', {
        storagePath: publicId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get upload progress (for future implementation)
   */
  onUploadProgress(callback: (progress: number) => void): void {
    // This can be implemented with XMLHttpRequest or fetch with progress tracking
    // For now, we'll use a simple implementation
    callback(100);
  }
}

// Export a default instance
export const cloudStorage = new CloudStorageService();
