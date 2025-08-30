import { z } from 'zod';

/**
 * Environment Variables Validation and Security
 * Centralizes all environment variable access with proper validation
 */

// Define schema for required environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Supabase URL must be valid').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Email
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  RESEND_FROM_NAME: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().optional(),
  FORCE_TEST_EMAIL: z.string().optional(),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
  
  // App Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().optional().default('3000'),
});

type Env = z.infer<typeof envSchema>;

class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private env!: Env; // Definite assignment assertion since it's set in constructor
  private isValidated = false;

  private constructor() {
    this.validateEnvironment();
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private validateEnvironment(): void {
    try {
      this.env = envSchema.parse(process.env);
      this.isValidated = true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingVars = error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join('\n');
        
        throw new Error(
          `Environment validation failed:\n${missingVars}\n\n` +
          'Please check your .env file and ensure all required variables are set.'
        );
      }
      throw error;
    }
  }

  // Safe getters with runtime validation
  public get databaseUrl(): string {
    this.ensureValidated();
    return this.env.DATABASE_URL;
  }

  public get nextAuthSecret(): string {
    this.ensureValidated();
    return this.env.NEXTAUTH_SECRET;
  }

  public get nextAuthUrl(): string | undefined {
    this.ensureValidated();
    return this.env.NEXTAUTH_URL;
  }

  public get supabaseUrl(): string | undefined {
    this.ensureValidated();
    return this.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  public get supabaseAnonKey(): string | undefined {
    this.ensureValidated();
    return this.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  public get supabaseServiceKey(): string | undefined {
    this.ensureValidated();
    return this.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  public get resendApiKey(): string | undefined {
    this.ensureValidated();
    return this.env.RESEND_API_KEY;
  }

  public get resendFromEmail(): string | undefined {
    this.ensureValidated();
    return this.env.RESEND_FROM_EMAIL;
  }

  public get resendFromName(): string | undefined {
    this.ensureValidated();
    return this.env.RESEND_FROM_NAME;
  }

  public get supportEmail(): string | undefined {
    this.ensureValidated();
    return this.env.SUPPORT_EMAIL;
  }

  public get redisUrl(): string | undefined {
    this.ensureValidated();
    return this.env.REDIS_URL;
  }

  public get nodeEnv(): 'development' | 'test' | 'production' {
    this.ensureValidated();
    return this.env.NODE_ENV;
  }

  public get port(): string {
    this.ensureValidated();
    return this.env.PORT;
  }

  // Utility methods
  public get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  public get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  public get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  private ensureValidated(): void {
    if (!this.isValidated) {
      throw new Error('Environment not validated. Please check configuration.');
    }
  }

  // Safe environment variable getter for optional values
  public getOptionalString(key: keyof Env): string | undefined {
    this.ensureValidated();
    return this.env[key] as string | undefined;
  }

  // Required environment variable getter
  public getRequiredString(key: keyof Env): string {
    this.ensureValidated();
    const value = this.env[key] as string | undefined;
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }
}

// Export singleton instance
export const envConfig = EnvironmentConfig.getInstance();

// Legacy support - gradually migrate from direct process.env access
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set and no default provided`);
  }
  return value || defaultValue!;
};

// Validation helper for runtime checks
export const validateEnvVar = (key: string, validator?: (value: string) => boolean): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  if (validator && !validator(value)) {
    throw new Error(`Environment variable ${key} failed validation`);
  }
  return value;
};