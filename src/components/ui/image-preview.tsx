"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export function ImagePreview({
  src,
  alt = "Image",
  className,
  fallbackClassName,
  size = "md",
  rounded = true,
}: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
          sizeClasses[size],
          rounded && "rounded-lg",
          fallbackClassName
        )}
      >
        <ImageIcon className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        sizeClasses[size],
        rounded && "rounded-lg",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setImageError(true)}
        sizes={`(max-width: 768px) 100vw, ${sizeClasses[size].split(" ")[1]}`}
      />
    </div>
  );
}
