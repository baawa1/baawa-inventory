module.exports = {
  displayName: "products",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/../setup.ts"],
  testMatch: ["<rootDir>/**/*.test.ts", "<rootDir>/**/*.test.tsx"],
  collectCoverageFrom: [
    "src/components/inventory/**/*.{ts,tsx}",
    "src/app/api/products/**/*.ts",
    "src/lib/validations/product.ts",
    "src/hooks/api/products.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage/products",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    "^@/lib/(.*)$": "<rootDir>/../../src/lib/$1",
    "^@/components/(.*)$": "<rootDir>/../../src/components/$1",
    "^@/hooks/(.*)$": "<rootDir>/../../src/hooks/$1",
    "^@/app/(.*)$": "<rootDir>/../../src/app/$1",
    "^@/(.*)$": "<rootDir>/../../$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/.next/"],
  // Mock environment variables
  setupFilesAfterEnv: ["<rootDir>/setup-env.ts"],
  // Test timeout
  testTimeout: 10000,
  // Verbose output
  verbose: true,
  // Clear mocks between tests
  clearMocks: true,
  // Reset modules between tests
  resetModules: true,
  // Restore mocks between tests
  restoreMocks: true,
};
