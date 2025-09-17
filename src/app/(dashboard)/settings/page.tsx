import { redirect } from 'next/navigation';

// Redirect /settings to /admin (admin settings section)
export default function SettingsRedirect() {
  redirect('/admin');
}