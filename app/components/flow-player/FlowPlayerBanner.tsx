'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FlowPlayerBannerProps {
  position: 'top' | 'bottom';
  text: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  onClose: () => void;
}

export default function FlowPlayerBanner({
  position,
  text,
  ctaLabel,
  onCtaClick,
  onClose,
}: FlowPlayerBannerProps) {
  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';

  const motionProps =
    position === 'top'
      ? {
          initial: { y: -48 },
          animate: { y: 0 },
          exit: { y: -48 },
        }
      : {
          initial: { y: 48 },
          animate: { y: 0 },
          exit: { y: 48 },
        };

  return createPortal(
    <AnimatePresence>
      <motion.div
        {...motionProps}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed left-0 right-0 z-[9999] h-12 ${positionClass} bg-[var(--color-primary)] text-white`}
      >
        <div className="flex items-center justify-between px-4 h-full max-w-screen-xl mx-auto">
          <span className="text-sm font-medium truncate flex-1 mr-4">{text}</span>

          <div className="flex items-center shrink-0">
            {ctaLabel && onCtaClick && (
              <button
                type="button"
                onClick={onCtaClick}
                className="bg-white text-[var(--color-primary)] rounded-md px-3 py-1 text-sm font-medium hover:bg-gray-100 transition"
              >
                {ctaLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-2 text-white/80 hover:text-white transition"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
