'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePreviewProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

// Helper function to validate image URL
function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  // Check if it's a valid URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ImagePreview({
  src,
  alt = 'Image',
  className,
  fallbackClassName,
  size = 'md',
  rounded = true,
}: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);

  // Don't render image if URL is invalid or there's an error
  if (!src || !isValidImageUrl(src) || imageError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800',
          sizeClasses[size],
          rounded && 'rounded-lg',
          fallbackClassName
        )}
      >
        <ImageIcon className="h-1/2 w-1/2 text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        sizeClasses[size],
        rounded && 'rounded-lg',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        sizes={`(max-width: 768px) 100vw, ${sizeClasses[size].split(' ')[1]}`}
        unoptimized={src.includes('unsplash.com')} // Skip optimization for external images
      />
    </div>
  );
}
