'use client';

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface FlowPlayerFullscreenProps {
  children: ReactNode;
}

export default function FlowPlayerFullscreen({ children }: FlowPlayerFullscreenProps) {
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed inset-0 z-[10000] bg-white dark:bg-gray-900 overflow-y-auto"
      >
        <div className="max-w-2xl mx-auto px-6 py-12">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
