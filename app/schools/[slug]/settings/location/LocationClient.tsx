'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { updateLocation } from '../actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface School {
  location_address: string | null
  location_city: string | null
  location_country: string | null
  location_lat: number | null
  location_lng: number | null
  location_place_id: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleMapsType = any

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: ToastType
  message: string
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const styles: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${styles[type]}`}
    >
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LocationClient({
  school,
  schoolSlug,
}: {
  school: School
  schoolSlug: string
}) {
  const [locationAddress, setLocationAddress] = useState(school.location_address ?? '')
  const [locationCity, setLocationCity] = useState(school.location_city ?? '')
  const [locationCountry, setLocationCountry] = useState(school.location_country ?? '')
  const [locationLat, setLocationLat] = useState<number | null>(school.location_lat ?? null)
  const [locationLng, setLocationLng] = useState<number | null>(school.location_lng ?? null)
  const [locationPlaceId, setLocationPlaceId] = useState(school.location_place_id ?? '')
  const [placeSelected, setPlaceSelected] = useState(!!school.location_address)

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const [isPending, startTransition] = useTransition()

  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<GoogleMapsType>(null)

  // Load Google Maps Places script and initialize autocomplete
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any

    function initAutocomplete() {
      if (!inputRef.current || !win.google?.maps?.places) return
      const ac = new win.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
      })
      autocompleteRef.current = ac
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place?.geometry?.location) return

        const address = place.formatted_address ?? ''
        const placeId = place.place_id ?? ''
        let city = ''
        let country = ''

        for (const comp of place.address_components ?? []) {
          if (comp.types.includes('locality')) city = comp.long_name
          if (comp.types.includes('country')) country = comp.long_name
        }

        setLocationAddress(address)
        setLocationCity(city)
        setLocationCountry(country)
        setLocationLat(place.geometry.location.lat())
        setLocationLng(place.geometry.location.lng())
        setLocationPlaceId(placeId)
        setPlaceSelected(true)
        setToast(null)
      })
    }

    if (win.google?.maps?.places) {
      initAutocomplete()
      return
    }

    const scriptId = 'google-maps-places'
    if (document.getElementById(scriptId)) {
      // Script already loading — poll until ready
      const interval = setInterval(() => {
        if (win.google?.maps?.places) {
          clearInterval(interval)
          initAutocomplete()
        }
      }, 200)
      return () => clearInterval(interval)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.onload = initAutocomplete
    document.head.appendChild(script)
  }, [])

  function handleClearLocation() {
    setLocationAddress('')
    setLocationCity('')
    setLocationCountry('')
    setLocationLat(null)
    setLocationLng(null)
    setLocationPlaceId('')
    setPlaceSelected(false)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  function handleSave() {
    if (!placeSelected || !locationAddress || !locationLat || !locationLng) {
      setToast({ type: 'error', message: 'Please select a location from the autocomplete suggestions.' })
      return
    }
    startTransition(async () => {
      const result = await updateLocation(schoolSlug, {
        location_address: locationAddress,
        location_city: locationCity,
        location_country: locationCountry,
        location_lat: locationLat!,
        location_lng: locationLng!,
        location_place_id: locationPlaceId,
      })
      if ('error' in result) {
        setToast({ type: 'error', message: result.error })
      } else {
        setToast({ type: 'success', message: 'Location saved.' })
      }
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Location</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Set your school&apos;s physical address using the address search below.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">School Address</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Address autocomplete input */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              Search Address <span className="text-red-400">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              defaultValue={locationAddress}
              placeholder="Start typing your school's address..."
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
            />
            <p className="mt-1.5 text-xs text-[#6B7280]">
              Start typing and select from the suggestions to set exact coordinates.
            </p>
          </div>

          {/* Selected location display */}
          {placeSelected && locationAddress && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">{locationAddress}</p>
                {(locationCity || locationCountry) && (
                  <p className="text-xs text-green-600 mt-0.5">
                    {[locationCity, locationCountry].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClearLocation}
                className="shrink-0 text-green-600 hover:text-green-800 transition-colors text-xs font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending || !placeSelected}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4E87A0] text-white text-sm font-semibold hover:bg-[#3A7190] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isPending ? <Spinner /> : null}
          {isPending ? 'Saving...' : 'Save Location'}
        </button>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />}
    </div>
  )
}
