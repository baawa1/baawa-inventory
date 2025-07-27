import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        {action && (
          <Button asChild>
            <a href={action.href} className="flex items-center gap-2">
              {action.icon}
              {action.label}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
