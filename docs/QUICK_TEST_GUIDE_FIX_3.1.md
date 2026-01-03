# Quick Testing Guide - Fix 3.1: ProductStatus

**⏱️ Estimated Testing Time:** 15-20 minutes
**Priority:** High - Must test before pushing to GitHub

---

## 🚨 Critical Tests (Must Pass)

### 1. Build & Types ✅
```bash
npm run build
```
**Expected:** ✓ Compiled successfully (no TypeScript errors)

### 2. Product Creation
- Go to `/products/add`
- Check Status dropdown has **ONLY 3 options:**
  - ✅ Active
  - ✅ Inactive
  - ✅ Discontinued
- ❌ Should NOT have "Out of Stock"

### 3. Product Listing
- Go to `/products`
- Check Status filter dropdown has **ONLY 3 options**
- Verify all products show one of: Active, Inactive, or Discontinued
- ❌ No products should show "Out of Stock" badge

### 4. Product Editing
- Edit any product
- Verify Status dropdown has only 3 options
- Try changing status between Active/Inactive/Discontinued
- Save and verify it persists

### 5. POS System
- Go to `/pos`
- Search for products
- Verify no "OUT_OF_STOCK" status displayed
- Try completing a sale
- Verify stock decrements but status doesn't change to OUT_OF_STOCK

---

## 🔍 Important Tests (Should Pass)

### 6. Low Stock Alerts
- Go to `/products/low-stock`
- Find products with stock = 0
- **Verify:** They show as "Active" (not OUT_OF_STOCK)
- **Verify:** Stock shows 0 but status is separate

### 7. API Validation
Test in browser console or API client:
```javascript
// Try creating product with OUT_OF_STOCK (should fail)
fetch('/api/products', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'Test',
    sku: 'TEST-001',
    price: 1000,
    stock: 0,
    minStock: 5,
    status: 'OUT_OF_STOCK' // Should be rejected
  })
})
```
**Expected:** Validation error

### 8. Mobile View
- Test on mobile/responsive view
- Verify all forms work correctly
- Status dropdowns display properly

---

## ⚡ Quick Smoke Test (5 minutes)

Run these steps in order:

1. ✅ Build: `npm run build` → Success
2. ✅ Go to `/products/add` → Status has 3 options only
3. ✅ Go to `/products` → All statuses valid (no OUT_OF_STOCK)
4. ✅ Edit a product → Status dropdown works
5. ✅ Go to `/pos` → No OUT_OF_STOCK displayed

**If all 5 pass → Ready to commit!**

---

## 🗄️ Production Database Steps

**⚠️ Do this BEFORE deploying to production:**

```sql
-- 1. Check current statuses
SELECT status, COUNT(*) FROM products GROUP BY status;

-- 2. Update any OUT_OF_STOCK to ACTIVE
UPDATE products SET status = 'ACTIVE' WHERE status = 'OUT_OF_STOCK';

-- 3. Verify enum values (should show 3 only)
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'public."ProductStatus"'::regtype
ORDER BY enumlabel;

-- 4. If OUT_OF_STOCK still in enum, remove it:
ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');
ALTER TABLE products ALTER COLUMN status TYPE "ProductStatus" USING status::text::"ProductStatus";
DROP TYPE "ProductStatus_old";
```

---

## 📋 Pre-Commit Checklist

Before running `git commit`:

- [ ] ✅ Build succeeds
- [ ] ✅ Critical tests pass (Tests 1-5)
- [ ] ✅ Development DB updated
- [ ] ✅ No TypeScript errors
- [ ] ✅ Tested on both desktop and mobile views
- [ ] ⚠️ Production DB update SQL ready (don't run yet)

---

## 🚀 Git Commands

```bash
# 1. Check what changed
git status

# 2. Review changes
git diff

# 3. Add all changes
git add .

# 4. Commit with descriptive message
git commit -m "fix: remove OUT_OF_STOCK from ProductStatus enum (Sprint 3 Fix 3.1)

- Remove OUT_OF_STOCK from ProductStatus enum in schema
- Update ProductStatus to only include: ACTIVE, INACTIVE, DISCONTINUED
- Create product-status.ts utility for computed availability status
- Update all TypeScript types and interfaces
- Remove OUT_OF_STOCK from UI dropdowns and filters
- Fix status badge rendering throughout application

BREAKING CHANGE: OUT_OF_STOCK is no longer a valid ProductStatus.
Stock availability is now computed based on stock levels, not status."

# 5. Push to GitHub
git push origin dev
```

---

## 🐛 Troubleshooting

### Issue: Build fails with TypeScript errors
**Fix:** Search codebase for "OUT_OF_STOCK" and remove all references
```bash
grep -r "OUT_OF_STOCK" src/ --include="*.ts" --include="*.tsx"
```

### Issue: Database error on product creation
**Fix:** Ensure Prisma client is regenerated
```bash
npx prisma generate
```

### Issue: Status dropdown still shows OUT_OF_STOCK
**Fix:** Clear browser cache and restart dev server
```bash
# Stop server, then:
rm -rf .next
npm run dev
```

---

## ✅ Success Criteria

**All must be TRUE:**
- ✅ Build compiles without errors
- ✅ No "OUT_OF_STOCK" in any dropdown
- ✅ All products have valid status (ACTIVE/INACTIVE/DISCONTINUED)
- ✅ Product functionality works end-to-end
- ✅ Low stock alerts still work

**If ANY is FALSE → Do not commit/push**

---

## 📞 Support

**Issue found?** Document it in:
- `docs/SPRINT_3_FIX_3.1_TESTING_CHECKLIST.md` (full checklist)
- Or create GitHub issue

**Questions?** Review:
- [docs/PRODUCT_SCHEMA_FIXES.md](./PRODUCT_SCHEMA_FIXES.md) - Full implementation plan
- [src/lib/utils/product-status.ts](../src/lib/utils/product-status.ts) - New utility functions

---

**Document Version:** 1.0
**Last Updated:** January 3, 2026
**Estimated Time:** 15-20 minutes total testing
