'use client';

import EmailTemplatesList from '../components/EmailTemplatesList';

export default function EmailTemplatesPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Email Templates</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Manage email template content and delivery settings</p>
      </div>

      <EmailTemplatesList />
    </div>
  );
}
