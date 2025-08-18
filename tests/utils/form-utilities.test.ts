/**
 * Comprehensive Unit Tests for Form Utilities
 * Tests form validation, field utilities, and form submission helpers
 */

import {
  commonFormFields,
  validationPatterns,
  formUtils,
  fieldUtils,
  formConfigs,
  validationHelpers,
} from '@/lib/utils/form-utilities';
import { z } from 'zod';

// Mock React Hook Form
const mockForm = {
  reset: jest.fn(),
  setError: jest.fn(),
  clearErrors: jest.fn(),
  formState: {
    errors: {},
  },
};

describe('Form Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('commonFormFields', () => {
    describe('email validation', () => {
      it('should validate correct email addresses', () => {
        const validEmails = [
          'user@example.com',
          'test.email@domain.co.uk',
          'user+tag@example.org',
        ];

        validEmails.forEach(email => {
          expect(() => commonFormFields.email.parse(email)).not.toThrow();
        });
      });

      it('should reject invalid email addresses', () => {
        const invalidEmails = [
          '',
          'invalid-email',
          '@domain.com',
          'user@',
          'user space@domain.com',
        ];

        invalidEmails.forEach(email => {
          expect(() => commonFormFields.email.parse(email)).toThrow();
        });
      });

      it('should enforce length limits', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        expect(() => commonFormFields.email.parse(longEmail)).toThrow();
      });
    });

    describe('password validation', () => {
      it('should validate strong passwords', () => {
        const validPasswords = [
          'StrongPass123!',
          'MySecure@Password456',
          'Test123456789$',
        ];

        validPasswords.forEach(password => {
          expect(() => commonFormFields.password.parse(password)).not.toThrow();
        });
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'short', // Too short
          'NoSpecialChar123', // Missing special character
          'no-uppercase-123!', // No uppercase
          'NO-LOWERCASE-123!', // No lowercase
          'NoNumbers!@#', // No numbers
        ];

        weakPasswords.forEach(password => {
          expect(() => commonFormFields.password.parse(password)).toThrow();
        });
      });

      it('should enforce length limits', () => {
        expect(() => commonFormFields.password.parse('Short1!')).toThrow();
        expect(() => commonFormFields.password.parse('a'.repeat(129) + 'A1!')).toThrow();
      });
    });

    describe('name validation', () => {
      it('should validate correct names', () => {
        const validNames = [
          'John Doe',
          "O'Connor",
          'Mary-Jane',
          'Jean-Pierre',
        ];

        validNames.forEach(name => {
          expect(() => commonFormFields.name.parse(name)).not.toThrow();
        });
      });

      it('should reject invalid names', () => {
        const invalidNames = [
          'J', // Too short
          'John123', // Contains numbers
          'John@Doe', // Contains special characters
          '',
        ];

        invalidNames.forEach(name => {
          expect(() => commonFormFields.name.parse(name)).toThrow();
        });
      });
    });

    describe('currency validation', () => {
      it('should validate valid currency amounts', () => {
        const validAmounts = [0.01, 100, 1500.50, 999999.99];

        validAmounts.forEach(amount => {
          expect(() => commonFormFields.currency.parse(amount)).not.toThrow();
        });
      });

      it('should reject invalid currency amounts', () => {
        const invalidAmounts = [0, -100, 1000000];

        invalidAmounts.forEach(amount => {
          expect(() => commonFormFields.currency.parse(amount)).toThrow();
        });
      });
    });

    describe('percentage validation', () => {
      it('should validate valid percentages', () => {
        const validPercentages = [0, 50, 100, 75.5];

        validPercentages.forEach(percentage => {
          expect(() => commonFormFields.percentage.parse(percentage)).not.toThrow();
        });
      });

      it('should reject invalid percentages', () => {
        const invalidPercentages = [-1, 101, -50];

        invalidPercentages.forEach(percentage => {
          expect(() => commonFormFields.percentage.parse(percentage)).toThrow();
        });
      });
    });

    describe('integer validations', () => {
      it('should validate positive integers', () => {
        expect(() => commonFormFields.positiveInteger.parse(1)).not.toThrow();
        expect(() => commonFormFields.positiveInteger.parse(100)).not.toThrow();
      });

      it('should reject invalid positive integers', () => {
        expect(() => commonFormFields.positiveInteger.parse(0)).toThrow();
        expect(() => commonFormFields.positiveInteger.parse(-1)).toThrow();
        expect(() => commonFormFields.positiveInteger.parse(1.5)).toThrow();
      });

      it('should validate non-negative integers', () => {
        expect(() => commonFormFields.nonNegativeInteger.parse(0)).not.toThrow();
        expect(() => commonFormFields.nonNegativeInteger.parse(1)).not.toThrow();
      });

      it('should reject negative integers', () => {
        expect(() => commonFormFields.nonNegativeInteger.parse(-1)).toThrow();
        expect(() => commonFormFields.nonNegativeInteger.parse(1.5)).toThrow();
      });
    });
  });

  describe('validationPatterns', () => {
    describe('createConfirmationField', () => {
      it('should create confirmation field with default label', () => {
        const schema = validationPatterns.createConfirmationField();
        
        expect(() => schema.parse('password123')).not.toThrow();
        expect(() => schema.parse('')).toThrow();
      });

      it('should create confirmation field with custom label', () => {
        const schema = validationPatterns.createConfirmationField('email');
        
        expect(() => schema.parse('test@example.com')).not.toThrow();
        expect(() => schema.parse('')).toThrow();
      });
    });

    describe('withConfirmation', () => {
      it('should validate matching confirmation fields', () => {
        const baseSchema = z.object({
          password: z.string().min(8),
        });

        const schemaWithConfirmation = validationPatterns.withConfirmation(
          baseSchema,
          'password',
          'confirmPassword'
        );

        const validData = {
          password: 'password123',
          confirmPassword: 'password123',
        };

        expect(() => schemaWithConfirmation.parse(validData)).not.toThrow();
      });

      it('should reject non-matching confirmation fields', () => {
        const baseSchema = z.object({
          password: z.string().min(8),
        });

        const schemaWithConfirmation = validationPatterns.withConfirmation(
          baseSchema,
          'password',
          'confirmPassword'
        );

        const invalidData = {
          password: 'password123',
          confirmPassword: 'differentpassword',
        };

        expect(() => schemaWithConfirmation.parse(invalidData)).toThrow();
      });
    });
  });

  describe('formUtils', () => {
    describe('createSubmitHandler', () => {
      it('should handle successful form submission', async () => {
        const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
        const mockOnSuccess = jest.fn();
        
        const handler = formUtils.createSubmitHandler(
          mockForm as any,
          mockOnSubmit,
          {
            resetOnSuccess: true,
            onSuccess: mockOnSuccess,
          }
        );

        const testData = { name: 'test' };
        await handler(testData);

        expect(mockOnSubmit).toHaveBeenCalledWith(testData);
        expect(mockForm.reset).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      it('should handle form submission errors', async () => {
        const mockError = new Error('Submission failed');
        const mockOnSubmit = jest.fn().mockRejectedValue(mockError);
        const mockOnError = jest.fn();
        
        const handler = formUtils.createSubmitHandler(
          mockForm as any,
          mockOnSubmit,
          {
            onError: mockOnError,
          }
        );

        const testData = { name: 'test' };
        await handler(testData);

        expect(mockOnSubmit).toHaveBeenCalledWith(testData);
        expect(mockForm.setError).toHaveBeenCalledWith('root', {
          type: 'manual',
          message: 'Submission failed',
        });
        expect(mockOnError).toHaveBeenCalledWith(mockError);
      });

      it('should handle unknown errors', async () => {
        const mockOnSubmit = jest.fn().mockRejectedValue('String error');
        
        const handler = formUtils.createSubmitHandler(
          mockForm as any,
          mockOnSubmit
        );

        const testData = { name: 'test' };
        await handler(testData);

        expect(mockForm.setError).toHaveBeenCalledWith('root', {
          type: 'manual',
          message: 'An unexpected error occurred',
        });
      });
    });

    describe('form utility functions', () => {
      it('should clear all errors', () => {
        formUtils.clearAllErrors(mockForm as any);
        expect(mockForm.clearErrors).toHaveBeenCalled();
      });

      it('should reset with defaults', () => {
        const defaults = { name: 'test', email: 'test@example.com' };
        formUtils.resetWithDefaults(mockForm as any, defaults);
        expect(mockForm.reset).toHaveBeenCalledWith(defaults);
      });

      it('should get form errors', () => {
        const mockFormWithErrors = {
          formState: {
            errors: {
              name: { message: 'Name is required' },
              email: { message: 'Email is invalid' },
              nested: {},
            },
          },
        };

        const errors = formUtils.getFormErrors(mockFormWithErrors as any);
        expect(errors).toEqual(['Name is required', 'Email is invalid']);
      });

      it('should check if form has errors', () => {
        const formWithErrors = {
          formState: { errors: { name: { message: 'Required' } } },
        };
        const formWithoutErrors = {
          formState: { errors: {} },
        };

        expect(formUtils.hasErrors(formWithErrors as any)).toBe(true);
        expect(formUtils.hasErrors(formWithoutErrors as any)).toBe(false);
      });
    });
  });

  describe('fieldUtils', () => {
    describe('createFieldProps', () => {
      it('should create field props with defaults', () => {
        const props = fieldUtils.createFieldProps('email', 'Email');
        
        expect(props).toEqual({
          name: 'email',
          label: 'Email',
          placeholder: 'Enter email',
          helpText: undefined,
          required: false,
          disabled: false,
        });
      });

      it('should create field props with custom options', () => {
        const props = fieldUtils.createFieldProps('email', 'Email Address', {
          placeholder: 'Your email',
          helpText: 'We will not spam you',
          required: true,
          disabled: true,
        });
        
        expect(props).toEqual({
          name: 'email',
          label: 'Email Address',
          placeholder: 'Your email',
          helpText: 'We will not spam you',
          required: true,
          disabled: true,
        });
      });
    });

    describe('currency formatting', () => {
      it('should format currency correctly', () => {
        expect(fieldUtils.formatCurrency(1000)).toBe('₦1,000.00');
        expect(fieldUtils.formatCurrency(1500.50)).toBe('₦1,500.50');
        expect(fieldUtils.formatCurrency('2000')).toBe('₦2,000.00');
        expect(fieldUtils.formatCurrency(0)).toBe('₦0.00');
      });

      it('should handle invalid currency values', () => {
        expect(fieldUtils.formatCurrency('')).toBe('₦0.00');
        expect(fieldUtils.formatCurrency('invalid')).toBe('₦0.00');
      });

      it('should parse currency strings', () => {
        expect(fieldUtils.parseCurrency('₦1,500.00')).toBe(1500);
        expect(fieldUtils.parseCurrency('₦2,000.50')).toBe(2000.5);
        expect(fieldUtils.parseCurrency('1500')).toBe(1500);
        expect(fieldUtils.parseCurrency('')).toBe(0);
        expect(fieldUtils.parseCurrency('invalid')).toBe(0);
      });
    });

    describe('formatPercentage', () => {
      it('should format percentages correctly', () => {
        expect(fieldUtils.formatPercentage(50)).toBe('50%');
        expect(fieldUtils.formatPercentage(75.5)).toBe('75.5%');
        expect(fieldUtils.formatPercentage(0)).toBe('0%');
      });
    });

    describe('toTitleCase', () => {
      it('should convert strings to title case', () => {
        expect(fieldUtils.toTitleCase('hello world')).toBe('Hello World');
        expect(fieldUtils.toTitleCase('UPPERCASE TEXT')).toBe('Uppercase Text');
        expect(fieldUtils.toTitleCase('mixedCase text')).toBe('Mixedcase Text');
        expect(fieldUtils.toTitleCase('')).toBe('');
      });
    });
  });

  describe('formConfigs', () => {
    it('should provide default form options', () => {
      expect(formConfigs.defaultFormOptions).toEqual({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        shouldUnregister: false,
      });
    });

    it('should provide button configurations', () => {
      expect(formConfigs.submitButton.loading).toEqual({
        text: 'Saving...',
        disabled: true,
      });

      expect(formConfigs.submitButton.default).toEqual({
        text: 'Save',
        disabled: false,
      });

      expect(formConfigs.cancelButton).toEqual({
        text: 'Cancel',
        variant: 'outline',
      });
    });
  });

  describe('validationHelpers', () => {
    describe('isEmpty', () => {
      it('should identify empty values', () => {
        const emptyValues = [
          null,
          undefined,
          '',
          '   ',
          [],
          {},
        ];

        emptyValues.forEach(value => {
          expect(validationHelpers.isEmpty(value)).toBe(true);
        });
      });

      it('should identify non-empty values', () => {
        const nonEmptyValues = [
          'hello',
          0,
          false,
          [1, 2, 3],
          { key: 'value' },
          'a',
        ];

        nonEmptyValues.forEach(value => {
          expect(validationHelpers.isEmpty(value)).toBe(false);
        });
      });
    });

    describe('sanitizeString', () => {
      it('should sanitize strings correctly', () => {
        expect(validationHelpers.sanitizeString('  hello   world  ')).toBe('hello world');
        expect(validationHelpers.sanitizeString('test<script>alert()</script>')).toBe('testscriptalert()/script');
        expect(validationHelpers.sanitizeString('normal text')).toBe('normal text');
        expect(validationHelpers.sanitizeString('')).toBe('');
      });

      it('should handle multiple spaces', () => {
        expect(validationHelpers.sanitizeString('hello     world')).toBe('hello world');
        expect(validationHelpers.sanitizeString('   leading   and   trailing   ')).toBe('leading and trailing');
      });
    });

    describe('validateFile', () => {
      const createMockFile = (name: string, size: number, type: string) => ({
        name,
        size,
        type,
      } as File);

      it('should validate valid files', () => {
        const validFile = createMockFile('image.jpg', 1024 * 1024, 'image/jpeg');
        const result = validationHelpers.validateFile(validFile);
        
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject files that are too large', () => {
        const largeFile = createMockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg');
        const result = validationHelpers.validateFile(largeFile);
        
        expect(result.valid).toBe(false);
        expect(result.error).toContain('File size must be less than');
      });

      it('should reject files with invalid types', () => {
        const invalidFile = createMockFile('document.pdf', 1024, 'application/pdf');
        const result = validationHelpers.validateFile(invalidFile);
        
        expect(result.valid).toBe(false);
        expect(result.error).toContain('File type must be one of');
      });

      it('should accept custom validation options', () => {
        const file = createMockFile('document.pdf', 1024, 'application/pdf');
        const result = validationHelpers.validateFile(file, {
          maxSize: 2 * 1024 * 1024,
          allowedTypes: ['application/pdf', 'text/plain'],
        });
        
        expect(result.valid).toBe(true);
      });

      it('should handle edge cases', () => {
        const emptyFile = createMockFile('empty.txt', 0, 'text/plain');
        const result = validationHelpers.validateFile(emptyFile, {
          allowedTypes: ['text/plain'],
        });
        
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work together in a complete form scenario', () => {
      // Create a form schema using common fields
      const formSchema = z.object({
        email: commonFormFields.email,
        password: commonFormFields.password,
        name: commonFormFields.name,
      });

      // Add confirmation validation
      const schemaWithConfirmation = validationPatterns.withConfirmation(
        formSchema,
        'password',
        'confirmPassword'
      );

      // Test valid data
      const validData = {
        email: 'user@example.com',
        password: 'StrongPass123!',
        name: 'John Doe',
        confirmPassword: 'StrongPass123!',
      };

      expect(() => schemaWithConfirmation.parse(validData)).not.toThrow();

      // Test field utilities
      const emailProps = fieldUtils.createFieldProps('email', 'Email Address', {
        required: true,
      });

      expect(emailProps.name).toBe('email');
      expect(emailProps.required).toBe(true);

      // Test validation helpers
      expect(validationHelpers.isEmpty(validData.email)).toBe(false);
      expect(validationHelpers.sanitizeString(validData.name)).toBe('John Doe');
    });

    it('should handle complete error scenarios', () => {
      const formSchema = z.object({
        email: commonFormFields.email,
        currency: commonFormFields.currency,
      });

      const invalidData = {
        email: 'invalid-email',
        currency: -100,
      };

      expect(() => formSchema.parse(invalidData)).toThrow();

      // Test that field utilities still work with invalid data
      expect(fieldUtils.formatCurrency(invalidData.currency)).toBe('-₦100.00');
      expect(validationHelpers.isEmpty('')).toBe(true);
    });
  });
});