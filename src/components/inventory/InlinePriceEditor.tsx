'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  IconEdit, 
  IconCheck, 
  IconX, 
  IconTrendingUp,
  IconCalculator 
} from '@tabler/icons-react';
import { useUpdateProduct } from '@/hooks/api/products';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: number;
  name: string;
  cost?: number;
  price?: number;
}

interface InlinePriceEditorProps {
  product: Product;
  canEdit: boolean;
  showProfitMargin?: boolean;
}

const InlinePriceEditor = memo<InlinePriceEditorProps>(function InlinePriceEditor({ 
  product, 
  canEdit, 
  showProfitMargin = true 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<'cost' | 'price' | null>(null);
  const [tempCost, setTempCost] = useState((product.cost || 0).toString());
  const [tempPrice, setTempPrice] = useState((product.price || 0).toString());

  const updateProductMutation = useUpdateProduct();

  // Memoize profit calculations to prevent unnecessary recalculations
  const profitMetrics = useMemo(() => {
    const cost = product.cost || 0;
    const price = product.price || 0;
    const profitAmount = price - cost;
    const profitMargin = cost > 0 ? ((profitAmount / price) * 100) : 0;
    const markupPercentage = cost > 0 ? ((profitAmount / cost) * 100) : 0;

    return {
      profitAmount,
      profitMargin,
      markupPercentage,
    };
  }, [product.cost, product.price]);

  // Reset temp values when product changes
  useEffect(() => {
    setTempCost((product.cost || 0).toString());
    setTempPrice((product.price || 0).toString());
  }, [product.cost, product.price]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleSave = useCallback(async (field: 'cost' | 'price') => {
    const value = field === 'cost' ? tempCost : tempPrice;
    const numericValue = parseFloat(value);

    if (isNaN(numericValue) || numericValue < 0) {
      toast.error(`Please enter a valid ${field} value`);
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        [field]: numericValue
      });
      
      toast.success(`${field === 'cost' ? 'Cost price' : 'Selling price'} updated successfully`);
      setIsEditing(false);
      setEditingField(null);
    } catch (error) {
      toast.error(`Failed to update ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Reset to original values
      if (field === 'cost') {
        setTempCost((product.cost || 0).toString());
      } else {
        setTempPrice((product.price || 0).toString());
      }
    }
  }, [product.id, tempCost, tempPrice, updateProductMutation]);

  const handleCancel = useCallback(() => {
    setTempCost((product.cost || 0).toString());
    setTempPrice((product.price || 0).toString());
    setIsEditing(false);
    setEditingField(null);
  }, [product.cost, product.price]);

  // Memoize color calculation function
  const getProfitColor = useCallback((margin: number) => {
    if (margin < 0) return 'text-red-600 bg-red-50';
    if (margin < 10) return 'text-orange-600 bg-orange-50';
    if (margin < 25) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  }, []);

  if (!canEdit) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">
            {formatCurrency(product.price || 0)}
          </div>
        </div>
        {showProfitMargin && (
          <div className="flex items-center gap-1">
            <IconTrendingUp className="h-3 w-3 text-gray-400" />
            <Badge 
              variant="secondary" 
              className={`text-xs px-1.5 py-0.5 ${getProfitColor(profitMetrics.profitMargin)}`}
            >
              {profitMetrics.profitMargin.toFixed(1)}% margin
            </Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {/* Cost Price Editor */}
        {editingField === 'cost' ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={tempCost}
              onChange={(e) => setTempCost(e.target.value)}
              className="h-7 w-20 text-xs"
              placeholder="Cost"
              step="0.01"
              min="0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave('cost');
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => handleSave('cost')}
              disabled={updateProductMutation.isPending}
            >
              <IconCheck className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={handleCancel}
            >
              <IconX className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditingField('cost');
              setIsEditing(true);
            }}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded"
            disabled={editingField !== null}
          >
            <span>Cost: {formatCurrency(product.cost || 0)}</span>
            <IconEdit className="h-3 w-3" />
          </button>
        )}
        
        <span className="text-xs text-gray-400">→</span>

        {/* Selling Price Editor */}
        {editingField === 'price' ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              className="h-7 w-24 text-xs"
              placeholder="Price"
              step="0.01"
              min="0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave('price');
                } else if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => handleSave('price')}
              disabled={updateProductMutation.isPending}
            >
              <IconCheck className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={handleCancel}
            >
              <IconX className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditingField('price');
              setIsEditing(true);
            }}
            className="flex items-center gap-1 text-sm font-medium hover:text-blue-600 hover:bg-blue-50 px-1 py-0.5 rounded"
            disabled={editingField !== null}
          >
            <span>{formatCurrency(product.price || 0)}</span>
            <IconEdit className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Profit Margin Display */}
      {showProfitMargin && !isEditing && (
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 hover:bg-gray-50 px-1 py-0.5 rounded">
                <IconCalculator className="h-3 w-3 text-gray-400" />
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1.5 py-0.5 ${getProfitColor(profitMetrics.profitMargin)}`}
                >
                  {profitMetrics.profitMargin.toFixed(1)}%
                </Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64" side="top">
              <div className="space-y-2">
                <div className="font-medium text-sm">Profit Analysis</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Selling Price:</span>
                    <span className="font-medium">{formatCurrency(product.price || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost Price:</span>
                    <span className="font-medium">{formatCurrency(product.cost || 0)}</span>
                  </div>
                  <div className="border-t pt-1 flex justify-between">
                    <span>Profit Amount:</span>
                    <span className={`font-medium ${profitMetrics.profitAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitMetrics.profitAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className={`font-medium ${profitMetrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMetrics.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Markup:</span>
                    <span className={`font-medium ${profitMetrics.markupPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitMetrics.markupPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t">
                  <div>Margin = (Price - Cost) / Price × 100%</div>
                  <div>Markup = (Price - Cost) / Cost × 100%</div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {updateProductMutation.isPending && (
        <div className="text-xs text-blue-600">Saving...</div>
      )}
    </div>
  );
});

export { InlinePriceEditor };