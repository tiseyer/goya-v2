'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TOTAL_STEPS = 6;
const DRAFT_KEY = 'school-onboarding-draft';

const STEP_TITLES: Record<number, string> = {
  1: 'School Name',
  2: 'School Logo',
  3: 'School Description',
  4: 'Physical Address',
  5: 'Links & Social Media',
  6: 'Review & Submit',
};

interface FormData {
  name: string;
  logoPreview: string;
  description: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  website: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
}

const DEFAULT_FORM: FormData = {
  name: '',
  logoPreview: '',
  description: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  website: '',
  instagram: '',
  facebook: '',
  youtube: '',
  tiktok: '',
};

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

export default function SchoolOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save draft on form change
  useEffect(() => {
    try {
      const { logoPreview: _lp, ...rest } = form;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    } catch {
      // ignore
    }
  }, [form]);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setField('logoPreview', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function validateStep(step: number): boolean {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (step === 1) {
      if (!form.name.trim() || form.name.trim().length < 2) {
        errors.name = 'School name must be at least 2 characters.';
      }
    }
    if (step === 3) {
      if (form.description.trim().length < 100) {
        errors.description = 'Description must be at least 100 characters.';
      }
    }
    if (step === 4) {
      if (!form.city.trim()) errors.city = 'City is required.';
      if (!form.country.trim()) errors.country = 'Country is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleContinue() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated. Please sign in.');

      let finalLogoUrl = logoUrl;

      // Upload logo if a new file was selected
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('school-logos')
          .upload(path, logoFile, { upsert: true });

        if (uploadError) throw new Error(`Logo upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('school-logos').getPublicUrl(path);
        finalLogoUrl = urlData.publicUrl;
      }

      // Generate and verify slug uniqueness
      let slug = generateSlug(form.name.trim());
      const { data: existing } = await (supabase as any)
        .from('schools')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        slug = `${slug}-${randomSuffix()}`;
      }

      // Insert school record
      const { data: school, error: insertError } = await (supabase as any)
        .from('schools')
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          slug,
          logo_url: finalLogoUrl || null,
          description: form.description.trim() || null,
          street_address: form.streetAddress.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          zip: form.zip.trim() || null,
          country: form.country.trim() || null,
          website: form.website.trim() || null,
          instagram: form.instagram.trim() || null,
          facebook: form.facebook.trim() || null,
          youtube: form.youtube.trim() || null,
          tiktok: form.tiktok.trim() || null,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);

      localStorage.removeItem(DRAFT_KEY);
      router.push(`/schools/${school.id}/settings?submitted=1`);
    } catch (err: any) {
      setSubmitError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const step1CanContinue = form.name.trim().length >= 2;
  const step3CanContinue = form.description.trim().length >= 100;
  const step4CanContinue = form.city.trim().length > 0 && form.country.trim().length > 0;

  function canContinue(): boolean {
    if (currentStep === 1) return step1CanContinue;
    if (currentStep === 3) return step3CanContinue;
    if (currentStep === 4) return step4CanContinue;
    return true;
  }

  return (
    <div className="bg-[#F7F8FA] min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">

          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <span className="text-xs text-[#6B7280]">{STEP_TITLES[currentStep]}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4E87A0] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <h2 className="text-2xl font-bold text-[#1B3A5C] mt-5">
              {STEP_TITLES[currentStep]}
            </h2>
          </div>

          {/* Card Body */}
          <div className="px-8 py-8">
            {currentStep === 1 && (
              <StepSchoolName
                value={form.name}
                onChange={(v) => setField('name', v)}
                error={fieldErrors.name}
              />
            )}
            {currentStep === 2 && (
              <StepLogo
                logoPreview={form.logoPreview}
                onFileChange={handleFileChange}
                fileInputRef={fileInputRef}
              />
            )}
            {currentStep === 3 && (
              <StepDescription
                value={form.description}
                onChange={(v) => setField('description', v)}
                error={fieldErrors.description}
              />
            )}
            {currentStep === 4 && (
              <StepAddress
                form={form}
                setField={setField}
                errors={fieldErrors}
              />
            )}
            {currentStep === 5 && (
              <StepLinks
                form={form}
                setField={setField}
              />
            )}
            {currentStep === 6 && (
              <StepReview form={form} logoPreview={form.logoPreview} />
            )}
          </div>

          {/* Card Footer / Navigation */}
          <div className="px-8 pb-8">
            {currentStep === 6 && (
              <p className="text-xs text-[#9CA3AF] text-center mb-5">
                By submitting, you agree to GOYA&apos;s terms and that the information provided is accurate.
              </p>
            )}
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm border border-[#E5E7EB] text-[#4E87A0] hover:bg-[#F7F8FA] transition-colors disabled:opacity-50"
                >
                  ← Back
                </button>
              )}

              {currentStep === 2 ? (
                <div className="flex-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 px-4 py-3 rounded-xl font-medium text-sm border border-[#E5E7EB] text-[#9CA3AF] hover:bg-[#F7F8FA] transition-colors"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white bg-[#4E87A0] hover:bg-[#3d6f87] transition-colors"
                  >
                    Continue →
                  </button>
                </div>
              ) : currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue()}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm text-white bg-[#4E87A0] hover:bg-[#3d6f87] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentStep === 1 ? 'w-full' : 'flex-1'}`}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-[#4E87A0] hover:bg-[#3d6f87] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Submitting…
                    </span>
                  ) : (
                    'Submit School Registration →'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error toast */}
        {submitError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Step Components ──────────────────────────────────────────────────────────

function StepSchoolName({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-2">
        What is your school called? <span className="text-red-400">*</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Sunrise Yoga Studio"
        className={`w-full text-lg border rounded-xl px-4 py-3 outline-none transition-colors focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] ${error ? 'border-red-300 bg-red-50' : 'border-[#E5E7EB]'}`}
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {!error && value.trim().length > 0 && value.trim().length < 2 && (
        <p className="mt-2 text-xs text-[#9CA3AF]">Minimum 2 characters</p>
      )}
    </div>
  );
}

function StepLogo({
  logoPreview,
  onFileChange,
  fileInputRef,
}: {
  logoPreview: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-4">
        Upload your school logo <span className="text-[#9CA3AF] font-normal">(optional)</span>
      </label>

      {logoPreview ? (
        <div className="flex flex-col items-center gap-4">
          <img
            src={logoPreview}
            alt="Logo preview"
            className="w-32 h-32 object-contain rounded-xl border border-[#E5E7EB] p-2 bg-[#F7F8FA]"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-[#4E87A0] hover:underline"
          >
            Change logo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#D1D5DB] rounded-xl py-12 flex flex-col items-center gap-3 hover:border-[#4E87A0] hover:bg-[#4E87A0]/5 transition-colors"
        >
          <svg className="w-10 h-10 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-sm text-[#6B7280]">Click to upload an image</span>
          <span className="text-xs text-[#9CA3AF]">PNG, JPG, SVG up to 5MB</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  );
}

function StepDescription({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const count = value.length;
  const meetsMin = count >= 100;

  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-2">
        Tell us about your school <span className="text-red-400">*</span>
      </label>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your school's history, teaching style, community, and what makes you unique…"
        maxLength={1000}
        className={`w-full border rounded-xl px-4 py-3 outline-none resize-none transition-colors focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] ${error ? 'border-red-300 bg-red-50' : 'border-[#E5E7EB]'}`}
      />
      <div className="flex items-center justify-between mt-2">
        <div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!error && !meetsMin && count > 0 && (
            <p className="text-xs text-[#9CA3AF]">Minimum 100 characters</p>
          )}
          {!error && meetsMin && (
            <p className="text-xs text-[#4E87A0]">Looks good!</p>
          )}
        </div>
        <span className={`text-xs tabular-nums ${count > 900 ? 'text-amber-500' : 'text-[#9CA3AF]'}`}>
          {count} / 1000 characters
        </span>
      </div>
    </div>
  );
}

function StepAddress({
  form,
  setField,
  errors,
}: {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1.5">Street Address</label>
        <input
          type="text"
          value={form.streetAddress}
          onChange={(e) => setField('streetAddress', e.target.value)}
          placeholder="123 Main Street"
          className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            City <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            placeholder="Bali"
            className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] ${errors.city ? 'border-red-300 bg-red-50' : 'border-[#E5E7EB]'}`}
          />
          {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">State / Province</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => setField('state', e.target.value)}
            placeholder="California"
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">ZIP / Postal Code</label>
          <input
            type="text"
            value={form.zip}
            onChange={(e) => setField('zip', e.target.value)}
            placeholder="90210"
            className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Country <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => setField('country', e.target.value)}
            placeholder="e.g. United States"
            className={`w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] ${errors.country ? 'border-red-300 bg-red-50' : 'border-[#E5E7EB]'}`}
          />
          {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
        </div>
      </div>
    </div>
  );
}

function StepLinks({
  form,
  setField,
}: {
  form: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#6B7280]">All fields are optional.</p>
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1.5">Website URL</label>
        <input
          type="url"
          value={form.website}
          onChange={(e) => setField('website', e.target.value)}
          placeholder="https://www.yourschool.com"
          className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">Instagram</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF] select-none">@</span>
            <input
              type="text"
              value={form.instagram}
              onChange={(e) => setField('instagram', e.target.value)}
              placeholder="handle"
              className="w-full border border-[#E5E7EB] rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">TikTok</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF] select-none">@</span>
            <input
              type="text"
              value={form.tiktok}
              onChange={(e) => setField('tiktok', e.target.value)}
              placeholder="handle"
              className="w-full border border-[#E5E7EB] rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0]"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1.5">Facebook Page URL</label>
        <input
          type="url"
          value={form.facebook}
          onChange={(e) => setField('facebook', e.target.value)}
          placeholder="https://facebook.com/yourschool"
          className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#374151] mb-1.5">YouTube Channel URL</label>
        <input
          type="url"
          value={form.youtube}
          onChange={(e) => setField('youtube', e.target.value)}
          placeholder="https://youtube.com/@yourschool"
          className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0]"
        />
      </div>
    </div>
  );
}

function StepReview({
  form,
  logoPreview,
}: {
  form: FormData;
  logoPreview: string;
}) {
  const links = [
    form.website && { label: 'Website', value: form.website },
    form.instagram && { label: 'Instagram', value: `@${form.instagram}` },
    form.facebook && { label: 'Facebook', value: form.facebook },
    form.youtube && { label: 'YouTube', value: form.youtube },
    form.tiktok && { label: 'TikTok', value: `@${form.tiktok}` },
  ].filter(Boolean) as { label: string; value: string }[];

  const locationParts = [form.city, form.country].filter(Boolean);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6B7280] mb-6">
        Review the details below before submitting.
      </p>

      {/* School Name */}
      <ReviewCard label="School Name">
        <p className="text-[#1B3A5C] font-medium">{form.name || '—'}</p>
      </ReviewCard>

      {/* Logo */}
      <ReviewCard label="Logo">
        {logoPreview ? (
          <img
            src={logoPreview}
            alt="School logo"
            className="w-16 h-16 object-contain rounded-lg border border-[#E5E7EB] p-1 bg-[#F7F8FA]"
          />
        ) : (
          <p className="text-sm text-[#9CA3AF]">No logo uploaded</p>
        )}
      </ReviewCard>

      {/* Description */}
      <ReviewCard label="Description">
        <p className="text-sm text-[#374151] leading-relaxed">
          {form.description
            ? form.description.length > 200
              ? form.description.slice(0, 200) + '…'
              : form.description
            : <span className="text-[#9CA3AF]">Not provided</span>}
        </p>
      </ReviewCard>

      {/* Location */}
      <ReviewCard label="Location">
        <p className="text-sm text-[#374151]">
          {locationParts.length > 0 ? locationParts.join(', ') : <span className="text-[#9CA3AF]">Not provided</span>}
        </p>
      </ReviewCard>

      {/* Links */}
      <ReviewCard label="Links & Social Media">
        {links.length > 0 ? (
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.label} className="text-sm text-[#374151]">
                <span className="font-medium text-[#6B7280]">{l.label}:</span>{' '}
                <span className="text-[#4E87A0]">{l.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#9CA3AF]">None added</p>
        )}
      </ReviewCard>
    </div>
  );
}

function ReviewCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] px-5 py-4">
      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  );
}
