import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { UpdateProductFormData } from './types';

interface SEOMarketingSectionProps {
  _form: UseFormReturn<UpdateProductFormData>;
}

export function SEOMarketingSection({ _form }: SEOMarketingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO & Marketing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          SEO and marketing features have been simplified. Only basic product
          information is available.
        </p>
      </CardContent>
    </Card>
  );
}
