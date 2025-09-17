'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  isImageUploading?: boolean;
  onCancelAction: () => void;
}

export function FormActions({
  isSubmitting,
  isImageUploading = false,
  onCancelAction,
}: FormActionsProps) {
  const isDisabled = isSubmitting || isImageUploading;

  return (
    <div className="flex justify-end space-x-4 border-t pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onCancelAction}
        disabled={isDisabled}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isDisabled}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Product...
          </>
        ) : isImageUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading Images...
          </>
        ) : (
          'Create Product'
        )}
      </Button>
    </div>
  );
}
