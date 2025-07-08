# Central Roles System Implementation

## Summary

We have implemented and are refactoring the codebase to use a central roles management system, which provides a single source of truth for all role definitions, permissions, and role-based helper functions in the application.

## Completed Tasks

1. **Identified existing central roles system**:
   - Located in `/src/lib/auth/roles.ts`
   - Export all auth utilities through `/src/lib/auth/index.ts`

2. **Updated key components to use the central roles system**:
   - Updated `src/app/(dashboard)/inventory/products/manage/page.tsx` to use centralized role checks
   - Updated `src/app/(dashboard)/pos/page.tsx` to use the central roles system
   - Updated `src/app/api/categories/route.ts` to use permission-based role checks
   - Updated `src/app/api/stock-reconciliations/route.ts` to use permission-based role checks
   - Updated `src/app/api/categories/[id]/route.ts` to use permission-based role checks
   - Updated `src/app/api/stock-additions/[id]/route.ts` to use permission-based role checks
   - Updated `src/app/api/reports/inventory/route.ts` to use permission-based role checks
   - Updated `src/app/api/suppliers/route.ts` to use permission-based role checks
   - Updated `src/app/api/stock-additions/route.ts` to use permission-based role checks

3. **Fixed inconsistencies**:
   - Updated imports to use the central auth module
   - Replaced hard-coded role checks with permission-based checks
   - Standardized on `EMPLOYEE` role name (instead of `STAFF`)

## Next Steps

1. **Continue refactoring all API routes**:
   - Update remaining API routes that use hard-coded role checks
   - Replace string literals with proper permission checks
   - Use the following pattern for imports:
     ```typescript
     import { hasPermission } from "@/lib/auth/roles";
     ```
   - Use the following pattern for permission checks:
     ```typescript
     if (!hasPermission(session.user.role, "PERMISSION_NAME")) {
       return NextResponse.json(
         { error: "Insufficient permissions" },
         { status: 403 }
       );
     }
     ```

2. **Refactor all page components**:
   - Update page components to use the central roles system
   - Replace hard-coded role checks with proper permission checks
   - Use the following pattern for imports:
     ```typescript
     import { hasPermission } from "@/lib/auth/roles";
     ```
   - Use the following pattern for permission checks:
     ```typescript
     if (!hasPermission(session.user.role, "PERMISSION_NAME")) {
       redirect("/unauthorized");
     }
     ```

3. **Update UI components**:
   - Update any UI components that conditionally render based on user roles
   - Use the permission helpers for fine-grained access control

4. **Further enhancements**:
   - Add comprehensive role and permission documentation
   - Consider implementing a more detailed audit logging system for role/permission checks
   - Create UI for role management (admin only)

## Files Identified for Refactoring

The following files still need to be updated to use the central roles system:

```
src/app/api/products/[id]/images/route.ts  (This file needs to be checked as no role checks were found)
```

Additional files to check:

```
src/app/api/auth/**/*.ts
src/app/api/users/**/*.ts
src/app/(dashboard)/**/*.tsx
```

## Testing Approach

After each batch of changes:

1. Test basic functionality
2. Test role-based access control
3. Verify permissions are applied correctly
4. Ensure error messages are consistent

## Conclusion

The central roles system provides a robust framework for role-based access control throughout the application. All role and status types are now unified in `src/types/user.ts`, and all role-based logic should use these types and the central helpers. This ensures consistency, security, and maintainability as the application evolves.

When adding new features or routes, always use the central roles system and unified types for access control.
