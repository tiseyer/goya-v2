'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { registerMediaItemAction } from '@/app/actions/media';

// ─── Types ────────────────────────────────────────────────────────────────────

interface School {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  tiktok: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason: string | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'info' | 'error';

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: ToastType;
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const styles: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
    error:   'bg-red-50 border-red-200 text-red-800',
  };
  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SchoolSettingsClient({
  school: initialSchool,
  userId,
  isAdmin,
}: {
  school: School;
  userId: string;
  isAdmin: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Submission banner
  const [showBanner, setShowBanner] = useState(searchParams.get('submitted') === '1');
  useEffect(() => {
    if (showBanner) {
      const t = setTimeout(() => setShowBanner(false), 8000);
      return () => clearTimeout(t);
    }
  }, [showBanner]);

  // Toast
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // Delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Profile card state ──────────────────────────────────────────────────
  const [name, setName] = useState(initialSchool.name ?? '');
  const [description, setDescription] = useState(initialSchool.description ?? '');
  const [logoUrl, setLogoUrl] = useState(initialSchool.logo_url ?? '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialSchool.logo_url ?? null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Location card state ─────────────────────────────────────────────────
  const [streetAddress, setStreetAddress] = useState(initialSchool.street_address ?? '');
  const [city, setCity] = useState(initialSchool.city ?? '');
  const [state, setState] = useState(initialSchool.state ?? '');
  const [zip, setZip] = useState(initialSchool.zip ?? '');
  const [country, setCountry] = useState(initialSchool.country ?? '');
  const [savingLocation, setSavingLocation] = useState(false);

  // ── Links card state ────────────────────────────────────────────────────
  const [website, setWebsite] = useState(initialSchool.website ?? '');
  const [instagram, setInstagram] = useState(initialSchool.instagram ?? '');
  const [facebook, setFacebook] = useState(initialSchool.facebook ?? '');
  const [youtube, setYoutube] = useState(initialSchool.youtube ?? '');
  const [tiktok, setTiktok] = useState(initialSchool.tiktok ?? '');
  const [savingLinks, setSavingLinks] = useState(false);

  // ── Logo file selection ─────────────────────────────────────────────────
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  // ── Save profile ────────────────────────────────────────────────────────
  async function saveProfile() {
    setSavingProfile(true);
    try {
      let finalLogoUrl = logoUrl;

      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `${userId}/logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('school-logos')
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('school-logos').getPublicUrl(path);
        finalLogoUrl = urlData.publicUrl;
        setLogoUrl(finalLogoUrl);
        // Fire-and-forget — non-critical, do not block UX on failure
        const logoFileRef = logoFile;
        registerMediaItemAction({
          bucket: 'school-logos',
          fileName: logoFileRef.name,
          filePath: path,
          fileUrl: finalLogoUrl,
          fileType: logoFileRef.type,
          fileSize: logoFileRef.size,
          uploadedBy: userId,
        }).catch(console.error);
        setLogoFile(null);
      }

      const { error } = await supabase
        .from('schools')
        .update({ name, description, logo_url: finalLogoUrl || null, updated_at: new Date().toISOString() })
        .eq('id', initialSchool.id);

      if (error) throw error;
      setToast({ type: 'success', message: 'School profile saved.' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Failed to save profile.' });
    } finally {
      setSavingProfile(false);
    }
  }

  // ── Save location ───────────────────────────────────────────────────────
  async function saveLocation() {
    setSavingLocation(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({ street_address: streetAddress || null, city: city || null, state: state || null, zip: zip || null, country: country || null, updated_at: new Date().toISOString() })
        .eq('id', initialSchool.id);
      if (error) throw error;
      setToast({ type: 'success', message: 'Location saved.' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Failed to save location.' });
    } finally {
      setSavingLocation(false);
    }
  }

  // ── Save links ──────────────────────────────────────────────────────────
  async function saveLinks() {
    setSavingLinks(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({ website: website || null, instagram: instagram || null, facebook: facebook || null, youtube: youtube || null, tiktok: tiktok || null, updated_at: new Date().toISOString() })
        .eq('id', initialSchool.id);
      if (error) throw error;
      setToast({ type: 'success', message: 'Links & social media saved.' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Failed to save links.' });
    } finally {
      setSavingLinks(false);
    }
  }

  // ── Delete school ───────────────────────────────────────────────────────
  async function confirmDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', initialSchool.id);
      if (error) throw error;
      router.push('/dashboard');
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message ?? 'Failed to delete school registration.' });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ── Status card config ──────────────────────────────────────────────────
  const statusConfig = {
    pending: {
      badge: 'bg-amber-100 text-amber-800',
      dot: 'bg-amber-500',
      label: 'Under Review',
      message: 'Your school registration is currently under review. We\'ll notify you when it\'s approved (typically 3-5 business days).',
    },
    approved: {
      badge: 'bg-emerald-100 text-emerald-800',
      dot: 'bg-emerald-500',
      label: 'Approved',
      message: 'Your school is live on GOYA. ✓',
    },
    rejected: {
      badge: 'bg-red-100 text-red-800',
      dot: 'bg-red-500',
      label: 'Not Approved',
      message: 'Contact support@goya.community to appeal this decision.',
    },
    suspended: {
      badge: 'bg-orange-100 text-orange-800',
      dot: 'bg-orange-500',
      label: 'Suspended',
      message: 'Your school has been suspended. Contact support@goya.community for assistance.',
    },
  };

  const status = initialSchool.status ?? 'pending';
  const cfg = statusConfig[status];
  const canDelete = status === 'pending' || status === 'rejected';

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">

      {/* Submission banner */}
      {showBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-emerald-800">
            Your school registration has been submitted! Our team will review it within 3-5 business days.
          </p>
          <button onClick={() => setShowBanner(false)} className="ml-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity text-emerald-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Page title */}
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">School Settings</h1>

      {/* Status card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-sm font-semibold text-[#374151]">Registration Status</p>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-[#6B7280]">{cfg.message}</p>
        {status === 'rejected' && initialSchool.rejection_reason && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-red-700 mb-1">Reason for rejection:</p>
            <p className="text-sm text-red-700">{initialSchool.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* School Profile card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">School Profile</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">School Logo</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="School logo"
                  className="w-16 h-16 rounded-xl object-cover border border-[#E5E7EB] shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-[#E5E7EB] flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h6" />
                  </svg>
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm font-medium border border-[#E5E7EB] rounded-lg text-[#374151] hover:bg-slate-50 transition-colors"
                >
                  Change Logo
                </button>
                <p className="text-xs text-[#6B7280] mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          {/* School Name */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">School Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your school name"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
            />
          </div>

          {/* Slug (read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">URL Slug (read-only)</label>
            <input
              type="text"
              value={initialSchool.slug ?? ''}
              readOnly
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-slate-50 text-[#6B7280] font-mono cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-[#6B7280]">Slug is assigned automatically and cannot be changed.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder="Tell people about your school…"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] resize-none transition-colors"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4E87A0] text-white text-sm font-semibold hover:bg-[#3A7190] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {savingProfile ? <Spinner /> : null}
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Location card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Location</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">Street Address</label>
            <input
              type="text"
              value={streetAddress}
              onChange={e => setStreetAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">State / Province</label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="State"
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">ZIP / Postal Code</label>
              <input
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                placeholder="12345"
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Country</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="United States"
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={saveLocation}
              disabled={savingLocation}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4E87A0] text-white text-sm font-semibold hover:bg-[#3A7190] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {savingLocation ? <Spinner /> : null}
              {savingLocation ? 'Saving…' : 'Save Location'}
            </button>
          </div>
        </div>
      </div>

      {/* Links & Social Media card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Links &amp; Social Media</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Website', value: website, setter: setWebsite, placeholder: 'https://yourschool.com' },
            { label: 'Instagram', value: instagram, setter: setInstagram, placeholder: 'https://instagram.com/yourschool' },
            { label: 'Facebook', value: facebook, setter: setFacebook, placeholder: 'https://facebook.com/yourschool' },
            { label: 'YouTube', value: youtube, setter: setYoutube, placeholder: 'https://youtube.com/@yourschool' },
            { label: 'TikTok', value: tiktok, setter: setTiktok, placeholder: 'https://tiktok.com/@yourschool' },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">{field.label}</label>
              <input
                type="url"
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
              />
            </div>
          ))}
          <div className="flex justify-end pt-1">
            <button
              onClick={saveLinks}
              disabled={savingLinks}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4E87A0] text-white text-sm font-semibold hover:bg-[#3A7190] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {savingLinks ? <Spinner /> : null}
              {savingLinks ? 'Saving…' : 'Save Links'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {canDelete && (
        <div className="rounded-xl border-2 border-red-200 overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
          </div>
          <div className="px-6 py-5 bg-white flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Delete School Registration</p>
              <p className="text-xs text-[#6B7280] mt-1">
                Permanently delete this school registration. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete Registration
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1B3A5C]">Delete School Registration?</h3>
                <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">
                  This will permanently delete your school registration and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? <Spinner /> : null}
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />}
    </div>
  );
}
