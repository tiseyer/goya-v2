'use client';

import { useEditorStore } from '@/lib/flows/editor-store';
import type { FlowElement, FlowElementChoiceOption } from '@/lib/flows/types';
import ProfileFieldMapper from './ProfileFieldMapper';

// Element types where "required" toggle is shown
const SUPPORTS_REQUIRED: FlowElement['type'][] = [
  'short_text',
  'long_text',
  'single_choice',
  'multi_choice',
  'dropdown',
  'image_upload',
];

// Element types that can map to a profile field
const SUPPORTS_PROFILE_MAPPING: FlowElement['type'][] = [
  'short_text',
  'long_text',
  'single_choice',
  'multi_choice',
  'dropdown',
];

// Element types that have options
const HAS_OPTIONS: FlowElement['type'][] = ['single_choice', 'multi_choice', 'dropdown'];

const TYPE_LABELS: Record<FlowElement['type'], string> = {
  info_text: 'Info Text',
  short_text: 'Short Text',
  long_text: 'Long Text',
  single_choice: 'Single Choice',
  multi_choice: 'Multi Choice',
  dropdown: 'Dropdown',
  image_upload: 'Image Upload',
  image: 'Image',
  video: 'Video',
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  multiline?: boolean;
}

function TextInput({ value, onChange, placeholder, mono, multiline }: TextInputProps) {
  const baseClass =
    'w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none';
  const monoClass = mono ? ' font-mono text-xs' : '';

  if (multiline) {
    return (
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={baseClass + monoClass}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={baseClass + monoClass}
    />
  );
}

interface OptionsEditorProps {
  options: FlowElementChoiceOption[];
  onChange: (options: FlowElementChoiceOption[]) => void;
}

function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const handleLabelChange = (index: number, label: string) => {
    const next = options.map((o, i) => (i === index ? { ...o, label } : o));
    onChange(next);
  };

  const handleValueChange = (index: number, value: string) => {
    const next = options.map((o, i) => (i === index ? { ...o, value } : o));
    onChange(next);
  };

  const handleDelete = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...options];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === options.length - 1) return;
    const next = [...options];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  const handleAdd = () => {
    const ts = Date.now();
    onChange([...options, { label: '', value: `option_${ts}` }]);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-600">Options</p>
      {options.length === 0 && (
        <p className="text-xs text-slate-400 italic">No options yet.</p>
      )}
      <div className="space-y-1.5">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20 disabled:cursor-not-allowed leading-none text-xs"
                title="Move up"
              >
                ▲
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === options.length - 1}
                className="text-slate-300 hover:text-slate-500 disabled:opacity-20 disabled:cursor-not-allowed leading-none text-xs"
                title="Move down"
              >
                ▼
              </button>
            </div>
            <input
              type="text"
              value={option.label}
              onChange={(e) => handleLabelChange(index, e.target.value)}
              placeholder="Label"
              className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <input
              type="text"
              value={option.value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              placeholder="Value"
              className="w-24 text-xs border border-slate-200 rounded px-2 py-1 bg-white font-mono text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              onClick={() => handleDelete(index)}
              className="shrink-0 text-slate-300 hover:text-red-500 transition-colors p-0.5"
              title="Remove option"
            >
              <span className="text-xs">✕</span>
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAdd}
        className="mt-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
      >
        + Add option
      </button>
    </div>
  );
}

export default function ElementPropertiesPanel() {
  const {
    selectedStepId,
    selectedElementKey,
    steps,
    updateElement,
    profileMappings,
    setProfileMapping,
  } = useEditorStore();

  if (!selectedStepId || !selectedElementKey) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-xs text-slate-400 text-center">
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const step = steps.find((s) => s.id === selectedStepId);
  const element = step?.elements.find((el) => el.element_key === selectedElementKey);

  if (!element) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-xs text-slate-400 text-center">Element not found</p>
      </div>
    );
  }

  const update = (updates: Partial<FlowElement>) => {
    updateElement(selectedStepId, selectedElementKey, updates);
  };

  const currentMapping = profileMappings[selectedElementKey] ?? null;

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Type badge */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">Element Type</p>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {TYPE_LABELS[element.type]}
        </span>
      </div>

      <hr className="border-slate-200" />

      {/* Common fields */}
      <Field label="Key">
        <TextInput
          value={element.element_key}
          onChange={(v) => update({ element_key: v } as Partial<FlowElement>)}
          placeholder="element_key"
          mono
        />
        <p className="text-xs text-slate-400 mt-0.5">Used for branching and actions</p>
      </Field>

      <Field label="Label">
        <TextInput
          value={element.label}
          onChange={(v) => update({ label: v } as Partial<FlowElement>)}
          placeholder="Element label"
        />
      </Field>

      {SUPPORTS_REQUIRED.includes(element.type) && (
        <Field label="Required">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={element.required}
              onChange={(e) => update({ required: e.target.checked } as Partial<FlowElement>)}
              className="rounded border-slate-300 text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-slate-700">Mark as required</span>
          </label>
        </Field>
      )}

      <Field label="Help Text">
        <TextInput
          value={element.help_text ?? ''}
          onChange={(v) => update({ help_text: v || null } as Partial<FlowElement>)}
          placeholder="Optional hint for the user"
        />
      </Field>

      {/* Type-specific fields */}
      {element.type === 'info_text' && (
        <Field label="Content">
          <TextInput
            value={element.content}
            onChange={(v) => update({ content: v } as Partial<FlowElement>)}
            placeholder="Info text content..."
            multiline
          />
        </Field>
      )}

      {HAS_OPTIONS.includes(element.type) && (
        <OptionsEditor
          options={'options' in element ? element.options : []}
          onChange={(options) => update({ options } as Partial<FlowElement>)}
        />
      )}

      {element.type === 'image' && (
        <>
          <Field label="Image URL">
            <TextInput
              value={element.src}
              onChange={(v) => update({ src: v } as Partial<FlowElement>)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Alt Text">
            <TextInput
              value={element.alt}
              onChange={(v) => update({ alt: v } as Partial<FlowElement>)}
              placeholder="Image description"
            />
          </Field>
        </>
      )}

      {element.type === 'video' && (
        <Field label="Video URL">
          <TextInput
            value={element.url}
            onChange={(v) => update({ url: v } as Partial<FlowElement>)}
            placeholder="https://..."
          />
        </Field>
      )}

      {/* Profile field mapping */}
      {SUPPORTS_PROFILE_MAPPING.includes(element.type) && (
        <>
          <hr className="border-slate-200" />
          <ProfileFieldMapper
            elementKey={selectedElementKey}
            currentMapping={currentMapping}
            onChange={(field) => setProfileMapping(selectedElementKey, field)}
          />
        </>
      )}
    </div>
  );
}
