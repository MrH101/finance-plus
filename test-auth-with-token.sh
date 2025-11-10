#!/bin/bash

echo "Testing authentication with JWT token..."

# Get JWT token
echo "1. Getting JWT token..."
TOKEN_RESPONSE=$(curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  -s)

echo "Token response: $TOKEN_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Failed to extract access token"
    exit 1
fi

echo "Access token: $ACCESS_TOKEN"

# Test chart of accounts with token
echo -e "\n2. Testing chart of accounts endpoint with JWT token..."
curl -X GET http://localhost:8000/api/chart-of-accounts/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\nTest completed!" 