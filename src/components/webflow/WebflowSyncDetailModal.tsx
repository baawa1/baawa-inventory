"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  ExternalLink,
  Package,
  Tag,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { ProductWithSync } from "@/hooks/api/useWebflowSync";

interface WebflowSyncDetailModalProps {
  product: ProductWithSync | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebflowSyncDetailModal({
  product,
  open,
  onOpenChange,
}: WebflowSyncDetailModalProps) {
  if (!product) return null;

  const sync = product.webflowSync;
  const hasError = sync?.sync_status === "failed" && sync?.sync_errors;

  // Generate the data that would be sent to Webflow
  const webflowData = {
    name: product.name,
    slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: product.description || "",
    sku: product.sku,
    price: product.price,
    onlinePrice: product.price, // Use regular price for now
    stock: product.stock,
    inStock: product.stock > 0,
    category: product.category?.name || "Uncategorized",
    brand: product.brand?.name || "No Brand",
    metaTitle: product.metaTitle || product.name,
    metaDescription: product.metaDescription || product.description || "",
    showInWebflow: product.showInWebflow,
    images: product.images || [],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Webflow Sync Details: {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sync Status Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Sync Status</h3>

            <div className="flex items-center gap-3">
              {sync ? (
                <>
                  {sync.sync_status === "synced" && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Successfully Synced
                    </Badge>
                  )}
                  {sync.sync_status === "pending" && (
                    <Badge
                      variant="default"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Sync Pending
                    </Badge>
                  )}
                  {sync.sync_status === "failed" && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Sync Failed
                    </Badge>
                  )}
                  {sync.sync_status === "archived" && (
                    <Badge variant="secondary">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Archived
                    </Badge>
                  )}
                </>
              ) : (
                <Badge variant="secondary">Never Synced</Badge>
              )}

              {!product.showInWebflow && (
                <Badge variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Enabled for Webflow
                </Badge>
              )}
            </div>

            {sync?.last_sync_at && (
              <p className="text-sm text-muted-foreground">
                Last synced:{" "}
                {formatDistanceToNow(new Date(sync.last_sync_at), {
                  addSuffix: true,
                })}
              </p>
            )}

            {hasError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">Sync Error:</p>
                <p className="text-sm text-red-600 mt-1">{sync.sync_errors}</p>
              </div>
            )}

            {sync?.webflow_url && (
              <Button variant="outline" size="sm" asChild className="w-fit">
                <a
                  href={sync.webflow_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Webflow
                </a>
              </Button>
            )}
          </div>

          <Separator />

          {/* Data to be Synced Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Data to be Synced</h3>

            <div className="grid gap-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{webflowData.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SKU:</span>
                    <p className="font-mono">{webflowData.sku}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Slug:</span>
                    <p className="font-mono text-blue-600">
                      {webflowData.slug}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span>
                    <p className="font-medium">{webflowData.stock} units</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Store Price:</span>
                    <p className="font-medium">
                      {formatCurrency(webflowData.price)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Online Price:</span>
                    <p className="font-medium">
                      {formatCurrency(webflowData.onlinePrice)}
                      <span className="text-xs text-muted-foreground ml-2">
                        (same as store price)
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">In Stock:</span>
                    <Badge
                      variant={webflowData.inStock ? "default" : "secondary"}
                    >
                      {webflowData.inStock ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Categories & Brand */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categories & Brand
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{webflowData.category}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Brand:</span>
                    <p className="font-medium">{webflowData.brand}</p>
                  </div>
                </div>
              </div>

              {/* SEO & Content */}
              <div className="space-y-2">
                <h4 className="font-medium">SEO & Content</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Meta Title:</span>
                    <p className="font-medium">{webflowData.metaTitle}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Meta Description:
                    </span>
                    <p className="text-sm">
                      {webflowData.metaDescription || "No description"}
                    </p>
                  </div>
                  {webflowData.description && (
                    <div>
                      <span className="text-muted-foreground">
                        Description:
                      </span>
                      <p className="text-sm">{webflowData.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Images */}
              {webflowData.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">
                    Images ({webflowData.images.length})
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {webflowData.images
                      .slice(0, 4)
                      .map((image: any, index: number) => (
                        <img
                          key={index}
                          src={image.url || image}
                          alt={`Product image ${index + 1}`}
                          className="h-16 w-16 rounded object-cover border"
                        />
                      ))}
                    {webflowData.images.length > 4 && (
                      <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center text-xs">
                        +{webflowData.images.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sync Settings */}
              <div className="space-y-2">
                <h4 className="font-medium">Sync Settings</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Show in Webflow:
                    </span>
                    <Badge
                      variant={
                        webflowData.showInWebflow ? "default" : "secondary"
                      }
                    >
                      {webflowData.showInWebflow ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {sync && (
                    <div>
                      <span className="text-muted-foreground">Auto Sync:</span>
                      <Badge variant={sync.auto_sync ? "default" : "outline"}>
                        {sync.auto_sync ? "Enabled" : "Manual"}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!product.showInWebflow && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This product is not enabled for Webflow
                sync. Enable it in the product settings to sync this data to
                your website.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
