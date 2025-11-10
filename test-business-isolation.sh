#!/bin/bash

echo "Testing Business Data Isolation..."

# Test 1: Check if backend is running
echo "1. Testing backend availability..."
if curl -s http://localhost:8000/api/login/ > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running"
    exit 1
fi

# Test 2: Login as admin user
echo "2. Testing login as admin user..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}')

if echo "$ADMIN_RESPONSE" | grep -q "access"; then
    echo "✅ Admin login successful"
    ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)
    echo "   Admin token obtained: ${ADMIN_TOKEN:0:20}..."
else
    echo "❌ Admin login failed"
    echo "   Response: $ADMIN_RESPONSE"
    exit 1
fi

# Test 3: Login as hoko user
echo "3. Testing login as hoko user..."
HOKO_RESPONSE=$(curl -s -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "hoko1@gmail.com", "password": "admin123"}')

if echo "$HOKO_RESPONSE" | grep -q "access"; then
    echo "✅ Hoko login successful"
    HOKO_TOKEN=$(echo "$HOKO_RESPONSE" | grep -o '"access":"[^"]*"' | cut -d'"' -f4)
    echo "   Hoko token obtained: ${HOKO_TOKEN:0:20}..."
else
    echo "❌ Hoko login failed"
    echo "   Response: $HOKO_RESPONSE"
    exit 1
fi

# Test 4: Test chart of accounts with admin token
echo "4. Testing chart of accounts with admin token..."
ADMIN_ACCOUNTS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/chart-of-accounts/ \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$ADMIN_ACCOUNTS_RESPONSE" | grep -q "results"; then
    echo "✅ Admin can access chart of accounts"
    ADMIN_COUNT=$(echo "$ADMIN_ACCOUNTS_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "   Admin sees $ADMIN_COUNT accounts"
else
    echo "❌ Admin cannot access chart of accounts"
    echo "   Response: $ADMIN_ACCOUNTS_RESPONSE"
    exit 1
fi

# Test 5: Test chart of accounts with hoko token
echo "5. Testing chart of accounts with hoko token..."
HOKO_ACCOUNTS_RESPONSE=$(curl -s -X GET http://localhost:8000/api/chart-of-accounts/ \
  -H "Authorization: Bearer $HOKO_TOKEN")

if echo "$HOKO_ACCOUNTS_RESPONSE" | grep -q "results"; then
    echo "✅ Hoko can access chart of accounts"
    HOKO_COUNT=$(echo "$HOKO_ACCOUNTS_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "   Hoko sees $HOKO_COUNT accounts"
else
    echo "❌ Hoko cannot access chart of accounts"
    echo "   Response: $HOKO_ACCOUNTS_RESPONSE"
    exit 1
fi

# Test 6: Compare account counts
echo "6. Comparing account counts..."
if [ "$ADMIN_COUNT" != "$HOKO_COUNT" ]; then
    echo "✅ Data isolation working - different users see different data"
    echo "   Admin sees: $ADMIN_COUNT accounts"
    echo "   Hoko sees: $HOKO_COUNT accounts"
else
    echo "⚠️  Data isolation may not be working - both users see same data"
    echo "   Both see: $ADMIN_COUNT accounts"
fi

# Test 7: Test journal entries with admin token
echo "7. Testing journal entries with admin token..."
ADMIN_JOURNAL_RESPONSE=$(curl -s -X GET http://localhost:8000/api/journal-entries/ \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$ADMIN_JOURNAL_RESPONSE" | grep -q "results"; then
    echo "✅ Admin can access journal entries"
    ADMIN_JOURNAL_COUNT=$(echo "$ADMIN_JOURNAL_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "   Admin sees $ADMIN_JOURNAL_COUNT journal entries"
else
    echo "❌ Admin cannot access journal entries"
    echo "   Response: $ADMIN_JOURNAL_RESPONSE"
fi

# Test 8: Test journal entries with hoko token
echo "8. Testing journal entries with hoko token..."
HOKO_JOURNAL_RESPONSE=$(curl -s -X GET http://localhost:8000/api/journal-entries/ \
  -H "Authorization: Bearer $HOKO_TOKEN")

if echo "$HOKO_JOURNAL_RESPONSE" | grep -q "results"; then
    echo "✅ Hoko can access journal entries"
    HOKO_JOURNAL_COUNT=$(echo "$HOKO_JOURNAL_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    echo "   Hoko sees $HOKO_JOURNAL_COUNT journal entries"
else
    echo "❌ Hoko cannot access journal entries"
    echo "   Response: $HOKO_JOURNAL_RESPONSE"
fi

# Test 9: Compare journal entry counts
echo "9. Comparing journal entry counts..."
if [ "$ADMIN_JOURNAL_COUNT" != "$HOKO_JOURNAL_COUNT" ]; then
    echo "✅ Journal entries isolation working - different users see different data"
    echo "   Admin sees: $ADMIN_JOURNAL_COUNT entries"
    echo "   Hoko sees: $HOKO_JOURNAL_COUNT entries"
else
    echo "⚠️  Journal entries isolation may not be working - both users see same data"
    echo "   Both see: $ADMIN_JOURNAL_COUNT entries"
fi

echo ""
echo "🎉 Business data isolation test completed!"
echo ""
echo "Summary:"
echo "- Admin user: $ADMIN_COUNT accounts, $ADMIN_JOURNAL_COUNT journal entries"
echo "- Hoko user: $HOKO_COUNT accounts, $HOKO_JOURNAL_COUNT journal entries"
echo ""
echo "If the counts are different, data isolation is working correctly."
echo "If the counts are the same, there may be an issue with business filtering." 