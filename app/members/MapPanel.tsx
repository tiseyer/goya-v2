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

function addInitials(el: HTMLElement, member: { name: string }) {
  const span = document.createElement('span');
  span.textContent = member.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  span.style.cssText = 'font-size:13px;font-weight:700;color:var(--goya-primary,#345c83);';
  el.appendChild(span);
}

export default function MapPanel({ allMembers, filteredMembers, highlightedId, onMemberClick, isVisible }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const initialized = useRef(false);
  const initialLoadDone = useRef(false);
  const onMemberClickRef = useRef(onMemberClick);
  onMemberClickRef.current = onMemberClick;
  const filteredRef = useRef(filteredMembers);
  filteredRef.current = filteredMembers;
  const allMembersRef = useRef(allMembers);
  allMembersRef.current = allMembers;
  const highlightedRef = useRef(highlightedId);
  highlightedRef.current = highlightedId;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const applyGoyaStyle = useCallback((map: mapboxgl.Map) => {
    const isDark = document.documentElement.classList.contains('dark');
    // Water
    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', isDark ? '#1e3a52' : '#d6e7f1');
    }
    // Land
    if (map.getLayer('land')) {
      map.setPaintProperty('land', 'background-color', isDark ? '#0F1117' : '#f5f4f2');
    }
    // Landuse/landcover
    ['landuse', 'landcover'].forEach(id => {
      if (map.getLayer(id)) {
        map.setPaintProperty(id, 'fill-color', isDark ? '#1A1D27' : '#eef4f9');
        map.setPaintProperty(id, 'fill-opacity', 0.5);
      }
    });
    // Admin boundary backgrounds
    if (map.getLayer('admin-0-boundary-bg')) {
      map.setPaintProperty('admin-0-boundary-bg', 'line-color', isDark ? '#345c83' : '#afd0e4');
      map.setPaintProperty('admin-0-boundary-bg', 'line-opacity', 0.3);
    }
    // Country borders
    ['admin-0-boundary', 'admin-0-boundary-disputed'].forEach(id => {
      if (map.getLayer(id)) {
        map.setPaintProperty(id, 'line-color', isDark ? '#345c83' : '#afd0e4');
        map.setPaintProperty(id, 'line-opacity', 0.4);
      }
    });
    // State borders
    if (map.getLayer('admin-1-boundary')) {
      map.setPaintProperty('admin-1-boundary', 'line-color', isDark ? '#1e3a52' : '#d6e7f1');
      map.setPaintProperty('admin-1-boundary', 'line-opacity', 0.3);
    }
    // Country labels
    if (map.getLayer('country-label')) {
      map.setPaintProperty('country-label', 'text-color', isDark ? '#afd0e4' : '#1e3a52');
      map.setPaintProperty('country-label', 'text-opacity', 0.7);
    }
    // State labels
    if (map.getLayer('state-label')) {
      map.setPaintProperty('state-label', 'text-color', isDark ? '#5B9ABF' : '#4e87a0');
      map.setPaintProperty('state-label', 'text-opacity', 0.5);
    }
    // Hide noisy layers
    ['poi-label', 'transit-label', 'road-label', 'road-minor', 'road-street', 'road-secondary-tertiary', 'road-primary', 'road-motorway-trunk'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
    });
    // Globe atmosphere
    map.setFog({
      color: isDark ? '#0F1117' : '#eef4f9',
      'high-color': isDark ? '#1e3a52' : '#afd0e4',
      'horizon-blend': 0.02,
      'space-color': isDark ? '#050508' : '#1e3a52',
      'star-intensity': isDark ? 0.3 : 0.15,
    });
  }, []);

  const buildGeojson = useCallback((memberList: Member[]): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: memberList.map(m => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: m.coordinates as [number, number] },
      properties: { id: m.id, name: m.name, photo: m.photo || '', city: m.city, country: m.country },
    })),
  }), []);

  const createMarkerEl = useCallback((member: Member) => {
    const el = document.createElement('div');
    el.className = 'goya-map-pin';
    el.style.cssText = 'width:40px;height:40px;border-radius:50%;overflow:hidden;cursor:pointer;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);transition:transform 0.2s,box-shadow 0.2s;background:var(--goya-primary-100,#d6e7f1);display:flex;align-items:center;justify-content:center;';

    if (member.photo) {
      const img = document.createElement('img');
      img.src = member.photo;
      img.alt = member.name;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      img.loading = 'lazy';
      img.onerror = () => { img.remove(); addInitials(el, member); };
      el.appendChild(img);
    } else {
      addInitials(el, member);
    }

    el.title = member.name;
    el.addEventListener('click', (e) => { e.stopPropagation(); onMemberClickRef.current(member.id); });
    return el;
  }, []);

  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();

    if (zoom < 6) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      return;
    }

    const bounds = map.getBounds();
    if (!bounds) return;
    const visibleIds = new Set<string>();

    filteredRef.current.forEach(member => {
      const [lng, lat] = member.coordinates;
      if (bounds.contains([lng, lat])) {
        visibleIds.add(member.id);
        if (!markersRef.current.has(member.id)) {
          const el = createMarkerEl(member);
          const popup = new mapboxgl.Popup({ offset: 24, closeButton: false, className: 'goya-popup', maxWidth: '200px' })
            .setHTML(`<div style="padding:6px 8px;font-size:12px;line-height:1.4;"><div style="font-weight:700;margin-bottom:1px;">${member.name}</div><div style="opacity:0.6;font-size:10px;">${member.city}, ${member.country}</div></div>`);
          const marker = new mapboxgl.Marker({ element: el }).setLngLat(member.coordinates as [number, number]).setPopup(popup).addTo(map);
          markersRef.current.set(member.id, marker);
        }
      }
    });

    markersRef.current.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Apply highlight styling
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (id === highlightedRef.current) {
        el.style.transform = 'scale(1.4)';
        el.style.boxShadow = '0 0 0 3px var(--goya-primary-light,#4e87a0),0 4px 16px rgba(0,0,0,0.3)';
        el.style.zIndex = '10';
        el.style.border = '3px solid var(--goya-primary-light,#4e87a0)';
        if (!marker.getPopup()?.isOpen()) marker.togglePopup();
      } else {
        el.style.transform = '';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
        el.style.zIndex = '1';
        el.style.border = '2.5px solid #fff';
        if (marker.getPopup()?.isOpen()) marker.togglePopup();
      }
    });
  }, [createMarkerEl]);

  const setupSourceAndLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getSource('members')) return;

    map.addSource('members', {
      type: 'geojson',
      data: buildGeojson(filteredRef.current),
      cluster: true,
      clusterMaxZoom: 7,
      clusterRadius: 50,
    });

    // Cluster circles: larger at zoom 0-3, smaller at 4-6
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'members',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#6b7280', 10, '#4b5563', 50, '#374151', 200, '#1f2937',
        ],
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          0, ['step', ['get', 'point_count'], 18, 10, 24, 50, 30, 200, 36],
          2, ['step', ['get', 'point_count'], 18, 10, 24, 50, 30, 200, 36],
          3, ['step', ['get', 'point_count'], 16, 10, 20, 50, 26, 200, 32],
          5, ['step', ['get', 'point_count'], 14, 10, 18, 50, 22, 200, 28],
          7, ['step', ['get', 'point_count'], 12, 10, 16, 50, 20, 200, 24],
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9,
      },
    });

    // Cluster count text
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'members',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 0, 13, 3, 12, 5, 11, 7, 10],
      },
      paint: { 'text-color': '#ffffff' },
    });

    // Unclustered points as small dots (only shown below zoom 7)
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'members',
      filter: ['!', ['has', 'point_count']],
      maxzoom: 6,
      paint: {
        'circle-color': '#6b7280',
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }, [buildGeojson]);

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
      projection: 'globe',
      maxBounds: [[-180, -85], [180, 85]],
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      requestAnimationFrame(() => map.resize());

      applyGoyaStyle(map);
      setupSourceAndLayers();
      initialLoadDone.current = true;

      // Click cluster to zoom in
      map.on('click', 'clusters', async (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        if (clusterId == null) return;
        const source = map.getSource('members') as mapboxgl.GeoJSONSource;
        try {
          const zoom = await (source as unknown as { getClusterExpansionZoom(id: number): Promise<number> }).getClusterExpansionZoom(clusterId);
          map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        } catch { /* ignore */ }
      });

      // Click unclustered point
      map.on('click', 'unclustered-point', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onMemberClickRef.current(id);
      });

      // Cursors
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

      // Update DOM markers on zoom/move
      map.on('moveend', updateMarkers);
    });

    // Re-add source and layers after style change (dark mode)
    map.on('style.load', () => {
      if (initialLoadDone.current) {
        applyGoyaStyle(map);
        setupSourceAndLayers();
        updateMarkers();
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      initialized.current = false;
      initialLoadDone.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Update source data when filtered members change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource('members') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(buildGeojson(filteredMembers));
      // Clear and rebuild DOM markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      setTimeout(() => updateMarkers(), 100);
    }
  }, [filteredMembers, buildGeojson, updateMarkers]);

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

  // Highlight + fly
  useEffect(() => {
    if (highlightedId) {
      const member = allMembers.find(m => m.id === highlightedId);
      if (member && mapRef.current) {
        mapRef.current.flyTo({ center: member.coordinates as [number, number], zoom: 8, duration: 800 });
        // Markers will be updated via moveend event after flyTo completes
      }
    } else if (mapRef.current) {
      // Reset zoom when deselecting
      if (allMembers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        filteredMembers.forEach(m => bounds.extend(m.coordinates));
        if (!bounds.isEmpty()) {
          mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 5, duration: 600 });
        }
      }
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
