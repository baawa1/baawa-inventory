# Category Test Suite

This directory contains comprehensive tests for the category management functionality in the inventory POS system.

## Test Structure

```
tests/categories/
├── unit/                           # Unit tests
│   └── category-validation-comprehensive.test.ts
├── integration/                    # Integration tests
│   └── category-api-comprehensive.test.ts
├── components/                     # Component tests
│   └── category-form.test.tsx
├── e2e/                           # End-to-end tests
│   └── category-workflow.test.ts
├── jest.config.js                 # Jest configuration
├── setup-env.ts                   # Test environment setup
└── README.md                      # This file
```

## Test Categories

### 1. Unit Tests (`unit/`)

- **Validation Tests**: Test category validation schemas and rules
- **Utility Tests**: Test category-related utility functions
- **Type Tests**: Test TypeScript type definitions
- **Hierarchy Tests**: Test category hierarchy logic

### 2. Integration Tests (`integration/`)

- **API Tests**: Test category API endpoints
- **Database Tests**: Test category database operations
- **Authentication Tests**: Test category API authentication
- **Authorization Tests**: Test category API authorization
- **Hierarchy Tests**: Test category parent-child relationships

### 3. Component Tests (`components/`)

- **Form Tests**: Test category form components
- **Dialog Tests**: Test category dialog components
- **List Tests**: Test category list components
- **Hook Tests**: Test category-related React hooks
- **Tree Tests**: Test category tree/hierarchy components

### 4. E2E Tests (`e2e/`)

- **Workflow Tests**: Test complete category management workflows
- **User Journey Tests**: Test user interactions with category features
- **Cross-browser Tests**: Test category functionality across browsers
- **Hierarchy Tests**: Test category hierarchy management

## Test Coverage Goals

- **Unit Tests**: 95%+ coverage
- **Integration Tests**: 90%+ coverage
- **Component Tests**: 85%+ coverage
- **E2E Tests**: 80%+ coverage

## Running Tests

### Run All Category Tests

```bash
npm run test:categories
```

### Run Specific Test Categories

```bash
# Unit tests only
npm run test:categories:unit

# Integration tests only
npm run test:categories:integration

# Component tests only
npm run test:categories:components

# E2E tests only
npm run test:categories:e2e
```

### Run Tests with Coverage

```bash
npm run test:categories:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:categories:watch
```

## Test Data

### Sample Category Data

```typescript
const sampleCategory = {
  id: "1",
  name: "Test Category",
  description: "Test Description",
  isActive: true,
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Sample Category Hierarchy

```typescript
const categoryHierarchy = {
  electronics: {
    id: "1",
    name: "Electronics",
    parentId: null,
    children: [
      {
        id: "2",
        name: "Smartphones",
        parentId: "1",
        children: [
          {
            id: "3",
            name: "Android Phones",
            parentId: "2",
          },
          {
            id: "4",
            name: "iPhones",
            parentId: "2",
          },
        ],
      },
    ],
  },
};
```

### Test Scenarios

1. **Valid Category Creation**: Test creating categories with valid data
2. **Invalid Category Creation**: Test validation errors
3. **Category Updates**: Test updating existing categories
4. **Category Deletion**: Test deleting categories
5. **Category Search**: Test search functionality
6. **Category Filtering**: Test filtering by status and hierarchy
7. **Hierarchy Management**: Test parent-child relationships
8. **Bulk Operations**: Test bulk actions
9. **Error Handling**: Test error scenarios
10. **Circular Reference Prevention**: Test hierarchy validation

## Test Utilities

### Mock Data Generators

```typescript
// Generate test categories
const generateTestCategory = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.commerce.department(),
  description: faker.lorem.sentence(),
  isActive: true,
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Generate category hierarchy
const generateCategoryHierarchy = (depth = 3, breadth = 3) => {
  // Hierarchy generation logic
};
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

// Create category hierarchy
const createCategoryHierarchy = async (hierarchy) => {
  // Hierarchy creation logic
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
5. Update hierarchy tests when structure changes

### Test Debugging

```bash
# Run single test file
npm run test:categories -- --testNamePattern="Category Creation"

# Run with verbose output
npm run test:categories -- --verbose

# Run with debug logging
DEBUG=* npm run test:categories
```

## Best Practices

### Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated
- Separate hierarchy tests from basic CRUD tests

### Test Data Management

- Use factories for test data generation
- Clean up test data after each test
- Use unique identifiers for test data
- Avoid hardcoded test data
- Create realistic category hierarchies

### Assertions

- Use specific assertions
- Test both positive and negative cases
- Verify error messages and states
- Test edge cases and boundaries
- Verify hierarchy integrity

### Performance

- Mock external dependencies
- Use efficient test data setup
- Avoid unnecessary API calls
- Use test database for integration tests
- Optimize hierarchy traversal tests

## Troubleshooting

### Common Issues

1. **Test Database Connection**: Ensure test database is running
2. **Mock Data**: Verify mock data matches current schema
3. **Selectors**: Update selectors when UI changes
4. **Timing**: Add appropriate waits for async operations
5. **Hierarchy**: Verify parent-child relationships are correct

### Debug Commands

```bash
# Check test database
npm run test:db:check

# Reset test database
npm run test:db:reset

# View test logs
npm run test:categories -- --verbose --no-coverage

# Debug hierarchy tests
npm run test:categories -- --testNamePattern="Hierarchy"
```

## Category-Specific Testing

### Hierarchy Testing

- Test parent-child relationships
- Test circular reference prevention
- Test moving categories between parents
- Test deleting parent categories
- Test deep hierarchy traversal

### Validation Testing

- Test category name validation
- Test description validation
- Test parent ID validation
- Test circular reference validation
- Test required field validation

### API Testing

- Test CRUD operations
- Test hierarchy endpoints
- Test search and filtering
- Test bulk operations
- Test error handling

### Component Testing

- Test form validation
- Test parent selection
- Test tree component
- Test drag and drop (if applicable)
- Test accessibility

## Contributing

When adding new category functionality:

1. Add corresponding unit tests
2. Add integration tests for API endpoints
3. Add component tests for UI components
4. Add E2E tests for user workflows
5. Add hierarchy tests if applicable
6. Update this README with new test information

## Related Documentation

- [Category API Documentation](../api/categories.md)
- [Category Component Documentation](../components/categories.md)
- [Test Suite Overview](../README.md)
- [Testing Guidelines](../GUIDELINES.md)
- [Hierarchy Management Guide](../hierarchy.md)
