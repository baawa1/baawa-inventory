'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  onCancelAction: () => void;
}

export function FormActions({
  isSubmitting,
  onCancelAction,
}: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-4 border-t pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onCancelAction}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Product...
          </>
        ) : (
          'Create Product'
        )}
      </Button>
    </div>
  );
}
