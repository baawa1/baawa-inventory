#!/bin/bash

echo "🧹 Cleaning up existing dev environments..."

# Kill any Node.js processes running on ports 3000, 3001, 3002
echo "📡 Killing processes on ports 3000, 3001, 3002..."
pkill -f "next dev" || true
pkill -f "npm run dev" || true

# Kill specific port processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 3

echo "✅ Cleanup complete"

# Check if port 3000 is free
if lsof -i:3000 >/dev/null 2>&1; then
    echo "❌ Port 3000 is still in use. Please manually kill the process."
    exit 1
else
    echo "✅ Port 3000 is available"
fi

echo "🚀 Starting dev server on port 3000..."

# Start the dev server in the background
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
if ! lsof -i:3000 >/dev/null 2>&1; then
    echo "❌ Server failed to start on port 3000"
    kill $DEV_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Server started on port 3000"

echo "🚀 Running tests with Chrome guest profile..."

# Run the specific test file
npx playwright test tests/e2e/unverified-email-access-control.spec.ts --project=chrome

# Clean up test accounts
echo "🧹 Cleaning up test accounts..."
node scripts/cleanup-test-accounts.js

# Clean up server
echo "🧹 Cleaning up server..."
kill $DEV_PID 2>/dev/null || true

echo "✅ Tests completed with cleanup" 