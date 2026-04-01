'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useEditorStore } from '@/lib/flows/editor-store';
import type { StepAction, StepActionType } from '@/lib/flows/editor-store';

const ACTION_TYPE_LABELS: Record<StepActionType, string> = {
  save_to_profile: 'Save to Profile',
  send_email: 'Send Email',
  kit_tag: 'Kit Tag',
  stripe_checkout: 'Stripe Checkout',
  redirect: 'Redirect',
  trigger_flow: 'Trigger Flow',
  success_popup: 'Success Popup',
  mark_complete: 'Mark Complete',
};

const ACTION_TYPE_COLORS: Record<StepActionType, string> = {
  save_to_profile: 'bg-blue-50 text-blue-700 border-blue-200',
  send_email: 'bg-violet-50 text-violet-700 border-violet-200',
  kit_tag: 'bg-orange-50 text-orange-700 border-orange-200',
  stripe_checkout: 'bg-green-50 text-green-700 border-green-200',
  redirect: 'bg-slate-50 text-slate-700 border-slate-200',
  trigger_flow: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  success_popup: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  mark_complete: 'bg-teal-50 text-teal-700 border-teal-200',
};

const ACTION_TYPES: StepActionType[] = [
  'save_to_profile',
  'send_email',
  'kit_tag',
  'stripe_checkout',
  'redirect',
  'trigger_flow',
  'success_popup',
  'mark_complete',
];

const defaultConfig = (type: StepActionType): Record<string, unknown> => {
  switch (type) {
    case 'send_email':
      return { subject: '', body: '' };
    case 'kit_tag':
      return { tag_name: '' };
    case 'stripe_checkout':
      return { price_id: '', success_url: '' };
    case 'redirect':
      return { url: '' };
    case 'trigger_flow':
      return { flow_id: '' };
    case 'success_popup':
      return { title: '', message: '' };
    default:
      return {};
  }
};

interface ActionCardProps {
  action: StepAction;
  index: number;
  onRemove: () => void;
  onConfigChange: (updates: Record<string, unknown>) => void;
  profileMappings: Record<string, string>;
}

function ActionCard({ action, index, onRemove, onConfigChange, profileMappings }: ActionCardProps) {
  const colorClass = ACTION_TYPE_COLORS[action.type];
  const config = action.config;

  const field = (
    label: string,
    key: string,
    type: 'text' | 'textarea' = 'text',
    placeholder?: string
  ) => (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {type === 'textarea' ? (
        <textarea
          rows={3}
          value={(config[key] as string) ?? ''}
          onChange={(e) => onConfigChange({ [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary resize-none"
        />
      ) : (
        <input
          type="text"
          value={(config[key] as string) ?? ''}
          onChange={(e) => onConfigChange({ [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
        />
      )}
    </div>
  );

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">#{index + 1}</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
          >
            {ACTION_TYPE_LABELS[action.type]}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-300 hover:text-red-500 transition-colors p-0.5"
          title="Remove action"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Config fields */}
      <div className="p-3 space-y-2">
        {action.type === 'save_to_profile' && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Profile Mappings</p>
            {Object.keys(profileMappings).length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No profile mappings configured — set them in Element Properties
              </p>
            ) : (
              <div className="space-y-1">
                {Object.entries(profileMappings).map(([key, field]) => (
                  <div key={key} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                      {key}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="font-mono text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                      {field}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {action.type === 'send_email' && (
          <>
            {field('Subject', 'subject', 'text', 'Email subject line')}
            {field('Body Template', 'body', 'textarea', 'Email body — supports {{variable}} placeholders')}
          </>
        )}

        {action.type === 'kit_tag' && field('Tag Name', 'tag_name', 'text', 'kit_tag_name')}

        {action.type === 'stripe_checkout' && (
          <>
            {field('Price ID', 'price_id', 'text', 'price_...')}
            {field('Success URL', 'success_url', 'text', 'https://example.com/success')}
          </>
        )}

        {action.type === 'redirect' && field('URL', 'url', 'text', 'https://...')}

        {action.type === 'trigger_flow' && (
          field('Flow ID', 'flow_id', 'text', 'flow_id (UUID)')
        )}

        {action.type === 'success_popup' && (
          <>
            {field('Title', 'title', 'text', 'Well done!')}
            {field('Message', 'message', 'textarea', 'Popup message shown to the user')}
          </>
        )}

        {action.type === 'mark_complete' && (
          <p className="text-xs text-slate-400 italic">
            No configuration needed — marks this flow as completed for the user
          </p>
        )}
      </div>
    </div>
  );
}

export default function StepActionsEditor() {
  const { selectedStepId, stepActions, addStepAction, removeStepAction, updateStepAction, profileMappings } =
    useEditorStore();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!selectedStepId) {
    return (
      <div className="p-4">
        <p className="text-xs text-slate-400">Select a step to configure its actions</p>
      </div>
    );
  }

  const actions = stepActions[selectedStepId] ?? [];

  const handleAdd = (type: StepActionType) => {
    addStepAction(selectedStepId, { type, config: defaultConfig(type) });
    setShowDropdown(false);
  };

  const handleConfigChange = (index: number, updates: Record<string, unknown>) => {
    updateStepAction(selectedStepId, index, { config: updates });
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Step Actions</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          >
            Add Action
            <ChevronDown className="w-3 h-3" />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
              {ACTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleAdd(type)}
                  className="w-full text-left text-xs text-slate-700 px-3 py-2 hover:bg-slate-50 transition-colors"
                >
                  {ACTION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {actions.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          No actions — add one to run logic after this step completes
        </p>
      ) : (
        <div className="space-y-2">
          {actions.map((action, index) => (
            <ActionCard
              key={index}
              action={action}
              index={index}
              onRemove={() => removeStepAction(selectedStepId, index)}
              onConfigChange={(updates) => handleConfigChange(index, updates)}
              profileMappings={profileMappings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
