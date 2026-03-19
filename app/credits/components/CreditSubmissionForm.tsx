'use client';

import { useState } from 'react';
import { submitCreditEntry } from '../actions';

interface Props {
  teachingOnly?: boolean;
  onSuccess?: () => void;
}

type CreditTypeOption = 'karma' | 'practice' | 'ce' | 'teaching';

export default function CreditSubmissionForm({ teachingOnly = false, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<CreditTypeOption>(teachingOnly ? 'teaching' : 'karma');
  const [amount, setAmount] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  const creditTypeOptions: { value: CreditTypeOption; label: string }[] = [
    { value: 'karma', label: 'Karma Hours' },
    { value: 'practice', label: 'Practice Hours' },
    { value: 'ce', label: 'Continuing Education Credits' },
  ];

  async function handleSubmit() {
    setSubmitting(true);
    setError('');

    const { error: insertError } = await submitCreditEntry({
      creditType: selectedType,
      amount: Number(amount),
      activityDate,
      description,
    });

    if (insertError) {
      setError(insertError);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    onSuccess?.();
  }

  function handleReset() {
    setStep(1);
    setSelectedType(teachingOnly ? 'teaching' : 'karma');
    setAmount('');
    setActivityDate('');
    setDescription('');
    setError('');
    setSuccess(false);
  }

  if (success) {
    return (
      <div className="text-center py-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#1B3A5C] mb-2">Credits Submitted!</h3>
          <p className="text-sm text-slate-600 mb-6">Your credits have been submitted successfully!</p>
          <button
            onClick={handleReset}
            className="bg-[#4E87A0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3A7190] transition-colors"
          >
            Submit Another
          </button>
        </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#4E87A0] uppercase tracking-wide">Step {step} of 3</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4E87A0] rounded-full transition-all duration-300"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {/* Step 1 — Introduction */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold text-[#1B3A5C] mb-1">
            {teachingOnly ? 'Log Teaching Hours' : 'Submit New Credits'}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            {teachingOnly
              ? 'Track the hours you spend teaching yoga classes, workshops, and private sessions.'
              : 'Get Started: Add Continuing Education, Karma, or Practice Credit Hours'}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 space-y-2">
            <p>Please submit one activity per submission. Each entry should represent a single session, course, or event.</p>
            <p>All submissions are reviewed and approved by GOYA staff. Credits will appear in your history once approved.</p>
          </div>
          <button
            onClick={() => setStep(2)}
            className="bg-[#4E87A0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3A7190] transition-colors flex items-center gap-2"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Step 2 — Activity Details */}
      {step === 2 && (
        <div>
          <h3 className="text-lg font-semibold text-[#1B3A5C] mb-5">Activity Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              {/* Credit Category */}
              <div>
                <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">Credit Category</label>
                {teachingOnly ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                    <svg className="w-4 h-4 text-[#4E87A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Teaching Hours
                  </div>
                ) : (
                  <div className="space-y-2">
                    {creditTypeOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="creditType"
                          value={opt.value}
                          checked={selectedType === opt.value}
                          onChange={() => setSelectedType(opt.value)}
                          className="w-4 h-4 text-[#4E87A0] border-slate-300 focus:ring-[#4E87A0]"
                        />
                        <span className="text-sm text-[#374151] group-hover:text-[#1B3A5C] transition-colors">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">
                  {selectedType === 'ce' ? 'Credits Amount' : 'Hours Amount'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={250}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1B3A5C] placeholder:text-slate-400 focus:outline-none focus:border-[#4E87A0] focus:ring-1 focus:ring-[#4E87A0]/40"
                />
              </div>
            </div>

            {/* Right column */}
            <div>
              <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">Activity Date</label>
              <input
                type="date"
                value={activityDate}
                onChange={e => setActivityDate(e.target.value)}
                min={twoYearsAgo}
                max={today}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1B3A5C] focus:outline-none focus:border-[#4E87A0] focus:ring-1 focus:ring-[#4E87A0]/40"
              />
              <p className="text-xs text-slate-400 mt-1.5">Must be within the last 2 years</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={() => {
                if (!amount || !activityDate) return;
                setStep(3);
              }}
              disabled={!amount || !activityDate}
              className="bg-[#4E87A0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3A7190] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Activity Description */}
      {step === 3 && (
        <div>
          <h3 className="text-lg font-semibold text-[#1B3A5C] mb-1">Activity Description</h3>
          <p className="text-sm text-slate-500 mb-5">Describe the activity in detail so our team can verify your submission.</p>

          <div>
            <label className="block text-sm font-semibold text-[#1B3A5C] mb-2">Description <span className="text-rose-500">*</span></label>
            <textarea
              value={description}
              onChange={e => {
                if (e.target.value.length <= 3000) setDescription(e.target.value);
              }}
              rows={6}
              required
              placeholder="E.g. I attended a 2-hour workshop on restorative yoga techniques led by [Instructor Name] on [Date]. The session covered..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#1B3A5C] placeholder:text-slate-400 focus:outline-none focus:border-[#4E87A0] focus:ring-1 focus:ring-[#4E87A0]/40 resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${description.length > 2800 ? 'text-orange-500' : 'text-slate-400'}`}>
                {description.length} of 3000 max characters
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { setStep(2); setError(''); }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || submitting}
              className="bg-[#4E87A0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3A7190] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                'Submit Activity'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
