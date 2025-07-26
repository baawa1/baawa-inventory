#!/bin/bash

# POS Test Runner Script
# This script runs all POS tests (unit, integration, API) with proper setup

set -e

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! command_exists npx; then
        print_error "npx is not installed. Please install npx first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to setup test environment
setup_test_env() {
    print_status "Setting up test environment..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Install Playwright browsers if needed
    if [ ! -d "node_modules/.cache/ms-playwright" ]; then
        print_status "Installing Playwright browsers..."
        npx playwright install
    fi
    
    # Setup test database
    print_status "Setting up test database..."
    npm run test:db:setup || print_warning "Test database setup failed, continuing..."
    
    print_success "Test environment setup completed"
}

# Function to run unit tests
run_unit_tests() {
    print_status "Running POS unit tests..."
    
    if npm test -- tests/pos/unit/ --passWithNoTests; then
        print_success "Unit tests passed"
        return 0
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running POS integration tests..."
    
    if npx playwright test tests/pos/integration/ --reporter=list; then
        print_success "Integration tests passed"
        return 0
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Function to run API tests
run_api_tests() {
    print_status "Running POS API tests..."
    
    if npx playwright test tests/pos/api/ --reporter=list; then
        print_success "API tests passed"
        return 0
    else
        print_error "API tests failed"
        return 1
    fi
}

# Function to run tests with coverage
run_tests_with_coverage() {
    print_status "Running POS tests with coverage..."
    
    if npm test -- tests/pos/unit/ --coverage --coverageReporters=text,lcov,html; then
        print_success "Tests with coverage completed"
        return 0
    else
        print_error "Tests with coverage failed"
        return 1
    fi
}

# Function to generate test report
generate_report() {
    print_status "Generating test report..."
    
    # Create reports directory
    mkdir -p test-results/pos
    
    # Generate coverage report
    if [ -d "coverage" ]; then
        cp -r coverage test-results/pos/
        print_success "Coverage report saved to test-results/pos/coverage/"
    fi
    
    # Generate Playwright report
    if [ -d "playwright-report" ]; then
        cp -r playwright-report test-results/pos/
        print_success "Playwright report saved to test-results/pos/playwright-report/"
    fi
    
    print_success "Test report generated"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up test artifacts..."
    
    # Remove temporary files
    rm -rf .next
    rm -rf coverage
    rm -rf playwright-report
    
    print_success "Cleanup completed"
}

# Main function
main() {
    echo "=========================================="
    echo "           POS Test Runner"
    echo "=========================================="
    echo ""
    
    # Parse command line arguments
    RUN_UNIT=false
    RUN_INTEGRATION=false
    RUN_API=false
    RUN_COVERAGE=false
    CLEANUP_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit)
                RUN_UNIT=true
                shift
                ;;
            --integration)
                RUN_INTEGRATION=true
                shift
                ;;
            --api)
                RUN_API=true
                shift
                ;;
            --coverage)
                RUN_COVERAGE=true
                shift
                ;;
            --cleanup)
                CLEANUP_ONLY=true
                shift
                ;;
            --all)
                RUN_UNIT=true
                RUN_INTEGRATION=true
                RUN_API=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --unit         Run unit tests only"
                echo "  --integration  Run integration tests only"
                echo "  --api          Run API tests only"
                echo "  --coverage     Run tests with coverage"
                echo "  --cleanup      Clean up test artifacts only"
                echo "  --all          Run all tests (default)"
                echo "  --help         Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0 --all                    # Run all tests"
                echo "  $0 --unit --coverage        # Run unit tests with coverage"
                echo "  $0 --integration            # Run integration tests only"
                echo "  $0 --cleanup                # Clean up only"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Default to running all tests if no specific test type is specified
    if [ "$RUN_UNIT" = false ] && [ "$RUN_INTEGRATION" = false ] && [ "$RUN_API" = false ] && [ "$CLEANUP_ONLY" = false ]; then
        RUN_UNIT=true
        RUN_INTEGRATION=true
        RUN_API=true
    fi
    
    # Start timer
    START_TIME=$(date +%s)
    
    # Check prerequisites
    check_prerequisites
    
    # Setup test environment
    setup_test_env
    
    # Run cleanup if requested
    if [ "$CLEANUP_ONLY" = true ]; then
        cleanup
        exit 0
    fi
    
    # Track test results
    UNIT_PASSED=false
    INTEGRATION_PASSED=false
    API_PASSED=false
    
    # Run unit tests
    if [ "$RUN_UNIT" = true ]; then
        if run_unit_tests; then
            UNIT_PASSED=true
        fi
    fi
    
    # Run integration tests
    if [ "$RUN_INTEGRATION" = true ]; then
        if run_integration_tests; then
            INTEGRATION_PASSED=true
        fi
    fi
    
    # Run API tests
    if [ "$RUN_API" = true ]; then
        if run_api_tests; then
            API_PASSED=true
        fi
    fi
    
    # Run coverage if requested
    if [ "$RUN_COVERAGE" = true ] && [ "$RUN_UNIT" = true ]; then
        run_tests_with_coverage
    fi
    
    # Generate report
    generate_report
    
    # Calculate total time
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # Print summary
    echo ""
    echo "=========================================="
    echo "           Test Summary"
    echo "=========================================="
    echo ""
    
    if [ "$RUN_UNIT" = true ]; then
        if [ "$UNIT_PASSED" = true ]; then
            print_success "Unit Tests: PASSED"
        else
            print_error "Unit Tests: FAILED"
        fi
    fi
    
    if [ "$RUN_INTEGRATION" = true ]; then
        if [ "$INTEGRATION_PASSED" = true ]; then
            print_success "Integration Tests: PASSED"
        else
            print_error "Integration Tests: FAILED"
        fi
    fi
    
    if [ "$RUN_API" = true ]; then
        if [ "$API_PASSED" = true ]; then
            print_success "API Tests: PASSED"
        else
            print_error "API Tests: FAILED"
        fi
    fi
    
    echo ""
    echo "Duration: ${DURATION} seconds"
    echo "Reports saved to: test-results/pos/"
    echo ""
    
    # Exit with appropriate code
    if [ "$UNIT_PASSED" = true ] && [ "$INTEGRATION_PASSED" = true ] && [ "$API_PASSED" = true ]; then
        print_success "All tests passed!"
        exit 0
    else
        print_error "Some tests failed!"
        exit 1
    fi
}

# Run main function
main "$@" 