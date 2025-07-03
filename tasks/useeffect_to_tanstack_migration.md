# useEffect API Calls → TanStack Query Migration Guide

## Instructions for AI Assistant

You are tasked with analyzing my React/Next.js codebase to identify all instances where `useEffect` is being used for API calls and provide migration plans to convert them to TanStack Query (React Query). This will improve performance, user experience, and code maintainability.

## IMPORTANT: Analysis Only Mode
- **DO NOT** make any changes to the code automatically
- **DO NOT** install packages or modify files unless explicitly requested
- **ONLY** analyze and provide migration recommendations
- Wait for my explicit approval before implementing any changes

## Analysis Objectives

### 1. Identify useEffect API Call Patterns
Scan all React components and custom hooks to find:

#### **A. Direct API Calls in useEffect**
```tsx
// Pattern to find:
useEffect(() => {
  fetch('/api/...')
  axios.get('/api/...')
  supabase.from('...').select()
  // Any HTTP request inside useEffect
}, [dependencies])
```

#### **B. State Management with API Calls**
```tsx
// Pattern to find:
const [data, setData] = useState()
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/...')
      setData(response.data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

#### **C. Custom Hooks with useEffect API Calls**
```tsx
// Pattern to find:
function useCustomData() {
  const [data, setData] = useState()
  useEffect(() => {
    // API call logic
  }, [])
  return { data, loading, error }
}
```

### 2. Categorize API Call Types
For each found instance, categorize as:

**A. Data Fetching** - Reading data from API
**B. Mutations** - Creating, updating, or deleting data
**C. Real-time Updates** - Polling or subscriptions
**D. Dependent Queries** - Queries that depend on other data
**E. Background Sync** - Automatic data synchronization

## Required Report Format

```markdown
# useEffect → TanStack Query Migration Analysis

## Summary Statistics
- **Total Components Scanned**: [number]
- **Components with useEffect API calls**: [number]
- **Custom hooks with useEffect API calls**: [number]
- **Total API call patterns found**: [number]

## Migration Complexity Assessment
- **Simple migrations** (basic fetch): [number]
- **Medium complexity** (dependent queries): [number]
- **Complex migrations** (mutations with optimistic updates): [number]

## Category A: Data Fetching (Simple Migration)

### Component: `ComponentName.tsx`
**Current Pattern:**
```tsx
// Show current useEffect code
```
**Migration Complexity**: Low
**Dependencies**: [list any dependencies]
**Suggested TanStack Query Pattern**: 
- Query Key: `['queryName', param1, param2]`
- Query Function: [description]
- Additional Features Needed: [caching, refetch, etc.]

### Component: `AnotherComponent.tsx`
[Same format as above]

## Category B: Mutations (Medium Complexity)

### Component: `ComponentName.tsx`
**Current Pattern:**
```tsx
// Show current useEffect code for mutations
```
**Migration Complexity**: Medium
**Mutation Type**: [Create/Update/Delete]
**Optimistic Updates Needed**: [Yes/No]
**Cache Invalidation Required**: [which queries to invalidate]

## Category C: Real-time Updates (Complex Migration)

### Component: `ComponentName.tsx`
**Current Pattern:**
```tsx
// Show current useEffect code for real-time
```
**Migration Complexity**: High
**Real-time Type**: [Polling/WebSocket/SSE]
**Suggested Approach**: [TanStack Query + additional libraries]

## Category D: Dependent Queries (Medium Complexity)

### Component: `ComponentName.tsx`
**Current Pattern:**
```tsx
// Show current dependent useEffect calls
```
**Migration Complexity**: Medium
**Dependencies**: [what data this query depends on]
**Suggested Pattern**: [enabled queries, dependent queries]

## Category E: Background Sync (Complex Migration)

### Component: `ComponentName.tsx`
**Current Pattern:**
```tsx
// Show current background sync code
```
**Migration Complexity**: High
**Sync Strategy**: [description]
**Suggested Approach**: [background queries, refetch intervals]

## Custom Hooks Analysis

### Hook: `useCustomHook.ts`
**Current Implementation**:
```tsx
// Show current hook code
```
**Migration Strategy**: [convert to TanStack Query hook]
**Reusability Impact**: [how many components use this hook]

## Required TanStack Query Setup

### 1. Package Installation
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 2. QueryClient Configuration Needed
```tsx
// Suggested QueryClient setup for your app
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Suggested defaults based on your app patterns
    },
    mutations: {
      // Suggested defaults based on your app patterns
    }
  }
})
```

### 3. Provider Setup Location
**File to modify**: `[suggest which layout/app file]`
**Reason**: [why this location is optimal]

## Migration Priority Recommendations

### Phase 1: Quick Wins (1-2 days)
1. **Component**: `[name]` - **Reason**: [simple fetch, high usage]
2. **Component**: `[name]` - **Reason**: [isolated, low risk]
3. **Hook**: `[name]` - **Reason**: [used in multiple places]

### Phase 2: Medium Complexity (3-5 days)
1. **Component**: `[name]` - **Reason**: [dependent queries]
2. **Component**: `[name]` - **Reason**: [mutations with cache updates]

### Phase 3: Complex Migrations (1-2 weeks)
1. **Component**: `[name]` - **Reason**: [real-time features]
2. **Component**: `[name]` - **Reason**: [complex state management]

## Potential Benefits After Migration

### Performance Improvements
- **Automatic caching**: [estimate cache hit rate improvement]
- **Deduplication**: [estimate reduced API calls]
- **Background updates**: [estimate UX improvement]

### Developer Experience
- **Reduced boilerplate**: [estimate lines of code reduction]
- **Better error handling**: [improved error states]
- **Devtools**: [debugging improvements]

### User Experience
- **Faster loading**: [estimate speed improvement]
- **Better offline support**: [cache benefits]
- **Optimistic updates**: [perceived performance gains]

## Breaking Changes Assessment

### Potential Issues
1. **Component re-renders**: [components that might re-render differently]
2. **State timing**: [timing-dependent code that might break]
3. **Error handling**: [different error patterns]

### Mitigation Strategies
1. **Testing approach**: [how to test migrations]
2. **Rollback plan**: [how to revert if needed]
3. **Feature flags**: [gradual rollout strategy]

## Custom Query Hooks to Create

### Suggested Hook Structure
Based on your API patterns, suggest custom hooks like:

```tsx
// Example suggestions based on found patterns
function useProducts() { /* TanStack Query implementation */ }
function useCreateProduct() { /* Mutation implementation */ }
function useUpdateStock() { /* Mutation implementation */ }
```

## Testing Strategy

### Unit Testing Changes
- **Mock strategy**: [how to mock TanStack Query]
- **Test utilities**: [testing library recommendations]
- **Component testing**: [what to test differently]

### Integration Testing
- **API integration**: [how to test with real API]
- **Cache behavior**: [how to test caching]
- **Error scenarios**: [how to test error states]

## Implementation Guidelines

### Naming Conventions
**Query Keys**: [suggest naming pattern]
**Hook Names**: [suggest naming pattern]  
**File Organization**: [suggest file structure]

### Error Handling Standards
**Global Error Handling**: [suggest global error boundary updates]
**Component Error States**: [suggest error UI patterns]
**Retry Strategies**: [suggest retry configurations]

### Cache Management
**Cache Invalidation**: [suggest invalidation patterns]
**Cache Persistence**: [suggest persistence strategy]
**Cache Size**: [suggest size limits]
```

## Analysis Instructions

### For Each Component/Hook Found:
1. **Extract the complete useEffect code**
2. **Identify the API endpoint(s) being called**
3. **Note any dependencies in the dependency array**
4. **Check for manual loading/error state management**
5. **Identify any cleanup logic**
6. **Note how the data is used in the component**
7. **Check for any race condition handling**

### Migration Complexity Assessment:
- **Simple**: Basic fetch with useState for data/loading/error
- **Medium**: Dependent queries, mutations, or complex state
- **Complex**: Real-time updates, complex caching needs, or intricate state management

### Priority Factors:
1. **Usage frequency** (how often the component is used)
2. **User-facing impact** (critical user flows vs. admin features)
3. **Current performance issues** (slow loading, multiple API calls)
4. **Maintenance burden** (complex useEffect logic)

## After Analysis Complete

Provide a summary with:

1. **Migration Roadmap**: 3-phase implementation plan
2. **Effort Estimation**: Total time and complexity
3. **Risk Assessment**: Potential breaking changes
4. **Quick Wins**: Easy migrations to start with
5. **Complex Cases**: Migrations that need careful planning

Then ask: "Analysis complete. I found [X] components with useEffect API calls. Would you like me to:

A) Create detailed migration plans for Phase 1 (quick wins)
B) Provide specific TanStack Query implementations for selected components
C) Generate the QueryClient configuration and provider setup
D) Create custom hook implementations for common patterns
E) Focus on a specific component category first

Please specify which option you'd prefer or which specific components you'd like to migrate first."

---

**Begin your comprehensive useEffect API call analysis now.**