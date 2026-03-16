'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Member } from '@/lib/members-data';

const ROLE_COLORS: Record<string, string> = {
  Teacher: '#2dd4bf',
  Student: '#60a5fa',
  School: '#a78bfa',
  'Wellness Practitioner': '#34d399',
};

interface Props {
  allMembers: Member[];
  filteredMembers: Member[];
  highlightedId: string | null;
  onMemberClick: (id: string) => void;
  isVisible: boolean;
}

export default function MapPanel({
  allMembers,
  filteredMembers,
  highlightedId,
  onMemberClick,
  isVisible,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const markerEls = useRef<Map<string, HTMLElement>>(new Map());
  const initialized = useRef(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Initialize map once visible
  useEffect(() => {
    if (!isVisible || !containerRef.current || initialized.current || !token) return;
    initialized.current = true;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [20, 25],
      zoom: 1.4,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      // Resize once the container has settled after the CSS transition
      setTimeout(() => map.resize(), 350);
      allMembers.forEach(member => {
        const el = document.createElement('div');
        const color = ROLE_COLORS[member.role] ?? '#2dd4bf';
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; border: 2px solid #fff;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 9px; font-weight: 700;
          color: #1a2744; box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          user-select: none;
        `;
        el.textContent = member.name.split(' ').map(n => n[0]).join('').slice(0, 2);
        el.title = member.name;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onMemberClick(member.id);
        });

        const popup = new mapboxgl.Popup({
          offset: 18,
          closeButton: false,
          className: 'goya-popup',
        }).setHTML(`
          <div style="background:#ffffff;color:#1a2744;padding:8px 10px;border-radius:8px;font-size:12px;line-height:1.4;min-width:130px;border:1px solid #e2e8f0;">
            <div style="font-weight:700;margin-bottom:2px;">${member.name}</div>
            <div style="color:#0e9f8a;font-size:10px;">${member.role}</div>
            <div style="color:#64748b;font-size:10px;margin-top:2px;">${member.city}, ${member.country}</div>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(member.coordinates)
          .setPopup(popup)
          .addTo(map);

        markersRef.current.set(member.id, marker);
        markerEls.current.set(member.id, el);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      markerEls.current.clear();
      initialized.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Resize map after the CSS transition completes (300ms) + buffer
  useEffect(() => {
    if (isVisible && mapRef.current) {
      setTimeout(() => mapRef.current?.resize(), 350);
    }
  }, [isVisible]);

  // Update marker opacity based on filter
  useEffect(() => {
    const filteredIds = new Set(filteredMembers.map(m => m.id));
    markerEls.current.forEach((el, id) => {
      const inFilter = filteredIds.has(id);
      el.style.opacity = inFilter ? '1' : '0.2';
      el.style.pointerEvents = inFilter ? 'auto' : 'none';
    });
  }, [filteredMembers]);

  // Highlight selected marker and fly to it
  useEffect(() => {
    markerEls.current.forEach((el, id) => {
      if (id === highlightedId) {
        el.style.transform = 'scale(1.6)';
        el.style.boxShadow = '0 0 0 3px #2dd4bf, 0 4px 16px rgba(0,0,0,0.6)';
        el.style.zIndex = '10';
        markersRef.current.get(id)?.togglePopup();
        const member = allMembers.find(m => m.id === id);
        if (member && mapRef.current) {
          mapRef.current.flyTo({ center: member.coordinates, zoom: 6, duration: 800 });
        }
      } else {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
        el.style.zIndex = '1';
        const m = markersRef.current.get(id);
        if (m?.getPopup()?.isOpen()) m.togglePopup();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedId]);

  if (!token) {
    return (
      <div className="w-full h-full bg-[#0f1929] flex flex-col items-center justify-center gap-3 text-center px-6">
        <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
        </svg>
        <p className="text-slate-500 text-sm font-medium">Map unavailable</p>
        <p className="text-slate-600 text-xs">Set <code className="bg-slate-800 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
