# Sprint 3 - Fix 3.1: ProductStatus Testing Checklist

**Fix:** Remove OUT_OF_STOCK from ProductStatus enum and implement computed availability status
**Date:** January 3, 2026
**Status:** Ready for Testing

---

## 🎯 What Changed

### Schema Changes
- ✅ Removed `OUT_OF_STOCK` from ProductStatus enum
- ✅ ProductStatus now only has: `ACTIVE`, `INACTIVE`, `DISCONTINUED`
- ✅ Created new utility functions for computed availability status

### Code Changes
- ✅ Created `src/lib/utils/product-status.ts` with utility functions
- ✅ Updated all TypeScript types and interfaces
- ✅ Removed OUT_OF_STOCK from UI dropdowns
- ✅ Fixed status badge rendering throughout the app

---

## 📝 Pre-Testing Checklist

### Production Database Update Steps
**⚠️ IMPORTANT: Run these steps MANUALLY on production database**

1. **Connect to production database** (use credentials from `.env.production`)

2. **Check current product statuses:**
   ```sql
   SELECT status, COUNT(*) as count
   FROM products
   GROUP BY status
   ORDER BY status;
   ```

3. **Update any OUT_OF_STOCK products to ACTIVE:**
   ```sql
   UPDATE products
   SET status = 'ACTIVE'
   WHERE status = 'OUT_OF_STOCK';
   ```

4. **Verify ProductStatus enum values:**
   ```sql
   SELECT enumlabel
   FROM pg_enum
   WHERE enumtypid = 'public."ProductStatus"'::regtype
   ORDER BY enumlabel;
   ```
   Expected: `ACTIVE`, `DISCONTINUED`, `INACTIVE` (3 values only)

5. **If OUT_OF_STOCK still exists in enum, remove it:**
   ```sql
   -- Only run if OUT_OF_STOCK appears in step 4
   ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
   CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');
   ALTER TABLE products ALTER COLUMN status TYPE "ProductStatus" USING status::text::"ProductStatus";
   DROP TYPE "ProductStatus_old";
   ```

### Database Verification
- [ ] **Development DB updated** (should already be done via `npx prisma db push`)
- [ ] **Production DB updated** (manual steps above completed)
- [ ] **No products have OUT_OF_STOCK status**
- [ ] **ProductStatus enum has exactly 3 values**

### Build Verification
- [ ] **Build succeeds without errors**
  ```bash
  npm run build
  ```
  Expected: ✓ Compiled successfully

- [ ] **TypeScript has no errors**
  - No "OUT_OF_STOCK" type errors
  - All imports resolve correctly

---

## 🧪 Testing Scenarios

### 1. Product Creation (Add Product Form)

**Test Case 1.1: Status Dropdown Options**
- [ ] Navigate to: `/products/add`
- [ ] Click on "Status" dropdown
- [ ] **Verify**: Only 3 options appear:
  - ✓ Active (green badge)
  - ✓ Inactive (gray badge)
  - ✓ Discontinued (gray badge)
- [ ] **Verify**: NO "Out of Stock" option appears

**Test Case 1.2: Create Active Product with Stock**
- [ ] Fill in product details:
  - Name: "Test Product Active"
  - SKU: Auto-generated
  - Price: ₦5,000
  - Stock: 50
  - Min Stock: 10
  - **Status: ACTIVE**
- [ ] Click "Add Product"
- [ ] **Verify**: Product created successfully
- [ ] **Verify**: Status shows as "Active" (green badge)

**Test Case 1.3: Create Active Product with Zero Stock**
- [ ] Create product with:
  - Name: "Test Product Zero Stock"
  - Stock: 0
  - Min Stock: 5
  - **Status: ACTIVE**
- [ ] **Verify**: Product created successfully
- [ ] **Verify**: Status shows as "Active" but stock shows 0

---

### 2. Product Listing (Product List View)

**Test Case 2.1: Status Filter Dropdown**
- [ ] Navigate to: `/products`
- [ ] Click "Status" filter dropdown
- [ ] **Verify**: Only 3 filter options:
  - ✓ Active
  - ✓ Inactive
  - ✓ Discontinued
- [ ] **Verify**: NO "Out of Stock" filter option

**Test Case 2.2: Product Status Display**
- [ ] View products in list
- [ ] **Verify**: Each product shows one of:
  - Active (green badge)
  - Inactive (gray badge)
  - Discontinued (gray badge)
- [ ] **Verify**: NO products show "Out of Stock" status badge

**Test Case 2.3: Stock Status Display**
- [ ] Find a product with stock = 0
- [ ] **Verify**: Product status shows "Active" (or Inactive/Discontinued)
- [ ] **Verify**: Stock column shows "0" or "Out of Stock" indicator
- [ ] **Verify**: Status and stock are displayed separately

**Test Case 2.4: Low Stock Indicators**
- [ ] Find a product with stock ≤ minStock
- [ ] **Verify**: Shows low stock indicator/warning
- [ ] **Verify**: Product status is still "Active" (not "Out of Stock")

---

### 3. Product Editing (Edit Product Form)

**Test Case 3.1: Edit Product Status**
- [ ] Navigate to edit any product
- [ ] Click "Status" dropdown
- [ ] **Verify**: Only 3 options available
- [ ] Change status to "Inactive"
- [ ] Save changes
- [ ] **Verify**: Status updates successfully

**Test Case 3.2: Edit Product Stock**
- [ ] Edit a product
- [ ] Change stock from 100 to 0
- [ ] **Verify**: Status field remains unchanged
- [ ] **Verify**: Can save with stock = 0 and status = "Active"

---

### 4. POS System (Point of Sale)

**Test Case 4.1: Product Search**
- [ ] Navigate to: `/pos`
- [ ] Search for products
- [ ] **Verify**: Products with all statuses appear correctly
- [ ] **Verify**: No "OUT_OF_STOCK" status displayed

**Test Case 4.2: Add Product with Zero Stock to Cart**
- [ ] Search for a product with stock = 0
- [ ] Try to add to cart
- [ ] **Verify**: Appropriate error message (if stock validation exists)
- [ ] **Verify**: Error mentions stock level, not product status

**Test Case 4.3: Complete Sale**
- [ ] Add product with stock > 0 to cart
- [ ] Complete transaction
- [ ] **Verify**: Stock decrements correctly
- [ ] **Verify**: Product status remains "Active" (doesn't change to OUT_OF_STOCK)

**Test Case 4.4: Sale Reduces Stock to Zero**
- [ ] Find product with stock = 5
- [ ] Sell all 5 units
- [ ] **Verify**: Stock becomes 0
- [ ] **Verify**: Status remains "Active"
- [ ] **Verify**: Product appears in low stock alerts

---

### 5. Low Stock Alerts

**Test Case 5.1: Low Stock Report**
- [ ] Navigate to: `/products/low-stock`
- [ ] **Verify**: Shows products where stock ≤ minStock
- [ ] **Verify**: Products have status "Active" (not OUT_OF_STOCK)
- [ ] **Verify**: Stock levels are displayed correctly

**Test Case 5.2: Out of Stock Products**
- [ ] Find products with stock = 0 in low stock report
- [ ] **Verify**: Displayed with appropriate indicator
- [ ] **Verify**: Status shows "Active" or actual status
- [ ] **Verify**: Clear distinction between status and stock availability

---

### 6. Product Reports & Analytics

**Test Case 6.1: Product Reports**
- [ ] Navigate to reports section
- [ ] Generate product report
- [ ] **Verify**: Status column shows only: Active, Inactive, Discontinued
- [ ] **Verify**: Stock availability calculated correctly

**Test Case 6.2: Inventory Value**
- [ ] Check inventory value calculations
- [ ] **Verify**: Products with stock = 0 handled correctly
- [ ] **Verify**: Status doesn't affect value calculation (only stock does)

---

### 7. Mobile Views

**Test Case 7.1: Mobile Product List**
- [ ] Open app on mobile/responsive view
- [ ] Navigate to products
- [ ] **Verify**: Status badges display correctly
- [ ] **Verify**: No OUT_OF_STOCK status

**Test Case 7.2: Mobile Product Add/Edit**
- [ ] Try adding/editing product on mobile
- [ ] **Verify**: Status dropdown works correctly
- [ ] **Verify**: Only 3 status options available

---

### 8. API Testing

**Test Case 8.1: GET /api/products**
- [ ] Test API endpoint: `GET /api/products`
- [ ] **Verify**: Response includes only valid statuses
- [ ] **Verify**: No products have `status: "OUT_OF_STOCK"`

**Test Case 8.2: POST /api/products**
- [ ] Try creating product via API with `status: "OUT_OF_STOCK"`
- [ ] **Verify**: Request fails with validation error
- [ ] **Verify**: Error message indicates invalid status

**Test Case 8.3: PUT /api/products/:id**
- [ ] Try updating product status to "OUT_OF_STOCK"
- [ ] **Verify**: Request fails with validation error

**Test Case 8.4: GET /api/products/low-stock**
- [ ] Test low stock endpoint
- [ ] **Verify**: Returns products correctly
- [ ] **Verify**: Status field has valid values only

---

### 9. Data Migration Verification

**Test Case 9.1: Historical Data**
- [ ] Query old products in database
- [ ] **Verify**: No products have OUT_OF_STOCK status
- [ ] **Verify**: All products have valid status (ACTIVE, INACTIVE, or DISCONTINUED)

**Test Case 9.2: Sales History**
- [ ] Check old sales transactions
- [ ] **Verify**: Product references are still valid
- [ ] **Verify**: No broken references due to status change

---

### 10. Edge Cases

**Test Case 10.1: Bulk Operations**
- [ ] Try bulk status update
- [ ] **Verify**: Cannot set multiple products to OUT_OF_STOCK
- [ ] **Verify**: Valid statuses work correctly

**Test Case 10.2: Search and Filter**
- [ ] Search for products by status
- [ ] Filter by each status
- [ ] **Verify**: All filters work correctly
- [ ] **Verify**: No OUT_OF_STOCK filter option

**Test Case 10.3: Product Import**
- [ ] If import feature exists, try importing products
- [ ] **Verify**: Products with OUT_OF_STOCK status are rejected or converted

---

## 🔍 Computed Availability Status Testing

### Test Availability Status Calculation

**Test Case 11.1: IN_STOCK Status**
- [ ] Product: status = ACTIVE, stock = 50, minStock = 10
- [ ] **Expected**: Availability = "IN_STOCK"

**Test Case 11.2: LOW_STOCK Status**
- [ ] Product: status = ACTIVE, stock = 5, minStock = 10
- [ ] **Expected**: Availability = "LOW_STOCK"

**Test Case 11.3: OUT_OF_STOCK Status**
- [ ] Product: status = ACTIVE, stock = 0, minStock = 10
- [ ] **Expected**: Availability = "OUT_OF_STOCK" (computed, not from DB)

**Test Case 11.4: INACTIVE Status**
- [ ] Product: status = INACTIVE, stock = 50
- [ ] **Expected**: Availability = "INACTIVE"

**Test Case 11.5: DISCONTINUED Status**
- [ ] Product: status = DISCONTINUED, stock = 50
- [ ] **Expected**: Availability = "DISCONTINUED"

**Test Case 11.6: Service Products**
- [ ] Product: isService = true, stock = 0
- [ ] **Expected**: Availability = "IN_STOCK" (services ignore stock)

---

## ✅ Acceptance Criteria

### Must Pass (Critical)
- [ ] Build compiles without errors
- [ ] No TypeScript errors related to OUT_OF_STOCK
- [ ] Cannot create/update products with OUT_OF_STOCK status
- [ ] All existing products have valid status (ACTIVE, INACTIVE, DISCONTINUED)
- [ ] Product status and stock availability are clearly separated in UI
- [ ] Low stock functionality works correctly

### Should Pass (Important)
- [ ] All UI dropdowns show only 3 status options
- [ ] Status badges display correctly throughout the app
- [ ] Mobile views work correctly
- [ ] API validation works for status field
- [ ] Reports and analytics handle new status correctly

### Nice to Have (Optional)
- [ ] Availability status utility functions work correctly
- [ ] Stock indicators are intuitive and clear
- [ ] Performance is not negatively impacted

---

## 🐛 Known Issues & Notes

### Post-Testing Notes
*Document any issues found during testing here:*

- Issue #1:
- Issue #2:
- Issue #3:

### Rollback Plan
If critical issues are found:
1. Revert schema changes: Add OUT_OF_STOCK back to enum
2. Revert code changes: Git revert commits
3. Redeploy previous version
4. Run database migration to restore OUT_OF_STOCK

---

## 📊 Testing Summary

**Tester:** _______________
**Date:** _______________
**Environment:** [ ] Development [ ] Staging [ ] Production

**Total Test Cases:** 50+
**Passed:** ___ / ___
**Failed:** ___ / ___
**Blocked:** ___ / ___

**Overall Status:** [ ] ✅ PASS [ ] ❌ FAIL [ ] ⚠️ PARTIAL

**Ready for Production:** [ ] YES [ ] NO

**Tester Signature:** _______________

---

## 🚀 Deployment Checklist

After all tests pass:

- [ ] Run final build: `npm run build`
- [ ] Run tests: `npm run test`
- [ ] Commit changes with message: "fix: remove OUT_OF_STOCK from ProductStatus enum (Sprint 3 - Fix 3.1)"
- [ ] Push to GitHub: `git push origin dev`
- [ ] Create pull request to main
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Monitor for errors in production logs

---

**Document Version:** 1.0
**Last Updated:** January 3, 2026
**Related Issue:** Sprint 3 - Fix 3.1: ProductStatus vs Stock Inconsistency
