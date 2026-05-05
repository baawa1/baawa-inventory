'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const detailDialogContentClassName =
  'max-h-[85vh] max-w-4xl overflow-y-auto';

export function DetailSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-3 rounded-lg border p-4', className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export function DetailMetric({
  label,
  value,
  accentClassName,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  accentClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <div
        className={cn(
          'mt-2 text-2xl font-semibold',
          accentClassName,
          valueClassName
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function DetailNotice({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900',
        className
      )}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="text-sm">{children}</div>
    </section>
  );
}
