import { describe, it, expect } from 'vitest';
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createCompanySchema,
  upgradeToBusinessSchema,
} from './auth';

const validSignup = {
  name: 'Jane Doe',
  username: 'jane_doe1',
  email: 'jane@example.com',
  password: 'Str0ng!Pass',
};

describe('signupSchema', () => {
  it('accepts a valid signup payload', () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it('rejects a username with invalid characters', () => {
    const result = signupSchema.safeParse({ ...validSignup, username: 'jane doe!' });
    expect(result.success).toBe(false);
  });

  it('rejects a password missing an uppercase letter', () => {
    const result = signupSchema.safeParse({ ...validSignup, password: 'weakpass1!' });
    expect(result.success).toBe(false);
  });

  it('rejects a password missing a special character', () => {
    const result = signupSchema.safeParse({ ...validSignup, password: 'Weakpass1' });
    expect(result.success).toBe(false);
  });

  it('rejects a password under 8 characters', () => {
    const result = signupSchema.safeParse({ ...validSignup, password: 'Sh0rt!' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({ ...validSignup, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts a non-empty identifier and password', () => {
    expect(loginSchema.safeParse({ identifier: 'jane@example.com', password: 'x' }).success).toBe(true);
  });

  it('rejects an empty identifier', () => {
    expect(loginSchema.safeParse({ identifier: '', password: 'x' }).success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts an empty object since all fields are optional', () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it('accepts an empty-string website (used to clear the field)', () => {
    expect(updateProfileSchema.safeParse({ website: '' }).success).toBe(true);
  });

  it('rejects a malformed website URL', () => {
    expect(updateProfileSchema.safeParse({ website: 'not-a-url' }).success).toBe(false);
  });

  it('rejects a phone number that fails the E.164-like pattern', () => {
    expect(updateProfileSchema.safeParse({ phone: 'abc' }).success).toBe(false);
  });

  it('accepts a valid phone number', () => {
    expect(updateProfileSchema.safeParse({ phone: '+919876543210' }).success).toBe(true);
  });
});

describe('changePasswordSchema', () => {
  it('accepts matching new and confirm passwords', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old',
      newPassword: 'Str0ng!Pass',
      confirmPassword: 'Str0ng!Pass',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched confirm password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'old',
      newPassword: 'Str0ng!Pass',
      confirmPassword: 'Different1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['confirmPassword']);
    }
  });
});

describe('forgotPasswordSchema', () => {
  it('rejects an invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('requires a non-empty token and a strong password', () => {
    expect(resetPasswordSchema.safeParse({ token: '', password: 'Str0ng!Pass' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: 't1', password: 'weak' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: 't1', password: 'Str0ng!Pass' }).success).toBe(true);
  });
});

describe('createCompanySchema', () => {
  it('accepts a valid company payload', () => {
    const result = createCompanySchema.safeParse({ name: 'Acme Inc', slug: 'acme-inc' });
    expect(result.success).toBe(true);
  });

  it('rejects a slug with uppercase letters', () => {
    expect(createCompanySchema.safeParse({ name: 'Acme Inc', slug: 'Acme-Inc' }).success).toBe(false);
  });

  it('rejects a malformed GST number when provided', () => {
    const result = createCompanySchema.safeParse({ name: 'Acme Inc', slug: 'acme-inc', gstNumber: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('allows an empty-string GST number', () => {
    const result = createCompanySchema.safeParse({ name: 'Acme Inc', slug: 'acme-inc', gstNumber: '' });
    expect(result.success).toBe(true);
  });
});

describe('upgradeToBusinessSchema', () => {
  it('requires either companyId or companyName', () => {
    const result = upgradeToBusinessSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['companyName']);
    }
  });

  it('accepts a payload with only companyId set', () => {
    expect(upgradeToBusinessSchema.safeParse({ companyId: 'c1' }).success).toBe(true);
  });

  it('accepts a payload with only companyName set', () => {
    expect(upgradeToBusinessSchema.safeParse({ companyName: 'Acme Inc' }).success).toBe(true);
  });

  it('rejects an invalid establishedYear', () => {
    const result = upgradeToBusinessSchema.safeParse({ companyId: 'c1', establishedYear: '1899' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid establishedYear', () => {
    const result = upgradeToBusinessSchema.safeParse({ companyId: 'c1', establishedYear: '2020' });
    expect(result.success).toBe(true);
  });
});
