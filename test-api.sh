#!/bin/bash

# API Test Script for Finance Plus
# This script tests the main API endpoints

API_BASE="http://localhost:8000/api"

echo "🧪 Testing Finance Plus API Endpoints..."
echo "API Base URL: $API_BASE"
echo ""

# Test 1: Check if server is running
echo "1. Testing server connectivity..."
if curl -s "$API_BASE/" > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start the backend server first."
    exit 1
fi

# Test 2: Test authentication endpoints
echo ""
echo "2. Testing authentication endpoints..."

# Test login endpoint (should return 400 for missing credentials)
echo "   Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_BASE/auth/login/" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testpass"}')

if [[ $LOGIN_RESPONSE == *"400"* ]] || [[ $LOGIN_RESPONSE == *"401"* ]]; then
    echo "   ✅ Login endpoint is accessible"
else
    echo "   ❌ Login endpoint test failed"
fi

# Test 3: Test transactions endpoint
echo ""
echo "3. Testing transactions endpoint..."
TRANSACTIONS_RESPONSE=$(curl -s -w "%{http_code}" "$API_BASE/transactions/")

if [[ $TRANSACTIONS_RESPONSE == *"401"* ]] || [[ $TRANSACTIONS_RESPONSE == *"200"* ]]; then
    echo "   ✅ Transactions endpoint is accessible"
else
    echo "   ❌ Transactions endpoint test failed"
fi

# Test 4: Test users endpoint
echo ""
echo "4. Testing users endpoint..."
USERS_RESPONSE=$(curl -s -w "%{http_code}" "$API_BASE/users/")

if [[ $USERS_RESPONSE == *"401"* ]] || [[ $USERS_RESPONSE == *"200"* ]]; then
    echo "   ✅ Users endpoint is accessible"
else
    echo "   ❌ Users endpoint test failed"
fi

echo ""
echo "🎉 API testing completed!"
echo ""
echo "Note: Some endpoints may return 401 (Unauthorized) which is expected"
echo "without proper authentication tokens."
echo ""
echo "To test with authentication:"
echo "1. Register a user at http://localhost:5173/signup"
echo "2. Login at http://localhost:5173/login"
echo "3. Use the JWT token in subsequent API calls" 