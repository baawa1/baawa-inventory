'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { IconPackages, IconPhoto } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/utils/image';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallback?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function ProductImage({ 
  src, 
  alt, 
  size = 'md', 
  className,
  fallback 
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Normalize the image URL to handle Supabase storage paths
  const normalizedSrc = normalizeImageUrl(src);

  // Check if we have a valid image source
  // Handle cases where src is the string "undefined", "null", or actually undefined/null
  const hasValidSrc = normalizedSrc && 
                      normalizedSrc.trim() !== '' && 
                      normalizedSrc !== 'undefined' && 
                      normalizedSrc !== 'null' && 
                      !imageError;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Fallback component
  const renderFallback = () => {
    if (fallback) {
      return fallback;
    }

    return (
      <div className={cn(
        'flex items-center justify-center rounded-md border border-dashed bg-gray-50 text-gray-400',
        sizeClasses[size],
        className
      )}>
        <IconPackages className={iconSizes[size]} />
      </div>
    );
  };

  // If no source or error occurred, show fallback
  if (!hasValidSrc) {
    return renderFallback();
  }

  return (
    <div className={cn(
      'relative overflow-hidden rounded-md border bg-gray-50',
      sizeClasses[size],
      className
    )}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        </div>
      )}
      
      <Image
        src={normalizedSrc}
        alt={alt}
        fill
        className={cn(
          'object-cover transition-opacity duration-200',
          imageLoading ? 'opacity-0' : 'opacity-100'
        )}
        sizes={size === 'sm' ? '32px' : size === 'md' ? '48px' : '64px'}
        onError={handleImageError}
        onLoad={handleImageLoad}
        // Remove problematic properties that might cause issues
        priority={false}
      />
    </div>
  );
}

export default ProductImage;