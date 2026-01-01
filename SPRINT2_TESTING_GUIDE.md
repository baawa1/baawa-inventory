# Sprint 2 Testing Guide

This guide provides comprehensive testing instructions for all Sprint 2 implementations focused on data integrity and performance improvements.

## 🎯 Testing Overview

Sprint 2 implemented:
1. Stock Transaction History (Audit Trail)
2. Weighted Average Cost Calculation
3. Price Validation & Constraints
4. Database Cascade Rules
5. SKU Uniqueness Verification
6. Query Performance Optimization

---

## 🔧 Prerequisites

1. **Start Development Server**
```bash
npm run dev
```

2. **Open Browser**
- Navigate to `http://localhost:3000`
- Login with your admin/manager account

3. **Database Access** (Optional for advanced testing)
```bash
npx prisma studio
```

---

## ✅ Test 1: Stock Transaction History

**What Changed:** All stock changes now create audit trail records in `StockTransaction` table.

### Test Scenario 1.1: Sales Transaction Logging

1. **Navigate to POS**
   - Go to `/pos`
   - Add a product to cart (note the current stock level)
   - Complete a sale

2. **Verify Stock Transaction Created**
   - Open Prisma Studio: `npx prisma studio`
   - Go to `StockTransaction` model
   - Find the most recent record
   - Verify:
     - ✅ `type` = "SALE"
     - ✅ `quantity` is negative (stock decreased)
     - ✅ `referenceType` = "SalesTransaction"
     - ✅ `previousStock` shows old stock level
     - ✅ `newStock` shows new stock level
     - ✅ `userId` matches your user ID

### Test Scenario 1.2: Stock Addition Logging

1. **Navigate to Stock Additions**
   - Go to `/inventory/products`
   - Click "Add Stock" on any product
   - Enter quantity (e.g., 50 units) and cost per unit
   - Submit the form

2. **Verify Stock Transaction Created**
   - Check Prisma Studio → `StockTransaction`
   - Find the most recent record
   - Verify:
     - ✅ `type` = "PURCHASE"
     - ✅ `quantity` is positive (stock increased)
     - ✅ `referenceType` = "StockAddition"
     - ✅ `previousStock` and `newStock` are correct
     - ✅ `reason` includes purchase information

### Test Scenario 1.3: Reconciliation Logging

1. **Create and Approve Reconciliation**
   - Go to `/inventory/stock-reconciliations`
   - Click "New Reconciliation"
   - Add products with discrepancies (physical count ≠ system count)
   - Submit and then approve the reconciliation

2. **Verify Stock Transaction Created**
   - Check Prisma Studio → `StockTransaction`
   - Verify:
     - ✅ `type` = "RECONCILIATION"
     - ✅ `quantity` shows the discrepancy (positive or negative)
     - ✅ `referenceType` = "StockReconciliation"
     - ✅ `reason` includes reconciliation title

### Expected Results:
- ✅ Every stock change creates a transaction record
- ✅ Transaction history is complete and accurate
- ✅ Can audit all stock movements with timestamp and user info

---

## 💰 Test 2: Weighted Average Cost

**What Changed:** Product cost is now calculated using weighted average when adding stock.

### Test Scenario 2.1: Basic Weighted Average Calculation

1. **Setup Initial Product**
   - Create a product with:
     - Initial stock: 10 units
     - Initial cost: ₦100 per unit
     - Total cost basis: ₦1,000

2. **Add Stock with Different Cost**
   - Go to stock additions
   - Add 20 units at ₦150 per unit
   - Expected weighted average: (10×₦100 + 20×₦150) / 30 = ₦133.33

3. **Verify Cost Update**
   - Check product details in Prisma Studio
   - Verify:
     - ✅ `stock` = 30
     - ✅ `cost` = 133.33 (approximately)

### Test Scenario 2.2: Multiple Stock Additions

1. **Perform Sequential Additions**
   - Starting: 10 units @ ₦100 = ₦1,000
   - Add 1: 20 units @ ₦150 = ₦3,000
   - Total after Add 1: 30 units @ ₦133.33
   - Add 2: 10 units @ ₦200 = ₦2,000
   - Expected final: (30×₦133.33 + 10×₦200) / 40 = ₦150 per unit

2. **Verify Each Step**
   - Check cost after each addition
   - Verify calculations are accurate

### Test Scenario 2.3: Edge Cases

1. **Test Zero Stock Addition**
   - Try adding 0 units (should be rejected)

2. **Test Very Small Quantities**
   - Add 1 unit to 1000 units
   - Verify cost barely changes

3. **Test Very Large Cost Difference**
   - 100 units @ ₦10
   - Add 10 units @ ₦10,000
   - Verify weighted average is correct

### Expected Results:
- ✅ Cost updates using weighted average formula
- ✅ Calculations are accurate across multiple additions
- ✅ Edge cases handled properly

**Formula Reference:**
```
Weighted Average Cost = (Existing Stock × Existing Cost + New Quantity × New Cost) / Total Stock
```

---

## 🔒 Test 3: Price Validation & Constraints

**What Changed:** Database constraints prevent negative prices/costs and selling at a loss.

### Test Scenario 3.1: Negative Price Prevention (Application Level)

1. **Try Creating Product with Negative Price**
   - Go to `/inventory/products/add`
   - Enter product details
   - Set selling price to `-100`
   - Try to submit

2. **Expected Result:**
   - ✅ Form validation error appears
   - ✅ Cannot submit the form
   - ✅ Error message: "Price must be positive"

### Test Scenario 3.2: Negative Cost Prevention

1. **Try Creating Product with Negative Cost**
   - Set purchase price to `-50`
   - Try to submit

2. **Expected Result:**
   - ✅ Form validation error appears
   - ✅ Cannot submit the form

### Test Scenario 3.3: Selling Below Cost Prevention

1. **Try Creating Product Where Price < Cost**
   - Set purchase price: ₦1,000
   - Set selling price: ₦500
   - Try to submit

2. **Expected Result:**
   - ✅ Validation error: "Selling price must be greater than or equal to purchase price"
   - ✅ Form cannot be submitted

### Test Scenario 3.4: Database Constraint Verification

1. **Check Database Constraints**
```sql
-- Run in Prisma Studio or Supabase SQL Editor
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'products'::regclass
AND contype = 'c';
```

2. **Expected Result:**
   - ✅ `check_price_non_negative` constraint exists
   - ✅ `check_cost_non_negative` constraint exists
   - ✅ Constraints enforce `price >= 0` and `cost >= 0`

### Test Scenario 3.5: Production Database Verification

1. **Run Production Constraint Script**
```bash
node scripts/apply-price-constraints-production.js
```

2. **Expected Output:**
```
✅ Constraint already exists - production database is already protected!
   No action needed - constraints are in place.
```

### Expected Results:
- ✅ Cannot create products with negative prices
- ✅ Cannot create products with negative costs
- ✅ Cannot sell below cost price
- ✅ Database enforces constraints at storage level

---

## 🔗 Test 4: Cascade Rules

**What Changed:** Deleting categories/brands/suppliers now sets product references to NULL instead of failing.

### Test Scenario 4.1: Delete Category with Products

1. **Setup**
   - Create a category (e.g., "Test Category")
   - Create 2-3 products in that category

2. **Delete Category**
   - Go to `/inventory/categories`
   - Delete the "Test Category"

3. **Verify Products Still Exist**
   - Go to `/inventory/products`
   - Search for the products
   - Verify:
     - ✅ Products still exist (not deleted)
     - ✅ `categoryId` is now NULL
     - ✅ Category field shows "No category"

### Test Scenario 4.2: Delete Brand with Products

1. **Setup**
   - Create a brand (e.g., "Test Brand")
   - Assign products to that brand

2. **Delete Brand**
   - Delete the brand

3. **Verify**
   - ✅ Products remain in database
   - ✅ `brandId` is NULL
   - ✅ No errors or orphaned records

### Test Scenario 4.3: Delete Supplier with Products

1. **Setup**
   - Create a supplier
   - Assign products to that supplier

2. **Delete Supplier**
   - Delete the supplier

3. **Verify**
   - ✅ Products still exist
   - ✅ `supplierId` is NULL
   - ✅ Can still view and manage products

### Expected Results:
- ✅ Deleting category/brand/supplier doesn't delete products
- ✅ Foreign key is set to NULL (SetNull cascade rule)
- ✅ No orphaned records or database errors

---

## 🔢 Test 5: SKU Uniqueness Verification

**What Changed:** SKU generation now has retry logic with proper uniqueness checking.

### Test Scenario 5.1: Auto-Generated SKU Uniqueness

1. **Create Multiple Products Quickly**
   - Create 5 products in the same category and brand
   - Leave SKU field empty (auto-generate)
   - Submit each form quickly

2. **Verify All SKUs are Unique**
   - Check Prisma Studio → `Product`
   - Verify:
     - ✅ All SKUs are different
     - ✅ No duplicate SKUs in database
     - ✅ SKU format: `CAT-BR-PRO-1234`

### Test Scenario 5.2: Manual SKU Duplicate Prevention

1. **Create Product with Manual SKU**
   - Create product with SKU: `TEST-SKU-001`

2. **Try Creating Another Product with Same SKU**
   - Create another product
   - Manually enter SKU: `TEST-SKU-001`
   - Try to submit

3. **Expected Result:**
   - ✅ Error message: "Product with this SKU already exists"
   - ✅ HTTP 409 Conflict response
   - ✅ Product not created

### Test Scenario 5.3: SKU Generation Retry Logic

1. **Simulate High Collision Rate** (For developers only)
   - Temporarily reduce random number range in code
   - Create multiple products rapidly
   - Verify retry mechanism works

2. **Expected Result:**
   - ✅ System retries up to 10 times
   - ✅ Eventually finds unique SKU
   - ✅ If all retries fail, returns clear error message

### Test Scenario 5.4: Database Unique Constraint

1. **Verify Database Constraint**
```sql
-- Check unique constraint on SKU
SELECT conname
FROM pg_constraint
WHERE conrelid = 'products'::regclass
AND contype = 'u';
```

2. **Expected Result:**
   - ✅ Unique constraint exists on `sku` column
   - ✅ Database prevents duplicate SKUs at storage level

### Expected Results:
- ✅ Auto-generated SKUs are always unique
- ✅ Manual SKU duplicates are rejected
- ✅ Retry logic handles collisions gracefully
- ✅ Database constraint provides final safety net

---

## ⚡ Test 6: Query Performance Optimization

**What Changed:** Added composite indexes and optimized query patterns.

### Test Scenario 6.1: Product Listing Performance

1. **Test Filter Combinations**
   - Go to `/inventory/products`
   - Apply filters:
     - Category + Status + Archived
     - Brand + Status + Archived
     - Status + Low Stock

2. **Monitor Performance**
   - Open browser DevTools → Network tab
   - Check API response time for `/api/products`
   - Verify:
     - ✅ Response time < 500ms (with reasonable data)
     - ✅ Queries use indexes (check with EXPLAIN in Prisma Studio)

### Test Scenario 6.2: Low Stock Query Performance

1. **Test Low Stock Filter**
   - Go to `/api/products/low-stock`
   - Check response time

2. **Verify Database Query**
   - Query should use composite index on `(stock, minStock, isArchived)`
   - ✅ No full table scan
   - ✅ Fast response even with many products

### Test Scenario 6.3: Stock Additions Query Optimization

1. **Add Stock to Product**
   - Go to stock additions
   - Add stock to a product with supplier

2. **Check Query Count**
   - In development, enable Prisma query logging
   - Verify:
     - ✅ Uses `findUniqueOrThrow` for validation
     - ✅ Minimal database round trips
     - ✅ Single transaction for all operations

### Test Scenario 6.4: Index Verification

1. **Check Database Indexes**
```sql
-- List all indexes on products table
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'products';
```

2. **Expected Indexes:**
   - ✅ `idx_products_category_status_archived`
   - ✅ `idx_products_brand_status_archived`
   - ✅ `idx_products_status_stock`
   - ✅ `idx_products_archived_status_category`
   - ✅ `idx_products_name`
   - ✅ `idx_products_sku` (unique)

### Expected Results:
- ✅ Fast query responses with filters
- ✅ Indexes are being used (no full table scans)
- ✅ Optimized query patterns reduce round trips

---

## 📊 Comprehensive Integration Test

### Full Workflow Test

**Scenario:** Complete product lifecycle with all Sprint 2 features

1. **Create Product**
   - Create product with auto-generated SKU
   - Set initial cost: ₦1,000, price: ₦1,500
   - Initial stock: 10 units
   - Assign category and brand

2. **Add Stock (Weighted Average Cost)**
   - Add 20 units @ ₦1,200
   - Verify cost updates to weighted average
   - Check `StockTransaction` created with type "PURCHASE"

3. **Sell Product (Transaction Logging)**
   - Go to POS
   - Sell 5 units
   - Verify `StockTransaction` created with type "SALE"
   - Verify stock decreased

4. **Create Reconciliation (Audit Trail)**
   - Create stock reconciliation
   - Physical count: 23 units (system count: 25, discrepancy: -2)
   - Approve reconciliation
   - Verify `StockTransaction` created with type "RECONCILIATION"

5. **Delete Category (Cascade Rules)**
   - Delete the product's category
   - Verify product still exists with NULL categoryId

6. **Verify Complete Audit Trail**
   - Check `StockTransaction` table
   - Verify all operations logged:
     - ✅ Initial creation
     - ✅ Stock addition
     - ✅ Sale
     - ✅ Reconciliation
   - Verify transaction history is chronological and complete

### Expected Final State:
- ✅ Product exists with updated cost (weighted average)
- ✅ All stock movements logged in audit trail
- ✅ No orphaned records after category deletion
- ✅ SKU is unique and properly formatted
- ✅ Price constraints enforced throughout

---

## 🐛 Error Handling Tests

### Test Invalid Operations

1. **Test Negative Price Entry**
   - Expected: Validation error

2. **Test Selling Below Cost**
   - Expected: Validation error

3. **Test Duplicate SKU**
   - Expected: 409 Conflict error

4. **Test Stock Addition with Invalid Supplier**
   - Expected: "Supplier not found" error

5. **Test Reconciliation Approval without Pending Status**
   - Expected: "Only pending reconciliations can be approved" error

### Expected Results:
- ✅ All invalid operations rejected gracefully
- ✅ Clear error messages returned
- ✅ No database corruption from failed operations

---

## 📈 Performance Benchmarks

### Expected Performance Metrics

**With 1,000 Products:**

| Operation | Expected Time | Notes |
|-----------|--------------|-------|
| Product listing (filtered) | < 300ms | Uses composite indexes |
| Low stock query | < 200ms | Optimized query |
| Stock addition | < 500ms | Includes transaction logging |
| Sale creation | < 600ms | Includes stock deduction + logging |
| Reconciliation approval | < 1s | Batch operations in transaction |

**With 10,000+ Products:**

| Operation | Expected Time | Notes |
|-----------|--------------|-------|
| Product listing (paginated) | < 500ms | Pagination + indexes |
| Low stock query | < 400ms | Index on stock fields |
| Complex filters | < 700ms | Composite indexes help |

---

## ✅ Testing Checklist

Use this checklist to verify all Sprint 2 implementations:

### Stock Transaction History
- [ ] Sales create transaction records
- [ ] Stock additions create transaction records
- [ ] Reconciliations create transaction records
- [ ] All transactions have correct type, quantity, and reference
- [ ] previousStock and newStock are accurate
- [ ] userId is captured correctly

### Weighted Average Cost
- [ ] Cost updates correctly on stock addition
- [ ] Weighted average formula is accurate
- [ ] Multiple additions calculate correctly
- [ ] Edge cases handled (zero stock, large differences)

### Price Validation
- [ ] Cannot create product with negative price
- [ ] Cannot create product with negative cost
- [ ] Cannot set selling price below cost price
- [ ] Database constraints exist in both DEV and PROD
- [ ] Form validation works correctly

### Cascade Rules
- [ ] Deleting category sets product.categoryId to NULL
- [ ] Deleting brand sets product.brandId to NULL
- [ ] Deleting supplier sets product.supplierId to NULL
- [ ] Products remain intact after deletions
- [ ] No orphaned records created

### SKU Uniqueness
- [ ] Auto-generated SKUs are unique
- [ ] Manual SKU duplicates rejected
- [ ] Retry logic works correctly
- [ ] Database unique constraint exists
- [ ] Error messages are clear

### Query Performance
- [ ] Composite indexes exist
- [ ] Filter queries are fast
- [ ] Low stock query optimized
- [ ] Stock additions use optimized queries
- [ ] No N+1 query problems

### Integration
- [ ] Complete product lifecycle works
- [ ] All audit trails captured
- [ ] No data integrity issues
- [ ] Error handling works correctly
- [ ] Performance is acceptable

---

## 🔍 Debugging Tips

### If Tests Fail:

1. **Check Database Schema**
```bash
npx prisma studio
# Verify tables, indexes, constraints exist
```

2. **Check Database Migrations**
```bash
npx prisma migrate status
# Ensure all migrations applied
```

3. **View Prisma Logs**
```bash
# In .env.local, add:
DEBUG="prisma:*"
# Restart dev server to see all queries
```

4. **Check Network Tab**
- Browser DevTools → Network
- Look for API errors
- Check response payloads

5. **Check Server Logs**
- Terminal running `npm run dev`
- Look for error messages
- Check transaction failures

---

## 📞 Support

If you encounter issues during testing:

1. Check error messages carefully
2. Verify database schema is up to date
3. Ensure all migrations applied
4. Check browser console for errors
5. Review server logs for API errors

---

## 🎉 Success Criteria

All tests pass when:

- ✅ Every stock change creates an audit record
- ✅ Weighted average cost calculations are accurate
- ✅ Price validation prevents invalid data
- ✅ Cascade rules prevent orphaned records
- ✅ SKU uniqueness is guaranteed
- ✅ Query performance is acceptable
- ✅ Complete product lifecycle works end-to-end
- ✅ Error handling is robust
- ✅ No data integrity issues

**If all checklist items are complete, Sprint 2 implementation is verified! ✅**
