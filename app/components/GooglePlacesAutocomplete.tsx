'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Lazy Google Maps script loader (LOC-04) ─────────────────────────────── */

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;
  if (typeof window !== 'undefined' && window.google?.maps?.places) {
    return Promise.resolve();
  }
  loadPromise = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null; // allow retry
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export interface PlaceResult {
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: PlaceResult) => void;
  className?: string;
  placeholder?: string;
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  className,
  placeholder,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Stable callback refs to avoid re-attaching listener
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onChangeRef.current = onChange;
  onPlaceSelectRef.current = onPlaceSelect;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => { if (!cancelled) setLoaded(true); })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
    });

    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const displayName = place.formatted_address || place.name || '';
      if (displayName) {
        onChangeRef.current(displayName);
      }
      if (place.geometry?.location) {
        onPlaceSelectRef.current({
          name: displayName,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });

    autocompleteRef.current = ac;
  }, [loaded]);

  if (loadError) {
    // Graceful fallback: plain text input when API key is missing or script fails
    return (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={className}
        placeholder={placeholder ?? 'Enter location...'}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className}
      placeholder={placeholder ?? 'Search for a place...'}
    />
  );
}
