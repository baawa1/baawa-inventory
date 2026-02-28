'use client';

import { Button } from '@/components/ui/button';

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
  const loadingText = isSubmitting
    ? 'Creating Product...'
    : isImageUploading
      ? 'Uploading Images...'
      : undefined;

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
      <Button
        type="submit"
        isLoading={isDisabled}
        loadingText={loadingText}
      >
        Create Product
      </Button>
    </div>
  );
}
