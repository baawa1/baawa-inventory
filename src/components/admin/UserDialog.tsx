'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserForm } from './UserForm';
import {
  type User,
  type UserFormData,
  type EditUserFormData,
} from './types/user';

interface UserDialogProps {
  isOpen: boolean;
  onOpenChangeAction: (_open: boolean) => void;
  user?: User | null;
  onSubmitAction: (_data: UserFormData | EditUserFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function UserDialog({
  isOpen,
  onOpenChangeAction,
  user,
  onSubmitAction,
  isSubmitting,
}: UserDialogProps) {
  const isEditing = !!user;

  const handleCancel = () => {
    onOpenChangeAction(false);
  };

  const handleSubmit = async (data: UserFormData | EditUserFormData) => {
    await onSubmitAction(data);
    if (!isEditing) {
      onOpenChangeAction(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the user information below.'
              : 'Fill in the details to create a new user account.'}
          </DialogDescription>
        </DialogHeader>
        <UserForm
          user={user}
          onSubmitAction={handleSubmit}
          onCancelAction={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
