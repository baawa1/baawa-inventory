import { PasswordPolicy } from '@/lib/utils/password-policy';

describe('PasswordPolicy', () => {
  it('accepts a valid 8-character password with any symbol', () => {
    const result = PasswordPolicy.validatePassword('Abcd123.');

    expect(result.isValid).toBe(true);
    expect(result.requirements.length).toBe(true);
    expect(result.requirements.symbols).toBe(true);
  });

  it('rejects common passwords even when they meet the format rule', () => {
    const result = PasswordPolicy.validatePassword('Password123!');

    expect(result.isValid).toBe(false);
    expect(result.requirements.notCommonPassword).toBe(false);
  });

  it('describes the relaxed policy in requirement text', () => {
    expect(PasswordPolicy.getRequirementsText()).toEqual(
      expect.arrayContaining([
        'Must be between 8 and 128 characters long',
        'Must contain at least one uppercase letter',
        'Must contain at least one lowercase letter',
        'Must contain at least one number',
        'Must contain at least one symbol',
      ])
    );
  });

  it('generates secure passwords that satisfy the relaxed rule', () => {
    const password = PasswordPolicy.generateSecurePassword(12);
    const result = PasswordPolicy.validatePassword(password);

    expect(password).toHaveLength(12);
    expect(result.isValid).toBe(true);
    expect(result.requirements.uppercase).toBe(true);
    expect(result.requirements.lowercase).toBe(true);
    expect(result.requirements.numbers).toBe(true);
    expect(result.requirements.symbols).toBe(true);
  });

  it('returns reuse warnings for previously used password hashes', async () => {
    await expect(
      PasswordPolicy.checkPasswordReuse(1, 'hash-2', ['hash-1', 'hash-2'])
    ).resolves.toEqual({
      isReused: true,
      message:
        'This password has been used recently. Please choose a different password.',
    });
  });

  it('includes the relaxed rule in password suggestions', () => {
    expect(PasswordPolicy.generatePasswordSuggestions()).toEqual(
      expect.arrayContaining([
        'Include numbers and at least one symbol',
        'Make it at least 8 characters long',
      ])
    );
  });
});
