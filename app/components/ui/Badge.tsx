import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/* All badges use only the GOYA blue family — no rainbow colors. */

export type BadgeVariant = 'default' | 'solid' | 'subtle' | 'outline' | 'muted';
export type BadgeSize = 'sm' | 'md';

/* Semantic role variants mapped to blue shades */
export const ROLE_BADGE: Record<string, string> = {
  Teacher:   'bg-primary-50 text-primary border-primary-100',
  School:    'bg-primary-100 text-primary-dark border-primary-200',
  Student:   'bg-primary-50 text-primary border-primary-100',
  Wellness:  'bg-primary-light/10 text-primary-light border-primary-light/20',
  Moderator: 'bg-primary-dark/8 text-primary-dark border-primary-dark/15',
  Admin:     'bg-accent-50 text-accent border-accent/20',
};

/* Category badges — all blue family shades */
export const CATEGORY_BADGE: Record<string, string> = {
  Workshop:           'bg-primary-50 text-primary border-primary-100',
  'Teacher Training': 'bg-primary-100 text-primary-dark border-primary-200',
  'Dharma Talk':      'bg-primary-dark/8 text-primary-dark border-primary-dark/15',
  Conference:         'bg-primary/8 text-primary border-primary/15',
  'Yoga Sequence':    'bg-primary-light/10 text-primary-light border-primary-light/20',
  'Music Playlist':   'bg-primary-50 text-primary-dark border-primary-100',
  Research:           'bg-slate-100 text-slate-600 border-slate-200',
};

/* Category dot colors — blue shades only */
export const CATEGORY_DOT: Record<string, string> = {
  Workshop:           'bg-primary',
  'Teacher Training': 'bg-primary-dark',
  'Dharma Talk':      'bg-primary-dark/70',
  Conference:         'bg-primary',
  'Yoga Sequence':    'bg-primary-light',
  'Music Playlist':   'bg-primary-light/70',
  Research:           'bg-slate-400',
};

/* Format badges */
export const FORMAT_BADGE: Record<string, string> = {
  Online:      'bg-slate-100 text-slate-500 border-slate-200',
  'In Person': 'bg-primary-dark/8 text-primary-dark border-primary-dark/15',
  Hybrid:      'bg-primary/8 text-primary border-primary/15',
};

const BASE_VARIANTS: Record<BadgeVariant, string> = {
  default: 'bg-primary-50 text-primary border border-primary-100',
  solid:   'bg-primary text-white border border-transparent',
  subtle:  'bg-primary-100 text-primary-dark border border-primary-200',
  outline: 'bg-transparent text-primary border border-primary/30',
  muted:   'bg-slate-100 text-slate-600 border border-slate-200',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] rounded-full',
  md: 'px-2.5 py-0.5 text-xs rounded-full',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-semibold whitespace-nowrap', BASE_VARIANTS[variant], SIZES[size], className)}>
      {children}
    </span>
  );
}
