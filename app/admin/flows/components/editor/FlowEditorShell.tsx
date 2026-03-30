'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import { useEditorStore } from '@/lib/flows/editor-store';
import type { FlowWithSteps } from '@/lib/flows/types';
import StepListSidebar from './StepListSidebar';
import StepCanvas from './StepCanvas';
import ElementPropertiesPanel from './ElementPropertiesPanel';
import FlowSettingsPanel from './FlowSettingsPanel';
import StepActionsEditor from './StepActionsEditor';
import FlowPreviewModal from './FlowPreviewModal';

interface FlowEditorShellProps {
  initialFlow: FlowWithSteps;
}

export default function FlowEditorShell({ initialFlow }: FlowEditorShellProps) {
  const { initializeFlow, flow, isDirty, isSaving, selectedElementKey, openPreview } = useEditorStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializeFlow(initialFlow);
      initializedRef.current = true;
    }
  }, [initializeFlow, initialFlow]);

  // Warn before navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const saveStatus = isSaving
    ? 'Saving...'
    : isDirty
    ? 'Unsaved changes'
    : 'Saved';

  const saveStatusColor = isSaving
    ? 'text-amber-500'
    : isDirty
    ? 'text-amber-600'
    : 'text-emerald-600';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/flows"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Flows
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-800 truncate max-w-[240px]">
            {flow?.name ?? initialFlow.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openPreview}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <div className={`text-xs font-medium ${saveStatusColor}`}>
            {saveStatus}
          </div>
        </div>
      </div>

      {/* Flow settings panel — collapsible, above the three-panel grid */}
      <FlowSettingsPanel flowId={initialFlow.id} />

      {/* Three-panel grid */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr 320px',
        }}
      >
        {/* Left panel: Step list sidebar */}
        <div className="border-r border-slate-200 overflow-y-auto bg-slate-50">
          <StepListSidebar flowId={initialFlow.id} />
        </div>

        {/* Center panel: Step canvas */}
        <div className="overflow-y-auto bg-white">
          <StepCanvas flowId={initialFlow.id} />
        </div>

        {/* Right panel: Element properties + step actions */}
        <div className="border-l border-slate-200 bg-slate-50 overflow-y-auto">
          {selectedElementKey ? (
            <div>
              <div className="px-4 py-3 border-b border-slate-200 bg-white shrink-0">
                <p className="text-sm font-semibold text-slate-700">Element Properties</p>
              </div>
              <ElementPropertiesPanel />
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm font-semibold text-slate-600 mb-1">Properties</p>
              <p className="text-xs text-slate-400">Select an element to edit its properties</p>
            </div>
          )}
          {/* Step Actions always shown below element properties */}
          <div className="border-t border-slate-200">
            <StepActionsEditor />
          </div>
        </div>
      </div>

      {/* Preview modal — renders on top of everything */}
      <FlowPreviewModal />
    </div>
  );
}
