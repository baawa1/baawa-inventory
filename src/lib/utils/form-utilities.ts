import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';

// Common form field patterns
export const commonFormFields = {
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less'),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or less')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),

  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less')
    .regex(
      /^[A-Za-z\s'-]+$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    ),

  phone: z
    .string()
    .optional()
    .refine(
      val => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val),
      'Please enter a valid phone number'
    ),

  url: z
    .string()
    .optional()
    .refine(
      val => !val || z.string().url().safeParse(val).success,
      'Please enter a valid URL'
    ),

  currency: z
    .number()
    .min(0.01, 'Amount must be at least ₦0.01')
    .max(999999.99, 'Amount cannot exceed ₦999,999.99'),

  percentage: z
    .number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100'),

  positiveInteger: z
    .number()
    .int('Must be a whole number')
    .positive('Must be a positive number'),

  nonNegativeInteger: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Cannot be negative'),
};

// Common form validation patterns
export const validationPatterns = {
  // Create a confirmation field validator
  createConfirmationField: (fieldLabel: string = 'password') =>
    z.string().min(1, `Please confirm your ${fieldLabel}`),

  // Create a schema with confirmation validation
  withConfirmation: <T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    originalField: keyof T,
    confirmationField: string,
    fieldLabel: string = 'password'
  ) =>
    schema
      .extend({
        [confirmationField]: z
          .string()
          .min(1, `Please confirm your ${fieldLabel}`),
      } as any)
      .refine(data => data[originalField] === data[confirmationField], {
        message: `${fieldLabel.charAt(0).toUpperCase() + fieldLabel.slice(1)}s don't match`,
        path: [confirmationField],
      }),
};

// Form submission utilities
export const formUtils = {
  // Handle form submission with loading states and error handling
  createSubmitHandler: <T extends Record<string, unknown>>(
    form: UseFormReturn<T>,
    onSubmit: (_data: T) => Promise<void>,
    options?: {
      resetOnSuccess?: boolean;
      successMessage?: string;
      onSuccess?: () => void;
      onError?: (_error: Error) => void;
    }
  ) => {
    return async (_data: T) => {
      try {
        await onSubmit(_data);

        if (options?.resetOnSuccess) {
          form.reset();
        }

        if (options?.successMessage) {
          // Toast notification would go here
          // Debug logging removed for production
        }

        options?.onSuccess?.();
      } catch (_error) {
        const errorMessage =
          _error instanceof Error
            ? _error.message
            : 'An unexpected error occurred';

        // Set form error
        form.setError('root', {
          type: 'manual',
          message: errorMessage,
        });

        options?.onError?.(_error as Error);
      }
    };
  },

  // Clear all form errors
  clearAllErrors: <T extends Record<string, unknown>>(
    form: UseFormReturn<T>
  ) => {
    form.clearErrors();
  },

  // Reset form with new default values
  resetWithDefaults: <T extends Record<string, unknown>>(
    form: UseFormReturn<T>,
    defaults: Partial<T>
  ) => {
    form.reset(defaults as T);
  },

  // Get all form errors as an array
  getFormErrors: <T extends Record<string, unknown>>(
    form: UseFormReturn<T>
  ) => {
    return Object.values(form.formState.errors)
      .map(error => error?.message)
      .filter(Boolean) as string[];
  },

  // Check if form has any errors
  hasErrors: <T extends Record<string, unknown>>(form: UseFormReturn<T>) => {
    return Object.keys(form.formState.errors).length > 0;
  },
};

// Form field utilities
export const fieldUtils = {
  // Create standardized field props for consistent styling
  createFieldProps: (
    name: string,
    label: string,
    options?: {
      placeholder?: string;
      helpText?: string;
      required?: boolean;
      disabled?: boolean;
    }
  ) => ({
    name,
    label,
    placeholder: options?.placeholder || `Enter ${label.toLowerCase()}`,
    helpText: options?.helpText,
    required: options?.required ?? false,
    disabled: options?.disabled ?? false,
  }),

  // Format currency input
  formatCurrency: (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(numValue || 0);
  },

  // Parse currency input
  parseCurrency: (value: string): number => {
    return parseFloat(value.replace(/[₦,\s]/g, '')) || 0;
  },

  // Format percentage
  formatPercentage: (value: number): string => {
    return `${value}%`;
  },

  // Capitalize first letter of each word
  toTitleCase: (str: string): string => {
    return str.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },
};

// Common form configurations
export const formConfigs = {
  // Default form options for React Hook Form
  defaultFormOptions: {
    mode: 'onBlur' as const,
    reValidateMode: 'onChange' as const,
    shouldFocusError: true,
    shouldUnregister: false,
  },

  // Common button configurations
  submitButton: {
    loading: {
      text: 'Saving...',
      disabled: true,
    },
    default: {
      text: 'Save',
      disabled: false,
    },
  },

  cancelButton: {
    text: 'Cancel',
    variant: 'outline' as const,
  },
};

// Form validation helpers
export const validationHelpers = {
  // Check if value is empty (null, undefined, empty string, empty array)
  isEmpty: (value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },

  // Sanitize string input
  sanitizeString: (value: string): string => {
    return value
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[<>]/g, ''); // Remove angle brackets for basic XSS prevention
  },

  // Validate file upload
  validateFile: (
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      maxFiles?: number;
    } = {}
  ): { valid: boolean; error?: string } => {
    const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    const allowedTypes = options.allowedTypes || [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  },
};
