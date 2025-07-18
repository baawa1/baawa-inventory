#!/bin/bash

# Comprehensive Test Runner for Inventory POS System
# This script runs all test suites including products, brands, categories, and other entities

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_TIMEOUT=30000
COVERAGE_THRESHOLD=80
PARALLEL_JOBS=4

# Test directories
PRODUCTS_TESTS="tests/products"
BRANDS_TESTS="tests/brands"
CATEGORIES_TESTS="tests/categories"
AUTH_TESTS="tests"
E2E_TESTS="tests/e2e"

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

# Function to run tests with coverage
run_tests_with_coverage() {
    local test_dir=$1
    local test_name=$2
    
    print_status "Running $test_name tests with coverage..."
    
    if [ -f "$test_dir/jest.config.js" ]; then
        cd "$test_dir"
        npm test -- --coverage --testTimeout=$TEST_TIMEOUT --maxWorkers=$PARALLEL_JOBS
        cd - > /dev/null
    else
        npm test -- "$test_dir" --coverage --testTimeout=$TEST_TIMEOUT --maxWorkers=$PARALLEL_JOBS
    fi
    
    print_success "$test_name tests completed"
}

# Function to run tests without coverage
run_tests() {
    local test_dir=$1
    local test_name=$2
    
    print_status "Running $test_name tests..."
    
    if [ -f "$test_dir/jest.config.js" ]; then
        cd "$test_dir"
        npm test -- --testTimeout=$TEST_TIMEOUT --maxWorkers=$PARALLEL_JOBS
        cd - > /dev/null
    else
        npm test -- "$test_dir" --testTimeout=$TEST_TIMEOUT --maxWorkers=$PARALLEL_JOBS
    fi
    
    print_success "$test_name tests completed"
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    if command_exists npx; then
        npx playwright test "$E2E_TESTS" --timeout=$TEST_TIMEOUT
        print_success "E2E tests completed"
    else
        print_warning "Playwright not found, skipping E2E tests"
    fi
}

# Function to check test coverage
check_coverage() {
    local coverage_file="coverage/lcov-report/index.html"
    
    if [ -f "$coverage_file" ]; then
        print_status "Coverage report generated at: $coverage_file"
        
        # Extract coverage percentage (simplified)
        local coverage_percent=$(grep -o '[0-9]*\.[0-9]*%' coverage/lcov.info | head -1 | sed 's/%//')
        
        if [ ! -z "$coverage_percent" ]; then
            print_status "Overall coverage: ${coverage_percent}%"
            
            if (( $(echo "$coverage_percent >= $COVERAGE_THRESHOLD" | bc -l) )); then
                print_success "Coverage threshold ($COVERAGE_THRESHOLD%) met"
            else
                print_warning "Coverage threshold ($COVERAGE_THRESHOLD%) not met"
            fi
        fi
    fi
}

# Function to run specific test suite
run_specific_suite() {
    local suite=$1
    
    case $suite in
        "products")
            run_tests_with_coverage "$PRODUCTS_TESTS" "Products"
            ;;
        "brands")
            run_tests_with_coverage "$BRANDS_TESTS" "Brands"
            ;;
        "categories")
            run_tests_with_coverage "$CATEGORIES_TESTS" "Categories"
            ;;
        "auth")
            run_tests "$AUTH_TESTS" "Authentication"
            ;;
        "e2e")
            run_e2e_tests
            ;;
        *)
            print_error "Unknown test suite: $suite"
            print_status "Available suites: products, brands, categories, auth, e2e"
            exit 1
            ;;
    esac
}

# Function to run all tests
run_all_tests() {
    print_status "Starting comprehensive test suite..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
    
    # Create coverage directory
    mkdir -p coverage
    
    # Run all test suites
    local failed_suites=()
    
    # Products tests
    if [ -d "$PRODUCTS_TESTS" ]; then
        if run_tests_with_coverage "$PRODUCTS_TESTS" "Products"; then
            print_success "Products tests passed"
        else
            failed_suites+=("products")
        fi
    else
        print_warning "Products test directory not found"
    fi
    
    # Brands tests
    if [ -d "$BRANDS_TESTS" ]; then
        if run_tests_with_coverage "$BRANDS_TESTS" "Brands"; then
            print_success "Brands tests passed"
        else
            failed_suites+=("brands")
        fi
    else
        print_warning "Brands test directory not found"
    fi
    
    # Categories tests
    if [ -d "$CATEGORIES_TESTS" ]; then
        if run_tests_with_coverage "$CATEGORIES_TESTS" "Categories"; then
            print_success "Categories tests passed"
        else
            failed_suites+=("categories")
        fi
    else
        print_warning "Categories test directory not found"
    fi
    
    # Authentication tests
    if run_tests "$AUTH_TESTS" "Authentication"; then
        print_success "Authentication tests passed"
    else
        failed_suites+=("auth")
    fi
    
    # E2E tests
    if run_e2e_tests; then
        print_success "E2E tests passed"
    else
        failed_suites+=("e2e")
    fi
    
    # Check coverage
    check_coverage
    
    # Report results
    if [ ${#failed_suites[@]} -eq 0 ]; then
        print_success "All test suites passed! 🎉"
        exit 0
    else
        print_error "The following test suites failed: ${failed_suites[*]}"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Comprehensive Test Runner for Inventory POS System"
    echo ""
    echo "Usage: $0 [OPTIONS] [SUITE]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --coverage Run tests with coverage (default)"
    echo "  -f, --fast     Run tests without coverage"
    echo "  -p, --parallel Set number of parallel jobs (default: $PARALLEL_JOBS)"
    echo "  -t, --timeout  Set test timeout in ms (default: $TEST_TIMEOUT)"
    echo ""
    echo "Suites:"
    echo "  products       Run only products tests"
    echo "  brands         Run only brands tests"
    echo "  categories     Run only categories tests"
    echo "  auth           Run only authentication tests"
    echo "  e2e            Run only E2E tests"
    echo "  all            Run all test suites (default)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run all tests with coverage"
    echo "  $0 products           # Run only products tests"
    echo "  $0 -f brands          # Run brands tests without coverage"
    echo "  $0 -p 8 -t 60000      # Run with 8 parallel jobs and 60s timeout"
}

# Parse command line arguments
COVERAGE=true
SUITE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -f|--fast)
            COVERAGE=false
            shift
            ;;
        -p|--parallel)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        -t|--timeout)
            TEST_TIMEOUT="$2"
            shift 2
            ;;
        products|brands|categories|auth|e2e|all)
            SUITE="$1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
print_status "Test Runner Configuration:"
print_status "  Coverage: $COVERAGE"
print_status "  Suite: $SUITE"
print_status "  Parallel jobs: $PARALLEL_JOBS"
print_status "  Timeout: ${TEST_TIMEOUT}ms"
echo ""

if [ "$SUITE" = "all" ]; then
    run_all_tests
else
    run_specific_suite "$SUITE"
fi 