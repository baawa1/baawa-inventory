const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^#root/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/tests/critical/**/*.test.{ts,tsx}',
    '<rootDir>/src/lib/utils/__tests__/**/*.test.{ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.worktrees/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  clearMocks: true,
  verbose: true,
};

module.exports = createJestConfig(customJestConfig);
