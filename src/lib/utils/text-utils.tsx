import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface TruncateOptions {
  maxLength: number;
  suffix?: string;
  showTooltip?: boolean;
  className?: string;
}

export const smartTruncate = (
  text: string, 
  options: TruncateOptions
): string => {
  const { maxLength, suffix = '...' } = options;
  
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  showTooltip?: boolean;
  className?: string;
  tooltipClassName?: string;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({ 
  text, 
  maxLength = 20, 
  showTooltip = true,
  className = "truncate",
  tooltipClassName
}) => {
  const shouldTruncate = text && text.length > maxLength;
  const truncatedText = shouldTruncate ? smartTruncate(text, { maxLength }) : text;
  
  if (!shouldTruncate || !showTooltip) {
    return <span className={className}>{truncatedText}</span>;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-help", className)}>{truncatedText}</span>
        </TooltipTrigger>
        <TooltipContent className={tooltipClassName}>
          <p className="max-w-xs break-words">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Helper for description truncation with consistent behavior
export const TruncatedDescription: React.FC<{
  description?: string | null;
  maxLength?: number;
  className?: string;
  emptyText?: string;
}> = ({ 
  description, 
  maxLength = 50, 
  className = "text-xs sm:text-sm text-muted-foreground truncate",
  emptyText = "-"
}) => {
  if (!description) {
    return <span className={className}>{emptyText}</span>;
  }

  return (
    <TruncatedText 
      text={description}
      maxLength={maxLength}
      className={className}
      showTooltip={true}
    />
  );
};

// Helper for contact information truncation
export const TruncatedContact: React.FC<{
  contact: string;
  type?: 'phone' | 'email';
  maxLength?: number;
  className?: string;
}> = ({ 
  contact, 
  type,
  maxLength = 15, 
  className = "text-xs text-blue-600 hover:text-blue-800 truncate"
}) => {
  const href = type === 'phone' ? `tel:${contact}` : type === 'email' ? `mailto:${contact}` : undefined;
  
  const truncatedContact = contact.length > maxLength 
    ? smartTruncate(contact, { maxLength })
    : contact;

  if (href) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a href={href} className={className}>
              {truncatedContact}
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>{contact}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TruncatedText 
      text={contact}
      maxLength={maxLength}
      className={className}
      showTooltip={true}
    />
  );
};

// Helper for address truncation
export const TruncatedAddress: React.FC<{
  address?: string | null;
  city?: string | null;
  state?: string | null;
  maxLength?: number;
  className?: string;
}> = ({ 
  address, 
  city, 
  state,
  maxLength = 30, 
  className = "text-xs sm:text-sm"
}) => {
  const fullAddress = [address, city, state].filter(Boolean).join(', ');
  
  if (!fullAddress) {
    return <span className={className}>-</span>;
  }

  return (
    <div className={className}>
      {address && (
        <TruncatedText 
          text={address}
          maxLength={maxLength}
          className="block"
          showTooltip={true}
        />
      )}
      {(city || state) && (
        <div className="text-muted-foreground mt-0.5">
          {[city, state].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
};