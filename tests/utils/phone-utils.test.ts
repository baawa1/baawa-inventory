/**
 * Comprehensive Unit Tests for Phone Utilities
 * Tests Nigerian phone number normalization, validation, and formatting
 */

import {
  normalizeNigerianPhone,
  formatPhoneForDisplay,
  arePhonesEquivalent,
  isValidNigerianPhone,
  getPhoneSearchPatterns,
  extractDigitsOnly,
  phoneContainsDigits,
  getPreferredPhoneFormat,
  type NormalizedPhone,
} from '@/lib/utils/phone-utils';

describe('Phone Utilities', () => {
  describe('normalizeNigerianPhone', () => {
    it('should handle international format +234XXXXXXXXX', () => {
      const testCases = [
        '+2347087367278',
        '+2348012345678',
        '+2349087654321',
      ];

      testCases.forEach(phone => {
        const result = normalizeNigerianPhone(phone);
        
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(phone);
        expect(result.countryCode).toBe('+234');
        expect(result.localNumber).toBe(phone.substring(4));
        expect(result.original).toBe(phone);
      });
    });

    it('should handle international format without + (234XXXXXXXXX)', () => {
      const testCases = [
        { input: '2347087367278', expected: '+2347087367278' },
        { input: '2348012345678', expected: '+2348012345678' },
        { input: '2349087654321', expected: '+2349087654321' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeNigerianPhone(input);
        
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(expected);
        expect(result.countryCode).toBe('+234');
        expect(result.localNumber).toBe(input.substring(3));
      });
    });

    it('should handle local format with leading 0 (0XXXXXXXXX)', () => {
      const testCases = [
        { input: '07087367278', expected: '+2347087367278' },
        { input: '08012345678', expected: '+2348012345678' },
        { input: '09087654321', expected: '+2349087654321' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeNigerianPhone(input);
        
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(expected);
        expect(result.countryCode).toBe('+234');
        expect(result.localNumber).toBe(input.substring(1));
      });
    });

    it('should handle local format without leading 0 (XXXXXXXXX)', () => {
      const testCases = [
        { input: '7087367278', expected: '+2347087367278' },
        { input: '8012345678', expected: '+2348012345678' },
        { input: '9087654321', expected: '+2349087654321' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeNigerianPhone(input);
        
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(expected);
        expect(result.countryCode).toBe('+234');
        expect(result.localNumber).toBe(input);
      });
    });

    it('should reject invalid Nigerian phone numbers', () => {
      const invalidPhones = [
        '+1234567890', // Wrong country code
        '12345678901', // Wrong format
        '+23470873672', // Too short
        '+234708736727812', // Too long
        '6012345678', // Invalid area code for 10-digit format
        '012345678', // Too short
        '', // Empty string
      ];

      invalidPhones.forEach(phone => {
        const result = normalizeNigerianPhone(phone as string);
        
        expect(result.isValid).toBe(false);
        expect(result.normalized).toBe('');
        expect(result.countryCode).toBe('');
        expect(result.localNumber).toBe('');
      });
      
      // Handle null/undefined separately
      [null, undefined].forEach(phone => {
        const result = normalizeNigerianPhone(phone as string);
        
        expect(result.isValid).toBe(false);
        expect(result.original).toBe('');
      });
    });

    it('should accept valid Nigerian phone patterns even with different area codes', () => {
      // The implementation accepts any 11-digit number starting with 0
      const validPatterns = [
        '05012345678', // 501 area code (valid format but unusual area code)
        '01234567890', // 123 area code (valid format but unusual area code)
      ];

      validPatterns.forEach(phone => {
        const result = normalizeNigerianPhone(phone);
        
        expect(result.isValid).toBe(true);
        expect(result.normalized).toMatch(/^\+234\d{10}$/);
      });
    });

    it('should handle phone numbers with formatting characters', () => {
      const formattedPhones = [
        { input: '+234 708 736 7278', expected: '+2347087367278' },
        { input: '0801-234-5678', expected: '+2348012345678' },
        { input: '(234) 908-765-4321', expected: '+2349087654321' },
        { input: '+234.708.736.7278', expected: '+2347087367278' },
        { input: '0801 234 5678', expected: '+2348012345678' },
      ];

      formattedPhones.forEach(({ input, expected }) => {
        const result = normalizeNigerianPhone(input);
        
        expect(result.isValid).toBe(true);
        expect(result.normalized).toBe(expected);
        expect(result.original).toBe(input);
      });
    });

    it('should format phone numbers for display', () => {
      const testCases = [
        { input: '+2347087367278', expected: '+234 708 736 7278' },
        { input: '+2348012345678', expected: '+234 801 234 5678' },
        { input: '+2349087654321', expected: '+234 908 765 4321' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = normalizeNigerianPhone(input);
        
        expect(result.isValid).toBe(true);
        expect(result.formatted).toBe(expected);
      });
    });
  });

  describe('formatPhoneForDisplay', () => {
    it('should format valid phone numbers', () => {
      const testCases = [
        { input: '+2347087367278', expected: '+234 708 736 7278' },
        { input: '2348012345678', expected: '+234 801 234 5678' },
        { input: '09087654321', expected: '+234 908 765 4321' },
        { input: '7087367278', expected: '+234 708 736 7278' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = formatPhoneForDisplay(input);
        expect(result).toBe(expected);
      });
    });

    it('should return original for invalid phone numbers', () => {
      const invalidPhones = [
        'invalid-phone',
        '12345',
        '+1234567890',
        '',
      ];

      invalidPhones.forEach(phone => {
        const result = formatPhoneForDisplay(phone);
        expect(result).toBe(phone);
      });
    });

    it('should handle empty input', () => {
      expect(formatPhoneForDisplay('')).toBe('');
      expect(formatPhoneForDisplay(null as any)).toBe('');
      expect(formatPhoneForDisplay(undefined as any)).toBe('');
    });
  });

  describe('arePhonesEquivalent', () => {
    it('should identify equivalent phone numbers', () => {
      const equivalentPairs = [
        ['+2347087367278', '2347087367278'],
        ['+2347087367278', '07087367278'],
        ['+2347087367278', '7087367278'],
        ['+2348012345678', '08012345678'],
        ['234 801 234 5678', '08012345678'],
      ];

      equivalentPairs.forEach(([phone1, phone2]) => {
        expect(arePhonesEquivalent(phone1, phone2)).toBe(true);
        expect(arePhonesEquivalent(phone2, phone1)).toBe(true); // Symmetric
      });
    });

    it('should identify non-equivalent phone numbers', () => {
      const nonEquivalentPairs = [
        ['+2347087367278', '+2348012345678'],
        ['07087367278', '08012345678'],
        ['+2347087367278', '+1234567890'],
        ['invalid-phone', '+2347087367278'],
      ];

      nonEquivalentPairs.forEach(([phone1, phone2]) => {
        expect(arePhonesEquivalent(phone1, phone2)).toBe(false);
      });
    });

    it('should handle empty or null inputs', () => {
      const testCases = [
        ['', '+2347087367278'],
        ['+2347087367278', ''],
        [null as any, '+2347087367278'],
        ['+2347087367278', null as any],
        ['', ''],
        [null as any, null as any],
      ];

      testCases.forEach(([phone1, phone2]) => {
        expect(arePhonesEquivalent(phone1, phone2)).toBe(false);
      });
    });
  });

  describe('isValidNigerianPhone', () => {
    it('should validate correct Nigerian phone numbers', () => {
      const validPhones = [
        '+2347087367278',
        '2348012345678',
        '09087654321',
        '7087367278',
        '+234 708 736 7278',
        '0801-234-5678',
      ];

      validPhones.forEach(phone => {
        expect(isValidNigerianPhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '+1234567890', // Wrong country code
        '12345678901', // Wrong format  
        '6012345678', // Invalid area code for 10-digit format
        'not-a-phone', // Non-numeric
        '', // Empty
      ];

      invalidPhones.forEach(phone => {
        expect(isValidNigerianPhone(phone as string)).toBe(false);
      });
      
      // Test null/undefined separately
      expect(isValidNigerianPhone(null as any)).toBe(false);
      expect(isValidNigerianPhone(undefined as any)).toBe(false);
    });
  });

  describe('getPhoneSearchPatterns', () => {
    it('should generate search patterns for valid phone numbers', () => {
      const result = getPhoneSearchPatterns('+2347087367278');
      
      expect(result).toContain('+2347087367278'); // International with +
      expect(result).toContain('2347087367278'); // International without +
      expect(result).toContain('07087367278'); // Local with 0
      expect(result).toContain('7087367278'); // Local without 0
      expect(result).toHaveLength(4);
    });

    it('should remove duplicate patterns', () => {
      // This phone number in different formats might generate duplicates
      const result = getPhoneSearchPatterns('7087367278');
      
      // Should not have duplicates
      const uniquePatterns = [...new Set(result)];
      expect(result.length).toBe(uniquePatterns.length);
    });

    it('should return original for invalid phone numbers', () => {
      const invalidPhone = 'invalid-phone';
      const result = getPhoneSearchPatterns(invalidPhone);
      
      expect(result).toEqual([invalidPhone]);
    });

    it('should handle various input formats', () => {
      const inputs = [
        '07087367278',
        '2347087367278',
        '+234 708 736 7278',
      ];

      inputs.forEach(input => {
        const result = getPhoneSearchPatterns(input);
        
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain('+2347087367278'); // All should normalize to same
      });
    });
  });

  describe('extractDigitsOnly', () => {
    it('should extract only digits from phone numbers', () => {
      const testCases = [
        { input: '+234-708-736-7278', expected: '2347087367278' },
        { input: '(234) 708 736 7278', expected: '2347087367278' },
        { input: '+234.708.736.7278', expected: '2347087367278' },
        { input: 'abc123def456', expected: '123456' },
        { input: '0801 234 5678', expected: '08012345678' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(extractDigitsOnly(input)).toBe(expected);
      });
    });

    it('should handle empty or null inputs', () => {
      expect(extractDigitsOnly('')).toBe('');
      expect(extractDigitsOnly(null as any)).toBe('');
      expect(extractDigitsOnly(undefined as any)).toBe('');
    });

    it('should handle strings with no digits', () => {
      const nonDigitStrings = [
        'abcdef',
        '!@#$%^&*()',
        '   ',
        'phone-number',
      ];

      nonDigitStrings.forEach(str => {
        expect(extractDigitsOnly(str)).toBe('');
      });
    });
  });

  describe('phoneContainsDigits', () => {
    it('should find matching digits in phone numbers', () => {
      const testCases = [
        { phone: '+234-708-736-7278', search: '708', expected: true },
        { phone: '08012345678', search: '8012', expected: true },
        { phone: '+2349087654321', search: '765', expected: true },
        { phone: '07087367278', search: '7367', expected: true },
      ];

      testCases.forEach(({ phone, search, expected }) => {
        expect(phoneContainsDigits(phone, search)).toBe(expected);
      });
    });

    it('should not match non-existent digit sequences', () => {
      const testCases = [
        { phone: '+2347087367278', search: '999', expected: false },
        { phone: '08012345678', search: '555', expected: false },
        { phone: '+2349087654321', search: '111', expected: false },
      ];

      testCases.forEach(({ phone, search, expected }) => {
        expect(phoneContainsDigits(phone, search)).toBe(expected);
      });
    });

    it('should handle formatted search digits', () => {
      expect(phoneContainsDigits('+234-708-736-7278', '708-736')).toBe(true);
      expect(phoneContainsDigits('08012345678', '801-234')).toBe(true);
    });

    it('should handle empty inputs', () => {
      expect(phoneContainsDigits('', '123')).toBe(false);
      expect(phoneContainsDigits('+2347087367278', '')).toBe(false);
      expect(phoneContainsDigits('', '')).toBe(false);
    });
  });

  describe('getPreferredPhoneFormat', () => {
    it('should return international format for valid phones', () => {
      const testCases = [
        { input: '07087367278', expected: '+2347087367278' },
        { input: '2348012345678', expected: '+2348012345678' },
        { input: '9087654321', expected: '+2349087654321' },
        { input: '+234 708 736 7278', expected: '+2347087367278' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(getPreferredPhoneFormat(input)).toBe(expected);
      });
    });

    it('should return original for invalid phones', () => {
      const invalidPhones = [
        'invalid-phone',
        '+1234567890',
        '12345',
        'not-a-number',
      ];

      invalidPhones.forEach(phone => {
        expect(getPreferredPhoneFormat(phone)).toBe(phone);
      });
    });

    it('should handle edge cases', () => {
      expect(getPreferredPhoneFormat('')).toBe('');
      expect(getPreferredPhoneFormat(null as any)).toBe(null);
      expect(getPreferredPhoneFormat(undefined as any)).toBe(undefined);
    });
  });

  describe('Edge Cases and Integration Tests', () => {
    it('should maintain consistency across all phone utility functions', () => {
      const testPhones = [
        '+2347087367278',
        '07087367278',
        '2348012345678',
        '9087654321',
      ];

      testPhones.forEach(phone => {
        const normalized = normalizeNigerianPhone(phone);
        const isValid = isValidNigerianPhone(phone);
        const formatted = formatPhoneForDisplay(phone);
        const preferred = getPreferredPhoneFormat(phone);

        // All functions should agree on validity
        expect(normalized.isValid).toBe(isValid);
        
        if (isValid) {
          // Valid phones should have consistent international format
          expect(preferred).toBe(normalized.normalized);
          expect(preferred).toMatch(/^\+234\d{10}$/);
          
          // Formatted version should be readable
          expect(formatted).toMatch(/^\+234 \d{3} \d{3} \d{4}$/);
        }
      });
    });

    it('should handle malicious or unusual input safely', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'DROP TABLE phones;--',
        ''.repeat(1000), // Very long string
        '\x00\x01\x02', // Control characters
        'ö234ñ708ü736ñ7278', // Unicode characters
      ];

      maliciousInputs.forEach(input => {
        expect(() => {
          normalizeNigerianPhone(input);
          isValidNigerianPhone(input);
          formatPhoneForDisplay(input);
          getPreferredPhoneFormat(input);
          extractDigitsOnly(input);
        }).not.toThrow();
      });
    });

    it('should perform efficiently with large numbers of phone numbers', () => {
      const phoneNumbers = Array.from({ length: 1000 }, (_, i) => 
        `+234708${String(i).padStart(7, '0')}`
      );

      const startTime = performance.now();
      
      phoneNumbers.forEach(phone => {
        normalizeNigerianPhone(phone);
        isValidNigerianPhone(phone);
        formatPhoneForDisplay(phone);
      });

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should process 1000 phones in reasonable time (< 100ms)
      expect(executionTime).toBeLessThan(100);
    });
  });
});