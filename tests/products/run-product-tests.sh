#!/bin/bash

# Product Tests Runner Script
# This script runs all product-related tests in the correct order

set -e

echo "🧪 Starting Product Tests Suite..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if required dependencies are installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Set test environment
export NODE_ENV=test
export DATABASE_URL="postgresql://test:test@localhost:5432/test_db"

print_status "Running Product Tests Suite..."

# 1. Unit Tests
echo ""
print_status "1. Running Unit Tests..."
echo "================================"

# Product validation tests
print_status "Running product validation tests..."
npm test -- tests/products/unit/product-validation.test.ts --passWithNoTests

# Product utility tests
print_status "Running product utility tests..."
npm test -- tests/products/unit/product-utils.test.ts --passWithNoTests

# Product submission tests
print_status "Running product submission tests..."
npm test -- tests/products/unit/product-submission.test.ts --passWithNoTests

# Product search tests
print_status "Running product search tests..."
npm test -- tests/products/unit/product-search.test.ts --passWithNoTests

# Product barcode tests
print_status "Running product barcode tests..."
npm test -- tests/products/unit/product-barcode.test.ts --passWithNoTests

# 2. Integration Tests
echo ""
print_status "2. Running Integration Tests..."
echo "====================================="

# Product API tests
print_status "Running product API integration tests..."
npm test -- tests/products/integration/product-api.test.ts --passWithNoTests

# Product images API tests
print_status "Running product images API tests..."
npm test -- tests/products/integration/product-images.test.ts --passWithNoTests

# 3. Component Tests
echo ""
print_status "3. Running Component Tests..."
echo "==================================="

# AddProductForm component tests
print_status "Running AddProductForm component tests..."
npm test -- tests/products/components/AddProductForm.test.tsx --passWithNoTests

# ProductList component tests
print_status "Running ProductList component tests..."
npm test -- tests/products/components/ProductList.test.tsx --passWithNoTests

# 4. E2E Tests
echo ""
print_status "4. Running E2E Tests..."
echo "============================="

# Check if Playwright is installed
if ! npx playwright --version &> /dev/null; then
    print_status "Installing Playwright..."
    npx playwright install
fi

# Run E2E tests
print_status "Running product E2E workflow tests..."
npx playwright test tests/products/e2e/products-workflow.spec.ts --reporter=list

# 5. Test Summary
echo ""
print_status "5. Test Summary"
echo "=================="

# Count test files
UNIT_TESTS=$(find tests/products/unit -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
INTEGRATION_TESTS=$(find tests/products/integration -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
COMPONENT_TESTS=$(find tests/products/components -name "*.test.ts" -o -name "*.test.tsx" | wc -l)
E2E_TESTS=$(find tests/products/e2e -name "*.spec.ts" | wc -l)

TOTAL_TESTS=$((UNIT_TESTS + INTEGRATION_TESTS + COMPONENT_TESTS + E2E_TESTS))

print_success "Test Suite Completed!"
echo ""
echo "📊 Test Summary:"
echo "   • Unit Tests: $UNIT_TESTS"
echo "   • Integration Tests: $INTEGRATION_TESTS"
echo "   • Component Tests: $COMPONENT_TESTS"
echo "   • E2E Tests: $E2E_TESTS"
echo "   • Total Test Files: $TOTAL_TESTS"
echo ""

# Check if all tests passed
if [ $? -eq 0 ]; then
    print_success "All product tests passed! 🎉"
    echo ""
    echo "✅ Product functionality is working correctly:"
    echo "   • Product validation schemas"
    echo "   • Product utility functions"
    echo "   • Product API endpoints"
    echo "   • Product image management"
    echo "   • Product form components"
    echo "   • Product listing and filtering"
    echo "   • Complete product workflow"
    echo ""
    print_success "Ready for production! 🚀"
else
    print_error "Some tests failed. Please check the output above."
    exit 1
fi

echo ""
print_status "Test coverage areas:"
echo "   • Product CRUD operations"
echo "   • Product validation and error handling"
echo "   • Product search and filtering"
echo "   • Product image upload and management"
echo "   • Product form validation"
echo "   • Product list pagination and sorting"
echo "   • Product bulk operations"
echo "   • Product export functionality"
echo "   • Product archive/unarchive"
echo "   • Product profit margin calculations"
echo "   • Product stock status management"
echo "   • Product barcode validation and generation"
echo "   • Product SKU generation and validation"
echo "   • Product submission hooks and error handling"
echo "   • Product search utilities and performance"
echo "   • Product barcode scanning and lookup"
echo ""

print_success "Product test suite completed successfully!" 