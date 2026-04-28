import { notFound } from 'next/navigation';
import { envConfig } from '@/lib/config/env-validation';
import { TestDataPageClient } from './test-data-page-client';

export default function TestDataPage() {
  if (!envConfig.isDevelopment) {
    notFound();
  }

  return <TestDataPageClient />;
}
