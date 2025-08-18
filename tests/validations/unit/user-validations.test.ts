/**
 * Comprehensive Unit Tests for User Validation Schemas
 * Tests user creation, update, and query validation schemas
 */

import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  userIdSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@/lib/validations/user';

describe('User Validation Schemas', () => {
  describe('createUserSchema', () => {
    const validUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'StrongPassword123!',
      phone: '+2347087367278',
      role: 'STAFF' as const,
      isActive: true,
      notes: 'Test user account',
    };

    it('should accept valid user creation data', () => {
      const result = createUserSchema.parse(validUserData);
      
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.password).toBe('StrongPassword123!');
      expect(result.role).toBe('STAFF');
      expect(result.isActive).toBe(true);
    });

    it('should apply default values', () => {
      const minimalData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'StrongPassword123!',
      };

      const result = createUserSchema.parse(minimalData);
      
      expect(result.role).toBe('STAFF'); // Default role
      expect(result.isActive).toBe(true); // Default active status
    });

    it('should accept optional fields as undefined', () => {
      const dataWithOptionals = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'StrongPassword123!',
        phone: undefined,
        notes: null,
      };

      const result = createUserSchema.parse(dataWithOptionals);
      
      expect(result.phone).toBeUndefined();
      expect(result.notes).toBeNull();
    });

    describe('Required Field Validation', () => {
      it('should reject missing firstName', () => {
        const { firstName, ...invalidData } = validUserData;
        expect(() => createUserSchema.parse(invalidData)).toThrow();
      });

      it('should reject missing lastName', () => {
        const { lastName, ...invalidData } = validUserData;
        expect(() => createUserSchema.parse(invalidData)).toThrow();
      });

      it('should reject missing email', () => {
        const { email, ...invalidData } = validUserData;
        expect(() => createUserSchema.parse(invalidData)).toThrow();
      });

      it('should reject missing password', () => {
        const { password, ...invalidData } = validUserData;
        expect(() => createUserSchema.parse(invalidData)).toThrow();
      });

      it('should reject empty string fields', () => {
        expect(() => createUserSchema.parse({ 
          ...validUserData, 
          firstName: '' 
        })).toThrow();

        expect(() => createUserSchema.parse({ 
          ...validUserData, 
          lastName: '   ' 
        })).toThrow();
      });
    });

    describe('Email Validation', () => {
      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user space@domain.com',
        ];

        invalidEmails.forEach(email => {
          expect(() => createUserSchema.parse({
            ...validUserData,
            email,
          })).toThrow();
        });
      });
    });

    describe('Password Validation', () => {
      it('should reject weak passwords', () => {
        const weakPasswords = [
          'weak',
          '12345678',
          'onlylowercase',
          'ONLYUPPERCASE',
          'NoNumbers!',
          'NoSpecialChar123',
        ];

        weakPasswords.forEach(password => {
          expect(() => createUserSchema.parse({
            ...validUserData,
            password,
          })).toThrow();
        });
      });
    });

    describe('Phone Validation', () => {
      it('should accept valid Nigerian phone numbers', () => {
        const validPhones = [
          '+2347087367278',
          '+2348012345678',
          '07039893476',
          '08123456789',
        ];

        validPhones.forEach(phone => {
          const result = createUserSchema.parse({
            ...validUserData,
            phone,
          });
          expect(result.phone).toBe(phone);
        });
      });

      it('should reject invalid phone formats', () => {
        const invalidPhones = [
          '+1234567890',
          '12345678901',
          '05012345678',
          'invalid-phone',
        ];

        invalidPhones.forEach(phone => {
          expect(() => createUserSchema.parse({
            ...validUserData,
            phone,
          })).toThrow();
        });
      });
    });

    describe('Role Validation', () => {
      it('should accept valid roles', () => {
        const validRoles = ['ADMIN', 'MANAGER', 'STAFF'] as const;

        validRoles.forEach(role => {
          const result = createUserSchema.parse({
            ...validUserData,
            role,
          });
          expect(result.role).toBe(role);
        });
      });

      it('should reject invalid roles', () => {
        const invalidRoles = ['INVALID', 'admin', 'manager', ''];

        invalidRoles.forEach(role => {
          expect(() => createUserSchema.parse({
            ...validUserData,
            role,
          })).toThrow();
        });
      });
    });

    describe('Notes Validation', () => {
      it('should accept valid notes', () => {
        const validNotes = [
          'Short note',
          'A'.repeat(500), // Max length
          '',
          null,
          undefined,
        ];

        validNotes.forEach(notes => {
          const result = createUserSchema.parse({
            ...validUserData,
            notes,
          });
          expect(result.notes).toBe(notes);
        });
      });

      it('should reject notes that are too long', () => {
        const tooLongNotes = 'A'.repeat(501);
        
        expect(() => createUserSchema.parse({
          ...validUserData,
          notes: tooLongNotes,
        })).toThrow();
      });
    });
  });

  describe('updateUserSchema', () => {
    it('should accept partial updates', () => {
      const updateData = {
        firstName: 'Jane',
        email: 'jane@example.com',
      };

      const result = updateUserSchema.parse(updateData);
      
      expect(result.firstName).toBe('Jane');
      expect(result.email).toBe('jane@example.com');
      expect(result.lastName).toBeUndefined();
    });

    it('should accept empty updates', () => {
      const result = updateUserSchema.parse({});
      
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should validate fields when provided', () => {
      expect(() => updateUserSchema.parse({
        email: 'invalid-email',
      })).toThrow();

      expect(() => updateUserSchema.parse({
        firstName: '',
      })).toThrow();
    });

    it('should not allow password updates', () => {
      // Password should not be in the update schema for security
      const updateData = {
        firstName: 'Jane',
        password: 'NewPassword123!',
      };

      // This should either ignore password or have a separate schema
      const result = updateUserSchema.parse(updateData);
      expect('password' in result).toBe(false);
    });

    it('should handle role updates', () => {
      const result = updateUserSchema.parse({
        role: 'MANAGER',
      });

      expect(result.role).toBe('MANAGER');
    });

    it('should handle status updates', () => {
      const statusUpdates = ['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'SUSPENDED'];

      statusUpdates.forEach(userStatus => {
        const result = updateUserSchema.parse({
          userStatus: userStatus as any,
        });
        expect(result.userStatus).toBe(userStatus);
      });
    });
  });

  describe('userQuerySchema', () => {
    it('should accept valid query parameters', () => {
      const queryData = {
        page: 2,
        limit: 20,
        search: 'john',
        role: 'ADMIN',
        userStatus: 'APPROVED',
        isActive: true,
        sortBy: 'email',
        sortOrder: 'asc' as const,
      };

      const result = userQuerySchema.parse(queryData);
      
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.search).toBe('john');
      expect(result.role).toBe('ADMIN');
      expect(result.userStatus).toBe('APPROVED');
      expect(result.isActive).toBe(true);
      expect(result.sortBy).toBe('email');
      expect(result.sortOrder).toBe('asc');
    });

    it('should apply default values', () => {
      const result = userQuerySchema.parse({});
      
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should handle string coercion for numbers', () => {
      const result = userQuerySchema.parse({
        page: '3',
        limit: '25',
      });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(25);
    });

    it('should handle boolean coercion', () => {
      const result = userQuerySchema.parse({
        isActive: 'true',
      });

      expect(result.isActive).toBe(true);
    });

    it('should validate enum values', () => {
      expect(() => userQuerySchema.parse({
        role: 'INVALID',
      })).toThrow();

      expect(() => userQuerySchema.parse({
        userStatus: 'INVALID',
      })).toThrow();

      expect(() => userQuerySchema.parse({
        sortOrder: 'invalid',
      })).toThrow();
    });
  });

  describe('userIdSchema', () => {
    it('should accept valid user IDs', () => {
      expect(userIdSchema.parse(1)).toBe(1);
      expect(userIdSchema.parse(999999)).toBe(999999);
    });

    it('should reject invalid IDs', () => {
      expect(() => userIdSchema.parse(0)).toThrow();
      expect(() => userIdSchema.parse(-1)).toThrow();
      expect(() => userIdSchema.parse(1.5)).toThrow();
      expect(() => userIdSchema.parse('1')).toThrow();
    });
  });

  describe('changePasswordSchema', () => {
    const validPasswordData = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewStrongPassword456@',
    };

    it('should accept valid password change data', () => {
      const result = changePasswordSchema.parse(validPasswordData);
      
      expect(result.currentPassword).toBe('OldPassword123!');
      expect(result.newPassword).toBe('NewStrongPassword456@');
    });

    it('should require both passwords', () => {
      expect(() => changePasswordSchema.parse({
        currentPassword: 'OldPassword123!',
      })).toThrow();

      expect(() => changePasswordSchema.parse({
        newPassword: 'NewStrongPassword456@',
      })).toThrow();
    });

    it('should validate new password strength', () => {
      expect(() => changePasswordSchema.parse({
        currentPassword: 'anything',
        newPassword: 'weak',
      })).toThrow();
    });

    it('should accept any current password format', () => {
      // Current password doesn't need to meet strength requirements
      const result = changePasswordSchema.parse({
        currentPassword: 'old-weak-password',
        newPassword: 'NewStrongPassword456@',
      });

      expect(result.currentPassword).toBe('old-weak-password');
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.parse({
        email: 'user@example.com',
      });

      expect(result.email).toBe('user@example.com');
    });

    it('should require email field', () => {
      expect(() => forgotPasswordSchema.parse({})).toThrow();
    });

    it('should validate email format', () => {
      expect(() => forgotPasswordSchema.parse({
        email: 'invalid-email',
      })).toThrow();
    });
  });

  describe('resetPasswordSchema', () => {
    const validResetData = {
      token: 'valid-reset-token-string',
      newPassword: 'NewStrongPassword123!',
    };

    it('should accept valid reset data', () => {
      const result = resetPasswordSchema.parse(validResetData);
      
      expect(result.token).toBe('valid-reset-token-string');
      expect(result.newPassword).toBe('NewStrongPassword123!');
    });

    it('should require both token and password', () => {
      expect(() => resetPasswordSchema.parse({
        token: 'valid-token',
      })).toThrow();

      expect(() => resetPasswordSchema.parse({
        newPassword: 'NewStrongPassword123!',
      })).toThrow();
    });

    it('should validate password strength', () => {
      expect(() => resetPasswordSchema.parse({
        token: 'valid-token',
        newPassword: 'weak',
      })).toThrow();
    });

    it('should require non-empty token', () => {
      expect(() => resetPasswordSchema.parse({
        token: '',
        newPassword: 'NewStrongPassword123!',
      })).toThrow();
    });
  });

  describe('verifyEmailSchema', () => {
    it('should accept valid verification token', () => {
      const result = verifyEmailSchema.parse({
        token: 'valid-verification-token',
      });

      expect(result.token).toBe('valid-verification-token');
    });

    it('should require token field', () => {
      expect(() => verifyEmailSchema.parse({})).toThrow();
    });

    it('should require non-empty token', () => {
      expect(() => verifyEmailSchema.parse({
        token: '',
      })).toThrow();

      expect(() => verifyEmailSchema.parse({
        token: '   ',
      })).toThrow();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        [],
        'string',
        123,
        { unknownField: 'value' },
      ];

      malformedInputs.forEach(input => {
        expect(() => createUserSchema.parse(input)).toThrow();
      });
    });

    it('should not allow SQL injection patterns in names', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "Robert'; DELETE FROM users WHERE 't'='t",
        "<script>alert('xss')</script>",
      ];

      sqlInjectionAttempts.forEach(maliciousInput => {
        // Names should be treated as plain text and not cause parsing errors
        const result = createUserSchema.parse({
          firstName: maliciousInput,
          lastName: 'Doe',
          email: 'user@example.com',
          password: 'StrongPassword123!',
        });

        expect(result.firstName).toBe(maliciousInput);
      });
    });

    it('should handle very long input fields', () => {
      const veryLongString = 'a'.repeat(1000);

      expect(() => createUserSchema.parse({
        firstName: veryLongString, // Should fail due to max length
        lastName: 'Doe',
        email: 'user@example.com',
        password: 'StrongPassword123!',
      })).toThrow();
    });

    it('should validate against common password attacks', () => {
      const commonAttackPasswords = [
        'password123!', // Common password
        'Password123!', // Common password
        'admin123456!', // Common password
        '123456789012', // Sequential numbers
      ];

      commonAttackPasswords.forEach(password => {
        expect(() => createUserSchema.parse({
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          password,
        })).toThrow();
      });
    });
  });
});