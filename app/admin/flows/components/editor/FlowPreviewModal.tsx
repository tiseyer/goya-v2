'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Upload, Video } from 'lucide-react';
import { useEditorStore } from '@/lib/flows/editor-store';
import type { FlowElement } from '@/lib/flows/types';

function PreviewElement({ element }: { element: FlowElement }) {
  switch (element.type) {
    case 'info_text':
      return (
        <div>
          {element.label && (
            <p className="text-sm font-medium text-slate-700 mb-1">{element.label}</p>
          )}
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{element.content}</p>
        </div>
      );

    case 'short_text':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {element.label}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {element.help_text && (
            <p className="text-xs text-slate-400 mb-1">{element.help_text}</p>
          )}
          <input
            type="text"
            disabled
            placeholder={element.label}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-slate-400 cursor-not-allowed"
          />
        </div>
      );

    case 'long_text':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {element.label}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {element.help_text && (
            <p className="text-xs text-slate-400 mb-1">{element.help_text}</p>
          )}
          <textarea
            rows={4}
            disabled
            placeholder={element.label}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-slate-400 cursor-not-allowed resize-none"
          />
        </div>
      );

    case 'single_choice':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {element.label}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {element.help_text && (
            <p className="text-xs text-slate-400 mb-2">{element.help_text}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {(element.options ?? []).map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled
                className="rounded-full px-4 py-2 border border-slate-300 text-sm text-slate-600 hover:border-primary hover:bg-primary/5 cursor-not-allowed"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );

    case 'multi_choice':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {element.label}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {element.help_text && (
            <p className="text-xs text-slate-400 mb-2">{element.help_text}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {(element.options ?? []).map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled
                className="rounded-full px-4 py-2 border border-slate-300 text-sm text-slate-600 hover:border-primary hover:bg-primary/5 cursor-not-allowed"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );

    case 'dropdown':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {element.label}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {element.help_text && (
            <p className="text-xs text-slate-400 mb-1">{element.help_text}</p>
          )}
          <select
            disabled
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-slate-50 text-slate-400 cursor-not-allowed"
          >
            <option>Select {element.label}...</option>
            {(element.options ?? []).map((opt) => (
              <option key={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'image_upload':
      return (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {element.label}
            {element.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center gap-2 text-slate-400 bg-slate-50">
            <Upload className="w-8 h-8" />
            <p className="text-sm">Click to upload image</p>
          </div>
        </div>
      );

    case 'image':
      return (
        <div>
          {element.label && (
            <p className="text-sm font-medium text-slate-700 mb-1">{element.label}</p>
          )}
          {element.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={element.src}
              alt={element.alt ?? ''}
              className="w-full rounded-lg object-contain max-h-64"
            />
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center gap-2 text-slate-400 bg-slate-50">
              <p className="text-sm">No image URL set</p>
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div>
          {element.label && (
            <p className="text-sm font-medium text-slate-700 mb-1">{element.label}</p>
          )}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center gap-2 text-slate-400 bg-slate-50">
            <Video className="w-8 h-8" />
            <p className="text-sm text-center break-all">{element.url || 'No video URL set'}</p>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function BannerPreview() {
  const { flow, steps, closePreview } = useEditorStore();
  if (!flow) return null;

  const firstElement = steps[0]?.elements[0];
  const bannerText =
    firstElement?.label || flow.name || 'Flow Banner';
  const isTop = flow.display_type === 'top_banner';

  return (
    <div
      className={`fixed ${isTop ? 'top-0' : 'bottom-0'} left-0 right-0 z-50 h-16 bg-primary text-white flex items-center justify-between px-6 shadow-lg`}
    >
      {/* PREVIEW MODE watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span className="text-4xl font-bold text-white/10 rotate-[-5deg] whitespace-nowrap select-none">
          PREVIEW MODE
        </span>
      </div>
      <p className="text-sm font-medium">{bannerText}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-xs font-medium bg-white/20 hover:bg-white/30 text-white rounded px-3 py-1.5 transition-colors"
        >
          View
        </button>
        <button
          type="button"
          onClick={closePreview}
          className="text-white/60 hover:text-white transition-colors"
          title="Exit Preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NotificationPreview() {
  const { flow, steps, closePreview } = useEditorStore();
  if (!flow) return null;

  const firstElement = steps[0]?.elements[0];
  const title = firstElement?.label || flow.name || 'Notification';

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-xl shadow-xl p-4 border border-slate-200">
      {/* PREVIEW MODE watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-xl">
        <span className="text-2xl font-bold text-slate-200 rotate-[-20deg] whitespace-nowrap select-none">
          PREVIEW MODE
        </span>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-500 mt-1">
            {firstElement?.type === 'info_text' && 'content' in firstElement
              ? firstElement.content
              : 'Flow notification preview'}
          </p>
        </div>
        <button
          type="button"
          onClick={closePreview}
          className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          title="Exit Preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="flex-1 text-xs font-medium bg-primary text-white rounded-md py-1.5 hover:bg-primary/90 transition-colors"
        >
          View
        </button>
        <button
          type="button"
          onClick={closePreview}
          className="text-xs font-medium text-slate-600 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function ModalOrFullscreenPreview() {
  const { flow, steps, previewStepIndex, previewNext, previewBack, closePreview } =
    useEditorStore();
  if (!flow) return null;

  const currentStep = steps[previewStepIndex];
  const isFirst = previewStepIndex === 0;
  const isLast = previewStepIndex === steps.length - 1;
  const progress = steps.length > 0 ? (previewStepIndex + 1) / steps.length : 1;

  const isFullscreen = flow.display_type === 'fullscreen';
  const isModal = flow.display_type === 'modal';

  const overlayClass = (() => {
    if (isFullscreen) return 'fixed inset-0 bg-white z-50';
    if (isModal) {
      const backdrop =
        flow.modal_backdrop === 'blur'
          ? 'backdrop-blur-sm bg-black/50'
          : flow.modal_backdrop === 'dark'
          ? 'bg-black/70'
          : 'bg-black/40';
      return `fixed inset-0 z-50 flex items-center justify-center ${backdrop}`;
    }
    return 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
  })();

  const cardClass = isFullscreen
    ? 'relative w-full h-full overflow-y-auto'
    : 'relative max-w-lg w-full bg-white rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto mx-4';

  return (
    <div className={overlayClass}>
      {/* PREVIEW MODE watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-50">
        <span className="text-6xl font-bold text-white/10 rotate-[-30deg] whitespace-nowrap select-none">
          PREVIEW MODE
        </span>
      </div>

      <div className={isFullscreen ? 'relative w-full h-full overflow-y-auto bg-white' : cardClass}>
        {/* Exit preview button */}
        <button
          type="button"
          onClick={closePreview}
          className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 bg-white rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors z-10"
        >
          <X className="w-3 h-3" />
          Exit Preview
        </button>

        {/* Modal dismiss button */}
        {isModal && flow.modal_dismissible && (
          <button
            type="button"
            onClick={closePreview}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className={isFullscreen ? 'max-w-2xl mx-auto px-6 py-8' : 'pt-8'}>
          {/* Progress bar */}
          {steps.length > 1 && (
            <div className="w-full h-1 bg-slate-200 rounded-full mb-6">
              <div
                className="h-1 bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          )}

          {/* Step title */}
          {currentStep?.title && (
            <h2 className="text-xl font-semibold text-slate-800 mb-4">{currentStep.title}</h2>
          )}

          {/* Elements */}
          {currentStep && currentStep.elements.length > 0 ? (
            <div className="space-y-4">
              {currentStep.elements.map((el) => (
                <PreviewElement key={el.element_key} element={el} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm">This step has no elements</p>
              <p className="text-xs mt-1">Add elements in the editor to see them here</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={previewBack}
              disabled={isFirst}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-md px-4 py-2 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-xs text-slate-400">
              Step {previewStepIndex + 1} of {steps.length}
            </span>
            <button
              type="button"
              onClick={isLast ? closePreview : previewNext}
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white rounded-md px-4 py-2 hover:bg-primary/90 transition-colors"
            >
              {isLast ? 'Complete' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlowPreviewModal() {
  const { isPreviewOpen, flow, closePreview } = useEditorStore();

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewOpen) {
        closePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, closePreview]);

  if (!isPreviewOpen || !flow) return null;

  if (flow.display_type === 'top_banner' || flow.display_type === 'bottom_banner') {
    return <BannerPreview />;
  }

  if (flow.display_type === 'notification') {
    return <NotificationPreview />;
  }

  // modal or fullscreen
  return <ModalOrFullscreenPreview />;
}
