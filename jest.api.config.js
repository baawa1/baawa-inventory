const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // Test environment for API tests
  testEnvironment: "node",

  // Module name mapping for absolute imports
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/tests/(.*)$": "<rootDir>/tests/$1",
  },

  // Test file patterns - only API tests
  testMatch: ["<rootDir>/tests/api/**/*.test.{js,jsx,ts,tsx}"],

  // Exclude patterns
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/app/api/**/*.{js,jsx,ts,tsx}",
    "src/lib/api-*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test timeout
  testTimeout: 15000,

  // Transform configuration
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },

  // Transform ignore patterns for ES modules
  transformIgnorePatterns: ["node_modules/(?!(node-fetch)/)"],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Global setup for API tests
  globalSetup: "<rootDir>/tests/api/setup.js",
  globalTeardown: "<rootDir>/tests/api/teardown.js",
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
