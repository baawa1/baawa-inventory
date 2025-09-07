'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  Star,
  StarOff,
  Image as ImageIcon,
  Trash2,
  Edit,
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
import { ProductImage } from '@/types/product-images';
import {
  generateMeaningfulFilename,
  generateAltText,
  ensureUniqueImages,
  sortImages,
} from '@/lib/utils/image-utils';
import { logger } from '@/lib/logger';
import { normalizeImageUrl } from '@/lib/utils/image';

interface ProductData {
  id: number;
  name: string;
  sku: string;
  brand?: {
    id: number;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

interface ProductImageManagerProps {
  productId: number;
  productName: string;
  onImagesChange?: (_images: ProductImage[]) => void;
}

interface RawImage {
  url: string;
  filename?: string;
  mimeType?: string;
  alt?: string;
  isPrimary?: boolean;
  uploadedAt?: string;
  size?: number;
}

export function ProductImageManager({
  productId,
  productName: _productName,
  onImagesChange,
}: ProductImageManagerProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch complete product data including brand and category
  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product data');
      return response.json();
    },
  });

  const product: ProductData = productData?.data || {
    id: productId,
    name: _productName,
    sku: '',
    brand: undefined,
    category: undefined,
  };

  // Use utility functions for image processing
  const processImages = (rawImages: (string | RawImage)[]): ProductImage[] => {
    const validatedImages = rawImages.map((img, idx) => {
      if (typeof img === 'string') {
        // Legacy: just a URL string
        return {
          url: img,
          filename: img.split('/').pop() || `image-${idx}`,
          mimeType: 'image/jpeg',
          alt: generateAltText(
            product.name,
            product.brand?.name,
            product.category?.name,
            idx
          ),
          isPrimary: idx === 0,
          uploadedAt: new Date().toISOString(),
          size: 0,
        };
      }
      // New format: object
      return {
        url: String(img.url),
        filename: String(
          img.filename || img.url.split('/').pop() || `image-${idx}`
        ),
        mimeType: String(img.mimeType || 'image/jpeg'),
        alt: img.alt
          ? String(img.alt)
          : generateAltText(
              product.name,
              product.brand?.name,
              product.category?.name,
              idx
            ),
        isPrimary: Boolean(img.isPrimary),
        uploadedAt: String(img.uploadedAt || new Date().toISOString()),
        size: Number(img.size || 0),
      };
    });

    return sortImages(ensureUniqueImages(validatedImages));
  };

  // Fetch product images
  const { data: imageData } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/images`);
      if (!response.ok) throw new Error('Failed to fetch product images');
      return response.json();
    },
  });

  const rawImages = imageData?.images || [];

  // Use utility function to process images
  const images: ProductImage[] = processImages(rawImages).filter(
    img => img.url && img.url.trim() !== ''
  );

  // Update images mutation with optimistic updates
  const updateImagesMutation = useMutation({
    mutationFn: async (updatedImages: ProductImage[]) => {
      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: updatedImages }),
      });
      if (!response.ok) throw new Error('Failed to update images');
      return response.json();
    },
    onMutate: async (updatedImages: ProductImage[]) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['product-images', productId],
      });

      // Snapshot the previous value
      const previousImages = queryClient.getQueryData([
        'product-images',
        productId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(['product-images', productId], {
        images: updatedImages,
      });

      // Return a context object with the snapshotted value
      return { previousImages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product-images', productId],
      });
      toast.success('Images updated successfully');
    },
    onError: (err, updatedImages, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousImages) {
        queryClient.setQueryData(
          ['product-images', productId],
          context.previousImages
        );
      }
      toast.error('Failed to update images');
    },
  });

  // Delete image mutation with optimistic updates
  const deleteImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await fetch(
        `/api/products/${productId}/images?imageUrl=${encodeURIComponent(imageUrl)}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Failed to delete image');
      return response.json();
    },
    onMutate: async (imageUrl: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['product-images', productId],
      });

      // Snapshot the previous value
      const previousImages = queryClient.getQueryData([
        'product-images',
        productId,
      ]);

      // Optimistically remove the image
      const currentImages =
        (previousImages as { images: ProductImage[] })?.images || [];
      const updatedImages = currentImages.filter(
        (img: ProductImage) => img.url !== imageUrl
      );

      // If we deleted the primary image and there are other images, make the first one primary
      const deletedImage = currentImages.find(
        (img: ProductImage) => img.url === imageUrl
      );
      if (deletedImage?.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }

      // Optimistically update to the new value
      queryClient.setQueryData(['product-images', productId], {
        images: updatedImages,
      });

      // Return a context object with the snapshotted value
      return { previousImages };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product-images', productId],
      });
      toast.success('Image deleted successfully');
    },
    onError: (err, imageUrl, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousImages) {
        queryClient.setQueryData(
          ['product-images', productId],
          context.previousImages
        );
      }
      toast.error('Failed to delete image');
    },
  });

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
    const newImages: ProductImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageIndex = images.length + i;

        // Generate meaningful filename
        const meaningfulFilename = generateMeaningfulFilename(
          file.name,
          imageIndex,
          product.name,
          product.brand?.name,
          product.category?.name
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

        const imageData: ProductImage = {
          url: uploadResult.url,
          filename: meaningfulFilename,
          size: uploadResult.size || file.size, // Use upload result size or fallback to file size
          mimeType: uploadResult.mimeType,
          alt: generateAltText(
            product.name,
            product.brand?.name,
            product.category?.name,
            imageIndex
          ),
          isPrimary: images.length === 0 && newImages.length === 0, // First image is primary
          uploadedAt: new Date().toISOString(),
        };

        newImages.push(imageData);
      }

      const updatedImages = [...images, ...newImages];
      // Ensure no duplicates in the final array
      const uniqueUpdatedImages = ensureUniqueImages(updatedImages);
      updateImagesMutation.mutate(uniqueUpdatedImages);
      onImagesChange?.(uniqueUpdatedImages);
    } catch (error) {
      logger.error('Product image upload failed', {
        productId,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload images'
      );
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

  const setPrimaryImage = (imageUrl: string) => {
    // Set only one image as primary and move it to the front immediately
    let updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.url === imageUrl,
    }));

    // Move the primary image to the front for immediate visual feedback
    const primaryIndex = updatedImages.findIndex(img => img.url === imageUrl);
    if (primaryIndex > 0) {
      const [primaryImage] = updatedImages.splice(primaryIndex, 1);
      updatedImages = [primaryImage, ...updatedImages];
    }

    // Ensure no duplicates and validate only one primary image
    const uniqueUpdatedImages = ensureUniqueImages(updatedImages);

    // Double-check that only one image is primary
    const primaryImages = uniqueUpdatedImages.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // If somehow multiple primary images exist, keep only the selected one
      uniqueUpdatedImages.forEach(img => {
        img.isPrimary = img.url === imageUrl;
      });
    }

    // Update immediately for better UX
    updateImagesMutation.mutate(uniqueUpdatedImages);
    onImagesChange?.(uniqueUpdatedImages);
  };

  const deleteImage = (imageUrl: string) => {
    deleteImageMutation.mutate(imageUrl);
  };

  const updateImageAlt = (imageUrl: string, alt: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      alt: img.url === imageUrl ? alt : img.alt,
    }));
    // Ensure no duplicates
    const uniqueUpdatedImages = ensureUniqueImages(updatedImages);
    updateImagesMutation.mutate(uniqueUpdatedImages);
    onImagesChange?.(uniqueUpdatedImages);
    setEditingImage(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upload Area */}
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
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

            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium">
                  Drag and drop images here, or{' '}
                  <Button
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
            <div className="mt-4 rounded-lg bg-blue-50 p-4">
              <p className="text-blue-700">Uploading images...</p>
            </div>
          )}

          {/* Images Grid */}
          {images.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-4 text-lg font-medium">
                Images ({images.length})
              </h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4">
                {images.map(image => {
                  return (
                    <div
                      key={image.url}
                      className="group relative justify-self-stretch"
                    >
                      <Card className="h-full overflow-hidden pt-0">
                        <div className="relative aspect-square">
                          {image.url ? (
                            <Image
                              src={normalizeImageUrl(image.url)!}
                              alt={
                                image.alt || image.filename || 'Product image'
                              }
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="aspect-square w-full object-cover"
                              priority={false}
                              onError={() => {
                                logger.error('Product image failed to load', {
                                  productId,
                                  imageUrl: image.url,
                                });
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-200">
                              <p className="text-sm text-gray-500">No image</p>
                            </div>
                          )}

                          {/* Primary Badge */}
                          {image.isPrimary && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                              <Star className="mr-1 h-3 w-3" />
                              Primary
                            </Badge>
                          )}

                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Image Preview</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Image
                                    src={normalizeImageUrl(image.url)!}
                                    alt={image.alt || image.filename}
                                    width={600}
                                    height={400}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 600px"
                                    className="h-auto max-h-96 w-full rounded-lg object-contain"
                                  />
                                  <div className="text-sm text-gray-600">
                                    <p>
                                      <strong>Filename:</strong>{' '}
                                      {image.filename}
                                    </p>
                                    <p>
                                      <strong>Type:</strong> {image.mimeType}
                                    </p>
                                    <p>
                                      <strong>Alt Text:</strong>{' '}
                                      {image.alt || 'Not set'}
                                    </p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingImage(image);
                                setImageAlt(image.alt || '');
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Image
                                  </AlertDialogTitle>
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

                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {image.filename || 'Unknown file'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {image.alt || 'No alt text'}
                              </p>
                            </div>

                            <Button
                              size="sm"
                              variant={image.isPrimary ? 'default' : 'outline'}
                              className="ml-2"
                              onClick={() => setPrimaryImage(image.url)}
                              disabled={
                                image.isPrimary ||
                                updateImagesMutation.isPending
                              }
                            >
                              {updateImagesMutation.isPending ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : image.isPrimary ? (
                                <Star className="h-4 w-4" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit Alt Text Dialog */}
          {editingImage && (
            <Dialog
              open={!!editingImage}
              onOpenChange={() => setEditingImage(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Image Alt Text</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Image
                      src={normalizeImageUrl(editingImage.url)!}
                      alt={editingImage.alt || editingImage.filename}
                      width={300}
                      height={300}
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="h-auto w-full rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alt-text">Alt Text</Label>
                    <Textarea
                      id="alt-text"
                      value={imageAlt}
                      onChange={e => setImageAlt(e.target.value)}
                      placeholder="Describe this image for accessibility..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateImageAlt(editingImage.url, imageAlt)}
                      disabled={updateImagesMutation.isPending}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingImage(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
