# Stock Management System - User Guide

## Overview

The stock management system has been updated with two new features to replace the previous stock adjustment system:

1. **Add Stock** - Simple stock additions for new purchases
2. **Stock Reconciliation** - Multi-product adjustments with approval workflow

## Add Stock Feature

### When to Use

- Adding new inventory from supplier purchases
- Restocking products
- Recording stock increases with cost tracking

### How to Use

1. Navigate to Products page (`/inventory/products`)
2. Find the product you want to add stock to
3. Click the three-dot menu next to the product
4. Select "Add Stock"
5. Fill in the details:
   - **Quantity**: Number of units to add
   - **Cost per unit**: Purchase cost for inventory valuation
   - **Supplier**: Optional supplier selection
   - **Purchase date**: When the stock was purchased
   - **Notes**: Additional information
6. Click "Add Stock" to confirm

### Features

- Automatic stock quantity updates
- Weighted average cost calculation
- Supplier tracking
- Purchase history

## Stock Reconciliation Feature

### When to Use

- Performing physical inventory counts
- Correcting multiple stock discrepancies
- Managing stock adjustments that require approval

### How to Use

#### Creating a Reconciliation

1. Navigate to Products page (`/inventory/products`)
2. Click "Reconcile Stock" button
3. Enter reconciliation details:
   - **Title**: Descriptive name for this reconciliation
   - **Description**: Purpose and details
4. Add products to reconcile:
   - Click "Add Product"
   - Select product from dropdown
   - Enter system count (current stock level)
   - Enter physical count (actual counted stock)
   - Add reason for any discrepancy
5. Save as draft or submit for approval

#### Approval Workflow

- **Draft**: Can be edited and products can be added/removed
- **Pending**: Submitted for admin approval, cannot be edited
- **Approved**: Applied to inventory, stock levels updated
- **Rejected**: Returned to creator with comments

#### Viewing Reconciliations

1. Navigate to Stock Reconciliations (`/inventory/stock-reconciliations`)
2. View list of all reconciliations with status
3. Click on any reconciliation to view details
4. Filter by status, date, or creator

## Admin Functions

### Approving Reconciliations

1. Navigate to Stock Reconciliations page
2. Find reconciliations with "Pending" status
3. Click to view details
4. Review all items and discrepancies
5. Click "Approve" to apply changes or "Reject" with reason

### Managing Stock Additions

1. Navigate to Stock History (when implemented)
2. View all stock additions
3. Track cost changes and supplier relationships

## Email Notifications

The system automatically sends notifications for:

- Reconciliation submissions (to admins)
- Approval/rejection decisions (to creators)
- Status changes

## Best Practices

### For Stock Additions

- Always enter accurate cost per unit for proper inventory valuation
- Select the correct supplier for purchase tracking
- Add meaningful notes for future reference

### For Stock Reconciliations

- Perform regular physical counts (monthly/quarterly)
- Be specific with discrepancy reasons
- Review all items before submitting for approval
- Use descriptive titles like "Q1 2024 Physical Count - Warehouse A"

### For Admins

- Review reconciliations promptly to avoid inventory delays
- Ask for clarification if discrepancy reasons are unclear
- Monitor patterns in stock discrepancies
- Ensure proper authorization for large adjustments

## Troubleshooting

### Common Issues

**Cannot add stock to product**

- Verify you have proper permissions (Staff, Manager, or Admin)
- Check that the product is active
- Ensure quantity is a positive number

**Reconciliation stuck in draft**

- Verify all required fields are filled
- Check that at least one product is added
- Ensure all discrepancy reasons are provided

**Approval not working**

- Only Admins can approve reconciliations
- Reconciliation must be in "Pending" status
- Check for proper authentication

**Missing notifications**

- Verify email settings in user profile
- Check spam/junk folders
- Contact system administrator if notifications are not working

## Migration from Old System

If you were using the previous stock adjustment system:

1. **Old stock adjustments** remain accessible but read-only
2. **New stock additions** should be used for all new inventory purchases
3. **Stock reconciliations** should be used for adjustments and corrections
4. **Historical data** is preserved and will be migrated gradually

## API Documentation

For developers integrating with the system:

### Stock Additions API

- `POST /api/stock-additions` - Create new stock addition
- `GET /api/stock-additions` - List stock additions
- `GET /api/stock-additions/[id]` - Get specific addition

### Stock Reconciliations API

- `POST /api/stock-reconciliations` - Create reconciliation
- `GET /api/stock-reconciliations` - List reconciliations
- `POST /api/stock-reconciliations/[id]/submit` - Submit for approval
- `POST /api/stock-reconciliations/[id]/approve` - Approve (Admin only)
- `POST /api/stock-reconciliations/[id]/reject` - Reject (Admin only)

## Support

For additional help or issues:

1. Check this documentation first
2. Contact your system administrator
3. Create a support ticket with detailed error information

---

_Last updated: June 2025_
