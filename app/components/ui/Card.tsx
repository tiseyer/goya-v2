import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CardVariant = 'default' | 'elevated' | 'flat' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const VARIANTS: Record<CardVariant, string> = {
  default:  'bg-white shadow-card border border-slate-100 rounded-2xl',
  elevated: 'bg-white shadow-elevated border border-slate-100 rounded-2xl',
  flat:     'bg-surface-muted border border-slate-100 rounded-2xl',
  outlined: 'bg-white border border-primary/15 rounded-2xl shadow-soft',
};

const PADDINGS: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
}

export default function Card({ variant = 'default', padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div {...props} className={cn(VARIANTS[variant], PADDINGS[padding], className)}>
      {children}
    </div>
  );
}

/* Composable sub-components */
export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 {...props} className={cn('text-base font-bold text-primary-dark leading-snug', className)}>
      {children}
    </h3>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn('text-sm text-slate-600 leading-relaxed', className)}>
      {children}
    </div>
  );
}
