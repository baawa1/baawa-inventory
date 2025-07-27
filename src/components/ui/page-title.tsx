import { CardTitle, CardDescription } from '@/components/ui/card';

export function PageTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-2 px-1">
      <CardTitle className="text-3xl font-bold">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </div>
  );
}
