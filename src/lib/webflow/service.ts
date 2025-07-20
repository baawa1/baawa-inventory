import { prisma } from "@/lib/db";
import { getWebflowClient, WebflowAsset, WebflowItem } from "./client";
import { webflowCollectionManager } from "./collections";
import { Product, Category, Brand } from "@prisma/client";

export interface SyncResult {
  success: boolean;
  webflowItemId?: string;
  webflowUrl?: string;
  errors: string[];
  retryable: boolean;
}

export interface BulkSyncResult {
  totalItems: number;
  successful: number;
  failed: number;
  errors: Array<{
    entityId: number;
    entityType: string;
    error: string;
  }>;
}

export interface PriceCalculationResult {
  onlinePrice: number;
  formula: string;
  calculatedAt: Date;
}

export type SyncableEntity =
  | (Product & {
      category?: Category | null;
      brand?: Brand | null;
      onlinePrice?: number | null;
      onlinePriceFormula?: string | null;
      showInWebflow?: boolean;
      webflowSlug?: string | null;
      webflowMetaData?: any;
    })
  | (Category & {
      showInWebflow?: boolean;
      webflowSlug?: string | null;
      webflowMetaData?: any;
      sortOrder?: number | null;
      metaTitle?: string | null;
      metaDescription?: string | null;
    })
  | (Brand & {
      showInWebflow?: boolean;
      webflowSlug?: string | null;
      webflowMetaData?: any;
      sortOrder?: number | null;
      metaTitle?: string | null;
      metaDescription?: string | null;
    });

export class WebflowSyncService {
  private client = getWebflowClient();
  private collectionManager = webflowCollectionManager;

  // Price calculation utilities
  calculateOnlinePrice(
    costPrice: number,
    sellingPrice: number,
    formula?: string | null
  ): PriceCalculationResult {
    if (!formula || formula.trim() === "") {
      return {
        onlinePrice: sellingPrice,
        formula: "default",
        calculatedAt: new Date(),
      };
    }

    let onlinePrice = sellingPrice;

    try {
      if (formula.startsWith("markup:")) {
        const percentage = parseFloat(formula.substring(7));
        onlinePrice = costPrice * (1 + percentage / 100);
      } else if (formula.startsWith("add:")) {
        const amount = parseFloat(formula.substring(4));
        onlinePrice = sellingPrice + amount;
      } else if (formula.startsWith("percent:")) {
        const percentage = parseFloat(formula.substring(8));
        onlinePrice = sellingPrice * (percentage / 100);
      } else {
        onlinePrice = sellingPrice;
      }
    } catch (error) {
      console.error("Error calculating online price:", error);
      onlinePrice = sellingPrice;
    }

    return {
      onlinePrice: Math.round(onlinePrice * 100) / 100, // Round to 2 decimal places
      formula,
      calculatedAt: new Date(),
    };
  }

  // Image upload utilities
  async uploadProductImages(product: Product): Promise<WebflowAsset[]> {
    const uploadedAssets: WebflowAsset[] = [];

    if (!product.images || !Array.isArray(product.images)) {
      return uploadedAssets;
    }

    for (const imageData of product.images) {
      try {
        if (typeof imageData === "object" && imageData.url) {
          const asset = await this.client.uploadAsset({
            url: imageData.url,
            fileName: `${product.sku}-${Date.now()}.jpg`,
            displayName: `${product.name} - ${imageData.alt || "Product Image"}`,
            alt: imageData.alt || product.name,
          });
          uploadedAssets.push(asset);
        }
      } catch (error) {
        console.error(
          `Failed to upload image for product ${product.id}:`,
          error
        );
        // Continue with other images
      }
    }

    return uploadedAssets;
  }

  // Collection setup and validation
  async setupWebflowCollections(): Promise<{
    success: boolean;
    collections: any;
    errors: string[];
  }> {
    try {
      const result = await this.collectionManager.setupCollections();
      return result;
    } catch (error) {
      return {
        success: false,
        collections: {},
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  async validateWebflowConnection(): Promise<{
    valid: boolean;
    site?: any;
    collections?: any;
    error?: string;
  }> {
    try {
      const connectionResult = await this.client.validateConnection();
      if (!connectionResult.valid) {
        return connectionResult;
      }

      const collectionsResult =
        await this.collectionManager.validateCollections();

      return {
        valid: connectionResult.valid && collectionsResult.valid,
        site: connectionResult.site,
        collections: collectionsResult,
        error: collectionsResult.valid
          ? undefined
          : collectionsResult.issues.join(", "),
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Product sync methods
  async syncProduct(productId: number, forceSync = false): Promise<SyncResult> {
    try {
      // Get product with relations
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          brand: true,
        },
      });

      if (!product) {
        return {
          success: false,
          errors: ["Product not found"],
          retryable: false,
        };
      }

      // Check if product should be synced
      if (!product.showInWebflow && !forceSync) {
        return {
          success: false,
          errors: ["Product is marked as not to be synced to Webflow"],
          retryable: false,
        };
      }

      // Get collections
      const collections = await this.collectionManager.getCollections();
      if (!collections.products) {
        return {
          success: false,
          errors: ["Products collection not found in Webflow"],
          retryable: true,
        };
      }

      // Check existing sync record
      const syncRecord = await prisma.webflow_sync.findFirst({
        where: {
          entity_type: "product",
          entity_id: productId,
        },
      });

      // Calculate online price if needed
      const priceResult = this.calculateOnlinePrice(
        Number(product.cost),
        Number(product.price),
        product.onlinePriceFormula
      );

      // Upload images
      const uploadedImages = await this.uploadProductImages(product);

      // Prepare Webflow item data
      const webflowData = {
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: product.name,
          slug: product.webflowSlug || this.generateSlug(product.name),
          description: product.description || "",
          "short-description": product.metaContent || "",
          sku: product.sku,
          barcode: product.barcode || "",
          "cost-price": Number(product.cost),
          "selling-price": Number(product.price),
          "online-price": priceResult.onlinePrice,
          "stock-quantity": product.stock,
          "min-stock-level": product.minStock,
          "in-stock": product.stock > 0,
          "show-in-store": product.showInWebflow,
          weight: product.weight ? Number(product.weight) : null,
          dimensions: product.dimensions || "",
          status: product.status,
          category: product.category ? product.category.id : null,
          brand: product.brand ? product.brand.id : null,
          images: uploadedImages.map((img) => img.id),
          "featured-image":
            uploadedImages.length > 0 ? uploadedImages[0].id : null,
          tags: product.tags.join(", "),
          "meta-title": product.metaTitle || product.name,
          "meta-description":
            product.metaDescription || product.description || "",
          "inventory-id": product.id,
          "last-synced": new Date().toISOString(),
        },
      };

      let webflowItem: WebflowItem;

      // Create or update in Webflow
      if (syncRecord?.webflow_item_id) {
        // Update existing item
        webflowItem = await this.client.updateCollectionItem(
          collections.products.id,
          syncRecord.webflow_item_id,
          webflowData
        );
      } else {
        // Create new item
        webflowItem = await this.client.createCollectionItem(
          collections.products.id,
          webflowData
        );
      }

      // Update or create sync record
      const syncData = {
        entity_type: "product",
        entity_id: productId,
        product_id: productId,
        webflow_collection_id: collections.products.id,
        webflow_item_id: webflowItem.id!,
        sync_status: "synced",
        last_sync_at: new Date(),
        sync_errors: null,
        sync_data: {
          webflowData,
          uploadedImages: uploadedImages.map((img) => ({
            id: img.id,
            url: img.url,
          })),
          priceCalculation: priceResult,
        },
        retry_count: 0,
        next_retry_at: null,
        last_error_details: null,
        is_published: false,
        auto_sync: true,
      };

      if (syncRecord) {
        await prisma.webflow_sync.update({
          where: { id: syncRecord.id },
          data: syncData,
        });
      } else {
        await prisma.webflow_sync.create({
          data: syncData,
        });
      }

      // Update product with online price
      await prisma.product.update({
        where: { id: productId },
        data: {
          onlinePrice: priceResult.onlinePrice,
        },
      });

      return {
        success: true,
        webflowItemId: webflowItem.id!,
        webflowUrl: `https://webflow.com/design/${process.env.WEBFLOW_SITE_ID}/cms/collections/${collections.products.id}/items/${webflowItem.id}`,
        errors: [],
        retryable: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update sync record with error
      await this.updateSyncError(productId, "product", errorMessage);

      return {
        success: false,
        errors: [errorMessage],
        retryable: this.isRetryableError(error),
      };
    }
  }

  // Category sync methods
  async syncCategory(categoryId: number): Promise<SyncResult> {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return {
          success: false,
          errors: ["Category not found"],
          retryable: false,
        };
      }

      if (!category.showInWebflow) {
        return {
          success: false,
          errors: ["Category is marked as not to be synced to Webflow"],
          retryable: false,
        };
      }

      const collections = await this.collectionManager.getCollections();
      if (!collections.categories) {
        return {
          success: false,
          errors: ["Categories collection not found in Webflow"],
          retryable: true,
        };
      }

      const webflowData = {
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: category.name,
          slug: category.webflowSlug || this.generateSlug(category.name),
          description: category.description || "",
          image: category.image || null,
          active: category.isActive,
          "sort-order": category.sortOrder || 0,
          "meta-title": category.metaTitle || category.name,
          "meta-description":
            category.metaDescription || category.description || "",
          "inventory-id": category.id,
          "last-synced": new Date().toISOString(),
        },
      };

      const syncRecord = await prisma.webflow_sync.findFirst({
        where: {
          entity_type: "category",
          entity_id: categoryId,
        },
      });

      let webflowItem: WebflowItem;

      if (syncRecord?.webflow_item_id) {
        webflowItem = await this.client.updateCollectionItem(
          collections.categories.id,
          syncRecord.webflow_item_id,
          webflowData
        );
      } else {
        webflowItem = await this.client.createCollectionItem(
          collections.categories.id,
          webflowData
        );
      }

      const syncData = {
        entity_type: "category",
        entity_id: categoryId,
        webflow_collection_id: collections.categories.id,
        webflow_item_id: webflowItem.id!,
        sync_status: "synced",
        last_sync_at: new Date(),
        sync_errors: null,
        sync_data: { webflowData },
        retry_count: 0,
        next_retry_at: null,
        last_error_details: null,
        is_published: false,
        auto_sync: true,
      };

      if (syncRecord) {
        await prisma.webflow_sync.update({
          where: { id: syncRecord.id },
          data: syncData,
        });
      } else {
        await prisma.webflow_sync.create({
          data: syncData,
        });
      }

      return {
        success: true,
        webflowItemId: webflowItem.id!,
        webflowUrl: `https://webflow.com/design/${process.env.WEBFLOW_SITE_ID}/cms/collections/${collections.categories.id}/items/${webflowItem.id}`,
        errors: [],
        retryable: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.updateSyncError(categoryId, "category", errorMessage);

      return {
        success: false,
        errors: [errorMessage],
        retryable: this.isRetryableError(error),
      };
    }
  }

  // Brand sync methods
  async syncBrand(brandId: number): Promise<SyncResult> {
    try {
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        return {
          success: false,
          errors: ["Brand not found"],
          retryable: false,
        };
      }

      if (!brand.showInWebflow) {
        return {
          success: false,
          errors: ["Brand is marked as not to be synced to Webflow"],
          retryable: false,
        };
      }

      const collections = await this.collectionManager.getCollections();
      if (!collections.brands) {
        return {
          success: false,
          errors: ["Brands collection not found in Webflow"],
          retryable: true,
        };
      }

      const webflowData = {
        isArchived: false,
        isDraft: false,
        fieldData: {
          name: brand.name,
          slug: brand.webflowSlug || this.generateSlug(brand.name),
          description: brand.description || "",
          logo: brand.image || null,
          website: brand.website || "",
          active: brand.isActive || false,
          "sort-order": brand.sortOrder || 0,
          "meta-title": brand.metaTitle || brand.name,
          "meta-description": brand.metaDescription || brand.description || "",
          "inventory-id": brand.id,
          "last-synced": new Date().toISOString(),
        },
      };

      const syncRecord = await prisma.webflow_sync.findFirst({
        where: {
          entity_type: "brand",
          entity_id: brandId,
        },
      });

      let webflowItem: WebflowItem;

      if (syncRecord?.webflow_item_id) {
        webflowItem = await this.client.updateCollectionItem(
          collections.brands.id,
          syncRecord.webflow_item_id,
          webflowData
        );
      } else {
        webflowItem = await this.client.createCollectionItem(
          collections.brands.id,
          webflowData
        );
      }

      const syncData = {
        entity_type: "brand",
        entity_id: brandId,
        webflow_collection_id: collections.brands.id,
        webflow_item_id: webflowItem.id!,
        sync_status: "synced",
        last_sync_at: new Date(),
        sync_errors: null,
        sync_data: { webflowData },
        retry_count: 0,
        next_retry_at: null,
        last_error_details: null,
        is_published: false,
        auto_sync: true,
      };

      if (syncRecord) {
        await prisma.webflow_sync.update({
          where: { id: syncRecord.id },
          data: syncData,
        });
      } else {
        await prisma.webflow_sync.create({
          data: syncData,
        });
      }

      return {
        success: true,
        webflowItemId: webflowItem.id!,
        webflowUrl: `https://webflow.com/design/${process.env.WEBFLOW_SITE_ID}/cms/collections/${collections.brands.id}/items/${webflowItem.id}`,
        errors: [],
        retryable: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.updateSyncError(brandId, "brand", errorMessage);

      return {
        success: false,
        errors: [errorMessage],
        retryable: this.isRetryableError(error),
      };
    }
  }

  // Bulk sync methods
  async bulkSyncProducts(productIds: number[]): Promise<BulkSyncResult> {
    const result: BulkSyncResult = {
      totalItems: productIds.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const productId of productIds) {
      try {
        const syncResult = await this.syncProduct(productId);
        if (syncResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push({
            entityId: productId,
            entityType: "product",
            error: syncResult.errors.join(", "),
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          entityId: productId,
          entityType: "product",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }

  async bulkSyncAll(): Promise<{
    products: BulkSyncResult;
    categories: BulkSyncResult;
    brands: BulkSyncResult;
  }> {
    // Get all entities marked for Webflow sync
    const [products, categories, brands] = await Promise.all([
      prisma.product.findMany({
        where: { showInWebflow: true },
        select: { id: true },
      }),
      prisma.category.findMany({
        where: { showInWebflow: true },
        select: { id: true },
      }),
      prisma.brand.findMany({
        where: { showInWebflow: true },
        select: { id: true },
      }),
    ]);

    const [productsResult, categoriesResult, brandsResult] = await Promise.all([
      this.bulkSyncProducts(products.map((p) => p.id)),
      this.bulkSyncCategories(categories.map((c) => c.id)),
      this.bulkSyncBrands(brands.map((b) => b.id)),
    ]);

    return {
      products: productsResult,
      categories: categoriesResult,
      brands: brandsResult,
    };
  }

  async bulkSyncCategories(categoryIds: number[]): Promise<BulkSyncResult> {
    const result: BulkSyncResult = {
      totalItems: categoryIds.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const categoryId of categoryIds) {
      try {
        const syncResult = await this.syncCategory(categoryId);
        if (syncResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push({
            entityId: categoryId,
            entityType: "category",
            error: syncResult.errors.join(", "),
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          entityId: categoryId,
          entityType: "category",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }

  async bulkSyncBrands(brandIds: number[]): Promise<BulkSyncResult> {
    const result: BulkSyncResult = {
      totalItems: brandIds.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const brandId of brandIds) {
      try {
        const syncResult = await this.syncBrand(brandId);
        if (syncResult.success) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push({
            entityId: brandId,
            entityType: "brand",
            error: syncResult.errors.join(", "),
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          entityId: brandId,
          entityType: "brand",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }

  // Utility methods
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  private async updateSyncError(
    entityId: number,
    entityType: string,
    error: string
  ): Promise<void> {
    try {
      const existingRecord = await prisma.webflow_sync.findFirst({
        where: {
          entity_type: entityType,
          entity_id: entityId,
        },
      });

      const errorData = {
        sync_status: "failed",
        sync_errors: error,
        last_error_details: {
          error,
          timestamp: new Date().toISOString(),
        },
        retry_count: existingRecord ? (existingRecord.retry_count || 0) + 1 : 1,
        next_retry_at: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
      };

      if (existingRecord) {
        await prisma.webflow_sync.update({
          where: { id: existingRecord.id },
          data: errorData,
        });
      } else {
        await prisma.webflow_sync.create({
          data: {
            ...errorData,
            entity_type: entityType,
            entity_id: entityId,
          },
        });
      }
    } catch (dbError) {
      console.error("Failed to update sync error:", dbError);
    }
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Rate limiting, network errors, server errors are retryable
      return (
        message.includes("rate limit") ||
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("503") ||
        message.includes("502") ||
        message.includes("500")
      );
    }
    return true; // Default to retryable for unknown errors
  }

  // Sync status and management
  async getSyncStatus(): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
    byType: {
      products: {
        total: number;
        pending: number;
        synced: number;
        failed: number;
      };
      categories: {
        total: number;
        pending: number;
        synced: number;
        failed: number;
      };
      brands: {
        total: number;
        pending: number;
        synced: number;
        failed: number;
      };
    };
  }> {
    const [total, pending, completed, failed] = await Promise.all([
      prisma.webflow_sync.count(),
      prisma.webflow_sync.count({ where: { sync_status: "pending" } }),
      prisma.webflow_sync.count({ where: { sync_status: "synced" } }),
      prisma.webflow_sync.count({ where: { sync_status: "failed" } }),
    ]);

    const [productStats, categoryStats, brandStats] = await Promise.all([
      this.getEntitySyncStats("product"),
      this.getEntitySyncStats("category"),
      this.getEntitySyncStats("brand"),
    ]);

    return {
      total,
      pending,
      synced: completed,
      failed,
      byType: {
        products: productStats,
        categories: categoryStats,
        brands: brandStats,
      },
    };
  }

  private async getEntitySyncStats(entityType: string): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
  }> {
    const [total, pending, completed, failed] = await Promise.all([
      prisma.webflow_sync.count({ where: { entity_type: entityType } }),
      prisma.webflow_sync.count({
        where: { entity_type: entityType, sync_status: "pending" },
      }),
      prisma.webflow_sync.count({
        where: { entity_type: entityType, sync_status: "synced" },
      }),
      prisma.webflow_sync.count({
        where: { entity_type: entityType, sync_status: "failed" },
      }),
    ]);

    return { total, pending, synced: completed, failed };
  }
}

// Export singleton instance
export const webflowSyncService = new WebflowSyncService();
