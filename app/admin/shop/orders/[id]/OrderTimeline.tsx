'use client';

import { format } from 'date-fns';

export type TimelineEvent = {
  eventType: string;
  createdAt: string;
  status: string;
};

const EVENT_LABELS: Record<string, string> = {
  'payment_intent.created':           'Payment Intent Created',
  'payment_intent.succeeded':         'Payment Succeeded',
  'payment_intent.payment_failed':    'Payment Failed',
  'charge.succeeded':                 'Charge Complete',
  'charge.refunded':                  'Refund Issued',
  'invoice.paid':                     'Invoice Paid',
  'invoice.payment_failed':           'Invoice Payment Failed',
  'customer.subscription.created':    'Subscription Created',
  'customer.subscription.updated':    'Subscription Updated',
  'customer.subscription.deleted':    'Subscription Canceled',
};

function getEventLabel(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDotColor(eventType: string): string {
  if (
    eventType.includes('succeeded') ||
    eventType.includes('.paid') ||
    eventType.includes('.created')
  ) {
    return 'bg-emerald-500';
  }
  if (
    eventType.includes('failed') ||
    eventType.includes('payment_failed')
  ) {
    return 'bg-red-500';
  }
  if (eventType.includes('.updated')) {
    return 'bg-blue-500';
  }
  if (eventType.includes('.deleted') || eventType.includes('canceled')) {
    return 'bg-slate-400';
  }
  return 'bg-slate-300';
}

function formatEventTime(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, h:mm a');
  } catch {
    return iso;
  }
}

export default function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="font-semibold text-lg text-[#1B3A5C] mb-4">Event Timeline</h2>
        <p className="text-sm text-[#9CA3AF]">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      <h2 className="font-semibold text-lg text-[#1B3A5C] mb-4">Event Timeline</h2>
      <ol className="relative">
        {events.map((event, idx) => (
          <li key={idx} className="flex gap-4 pb-6 last:pb-0 relative">
            {/* Vertical connector line */}
            {idx < events.length - 1 && (
              <div className="absolute left-[5px] top-3 bottom-0 w-[2px] bg-[#E5E7EB]" />
            )}

            {/* Dot */}
            <div className="relative mt-1 flex-shrink-0">
              <span className={`block w-3 h-3 rounded-full ${getDotColor(event.eventType)}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#374151]">
                {getEventLabel(event.eventType)}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {formatEventTime(event.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
