'use client';

import { useState } from 'react';
import { submitCreditEntry } from '../actions';
import { cn } from '@/lib/cn';
import { GraduationCap, Heart, Flower2, Users, Info, ChevronRight, ChevronLeft, Minus, Plus, CheckCircle2 } from 'lucide-react';
import Button from '@/app/components/ui/Button';

interface Props {
  isTeacher: boolean;
  teachingOnly?: boolean;
  onSuccess?: () => void;
}

type CreditTypeOption = 'ce' | 'karma' | 'practice' | 'teaching';

interface CategoryCard {
  value: CreditTypeOption;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export default function CreditSubmissionForm({ isTeacher, teachingOnly = false, onSuccess }: Props) {
  const totalSteps = teachingOnly ? 4 : 5;
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<CreditTypeOption>(teachingOnly ? 'teaching' : 'ce');
  const [amount, setAmount] = useState(1);
  const [activityDate, setActivityDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Map logical steps based on teachingOnly mode
  // teachingOnly skips category step (step 2 in normal flow)
  function getLogicalStep() {
    if (teachingOnly && step >= 2) return step + 1;
    return step;
  }

  const logicalStep = getLogicalStep();
  const progressWidth = `${(step / totalSteps) * 100}%`;

  const categories: CategoryCard[] = [
    {
      value: 'ce',
      label: 'CE Credits',
      description: 'Continuing Education — courses, trainings, seminars',
      icon: <GraduationCap className="w-6 h-6" />,
    },
    {
      value: 'karma',
      label: 'Karma Hours',
      description: 'Community service and doing good in the world',
      icon: <Heart className="w-6 h-6" />,
    },
    {
      value: 'practice',
      label: 'Practice Hours',
      description: 'Personal yoga practice sessions',
      icon: <Flower2 className="w-6 h-6" />,
    },
    ...(isTeacher
      ? [
          {
            value: 'teaching' as CreditTypeOption,
            label: 'Teaching Hours',
            description: 'Hours spent actively teaching yoga',
            icon: <Users className="w-6 h-6" />,
          },
        ]
      : []),
  ];

  function handleNext() {
    setStep(s => Math.min(s + 1, totalSteps));
  }

  function handlePrev() {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  }

  function incrementAmount() {
    setAmount(a => Math.min(a + 0.5, 250));
  }

  function decrementAmount() {
    setAmount(a => Math.max(a - 0.5, 0.5));
  }

  function isDateValid() {
    if (!activityDate) return false;
    return activityDate >= twoYearsAgo && activityDate <= today;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');

    const { error: insertError } = await submitCreditEntry({
      creditType: selectedType,
      amount,
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
    setSelectedType(teachingOnly ? 'teaching' : 'ce');
    setAmount(1);
    setActivityDate('');
    setDescription('');
    setError('');
    setSuccess(false);
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-primary-dark mb-2">Submitted for Review</h3>
        <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
          Your submission is pending approval. You&apos;ll see it in your history once a GOYA team member reviews it.
        </p>
        <Button onClick={handleReset}>Submit Another</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {/* Step 1 — Intro */}
      {logicalStep === 1 && (
        <div className="animate-step-in">
          <h3 className="text-lg font-semibold text-primary-dark mb-1">
            {teachingOnly ? 'Log Teaching Hours' : 'Submit New Credits'}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            {teachingOnly
              ? 'Track the hours you spend teaching yoga classes, workshops, and private sessions.'
              : 'Get Started: Add Continuing Education, Karma, or Practice Credit Hours'}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm text-slate-600 space-y-2">
            <p>Please submit one activity per submission. Each entry should represent a single session, course, or event.</p>
            <p>All submissions are reviewed and approved by GOYA staff. Credits will appear in your history once approved.</p>
          </div>
          <div className="flex items-start gap-2.5 bg-primary-50 border border-primary-100 rounded-lg px-3.5 py-2.5 mb-6">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary font-medium">Submissions are reviewed within 5 business days.</p>
          </div>
          <Button onClick={handleNext} iconRight={<ChevronRight className="w-4 h-4" />}>
            Next
          </Button>
        </div>
      )}

      {/* Step 2 — Choose Category (skipped when teachingOnly) */}
      {logicalStep === 2 && (
        <div className="animate-step-in">
          <h3 className="text-lg font-semibold text-primary-dark mb-1">Choose Category</h3>
          <p className="text-sm text-slate-500 mb-5">What type of activity would you like to log?</p>

          <div className="space-y-3 mb-6">
            {categories.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedType(cat.value)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer',
                  selectedType === cat.value
                    ? 'border-primary bg-primary-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                )}
              >
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                    selectedType === cat.value
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {cat.icon}
                </div>
                <div>
                  <p className={cn(
                    'font-semibold text-sm',
                    selectedType === cat.value ? 'text-primary-dark' : 'text-slate-700'
                  )}>
                    {cat.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePrev} icon={<ChevronLeft className="w-4 h-4" />}>
              Previous
            </Button>
            <Button onClick={handleNext} iconRight={<ChevronRight className="w-4 h-4" />}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Hours Amount */}
      {logicalStep === 3 && (
        <div className="animate-step-in">
          <h3 className="text-lg font-semibold text-primary-dark mb-1">How many hours?</h3>
          <p className="text-sm text-slate-500 mb-8">Enter the number of hours for this activity.</p>

          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={decrementAmount}
                disabled={amount <= 0.5}
                className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min={0.5}
                max={250}
                step={0.5}
                value={amount}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0.5 && val <= 250) setAmount(val);
                }}
                className="w-24 h-16 text-center text-3xl font-bold text-primary-dark border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={incrementAmount}
                disabled={amount >= 250}
                className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">Minimum 0.5, increments of 0.5</p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePrev} icon={<ChevronLeft className="w-4 h-4" />}>
              Previous
            </Button>
            <Button onClick={handleNext} iconRight={<ChevronRight className="w-4 h-4" />}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Activity Date */}
      {logicalStep === 4 && (
        <div className="animate-step-in">
          <h3 className="text-lg font-semibold text-primary-dark mb-1">When did this take place?</h3>
          <p className="text-sm text-slate-500 mb-8">Select the date of the activity.</p>

          <div className="flex flex-col items-center mb-8">
            <input
              type="date"
              value={activityDate}
              onChange={e => setActivityDate(e.target.value)}
              min={twoYearsAgo}
              max={today}
              className="w-full max-w-xs border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-primary-dark text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
            />
            <p className="text-xs text-slate-400 mt-3">Must be within the last 2 years.</p>
            {activityDate && !isDateValid() && (
              <p className="text-xs text-rose-500 mt-1">Please select a date within the last 2 years.</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePrev} icon={<ChevronLeft className="w-4 h-4" />}>
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isDateValid()}
              iconRight={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 5 — Description + Submit */}
      {logicalStep === 5 && (
        <div className="animate-step-in">
          <h3 className="text-lg font-semibold text-primary-dark mb-1">Describe the Activity</h3>
          <p className="text-sm text-slate-500 mb-5">Describe the activity so our team can verify it.</p>

          <div className="mb-6">
            <textarea
              value={description}
              onChange={e => {
                if (e.target.value.length <= 3000) setDescription(e.target.value);
              }}
              rows={6}
              required
              placeholder="E.g. I attended a 2-hour workshop on restorative yoga techniques led by [Instructor Name] on [Date]. The session covered..."
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-primary-dark placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className={cn('text-xs', description.length > 2800 ? 'text-orange-500' : 'text-slate-400')}>
                {description.length} / 3000
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handlePrev} icon={<ChevronLeft className="w-4 h-4" />}>
              Previous
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!description.trim()}
              loading={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Activity'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
