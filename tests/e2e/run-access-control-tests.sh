#!/bin/bash

# Access Control Test Runner
# Runs comprehensive tests for verified unapproved users and dashboard access control

set -e

echo "🚀 Starting Access Control Test Suite"
echo "======================================"

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

# Check if development server is running
check_dev_server() {
    print_status "Checking if development server is running..."
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Development server is running on port 3000"
    else
        print_warning "Development server not detected on port 3000"
        print_status "Please start the development server with: npm run dev"
        exit 1
    fi
}

# Clean up test accounts before running tests
cleanup_test_accounts() {
    print_status "Cleaning up existing test accounts..."
    
    if node scripts/cleanup-test-accounts.js --all; then
        print_success "Test accounts cleaned up successfully"
    else
        print_warning "Failed to clean up test accounts, continuing anyway..."
    fi
}

# Run the verified unapproved users tests
run_verified_unapproved_tests() {
    print_status "Running Verified Unapproved Users Tests..."
    echo "=================================================="
    
    npx playwright test tests/e2e/verified-unapproved-users.spec.ts \
        --project=chromium \
        --reporter=list \
        --timeout=30000
    
    if [ $? -eq 0 ]; then
        print_success "Verified Unapproved Users Tests completed successfully"
    else
        print_error "Verified Unapproved Users Tests failed"
        return 1
    fi
}

# Run the dashboard access control tests
run_dashboard_access_tests() {
    print_status "Running Dashboard Access Control Tests..."
    echo "================================================"
    
    npx playwright test tests/e2e/dashboard-access-control.spec.ts \
        --project=chromium \
        --reporter=list \
        --timeout=30000
    
    if [ $? -eq 0 ]; then
        print_success "Dashboard Access Control Tests completed successfully"
    else
        print_error "Dashboard Access Control Tests failed"
        return 1
    fi
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    # Create reports directory if it doesn't exist
    mkdir -p test-results/access-control
    
    # Run tests with HTML reporter
    npx playwright test tests/e2e/verified-unapproved-users.spec.ts tests/e2e/dashboard-access-control.spec.ts \
        --project=chromium \
        --reporter=html \
        --output-dir=test-results/access-control \
        --timeout=30000
    
    print_success "Test report generated in test-results/access-control/"
}

# Main execution
main() {
    echo "🧪 Access Control Test Suite"
    echo "============================"
    echo ""
    echo "This test suite covers:"
    echo "1. Verified but Unapproved Users - Access Control"
    echo "2. Dashboard Access Control - Role-Based Access"
    echo ""
    
    # Check prerequisites
    check_dev_server
    
    # Clean up before testing
    cleanup_test_accounts
    
    # Run individual test suites
    echo ""
    echo "📋 Running Individual Test Suites"
    echo "================================="
    
    # Run verified unapproved users tests
    if run_verified_unapproved_tests; then
        VERIFIED_TESTS_PASSED=true
    else
        VERIFIED_TESTS_PASSED=false
    fi
    
    echo ""
    
    # Run dashboard access control tests
    if run_dashboard_access_tests; then
        DASHBOARD_TESTS_PASSED=true
    else
        DASHBOARD_TESTS_PASSED=false
    fi
    
    echo ""
    echo "📊 Test Results Summary"
    echo "======================="
    
    if [ "$VERIFIED_TESTS_PASSED" = true ]; then
        print_success "✅ Verified Unapproved Users Tests: PASSED"
    else
        print_error "❌ Verified Unapproved Users Tests: FAILED"
    fi
    
    if [ "$DASHBOARD_TESTS_PASSED" = true ]; then
        print_success "✅ Dashboard Access Control Tests: PASSED"
    else
        print_error "❌ Dashboard Access Control Tests: FAILED"
    fi
    
    # Generate comprehensive report
    echo ""
    generate_report
    
    # Final status
    if [ "$VERIFIED_TESTS_PASSED" = true ] && [ "$DASHBOARD_TESTS_PASSED" = true ]; then
        echo ""
        print_success "🎉 All Access Control Tests Passed!"
        echo ""
        echo "Next Steps:"
        echo "1. Review the test report in test-results/access-control/"
        echo "2. Clean up test accounts: node scripts/cleanup-test-accounts.js"
        echo "3. Proceed to the next testing phase"
        exit 0
    else
        echo ""
        print_error "💥 Some tests failed. Please review the output above."
        echo ""
        echo "Troubleshooting:"
        echo "1. Check if the development server is running correctly"
        echo "2. Verify database connectivity"
        echo "3. Check test-data page functionality"
        echo "4. Review test-results/access-control/ for detailed reports"
        exit 1
    fi
}

# Run main function
main "$@" 