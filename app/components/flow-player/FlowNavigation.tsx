'use client';

import { ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';

interface FlowNavigationProps {
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
}

export default function FlowNavigation({
  onBack,
  onNext,
  onComplete,
  canGoBack,
  canGoNext,
  isLastStep,
  isSubmitting,
}: FlowNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-4">
      {canGoBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>
      ) : (
        <div />
      )}

      {isLastStep ? (
        <button
          type="button"
          onClick={onComplete}
          disabled={!canGoNext || isSubmitting}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-lg px-6 py-2.5 font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle size={16} />
          )}
          Complete
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white rounded-lg px-6 py-2.5 font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Next
        </button>
      )}
    </div>
  );
}
