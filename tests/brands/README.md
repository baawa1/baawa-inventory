# Brand Test Suite

This directory contains comprehensive tests for the brand management functionality in the inventory POS system.

## Test Structure

```
tests/brands/
├── unit/                           # Unit tests
│   └── brand-validation-comprehensive.test.ts
├── integration/                    # Integration tests
│   └── brand-api-comprehensive.test.ts
├── components/                     # Component tests
│   └── brand-form.test.tsx
├── e2e/                           # End-to-end tests
│   └── brand-workflow.test.ts
├── jest.config.js                 # Jest configuration
├── setup-env.ts                   # Test environment setup
└── README.md                      # This file
```

## Test Categories

### 1. Unit Tests (`unit/`)

- **Validation Tests**: Test brand validation schemas and rules
- **Utility Tests**: Test brand-related utility functions
- **Type Tests**: Test TypeScript type definitions

### 2. Integration Tests (`integration/`)

- **API Tests**: Test brand API endpoints
- **Database Tests**: Test brand database operations
- **Authentication Tests**: Test brand API authentication
- **Authorization Tests**: Test brand API authorization

### 3. Component Tests (`components/`)

- **Form Tests**: Test brand form components
- **Dialog Tests**: Test brand dialog components
- **List Tests**: Test brand list components
- **Hook Tests**: Test brand-related React hooks

### 4. E2E Tests (`e2e/`)

- **Workflow Tests**: Test complete brand management workflows
- **User Journey Tests**: Test user interactions with brand features
- **Cross-browser Tests**: Test brand functionality across browsers

## Test Coverage Goals

- **Unit Tests**: 95%+ coverage
- **Integration Tests**: 90%+ coverage
- **Component Tests**: 85%+ coverage
- **E2E Tests**: 80%+ coverage

## Running Tests

### Run All Brand Tests

```bash
npm run test:brands
```

### Run Specific Test Categories

```bash
# Unit tests only
npm run test:brands:unit

# Integration tests only
npm run test:brands:integration

# Component tests only
npm run test:brands:components

# E2E tests only
npm run test:brands:e2e
```

### Run Tests with Coverage

```bash
npm run test:brands:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:brands:watch
```

## Test Data

### Sample Brand Data

```typescript
const sampleBrand = {
  id: "1",
  name: "Test Brand",
  description: "Test Description",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Test Scenarios

1. **Valid Brand Creation**: Test creating brands with valid data
2. **Invalid Brand Creation**: Test validation errors
3. **Brand Updates**: Test updating existing brands
4. **Brand Deletion**: Test deleting brands
5. **Brand Search**: Test search functionality
6. **Brand Filtering**: Test filtering by status
7. **Bulk Operations**: Test bulk actions
8. **Error Handling**: Test error scenarios

## Test Utilities

### Mock Data Generators

```typescript
// Generate test brands
const generateTestBrand = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.lorem.sentence(),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

### Test Helpers

```typescript
// Setup test database
const setupTestDatabase = async () => {
  // Database setup logic
};

// Cleanup test database
const cleanupTestDatabase = async () => {
  // Database cleanup logic
};
```

## Test Configuration

### Jest Configuration

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setup-env.ts"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};
```

### Environment Variables

```bash
# Test database
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/test_db"

# Test API
TEST_API_URL="http://localhost:3001/api"

# Test authentication
TEST_ADMIN_EMAIL="admin@test.com"
TEST_ADMIN_PASSWORD="password123"
```

## Test Maintenance

### Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts` or `*.test.tsx`
3. Use descriptive test names
4. Include proper setup and teardown
5. Add to test runner script

### Updating Tests

1. Update test data when schema changes
2. Update mock data when API changes
3. Update selectors when UI changes
4. Update assertions when behavior changes

### Test Debugging

```bash
# Run single test file
npm run test:brands -- --testNamePattern="Brand Creation"

# Run with verbose output
npm run test:brands -- --verbose

# Run with debug logging
DEBUG=* npm run test:brands
```

## Best Practices

### Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### Test Data Management

- Use factories for test data generation
- Clean up test data after each test
- Use unique identifiers for test data
- Avoid hardcoded test data

### Assertions

- Use specific assertions
- Test both positive and negative cases
- Verify error messages and states
- Test edge cases and boundaries

### Performance

- Mock external dependencies
- Use efficient test data setup
- Avoid unnecessary API calls
- Use test database for integration tests

## Troubleshooting

### Common Issues

1. **Test Database Connection**: Ensure test database is running
2. **Mock Data**: Verify mock data matches current schema
3. **Selectors**: Update selectors when UI changes
4. **Timing**: Add appropriate waits for async operations

### Debug Commands

```bash
# Check test database
npm run test:db:check

# Reset test database
npm run test:db:reset

# View test logs
npm run test:brands -- --verbose --no-coverage
```

## Contributing

When adding new brand functionality:

1. Add corresponding unit tests
2. Add integration tests for API endpoints
3. Add component tests for UI components
4. Add E2E tests for user workflows
5. Update this README with new test information

## Related Documentation

- [Brand API Documentation](../api/brands.md)
- [Brand Component Documentation](../components/brands.md)
- [Test Suite Overview](../README.md)
- [Testing Guidelines](../GUIDELINES.md)
