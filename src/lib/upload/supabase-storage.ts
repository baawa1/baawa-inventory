/**
 * Supabase Storage Integration
 * Handles file uploads to Supabase Storage
 * Production-ready file storage solution
 */

import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  storagePath: string;
  publicId: string;
}

export interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  quality?: number; // 0-100 for compression
}

class SupabaseStorageService {
  private supabase;
  private bucketName: string;
  private isServer: boolean;

  constructor(isServer: boolean = false) {
    this.isServer = isServer;
    this.bucketName = "product-images";

    if (isServer) {
      // Server-side client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase server configuration is missing");
      }

      this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      // Client-side client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase client configuration is missing");
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      folder = "products",
      allowedTypes = ["image/jpeg", "image/png", "image/webp"],
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

    // Optimize image before upload (only on client-side)
    let optimizedFile = file;
    if (!this.isServer) {
      optimizedFile = await this.optimizeImage(file, quality);
    }

    // Use the provided filename instead of generating a random one
    // This allows meaningful filenames to be passed from ProductImageManager
    let filename = file.name;
    let storagePath = `${folder}/${filename}`;

    // Handle filename conflicts by adding a suffix if the file already exists
    let conflictCounter = 1;
    while (true) {
      try {
        // Check if file already exists
        const { data: existingFile } = await this.supabase.storage
          .from(this.bucketName)
          .list(folder, {
            search: filename,
            limit: 1,
          });

        if (existingFile && existingFile.length > 0) {
          // File exists, create a new filename with suffix
          const nameWithoutExt = filename.substring(
            0,
            filename.lastIndexOf(".")
          );
          const extension = filename.substring(filename.lastIndexOf("."));
          filename = `${nameWithoutExt}_${conflictCounter}${extension}`;
          storagePath = `${folder}/${filename}`;
          conflictCounter++;
        } else {
          // No conflict, break the loop
          break;
        }
      } catch (_error) {
        // If listing fails, assume no conflict and proceed
        break;
      }
    }

    try {
      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(storagePath, optimizedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      return {
        url: urlData.publicUrl,
        filename: filename, // Use the meaningful filename
        size: optimizedFile.size,
        mimeType: optimizedFile.type,
        storagePath,
        publicId: data.path,
      };
    } catch (error) {
      logger.upload("Supabase file upload failed", {
        filename: file.name,
        size: file.size,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Optimize image before upload (client-side only)
   */
  private async optimizeImage(file: File, quality: number): Promise<File> {
    if (this.isServer) {
      return file; // No optimization on server-side
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
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
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              reject(new Error("Failed to optimize image"));
            }
          },
          file.type,
          quality / 100
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([storagePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      logger.upload("Supabase file deletion failed", {
        storagePath,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get upload progress (for future implementation)
   */
  onUploadProgress(callback: (progress: number) => void): void {
    // Supabase doesn't provide upload progress in the client SDK
    // This would need to be implemented with XMLHttpRequest for progress tracking
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
    // Supabase Storage doesn't provide automatic image transformations
    // You would need to implement this with a separate image processing service
    // For now, return the original URL
    return originalUrl;
  }

  /**
   * Check if bucket exists and create if needed
   */
  async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error } =
        await this.supabase.storage.listBuckets();

      if (error) {
        throw new Error(`Failed to list buckets: ${error.message}`);
      }

      const bucketExists = buckets.some(
        (bucket) => bucket.name === this.bucketName
      );

      if (!bucketExists) {
        const { error: createError } = await this.supabase.storage.createBucket(
          this.bucketName,
          {
            public: true,
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
            fileSizeLimit: 5242880, // 5MB
          }
        );

        if (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`);
        }
      }
    } catch (error) {
      logger.upload("Supabase bucket setup failed", {
        bucketName: this.bucketName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export client-side and server-side instances
export const supabaseStorage = new SupabaseStorageService(false); // Client-side
export const supabaseStorageServer = new SupabaseStorageService(true); // Server-side
