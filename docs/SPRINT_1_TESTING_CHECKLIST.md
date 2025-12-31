# Sprint 1 - Testing Checklist

**Purpose:** Verify all Sprint 1 changes are working correctly in your application
**Estimated Time:** 20-30 minutes
**Environment:** Test on DEV first, then PRODUCTION

---

## 🎯 Critical Tests (Must Pass)

### 1. Stock Constraint Tests (Sprint 1.2)

#### Test 1.1: Cannot Create Product with Negative Stock
**Steps:**
1. Navigate to **Inventory → Products → Add New Product**
2. Fill in product details:
   - Name: "Test Product"
   - SKU: Auto-generated or custom
   - Category: Select any
   - Cost: ₦1000
   - Price: ₦1500
   - **Stock: -10** ❌ (negative value)
   - Min Stock: 5
3. Click **Save**

**Expected Result:**
- ❌ Product creation should **FAIL**
- Error message: "Stock must be non-negative" or database constraint error
- Product should NOT be created

**If it passes:** ✅ Stock constraint is working

---

#### Test 1.2: Cannot Sell More Than Available Stock
**Steps:**
1. Go to **POS (Point of Sale)**
2. Find or create a product with low stock (e.g., stock = 5)
3. Add product to cart with quantity = **10** (more than available)
4. Try to complete the sale

**Expected Result:**
- ❌ Sale should **FAIL** before payment
- Error message: "Insufficient stock for [Product Name]. Available: 5, Requested: 10"
- Stock should remain unchanged
- No transaction created

**If it passes:** ✅ Stock validation is working

---

#### Test 1.3: Service Products Don't Require Stock
**Steps:**
1. Create a product marked as **Service** (isService = true)
   - Or find existing service product
2. Set stock to **0**
3. Go to **POS**
4. Add service product to cart with any quantity
5. Complete the sale

**Expected Result:**
- ✅ Sale should **SUCCEED**
- Service sold successfully
- Stock remains at 0 (not decremented)
- Transaction created normally

**If it passes:** ✅ Service handling is working

---

### 2. ProductVariant Removal Tests (Sprint 1.1)

#### Test 2.1: Product Sales Work Without Variants
**Steps:**
1. Go to **POS**
2. Add any product to cart
3. Complete the sale successfully
4. Check the transaction details

**Expected Result:**
- ✅ Sale completes normally
- Transaction shows product_id (not variant_id)
- Stock is decremented correctly
- No variant-related errors

**If it passes:** ✅ Variant removal successful

---

#### Test 2.2: Top Products Analytics Work
**Steps:**
1. Navigate to **Dashboard**
2. View the **Top Products** section
3. Check if products display correctly

**Expected Result:**
- ✅ Top products show up
- Product names visible
- Sales quantities correct
- No "Unknown Product" entries
- No console errors

**If it passes:** ✅ Analytics working correctly

---

#### Test 2.3: Product Analytics Overview
**Steps:**
1. Go to **POS → Analytics** (or Dashboard Analytics)
2. View analytics overview page
3. Check top products section

**Expected Result:**
- ✅ Analytics load successfully
- Top products display with correct data
- Revenue calculations correct
- No TypeScript errors in console

**If it passes:** ✅ Analytics integration working

---

### 3. Low Stock Query Optimization Tests (Sprint 1.3)

#### Test 3.1: Low Stock Page Loads Quickly
**Steps:**
1. Navigate to **Inventory → Low Stock** (or similar page)
2. Observe page load time
3. Try searching for a product
4. Try pagination (next/previous pages)

**Expected Result:**
- ✅ Page loads in **< 1 second** (even with many products)
- Search results appear instantly
- Pagination works smoothly
- No "Out of Memory" errors
- Metrics (total value, critical stock) display correctly

**Performance Check:**
- With 100 products: < 200ms
- With 1,000 products: < 500ms
- With 10,000 products: < 1 second

**If it passes:** ✅ Query optimization working

---

#### Test 3.2: Low Stock Filtering Accuracy
**Steps:**
1. Go to **Inventory → Low Stock**
2. Check which products appear
3. Verify each product has: `stock <= minStock` OR `stock = 0`
4. Try the search feature with product name or SKU

**Expected Result:**
- ✅ Only low stock products appear
- Products with `stock > minStock` do NOT appear
- Search filters correctly
- Metrics accurate (critical stock count, low stock count)

**If it passes:** ✅ Database filtering working correctly

---

### 4. WordPress Integration Tests (Sprint 1.4)

#### Test 4.1: WordPress ID Fields Exist
**Steps:**
1. Go to **Inventory → Products → Edit any product**
2. Check if you can see/edit `wordpress_id` field
3. Go to **Categories → Edit any category**
4. Check if you can see/edit `wordpress_id` field

**Expected Result:**
- ✅ wordpress_id field is **PRESENT** and editable
- Can save products/categories with wordpress_id
- No errors when updating

**If it passes:** ✅ WordPress integration preserved correctly

---

## 📊 Data Integrity Tests

### Test 5: Stock Reconciliation Still Works

**Steps:**
1. Navigate to **Inventory → Stock Reconciliation**
2. Create a new reconciliation
3. Add products and adjust physical counts
4. Submit and approve reconciliation

**Expected Result:**
- ✅ Reconciliation creates successfully
- Stock updates correctly
- No variant-related errors

---

### Test 6: Product Creation Complete Flow

**Steps:**
1. Go to **Inventory → Products → Add New**
2. Fill ALL fields:
   - Name, Description, SKU
   - Category, Brand, Supplier
   - Cost: ₦1000, Price: ₦1500
   - Stock: 50, Min Stock: 10
   - Tags, Images (optional)
   - wordpress_id (optional)
3. Save product

**Expected Result:**
- ✅ Product created successfully
- All fields saved correctly
- Stock set to 50
- No variant-related fields shown
- Can edit product after creation

---

### Test 7: Sales Transaction Full Flow

**Steps:**
1. Go to **POS**
2. Add 3 different products to cart
3. Apply discount (if available)
4. Apply coupon (if available)
5. Select customer
6. Complete payment

**Expected Result:**
- ✅ Sale completes successfully
- Stock decremented for each product
- Transaction shows correct totals
- Receipt generated correctly
- Can view transaction history

---

## 🔍 Edge Cases to Test

### Test 8: Multiple Simultaneous Sales

**Steps:**
1. Open POS in **two browser tabs**
2. In both tabs, add same product (stock = 10) with quantity = 6
3. Try to complete both sales at same time

**Expected Result:**
- ✅ First sale succeeds (stock = 4)
- ❌ Second sale fails with insufficient stock error
- No negative stock created
- Data integrity maintained

---

### Test 9: Boundary Stock Values

**Steps:**
Test products with these stock values:
- Stock = 0, Min Stock = 5
- Stock = 5, Min Stock = 5 (exactly at threshold)
- Stock = 6, Min Stock = 5 (just above threshold)

**Expected Results:**
- Stock = 0: Appears in low stock ✅
- Stock = 5: Appears in low stock ✅
- Stock = 6: Does NOT appear in low stock ❌

---

### Test 10: Product Update Preserves Data

**Steps:**
1. Edit an existing product
2. Change only the name
3. Save

**Expected Result:**
- ✅ Only name updated
- Stock unchanged
- Min Stock unchanged
- wordpress_id unchanged (if it existed)
- No data loss

---

## 🚨 Console Error Checks

### Test 11: Check Browser Console

**During ALL tests above, monitor browser console for:**

**Should NOT see:**
- ❌ "ProductVariant is not defined"
- ❌ "hasVariants is not defined"
- ❌ "variant_id" related errors
- ❌ "Cannot read property of null" (for product_id)
- ❌ TypeScript errors
- ❌ Failed API calls (500 errors)

**OK to see:**
- ⚠️ Linter warnings (expected)
- ℹ️ Info messages

---

## 📱 Mobile/Responsive Tests

### Test 12: Mobile POS

**Steps:**
1. Access app on mobile device or resize browser to mobile view
2. Go to POS
3. Create a sale with 2-3 products
4. Complete payment

**Expected Result:**
- ✅ UI works on mobile
- All functionality accessible
- No layout issues

---

## 🎯 Performance Tests

### Test 13: Large Product List

**Steps:**
1. Go to **Inventory → Products**
2. If you have 100+ products, scroll through list
3. Use search feature
4. Use filters (category, brand, status)

**Expected Result:**
- ✅ List loads quickly
- Search is responsive
- Filters work correctly
- No lag or freezing

---

### Test 14: Dashboard Analytics Load Time

**Steps:**
1. Navigate to **Dashboard**
2. Note load time
3. Check all widgets load

**Expected Result:**
- ✅ Dashboard loads in < 2 seconds
- All analytics widgets populate
- Charts render correctly
- No "Loading..." stuck states

---

## 📋 Test Results Template

Use this template to track your testing:

```markdown
# Sprint 1 Testing Results

**Date:** _____________
**Environment:** DEV / PRODUCTION
**Tester:** _____________

## Critical Tests
- [ ] Test 1.1: Negative stock blocked
- [ ] Test 1.2: Overselling prevented
- [ ] Test 1.3: Services work without stock
- [ ] Test 2.1: Sales work without variants
- [ ] Test 2.2: Top products analytics
- [ ] Test 2.3: Analytics overview
- [ ] Test 3.1: Low stock loads quickly
- [ ] Test 3.2: Low stock filtering accurate
- [ ] Test 4.1: WordPress ID fields present

## Data Integrity Tests
- [ ] Test 5: Stock reconciliation works
- [ ] Test 6: Product creation complete
- [ ] Test 7: Sales transaction complete

## Edge Cases
- [ ] Test 8: Simultaneous sales handled
- [ ] Test 9: Boundary values correct
- [ ] Test 10: Updates preserve data

## Console & Performance
- [ ] Test 11: No console errors
- [ ] Test 12: Mobile functionality works
- [ ] Test 13: Large lists perform well
- [ ] Test 14: Dashboard loads quickly

## Overall Result
- [ ] All tests passed ✅
- [ ] Some tests failed ❌ (list failures below)

**Failures:**
_List any failed tests and details here_

**Notes:**
_Additional observations_
```

---

## 🔧 If Tests Fail

### Common Issues and Fixes

**Issue: Stock constraint not blocking negative values**
- Check if migration was applied: Run migration script
- Verify constraint exists: Check database

**Issue: Overselling still possible**
- Check stock validation code in create-sale route
- Verify transaction logic is using validated code

**Issue: "ProductVariant not defined" errors**
- Clear browser cache
- Run `npm run build` again
- Restart dev server

**Issue: Low stock page slow**
- Verify raw SQL queries being used
- Check database indexes
- Monitor network tab for API response time

**Issue: WordPress fields missing**
- Verify migration was NOT applied
- Check Prisma schema has wordpress_id fields
- Regenerate Prisma client

---

## ✅ Success Criteria

**Sprint 1 is fully verified when:**

1. ✅ All 14 tests pass
2. ✅ No console errors during testing
3. ✅ Stock constraints work (negative stock blocked, overselling prevented)
4. ✅ Sales work normally without variants
5. ✅ Low stock page loads quickly (< 1 second)
6. ✅ WordPress integration intact (fields present)
7. ✅ Analytics display correctly
8. ✅ No data integrity issues
9. ✅ Mobile functionality works
10. ✅ Performance is acceptable

**When all pass:** 🎉 Sprint 1 is VERIFIED and PRODUCTION READY!

---

## 🚀 Production Testing Notes

**Before deploying to production:**
1. Run ALL tests on DEV environment first
2. Create production backup
3. Apply migrations during low-traffic period
4. Test critical flows immediately after deployment
5. Monitor error logs for 24 hours

**Recommended test sequence for PRODUCTION:**
1. Test 1.2 (overselling prevention) - CRITICAL
2. Test 2.1 (sales work) - CRITICAL
3. Test 3.1 (low stock performance) - CRITICAL
4. Test 7 (full sales flow) - CRITICAL
5. Monitor for 1 hour, check error logs

---

**Generated:** December 30, 2025
**Sprint:** 1 (Final Verification)
**Status:** Ready for Testing ✅
