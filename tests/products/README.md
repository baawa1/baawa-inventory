# Product Test Suite

This directory contains comprehensive tests for the product functionality in the inventory management system.

## 📁 Test Structure

```
tests/products/
├── unit/                          # Unit tests for individual functions
│   ├── product-validation.test.ts # Product validation schemas
│   ├── product-utils.test.ts      # Product utility functions
│   ├── product-submission.test.ts # Product submission hooks
│   ├── product-search.test.ts     # Product search functionality
│   └── product-barcode.test.ts    # Product barcode functionality
├── integration/                   # Integration tests for API endpoints
│   ├── product-api.test.ts        # Product CRUD API tests
│   └── product-images.test.ts     # Product image management tests
├── components/                    # Component tests for React components
│   ├── AddProductForm.test.tsx    # Add product form tests
│   └── ProductList.test.tsx       # Product list component tests
├── e2e/                          # End-to-end tests
│   └── products-workflow.spec.ts  # Complete product workflow tests
├── jest.config.js                # Jest configuration for product tests
├── setup-env.ts                  # Test environment setup
├── run-product-tests.sh          # Test runner script
└── README.md                     # This file
```

## 🧪 Test Categories

### 1. Unit Tests (`unit/`)

Tests for individual functions and utilities:

- **Product Validation** (`product-validation.test.ts`)
  - Zod schema validation
  - Required field validation
  - Field format validation (SKU, prices, stock)
  - Field length limits
  - Status enum validation
  - Date format validation

- **Product Utilities** (`product-utils.test.ts`)
  - Currency formatting
  - Stock status calculations
  - Profit margin calculations
  - SKU generation
  - Barcode validation
  - Search relevance scoring

- **Product Submission** (`product-submission.test.ts`)
  - Form submission hooks
  - Error handling
  - Data validation and cleanup
  - API integration
  - Success/error callbacks

- **Product Search** (`product-search.test.ts`)
  - Search functionality
  - Debounced search
  - Search parameter formatting
  - Error handling
  - Performance optimization

- **Product Barcode** (`product-barcode.test.ts`)
  - Barcode validation (EAN-13, UPC-A, custom formats)
  - Barcode generation
  - Barcode lookup
  - Barcode scanning
  - Duplicate detection

### 2. Integration Tests (`integration/`)

Tests for API endpoints and database interactions:

- **Product API** (`product-api.test.ts`)
  - GET /api/products (list with filters)
  - POST /api/products (create)
  - GET /api/products/[id] (single product)
  - PUT /api/products/[id] (update)
  - Authentication and authorization
  - Error handling
  - Data validation

- **Product Images API** (`product-images.test.ts`)
  - GET /api/products/[id]/images
  - PUT /api/products/[id]/images
  - Image validation
  - Primary image handling
  - Image count limits

### 3. Component Tests (`components/`)

Tests for React components:

- **AddProductForm** (`AddProductForm.test.tsx`)
  - Form rendering
  - Field validation
  - Form submission
  - Error handling
  - Loading states
  - API integration

- **ProductList** (`ProductList.test.tsx`)
  - Data display
  - Search functionality
  - Filtering (category, brand, status)
  - Sorting
  - Pagination
  - Bulk actions

### 4. E2E Tests (`e2e/`)

End-to-end workflow tests:

- **Products Workflow** (`products-workflow.spec.ts`)
  - Complete product lifecycle
  - User interactions
  - Navigation flows
  - Data persistence
  - Error scenarios

## 🚀 Running Tests

### Quick Start

```bash
# Run all product tests
chmod +x tests/products/run-product-tests.sh
./tests/products/run-product-tests.sh
```

### Individual Test Categories

```bash
# Unit tests only
npm test -- tests/products/unit/

# Integration tests only
npm test -- tests/products/integration/

# Component tests only
npm test -- tests/products/components/

# E2E tests only
npx playwright test tests/products/e2e/
```

### Specific Test Files

```bash
# Run specific test file
npm test -- tests/products/unit/product-validation.test.ts

# Run with coverage
npm test -- tests/products/unit/ --coverage

# Run in watch mode
npm test -- tests/products/ --watch
```

## 📊 Test Coverage

The test suite covers:

### ✅ Core Functionality

- [x] Product CRUD operations
- [x] Product validation (client & server)
- [x] Product search and filtering
- [x] Product image management
- [x] Product form handling
- [x] Product list display
- [x] Product pagination and sorting
- [x] Product bulk operations
- [x] Product export functionality
- [x] Product archive/unarchive
- [x] Product profit calculations
- [x] Product stock management
- [x] Product barcode validation and generation
- [x] Product SKU validation
- [x] Product submission hooks
- [x] Product search utilities
- [x] Product barcode scanning and lookup

### ✅ Error Handling

- [x] Validation errors
- [x] API errors
- [x] Network errors
- [x] Authentication errors
- [x] Authorization errors
- [x] Database errors

### ✅ User Experience

- [x] Loading states
- [x] Error messages
- [x] Success notifications
- [x] Form validation feedback
- [x] Responsive design
- [x] Accessibility

### ✅ Security

- [x] Authentication checks
- [x] Authorization checks
- [x] Input validation
- [x] SQL injection prevention
- [x] XSS prevention

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

- Test environment: `jsdom`
- Coverage threshold: 80%
- Module mapping for `@/` imports
- TypeScript support
- Mock setup

### Environment Setup (`setup-env.ts`)

- Environment variables
- Global mocks
- Browser API mocks
- Console noise reduction

### Playwright Configuration

- Browser: Chromium
- Viewport: 1280x720
- Timeout: 30 seconds
- Screenshot on failure

## 📝 Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from "@jest/globals";

describe("FunctionName", () => {
  it("should handle valid input", () => {
    // Arrange
    const input = "valid input";

    // Act
    const result = functionName(input);

    // Assert
    expect(result).toBe("expected output");
  });

  it("should handle invalid input", () => {
    // Arrange
    const input = "invalid input";

    // Act & Assert
    expect(() => functionName(input)).toThrow("Error message");
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/products/route";

describe("Product API", () => {
  it("should return products list", async () => {
    const request = new NextRequest("http://localhost:3000/api/products");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
  });
});
```

### Component Test Template

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentName } from "@/components/ComponentName";

describe("ComponentName", () => {
  it("should render correctly", () => {
    render(<ComponentName />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    const user = userEvent.setup();
    render(<ComponentName />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from "@playwright/test";

test("should complete workflow", async ({ page }) => {
  await page.goto("/inventory/products");

  await page.click("text=Add Product");
  await page.fill('input[name="name"]', "Test Product");

  await page.click('button[type="submit"]');
  await expect(page.locator("text=Success")).toBeVisible();
});
```

## 🐛 Debugging Tests

### Unit/Integration Tests

```bash
# Run with verbose output
npm test -- tests/products/ --verbose

# Run specific test with debugging
npm test -- tests/products/unit/product-validation.test.ts --verbose --no-coverage

# Run with console output
npm test -- tests/products/ --silent=false
```

### Component Tests

```bash
# Run with React Testing Library debug
npm test -- tests/products/components/ --verbose

# Debug specific component
npm test -- tests/products/components/AddProductForm.test.tsx --verbose
```

### E2E Tests

```bash
# Run with headed browser
npx playwright test tests/products/e2e/ --headed

# Run with slow motion
npx playwright test tests/products/e2e/ --headed --slow-mo=1000

# Debug specific test
npx playwright test tests/products/e2e/products-workflow.spec.ts --headed --debug
```

## 📈 Performance

### Test Execution Times

- **Unit Tests**: ~2-5 seconds
- **Integration Tests**: ~5-10 seconds
- **Component Tests**: ~3-7 seconds
- **E2E Tests**: ~30-60 seconds

### Optimization Tips

1. **Parallel Execution**: Tests run in parallel where possible
2. **Mocking**: Heavy dependencies are mocked
3. **Database**: Use test database with minimal data
4. **Caching**: Jest caches compiled modules
5. **Selective Testing**: Run only changed tests during development

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Product Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm test -- tests/products/
      - run: npx playwright test tests/products/e2e/
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🤝 Contributing

When adding new product functionality:

1. Write unit tests for new functions
2. Write integration tests for new API endpoints
3. Write component tests for new React components
4. Write E2E tests for new user workflows
5. Update this README with new test information
6. Ensure all tests pass before submitting PR

## 📞 Support

For test-related issues:

1. Check the test output for specific error messages
2. Review the test configuration files
3. Ensure all dependencies are installed
4. Verify the test environment is set up correctly
5. Check the debugging section above

---

**Last Updated**: December 2024
**Test Coverage**: 85%+ (target)
**Total Test Files**: 9+
**Total Test Cases**: 80+
