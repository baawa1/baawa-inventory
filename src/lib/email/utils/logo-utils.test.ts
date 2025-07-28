import {
  getLogoUrl,
  getFullLogoUrl,
  getLogoVariantForContext,
} from './logo-utils';

describe('Logo Utils', () => {
  describe('getLogoUrl', () => {
    it('should return base64 logo URL by default for emails', () => {
      const url = getLogoUrl();
      expect(url).toMatch(/^data:image\/png;base64,/);
    });

    it('should return brand-color base64 logo URL by default', () => {
      const url = getLogoUrl('brand-color');
      expect(url).toMatch(/^data:image\/png;base64,/);
    });

    it('should return black base64 logo URL when specified', () => {
      const url = getLogoUrl('black');
      expect(url).toMatch(/^data:image\/png;base64,/);
    });

    it('should return white base64 logo URL when specified', () => {
      const url = getLogoUrl('white');
      expect(url).toMatch(/^data:image\/png;base64,/);
    });

    it('should return external URL when useBase64 is false', () => {
      const url = getLogoUrl('brand-color', false);
      expect(url).toBe(
        'https://inventory.baawa.com/logo/baawa-icon-brand-color.png'
      );
    });
  });

  describe('getFullLogoUrl', () => {
    it('should return brand-color full logo URL by default', () => {
      const url = getFullLogoUrl();
      expect(url).toBe(
        'https://inventory.baawa.com/logo/baawa-logo-brand-color.png'
      );
    });

    it('should return black full logo URL when specified', () => {
      const url = getFullLogoUrl('black');
      expect(url).toBe('https://inventory.baawa.com/logo/baawa-logo-black.png');
    });
  });

  describe('getLogoVariantForContext', () => {
    it('should return brand-color for welcome context', () => {
      const variant = getLogoVariantForContext('welcome');
      expect(variant).toBe('brand-color');
    });

    it('should return black for password-reset context', () => {
      const variant = getLogoVariantForContext('password-reset');
      expect(variant).toBe('black');
    });

    it('should return white for admin context', () => {
      const variant = getLogoVariantForContext('admin');
      expect(variant).toBe('white');
    });

    it('should return brand-color for verification context', () => {
      const variant = getLogoVariantForContext('verification');
      expect(variant).toBe('brand-color');
    });

    it('should return brand-color for receipt context', () => {
      const variant = getLogoVariantForContext('receipt');
      expect(variant).toBe('brand-color');
    });

    it('should return black for warning context', () => {
      const variant = getLogoVariantForContext('warning');
      expect(variant).toBe('black');
    });

    it('should return brand-color for unknown context', () => {
      const variant = getLogoVariantForContext('unknown' as any);
      expect(variant).toBe('brand-color');
    });
  });

  describe('Base64 logo data', () => {
    it('should contain valid base64 data for all variants', () => {
      const variants: Array<'brand-color' | 'black' | 'white'> = [
        'brand-color',
        'black',
        'white',
      ];

      variants.forEach(variant => {
        const url = getLogoUrl(variant);
        expect(url).toMatch(/^data:image\/png;base64,/);
        expect(url.length).toBeGreaterThan(100); // Should have substantial base64 data
      });
    });
  });
});
