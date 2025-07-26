# POS System Tests

This directory contains comprehensive tests for the Point of Sale (POS) system of the BaaWA Inventory POS application.

## Test Structure

```
tests/pos/
├── unit/                    # Unit tests for individual components
│   ├── POSInterface.test.tsx
│   ├── ShoppingCart.test.tsx
│   └── ProductSearchBar.test.tsx
├── integration/             # Integration tests for complete workflows
│   └── pos-workflow.test.ts
├── api/                     # API tests for POS endpoints
│   └── pos-api.test.ts
├── jest.config.js          # Jest configuration for POS tests
├── jest.setup.js           # Jest setup and mocks
└── README.md               # This file
```

## Test Types

### 1. Unit Tests (`unit/`)

Unit tests focus on testing individual components in isolation:

- **POSInterface.test.tsx**: Tests the main POS interface component
  - Initial render and layout
  - Product search functionality
  - Cart management
  - Payment flow
  - Error handling
  - Accessibility features

- **ShoppingCart.test.tsx**: Tests the shopping cart component
  - Empty cart state
  - Adding/removing items
  - Quantity management
  - Total calculations
  - Stock warnings
  - Cart clearing

- **ProductSearchBar.test.tsx**: Tests the product search functionality
  - Search input behavior
  - Search mode switching (Search/Barcode/Camera)
  - Search results display
  - Error handling
  - Keyboard navigation

### 2. Integration Tests (`integration/`)

Integration tests test complete user workflows:

- **pos-workflow.test.ts**: End-to-end POS workflow testing
  - Access control (staff vs manager permissions)
  - Product search and selection
  - Cart management
  - Payment processing
  - Customer information entry
  - Receipt generation
  - Error handling
  - Offline functionality

### 3. API Tests (`api/`)

API tests verify the backend endpoints:

- **pos-api.test.ts**: Tests all POS-related API endpoints
  - Product search API
  - Barcode lookup API
  - Transaction history API
  - Receipt generation API
  - Customer management API
  - Analytics API
  - Authentication and authorization
  - Error handling

## Test Coverage

The POS tests cover the following areas:

### Core Functionality

- ✅ Product search and selection
- ✅ Shopping cart management
- ✅ Payment processing
- ✅ Receipt generation
- ✅ Customer information handling

### User Experience

- ✅ Search modes (text, barcode, camera)
- ✅ Cart operations (add, remove, update quantities)
- ✅ Payment method selection
- ✅ Discount application
- ✅ Stock warnings

### Security & Access Control

- ✅ Role-based access (Staff, Manager, Admin)
- ✅ Authentication requirements
- ✅ Authorization checks
- ✅ Session management

### Error Handling

- ✅ Network errors
- ✅ Invalid input handling
- ✅ Server errors
- ✅ Graceful degradation

### Accessibility

- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Screen reader compatibility
- ✅ Focus management

### Performance

- ✅ Search optimization
- ✅ Cart updates
- ✅ Payment processing speed
- ✅ Offline functionality

## Running Tests

### Prerequisites

1. Ensure you have the test database set up
2. Install dependencies: `npm install`
3. Set up test environment variables

### Running Unit Tests

```bash
# Run all POS unit tests
npm test -- tests/pos/unit/

# Run specific unit test
npm test -- tests/pos/unit/POSInterface.test.tsx

# Run with coverage
npm test -- tests/pos/unit/ --coverage
```

### Running Integration Tests

```bash
# Run all POS integration tests
npx playwright test tests/pos/integration/

# Run specific integration test
npx playwright test tests/pos/integration/pos-workflow.test.ts

# Run with UI
npx playwright test tests/pos/integration/ --ui
```

### Running API Tests

```bash
# Run all POS API tests
npx playwright test tests/pos/api/

# Run specific API test
npx playwright test tests/pos/api/pos-api.test.ts

# Run with headed browser
npx playwright test tests/pos/api/ --headed
```

### Running All POS Tests

```bash
# Run all tests (unit, integration, API)
npm run test:pos

# Run with coverage report
npm run test:pos:coverage
```

## Test Data

The tests use the following test data:

### Test Users

- **Staff User**: `baawapays+test-staff@gmail.com` - Basic POS access
- **Manager User**: `baawapays+test-manager@gmail.com` - Full POS access
- **Admin User**: `baawapays+test-admin@gmail.com` - All system access

### Test Products

- Sample products are created during test setup
- Products include various categories and brands
- Stock levels are managed for testing scenarios

## Mocking Strategy

### Component Mocks

- NextAuth session management
- TanStack Query for data fetching
- Toast notifications
- Logger functions
- Browser APIs (localStorage, matchMedia, etc.)

### API Mocks

- Product search responses
- Barcode lookup responses
- Transaction creation
- Receipt generation
- Error scenarios

### External Dependencies

- Printer functionality
- Camera access
- Network connectivity
- Offline storage

## Continuous Integration

The POS tests are integrated into the CI/CD pipeline:

1. **Pre-commit**: Unit tests run automatically
2. **Pull Request**: Integration and API tests run
3. **Deployment**: Full test suite runs before deployment

## Debugging Tests

### Unit Tests

```bash
# Run with verbose output
npm test -- tests/pos/unit/ --verbose

# Run with debugger
npm test -- tests/pos/unit/ --inspect-brk
```

### Integration Tests

```bash
# Run with debug mode
npx playwright test tests/pos/integration/ --debug

# Run with slow motion
npx playwright test tests/pos/integration/ --headed --slowmo=1000
```

### API Tests

```bash
# Run with detailed logging
npx playwright test tests/pos/api/ --reporter=list

# Run with browser dev tools
npx playwright test tests/pos/api/ --headed --devtools
```

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear test names
3. **Isolation**: Each test should be independent
4. **Coverage**: Aim for high test coverage
5. **Maintainability**: Keep tests simple and readable

### Test Data

1. **Consistent**: Use consistent test data across tests
2. **Realistic**: Use realistic but safe test values
3. **Cleanup**: Clean up test data after tests
4. **Isolation**: Don't share state between tests

### Error Scenarios

1. **Network Errors**: Test offline scenarios
2. **Invalid Input**: Test edge cases
3. **Server Errors**: Test error responses
4. **User Errors**: Test user mistakes

## Troubleshooting

### Common Issues

1. **Test Database Issues**

   ```bash
   # Reset test database
   npm run test:db:reset
   ```

2. **Mock Issues**

   ```bash
   # Clear Jest cache
   npm test -- --clearCache
   ```

3. **Playwright Issues**

   ```bash
   # Install browsers
   npx playwright install

   # Update browsers
   npx playwright install --with-deps
   ```

4. **Environment Issues**
   ```bash
   # Check environment variables
   npm run test:env:check
   ```

### Performance Issues

1. **Slow Tests**: Use `--maxWorkers=1` for debugging
2. **Memory Issues**: Increase Node.js memory limit
3. **Timeout Issues**: Increase test timeout values

## Contributing

When adding new POS features:

1. **Write Tests First**: Follow TDD approach
2. **Update Documentation**: Keep this README updated
3. **Maintain Coverage**: Ensure new code is tested
4. **Follow Patterns**: Use existing test patterns
5. **Review Tests**: Have tests reviewed with code

## Support

For test-related issues:

1. Check the troubleshooting section
2. Review existing test patterns
3. Consult the main project documentation
4. Create an issue with detailed information
