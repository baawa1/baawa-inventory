import React from "react";

interface DashboardPageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DashboardPageLayout({
  title,
  description,
  actions,
  children,
  footer,
}: DashboardPageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </header>
      <main className="flex-1 px-4 lg:px-6">{children}</main>
      {footer && <footer className="px-4 py-4">{footer}</footer>}
    </div>
  );
}
