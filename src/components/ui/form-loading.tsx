import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

interface FormLoadingProps {
  title: string;
  description: string;
  backUrl: string;
  backLabel: string;
  onBack: () => void;
}

export function FormLoading({
  title,
  description,
  backLabel,
  onBack,
}: FormLoadingProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4 px-4 lg:px-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>
        <PageHeader title={title} description={description} />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="mr-3 h-8 w-8 animate-spin" />
            <span>Loading form...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
