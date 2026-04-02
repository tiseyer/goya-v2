'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface ProfileMapProps {
  lat: number
  lng: number
}

/**
 * Inline Mapbox GL JS map for member profile pages.
 * - Non-interactive (no zoom/pan) — display only.
 * - Single marker at the profile's coordinates.
 * - Height: 240px, rounded-xl corners.
 * - Respects dark mode (MutationObserver on documentElement class).
 * - Only rendered when visibility.showMap is true (caller's responsibility).
 */
export default function ProfileMap({ lat, lng }: ProfileMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return

    mapboxgl.accessToken = token

    const isDark = document.documentElement.classList.contains('dark')
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: isDark
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11',
      center: [lng, lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    })

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left',
    )

    new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map)

    mapRef.current = map

    // Dark mode observer
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark')
      mapRef.current?.setStyle(
        dark
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
      )
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
    }
    // lat/lng intentionally omitted — map is static after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!token) return null

  return (
    <div className="h-[240px] w-full rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
