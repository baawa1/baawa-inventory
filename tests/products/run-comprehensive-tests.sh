#!/bin/bash

# Comprehensive Product Test Runner
# This script runs all product-related tests with detailed reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="tests/products"
COVERAGE_DIR="coverage/products"
REPORT_DIR="test-reports/products"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create directories if they don't exist
mkdir -p "$COVERAGE_DIR"
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}🚀 Starting Comprehensive Product Test Suite${NC}"
echo -e "${BLUE}=============================================${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Test Directory: $TEST_DIR"
echo "Coverage Directory: $COVERAGE_DIR"
echo "Report Directory: $REPORT_DIR"
echo ""

# Function to run tests with coverage
run_tests_with_coverage() {
    local test_pattern="$1"
    local test_name="$2"
    local coverage_file="$3"
    
    echo -e "${YELLOW}📋 Running $test_name...${NC}"
    
    if npm test -- "$test_pattern" --coverage --coverageDirectory="$coverage_file" --json --outputFile="$REPORT_DIR/${test_name}_${TIMESTAMP}.json" --silent; then
        echo -e "${GREEN}✅ $test_name completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Function to run tests without coverage
run_tests() {
    local test_pattern="$1"
    local test_name="$2"
    
    echo -e "${YELLOW}📋 Running $test_name...${NC}"
    
    if npm test -- "$test_pattern" --silent; then
        echo -e "${GREEN}✅ $test_name completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 1. Unit Tests
echo -e "${BLUE}📦 Unit Tests${NC}"
echo "============="

# Product Validation Tests
if run_tests_with_coverage "$TEST_DIR/unit/product-validation-comprehensive.test.ts" "Product Validation Tests" "$COVERAGE_DIR/validation"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Product Utilities Tests
if run_tests_with_coverage "$TEST_DIR/unit/product-utils-comprehensive.test.ts" "Product Utilities Tests" "$COVERAGE_DIR/utils"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Existing Unit Tests
if run_tests "$TEST_DIR/unit/product-validation.test.ts" "Existing Product Validation Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_tests "$TEST_DIR/unit/product-utils.test.ts" "Existing Product Utils Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_tests "$TEST_DIR/unit/product-submission.test.ts" "Product Submission Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_tests "$TEST_DIR/unit/product-search.test.ts" "Product Search Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_tests "$TEST_DIR/unit/product-barcode.test.ts" "Product Barcode Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# 2. Integration Tests
echo -e "${BLUE}🔗 Integration Tests${NC}"
echo "====================="

# Comprehensive API Tests
if run_tests_with_coverage "$TEST_DIR/integration/product-api-comprehensive.test.ts" "Comprehensive Product API Tests" "$COVERAGE_DIR/api-comprehensive"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Simple API Tests
if run_tests_with_coverage "$TEST_DIR/integration/product-api-simple.test.ts" "Simple Product API Tests" "$COVERAGE_DIR/api-simple"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Existing Integration Tests
if run_tests "$TEST_DIR/integration/product-api.test.ts" "Existing Product API Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_tests "$TEST_DIR/integration/product-images.test.ts" "Product Images Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# 3. Component Tests
echo -e "${BLUE}🧩 Component Tests${NC}"
echo "===================="

if run_tests "$TEST_DIR/components/AddProductForm.test.tsx" "Add Product Form Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if run_tests "$TEST_DIR/components/ProductList.test.tsx" "Product List Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# 4. E2E Tests
echo -e "${BLUE}🌐 End-to-End Tests${NC}"
echo "====================="

if run_tests "$TEST_DIR/e2e/products-workflow.spec.ts" "Product Workflow E2E Tests"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""

# 5. Generate Coverage Report
echo -e "${BLUE}📊 Generating Coverage Report${NC}"
echo "================================"

# Combine coverage reports
if [ -d "$COVERAGE_DIR" ]; then
    echo "Combining coverage reports..."
    npx istanbul-combine -d "$COVERAGE_DIR/combined" -r lcov -r html "$COVERAGE_DIR"/*/coverage-final.json
    
    # Generate summary
    echo "Generating coverage summary..."
    npx istanbul report --dir "$COVERAGE_DIR/combined" --root "$COVERAGE_DIR/combined" text-summary
    
    echo -e "${GREEN}✅ Coverage report generated at $COVERAGE_DIR/combined${NC}"
else
    echo -e "${YELLOW}⚠️  No coverage data found${NC}"
fi

echo ""

# 6. Generate Test Summary
echo -e "${BLUE}📋 Test Summary${NC}"
echo "==============="

# Calculate success rate
SUCCESS_RATE=0
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

echo "Total Test Suites: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: ${SUCCESS_RATE}%"

# Color-coded summary
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    EXIT_CODE=0
else
    echo -e "${RED}❌ $FAILED_TESTS test suite(s) failed${NC}"
    EXIT_CODE=1
fi

echo ""

# 7. Generate Detailed Report
echo -e "${BLUE}📄 Generating Detailed Report${NC}"
echo "================================"

REPORT_FILE="$REPORT_DIR/comprehensive_test_report_${TIMESTAMP}.md"

cat > "$REPORT_FILE" << EOF
# Comprehensive Product Test Report

**Generated:** $(date)
**Timestamp:** $TIMESTAMP

## Test Summary

- **Total Test Suites:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Success Rate:** ${SUCCESS_RATE}%

## Test Categories

### Unit Tests
- Product Validation Tests (Comprehensive)
- Product Utilities Tests (Comprehensive)
- Product Validation Tests (Existing)
- Product Utils Tests (Existing)
- Product Submission Tests
- Product Search Tests
- Product Barcode Tests

### Integration Tests
- Comprehensive Product API Tests
- Simple Product API Tests
- Product API Tests (Existing)
- Product Images Tests

### Component Tests
- Add Product Form Tests
- Product List Tests

### End-to-End Tests
- Product Workflow E2E Tests

## Coverage Information

Coverage reports are available in: \`$COVERAGE_DIR/combined\`

## Test Reports

Individual test reports are available in: \`$REPORT_DIR\`

## Next Steps

$(if [ $FAILED_TESTS -gt 0 ]; then
    echo "- Review failed tests and fix issues"
    echo "- Re-run failed test suites"
    echo "- Update test cases if needed"
else
    echo "- All tests passed successfully"
    echo "- Consider adding more edge case tests"
    echo "- Review coverage and add tests for uncovered code"
fi)

EOF

echo -e "${GREEN}✅ Detailed report generated: $REPORT_FILE${NC}"

echo ""
echo -e "${BLUE}🏁 Test Suite Complete${NC}"
echo "====================="

# Exit with appropriate code
exit $EXIT_CODE 