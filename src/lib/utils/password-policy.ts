/**
 * Password Policy and Strength Validation
 * Comprehensive password security requirements and validation
 */
import {
  COMMON_PASSWORD_BLOCKLIST,
  PASSWORD_POLICY,
  PASSWORD_REGEX,
} from '@/lib/validations/common';

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  blockCommonPasswords: boolean;
}

export interface PasswordStrengthResult {
  isValid: boolean;
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  score: number; // 0-100
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    notCommonPassword: boolean;
  };
}

export class PasswordPolicy {
  private static readonly DEFAULT_REQUIREMENTS: PasswordRequirements = {
    minLength: PASSWORD_POLICY.minLength,
    maxLength: PASSWORD_POLICY.maxLength,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    blockCommonPasswords: true,
  };

  private static readonly SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  private static readonly COMMON_PATTERNS = [
    /(.)\1{2,}/g, // Repeated characters (aaa, 111, etc.)
    /123456|654321|abcdef|qwerty|asdfgh|zxcvbn/i, // Common sequences
    /^(.+)(.+)\1\2$/i, // Repeated patterns (abcabc, 123123)
  ];

  /**
   * Validate password against policy requirements
   */
  static validatePassword(
    password: string,
    requirements: Partial<PasswordRequirements> = {}
  ): PasswordStrengthResult {
    const policy = { ...this.DEFAULT_REQUIREMENTS, ...requirements };
    const feedback: string[] = [];
    let score = 0;

    // Check length requirement
    const lengthValid =
      password.length >= policy.minLength &&
      password.length <= policy.maxLength;
    if (!lengthValid) {
      feedback.push(
        `Password must be between ${policy.minLength} and ${policy.maxLength} characters`
      );
    } else {
      score += 20;
    }

    // Check uppercase requirement
    const uppercaseValid =
      !policy.requireUppercase || PASSWORD_REGEX.uppercase.test(password);
    if (!uppercaseValid) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (policy.requireUppercase) {
      score += 15;
    }

    // Check lowercase requirement
    const lowercaseValid =
      !policy.requireLowercase || PASSWORD_REGEX.lowercase.test(password);
    if (!lowercaseValid) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (policy.requireLowercase) {
      score += 15;
    }

    // Check numbers requirement
    const numbersValid =
      !policy.requireNumbers || PASSWORD_REGEX.number.test(password);
    if (!numbersValid) {
      feedback.push('Password must contain at least one number');
    } else if (policy.requireNumbers) {
      score += 15;
    }

    // Check symbol requirement
    const symbolsValid =
      !policy.requireSymbols || PASSWORD_REGEX.symbol.test(password);
    if (!symbolsValid) {
      feedback.push('Password must contain at least one symbol');
    } else if (policy.requireSymbols) {
      score += 15;
    }

    const commonPasswordValid =
      !policy.blockCommonPasswords ||
      !COMMON_PASSWORD_BLOCKLIST.has(password.toLowerCase());
    if (!commonPasswordValid) {
      feedback.push(
        'Password is too common. Please choose a more secure password.'
      );
    } else {
      score += 10;
    }

    // Penalize obvious sequences without making them invalid.
    const noCommonPatterns = !this.COMMON_PATTERNS.some(pattern =>
      pattern.test(password)
    );
    if (!noCommonPatterns) {
      feedback.push(
        'Avoid repeated characters or obvious sequences when possible.'
      );
      score -= 10;
    }

    // Bonus points for complexity
    const characterTypes = [
      PASSWORD_REGEX.uppercase.test(password), // Uppercase
      PASSWORD_REGEX.lowercase.test(password), // Lowercase
      PASSWORD_REGEX.number.test(password), // Numbers
      PASSWORD_REGEX.symbol.test(password), // Symbols
    ].filter(Boolean).length;

    if (characterTypes >= 3) {
      score += 5;
    }
    if (characterTypes === 4) {
      score += 5;
    }

    // Length bonus
    if (password.length >= 16) {
      score += 10;
    } else if (password.length >= 14) {
      score += 5;
    }

    // Entropy bonus (unique characters)
    const uniqueChars = new Set(password).size;
    const entropyRatio = uniqueChars / password.length;
    if (entropyRatio > 0.7) {
      score += 10;
    } else if (entropyRatio > 0.5) {
      score += 5;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine strength level
    let strength: PasswordStrengthResult['strength'];
    if (score >= 90) strength = 'very-strong';
    else if (score >= 75) strength = 'strong';
    else if (score >= 60) strength = 'good';
    else if (score >= 40) strength = 'fair';
    else if (score >= 20) strength = 'weak';
    else strength = 'very-weak';

    // Overall validity
    const isValid =
      lengthValid &&
      uppercaseValid &&
      lowercaseValid &&
      numbersValid &&
      symbolsValid &&
      commonPasswordValid;

    return {
      isValid,
      strength,
      score,
      feedback,
      requirements: {
        length: lengthValid,
        uppercase: uppercaseValid,
        lowercase: lowercaseValid,
        numbers: numbersValid,
        symbols: symbolsValid,
        notCommonPassword: commonPasswordValid,
      },
    };
  }

  /**
   * Generate password strength suggestions
   */
  static generatePasswordSuggestions(): string[] {
    return [
      'Use a mix of uppercase and lowercase letters',
      'Include numbers and at least one symbol',
      'Make it at least 8 characters long',
      'Avoid obvious sequences when possible',
      'Consider using a passphrase with multiple words',
      'Use a password manager to generate strong passwords',
      'Avoid personal information like names, birthdays, or addresses',
      "Don't reuse passwords across different accounts",
    ];
  }

  /**
   * Check if password has been used recently (for reuse prevention)
   */
  static async checkPasswordReuse(
    userId: number,
    newPasswordHash: string,
    previousHashes: string[]
  ): Promise<{ isReused: boolean; message?: string }> {
    // This would typically check against a database of previous password hashes
    // For now, we'll just check against the provided array
    const isReused = previousHashes.includes(newPasswordHash);

    return {
      isReused,
      message: isReused
        ? 'This password has been used recently. Please choose a different password.'
        : undefined,
    };
  }

  /**
   * Generate a secure password suggestion
   */
  static generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = this.SYMBOL_CHARS;

    const allChars = uppercase + lowercase + numbers + specialChars;

    let password = '';

    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Get password policy requirements for display
   */
  static getRequirementsText(
    requirements: Partial<PasswordRequirements> = {}
  ): string[] {
    const policy = { ...this.DEFAULT_REQUIREMENTS, ...requirements };
    const text: string[] = [];

    text.push(
      `Must be between ${policy.minLength} and ${policy.maxLength} characters long`
    );

    if (policy.requireUppercase)
      text.push('Must contain at least one uppercase letter');
    if (policy.requireLowercase)
      text.push('Must contain at least one lowercase letter');
    if (policy.requireNumbers) text.push('Must contain at least one number');
    if (policy.requireSymbols) text.push('Must contain at least one symbol');
    if (policy.blockCommonPasswords)
      text.push('Cannot be a very common password');

    return text;
  }
}
