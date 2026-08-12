#!/bin/bash

echo "🚀 Complete ERP System API Tests"
echo "========================================="
echo ""

# ============================================
# 1. REGISTRATION & LOGIN
# ============================================
echo "1️⃣ Registering company..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "cloudmasters.",
    "adminEmail": "admin@cloudmasters.com",
    "password": "Admin@123"
  }')

echo $REGISTER_RESPONSE
echo ""
echo ""

echo "2️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cloudmasters.com",
    "password": "Admin@123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtained"
echo ""
echo "========================================="

# ============================================
# 2. EMPLOYEE TESTS
# ============================================
echo "👥 EMPLOYEE TESTS"
echo "========================================="
echo ""

echo "3️⃣ Getting all employees..."
curl -X GET http://localhost:5001/api/employees \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "4️⃣ Getting employee stats..."
curl -X GET http://localhost:5001/api/employees/stats \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "5️⃣ Creating a new employee..."
curl -X POST http://localhost:5001/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test User",
    "email": "test.user@company.com",
    "role": "Software Engineer",
    "department": "Engineering",
    "status": "active",
    "joinDate": "2024-01-01",
    "location": "Test City",
    "phone": "+1 (555) 000-0000",
    "performance": 85,
    "projects": 5,
    "avatar": "TU",
    "skills": ["JavaScript", "React", "Node.js"]
  }'
echo ""
echo ""

echo "========================================="

# ============================================
# 3. INVENTORY TESTS
# ============================================
echo "📦 INVENTORY TESTS"
echo "========================================="
echo ""

echo "6️⃣ Getting all inventory items..."
curl -X GET http://localhost:5001/api/inventory \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "7️⃣ Getting inventory stats..."
curl -X GET http://localhost:5001/api/inventory/stats \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "8️⃣ Getting inventory with filters (Electronics)..."
curl -X GET "http://localhost:5001/api/inventory?category=Electronics" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "9️⃣ Getting low stock items..."
curl -X GET "http://localhost:5001/api/inventory?status=low-stock" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "🔟 Getting inventory sorted by price (highest first)..."
curl -X GET "http://localhost:5001/api/inventory?sortBy=price&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "1️⃣1️⃣ Searching inventory for 'MacBook'..."
curl -X GET "http://localhost:5001/api/inventory?search=MacBook" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "1️⃣2️⃣ Creating a new inventory item..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5001/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Wireless Charging Pad",
    "sku": "CHG-WL-013",
    "category": "Accessories",
    "quantity": 75,
    "minStock": 15,
    "maxStock": 120,
    "status": "in-stock",
    "price": 49.99,
    "cost": 25.00,
    "location": "Warehouse B",
    "supplier": "Anker",
    "lastRestocked": "2024-03-20",
    "image": "🔋",
    "salesVelocity": 30,
    "profitMargin": 50
  }')

echo $CREATE_RESPONSE
echo ""
echo ""

# Extract the ID of the created item
ITEM_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$ITEM_ID" ]; then
  echo "✅ Created inventory item with ID: $ITEM_ID"
  echo ""
  
  echo "1️⃣3️⃣ Getting the new inventory item by ID..."
  curl -X GET "http://localhost:5001/api/inventory/$ITEM_ID" \
    -H "Authorization: Bearer $TOKEN"
  echo ""
  echo ""
  
  echo "1️⃣4️⃣ Updating stock quantity to 40..."
  curl -X PUT "http://localhost:5001/api/inventory/$ITEM_ID/stock" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "quantity": 40
    }'
  echo ""
  echo ""
  
  echo "1️⃣5️⃣ Updating the inventory item details..."
  curl -X PUT "http://localhost:5001/api/inventory/$ITEM_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "name": "Wireless Charging Pad Pro",
      "price": 59.99,
      "salesVelocity": 35
    }'
  echo ""
  echo ""
  
  echo "1️⃣6️⃣ Deleting the test inventory item..."
  curl -X DELETE "http://localhost:5001/api/inventory/$ITEM_ID" \
    -H "Authorization: Bearer $TOKEN"
  echo ""
  echo ""
fi

echo "========================================="

# ============================================
# 4. ORDERS TESTS
# ============================================
echo "📋 ORDERS TESTS"
echo "========================================="
echo ""

echo "1️⃣7️⃣ Getting all orders..."
curl -X GET http://localhost:5001/api/orders \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "1️⃣8️⃣ Getting order stats..."
curl -X GET http://localhost:5001/api/orders/stats \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "1️⃣9️⃣ Getting orders with filters (status=processing)..."
curl -X GET "http://localhost:5001/api/orders?status=processing" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "2️⃣0️⃣ Getting orders with filters (priority=high)..."
curl -X GET "http://localhost:5001/api/orders?priority=high" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "2️⃣1️⃣ Searching orders for 'Alexandra'..."
curl -X GET "http://localhost:5001/api/orders?search=Alexandra" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "2️⃣2️⃣ Getting orders by timeframe (week)..."
curl -X GET "http://localhost:5001/api/orders?timeframe=week" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "2️⃣3️⃣ Creating a new order..."
ORDER_RESPONSE=$(curl -s -X POST http://localhost:5001/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "order_id": "ORD-009",
    "customer_name": "Test Customer",
    "customer_email": "test.customer@email.com",
    "customer_avatar": "TC",
    "customer_tier": "Gold",
    "items": [
      {"name": "Test Product 1", "quantity": 2, "price": 39.99},
      {"name": "Test Product 2", "quantity": 1, "price": 29.99}
    ],
    "total": 109.97,
    "status": "pending",
    "priority": "medium",
    "payment_method": "Credit Card",
    "shipping_address": "123 Test St, Test City, TC 12345",
    "estimated_delivery": "2024-03-25",
    "notes": "Test order"
  }')

echo $ORDER_RESPONSE
echo ""
echo ""

# Extract the ID of the created order
ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$ORDER_ID" ]; then
  echo "✅ Created order with ID: $ORDER_ID"
  echo ""
  
  echo "2️⃣4️⃣ Getting the new order by ID..."
  curl -X GET "http://localhost:5001/api/orders/$ORDER_ID" \
    -H "Authorization: Bearer $TOKEN"
  echo ""
  echo ""
  
  echo "2️⃣5️⃣ Updating order status to shipped..."
  curl -X PUT "http://localhost:5001/api/orders/$ORDER_ID/status" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "status": "shipped"
    }'
  echo ""
  echo ""
  
  echo "2️⃣6️⃣ Updating the order details..."
  curl -X PUT "http://localhost:5001/api/orders/$ORDER_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "customer_name": "Test Customer Updated",
      "priority": "high",
      "notes": "Updated notes for test order"
    }'
  echo ""
  echo ""
  
  echo "2️⃣7️⃣ Deleting the test order..."
  curl -X DELETE "http://localhost:5001/api/orders/$ORDER_ID" \
    -H "Authorization: Bearer $TOKEN"
  echo ""
  echo ""
else
  echo "❌ Failed to create test order"
  echo ""
fi

echo "========================================="

# ============================================
# 5. ANALYTICS TESTS
# ============================================
echo "📊 ANALYTICS TESTS"
echo "========================================="
echo ""

echo "2️⃣8️⃣ Getting full analytics dashboard..."
curl -X GET "http://localhost:5001/api/analytics/dashboard?timeframe=month" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "2️⃣9️⃣ Getting KPIs..."
curl -X GET "http://localhost:5001/api/analytics/kpis?timeframe=month" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣0️⃣ Getting revenue chart data..."
curl -X GET "http://localhost:5001/api/analytics/chart?metric=revenue&timeframe=month" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣1️⃣ Getting orders chart data..."
curl -X GET "http://localhost:5001/api/analytics/chart?metric=orders&timeframe=month" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣2️⃣ Getting customers chart data..."
curl -X GET "http://localhost:5001/api/analytics/chart?metric=customers&timeframe=month" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣3️⃣ Getting profit chart data..."
curl -X GET "http://localhost:5001/api/analytics/chart?metric=profit&timeframe=month" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣4️⃣ Getting top products..."
curl -X GET "http://localhost:5001/api/analytics/top-products?limit=5" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣5️⃣ Getting top customers..."
curl -X GET "http://localhost:5001/api/analytics/top-customers?limit=5" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣6️⃣ Getting insights..."
curl -X GET "http://localhost:5001/api/analytics/insights" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣7️⃣ Testing analytics with different timeframe (week)..."
curl -X GET "http://localhost:5001/api/analytics/dashboard?timeframe=week" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "3️⃣8️⃣ Testing analytics with different timeframe (quarter)..."
curl -X GET "http://localhost:5001/api/analytics/dashboard?timeframe=quarter" \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "========================================="

# ============================================
# 6. SETTINGS TESTS
# ============================================
echo "⚙️ SETTINGS TESTS"
echo "========================================="
echo ""

echo "3️⃣9️⃣ Getting all settings..."
curl -X GET http://localhost:5001/api/settings \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "4️⃣0️⃣ Updating profile settings..."
curl -X PUT http://localhost:5001/api/settings/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "full_name": "John Anderson",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "bio": "Senior system administrator with 8+ years of experience"
  }'
echo ""
echo ""

echo "4️⃣1️⃣ Updating notification settings..."
curl -X PUT http://localhost:5001/api/settings/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email_alerts": true,
    "push_notifications": true,
    "order_updates": true,
    "inventory_alerts": false,
    "marketing_emails": false,
    "weekly_reports": true
  }'
echo ""
echo ""

echo "4️⃣2️⃣ Updating security settings..."
curl -X PUT http://localhost:5001/api/settings/security \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "two_factor_auth": false,
    "session_timeout": "30",
    "login_alerts": true
  }'
echo ""
echo ""

echo "4️⃣3️⃣ Updating appearance settings..."
curl -X PUT http://localhost:5001/api/settings/appearance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "theme": "dark",
    "compact_view": false,
    "animations": true
  }'
echo ""
echo ""

echo "4️⃣4️⃣ Getting updated settings..."
curl -X GET http://localhost:5001/api/settings \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "4️⃣5️⃣ Updating password..."
curl -X PUT http://localhost:5001/api/settings/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "Admin@123",
    "newPassword": "Admin@123"
  }'
echo ""
echo ""

echo "========================================="

# ============================================
# 7. AI INSIGHTS TESTS
# ============================================
echo "🤖 AI INSIGHTS TESTS"
echo "========================================="
echo ""

echo "4️⃣6️⃣ Getting AI dashboard..."
curl -X GET http://localhost:5001/api/ai/dashboard \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "4️⃣7️⃣ Getting AI insights..."
curl -X GET http://localhost:5001/api/ai/insights \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "4️⃣8️⃣ Generating AI insights..."
curl -X POST http://localhost:5001/api/ai/insights/generate \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "4️⃣9️⃣ Getting AI predictions..."
curl -X GET http://localhost:5001/api/ai/predictions \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "5️⃣0️⃣ Getting AI recommendations..."
curl -X GET http://localhost:5001/api/ai/recommendations \
  -H "Authorization: Bearer $TOKEN"
echo ""
echo ""

echo "========================================="
echo "🎉 All tests completed!"
echo "========================================="