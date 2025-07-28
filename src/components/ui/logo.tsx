import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'brand' | 'black' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  centered?: boolean;
}

const logoVariants = {
  brand: {
    icon: '/logo/baawa-icon-brand-color.png',
    logo: '/logo/baawa-logo-brand-color.png',
  },
  black: {
    icon: '/logo/baawa-icon-black.png',
    logo: '/logo/baawa-logo-black.png',
  },
  white: {
    icon: '/logo/baawa-icon-white.png',
    logo: '/logo/baawa-logo-white.png',
  },
};

const sizeClasses = {
  sm: { icon: 'w-6 h-6', logo: 'w-24 h-6' },
  md: { icon: 'w-8 h-8', logo: 'w-32 h-8' },
  lg: { icon: 'w-10 h-10', logo: 'w-40 h-10' },
  xl: { icon: 'w-12 h-12', logo: 'w-48 h-12' },
};

export function Logo({
  variant = 'brand',
  size = 'md',
  className,
  showText = false,
  centered = false,
}: LogoProps) {
  const variantConfig = logoVariants[variant];
  const sizeConfig = sizeClasses[size];

  // Auth-style logo (just the logo text, centered)
  if (showText && centered) {
    return (
      <div className={cn('flex justify-center', className || 'mb-4')}>
        <Image
          src={variantConfig.logo}
          alt="BaaWA Accessories"
          width={180}
          height={40}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // Icon + text logo (side by side)
  if (showText) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Image
          src={variantConfig.icon}
          alt="BaaWA Accessories"
          width={
            size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48
          }
          height={
            size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48
          }
          className={cn('object-contain', sizeConfig.icon)}
          priority
        />
        <Image
          src={variantConfig.logo}
          alt="BaaWA Accessories"
          width={
            size === 'sm' ? 96 : size === 'md' ? 128 : size === 'lg' ? 160 : 192
          }
          height={
            size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48
          }
          className={cn('object-contain', sizeConfig.logo)}
          priority
        />
      </div>
    );
  }

  // Icon only
  return (
    <Image
      src={variantConfig.icon}
      alt="BaaWA Accessories"
      width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
      height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
      className={cn('object-contain', sizeConfig.icon, className)}
      priority
    />
  );
}
