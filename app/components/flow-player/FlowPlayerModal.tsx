'use client';

import { ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FlowPlayerModalProps {
  children: ReactNode;
  dismissible: boolean;
  backdrop: 'blur' | 'dark' | 'none' | null;
  onDismiss: () => void;
}

export default function FlowPlayerModal({
  children,
  dismissible,
  backdrop,
  onDismiss,
}: FlowPlayerModalProps) {
  const [shakeKey, setShakeKey] = useState(0);

  const backdropClass =
    backdrop === 'blur'
      ? 'backdrop-blur-sm bg-black/30'
      : backdrop === 'dark'
      ? 'bg-black/50'
      : 'bg-black/20';

  const handleBackdropClick = () => {
    if (dismissible) {
      onDismiss();
    } else {
      setShakeKey((k) => k + 1);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-[9999] ${backdropClass}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key={shakeKey}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={
            shakeKey > 0
              ? { opacity: 1, scale: 1, x: [0, -8, 8, -4, 4, 0] }
              : { opacity: 1, scale: 1 }
          }
          exit={{ opacity: 0, scale: 0.95 }}
          transition={
            shakeKey > 0
              ? { duration: 0.4 }
              : { duration: 0.2, ease: 'easeOut' }
          }
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 relative pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {dismissible && (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-lg p-1"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
          {children}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
