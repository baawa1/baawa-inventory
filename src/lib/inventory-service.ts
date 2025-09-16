import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { AuditLogAction } from '@/types/audit';
import { Prisma } from '@prisma/client';
import { ProductStatus } from '@/lib/constants';

// ===== TYPE DEFINITIONS =====

export interface StockUpdateData {
  productId: number;
  quantity: number;
  userId: number;
  reason?: string;
  notes?: string;
  referenceNo?: string;
  supplierId?: number;
  costPerUnit?: number;
  isAdjustment?: boolean;
}

export interface StockReconciliationItem {
  productId: number;
  systemCount: number;
  physicalCount: number;
  discrepancyReason?: string;
  notes?: string;
}

export interface ProductUpdateData {
  name?: string;
  sku?: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  minimumStock?: number;
  maximumStock?: number;
  currentStock?: number;
  supplierId?: number;
  status?: ProductStatus;
}

export interface SalesTransactionUpdateData {
  userId: number;
  status?: string;
  total_amount?: number;
  payment_status?: string;
  payment_method?: string;
  customer_email?: string;
  customer_name?: string;
  notes?: string;
}

// Remove the custom interface and use Prisma's built-in types

export interface LowStockOptions {
  limit?: number;
  offset?: number;
  categoryId?: number;
  brandId?: number;
  supplierId?: number;
  threshold?: number;
}

// ===== INVENTORY SERVICE CLASS =====

export class InventoryService {
  /**
   * Add stock to a product
   * @param data Stock update data
   * @returns The updated product
   */
  static async addStock(data: StockUpdateData) {
    const {
      productId,
      quantity,
      userId,
      reason: _reason = 'Stock Addition',
      notes,
      referenceNo,
      supplierId,
      costPerUnit,
    } = data;

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    // Calculate total cost if cost per unit is provided
    const totalCost = costPerUnit ? costPerUnit * quantity : undefined;

    return await prisma.$transaction(async tx => {
      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: quantity },
        },
        include: {
          category: true,
          brand: true,
          supplier: true,
        },
      });

      // Create stock addition record
      const stockAddition = await tx.stockAddition.create({
        data: {
          productId,
          supplierId,
          createdById: userId,
          quantity,
          costPerUnit: costPerUnit || 0,
          totalCost: totalCost || 0,
          notes,
          referenceNo,
        },
      });

      // Create audit log
      await createAuditLog({
        tx,
        userId,
        action: AuditLogAction._STOCK_ADDITION,
        tableName: 'products',
        recordId: productId,
        oldValues: { stock: updatedProduct.stock - quantity },
        newValues: { stock: updatedProduct.stock },
      });

      return { product: updatedProduct, stockAddition };
    });
  }

  /**
   * Remove stock from a product
   * @param data Stock update data
   * @returns The updated product
   */
  static async removeStock(data: StockUpdateData) {
    const {
      productId,
      quantity,
      userId,
      reason = 'Stock Removal',
      notes,
    } = data;

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    return await prisma.$transaction(async tx => {
      // Get current product data
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
        },
        include: {
          category: true,
          brand: true,
          supplier: true,
        },
      });

      // Create stock adjustment record
      const stockAdjustment = await tx.stockAdjustment.create({
        data: {
          product_id: productId,
          adjustment_type: 'REMOVAL',
          quantity,
          old_quantity: product.stock,
          new_quantity: updatedProduct.stock,
          reason,
          notes,
          user_id: userId,
          status: 'COMPLETED',
        },
      });

      // Create audit log
      await createAuditLog({
        tx,
        userId,
        action: AuditLogAction._STOCK_REMOVAL,
        tableName: 'products',
        recordId: productId,
        oldValues: { stock: product.stock },
        newValues: { stock: updatedProduct.stock },
      });

      return { product: updatedProduct, stockAdjustment };
    });
  }

  /**
   * Adjust stock for a product (can be positive or negative)
   * @param data Stock update data
   * @returns The updated product
   */
  static async adjustStock(data: StockUpdateData) {
    const {
      productId,
      quantity, // This is the new quantity to set
      userId,
      reason = 'Stock Adjustment',
      notes,
    } = data;

    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    return await prisma.$transaction(async tx => {
      // Get current product data
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const oldQuantity = product.stock;
      const adjustmentQuantity = Math.abs(quantity - oldQuantity);
      const adjustmentType = quantity > oldQuantity ? 'ADDITION' : 'REDUCTION';

      // Update product stock to the exact value
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: quantity,
        },
        include: {
          category: true,
          brand: true,
          supplier: true,
        },
      });

      // Create stock adjustment record
      const stockAdjustment = await tx.stockAdjustment.create({
        data: {
          product_id: productId,
          adjustment_type: adjustmentType,
          quantity: adjustmentQuantity,
          old_quantity: oldQuantity,
          new_quantity: quantity,
          reason,
          notes,
          user_id: userId,
          status: 'COMPLETED',
        },
      });

      // Create audit log
      await createAuditLog({
        tx,
        userId,
        action: AuditLogAction._STOCK_ADJUSTMENT,
        tableName: 'products',
        recordId: productId,
        oldValues: { stock: oldQuantity },
        newValues: { stock: quantity },
      });

      return { product: updatedProduct, stockAdjustment };
    });
  }

  /**
   * Create a stock reconciliation
   * @param data Reconciliation data
   * @returns The created reconciliation
   */
  static async createReconciliation(data: {
    title: string;
    description?: string;
    userId: number;
    items: StockReconciliationItem[];
  }) {
    const { title, description, userId, items } = data;

    return await prisma.$transaction(async tx => {
      // Create reconciliation record
      const reconciliation = await tx.stockReconciliation.create({
        data: {
          title,
          description,
          createdById: userId,
          status: 'DRAFT',
        },
      });

      // Create reconciliation items
      const reconciliationItems = await Promise.all(
        items.map(async item => {
          const {
            productId,
            systemCount,
            physicalCount,
            discrepancyReason,
            notes,
          } = item;

          const discrepancy = physicalCount - systemCount;

          return tx.stockReconciliationItem.create({
            data: {
              reconciliationId: reconciliation.id,
              productId,
              systemCount,
              physicalCount,
              discrepancy,
              discrepancyReason,
              notes,
              // Calculate estimated impact if needed
              estimatedImpact: discrepancy > 0 ? null : Math.abs(discrepancy), // Only for negative discrepancies
            },
          });
        })
      );

      return {
        reconciliation,
        items: reconciliationItems,
      };
    });
  }

  /**
   * Approve a stock reconciliation
   * @param reconciliationId The reconciliation ID
   * @param userId The ID of the user approving
   * @returns The approved reconciliation
   */
  static async approveReconciliation(reconciliationId: number, userId: number) {
    return await prisma.$transaction(async tx => {
      // Get the reconciliation with items
      const reconciliation = await tx.stockReconciliation.findUnique({
        where: { id: reconciliationId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!reconciliation) {
        throw new Error('Reconciliation not found');
      }

      if (reconciliation.status !== 'DRAFT') {
        throw new Error('Reconciliation is not in draft status');
      }

      // Update stock for each item
      for (const item of reconciliation.items) {
        const { productId, systemCount, physicalCount, discrepancy } = item;

        // Update the product stock to match the physical count
        await tx.product.update({
          where: { id: productId },
          data: { stock: physicalCount },
        });

        // Create an adjustment record for each item
        await tx.stockAdjustment.create({
          data: {
            product_id: productId,
            adjustment_type:
              discrepancy >= 0
                ? 'RECONCILIATION_ADDITION'
                : 'RECONCILIATION_REDUCTION',
            quantity: Math.abs(discrepancy),
            old_quantity: systemCount,
            new_quantity: physicalCount,
            reason: `Stock reconciliation #${reconciliationId}`,
            notes: item.discrepancyReason || 'Stock reconciliation adjustment',
            user_id: userId,
            status: 'COMPLETED',
          },
        });

        // Create audit log for each item
        await createAuditLog({
          tx,
          userId,
          action: AuditLogAction._STOCK_RECONCILIATION,
          tableName: 'products',
          recordId: productId,
          oldValues: { stock: systemCount },
          newValues: { stock: physicalCount },
        });
      }

      // Update reconciliation status
      const updatedReconciliation = await tx.stockReconciliation.update({
        where: { id: reconciliationId },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      return updatedReconciliation;
    });
  }

  /**
   * Get products with low stock
   * @param options Filter options
   * @returns Products with low stock and metrics
   */
  static async getLowStockProducts(options: LowStockOptions) {
    const {
      limit = 50,
      offset = 0,
      categoryId,
      brandId,
      supplierId,
      threshold,
    } = options;

    // Build the where clause for filtering
    const where: Prisma.ProductWhereInput = {
      isArchived: false,
      status: 'ACTIVE',
    };

    // Apply additional filters if provided
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (supplierId) where.supplierId = supplierId;

    // If threshold is specified, use it; otherwise filter in application layer
    if (threshold !== undefined) {
      where.stock = { lte: threshold };
    }

    // Execute the query with a transaction to ensure consistency
    return await prisma.$transaction(async tx => {
      // Get products with count for pagination
      const [products, totalCount] = await Promise.all([
        tx.product.findMany({
          where,
          include: {
            category: true,
            brand: true,
            supplier: true,
          },
          orderBy: [{ stock: 'asc' }, { minStock: 'desc' }],
          skip: offset,
          take: limit,
        }),
        tx.product.count({ where }),
      ]);

      // Calculate metrics
      const criticalStock = products.filter(p => p.stock === 0).length;
      const lowStock = products.filter(
        p => p.stock > 0 && p.stock <= p.minStock
      ).length;
      const totalValue = products.reduce((sum, product) => {
        return sum + Number(product.cost) * product.stock;
      }, 0);

      return {
        products,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: totalCount > offset + limit,
        },
        metrics: {
          totalValue,
          criticalStock,
          lowStock,
          totalProducts: products.length,
        },
      };
    });
  }

  /**
   * Get a product by ID with related entities
   * @param id The product ID
   * @returns The product with relations or null if not found
   */
  static async getProduct(id: number) {
    return await prisma.product.findFirst({
      where: {
        id,
        isArchived: false,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update a product
   * @param id The product ID
   * @param data The product data to update
   * @param userId The ID of the user making the update
   * @returns The updated product
   */
  static async updateProduct(
    id: number,
    data: ProductUpdateData,
    userId: number
  ) {
    // Check if product exists before attempting update
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sku: true },
    });

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // If SKU is being updated, check for conflicts
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: {
          sku: data.sku,
          id: { not: id },
        },
      });

      if (skuExists) {
        throw new Error('Product with this SKU already exists');
      }
    }

    // Map form field names to database field names if needed
    const updateData: Prisma.ProductUpdateInput = {
      name: data.name,
      sku: data.sku,
      description: data.description,
      cost: data.purchasePrice,
      price: data.sellingPrice,
      minStock: data.minimumStock,
      stock: data.currentStock,
      status: data.status,
    };

    // Handle relation fields separately
    if (data.categoryId) {
      updateData.category = { connect: { id: data.categoryId } };
    }
    if (data.brandId) {
      updateData.brand = { connect: { id: data.brandId } };
    }
    if (data.supplierId) {
      updateData.supplier = { connect: { id: data.supplierId } };
    }

    // Filter out undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof Prisma.ProductUpdateInput] === undefined) {
        delete updateData[key as keyof Prisma.ProductUpdateInput];
      }
    });

    return await prisma.$transaction(async tx => {
      // Get original product for audit log
      const originalProduct = await tx.product.findUnique({
        where: { id },
      });

      // Update the product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: updateData,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create audit log
      await createAuditLog({
        tx,
        userId,
        action: AuditLogAction._PRODUCT_UPDATED,
        tableName: 'products',
        recordId: id,
        oldValues: originalProduct,
        newValues: updatedProduct,
      });

      return updatedProduct;
    });
  }

  /**
   * Archive a product
   * @param id The product ID
   * @param userId The ID of the user archiving the product
   * @returns The archived product
   */
  static async archiveProduct(id: number, userId: number) {
    return await prisma.$transaction(async tx => {
      // Get original product for audit log
      const originalProduct = await tx.product.findUnique({
        where: { id },
      });

      if (!originalProduct) {
        throw new Error('Product not found');
      }

      // Archive the product
      const archivedProduct = await tx.product.update({
        where: { id },
        data: { isArchived: true },
      });

      // Create audit log
      await createAuditLog({
        tx,
        userId,
        action: AuditLogAction._PRODUCT_ARCHIVED,
        tableName: 'products',
        recordId: id,
        oldValues: { isArchived: false },
        newValues: { isArchived: true },
      });

      return archivedProduct;
    });
  }

  /**
   * Delete a product (permanent)
   * @param id The product ID
   * @param userId The ID of the user deleting the product
   * @returns The deleted product
   */
  static async deleteProduct(id: number, userId: number) {
    return await prisma.$transaction(async tx => {
      // Get original product for audit log
      const originalProduct = await tx.product.findUnique({
        where: { id },
      });

      if (!originalProduct) {
        throw new Error('Product not found');
      }

      // Delete the product
      const deletedProduct = await tx.product.delete({
        where: { id },
      });

      // Create audit log
      await createAuditLog({
        tx,
        userId,
        action: AuditLogAction._PRODUCT_DELETED,
        tableName: 'products',
        recordId: id,
        oldValues: originalProduct,
        newValues: null,
      });

      return deletedProduct;
    });
  }

  /**
   * Get a sales transaction by ID
   * @param id The sales transaction ID
   * @returns The sales transaction with related items
   */
  static async getSalesTransaction(id: number) {
    return await prisma.salesTransaction.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        sales_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                brand: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update a sales transaction
   * @param id The ID of the sales transaction
   * @param data The data to update
   * @returns The updated sales transaction
   */
  static async updateSalesTransaction(
    id: number,
    data: SalesTransactionUpdateData
  ) {
    return await prisma.$transaction(async tx => {
      // First fetch the current transaction to compare changes
      const currentTransaction = await tx.salesTransaction.findUnique({
        where: { id },
        include: {
          sales_items: true,
        },
      });

      if (!currentTransaction) {
        throw new Error('Sales transaction not found');
      }

      // Update the transaction
      const updatedTransaction = await tx.salesTransaction.update({
        where: { id },
        data: {
          // Add your transaction update fields here
          // e.g., status, total, etc.
          ...data,
        },
        include: {
          sales_items: true,
        },
      });

      // Create audit log
      await createAuditLog({
        tx,
        userId: data.userId,
        action: AuditLogAction._SALE_UPDATED,
        tableName: 'sales_transactions',
        recordId: id,
        oldValues: currentTransaction,
        newValues: updatedTransaction,
      });

      return updatedTransaction;
    });
  }

  /**
   * Void a sales transaction and restore product stock
   * @param id The ID of the sales transaction
   * @param userId The ID of the user voiding the transaction
   * @param reason The reason for voiding
   * @returns The voided sales transaction
   */
  static async voidSalesTransaction(
    _id: number,
    _userId: number,
    _reason: string
  ) {
    // TODO: Fix this method to work with the actual SalesTransaction schema
    // The current implementation assumes fields that don't exist in the schema
    throw new Error(
      'voidSalesTransaction method needs to be updated for current schema'
    );
  }
}
