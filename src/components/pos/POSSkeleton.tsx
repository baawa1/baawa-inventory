import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface POSProductGridSkeletonProps {
  count?: number;
}

function POSProductCardSkeleton() {
  return (
    <Card className="overflow-hidden pt-0 pb-1">
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden">
          <Skeleton className="h-full w-full rounded-none" />
          <Skeleton className="absolute top-2 left-2 h-5 w-20 rounded-full" />
          <Skeleton className="absolute top-2 right-2 h-5 w-14 rounded-full" />
        </div>
        <div className="space-y-3 p-3 sm:p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-16 rounded-full sm:w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function POSProductGridSkeleton({
  count = 8,
}: POSProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <POSProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

function POSCartItemSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
      <Skeleton className="h-16 w-16 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

export function POSInterfaceSkeleton() {
  return (
    <div className="flex h-[calc(100vh-49px)] flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center justify-between border-b p-3 sm:p-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36 sm:h-8 sm:w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Skeleton className="h-9 w-24 sm:w-36" />
          <Skeleton className="hidden h-9 w-24 sm:block" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 sm:gap-6 sm:p-6 lg:grid-cols-3">
        <div className="flex min-h-0 flex-col lg:col-span-2">
          <div className="bg-background mb-3 flex-shrink-0 space-y-3 sm:mb-4 sm:space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-10 sm:hidden" />
              <Skeleton className="hidden h-10 w-10 sm:block" />
              <Skeleton className="hidden h-10 w-10 sm:block" />
            </div>
            <div className="hidden gap-4 sm:flex">
              <Skeleton className="h-10 w-full sm:w-[200px]" />
              <Skeleton className="h-10 w-full sm:w-[200px]" />
              <Skeleton className="h-10 w-28" />
            </div>
            <div className="hidden items-center justify-between sm:flex">
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
            <POSProductGridSkeleton />
          </div>
        </div>

        <div className="flex min-h-0 flex-col lg:h-full lg:max-h-[calc(100vh-120px)]">
          <Card className="flex min-h-0 flex-1 flex-col gap-0 py-4">
            <CardHeader className="flex-shrink-0 px-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-14" />
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <div className="flex-1">
                {Array.from({ length: 4 }).map((_, index) => (
                  <POSCartItemSkeleton key={index} />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-2 flex flex-shrink-0 flex-col gap-2 sm:mt-4 sm:gap-3">
            <Card className="gap-0 py-0 sm:py-3">
              <CardHeader className="hidden pb-2 sm:block md:pb-0 2xl:pb-4">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="hidden justify-between sm:flex">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="hidden justify-between sm:flex">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-px w-full rounded-none" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16 sm:h-6 sm:w-20" />
                  <Skeleton className="h-6 w-28 sm:h-7 sm:w-32" />
                </div>
              </CardContent>
            </Card>

            <Skeleton className="h-12 w-full sm:h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
