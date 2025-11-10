#!/bin/bash

# Test script to check API endpoints
BASE_URL="http://localhost:8000"

echo "Testing API endpoints..."
echo "========================"

# Test authentication endpoint
echo "1. Testing authentication endpoint..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/token/" || echo "Failed to connect"

echo -e "\n2. Testing employees endpoint..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/employees/" || echo "Failed to connect"

echo -e "\n3. Testing payrolls endpoint..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/payrolls/" || echo "Failed to connect"

echo -e "\n4. Testing bank transactions endpoint..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/bank-transactions/" || echo "Failed to connect"

echo -e "\n5. Testing mobile money transactions endpoint..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/mobile-money-transactions/" || echo "Failed to connect"

echo -e "\n6. Testing departments endpoint..."
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/departments/" || echo "Failed to connect"

echo -e "\n========================"
echo "Test completed!" 