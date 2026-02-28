import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  loadingText,
  spinnerPlacement = 'left',
  spinnerSize = 'sm',
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: string;
    spinnerPlacement?: 'left' | 'right';
    spinnerSize?: 'sm' | 'md' | 'lg';
  }) {
  let onlyChild: React.ReactElement | null = null;
  if (asChild) {
    try {
      const child = React.Children.only(children);
      if (React.isValidElement(child)) {
        onlyChild = child;
      }
    } catch {
      onlyChild = null;
    }
  }
  const canUseAsChild = asChild && !!onlyChild;
  const spinnerSizeClass =
    spinnerSize === 'lg'
      ? 'h-6 w-6'
      : spinnerSize === 'md'
        ? 'h-5 w-5'
        : 'h-4 w-4';
  const fallbackText = typeof children === 'string' ? children : 'Loading...';
  const label = isLoading ? loadingText ?? fallbackText : children;
  const isDisabled = props.disabled || isLoading;
  if (asChild && !canUseAsChild && process.env.NODE_ENV !== 'production') {
    console.warn(
      'Button with `asChild` expects a single React element child. Falling back to a native button.'
    );
  }

  const content = canUseAsChild ? onlyChild : label;

  if (canUseAsChild && onlyChild) {
    const childProps = onlyChild.props as {
      className?: string;
      onClick?: React.MouseEventHandler;
    };
    const isIntrinsicButton =
      typeof onlyChild.type === 'string' && onlyChild.type === 'button';
    const composedClassName = cn(
      buttonVariants({ variant, size, className }),
      childProps.className
    );
    const buttonOnClick = props.onClick as
      | React.MouseEventHandler
      | undefined;
    const childOnClick = childProps.onClick;
    const composedOnClick =
      childOnClick || buttonOnClick || isDisabled
        ? (event: React.MouseEvent) => {
            if (isDisabled) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            childOnClick?.(event);
            buttonOnClick?.(event);
          }
        : undefined;

    const mergedProps: Record<string, unknown> = {
      ...(onlyChild.props as Record<string, unknown>),
      ...(props as Record<string, unknown>),
      className: composedClassName,
      'data-slot': 'button',
      'aria-busy': isLoading || undefined,
      'data-loading': isLoading || undefined,
      onClick: composedOnClick,
    };

    if (isDisabled) {
      if (isIntrinsicButton) {
        mergedProps.disabled = true;
      } else {
        mergedProps['aria-disabled'] = true;
        mergedProps['data-disabled'] = true;
        mergedProps.tabIndex = -1;
      }
    }

    return React.cloneElement(onlyChild, mergedProps);
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      aria-busy={isLoading || undefined}
      data-loading={isLoading || undefined}
      {...props}
      disabled={isDisabled}
    >
      {!canUseAsChild && isLoading && spinnerPlacement === 'left' && (
        <Loader2 className={cn('animate-spin', spinnerSizeClass)} />
      )}
      {content}
      {!canUseAsChild && isLoading && spinnerPlacement === 'right' && (
        <Loader2 className={cn('animate-spin', spinnerSizeClass)} />
      )}
    </button>
  );
}

export { Button, buttonVariants };
