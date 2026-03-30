'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Monitor, Maximize, PanelTop, PanelBottom, Bell } from 'lucide-react';
import { useEditorStore } from '@/lib/flows/editor-store';
import type { FlowDisplayType, FlowFrequency, FlowStatus, FlowTriggerType } from '@/lib/flows/types';
import ConditionsBuilder from './ConditionsBuilder';

const DISPLAY_TYPE_OPTIONS: { value: FlowDisplayType; label: string; icon: React.ReactNode }[] = [
  { value: 'modal', label: 'Modal', icon: <Monitor className="w-3.5 h-3.5" /> },
  { value: 'fullscreen', label: 'Fullscreen', icon: <Maximize className="w-3.5 h-3.5" /> },
  { value: 'top_banner', label: 'Top Banner', icon: <PanelTop className="w-3.5 h-3.5" /> },
  { value: 'bottom_banner', label: 'Bottom Banner', icon: <PanelBottom className="w-3.5 h-3.5" /> },
  { value: 'notification', label: 'Notification', icon: <Bell className="w-3.5 h-3.5" /> },
];

const DISPLAY_TYPE_LABELS: Record<FlowDisplayType, string> = {
  modal: 'Modal',
  fullscreen: 'Fullscreen',
  top_banner: 'Top Banner',
  bottom_banner: 'Bottom Banner',
  notification: 'Notification',
};

const TRIGGER_TYPE_LABELS: Record<FlowTriggerType, string> = {
  login: 'On Login',
  manual: 'Manual',
  page_load: 'On Page Load',
};

export default function FlowSettingsPanel({ flowId }: { flowId: string }) {
  const { flow, updateFlow, settingsPanelOpen, toggleSettingsPanel } = useEditorStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!flow) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/admin/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_type: flow.display_type,
          modal_dismissible: flow.modal_dismissible,
          modal_backdrop: flow.modal_backdrop,
          trigger_type: flow.trigger_type,
          trigger_delay_seconds: flow.trigger_delay_seconds,
          frequency: flow.frequency,
          status: flow.status,
          conditions: flow.conditions,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? 'Failed to save settings');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch {
      setSaveError('Network error — please try again');
    } finally {
      setIsSaving(false);
    }
  };

  const collapsed = !settingsPanelOpen;

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={toggleSettingsPanel}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-sm font-semibold text-slate-700">Flow Settings</span>
        </div>
        {/* Collapsed summary */}
        {collapsed && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="capitalize">{DISPLAY_TYPE_LABELS[flow.display_type]}</span>
            <span className="text-slate-300">·</span>
            <span>{TRIGGER_TYPE_LABELS[flow.trigger_type]}</span>
            <span className="text-slate-300">·</span>
            <span className="capitalize">{flow.frequency.replace(/_/g, ' ')}</span>
            {flow.status !== 'draft' && (
              <>
                <span className="text-slate-300">·</span>
                <span
                  className={`capitalize px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    flow.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700'
                      : flow.status === 'paused'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {flow.status}
                </span>
              </>
            )}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {settingsPanelOpen && (
        <div className="px-4 pb-4 pt-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Display Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Display Type</label>
              <div className="flex flex-wrap gap-1.5">
                {DISPLAY_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      updateFlow({
                        display_type: opt.value,
                        ...(opt.value !== 'modal'
                          ? { modal_dismissible: null, modal_backdrop: null }
                          : {}),
                      })
                    }
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                      flow.display_type === opt.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-primary'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Status</label>
              <select
                value={flow.status}
                onChange={(e) => updateFlow({ status: e.target.value as FlowStatus })}
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Modal-specific options */}
          {flow.display_type === 'modal' && (
            <div className="flex gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">Dismissible</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flow.modal_dismissible ?? false}
                    onChange={(e) => updateFlow({ modal_dismissible: e.target.checked })}
                    className="rounded border-slate-300 text-primary focus:ring-primary/30"
                  />
                  <span className="text-xs text-slate-700">Allow users to dismiss</span>
                </label>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-medium text-slate-600">Backdrop</label>
                <select
                  value={flow.modal_backdrop ?? 'blur'}
                  onChange={(e) =>
                    updateFlow({
                      modal_backdrop: e.target.value as 'blur' | 'dark' | 'none',
                    })
                  }
                  className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="blur">Blur</option>
                  <option value="dark">Dark</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Trigger Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Trigger</label>
              <select
                value={flow.trigger_type}
                onChange={(e) => {
                  const newTrigger = e.target.value as FlowTriggerType;
                  updateFlow({
                    trigger_type: newTrigger,
                    ...(newTrigger !== 'page_load' ? { trigger_delay_seconds: null } : {}),
                  });
                }}
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="login">On Login</option>
                <option value="manual">Manual</option>
                <option value="page_load">On Page Load</option>
              </select>
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">Frequency</label>
              <select
                value={flow.frequency}
                onChange={(e) => updateFlow({ frequency: e.target.value as FlowFrequency })}
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="once">Once</option>
                <option value="every_login">Every Login</option>
                <option value="every_session">Every Session</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Delay seconds — only for page_load */}
          {flow.trigger_type === 'page_load' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-600">
                Delay (seconds)
              </label>
              <input
                type="number"
                min={0}
                value={flow.trigger_delay_seconds ?? 0}
                onChange={(e) =>
                  updateFlow({ trigger_delay_seconds: parseInt(e.target.value, 10) || 0 })
                }
                className="w-32 text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          )}

          {/* Conditions */}
          <div className="border-t border-slate-200 pt-3">
            <ConditionsBuilder
              conditions={flow.conditions ?? []}
              onChange={(conditions) => updateFlow({ conditions })}
            />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="text-sm font-medium bg-primary text-white px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-medium">Settings saved</span>
            )}
            {saveError && (
              <span className="text-xs text-red-600">{saveError}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
