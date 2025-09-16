import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconDots } from '@tabler/icons-react';

export interface TableAction {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  hidden?: boolean;
  requiresConfirmation?: boolean;
}

export interface TableActionMenuProps {
  actions: TableAction[];
  align?: 'start' | 'center' | 'end';
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const TableActionMenu: React.FC<TableActionMenuProps> = ({ 
  actions, 
  align = 'end', 
  label = 'Actions',
  className,
  disabled = false
}) => {
  const visibleActions = actions.filter(action => !action.hidden);
  
  if (visibleActions.length === 0) {
    return null;
  }

  const hasEnabledActions = visibleActions.some(action => !action.disabled);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`h-8 w-8 p-0 ${className || ''}`}
          disabled={disabled || !hasEnabledActions}
        >
          <IconDots className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[160px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {visibleActions.map((action, index) => {
          const isDestructive = action.variant === 'destructive';
          const shouldShowSeparator = index > 0 && 
            isDestructive && 
            visibleActions[index - 1].variant !== 'destructive';

          return (
            <React.Fragment key={action.key}>
              {shouldShowSeparator && <DropdownMenuSeparator />}
              
              {action.href ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={action.href}
                    className={`flex items-center gap-2 ${
                      isDestructive ? 'text-red-600 focus:text-red-600' : ''
                    } ${action.disabled ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {action.icon}
                    {action.label}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`flex items-center gap-2 ${
                    isDestructive ? 'text-red-600 focus:text-red-600' : ''
                  }`}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              )}
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Pre-configured action factories for common operations
export const createViewAction = (href?: string, onClick?: () => void): TableAction => ({
  key: 'view',
  label: 'View Details',
  icon: <i className="w-4 h-4" />, // Will be replaced with actual icon in implementation
  href,
  onClick,
  variant: 'default',
});

export const createEditAction = (href?: string, onClick?: () => void): TableAction => ({
  key: 'edit',
  label: 'Edit',
  icon: <i className="w-4 h-4" />, // Will be replaced with actual icon in implementation
  href,
  onClick,
  variant: 'default',
});

export const createDeleteAction = (onClick: () => void, disabled = false): TableAction => ({
  key: 'delete',
  label: 'Delete',
  icon: <i className="w-4 h-4" />, // Will be replaced with actual icon in implementation
  onClick,
  variant: 'destructive',
  disabled,
});

export const createArchiveAction = (onClick: () => void, disabled = false): TableAction => ({
  key: 'archive',
  label: 'Archive',
  icon: <i className="w-4 h-4" />, // Will be replaced with actual icon in implementation
  onClick,
  variant: 'destructive',
  disabled,
});

export const createDuplicateAction = (onClick: () => void, disabled = false): TableAction => ({
  key: 'duplicate',
  label: 'Duplicate',
  icon: <i className="w-4 h-4" />, // Will be replaced with actual icon in implementation
  onClick,
  variant: 'default',
  disabled,
});

// Entity-specific action builders
export const buildProductActions = ({
  product,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
  onAddStock,
}: {
  product: any;
  canEdit: boolean;
  canDelete: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddStock?: () => void;
}): TableAction[] => {
  const actions: TableAction[] = [];

  if (onView) {
    actions.push({
      key: 'view',
      label: 'View Details',
      icon: <i className="w-4 h-4" />,
      onClick: onView,
    });
  }

  if (canEdit && onEdit) {
    actions.push({
      key: 'edit',
      label: 'Edit Product',
      icon: <i className="w-4 h-4" />,
      onClick: onEdit,
    });
  }

  if (canEdit && onAddStock) {
    actions.push({
      key: 'addStock',
      label: 'Add Stock',
      icon: <i className="w-4 h-4" />,
      onClick: onAddStock,
    });
  }

  if (canDelete && onDelete) {
    actions.push({
      key: 'delete',
      label: 'Archive',
      icon: <i className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'destructive',
    });
  }

  return actions;
};

export const buildCouponActions = ({
  coupon,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  coupon: any;
  canEdit: boolean;
  canDelete: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}): TableAction[] => {
  const actions: TableAction[] = [];

  if (canEdit && onEdit) {
    actions.push({
      key: 'edit',
      label: 'Edit Coupon',
      icon: <i className="w-4 h-4" />,
      href: `/pos/coupons/${coupon.id}/edit`,
    });
  }

  if (canDelete && onDelete) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      icon: <i className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'destructive',
    });
  }

  return actions;
};

export const buildCategoryActions = ({
  category,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  category: any;
  canEdit: boolean;
  canDelete: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}): TableAction[] => {
  const actions: TableAction[] = [];

  if (onView) {
    actions.push({
      key: 'view',
      label: 'View Details',
      icon: <i className="w-4 h-4" />,
      onClick: onView,
    });
  }

  if (canEdit) {
    actions.push({
      key: 'edit',
      label: 'Edit Category',
      icon: <i className="w-4 h-4" />,
      href: `/inventory/categories/${category.id}/edit`,
    });
  }

  if (canDelete && onDelete) {
    actions.push({
      key: 'delete',
      label: 'Delete',
      icon: <i className="w-4 h-4" />,
      onClick: onDelete,
      variant: 'destructive',
    });
  }

  return actions;
};