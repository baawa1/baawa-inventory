/**
 * Comprehensive Unit Tests for Date Utilities
 * Tests safe timestamp handling and date validation functions
 */

import {
  safeParseTimestamp,
  isValidDate,
  safeToISOString,
} from '@/lib/utils/date-utils';

describe('Date Utilities', () => {
  const mockDate = new Date('2024-01-15T10:30:00Z');
  
  beforeAll(() => {
    // Mock Date.now for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('safeParseTimestamp', () => {
    it('should return valid Date objects unchanged', () => {
      const validDate = new Date('2024-01-01T00:00:00Z');
      const result = safeParseTimestamp(validDate);
      
      expect(result).toBe(validDate);
      expect(result.getTime()).toBe(validDate.getTime());
    });

    it('should parse valid date strings', () => {
      const testCases = [
        '2024-01-01T00:00:00Z',
        '2024-01-01',
        '2024/01/01',
        'January 1, 2024',
        '2024-01-01T10:30:00.000Z',
      ];

      testCases.forEach(dateString => {
        const result = safeParseTimestamp(dateString);
        
        expect(result).toBeInstanceOf(Date);
        expect(isNaN(result.getTime())).toBe(false);
      });
    });

    it('should parse valid timestamp numbers', () => {
      const timestamp = 1704067200000; // 2024-01-01T00:00:00Z
      const result = safeParseTimestamp(timestamp);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(timestamp);
    });

    it('should return fallback date for invalid inputs', () => {
      const invalidInputs = [
        'invalid-date',
        'not a date',
        NaN,
        Infinity,
        -Infinity,
        null,
        undefined,
        {},
        [],
        true,
        false,
      ];

      invalidInputs.forEach(input => {
        const result = safeParseTimestamp(input);
        
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(mockDate.getTime());
      });
    });

    it('should use custom fallback date when provided', () => {
      const customFallback = new Date('2023-12-25T00:00:00Z');
      const result = safeParseTimestamp('invalid-date', customFallback);
      
      expect(result).toBe(customFallback);
    });

    it('should handle invalid Date objects', () => {
      const invalidDate = new Date('invalid');
      const result = safeParseTimestamp(invalidDate);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(mockDate.getTime());
    });

    it('should handle edge case timestamps', () => {
      const edgeCases = [
        0, // Unix epoch
        Date.now(), // Current timestamp
        new Date('1970-01-01T00:00:00Z').getTime(), // Epoch
        new Date('2038-01-19T03:14:07Z').getTime(), // Year 2038 problem
      ];

      edgeCases.forEach(timestamp => {
        const result = safeParseTimestamp(timestamp);
        
        expect(result).toBeInstanceOf(Date);
        expect(result.getTime()).toBe(timestamp);
      });
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date objects', () => {
      const validDates = [
        new Date(),
        new Date('2024-01-01'),
        new Date(2024, 0, 1),
        new Date(Date.now()),
      ];

      validDates.forEach(date => {
        expect(isValidDate(date)).toBe(true);
      });
    });

    it('should return false for invalid Date objects', () => {
      const invalidDate = new Date('invalid-date');
      expect(isValidDate(invalidDate)).toBe(false);
    });

    it('should return false for non-Date values', () => {
      const nonDates = [
        null,
        undefined,
        'date string',
        123456789,
        {},
        [],
        true,
        false,
        NaN,
        Infinity,
      ];

      nonDates.forEach(value => {
        expect(isValidDate(value)).toBe(false);
      });
    });

    it('should handle edge case dates', () => {
      const edgeCases = [
        new Date(0), // Unix epoch
        new Date(-8640000000000000), // Minimum date
        new Date(8640000000000000), // Maximum date
        new Date('1970-01-01T00:00:00Z'),
      ];

      edgeCases.forEach(date => {
        expect(isValidDate(date)).toBe(true);
      });
    });
  });

  describe('safeToISOString', () => {
    it('should convert valid timestamps to ISO string', () => {
      const testDate = new Date('2024-01-01T10:30:00Z');
      const result = safeToISOString(testDate);
      
      expect(result).toBe('2024-01-01T10:30:00.000Z');
      expect(typeof result).toBe('string');
    });

    it('should convert valid date strings to ISO string', () => {
      const dateString = '2024-01-01T10:30:00Z';
      const result = safeToISOString(dateString);
      
      expect(result).toBe('2024-01-01T10:30:00.000Z');
    });

    it('should convert timestamp numbers to ISO string', () => {
      const timestamp = 1704107400000; // 2024-01-01T10:30:00Z
      const result = safeToISOString(timestamp);
      
      // Check the actual date represented by this timestamp
      const expectedDate = new Date(timestamp);
      expect(result).toBe(expectedDate.toISOString());
    });

    it('should use fallback date for invalid inputs', () => {
      const invalidInputs = [
        'invalid-date',
        NaN,
        null,
        undefined,
        {},
      ];

      invalidInputs.forEach(input => {
        const result = safeToISOString(input);
        
        expect(result).toBe(mockDate.toISOString());
      });
    });

    it('should use custom fallback date when provided', () => {
      const customFallback = new Date('2023-12-25T15:45:00Z');
      const result = safeToISOString('invalid-date', customFallback);
      
      expect(result).toBe(customFallback.toISOString());
    });

    it('should handle various date formats consistently', () => {
      const dateFormats = [
        '2024-01-01',
        '2024/01/01',
        '01-01-2024',
        'January 1, 2024',
        new Date('2024-01-01'),
        1704067200000, // 2024-01-01T00:00:00Z timestamp
      ];

      dateFormats.forEach(format => {
        const result = safeToISOString(format);
        
        expect(typeof result).toBe('string');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    it('should preserve timezone information', () => {
      const utcDate = new Date('2024-01-01T10:30:00Z');
      const result = safeToISOString(utcDate);
      
      expect(result).toMatch(/Z$/); // Should end with Z for UTC
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        'not-a-date-at-all',
        '32/13/2024', // Invalid date values
        '2024-13-45', // Invalid month/day
        'Feb 30, 2024', // Non-existent date
        '', // Empty string
        '   ', // Whitespace only
      ];

      malformedInputs.forEach(input => {
        const parseResult = safeParseTimestamp(input);
        const isoResult = safeToISOString(input);
        
        expect(parseResult).toBeInstanceOf(Date);
        expect(typeof isoResult).toBe('string');
        expect(isoResult).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    it('should handle very large and very small timestamps', () => {
      const extremeTimestamps = [
        0, // Unix epoch
        -1, // Before epoch
        1, // Just after epoch
        Date.now(), // Current time
      ];

      extremeTimestamps.forEach(timestamp => {
        const result = safeParseTimestamp(timestamp);
        
        // All these should be valid dates
        expect(isValidDate(result)).toBe(true);
        expect(result.getTime()).toBe(timestamp);
      });

      // Test extremely large values that might cause issues
      const veryExtreme = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER];
      
      veryExtreme.forEach(timestamp => {
        const result = safeParseTimestamp(timestamp);
        
        // These might use fallback due to extreme values
        expect(isValidDate(result)).toBe(true);
      });
    });

    it('should maintain consistency between functions', () => {
      const testInputs = [
        '2024-01-01T10:30:00Z',
        new Date('2024-01-01T10:30:00Z'),
        1704107400000,
        'invalid-date',
      ];

      testInputs.forEach(input => {
        const parsedDate = safeParseTimestamp(input);
        const isoString = safeToISOString(input);
        const isValid = isValidDate(parsedDate);
        
        // Consistency check: if we parse then convert to ISO, should get same result
        expect(parsedDate.toISOString()).toBe(isoString);
        
        // Valid parsed dates should be valid according to isValidDate
        expect(isValid).toBe(true);
      });
    });
  });
});