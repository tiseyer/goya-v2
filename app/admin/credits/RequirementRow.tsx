'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CreditRequirement, CreditType } from '@/lib/credits';

const CREDIT_CONFIG: Record<CreditType, { label: string; color: string; description: string }> = {
  ce: {
    label: 'CE Credits',
    color: 'text-teal-700 bg-teal-50 border-teal-200',
    description: 'Continuing Education Credits',
  },
  karma: {
    label: 'Karma Hours',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    description: 'Community service and contribution hours',
  },
  practice: {
    label: 'Practice Hours',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    description: 'Personal yoga practice hours',
  },
  teaching: {
    label: 'Teaching Hours',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    description: 'Hours spent actively teaching classes',
  },
  community: {
    label: 'Community Credits',
    color: 'text-violet-700 bg-violet-50 border-violet-200',
    description: 'Auto-awarded community participation credits',
  },
};

interface Props {
  requirement: CreditRequirement;
}

export default function RequirementRow({ requirement }: Props) {
  const config = CREDIT_CONFIG[requirement.credit_type];

  const [amount, setAmount] = useState(String(requirement.required_amount));
  const [period, setPeriod] = useState(String(requirement.period_months));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const originalAmount = String(requirement.required_amount);
  const originalPeriod = String(requirement.period_months);
  const isDirty = amount !== originalAmount || period !== originalPeriod;

  async function handleSave() {
    const newAmount = parseInt(amount, 10);
    const newPeriod = parseInt(period, 10);

    if (isNaN(newAmount) || newAmount < 0) {
      setFeedback({ type: 'error', message: 'Amount must be a non-negative number.' });
      return;
    }
    if (isNaN(newPeriod) || newPeriod < 1) {
      setFeedback({ type: 'error', message: 'Period must be at least 1 month.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from('credit_requirements')
      .update({
        required_amount: newAmount,
        period_months: newPeriod,
        updated_at: new Date().toISOString(),
      })
      .eq('credit_type', requirement.credit_type);

    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: error.message });
    } else {
      setFeedback({ type: 'success', message: 'Saved successfully.' });
      // Clear success message after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-slate-100 last:border-0">
      {/* Credit type identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}
          >
            {config.label}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">{config.description}</p>
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Required Amount */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Required Amount
          </label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/40 focus:border-[#00B5A3] transition-colors text-slate-700"
          />
        </div>

        {/* Period */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Period (months)
          </label>
          <input
            type="number"
            min={1}
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3]/40 focus:border-[#00B5A3] transition-colors text-slate-700"
          />
        </div>

        {/* Save button + hint */}
        <div className="flex flex-col gap-0.5 pt-[18px]">
          {isDirty ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-semibold bg-[#00B5A3] text-white rounded-lg hover:bg-[#009e8e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          ) : (
            <div className="h-[34px] flex items-center">
              <span className="text-[11px] text-slate-400">0 = no requirement</span>
            </div>
          )}
        </div>
      </div>

      {/* Inline feedback */}
      {feedback && (
        <div
          className={`w-full sm:w-auto text-xs font-medium px-3 py-1.5 rounded-lg ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
