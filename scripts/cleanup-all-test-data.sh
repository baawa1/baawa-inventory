#!/bin/bash

echo "🧹 Comprehensive Test Data Cleanup"
echo "=================================="

# Check if we want to clean up all test data or just recent
if [ "$1" = "--all" ]; then
    echo "🗑️  Cleaning up ALL test data (not just recent)"
    node scripts/cleanup-test-accounts.js --all
else
    echo "🕐 Cleaning up test data from the last hour"
    node scripts/cleanup-test-accounts.js
fi

# Clean up any test files or temporary data
echo "📁 Cleaning up temporary test files..."

# Remove test screenshots and videos (if any)
if [ -d "test-results" ]; then
    echo "📸 Cleaning up test results..."
    rm -rf test-results/*
fi

# Remove Playwright report (if exists)
if [ -d "playwright-report" ]; then
    echo "📊 Cleaning up Playwright reports..."
    rm -rf playwright-report/*
fi

# Clean up any temporary files
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true

echo "✅ Comprehensive cleanup complete!"
echo ""
echo "Usage:"
echo "  ./scripts/cleanup-all-test-data.sh        # Clean recent test data (last hour)"
echo "  ./scripts/cleanup-all-test-data.sh --all  # Clean ALL test data" 