'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreditSubmissionForm from './CreditSubmissionForm';

interface Props {
  teachingOnly?: boolean;
}

export default function CreditSubmissionFormToggle({ teachingOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-[#4E87A0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3A7190] transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {teachingOnly ? 'Log Teaching Hours' : 'Submit Credits'}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(false)}
        className="mb-4 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Hide form
      </button>
      <CreditSubmissionForm teachingOnly={teachingOnly} onSuccess={handleSuccess} />
    </div>
  );
}
