import { redirect } from 'next/navigation';

// Redirect /inventory/products/new to /inventory/products/add
export default function NewProductRedirect() {
  redirect('/inventory/products/add');
}