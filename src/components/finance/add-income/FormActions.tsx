'use client';

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
      <Button type="submit" isLoading={isSubmitting} loadingText={loadingText}>
        {submitText}
      </Button>
    </div>
  );
}
