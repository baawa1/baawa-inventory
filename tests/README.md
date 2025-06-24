# Testing Documentation

## Overview

This project uses Jest and React Testing Library for comprehensive testing. The test suite covers unit tests, integration tests, API tests, and type validation tests.

## Test Structure

```
tests/
├── setup.ts                     # Test environment setup and global mocks
├── utils/
│   └── test-utils.tsx           # Testing utilities, mocks, and helper functions
├── lib/                         # Library and utility function tests
│   ├── db.test.ts              # Database connection and Prisma client tests
│   ├── supabase.test.ts        # Supabase client and authentication tests
│   └── utils/                  # Utility function tests
├── api/                        # API route tests
│   └── products.test.ts        # Product API endpoint tests
├── types/                      # Type validation tests
│   └── validation.test.ts      # TypeScript type structure validation
└── integration/                # Integration and end-to-end tests
    └── database.test.ts        # Multi-service integration tests
```

## Test Commands

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD (non-interactive)
npm run test:ci
```

### Specific Test Categories

```bash
# Run only unit tests (lib, types, utils)
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only API tests
npm run test:api

# Run only component tests (when created)
npm run test:components

# Debug test issues with verbose output
npm run test:debug
```

### Running Individual Test Files

```bash
# Run specific test file
npx jest tests/lib/db.test.ts

# Run tests matching a pattern
npx jest --testNamePattern="Product"

# Run tests for specific directory
npx jest tests/lib/
```

## Test Categories

### 1. Unit Tests (`tests/lib/`, `tests/types/`)

**Purpose**: Test individual functions, utilities, and type definitions in isolation.

**Coverage**:

- Database utilities and connections
- Supabase client operations
- Inventory management functions
- POS calculations and validations
- TypeScript type structures

**Example**:

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test interactions between multiple services and components.

**Coverage**:

- Database transaction flows
- Multi-service synchronization
- Authentication across services
- Error handling and recovery
- Performance with large datasets

**Example**:

```typescript
// tests/integration/database.test.ts
it('should process complete sales transaction with stock updates', async () => {
  const cashier = await findUser(1)
  const product = await findProduct(1)
  const transaction = await createSalesTransaction({...})
  const updatedProduct = await updateStock(product.id, -2)

  expect(updatedProduct.stock).toBe(product.stock - 2)
})
```

### 3. API Tests (`tests/api/`)

**Purpose**: Test REST API endpoints and request/response handling.

**Coverage**:

- CRUD operations
- Request validation
- Error responses
- Authentication/authorization
- Query parameter handling

**Example**:

```typescript
// tests/api/products.test.ts
it("should create product successfully", async () => {
  const productData = { name: "Test Product", sku: "TEST-001" };
  const response = await POST("/api/products", productData);

  expect(response.status).toBe(201);
  expect(response.data.name).toBe("Test Product");
});
```

### 4. Type Validation Tests (`tests/types/`)

**Purpose**: Verify TypeScript type definitions and data structure integrity.

**Coverage**:

- Type structure validation
- Enum value verification
- Required/optional field validation
- Relationship validation
- Data constraint validation

**Example**:

```typescript
// tests/types/validation.test.ts
it("should validate product type structure", () => {
  const product = createMockProduct();

  expect(typeof product.id).toBe("number");
  expect(typeof product.name).toBe("string");
  expect(["ACTIVE", "INACTIVE"].includes(product.status)).toBe(true);
});
```

## Test Utilities

### Mock Data Factories

The `test-utils.tsx` file provides factory functions for creating mock data:

```typescript
// Create mock objects with optional overrides
const user = createMockUser({ role: "ADMIN" });
const product = createMockProduct({ price: 29.99 });
const transaction = createMockSalesTransaction({ total: 100.0 });
```

### Mock Clients

Pre-configured mocks for external services:

```typescript
// Mock Prisma client
mockPrisma.product.findMany.mockResolvedValue([...products])

// Mock Supabase client
mockSupabase.from('products').select('*').mockResolvedValue({...})
```

### Test Helpers

Utility functions for common testing patterns:

```typescript
// Reset all mocks between tests
resetAllMocks();

// Wait for async operations
await waitForAsync();

// Mock API responses
const successResponse = mockApiSuccess(data);
const errorResponse = mockApiError("Error message", 400);
```

## Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Mock Management

- Reset mocks between tests using `resetAllMocks()`
- Use specific mocks for each test case
- Avoid overly complex mock setups

### 3. Data Setup

- Use factory functions for consistent test data
- Override only the properties relevant to the test
- Keep test data minimal and focused

### 4. Assertions

- Use specific matchers (`toBe`, `toEqual`, `toHaveLength`)
- Test both positive and negative cases
- Verify all relevant side effects

### 5. Error Testing

- Test error conditions and edge cases
- Verify proper error messages and codes
- Test error recovery mechanisms

## Coverage Requirements

The Jest configuration sets coverage thresholds:

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Viewing Coverage

```bash
# Generate and view coverage report
npm run test:coverage

# Coverage report will be generated in /coverage/lcov-report/index.html
open coverage/lcov-report/index.html
```

## Continuous Integration

The test suite is designed for CI/CD environments:

```bash
# CI-optimized test run
npm run test:ci

# This command:
# - Runs tests without watch mode
# - Generates coverage reports
# - Exits with appropriate codes for CI systems
```

## Debugging Tests

### Common Issues

1. **Async/Await Issues**: Ensure all async operations are properly awaited
2. **Mock Cleanup**: Use `resetAllMocks()` in `beforeEach` blocks
3. **Type Errors**: Verify mock return types match expected interfaces

### Debug Commands

```bash
# Run with verbose output
npm run test:debug

# Run specific test with debugging
npx jest --verbose tests/lib/db.test.ts

# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Adding New Tests

### 1. Unit Tests

- Create test files adjacent to the code being tested
- Use `.test.ts` or `.test.tsx` extensions
- Follow existing patterns in `tests/lib/`

### 2. Integration Tests

- Add to `tests/integration/` directory
- Focus on cross-service interactions
- Test realistic user workflows

### 3. API Tests

- Add to `tests/api/` directory
- Test all HTTP methods and status codes
- Include authentication and validation tests

## Environment Variables

Test environment variables are automatically set in `tests/setup.ts`:

```typescript
// All environment variables are mocked for testing
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SUPABASE_URL = "https://test.supabase.co";
// ... other test env vars
```

## Performance Testing

For performance-sensitive operations:

```typescript
it("should handle large datasets efficiently", async () => {
  const startTime = Date.now();
  const result = await processLargeDataset();
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(1000); // Should complete within 1 second
  expect(result).toHaveLength(1000);
});
```

## Future Considerations

- **E2E Tests**: Consider adding Playwright or Cypress for full user journey testing
- **Visual Regression**: Add visual testing for UI components
- **Load Testing**: Implement stress testing for API endpoints
- **Database Testing**: Add tests with real database connections for critical paths
