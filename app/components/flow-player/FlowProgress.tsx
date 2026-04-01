'use client';

interface FlowProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function FlowProgress({ currentStep, totalSteps }: FlowProgressProps) {
  const percent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div
        className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
