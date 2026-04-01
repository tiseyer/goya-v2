'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FlowPlayerNotificationProps {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

export default function FlowPlayerNotification({
  title,
  body,
  actionLabel,
  onAction,
  onClose,
}: FlowPlayerNotificationProps) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 80, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 80 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-4 right-4 z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 p-4"
      >
        {/* Top row: icon + title + close */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] shrink-0" />
          <span className="font-semibold text-sm text-gray-900 dark:text-white flex-1 truncate">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {body && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">{body}</p>
        )}

        {/* Action button */}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-3 w-full bg-[var(--color-primary)] text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            {actionLabel}
          </button>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
