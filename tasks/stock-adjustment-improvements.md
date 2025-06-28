# Stock Adjustment System Improvements

## Overview

Replace the current stock adjustment system with two distinct features:

1. **Add Stock** - Simple stock additions for new purchases
2. **Stock Reconciliation** - Multi-product adjustments with approval workflow

## Implementation Plan

### Phase 1: Database Schema Updates

- [x] Create `stock_additions` table for tracking stock purchases
  - [x] Fields: id, product_id, quantity, cost_per_unit, supplier_id, purchase_date, notes, created_by, created_at
  - [x] Add foreign key relationships to products, suppliers, and users tables
- [x] Create `stock_reconciliations` table for reconciliation records
  - [x] Fields: id, title, description, status (DRAFT, PENDING, APPROVED, REJECTED), created_by, approved_by, created_at, approved_at
- [x] Create `stock_reconciliation_items` table for individual product adjustments
  - [x] Fields: id, reconciliation_id, product_id, system_count, physical_count, discrepancy, discrepancy_reason, estimated_impact
- [x] Create database migrations for new tables
- [x] Update Prisma schema with new models

### Phase 2: API Development

- [x] Create stock additions API endpoints
  - [x] POST `/api/stock-additions` - Create new stock addition
  - [x] GET `/api/stock-additions` - List stock additions with filtering
  - [x] GET `/api/stock-additions/[id]` - Get individual stock addition
  - [x] PUT `/api/stock-additions/[id]` - Update stock addition (if needed)
  - [x] DELETE `/api/stock-additions/[id]` - Delete stock addition (admin only)
- [x] Create stock reconciliation API endpoints
  - [x] POST `/api/stock-reconciliations` - Create new reconciliation
  - [x] GET `/api/stock-reconciliations` - List reconciliations with filtering
  - [x] GET `/api/stock-reconciliations/[id]` - Get individual reconciliation
  - [x] PUT `/api/stock-reconciliations/[id]` - Update reconciliation (draft only)
  - [x] POST `/api/stock-reconciliations/[id]/submit` - Submit for approval
  - [x] POST `/api/stock-reconciliations/[id]/approve` - Approve reconciliation (admin only)
  - [x] POST `/api/stock-reconciliations/[id]/reject` - Reject reconciliation (admin only)
  - [x] DELETE `/api/stock-reconciliations/[id]` - Delete reconciliation (admin only)

### Phase 3: Validation Schemas

- [x] Create Zod validation schemas for stock additions
  - [x] `createStockAdditionSchema`
  - [x] `updateStockAdditionSchema`
  - [x] `stockAdditionQuerySchema`
- [x] Create Zod validation schemas for stock reconciliations
  - [x] `createStockReconciliationSchema`
  - [x] `updateStockReconciliationSchema`
  - [x] `stockReconciliationQuerySchema`
  - [x] `reconciliationItemSchema`
  - [x] `bulkReconciliationSchema`

### Phase 4: UI Components Development

- [x] Update ProductList actions popover
  - [x] Replace "Adjust Stock" with "Add Stock" action
  - [x] Ensure proper permission checks for stock additions
- [x] Create AddStockDialog component
  - [x] Simple form with product info, quantity, cost per unit, supplier selection
  - [x] Validation and error handling
  - [x] Success notifications with stock update confirmation
- [x] Add "Reconcile Stock" button to products page
  - [x] Position beside "Add Product" button
  - [x] Proper styling to match existing design
- [x] Create StockReconciliationDialog component
  - [x] Multi-product selection interface
  - [x] System count vs physical count input
  - [x] Discrepancy calculation and impact estimation
  - [x] Reason tracking for each discrepancy
  - [x] Save as draft functionality
- [x] Create StockReconciliationList component
  - [x] List all reconciliations with status indicators
  - [x] Search and filter functionality
  - [x] Actions for view, edit (draft), submit, approve/reject
- [x] Create StockReconciliationDetail component
  - [x] Detailed view of reconciliation with all items
  - [x] Approval/rejection interface for admins
  - [x] History tracking and audit trail

### Phase 5: Page Integration

- [x] Update products page layout
  - [x] Add "Reconcile Stock" button beside "Add Product"
  - [x] Ensure responsive design
- [x] Create stock reconciliation management page
  - [x] Route: `/inventory/stock-reconciliations`
  - [x] List view with proper authentication
  - [x] Filter by status, date range, created by
- [x] Create individual reconciliation view page
  - [x] Route: `/inventory/stock-reconciliations/[id]`
  - [x] Detailed view with approval workflow
  - [x] Edit capability for draft reconciliations

### Phase 6: Business Logic Implementation

- [x] Stock addition processing
  - [x] Automatic stock quantity updates on creation
  - [x] Cost tracking and inventory value calculations (weighted average)
  - [x] Integration with supplier purchase history
  - [x] Audit logging for inventory changes
- [x] Reconciliation workflow
  - [x] Draft state allows editing and adding/removing products
  - [x] Submission locks the reconciliation for approval
  - [x] Approval applies all stock adjustments simultaneously
  - [x] Rejection allows returning to draft state with comments
- [x] Notification system
  - [x] Email notifications for reconciliation submissions
  - [x] Admin alerts for pending approvals
  - [x] Status change notifications to creators

### Phase 7: Migration and Cleanup

- [x] Migrate existing stock adjustments to new system
  - [x] Analyze current stock_adjustments data
  - [x] Determine which records should become reconciliations vs additions
  - [x] Create migration script for data transformation
- [x] Update navigation and menu items
  - [x] Remove old "Stock Adjustments" menu item
  - [x] Add "Stock Reconciliations" to inventory menu
  - [x] Update sidebar navigation
- [ ] Remove deprecated components and APIs
  - [ ] Remove old stock adjustment components (keep for backward compatibility during transition)
  - [ ] Remove old API endpoints (after migration completion)
  - [ ] Clean up unused validation schemas

### Phase 8: Testing and Validation

- [x] Unit tests for new API endpoints
  - [x] Stock additions CRUD operations
  - [x] Reconciliation workflow testing
  - [x] Permission and authorization tests
- [x] Component testing
  - [x] AddStockDialog functionality
  - [x] StockReconciliationDialog multi-product handling
  - [x] List and detail view components
- [ ] Integration testing
  - [ ] End-to-end reconciliation workflow
  - [ ] Stock quantity updates and calculations
  - [ ] Email notification delivery
- [ ] User acceptance testing
  - [ ] Test with actual inventory data
  - [ ] Validate business workflow requirements
  - [ ] Performance testing with large reconciliations

### Phase 9: Documentation and Training

- [x] Update user documentation
  - [x] Guide for adding stock from purchases
  - [x] Guide for performing stock reconciliations
  - [x] Admin guide for approval workflow
- [x] Update API documentation
  - [x] New endpoint specifications
  - [x] Schema definitions and examples
  - [x] Migration guide for existing integrations
- [ ] Create admin training materials
  - [ ] Video walkthrough of new features
  - [ ] Best practices for reconciliation management
  - [ ] Troubleshooting common issues

## Success Criteria

- [x] Complete replacement of current stock adjustment system
- [x] Intuitive "Add Stock" functionality for purchases
- [x] Multi-product reconciliation capability
- [x] Proper approval workflow with admin controls
- [x] All existing functionality maintained or improved
- [ ] Zero data loss during migration (requires running migration script)
- [x] Improved user experience and workflow efficiency

## Technical Requirements

- [x] Maintain backward compatibility during transition
- [x] Ensure proper database transactions for data integrity
- [x] Implement proper error handling and rollback mechanisms
- [x] Follow existing code patterns and styling guidelines
- [x] Ensure mobile responsiveness for all new UI components
- [x] Implement proper loading states and user feedback
