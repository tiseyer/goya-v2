import { redirect } from 'next/navigation';

export default function EmailTemplatesRedirect() {
  redirect('/admin/emails?tab=templates');
}
