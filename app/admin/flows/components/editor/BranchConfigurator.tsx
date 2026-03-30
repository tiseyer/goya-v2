'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useEditorStore } from '@/lib/flows/editor-store';
import type { FlowBranch, FlowElementChoiceOption, UpsertBranchInput } from '@/lib/flows/types';

interface StepInfo {
  id: string;
  title: string | null;
  position: number;
}

interface BranchConfiguratorProps {
  flowId: string;
  stepId: string;
  elementKey: string;
  options: FlowElementChoiceOption[];
  currentBranches: FlowBranch[];
  allSteps: StepInfo[];
}

export default function BranchConfigurator({
  flowId,
  stepId,
  elementKey,
  options,
  currentBranches,
  allSteps,
}: BranchConfiguratorProps) {
  const { updateStepBranches } = useEditorStore();

  const [enabled, setEnabled] = useState(() =>
    currentBranches.some((b) => b.element_key === elementKey)
  );
  const [saving, setSaving] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local branch map: answerValue -> targetStepId ('' means "continue to next step")
  const [branchMap, setBranchMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const branch of currentBranches) {
      if (branch.element_key === elementKey) {
        map[branch.answer_value] = branch.target_step_id;
      }
    }
    return map;
  });

  const handleToggle = () => {
    if (enabled) {
      // Disabling: clear all branch mappings for this element
      setBranchMap({});
    }
    setEnabled((prev) => !prev);
    setCycleError(null);
    setSaveSuccess(false);
  };

  const handleTargetChange = (answerValue: string, targetStepId: string) => {
    setBranchMap((prev) => ({ ...prev, [answerValue]: targetStepId }));
    setCycleError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setCycleError(null);
    setSaveSuccess(false);

    // Build UpsertBranchInput array — only options with a non-empty target step
    const branches: UpsertBranchInput[] = enabled
      ? options
          .filter((opt) => branchMap[opt.value] && branchMap[opt.value] !== '')
          .map((opt) => ({
            step_id: stepId,
            element_key: elementKey,
            answer_value: opt.value,
            target_step_id: branchMap[opt.value],
          }))
      : [];

    try {
      const res = await fetch(`/api/admin/flows/${flowId}/steps/${stepId}/branches`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branches }),
      });

      if (res.status === 422) {
        const data = await res.json();
        const cyclePath: string[] = data.cyclePath ?? [];
        setCycleError(
          `Cannot save: branch creates a cycle through steps: ${cyclePath.join(' \u2192 ')}`
        );
        return;
      }

      if (!res.ok) {
        setCycleError('Failed to save branches. Please try again.');
        return;
      }

      const savedBranches: FlowBranch[] = await res.json();
      updateStepBranches(stepId, savedBranches);
      setSaveSuccess(true);
    } catch {
      setCycleError('Network error saving branches. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const otherSteps = allSteps.filter((s) => s.id !== stepId);

  return (
    <div className="space-y-3">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Branching</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-slate-500">{enabled ? 'Enabled' : 'Disabled'}</span>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              enabled ? 'bg-primary' : 'bg-slate-300'
            }`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-4.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      {enabled && (
        <>
          {options.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Add options above to configure branching.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Assign a target step for each answer. Leave blank to continue to the next step.
              </p>
              {options.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 min-w-0 flex-1 truncate font-medium">
                    {opt.label || opt.value}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <select
                    value={branchMap[opt.value] ?? ''}
                    onChange={(e) => handleTargetChange(opt.value, e.target.value)}
                    className="w-40 text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-colors"
                  >
                    <option value="">Continue to next</option>
                    {otherSteps.map((s) => (
                      <option key={s.id} value={s.id}>
                        Step {s.position}{s.title ? `: ${s.title}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-1 w-full text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Branches'}
          </button>

          {cycleError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {cycleError}
            </p>
          )}

          {saveSuccess && !cycleError && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded p-2">
              Branches saved successfully.
            </p>
          )}
        </>
      )}
    </div>
  );
}
