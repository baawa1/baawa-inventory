import { passwordSchema } from '@/lib/validations/common';

describe('password schema', () => {
  it('accepts a valid 8-character password with a symbol', () => {
    const result = passwordSchema.safeParse('Abcd123.');
    expect(result.success).toBe(true);
  });

  it('rejects passwords that are too short', () => {
    const result = passwordSchema.safeParse('Short1!');
    expect(result.success).toBe(false);
  });

  it('rejects passwords missing required character classes', () => {
    const noSpecial = passwordSchema.safeParse('SecurePass1234');
    expect(noSpecial.success).toBe(false);

    const noUppercase = passwordSchema.safeParse('securepass123!');
    expect(noUppercase.success).toBe(false);

    const noLowercase = passwordSchema.safeParse('SECURE123!');
    expect(noLowercase.success).toBe(false);

    const noNumber = passwordSchema.safeParse('SecurePass!!!');
    expect(noNumber.success).toBe(false);
  });

  it('rejects common passwords', () => {
    const result = passwordSchema.safeParse('Password123!');
    expect(result.success).toBe(false);
  });
});
