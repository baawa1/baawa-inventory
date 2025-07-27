/**
 * Password Policy and Strength Validation
 * Comprehensive password security requirements and validation
 */

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns: string[];
  forbiddenWords: string[];
  preventReuse: boolean;
  reuseLimit: number;
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
    specialChars: boolean;
    noForbiddenPatterns: boolean;
    noCommonWords: boolean;
  };
}

export class PasswordPolicy {
  private static readonly DEFAULT_REQUIREMENTS: PasswordRequirements = {
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenPatterns: [
      'password',
      'admin',
      'user',
      'login',
      'welcome',
      'qwerty',
      'abc123',
      '123456',
      'letmein',
      'monkey',
      'dragon',
      'master',
      'shadow',
      'superman',
      'michael',
      'football',
      'baseball',
      'mustang',
      'access',
      'batman',
      'trustno1',
      'starwars',
      'matrix',
      'freedom',
      'whatever',
      'secret',
    ],
    forbiddenWords: ['inventory', 'pos', 'system', 'company', 'business'],
    preventReuse: true,
    reuseLimit: 5,
  };

  private static readonly SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
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
    const uppercaseValid = !policy.requireUppercase || /[A-Z]/.test(password);
    if (!uppercaseValid) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (policy.requireUppercase) {
      score += 15;
    }

    // Check lowercase requirement
    const lowercaseValid = !policy.requireLowercase || /[a-z]/.test(password);
    if (!lowercaseValid) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (policy.requireLowercase) {
      score += 15;
    }

    // Check numbers requirement
    const numbersValid = !policy.requireNumbers || /\d/.test(password);
    if (!numbersValid) {
      feedback.push('Password must contain at least one number');
    } else if (policy.requireNumbers) {
      score += 15;
    }

    // Check special characters requirement
    const specialCharsValid =
      !policy.requireSpecialChars ||
      new RegExp(
        `[${this.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
      ).test(password);
    if (!specialCharsValid) {
      feedback.push('Password must contain at least one special character');
    } else if (policy.requireSpecialChars) {
      score += 15;
    }

    // Check forbidden patterns
    const forbiddenPatternsValid = !policy.forbiddenPatterns.some(pattern =>
      password.toLowerCase().includes(pattern.toLowerCase())
    );
    if (!forbiddenPatternsValid) {
      feedback.push('Password contains forbidden words or patterns');
    } else {
      score += 10;
    }

    // Check forbidden words
    const forbiddenWordsValid = !policy.forbiddenWords.some(word =>
      password.toLowerCase().includes(word.toLowerCase())
    );
    if (!forbiddenWordsValid) {
      feedback.push('Password contains company-specific forbidden words');
    } else {
      score += 10;
    }

    // Check for common patterns
    const noCommonPatterns = !this.COMMON_PATTERNS.some(pattern =>
      pattern.test(password)
    );
    if (!noCommonPatterns) {
      feedback.push(
        'Password contains common patterns (repeated characters, sequences, etc.)'
      );
      score -= 10;
    }

    // Bonus points for complexity
    const characterTypes = [
      /[A-Z]/.test(password), // Uppercase
      /[a-z]/.test(password), // Lowercase
      /\d/.test(password), // Numbers
      new RegExp(
        `[${this.SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`
      ).test(password), // Special chars
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
      specialCharsValid &&
      forbiddenPatternsValid &&
      forbiddenWordsValid &&
      noCommonPatterns;

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
        specialChars: specialCharsValid,
        noForbiddenPatterns: forbiddenPatternsValid,
        noCommonWords: forbiddenWordsValid,
      },
    };
  }

  /**
   * Generate password strength suggestions
   */
  static generatePasswordSuggestions(): string[] {
    return [
      'Use a mix of uppercase and lowercase letters',
      'Include numbers and special characters',
      'Make it at least 12 characters long',
      'Avoid common words and patterns',
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
    const specialChars = this.SPECIAL_CHARS;

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
    if (policy.requireSpecialChars)
      text.push('Must contain at least one special character');

    text.push('Cannot contain common words or patterns');
    text.push('Cannot contain company-specific terms');

    if (policy.preventReuse) {
      text.push(`Cannot reuse any of your last ${policy.reuseLimit} passwords`);
    }

    return text;
  }
}
