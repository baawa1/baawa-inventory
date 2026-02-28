import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type GridSize = 1 | 2 | 3 | 4;
interface GridColumns {
  base?: GridSize;
  md?: GridSize;
  lg?: GridSize;
}

const gridClassMap: Record<GridSize, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

const gridMdClassMap: Record<GridSize, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
};

const gridLgClassMap: Record<GridSize, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

function gridColumnsClass(columns?: GridColumns) {
  const base = columns?.base ?? 1;
  const md = columns?.md ?? 2;
  const lg = columns?.lg ?? 4;
  return cn(gridClassMap[base], gridMdClassMap[md], gridLgClassMap[lg]);
}

interface PageHeaderSkeletonProps {
  titleWidth?: string;
  descriptionWidth?: string;
  actionsCount?: number;
  actionWidths?: string[];
  className?: string;
}

export function PageHeaderSkeleton({
  titleWidth = 'w-48',
  descriptionWidth = 'w-80',
  actionsCount = 0,
  actionWidths,
  className,
}: PageHeaderSkeletonProps) {
  const widths =
    actionWidths && actionWidths.length > 0
      ? actionWidths
      : Array.from({ length: actionsCount }).map(() => 'w-28');

  return (
    <div
      className={cn(
        'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
        className
      )}
    >
      <div className="space-y-2">
        <Skeleton className={cn('h-8', titleWidth)} />
        <Skeleton className={cn('h-4', descriptionWidth)} />
      </div>
      {actionsCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {widths.map((width, index) => (
            <Skeleton key={index} className={cn('h-9', width)} />
          ))}
        </div>
      )}
    </div>
  );
}

interface KpiCardSkeletonProps {
  className?: string;
}

export function KpiCardSkeleton({ className }: KpiCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24 rounded" />
        <Skeleton className="mt-2 h-3 w-16 rounded" />
      </CardContent>
    </Card>
  );
}

interface CardGridSkeletonProps {
  count?: number;
  columns?: GridColumns;
  className?: string;
}

export function CardGridSkeleton({
  count = 4,
  columns,
  className,
}: CardGridSkeletonProps) {
  return (
    <div className={cn('grid gap-4', gridColumnsClass(columns), className)}>
      {Array.from({ length: count }).map((_, index) => (
        <KpiCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface ChartCardSkeletonProps {
  height?: string;
  className?: string;
  showDescription?: boolean;
}

export function ChartCardSkeleton({
  height = 'h-[300px]',
  className,
  showDescription = true,
}: ChartCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-32 rounded" />
        {showDescription && <Skeleton className="h-4 w-48 rounded" />}
      </CardHeader>
      <CardContent>
        <Skeleton className={cn('w-full rounded', height)} />
      </CardContent>
    </Card>
  );
}

interface ListSkeletonProps {
  rows?: number;
  withAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({
  rows = 5,
  withAvatar = false,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            {withAvatar && <Skeleton className="h-8 w-8 rounded-full" />}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  withActions?: boolean;
  variant?: 'table' | 'cards';
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  withActions = false,
  variant = 'table',
  className,
}: TableSkeletonProps) {
  if (variant === 'cards') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <div className="border-b p-3">
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1 rounded" />
          ))}
          {withActions && <Skeleton className="h-4 w-10 rounded" />}
        </div>
      </div>
      <div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 border-b p-3 last:border-b-0"
          >
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton key={index} className="h-4 flex-1 rounded" />
            ))}
            {withActions && <Skeleton className="h-8 w-8 rounded" />}
          </div>
        ))}
      </div>
    </div>
  );
}

interface FormSkeletonProps {
  rows?: number;
  className?: string;
}

export function FormSkeleton({ rows = 6, className }: FormSkeletonProps) {
  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-6">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-9 w-full rounded" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-28 rounded" />
          <Skeleton className="h-9 w-28 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyticsPageSkeletonProps {
  className?: string;
}

export function AnalyticsPageSkeleton({
  className,
}: AnalyticsPageSkeletonProps) {
  return (
    <div className={cn('space-y-6 p-6', className)}>
      <PageHeaderSkeleton actionsCount={1} actionWidths={['w-[300px]']} />
      <CardGridSkeleton count={4} columns={{ base: 1, md: 2, lg: 4 }} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-5 w-32 rounded" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ListSkeleton rows={5} withAvatar />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-5 w-32 rounded" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ListSkeleton rows={5} withAvatar />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </CardHeader>
        <CardContent>
          <ListSkeleton rows={3} withAvatar />
        </CardContent>
      </Card>
    </div>
  );
}

interface DashboardPageSkeletonProps {
  className?: string;
}

export function DashboardPageSkeleton({
  className,
}: DashboardPageSkeletonProps) {
  return (
    <div className={cn('space-y-6 px-4 py-6 lg:px-6', className)}>
      <PageHeaderSkeleton />
      <CardGridSkeleton count={3} columns={{ base: 1, md: 3, lg: 3 }} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 rounded" />
        </CardHeader>
        <CardContent>
          <ListSkeleton rows={5} withAvatar />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 rounded" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
