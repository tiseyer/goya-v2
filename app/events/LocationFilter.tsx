'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationResult {
  name: string;
  lat: number;
  lng: number;
}

interface Props {
  onLocationChange: (location: LocationResult | null) => void;
  onRadiusChange: (km: number) => void;
  radius: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    _googleMapsLoaded?: boolean;
  }
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LocationFilter({ onLocationChange, onRadiusChange, radius }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps Places script once
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (window._googleMapsLoaded || document.getElementById('google-maps-script')) {
      setMapsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window._googleMapsLoaded = true;
      setMapsLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize autocomplete once maps loaded and input mounted
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current) return;
    if (typeof window.google === 'undefined') return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const result: LocationResult = {
        name: place.formatted_address ?? place.name ?? '',
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setInputValue(result.name);
      setLocation(result);
      onLocationChange(result);
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [mapsLoaded, onLocationChange]);

  function clearLocation() {
    setInputValue('');
    setLocation(null);
    onLocationChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="mt-3 space-y-3">
      {/* City autocomplete */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Enter city or location…"
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 pr-8 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-light focus:border-primary-light"
          aria-label="Location search"
        />
        {location && (
          <button
            onClick={clearLocation}
            aria-label="Clear location"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Radius slider */}
      <div>
        <label className="text-xs text-slate-500 mb-1.5 flex items-center justify-between">
          <span>Search radius</span>
          <span className="font-semibold text-primary-dark">{radius} km</span>
        </label>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={radius}
          onChange={e => onRadiusChange(Number(e.target.value))}
          aria-label="Search radius"
          className="w-full accent-primary-dark cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>10 km</span>
          <span>500 km</span>
        </div>
      </div>

      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <p className="text-[10px] text-amber-600">
          Google Maps API key not configured — location search unavailable.
        </p>
      )}
    </div>
  );
}
