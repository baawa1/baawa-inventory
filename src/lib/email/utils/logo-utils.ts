/**
 * Logo utility functions for email templates
 */

import { getAppBaseUrl } from '@/lib/utils';

export type LogoVariant = 'brand-color' | 'black' | 'white';

/**
 * Get the appropriate logo URL based on context
 * For email templates, use base64 encoded versions for reliability
 */
export const getLogoUrl = (variant: LogoVariant = 'brand-color'): string => {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/logo/baawa-icon-${variant}.png`;
};

/**
 * Get the full logo URL (icon + text) based on context
 */
export const getFullLogoUrl = (
  variant: LogoVariant = 'brand-color'
): string => {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/logo/baawa-logo-${variant}.png`;
};

/**
 * Get logo variant based on email context
 */
export const getLogoVariantForContext = (
  context:
    | 'welcome'
    | 'verification'
    | 'password-reset'
    | 'admin'
    | 'receipt'
    | 'warning'
): LogoVariant => {
  switch (context) {
    case 'welcome':
    case 'verification':
    case 'receipt':
      return 'brand-color';
    case 'password-reset':
    case 'warning':
      return 'black';
    case 'admin':
      return 'white';
    default:
      return 'brand-color';
  }
};

/**
 * Get logo URL for email headers and avatar display
 * This can be used in email metadata for better avatar display
 */
export const getLogoUrlForHeaders = (
  variant: LogoVariant = 'brand-color'
): string => {
  const baseUrl = getAppBaseUrl();
  return `${baseUrl}/logo/baawa-icon-${variant}.png`;
};

/**
 * Get logo HTML for email templates
 * Uses base64 encoded logos for reliable email display
 */
export const getLogoHtml = (
  variant: LogoVariant = 'brand-color',
  size: 'small' | 'medium' | 'large' = 'medium'
): string => {
  const logoUrl = getLogoUrl(variant);
  const sizeClass =
    size === 'small' ? '40px' : size === 'large' ? '80px' : '60px';

  return `
    <div class="logo-container">
      <img src="${logoUrl}" alt="BaaWA Accessories Logo" class="logo-svg" style="width: ${sizeClass}; height: ${sizeClass}; margin-right: 15px; object-fit: contain;">
      <div class="logo-text">BaaWA Accessories</div>
    </div>
  `;
};
