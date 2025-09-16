import React from 'react';
import { cn } from '@/lib/utils';

export interface MobileCardTitleProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export const MobileCardTitle: React.FC<MobileCardTitleProps> = ({ 
  icon, 
  title, 
  subtitle, 
  className,
  children 
}) => {
  return (
    <div className={cn("flex items-start gap-3 mb-3", className)}>
      {icon && (
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base leading-tight mb-1 text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground leading-tight mb-2">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

export interface MobileCardSubtitleItem {
  label: string;
  value?: string | number | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  href?: string;
}

export interface MobileCardSubtitleProps {
  items: MobileCardSubtitleItem[];
  className?: string;
  maxItems?: number;
}

export const MobileCardSubtitle: React.FC<MobileCardSubtitleProps> = ({ 
  items, 
  className,
  maxItems = 4 
}) => {
  const visibleItems = items.slice(0, maxItems);
  const hasMoreItems = items.length > maxItems;
  
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
        {visibleItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-gray-300">•</span>}
            <div className={cn("flex items-center gap-1.5 min-w-0", item.className)}>
              {item.icon && (
                <span className="text-gray-400 flex-shrink-0">
                  {item.icon}
                </span>
              )}
              {item.href ? (
                <a 
                  href={item.href}
                  className="hover:text-blue-600 transition-colors truncate font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate">
                    {item.label}
                    {item.value && (typeof item.value === 'string' || typeof item.value === 'number') 
                      ? `: ${item.value}` 
                      : ''
                    }
                  </span>
                </a>
              ) : (
                <span className="truncate">
                  <span className="font-medium text-gray-600">{item.label}:</span>
                  {item.value && (typeof item.value === 'string' || typeof item.value === 'number') 
                    ? ` ${item.value}` 
                    : ''
                  }
                  {item.value && typeof item.value !== 'string' && typeof item.value !== 'number' && (
                    <span className="ml-1">{item.value}</span>
                  )}
                </span>
              )}
            </div>
          </React.Fragment>
        ))}
        {hasMoreItems && (
          <span className="text-xs text-gray-400">+{items.length - maxItems} more</span>
        )}
      </div>
    </div>
  );
};

export interface IconWrapperProps {
  children: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ 
  children, 
  bgColor = 'bg-gray-100', 
  textColor = 'text-gray-600',
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-13 h-13'
  };
  
  const iconSizeClasses = {
    sm: '[&>*]:w-4 [&>*]:h-4',
    md: '[&>*]:w-5 [&>*]:h-5',
    lg: '[&>*]:w-7 [&>*]:h-7'
  };

  return (
    <div className={cn(
      sizeClasses[size], 
      bgColor, 
      textColor,
      iconSizeClasses[size],
      "rounded-lg flex items-center justify-center flex-shrink-0",
      className
    )}>
      {children}
    </div>
  );
};

// Pre-configured icon wrappers for different entity types
export const ProductIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <IconWrapper 
    bgColor="bg-blue-100" 
    textColor="text-blue-600" 
    size="md" 
    className={className}
  >
    {children}
  </IconWrapper>
);

export const CategoryIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <IconWrapper 
    bgColor="bg-green-100" 
    textColor="text-green-600" 
    size="md" 
    className={className}
  >
    {children}
  </IconWrapper>
);

export const BrandIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <IconWrapper 
    bgColor="bg-purple-100" 
    textColor="text-purple-600" 
    size="md" 
    className={className}
  >
    {children}
  </IconWrapper>
);

export const SupplierIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <IconWrapper 
    bgColor="bg-orange-100" 
    textColor="text-orange-600" 
    size="md" 
    className={className}
  >
    {children}
  </IconWrapper>
);

export const CouponIconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <IconWrapper 
    bgColor="bg-pink-100" 
    textColor="text-pink-600" 
    size="md" 
    className={className}
  >
    {children}
  </IconWrapper>
);

// Enhanced card component for critical information display
export interface MobileCardHighlightProps {
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const MobileCardHighlight: React.FC<MobileCardHighlightProps> = ({
  label,
  value,
  trend,
  variant = 'default',
  className
}) => {
  const variantStyles = {
    default: 'bg-gray-50 text-gray-900 border-gray-200',
    success: 'bg-green-50 text-green-900 border-green-200',
    warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
    danger: 'bg-red-50 text-red-900 border-red-200'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600', 
    neutral: 'text-gray-500'
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium",
      variantStyles[variant],
      className
    )}>
      <div className="flex flex-col">
        <span className="text-xs font-normal opacity-75 leading-tight">{label}</span>
        <span className="font-semibold leading-tight">{value}</span>
      </div>
      {trend && (
        <div className={cn("text-xs font-medium", trendColors[trend.direction])}>
          {trend.direction === 'up' && '↗'}
          {trend.direction === 'down' && '↘'}
          {trend.direction === 'neutral' && '→'}
          {trend.value && <span className="ml-1">{trend.value}</span>}
        </div>
      )}
    </div>
  );
};

// Enhanced card layout component for better information architecture
export interface MobileCardContentProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  highlights?: React.ReactNode[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const MobileCardContent: React.FC<MobileCardContentProps> = ({
  title,
  subtitle,
  highlights,
  actions,
  children,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Title and actions row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {title}
          {subtitle}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {/* Highlights row */}
      {highlights && highlights.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {highlights}
        </div>
      )}
      
      {/* Additional content */}
      {children}
    </div>
  );
};

// Utility component for consistent card spacing and interaction
export interface MobileCardWrapperProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
  isLoading?: boolean;
}

export const MobileCardWrapper: React.FC<MobileCardWrapperProps> = ({
  children,
  onClick,
  className,
  isSelected = false,
  isLoading = false
}) => {
  return (
    <div
      className={cn(
        "p-4 bg-white rounded-xl border border-gray-200 transition-all duration-200",
        "shadow-sm hover:shadow-md",
        onClick && "cursor-pointer hover:border-gray-300 active:scale-[0.98] touch-manipulation",
        isSelected && "border-blue-500 bg-blue-50/30 shadow-md ring-1 ring-blue-500/20",
        isLoading && "opacity-60 pointer-events-none animate-pulse",
        className
      )}
      onClick={onClick}
      // Improve touch responsiveness
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </div>
  );
};