'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  isSubmitting: boolean;
  onCancelAction: () => void;
  submitText?: string;
  loadingText?: string;
}

export function FormActions({
  isSubmitting,
  onCancelAction,
  submitText = 'Create Income Transaction',
  loadingText = 'Creating...',
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
            {loadingText}
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );
}
