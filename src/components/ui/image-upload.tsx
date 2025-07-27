'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImagePreview } from '@/components/ui/image-preview';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UPLOAD_LIMITS } from '@/lib/constants';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onError?: (error: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  folder?: string;
  alt?: string;
}

export function ImageUpload({
  value,
  onChange,
  onError,
  label = 'Image',
  placeholder = 'Upload an image',
  disabled = false,
  className,
  folder = 'categories',
  alt = 'Uploaded image',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    // Debug logging removed for production

    // Validate file type
    if (!UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      const error = `${file.name} is not a valid image file. Allowed types: ${UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES.join(', ')}`;
      toast.error(error);
      onError?.(error);
      return;
    }

    // Validate file size
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
      const error = `${file.name} is too large. Maximum size is ${Math.round(UPLOAD_LIMITS.MAX_FILE_SIZE / 1024 / 1024)}MB`;
      toast.error(error);
      onError?.(error);
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    // Debug logging removed for production

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('quality', '85');

      // Debug logging removed for production
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Debug logging removed for production
      if (!response.ok) {
        const error = await response.json();
        console.error('Upload response error:', error);
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      // Debug logging removed for production
      onChange(result.url);
      toast.success('Image uploaded successfully!');

      // Reset the file input to allow the same file to be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && <Label>{label}</Label>}

      {value ? (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <ImagePreview src={value} alt={alt} size="lg" className="border" />
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || uploading}
                className="text-red-600 hover:text-red-700"
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={e => handleFileSelect(e.target.files)}
            disabled={disabled || uploading}
          />

          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {placeholder}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Drag and drop or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Supports JPG, PNG, WebP. Max{' '}
                    {Math.round(UPLOAD_LIMITS.MAX_FILE_SIZE / 1024 / 1024)}MB.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
