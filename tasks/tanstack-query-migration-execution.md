# Tan## Migration Status: 🚀 PHASE 2 IN PROGRESS

### Phase 1: Setup and Foundation (COMPLETED ✅)

- [x] Install TanStack Query packages
- [x] Configure QueryClient with optimal settings
- [x] Set up QueryClient Provider in app layout
- [x] Create base query and mutation hooks structure
- [x] Set up development tools
- [x] Migrate first three simple components

### Phase 2: Simple Data Fetching Migrations (CURRENT 🔄)

#### Simple Components ✅

- [x] Migrate `InventoryMetrics.tsx` (Mock data → TanStack Query)
- [x] Migrate `InventoryCharts.tsx` (Mock data → TanStack Query)
- [x] Migrate `RecentActivity.tsx` (Basic fetch pattern)

#### CRUD List Components ✅

- [x] Create `/src/hooks/api/brands.ts` with query/mutation hooks
- [x] Migrate `BrandList.tsx` (Standard CRUD with pagination + delete mutation)
  - ✅ Replaced useEffect with `useBrands` query hook
  - ✅ Replaced manual delete fetch with `useDeleteBrand` mutation
  - ✅ Fixed snake_case vs camelCase property naming
  - ✅ Implemented proper loading states with `isLoading`
  - ✅ Removed manual state management for brands, pagination
  - ✅ Component compiles without errors

#### Next Steps 🔄

- [ ] Test migrated components in browser
- [ ] Create API endpoints for real data (if not exist)

### Phase 3: Complex List Components (NEXT)

- [ ] Migrate `ProductList.tsx` (Complex filtering and pagination)
  - ⚠️ **Known Issue**: Type mismatches between API and hook interfaces
  - 📝 **Action**: Fix snake_case vs camelCase property alignment
- [ ] Migrate `SupplierList.tsx` (Authentication-dependent queries)
- [ ] Migrate `CategoryList.tsx` (Similar pattern to BrandList)

## Migration Execution Plan

## Overview

This document outlines the step-by-step execution plan for migrating from useEffect API calls to TanStack Query across the inventory POS application.

## Migration Status: 🚀 IN PROGRESS

### Phase 1: Setup and Foundation (CURRENT)

- [ ] Install TanStack Query packages
- [ ] Configure QueryClient with optimal settings
- [ ] Set up QueryClient Provider in app layout
- [ ] Create base query and mutation hooks structure
- [ ] Set up development tools

### Phase 2: Simple Data Fetching Migrations (NEXT)

- [ ] Migrate `InventoryMetrics.tsx` (Mock data → Real API)
- [ ] Migrate `InventoryCharts.tsx` (Mock data → Real API)
- [ ] Migrate `RecentActivity.tsx` (Basic fetch pattern)
- [ ] Create reusable query hooks for simple patterns

### Phase 3: Complex List Components

- [ ] Migrate `ProductList.tsx` (Complex filtering and pagination)
- [ ] Migrate `SupplierList.tsx` (Authentication-dependent queries)
- [ ] Migrate `BrandList.tsx` (Standard CRUD with pagination)
- [ ] Migrate `CategoryList.tsx` (Similar pattern to BrandList)

### Phase 4: Form Components with Dependent Queries

- [ ] Migrate `AddProductForm.tsx` (Brand/Category dropdowns)
- [ ] Migrate `AddStockAdjustmentForm.tsx` (Product selection dependency)
- [ ] Migrate `AddStockDialog.tsx` (Supplier dropdown)
- [ ] Migrate `EditProductFormOriginal.tsx` (Edit form with dependencies)

### Phase 5: Admin and User Management

- [ ] Migrate `UserManagement.tsx` (User CRUD operations)
- [ ] Migrate `PendingUsersManagement.tsx` (Complex state management)
- [ ] Migrate `DeactivatedUsersManagement.tsx` (Filtered user lists)

### Phase 6: Session and Authentication

- [ ] Migrate `useSessionManagement.ts` custom hook
- [ ] Migrate `SessionProvider.tsx` (Complex session state)
- [ ] Update authentication-dependent queries

### Phase 7: Cleanup and Optimization

- [ ] Remove unused useState/useEffect patterns
- [ ] Optimize query keys and cache invalidation
- [ ] Add comprehensive error boundaries
- [ ] Performance testing and optimization

## Component Migration Details

### 🎯 CURRENT TARGET: Phase 1 Setup

#### 1. Package Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

#### 2. QueryClient Configuration

File: `src/lib/query-client.ts`

```tsx
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("401")) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error("Mutation error:", error);
      },
    },
  },
});
```

#### 3. Provider Setup

File: `src/app/layout.tsx` (Add QueryClient provider)

#### 4. Base Hook Structure

Files to create:

- `src/hooks/api/products.ts`
- `src/hooks/api/suppliers.ts`
- `src/hooks/api/brands.ts`
- `src/hooks/api/categories.ts`
- `src/hooks/api/inventory.ts`
- `src/hooks/api/users.ts`

## Priority Components for Migration

### High Priority (User-facing, high usage)

1. **ProductList.tsx** - Core inventory functionality
2. **SupplierList.tsx** - Critical business operations
3. **BrandList.tsx** - Frequently used component
4. **InventoryMetrics.tsx** - Dashboard key metrics

### Medium Priority (Admin features, moderate usage)

1. **UserManagement.tsx** - Admin functionality
2. **CategoryList.tsx** - Content management
3. **StockAdjustmentList.tsx** - Inventory operations
4. **AddProductForm.tsx** - Data entry forms

### Lower Priority (Specialized features)

1. **RecentActivity.tsx** - Dashboard widget
2. **InventoryCharts.tsx** - Analytics component
3. **SessionProvider.tsx** - Infrastructure (requires careful testing)

## Migration Patterns

### Pattern 1: Simple Data Fetching

```tsx
// BEFORE
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/endpoint");
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

// AFTER
const { data, isLoading, error } = useQuery({
  queryKey: ["endpoint"],
  queryFn: () => fetch("/api/endpoint").then((res) => res.json()),
});
```

### Pattern 2: Filtered/Paginated Lists

```tsx
// BEFORE
const fetchItems = useCallback(async () => {
  // Complex fetch logic with filters/pagination
}, [filters, pagination]);

useEffect(() => {
  fetchItems();
}, [fetchItems]);

// AFTER
const { data, isLoading, error } = useQuery({
  queryKey: ["items", filters, pagination],
  queryFn: ({ queryKey }) => fetchItemsWithParams(queryKey[1], queryKey[2]),
});
```

### Pattern 3: Dependent Queries

```tsx
// BEFORE
useEffect(() => {
  if (selectedId) {
    fetchDetails(selectedId);
  }
}, [selectedId]);

// AFTER
const { data: details } = useQuery({
  queryKey: ["details", selectedId],
  queryFn: () => fetchDetails(selectedId),
  enabled: !!selectedId,
});
```

## Testing Strategy

### 1. Component Testing

- Test loading states
- Test error handling
- Test data rendering
- Test cache behavior

### 2. Integration Testing

- Test API integration
- Test error scenarios
- Test cache invalidation
- Test optimistic updates

### 3. Performance Testing

- Measure bundle size impact
- Test memory usage
- Verify caching effectiveness
- Test concurrent request deduplication

## Rollback Plan

### Feature Flags

Implement feature flags for gradual rollout:

```tsx
const USE_TANSTACK_QUERY =
  process.env.NEXT_PUBLIC_USE_TANSTACK_QUERY === "true";

// Component logic
if (USE_TANSTACK_QUERY) {
  // New TanStack Query implementation
} else {
  // Legacy useEffect implementation
}
```

### Monitoring

- Track API call patterns
- Monitor error rates
- Watch performance metrics
- User experience feedback

## Success Metrics

### Performance

- [ ] 60% reduction in duplicate API calls
- [ ] 40% faster perceived loading times
- [ ] 30% improvement in cache hit rates

### Developer Experience

- [ ] 50% reduction in loading/error state boilerplate
- [ ] Centralized error handling
- [ ] Real-time query debugging

### User Experience

- [ ] Instant loading for cached data
- [ ] Better offline experience
- [ ] Optimistic UI updates

## Next Steps

1. **Execute Phase 1**: Set up TanStack Query foundation
2. **Test Migration**: Start with simple components
3. **Iterate**: Apply learnings to complex components
4. **Monitor**: Track performance and user feedback
5. **Optimize**: Fine-tune cache strategies and error handling

---

## Execution Log

### 2025-07-03: Project Initialization

- Created migration plan
- Analyzed codebase for useEffect patterns
- Identified 24 components requiring migration
- Ready to begin Phase 1 implementation

### 2025-07-03: Phase 1 Execution (COMPLETED ✅)

- ✅ Installed @tanstack/react-query and @tanstack/react-query-devtools
- ✅ Created QueryClient configuration with proper defaults
- ✅ Set up query key factory for consistent cache management
- ✅ Created QueryProvider wrapper component
- ✅ Integrated QueryProvider into app layout
- ✅ Created inventory API hooks with proper types
- ✅ Migrated InventoryMetrics.tsx to use useInventoryStats hook
- ✅ Migrated InventoryCharts.tsx to use useInventoryCharts hook
- ✅ Migrated RecentActivity.tsx to use useRecentActivity hook
- ✅ Created products API hooks foundation
- ✅ Development server running successfully with TanStack Query

### 2025-07-03: Phase 2 Started (IN PROGRESS 🔄)

- ✅ Started ProductList.tsx migration
- 🔄 Working on type alignment between local and imported Product interfaces
- 🔄 Need to resolve property name mismatches (created_at vs createdAt, etc.)
- ⏸️ Paused complex migration to ensure stability

### 2025-07-03: Phase 2 Continued - BrandList Migration (COMPLETED ✅)

- ✅ Created `/src/hooks/api/brands.ts` with comprehensive query and mutation hooks
- ✅ Migrated `BrandList.tsx` from useEffect to TanStack Query:
  - **Replaced useEffect fetch logic** with `useBrands(filters)` query hook
  - **Replaced manual delete** with `useDeleteBrand()` mutation hook
  - **Fixed property naming** from snake_case (`is_active`, `created_at`) to camelCase (`isActive`, `createdAt`)
  - **Removed manual state management** for brands, loading, pagination
  - **Improved loading states** using TanStack Query's `isLoading`
  - **Better error handling** with automatic retry and consistent error states
  - **Automatic cache invalidation** after successful delete operations
- ✅ Component compiles without TypeScript errors
- ✅ Ready for browser testing

### Phase 2 Current Status:

**4 components successfully migrated** to TanStack Query:

1. InventoryMetrics.tsx ✅
2. InventoryCharts.tsx ✅
3. RecentActivity.tsx ✅
4. BrandList.tsx ✅ (CRUD with mutations)

### Key Migration Patterns Established:

- **Simple Data Fetching**: Mock data → `useQuery` hooks with fallback data
- **CRUD Operations**: Manual fetch/delete → query + mutation hooks
- **Type Alignment**: API snake_case → camelCase hook interfaces
- **State Cleanup**: Remove useState/useEffect → rely on TanStack Query state
- **Cache Strategy**: Automatic invalidation on mutations for real-time updates

### Next Priority: ProductList.tsx Type Alignment

- 🎯 **Challenge**: Resolve Product interface mismatches
- 📋 **Plan**: Create type adapters or align API response format
- 🚀 **Goal**: Apply BrandList success pattern to ProductList

### Phase 1 Results:
