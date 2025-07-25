"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  isSubmitting: boolean;
  onCancelAction: () => void;
}

export function FormActions({
  isSubmitting,
  onCancelAction,
}: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-4 pt-6 border-t">
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
            Creating...
          </>
        ) : (
          "Create Income Transaction"
        )}
      </Button>
    </div>
  );
}
