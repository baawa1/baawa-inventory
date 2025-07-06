#!/bin/bash

# Script to clean up deprecated stock adjustment components
# This script moves old components to a backup folder for safety

echo "Cleaning up deprecated stock adjustment components..."

# Create backup directory
BACKUP_DIR="src/components/inventory/deprecated"
mkdir -p "$BACKUP_DIR"

# Move old components to backup
echo "Moving deprecated components to $BACKUP_DIR..."

# Move old StockAdjustmentList to backup
if [ -f "src/components/inventory/StockAdjustmentList.tsx" ]; then
    mv "src/components/inventory/StockAdjustmentList.tsx" "$BACKUP_DIR/StockAdjustmentList.tsx.bak"
    echo "✓ Moved StockAdjustmentList.tsx to backup"
fi

# Move old StockReconciliationList to backup
if [ -f "src/components/inventory/StockReconciliationList.tsx" ]; then
    mv "src/components/inventory/StockReconciliationList.tsx" "$BACKUP_DIR/StockReconciliationList.tsx.bak"
    echo "✓ Moved StockReconciliationList.tsx to backup"
fi

# Rename new components to remove the "New" suffix
if [ -f "src/components/inventory/StockAdjustmentListNew.tsx" ]; then
    mv "src/components/inventory/StockAdjustmentListNew.tsx" "src/components/inventory/StockAdjustmentList.tsx"
    echo "✓ Renamed StockAdjustmentListNew.tsx to StockAdjustmentList.tsx"
fi

if [ -f "src/components/inventory/StockReconciliationListNew.tsx" ]; then
    mv "src/components/inventory/StockReconciliationListNew.tsx" "src/components/inventory/StockReconciliationList.tsx"
    echo "✓ Renamed StockReconciliationListNew.tsx to StockReconciliationList.tsx"
fi

echo "✅ Cleanup completed!"
echo "Old components backed up to: $BACKUP_DIR"
echo "New components are now using the standard naming convention."
