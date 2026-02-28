import type { ComponentProps, HTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpinnerSize = 'sm' | 'md' | 'lg';

const spinnerSizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

interface SpinnerProps extends ComponentProps<'svg'> {
  size?: SpinnerSize;
}

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <Loader2
      data-slot="spinner"
      className={cn('animate-spin', spinnerSizeClasses[size], className)}
      {...props}
    />
  );
}

interface InlineLoadingProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  spinnerSize?: SpinnerSize;
  spinnerPlacement?: 'left' | 'right';
}

export function InlineLoading({
  label = 'Loading...',
  spinnerSize = 'sm',
  spinnerPlacement = 'left',
  className,
  ...props
}: InlineLoadingProps) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center gap-2 text-sm',
        className
      )}
      {...props}
    >
      {spinnerPlacement === 'left' && <Spinner size={spinnerSize} />}
      {label && <span>{label}</span>}
      {spinnerPlacement === 'right' && <Spinner size={spinnerSize} />}
    </div>
  );
}

interface PageLoadingProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  spinnerSize?: SpinnerSize;
}

export function PageLoading({
  title = 'Loading',
  description,
  spinnerSize = 'lg',
  className,
  ...props
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        'flex min-h-[60vh] items-center justify-center px-6 py-12',
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <Spinner size={spinnerSize} className="text-primary" />
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
