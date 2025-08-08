import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { UpdateProductFormData } from './types';

interface PricingPromotionsSectionProps {
  _form: UseFormReturn<UpdateProductFormData>;
}

export function PricingPromotionsSection({
  _form,
}: PricingPromotionsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Promotions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Pricing and promotion features have been simplified. Only regular
          pricing is available.
        </p>
      </CardContent>
    </Card>
  );
}
