# useEffect → TanStack Query Migration Task List

## Analysis Summary

- **Total Components Scanned**: 42 components
- **Components with useEffect API calls**: 18 components
- **Custom hooks with useEffect API calls**: 4 hooks
- **Total API call patterns found**: 23 patterns

## Migration Complexity Assessment

- **Simple migrations**: 8 patterns (1-2 hours each)
- **Medium complexity**: 10 patterns (2-4 hours each)
- **Complex migrations**: 5 patterns (4-8 hours each)

**Total Estimated Time**: 40-60 hours across 3 phases

---

## PHASE 1: Quick Wins (1-2 days) ✅ COMPLETED

**Phase 1 Summary:**

- ✅ All 3 tasks completed successfully
- ✅ 3 components migrated to TanStack Query
- ✅ Eliminated 6 useEffect hooks with manual API calls
- ✅ Reduced boilerplate code by ~25% across migrated components
- ✅ Added automatic caching, retry logic, and better error handling

### Task 1.1: Migrate `test-data/page.tsx`

**Priority**: High | **Effort**: 1-2 hours | **Risk**: Low

**Current Issue**:

- Manual loading/error state management
- Duplicate fetch logic for categories and brands
- Basic error handling

**Steps**:

1. [x] Replace manual state management with existing hooks
2. [x] Update component to use `useCategories()` and `useBrands()`
3. [x] Remove manual loading states
4. [x] Test component functionality

**Status**: ✅ COMPLETED

**Results**:

- Reduced component from 91 lines to 69 lines (24% reduction)
- Eliminated manual useEffect, useState for loading/error/data
- Now uses automatic caching, deduplication, and retry logic
- Better error handling with proper TypeScript types
- Maintained same debugging console.log statements

**Files to Modify**:

- `src/app/test-data/page.tsx`

**Current Pattern**:

```tsx
const [categories, setCategories] = useState([]);
const [brands, setBrands] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const categoriesRes = await fetch("/api/categories");
      const brandsRes = await fetch("/api/brands");
      // Process responses...
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

**Target Pattern**:

```tsx
import { useCategories, useBrands } from "@/hooks/api/categories";

const { data: categories, isLoading: categoriesLoading } = useCategories();
const { data: brands, isLoading: brandsLoading } = useBrands();
const loading = categoriesLoading || brandsLoading;
```

### Task 1.2: Migrate `add-product/useFormData.ts`

**Priority**: High | **Effort**: 1-2 hours | **Risk**: Low

**Current Issue**:

- Manual parallel fetching of form data
- Complex state management for loading states
- Error handling for each API call

**Steps**:

1. [x] Replace manual parallel fetching with existing hooks
2. [x] Use `useCategories()`, `useBrands()`, `useSuppliers()` hooks
3. [x] Simplify loading and error state management
4. [x] Update components using this hook
5. [x] Test form functionality

**Status**: ✅ COMPLETED (Already migrated)

**Results**:

- Found that `useFormDataQuery` was already implemented using TanStack Query
- Old `useFormData` hook was not being used in the codebase
- Updated the old hook to modern TanStack Query patterns for consistency
- Component already uses proper caching, deduplication, and error handling

**Files to Modify**:

- `src/components/inventory/add-product/useFormData.ts`
- `src/components/inventory/AddProductForm.tsx`

**Current Pattern**:

```tsx
useEffect(() => {
  const loadFormData = async () => {
    try {
      const [categoriesRes, brandsRes, suppliersRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/brands"),
        fetch("/api/suppliers"),
      ]);
      // Process each response manually...
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  };
  loadFormData();
}, []);
```

**Target Pattern**:

```tsx
import { useCategories, useBrands, useSuppliers } from "@/hooks/api/...";

const categories = useCategories();
const brands = useBrands();
const suppliers = useSuppliers();

const loading = categories.isLoading || brands.isLoading || suppliers.isLoading;
const error = categories.error || brands.error || suppliers.error;
```

### Task 1.3: Migrate `supplier/useSupplierData.ts`

**Priority**: High | **Effort**: 1-2 hours | **Risk**: Low

**Current Issue**:

- Manual conditional fetching
- Manual loading/error state management
- Dependent on modal open state

**Steps**:

1. [x] Replace manual fetch with existing `useSupplier()` hook
2. [x] Use `enabled` option for conditional fetching
3. [x] Remove manual state management
4. [x] Update components using this hook
5. [x] Test supplier detail functionality

**Status**: ✅ COMPLETED

**Results**:

- Migrated `useSupplierData` hook to use TanStack Query with conditional fetching
- Migrated `SupplierDetailModal` to use TanStack Query directly
- Reduced code from 72 lines to 50 lines in the hook (30% reduction)
- Eliminated manual useEffect, useState, and fetch logic
- Added automatic caching, retry logic, and better error handling
- Maintained backward compatibility with existing API

**Files to Modify**:

- `src/components/inventory/supplier/useSupplierData.ts`
- `src/components/inventory/SupplierDetailModal.tsx`

**Current Pattern**:

```tsx
useEffect(() => {
  if (isOpen && supplierId) {
    setLoading(true);
    setError(null);

    fetch(`/api/suppliers/${supplierId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch supplier");
        }
        return response.json();
      })
      .then((data) => {
        setSupplier(data.supplier);
      })
      .catch((error) => {
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }
}, [isOpen, supplierId]);
```

**Target Pattern**:

```tsx
import { useSupplier } from "@/hooks/api/suppliers";

const {
  data: supplier,
  isLoading: loading,
  error,
} = useSupplier(supplierId, {
  enabled: isOpen && !!supplierId,
});
```

---

## PHASE 2: Medium Complexity (3-5 days)

### Task 2.1: Migrate `EditStockAdjustmentForm.tsx`

**Priority**: Medium | **Effort**: 2-3 hours | **Risk**: Medium

**Current Issue**:

- Single dependent query based on adjustmentId
- Form integration with fetched data
- Manual error handling

**Steps**:

1. [x] Create `useStockAdjustment(id)` hook if not exists
2. [x] Replace manual fetch with TanStack Query
3. [x] Update form integration logic
4. [x] Test form population and submission
5. [x] Verify error handling

**Status**: ✅ COMPLETED

**Results**:

- Migrated to use existing `useStockAdjustment` hook from TanStack Query
- Eliminated manual useEffect with fetch logic
- Reduced component complexity by removing manual state management
- Added automatic caching, retry logic, and background refetching
- Improved error handling with better user feedback
- Form integration now uses useEffect pattern for proper timing

**Files to Modify**:

- `src/components/inventory/EditStockAdjustmentForm.tsx`
- `src/hooks/api/stock-management.ts` (if needed)

**Current Pattern**:

```tsx
useEffect(() => {
  const fetchAdjustment = async () => {
    try {
      const response = await fetch(`/api/stock-adjustments/${adjustmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stock adjustment");
      }
      const data = await response.json();
      setAdjustment(data);

      // Update form with fetched data
      form.reset({
        productId: data.product_id,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes || "",
      });
    } catch (error) {
      setError(error.message);
    }
  };
  fetchAdjustment();
}, [adjustmentId]);
```

### Task 2.2: Migrate Admin Authentication Guards

**Priority**: Medium | **Effort**: 2-3 hours | **Risk**: Medium

**Current Issue**:

- Repetitive authentication logic across admin components
- Manual session checking and redirects
- Inconsistent error handling

**Steps**:

1. [ ] Create `useAdminGuard()` hook for reusable admin protection
2. [ ] Migrate `DeactivatedUsersManagement.tsx`
3. [ ] Migrate `PendingUsersManagement.tsx`
4. [ ] Migrate `UserManagement.tsx`
5. [ ] Test all admin route protections

**Files to Modify**:

- `src/hooks/useAdminGuard.ts` (new file)
- `src/components/admin/DeactivatedUsersManagement.tsx`
- `src/components/admin/PendingUsersManagement.tsx`
- `src/components/admin/UserManagement.tsx`

**Current Pattern**:

```tsx
useEffect(() => {
  if (status === "loading") return;

  if (!session || session.user.role !== "ADMIN") {
    router.push("/unauthorized");
    return;
  }
}, [session, status, router]);
```

**Target Pattern**:

```tsx
// New hook
function useAdminGuard() {
  const { session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/unauthorized");
      return;
    }
  }, [session, status, router]);

  return {
    isAdmin: session?.user.role === "ADMIN",
    isLoading: status === "loading",
  };
}

// In components
const { isAdmin, isLoading } = useAdminGuard();
```

### Task 2.3: Create `useEditProductForm` Custom Hook

**Priority**: Medium | **Effort**: 3-4 hours | **Risk**: Medium

**Current Issue**:

- Multiple separate useEffect calls for related data
- Complex parallel loading states
- Form integration across multiple data sources

**Steps**:

1. [ ] Create `useEditProductForm(productId)` hook
2. [ ] Combine product, categories, brands, suppliers queries
3. [ ] Replace `useEditProductData.ts` hook
4. [ ] Update `EditProductFormOriginal.tsx`
5. [ ] Test form functionality and error states

**Files to Modify**:

- `src/hooks/useEditProductForm.ts` (new file)
- `src/components/inventory/edit-product/useEditProductData.ts`
- `src/components/inventory/EditProductFormOriginal.tsx`

**Current Pattern**:

```tsx
// Four separate useEffect hooks
useEffect(() => {
  const fetchProduct = async () => {
    const response = await fetch(`/api/products/${productId}`);
    // Process product data...
  };
  fetchProduct();
}, [productId]);

useEffect(() => {
  const fetchCategories = async () => {
    const response = await fetch("/api/categories");
    // Process categories...
  };
  fetchCategories();
}, []);

// Similar for brands and suppliers...
```

**Target Pattern**:

```tsx
function useEditProductForm(productId: string) {
  const product = useProduct(productId);
  const categories = useCategories();
  const brands = useBrands();
  const suppliers = useSuppliers();

  const isLoading =
    product.isLoading ||
    categories.isLoading ||
    brands.isLoading ||
    suppliers.isLoading;
  const error =
    product.error || categories.error || brands.error || suppliers.error;

  return {
    product: product.data,
    formData: {
      categories: categories.data || [],
      brands: brands.data || [],
      suppliers: suppliers.data || [],
    },
    isLoading,
    error,
  };
}
```

---

## PHASE 3: Complex Migrations (1-2 weeks)

### Task 3.1: Migrate `StockReconciliationDetail.tsx`

**Priority**: High | **Effort**: 4-6 hours | **Risk**: High

**Current Issue**:

- Complex state management with multiple actions
- Manual error handling with toast notifications
- Mutation handling for approve/reject actions

**Steps**:

1. [ ] Create `useStockReconciliation(id)` hook
2. [ ] Create mutation hooks for approve/reject actions
3. [ ] Replace manual state management
4. [ ] Update error handling with proper toast integration
5. [ ] Test all reconciliation actions
6. [ ] Verify cache invalidation after mutations

**Files to Modify**:

- `src/components/inventory/StockReconciliationDetail.tsx`
- `src/hooks/api/stock-management.ts`

**Current Pattern**:

```tsx
const fetchReconciliation = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(
      `/api/stock-reconciliations/${reconciliationId}`
    );
    const data = await response.json();

    if (response.ok) {
      setReconciliation(data.reconciliation);
    } else {
      toast.error(data.error || "Failed to fetch reconciliation details");
    }
  } catch (error) {
    console.error("Error fetching reconciliation:", error);
    toast.error("Failed to fetch reconciliation details");
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  fetchReconciliation();
}, [reconciliationId]);
```

### Task 3.2: Migrate `StockReconciliationDialog.tsx`

**Priority**: High | **Effort**: 4-6 hours | **Risk**: High

**Current Issue**:

- Search with debouncing functionality
- Complex mutation handling for creating reconciliations
- Multiple API calls with different loading states

**Steps**:

1. [ ] Create `useProductSearch(searchTerm)` hook with debouncing
2. [ ] Create `useCreateStockReconciliation` mutation hook
3. [ ] Replace manual search logic
4. [ ] Update mutation handling
5. [ ] Test search functionality and reconciliation creation
6. [ ] Verify cache invalidation after creation

**Files to Modify**:

- `src/components/inventory/StockReconciliationDialog.tsx`
- `src/hooks/api/stock-management.ts`
- `src/hooks/useProductSearch.ts` (new file)

**Current Pattern**:

```tsx
useEffect(() => {
  const loadProducts = async () => {
    if (searchTerm.trim()) {
      setLoadingProducts(true);
      try {
        const params = new URLSearchParams({
          search: searchTerm,
          limit: "50",
        });
        const response = await fetch(`/api/products?${params}`);
        // Process products...
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const debounceTimer = setTimeout(loadProducts, 300);
  return () => clearTimeout(debounceTimer);
}, [searchTerm]);
```

**Target Pattern**:

```tsx
function useProductSearch(searchTerm: string) {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  return useQuery({
    queryKey: ["products", "search", debouncedSearchTerm],
    queryFn: () => fetchProducts({ search: debouncedSearchTerm, limit: 50 }),
    enabled: !!debouncedSearchTerm.trim(),
  });
}
```

### Task 3.3: Migrate `pending-approval/page.tsx`

**Priority**: High | **Effort**: 6-8 hours | **Risk**: High

**Current Issue**:

- Complex session validation with multiple useEffect hooks
- Periodic user status checking
- Complex routing logic based on user status

**Steps**:

1. [ ] Create `useUserStatusValidation()` hook
2. [ ] Implement polling for user status updates
3. [ ] Replace multiple useEffect hooks with single hook
4. [ ] Update routing logic
5. [ ] Test user status flow and redirects
6. [ ] Verify periodic status checking

**Files to Modify**:

- `src/app/pending-approval/page.tsx`
- `src/hooks/useUserStatusValidation.ts` (new file)

**Current Pattern**:

```tsx
// Multiple useEffect hooks for session validation
useEffect(() => {
  if (session && !userStatus && !hasTriedRefresh) {
    setHasTriedRefresh(true);
    refreshUserStatus();
  }
}, [session, userStatus, hasTriedRefresh, refreshUserStatus]);

useEffect(() => {
  if (userStatus === "APPROVED") {
    router.push("/dashboard");
  }
}, [userStatus, router]);
```

### Task 3.4: Create Advanced Custom Hooks

**Priority**: Medium | **Effort**: 4-6 hours | **Risk**: Medium

**Current Issue**:

- Need reusable patterns for common complex scenarios
- Standardize error handling across components
- Optimize performance with proper caching

**Steps**:

1. [ ] Create `useDebounce` hook for search functionality
2. [ ] Create `useProductSearch` hook with debouncing
3. [ ] Create `useFormWithQuery` hook for form + query integration
4. [ ] Create `useAuthGuard` hook for route protection
5. [ ] Create `useToastMutations` hook for mutation + toast integration
6. [ ] Document all new hooks

**Files to Create**:

- `src/hooks/useDebounce.ts` (enhance existing)
- `src/hooks/useProductSearch.ts`
- `src/hooks/useFormWithQuery.ts`
- `src/hooks/useAuthGuard.ts`
- `src/hooks/useToastMutations.ts`

---

## PHASE 4: Cleanup and Optimization (1-2 days)

### Task 4.1: Remove Unused Code

**Priority**: Low | **Effort**: 2-3 hours | **Risk**: Low

**Steps**:

1. [ ] Remove old useEffect patterns from migrated components
2. [ ] Remove unused manual state management
3. [ ] Clean up unused imports
4. [ ] Remove old custom hooks that are no longer needed
5. [ ] Update TypeScript types if needed

### Task 4.2: Performance Optimization

**Priority**: Medium | **Effort**: 3-4 hours | **Risk**: Low

**Steps**:

1. [ ] Review and optimize query keys for better caching
2. [ ] Implement proper cache invalidation strategies
3. [ ] Add appropriate stale times for different data types
4. [ ] Optimize parallel queries where possible
5. [ ] Add proper loading state optimizations

### Task 4.3: Testing and Documentation

**Priority**: High | **Effort**: 4-6 hours | **Risk**: Low

**Steps**:

1. [ ] Update component tests for TanStack Query integration
2. [ ] Add integration tests for new custom hooks
3. [ ] Test error scenarios and edge cases
4. [ ] Document new patterns and hooks
5. [ ] Create migration guide for future similar changes

---

## Testing Strategy

### Pre-Migration Testing

- [ ] Create comprehensive test cases for current functionality
- [ ] Document current behavior and edge cases
- [ ] Set up monitoring for performance metrics

### During Migration Testing

- [ ] Test each component individually after migration
- [ ] Verify loading states, error states, and success states
- [ ] Test cache invalidation and data synchronization
- [ ] Verify no regressions in user flows

### Post-Migration Testing

- [ ] Run full integration test suite
- [ ] Performance testing to verify improvements
- [ ] User acceptance testing for critical flows
- [ ] Monitor production for any issues

---

## Risk Mitigation

### High-Risk Areas

1. **Authentication flows** - Critical for security
2. **Data mutations** - Risk of data corruption
3. **Complex state management** - Risk of UI inconsistencies

### Mitigation Strategies

1. **Feature flags** - Enable gradual rollout
2. **Rollback plan** - Keep old implementations temporarily
3. **Monitoring** - Track errors and performance
4. **Staging environment** - Test thoroughly before production

---

## Success Metrics

### Performance Improvements

- **API call reduction**: Target 40-50% fewer redundant calls
- **Cache hit rate**: Target 60-80% cache hits
- **Loading time**: Target 20-30% faster initial loads

### Developer Experience

- **Code reduction**: Target 200-300 lines of boilerplate removed
- **Bug reduction**: Target 50% fewer data fetching related bugs
- **Maintenance time**: Target 30% less time spent on data fetching issues

### User Experience

- **Faster interactions**: Immediate feedback with cached data
- **Better error handling**: Consistent error states across app
- **Improved reliability**: Better offline support and retry logic

---

## Estimated Timeline

- **Phase 1**: 2-3 days (Quick wins)
- **Phase 2**: 5-7 days (Medium complexity)
- **Phase 3**: 10-14 days (Complex migrations)
- **Phase 4**: 2-3 days (Cleanup and optimization)

**Total Estimated Time**: 19-27 days

## Next Steps

1. **Review and approve** this migration plan
2. **Choose starting phase** - Recommend starting with Phase 1
3. **Set up monitoring** for current performance baselines
4. **Create feature flags** for gradual rollout
5. **Begin Phase 1 Task 1.1** - Migrate `test-data/page.tsx`

---

_This migration plan converts 23 useEffect API call patterns to TanStack Query, improving performance, maintainability, and user experience across the application._
