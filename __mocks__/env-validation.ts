// Mock for environment validation system used in tests

export const envConfig = {
  // Database
  databaseUrl: 'postgresql://test:test@localhost:5432/test_db',
  
  // Authentication
  nextAuthSecret: 'test-secret-key-for-tests-only-32-chars-long',
  nextAuthUrl: 'http://localhost:3000',
  
  // Supabase (optional)
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'test-anon-key',
  supabaseServiceKey: 'test-service-key',
  
  // Email (optional)
  resendApiKey: 'test-resend-key',
  resendFromEmail: 'test@example.com',
  resendFromName: 'Test App',
  supportEmail: 'support@example.com',
  
  // Redis (optional)
  redisUrl: 'redis://localhost:6379',
  
  // App Environment
  nodeEnv: 'test' as const,
  port: '3000',
  
  // Environment flags
  isDevelopment: false,
  isProduction: false,
  isTest: true,
  
  // Utility methods
  getOptionalString: jest.fn((key: string) => {
    const mockValues: Record<string, string> = {
      'FORCE_TEST_EMAIL': 'false',
      'NEXT_PUBLIC_SUPABASE_URL': 'https://test.supabase.co',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'test-anon-key',
      'SUPABASE_SERVICE_ROLE_KEY': 'test-service-key',
      'RESEND_API_KEY': 'test-resend-key',
      'RESEND_FROM_EMAIL': 'test@example.com',
      'RESEND_FROM_NAME': 'Test App',
      'SUPPORT_EMAIL': 'support@example.com',
      'REDIS_URL': 'redis://localhost:6379',
    };
    return mockValues[key];
  }),
  
  getRequiredString: jest.fn((key: string) => {
    const mockValues: Record<string, string> = {
      'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
      'NEXTAUTH_SECRET': 'test-secret-key-for-tests-only-32-chars-long',
    };
    const value = mockValues[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }),
};

// Legacy support functions
export const getEnvVar = jest.fn((key: string, defaultValue?: string) => {
  const mockEnvValues: Record<string, string> = {
    'NODE_ENV': 'test',
    'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db',
    'NEXTAUTH_SECRET': 'test-secret-key-for-tests-only-32-chars-long',
    'NEXTAUTH_URL': 'http://localhost:3000',
  };
  return mockEnvValues[key] || defaultValue || '';
});

export const validateEnvVar = jest.fn((key: string, validator?: (value: string) => boolean) => {
  const value = getEnvVar(key);
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  if (validator && !validator(value)) {
    throw new Error(`Environment variable ${key} failed validation`);
  }
  return value;
});

// Mock the EnvironmentConfig class
export const EnvironmentConfig = jest.fn().mockImplementation(() => envConfig);

export default envConfig;