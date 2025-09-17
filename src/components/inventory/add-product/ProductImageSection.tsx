'use client';

import { useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Star,
  StarOff,
  Image as ImageIcon,
  Trash2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { createProductSchema } from '@/lib/validations/product';
import { z } from 'zod';
import {
  generateMeaningfulFilename,
  generateAltText,
  ensureUniqueImages,
  sortImages,
} from '@/lib/utils/image-utils';
import { logger } from '@/lib/logger';
import { normalizeImageUrl } from '@/lib/utils/image';

type CreateProductData = z.infer<typeof createProductSchema>;
type ProductImageType = CreateProductData['images'][number];

interface ProductImageSectionProps {
  form: UseFormReturn<any>;
  images: CreateProductData['images'];
  onImagesChange: (images: CreateProductData['images']) => void;
  onUploadingChange?: (isUploading: boolean) => void;
}

export function ProductImageSection({
  form,
  images,
  onImagesChange,
  onUploadingChange,
}: ProductImageSectionProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productName = form.watch('name') || 'Product';
  const categoryName = form.watch('categoryId') ? 'Category' : undefined;
  const brandName = form.watch('brandId') ? 'Brand' : undefined;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    uploadImages(validFiles);
  };

  const uploadImages = async (files: File[]) => {
    setUploading(true);
    onUploadingChange?.(true);
    const newImages: ProductImageType[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageIndex = images.length + i;

        // Generate meaningful filename
        const meaningfulFilename = generateMeaningfulFilename(
          file.name,
          imageIndex,
          productName,
          brandName,
          categoryName
        );

        // Create a new File object with the meaningful filename
        const renamedFile = new File([file], meaningfulFilename, {
          type: file.type,
          lastModified: file.lastModified,
        });

        // Upload file using the new storage system
        const formData = new FormData();
        formData.append('file', renamedFile);
        formData.append('folder', 'products');
        formData.append('quality', '85');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const uploadResult = await response.json();

        const imageData: ProductImageType = {
          url: uploadResult.url,
          filename: meaningfulFilename,
          size: uploadResult.size || file.size,
          mimeType: uploadResult.mimeType,
          alt: generateAltText(
            productName,
            brandName,
            categoryName,
            imageIndex
          ),
          isPrimary: images.length === 0 && newImages.length === 0, // First image is primary
          uploadedAt: new Date().toISOString(),
        };

        newImages.push(imageData);
      }

      const updatedImages = [...images, ...newImages];
      const uniqueUpdatedImages = ensureUniqueImages(sortImages(updatedImages));
      onImagesChange(uniqueUpdatedImages);
      toast.success(`${newImages.length} image(s) uploaded successfully`);
    } catch (error) {
      logger.error('Product image upload failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload images'
      );
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
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

  const setPrimaryImage = (imageUrl: string) => {
    let updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.url === imageUrl,
    }));

    // Move the primary image to the front
    const primaryIndex = updatedImages.findIndex(img => img.url === imageUrl);
    if (primaryIndex > 0) {
      const [primaryImage] = updatedImages.splice(primaryIndex, 1);
      updatedImages = [primaryImage, ...updatedImages];
    }

    const uniqueUpdatedImages = ensureUniqueImages(updatedImages);
    onImagesChange(uniqueUpdatedImages);
  };

  const deleteImage = (imageUrl: string) => {
    const updatedImages = images.filter(img => img.url !== imageUrl);

    // If we deleted the primary image and there are other images, make the first one primary
    if (updatedImages.length > 0) {
      const hasPrimary = updatedImages.some(img => img.isPrimary);
      if (!hasPrimary) {
        updatedImages[0].isPrimary = true;
      }
    }

    onImagesChange(updatedImages);
    toast.success('Image deleted successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Product Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={e => handleFileSelect(e.target.files)}
          />

          <div className="flex flex-col items-center gap-3">
            <Upload className="h-10 w-10 text-gray-400" />
            <div>
              <p className="font-medium">
                Drag and drop images here, or{' '}
                <Button
                  type="button"
                  variant="link"
                  className="text-primary h-auto p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse files
                </Button>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Supports JPG, PNG, WebP. Maximum 5MB per image.
              </p>
            </div>
          </div>
        </div>

        {uploading && (
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-700">Uploading images...</p>
          </div>
        )}

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Images ({images.length})
            </Label>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-3">
              {images.map(image => (
                <div
                  key={image.url}
                  className="group relative"
                >
                  <Card className="overflow-hidden">
                    <div className="relative aspect-square">
                      <Image
                        src={normalizeImageUrl(image.url)!}
                        alt={image.alt || image.filename || 'Product image'}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                        className="object-cover"
                        onError={() => {
                          logger.error('Product image failed to load', {
                            imageUrl: image.url,
                          });
                        }}
                      />

                      {/* Primary Badge */}
                      {image.isPrimary && (
                        <Badge className="absolute top-1 left-1 bg-yellow-500 text-white text-xs">
                          <Star className="mr-1 h-2 w-2" />
                          Primary
                        </Badge>
                      )}

                      {/* Action Buttons */}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Image Preview</DialogTitle>
                            </DialogHeader>
                            <Image
                              src={normalizeImageUrl(image.url)!}
                              alt={image.alt || image.filename}
                              width={500}
                              height={400}
                              className="h-auto max-h-96 w-full rounded-lg object-contain"
                            />
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Image</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this image?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteImage(image.url)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {image.filename || 'Unknown file'}
                          </p>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant={image.isPrimary ? 'default' : 'outline'}
                          className="ml-1 h-6 px-2"
                          onClick={() => setPrimaryImage(image.url)}
                          disabled={image.isPrimary}
                        >
                          {image.isPrimary ? (
                            <Star className="h-3 w-3" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}