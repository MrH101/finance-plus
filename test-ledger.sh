#!/bin/bash

echo "Testing ledger endpoint with JWT token..."

# Get JWT token
echo "1. Getting JWT token..."
TOKEN_RESPONSE=$(curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  -s)

# Extract access token
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Failed to extract access token"
    exit 1
fi

echo "Access token obtained successfully"

# Test ledger endpoint with token
echo -e "\n2. Testing ledger endpoint with JWT token..."
curl -X GET http://localhost:8000/api/ledger/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

# Test journal entries endpoint with token
echo -e "\n3. Testing journal entries endpoint with JWT token..."
curl -X GET http://localhost:8000/api/journal-entries/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo -e "\nTest completed!" 