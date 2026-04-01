'use client';

import { useEffect } from 'react';
import { Analytics } from '@/lib/analytics/events';

export default function EventViewTracker({ eventId, eventName }: { eventId: string; eventName: string }) {
  useEffect(() => {
    Analytics.eventViewed(eventId, eventName);
  }, [eventId, eventName]);

  return null;
}
