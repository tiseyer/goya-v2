'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Member } from '@/lib/members-data';

interface Props {
  allMembers: Member[];
  filteredMembers: Member[];
  highlightedId: string | null;
  onMemberClick: (id: string) => void;
  isVisible: boolean;
}

export default function MapPanel({ allMembers, filteredMembers, highlightedId, onMemberClick, isVisible }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const markerEls = useRef<Map<string, HTMLElement>>(new Map());
  const initialized = useRef(false);
  const defaultBounds = useRef<mapboxgl.LngLatBounds | null>(null);
  const onMemberClickRef = useRef(onMemberClick);
  onMemberClickRef.current = onMemberClick;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const createMarkerEl = useCallback((member: Member) => {
    const el = document.createElement('div');
    el.className = 'goya-map-pin';
    el.style.cssText = `width:40px;height:40px;border-radius:50%;overflow:hidden;cursor:pointer;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);transition:transform 0.2s ease,box-shadow 0.2s ease;background:var(--goya-primary-100,#d6e7f1);display:flex;align-items:center;justify-content:center;`;

    if (member.photo) {
      const img = document.createElement('img');
      img.src = member.photo;
      img.alt = member.name;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      img.loading = 'lazy';
      img.onerror = () => {
        img.remove();
        const span = document.createElement('span');
        span.textContent = member.name.split(' ').map(n => n[0]).join('').slice(0, 2);
        span.style.cssText = 'font-size:13px;font-weight:700;color:var(--goya-primary,#345c83);';
        el.appendChild(span);
      };
      el.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.textContent = member.name.split(' ').map(n => n[0]).join('').slice(0, 2);
      span.style.cssText = 'font-size:13px;font-weight:700;color:var(--goya-primary,#345c83);';
      el.appendChild(span);
    }

    el.title = member.name;
    el.addEventListener('click', (e) => { e.stopPropagation(); onMemberClickRef.current(member.id); });
    return el;
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current || initialized.current || !token) return;
    initialized.current = true;
    mapboxgl.accessToken = token;

    const isDark = document.documentElement.classList.contains('dark');
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: [20, 25],
      zoom: 1.8,
      attributionControl: false,
      projection: 'mercator',
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    if (allMembers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      allMembers.forEach(m => bounds.extend(m.coordinates));
      defaultBounds.current = bounds;
    }

    map.on('load', () => {
      requestAnimationFrame(() => map.resize());

      allMembers.forEach(member => {
        const el = createMarkerEl(member);
        const popup = new mapboxgl.Popup({ offset: 24, closeButton: false, className: 'goya-popup', maxWidth: '200px' })
          .setHTML(`<div style="padding:6px 8px;font-size:12px;line-height:1.4;"><div style="font-weight:700;margin-bottom:1px;">${member.name}</div><div style="opacity:0.6;font-size:10px;">${member.city}, ${member.country}</div></div>`);

        const marker = new mapboxgl.Marker({ element: el }).setLngLat(member.coordinates).setPopup(popup).addTo(map);
        markersRef.current.set(member.id, marker);
        markerEls.current.set(member.id, el);
      });

      if (defaultBounds.current) map.fitBounds(defaultBounds.current, { padding: 60, maxZoom: 5, duration: 0 });
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markersRef.current.clear(); markerEls.current.clear(); initialized.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Dark mode listener
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      mapRef.current?.setStyle(isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Resize on visibility
  useEffect(() => {
    if (isVisible && mapRef.current) {
      requestAnimationFrame(() => mapRef.current?.resize());
      const t = setTimeout(() => mapRef.current?.resize(), 350);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  // Filter opacity
  useEffect(() => {
    const ids = new Set(filteredMembers.map(m => m.id));
    markerEls.current.forEach((el, id) => {
      const ok = ids.has(id);
      el.style.opacity = ok ? '1' : '0.15';
      el.style.pointerEvents = ok ? 'auto' : 'none';
      el.style.transform = ok ? 'scale(1)' : 'scale(0.6)';
    });
  }, [filteredMembers]);

  // Highlight + fly
  useEffect(() => {
    markerEls.current.forEach((el, id) => {
      if (id === highlightedId) {
        el.style.transform = 'scale(1.4)';
        el.style.boxShadow = '0 0 0 3px var(--goya-primary-light,#4e87a0),0 4px 16px rgba(0,0,0,0.3)';
        el.style.zIndex = '10';
        el.style.border = '3px solid var(--goya-primary-light,#4e87a0)';
        if (!markersRef.current.get(id)?.getPopup()?.isOpen()) markersRef.current.get(id)?.togglePopup();
        const member = allMembers.find(m => m.id === id);
        if (member && mapRef.current) mapRef.current.flyTo({ center: member.coordinates, zoom: 8, duration: 800 });
      } else {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
        el.style.zIndex = '1';
        el.style.border = '2.5px solid #fff';
        const m = markersRef.current.get(id);
        if (m?.getPopup()?.isOpen()) m.togglePopup();
      }
    });
    if (!highlightedId && mapRef.current && defaultBounds.current) {
      mapRef.current.fitBounds(defaultBounds.current, { padding: 60, maxZoom: 5, duration: 600 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedId]);

  if (!token) {
    return (
      <div className="w-full h-full bg-background-secondary flex flex-col items-center justify-center gap-3 text-center px-6">
        <svg className="w-10 h-10 text-foreground-tertiary opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-foreground-secondary text-sm font-medium">Map unavailable</p>
        <p className="text-foreground-tertiary text-xs">Set <code className="bg-background-tertiary px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
