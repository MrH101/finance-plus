#!/bin/bash

echo "Testing complete login flow..."

# Test 1: Check if backend is running
echo "1. Testing backend availability..."
if curl -s http://localhost:8001/api/login/ > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running"
    exit 1
fi

# Test 2: Check if frontend is running
echo "2. Testing frontend availability..."
if curl -s http://localhost:5175 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not running"
    exit 1
fi

# Test 3: Test login endpoint
echo "3. Testing login endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access"; then
    ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Admin login successful"
    echo "   Admin token obtained: ${ADMIN_TOKEN:0:20}..."
else
    echo "❌ Admin login failed"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 4: Test user endpoint with admin token
echo "4. Testing user endpoint with admin token..."
USER_ME_RESPONSE=$(curl -s -X GET http://localhost:8001/api/users/me/ \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$USER_ME_RESPONSE" | grep -q "email"; then
    echo "✅ User endpoint accessible for admin"
else
    echo "❌ User endpoint not accessible for admin"
    echo "   Response: $USER_ME_RESPONSE"
    exit 1
fi

# Test 5: Test login as hoko user (employer)
echo "5. Testing login as hoko user..."
HOKO_RESPONSE=$(curl -s -X POST http://localhost:8001/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "hoko1@gmail.com", "password": "admin123"}')

if echo "$HOKO_RESPONSE" | grep -q "access"; then
    HOKO_TOKEN=$(echo "$HOKO_RESPONSE" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Hoko login successful"
    echo "   Hoko token obtained: ${HOKO_TOKEN:0:20}..."
else
    echo "❌ Hoko login failed"
    echo "   Response: $HOKO_RESPONSE"
    exit 1
fi

# Test 6: Fetch Chart of Accounts for Admin
echo "6. Fetching Chart of Accounts for Admin..."
ADMIN_ACCOUNTS=$(curl -s -X GET http://localhost:8001/api/chart-of-accounts/ \
  -H "Authorization: Bearer $ADMIN_TOKEN")
ADMIN_ACCOUNT_COUNT=$(echo "$ADMIN_ACCOUNTS" | jq '.results | length')
if [ "$ADMIN_ACCOUNT_COUNT" -eq 0 ]; then
    ADMIN_ACCOUNT_COUNT=$(echo "$ADMIN_ACCOUNTS" | jq 'length') # Fallback for non-paginated
fi
echo "   Admin sees: $ADMIN_ACCOUNT_COUNT accounts"

# Test 7: Fetch Chart of Accounts for Hoko
echo "7. Fetching Chart of Accounts for Hoko..."
HOKO_ACCOUNTS=$(curl -s -X GET http://localhost:8001/api/chart-of-accounts/ \
  -H "Authorization: Bearer $HOKO_TOKEN")
HOKO_ACCOUNT_COUNT=$(echo "$HOKO_ACCOUNTS" | jq '.results | length')
if [ "$HOKO_ACCOUNT_COUNT" -eq 0 ]; then
    HOKO_ACCOUNT_COUNT=$(echo "$HOKO_ACCOUNTS" | jq 'length') # Fallback for non-paginated
fi
echo "   Hoko sees: $HOKO_ACCOUNT_COUNT accounts"

# Test 8: Comparing account counts
echo "8. Comparing account counts..."
if [ "$ADMIN_ACCOUNT_COUNT" -ne "$HOKO_ACCOUNT_COUNT" ]; then
    echo "✅ Account isolation is working - users see different data"
else
    echo "⚠️  Account isolation may not be working - both users see same data"
fi

# Test 9: Fetch Journal Entries for Admin
echo "9. Fetching Journal Entries for Admin..."
ADMIN_JOURNAL_ENTRIES=$(curl -s -X GET http://localhost:8001/api/journal-entries/ \
  -H "Authorization: Bearer $ADMIN_TOKEN")
ADMIN_JOURNAL_ENTRY_COUNT=$(echo "$ADMIN_JOURNAL_ENTRIES" | jq '.results | length')
if [ "$ADMIN_JOURNAL_ENTRY_COUNT" -eq 0 ]; then
    ADMIN_JOURNAL_ENTRY_COUNT=$(echo "$ADMIN_JOURNAL_ENTRIES" | jq 'length') # Fallback for non-paginated
fi
echo "   Admin sees: $ADMIN_JOURNAL_ENTRY_COUNT journal entries"

# Test 10: Fetch Journal Entries for Hoko
echo "10. Fetching Journal Entries for Hoko..."
HOKO_JOURNAL_ENTRIES=$(curl -s -X GET http://localhost:8001/api/journal-entries/ \
  -H "Authorization: Bearer $HOKO_TOKEN")
HOKO_JOURNAL_ENTRY_COUNT=$(echo "$HOKO_JOURNAL_ENTRIES" | jq '.results | length')
if [ "$HOKO_JOURNAL_ENTRY_COUNT" -eq 0 ]; then
    HOKO_JOURNAL_ENTRY_COUNT=$(echo "$HOKO_JOURNAL_ENTRIES" | jq 'length') # Fallback for non-paginated
fi
echo "   Hoko sees: $HOKO_JOURNAL_ENTRY_COUNT journal entries"

# Test 11: Comparing journal entry counts
echo "11. Comparing journal entry counts..."
if [ "$ADMIN_JOURNAL_ENTRY_COUNT" -ne "$HOKO_JOURNAL_ENTRY_COUNT" ]; then
    echo "✅ Journal entries isolation is working - users see different data"
else
    echo "⚠️  Journal entries isolation may not be working - both users see same data"
fi

echo ""
echo "🎉 Business data isolation test completed!"
echo ""
echo "Summary:"
echo "- Admin user: $ADMIN_ACCOUNT_COUNT accounts, $ADMIN_JOURNAL_ENTRY_COUNT journal entries"
echo "- Hoko user: $HOKO_ACCOUNT_COUNT accounts, $HOKO_JOURNAL_ENTRY_COUNT journal entries"
echo ""
echo "If the counts are different, data isolation is working correctly."
echo "If the counts are the same, there may be an issue with business filtering." 