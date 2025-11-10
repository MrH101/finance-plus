#!/bin/bash

# Test authentication and API endpoints
BASE_URL="http://localhost:8000"

echo "Testing authentication and API endpoints..."
echo "=========================================="

# Get a list of users to test with
echo "1. Getting users list..."
USERS_RESPONSE=$(curl -s "$BASE_URL/api/users/")
echo "Users response: $USERS_RESPONSE"

# Try to get a token (this might fail if no users exist)
echo -e "\n2. Testing token endpoint..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/token/" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}')
echo "Token response: $TOKEN_RESPONSE"

# Extract token if successful
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo -e "\n3. Testing products endpoint with authentication..."
    PRODUCTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/products/")
    echo "Products response: $PRODUCTS_RESPONSE"
    
    echo -e "\n4. Testing employees endpoint with authentication..."
    EMPLOYEES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/employees/")
    echo "Employees response: $EMPLOYEES_RESPONSE"
else
    echo -e "\nNo valid token obtained. Testing without authentication..."
    
    echo -e "\n3. Testing products endpoint without authentication..."
    PRODUCTS_RESPONSE=$(curl -s "$BASE_URL/api/products/")
    echo "Products response: $PRODUCTS_RESPONSE"
fi

echo -e "\n=========================================="
echo "Test completed!" 