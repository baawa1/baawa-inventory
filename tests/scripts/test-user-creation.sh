#!/bin/bash

# Script to test user creation API with proper admin authentication
# This script will help debug the user creation issue

echo "=== Testing User Creation API ==="

# First, let's check if we can access the admin login endpoint
echo "1. Checking admin session..."
curl -s "http://localhost:3000/api/auth/session" \
  -H "Cookie: next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0" \
  | jq '.'

echo -e "\n2. Attempting to create a user..."

# Test user creation with a simple payload
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "testuser@example.com",
    "password": "password123",
    "role": "STAFF"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  | jq '.'

echo "=== Test Complete ==="
