'use client';

import { useEffect, useState } from 'react';
import type {
  ActiveFlowResponse,
  FlowBranch,
  FlowStep,
} from '@/lib/flows/types';
import { Analytics } from '@/lib/analytics/events';
import { ElementRenderer } from './elements';
import FlowProgress from './FlowProgress';
import FlowNavigation from './FlowNavigation';
import FlowPlayerModal from './FlowPlayerModal';
import FlowPlayerFullscreen from './FlowPlayerFullscreen';
import FlowPlayerBanner from './FlowPlayerBanner';
import FlowPlayerNotification from './FlowPlayerNotification';

// ─── Types ─────────────────────────────────────────────────────────────────

type StepWithBranches = FlowStep & { branches: FlowBranch[] };

// ─── Helpers ───────────────────────────────────────────────────────────────

function resolveNextStepIndex(
  currentStep: StepWithBranches,
  answers: Record<string, unknown>,
  steps: StepWithBranches[],
  currentIndex: number
): number {
  // Try branch resolution first
  for (const branch of currentStep.branches) {
    const answerValue = answers[branch.element_key];
    // Support string or array (multi-choice)
    const matches =
      answerValue === branch.answer_value ||
      (Array.isArray(answerValue) && answerValue.includes(branch.answer_value));
    if (matches) {
      const targetIndex = steps.findIndex((s) => s.id === branch.target_step_id);
      if (targetIndex !== -1) return targetIndex;
    }
  }
  // Sequential fallback
  return currentIndex + 1;
}

function isRequiredFieldSatisfied(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value instanceof File) return true;
  return Boolean(value);
}

// ─── StepContent ───────────────────────────────────────────────────────────

interface StepContentProps {
  step: StepWithBranches;
  stepIndex: number;
  totalSteps: number;
  answers: Record<string, unknown>;
  onAnswerChange: (key: string, value: unknown) => void;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
}

function StepContent({
  step,
  stepIndex,
  totalSteps,
  answers,
  onAnswerChange,
  onBack,
  onNext,
  onComplete,
  canGoBack,
  canGoNext,
  isLastStep,
  isSubmitting,
}: StepContentProps) {
  return (
    <div className="space-y-6">
      <FlowProgress currentStep={stepIndex + 1} totalSteps={totalSteps} />

      {step.title && (
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {step.title}
        </h2>
      )}

      <div className="space-y-5">
        {step.elements.map((element) => (
          <ElementRenderer
            key={element.element_key}
            element={element}
            value={answers[element.element_key] ?? ''}
            onChange={(value) => onAnswerChange(element.element_key, value)}
            disabled={isSubmitting}
          />
        ))}
      </div>

      <FlowNavigation
        onBack={onBack}
        onNext={onNext}
        onComplete={onComplete}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        isLastStep={isLastStep}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ─── FlowPlayer ────────────────────────────────────────────────────────────

export default function FlowPlayer() {
  const [activeFlow, setActiveFlow] = useState<ActiveFlowResponse | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Allows banner/notification CTA to upgrade to modal display
  const [overrideDisplay, setOverrideDisplay] = useState<'modal' | null>(null);

  // ── Fetch active flow on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchActiveFlow() {
      try {
        const res = await fetch('/api/flows/active?trigger=login', {
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Not authenticated — silently ignore
            return;
          }
          throw new Error(`Failed to fetch active flow: ${res.status}`);
        }

        const data: ActiveFlowResponse = await res.json();
        if (cancelled) return;

        if (!data.flow) {
          setIsLoading(false);
          return;
        }

        // Resume from last completed step
        let startIndex = 0;
        const loadedAnswers: Record<string, unknown> = {};

        if (data.response) {
          // Load existing answers
          if (data.response.responses) {
            Object.assign(loadedAnswers, data.response.responses);
          }
          // Resume from next step after last_step_id
          if (data.response.last_step_id) {
            const lastIndex = data.steps.findIndex(
              (s) => s.id === data.response!.last_step_id
            );
            if (lastIndex !== -1 && lastIndex + 1 < data.steps.length) {
              startIndex = lastIndex + 1;
            }
          }
        }

        setActiveFlow(data);
        setCurrentStepIndex(startIndex);
        setAnswers(loadedAnswers);
        // Track onboarding start (only on first load, not resume)
        if (!data.response) {
          Analytics.onboardingStarted(data.flow.name);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load flow');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchActiveFlow();
    return () => { cancelled = true; };
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────
  if (isLoading || !activeFlow || !activeFlow.flow) return null;
  if (error) return null; // Silent failure — don't interrupt app

  const steps = activeFlow.steps;
  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  const isLastStep = currentStepIndex === steps.length - 1;

  // Required field validation for current step
  const allRequiredSatisfied = currentStep.elements.every((element) => {
    if (!element.required) return true;
    return isRequiredFieldSatisfied(answers[element.element_key]);
  });

  const canGoNext = allRequiredSatisfied && !isSubmitting;
  const canGoBack = currentStepIndex > 0;

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleAnswerChange = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (!canGoNext) return;
    setIsSubmitting(true);

    try {
      // Build current-step answers (only this step's element keys)
      const currentStepAnswers: Record<string, unknown> = {};
      for (const element of currentStep.elements) {
        if (answers[element.element_key] !== undefined) {
          currentStepAnswers[element.element_key] = answers[element.element_key];
        }
      }

      const res = await fetch(`/api/flows/${activeFlow.flow.id}/respond`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_id: currentStep.id,
          answers: currentStepAnswers,
          actions: currentStep.elements.length > 0 ? undefined : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Step submission failed: ${res.status}`);
      }

      const result = await res.json();

      // Handle action results
      if (result.actionResults) {
        for (const actionResult of result.actionResults) {
          if (actionResult.action === 'redirect' && actionResult.url) {
            window.location.href = actionResult.url;
            return;
          }
          if (actionResult.action === 'success_popup' && actionResult.message) {
            alert(actionResult.message);
          }
        }
      }

      // Branch resolution + advance
      const nextIndex = resolveNextStepIndex(currentStep, answers, steps, currentStepIndex);
      setCurrentStepIndex(nextIndex);
    } catch (err) {
      console.error('[FlowPlayer] Step submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStepIndex((i) => i - 1);
    }
  };

  const handleComplete = async () => {
    if (!canGoNext) return;
    setIsSubmitting(true);

    try {
      // Submit last step answers first
      const currentStepAnswers: Record<string, unknown> = {};
      for (const element of currentStep.elements) {
        if (answers[element.element_key] !== undefined) {
          currentStepAnswers[element.element_key] = answers[element.element_key];
        }
      }

      // Submit last step response
      if (currentStep.elements.length > 0) {
        await fetch(`/api/flows/${activeFlow.flow.id}/respond`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step_id: currentStep.id,
            answers: currentStepAnswers,
          }),
        });
      }

      // Mark complete
      await fetch(`/api/flows/${activeFlow.flow.id}/complete`, {
        method: 'POST',
        credentials: 'include',
      });

      Analytics.onboardingCompleted(activeFlow.flow.name);
      setActiveFlow(null);
    } catch (err) {
      console.error('[FlowPlayer] Flow completion error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setActiveFlow(null);
  };

  // ── Step content shared across display types ─────────────────────────────

  const stepContent = (
    <StepContent
      step={currentStep}
      stepIndex={currentStepIndex}
      totalSteps={steps.length}
      answers={answers}
      onAnswerChange={handleAnswerChange}
      onBack={handleBack}
      onNext={handleNext}
      onComplete={handleComplete}
      canGoBack={canGoBack}
      canGoNext={canGoNext}
      isLastStep={isLastStep}
      isSubmitting={isSubmitting}
    />
  );

  // ── Render by display type ───────────────────────────────────────────────

  const { display_type, modal_dismissible, modal_backdrop } = activeFlow.flow;

  // Effective display: banner/notification CTA can upgrade to modal
  const effectiveDisplay = overrideDisplay ?? display_type;

  // Helper: extract banner text from first info_text element or fall back to flow name
  const bannerText = (() => {
    for (const step of activeFlow.steps) {
      for (const el of step.elements) {
        if (el.type === 'info_text' && el.content) return el.content;
      }
    }
    return activeFlow.flow.name;
  })();

  // Helper: notification body from first info_text element, or flow description, or ''
  const notificationBody = (() => {
    for (const step of activeFlow.steps) {
      for (const el of step.elements) {
        if (el.type === 'info_text' && el.content) return el.content;
      }
    }
    return activeFlow.flow.description ?? '';
  })();

  // When user dismisses an overridden modal, reset override and clear flow
  const handleOverrideDismiss = () => {
    setOverrideDisplay(null);
    setActiveFlow(null);
  };

  switch (effectiveDisplay) {
    case 'modal':
      return (
        <FlowPlayerModal
          dismissible={overrideDisplay === 'modal' ? true : (modal_dismissible ?? false)}
          backdrop={modal_backdrop}
          onDismiss={overrideDisplay === 'modal' ? handleOverrideDismiss : handleDismiss}
        >
          {stepContent}
        </FlowPlayerModal>
      );

    case 'fullscreen':
      return (
        <FlowPlayerFullscreen>
          {stepContent}
        </FlowPlayerFullscreen>
      );

    case 'top_banner':
      return (
        <FlowPlayerBanner
          position="top"
          text={bannerText}
          ctaLabel="Start"
          onCtaClick={() => setOverrideDisplay('modal')}
          onClose={handleDismiss}
        />
      );

    case 'bottom_banner':
      return (
        <FlowPlayerBanner
          position="bottom"
          text={bannerText}
          ctaLabel="Start"
          onCtaClick={() => setOverrideDisplay('modal')}
          onClose={handleDismiss}
        />
      );

    case 'notification':
      return (
        <FlowPlayerNotification
          title={activeFlow.flow.name}
          body={notificationBody}
          actionLabel="Start"
          onAction={() => setOverrideDisplay('modal')}
          onClose={handleDismiss}
        />
      );

    default:
      return null;
  }
}
