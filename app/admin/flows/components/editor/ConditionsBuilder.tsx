'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { FlowCondition, FlowConditionType } from '@/lib/flows/types';

interface ConditionsBuilderProps {
  conditions: FlowCondition[];
  onChange: (conditions: FlowCondition[]) => void;
}

const CONDITION_TYPE_LABELS: Record<FlowConditionType, string> = {
  role: 'Role',
  onboarding_status: 'Onboarding Status',
  has_profile_picture: 'Has Profile Picture',
  subscription_status: 'Subscription Status',
  birthday: 'Birthday',
  flow_completed: 'Flow Completed',
};

const CONDITION_TYPES: FlowConditionType[] = [
  'role',
  'onboarding_status',
  'has_profile_picture',
  'subscription_status',
  'birthday',
  'flow_completed',
];

function conditionChipLabel(condition: FlowCondition): string {
  const typeLabel = CONDITION_TYPE_LABELS[condition.type];
  const val = Array.isArray(condition.value)
    ? condition.value.join(', ')
    : String(condition.value);

  if (condition.type === 'birthday') {
    return `${typeLabel} ${condition.operator.replace(/_/g, ' ')}`;
  }
  return `${typeLabel} ${condition.operator.replace(/_/g, ' ')} ${val}`;
}

interface AddConditionFormProps {
  onAdd: (condition: FlowCondition) => void;
  onCancel: () => void;
}

function AddConditionForm({ onAdd, onCancel }: AddConditionFormProps) {
  const [conditionType, setConditionType] = useState<FlowConditionType>('role');
  const [operator, setOperator] = useState<string>('is');
  const [value, setValue] = useState<string | string[] | boolean | number>('student');
  const [multiValues, setMultiValues] = useState<string[]>([]);

  const handleTypeChange = (type: FlowConditionType) => {
    setConditionType(type);
    // Reset operator and value for the new type
    switch (type) {
      case 'role':
        setOperator('is');
        setValue('student');
        setMultiValues([]);
        break;
      case 'onboarding_status':
        setOperator('is');
        setValue('complete');
        break;
      case 'has_profile_picture':
        setOperator('is');
        setValue(true);
        break;
      case 'subscription_status':
        setOperator('is');
        setValue('active');
        break;
      case 'birthday':
        setOperator('is_set');
        setValue('');
        break;
      case 'flow_completed':
        setOperator('has_completed');
        setValue('');
        break;
    }
  };

  const handleAdd = () => {
    let finalValue: FlowCondition['value'] = value;
    if (conditionType === 'role' && multiValues.length > 0) {
      finalValue = multiValues;
    }
    onAdd({ type: conditionType, operator, value: finalValue });
  };

  const toggleMultiValue = (v: string) => {
    setMultiValues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  return (
    <div className="mt-3 p-3 border border-slate-200 rounded-lg bg-white space-y-3">
      {/* Condition type */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Condition Type</label>
        <select
          value={conditionType}
          onChange={(e) => handleTypeChange(e.target.value as FlowConditionType)}
          className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {CONDITION_TYPES.map((type) => (
            <option key={type} value={type}>
              {CONDITION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      {/* Operator + value based on type */}
      {conditionType === 'role' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="is">is</option>
              <option value="is_not">is not</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Role(s)</label>
            <div className="flex flex-wrap gap-1.5">
              {['student', 'teacher', 'wellness_practitioner', 'admin', 'moderator'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleMultiValue(role)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    multiValues.includes(role)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-primary'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {conditionType === 'onboarding_status' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="is">is</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={String(value)}
              onChange={(e) => setValue(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="complete">complete</option>
              <option value="incomplete">incomplete</option>
            </select>
          </div>
        </>
      )}

      {conditionType === 'has_profile_picture' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="is">is</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Value</label>
            <select
              value={String(value)}
              onChange={(e) => setValue(e.target.value === 'true')}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </div>
        </>
      )}

      {conditionType === 'subscription_status' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="is">is</option>
              <option value="is_not">is not</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
            <select
              value={String(value)}
              onChange={(e) => setValue(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="active">active</option>
              <option value="trialing">trialing</option>
              <option value="canceled">canceled</option>
              <option value="none">none</option>
            </select>
          </div>
        </>
      )}

      {conditionType === 'birthday' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Operator</label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="is_set">is set</option>
            <option value="is_not_set">is not set</option>
            <option value="is_today">is today</option>
          </select>
        </div>
      )}

      {conditionType === 'flow_completed' && (
        <>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="has_completed">has completed</option>
              <option value="has_not_completed">has not completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Flow ID</label>
            <input
              type="text"
              value={String(value)}
              onChange={(e) => setValue(e.target.value)}
              placeholder="flow_id (e.g. uuid)"
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 text-xs font-medium bg-primary text-white rounded-md py-1.5 hover:bg-primary/90 transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-md py-1.5 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function ConditionsBuilder({ conditions, onChange }: ConditionsBuilderProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleRemove = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const handleAdd = (condition: FlowCondition) => {
    onChange([...conditions, condition]);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Conditions</p>
      <p className="text-xs text-slate-400">All conditions must be true (AND logic)</p>

      {conditions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {conditions.map((condition, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-xs text-slate-400 uppercase font-medium px-1">AND</span>
              )}
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs">
                {conditionChipLabel(condition)}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="ml-0.5 text-blue-400 hover:text-blue-700 transition-colors"
                  title="Remove condition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {conditions.length === 0 && !showAddForm && (
        <p className="text-xs text-slate-400 italic">No conditions — flow shows to all users</p>
      )}

      {showAddForm ? (
        <AddConditionForm onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          + Add Condition
        </button>
      )}
    </div>
  );
}
