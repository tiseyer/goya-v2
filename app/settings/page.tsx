'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updateProfile } from './actions';

const INPUT = 'w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf] transition-colors placeholder:text-slate-400';
const LABEL = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide';

const ROLE_BADGE: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-teal-100 text-teal-700',
  wellness_practitioner: 'bg-emerald-100 text-emerald-700',
  school: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
  moderator: 'bg-orange-100 text-orange-700',
};

const TEACHING_STYLES_LIST = ['Hatha Yoga','Vinyasa Yoga','Yin Yoga','Restorative Yoga','Ashtanga Yoga','Prenatal Yoga','Postnatal Yoga',"Children's Yoga",'Power Yoga','Kundalini Yoga','Hot Yoga','Gentle Yoga','Modern Contemporaries','Traditional Lineage-based','Trauma-informed Yoga','Iyengar Yoga','Somatic Yoga','Chair Yoga','Aerial Yoga','Karma Yoga'];
const LINEAGES_LIST = ['Hatha Yoga','Raja Yoga','Ashtanga Yoga (Pattabhi Jois)','Iyengar Yoga','Sivananda Yoga','Bihar Yoga','Satyananda Yoga','Kundalini Yoga (Yogi Bhajan)','Integral Yoga (Swami Satchidananda)','Krishnamacharya (Mysore)','Tantric Yoga','Bhakti Yoga','Jnana Yoga','Modern & Contemporary','Mixed Influences'];
const TEACHING_FOCUS_LIST = ['Strength & Stability','Flexibility & Mobility','Balance & Coordination','Relaxation & Stress Relief','Meditation & Mindfulness','Traditional Teachings','Breath Work','Daily Movement & Well-Being','Restorative & Recovery','Energy & Spiritual Exploration','Teaching & Skill Development'];
const INFLUENCES_LIST = ['Traditional lineages','Eastern philosophy','Modern contemporaries','Yoga education & educators','Independent self-study'];
const PROGRAMS_LIST = ['Teacher Training Program','Specialty & Continuing Education','Workshops','Retreats','Community Classes','Mentorship'];
const YEARS_TEACHING_OPTIONS = ['0-1','1-2','2-3','3-5','5-10','10-15','15-20','20+'];

function CheckboxGroup({ label, options, value, onChange, max }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter(x => x !== opt));
    } else if (!max || value.length < max) {
      onChange([...value, opt]);
    }
  };
  return (
    <div>
      <label className={LABEL}>{label}{max ? ` (select up to ${max})` : ''}</label>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {options.map(opt => {
          const selected = value.includes(opt);
          const disabled = !!max && !selected && value.length >= max;
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)} disabled={disabled}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selected ? 'bg-[#1a2744] text-white border-[#1a2744]'
                : disabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsGeneralPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{msg: string; type: 'success'|'error'} | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [bio, setBio]             = useState('');
  const [location, setLocation]   = useState('');
  const [website, setWebsite]     = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube]     = useState('');

  // Universal
  const [introduction, setIntroduction] = useState('');
  const [videoIntroUrl, setVideoIntroUrl] = useState('');

  // Student
  const [practiceLevel, setPracticeLevel] = useState('');
  const [practiceStyles, setPracticeStyles] = useState<string[]>([]);

  // Teacher
  const [influences, setInfluences] = useState<string[]>([]);
  const [yearsTeaching, setYearsTeaching] = useState('');
  const [teachingStylesProfile, setTeachingStylesProfile] = useState<string[]>([]);
  const [teachingFormat, setTeachingFormat] = useState('');
  const [teachingFocus, setTeachingFocus] = useState<string[]>([]);
  const [lineage, setLineage] = useState<string[]>([]);

  // School
  const [programsOffered, setProgramsOffered] = useState<string[]>([]);
  const [schoolEstablished, setSchoolEstablished] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState('');

  // Modal state
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [showEndSubModal, setShowEndSubModal]   = useState(false);
  const [deleteInput, setDeleteInput]           = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (p) {
        setProfile(p);
        setFirstName(p.first_name ?? '');
        setLastName(p.last_name ?? '');
        setEmail(user.email ?? '');
        setBio(p.bio ?? '');
        setLocation(p.location ?? '');
        setWebsite(p.website ?? '');
        setInstagram(p.instagram ?? '');
        setYoutube(p.youtube ?? '');
        setIntroduction(p.introduction ?? '');
        setVideoIntroUrl(p.video_intro_url ?? '');
        setPracticeLevel(p.practice_level ?? '');
        setPracticeStyles(p.practice_styles ?? []);
        setInfluences(p.influences ?? []);
        setYearsTeaching(p.years_teaching ?? '');
        setTeachingStylesProfile(p.teaching_styles_profile ?? []);
        setTeachingFormat(p.teaching_format ?? '');
        setTeachingFocus(p.teaching_focus ?? []);
        setLineage(p.lineage ?? []);
        setProgramsOffered(p.programs_offered ?? []);
        setSchoolEstablished(p.established_year?.toString() ?? '');
        setDeliveryFormat(p.practice_format ?? '');
      }
      setLoading(false);
    }
    load();
  }, []);

  function showToast(msg: string, type: 'success'|'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      bio, location, website, instagram, youtube,
      introduction,
      video_intro_url: videoIntroUrl,
      practice_level: practiceLevel,
      practice_styles: practiceStyles,
      influences,
      years_teaching: yearsTeaching,
      teaching_styles_profile: teachingStylesProfile,
      teaching_format: teachingFormat,
      teaching_focus: teachingFocus,
      lineage,
      programs_offered: programsOffered,
      established_year: schoolEstablished ? parseInt(schoolEstablished) : null,
      practice_format: deliveryFormat || null,
    });
    setSaving(false);
    if (error) showToast(error, 'error');
    else showToast('Profile updated');
  }

  async function handleEmailUpdate() {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) showToast(error.message, 'error');
    else showToast('Verification email sent to ' + email);
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return;
    showToast('Account deletion requested. Our team will process this within 24 hours.');
    setShowDeleteModal(false);
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || (user?.email?.[0] ?? 'U').toUpperCase();
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="p-6 max-w-4xl">
      <div className="space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-[#1a2744]">General</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your GOYA profile and account</p>
        </div>

        {/* SECTION 1: Profile Information */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#1a2744]">Profile Information</h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1a2744] text-white flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Profile Photo</p>
              <p className="text-xs text-slate-400 mt-0.5">Avatar upload coming soon</p>
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>First Name</label>
              <input className={INPUT} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div>
              <label className={LABEL}>Last Name</label>
              <input className={INPUT} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>

          {/* Introduction tagline */}
          <div>
            <label className={LABEL}>Introduction <span className="normal-case text-slate-400 font-normal">({introduction.length}/120)</span></label>
            <input className={INPUT} value={introduction} onChange={e => setIntroduction(e.target.value.slice(0, 120))} placeholder="Short tagline — e.g. 'Hatha teacher & wellness coach in Berlin'" />
          </div>

          {/* Video Introduction */}
          <div>
            <label className={LABEL}>Video Introduction (YouTube URL)</label>
            <input className={INPUT} value={videoIntroUrl} onChange={e => setVideoIntroUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </div>

          {/* Bio */}
          <div>
            <label className={LABEL}>Bio <span className="normal-case text-slate-400">({bio.length}/500)</span></label>
            <textarea className={INPUT + ' resize-none'} rows={4} maxLength={500} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the community about yourself..." />
          </div>

          {/* Location */}
          <div>
            <label className={LABEL}>Location</label>
            <input className={INPUT} value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LABEL}>Website</label>
              <input className={INPUT} value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" />
            </div>
            <div>
              <label className={LABEL}>Instagram</label>
              <input className={INPUT} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" />
            </div>
            <div>
              <label className={LABEL}>YouTube</label>
              <input className={INPUT} value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="Channel name" />
            </div>
          </div>

          <button type="submit" disabled={saving} className="bg-[#2dd4bf] hover:bg-[#14b8a6] text-[#1a2744] font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* STUDENT: Practice Profile */}
        {profile?.role === 'student' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#1a2744]">Practice Profile</h2>

            {/* Practice Level */}
            <div>
              <label className={LABEL}>Practice Level</label>
              <div className="flex gap-3 mt-1.5">
                {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="practiceLevel" value={level} checked={practiceLevel === level} onChange={() => setPracticeLevel(level)} className="accent-[#2dd4bf]" />
                    <span className="text-sm text-slate-700">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <CheckboxGroup label="Practice Styles" options={TEACHING_STYLES_LIST} value={practiceStyles} onChange={setPracticeStyles} />
          </div>
        )}

        {/* TEACHER: Teaching Profile */}
        {profile?.role === 'teacher' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#1a2744]">Teaching Profile</h2>

            {/* Years Teaching */}
            <div>
              <label className={LABEL}>Years Teaching</label>
              <select className={INPUT} value={yearsTeaching} onChange={e => setYearsTeaching(e.target.value)}>
                <option value="">Select range</option>
                {YEARS_TEACHING_OPTIONS.map(y => <option key={y} value={y}>{y} years</option>)}
              </select>
            </div>

            {/* Teaching Format */}
            <div>
              <label className={LABEL}>Teaching Format</label>
              <div className="flex gap-4 mt-1.5">
                {['In-Person', 'Online', 'Hybrid'].map(f => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="teachingFormat" value={f} checked={teachingFormat === f} onChange={() => setTeachingFormat(f)} className="accent-[#2dd4bf]" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </label>
                ))}
              </div>
            </div>

            <CheckboxGroup label="Influences" options={INFLUENCES_LIST} value={influences} onChange={setInfluences} />
            <CheckboxGroup label="Teaching Styles" options={TEACHING_STYLES_LIST} value={teachingStylesProfile} onChange={setTeachingStylesProfile} />
            <CheckboxGroup label="Teaching Focus" options={TEACHING_FOCUS_LIST} value={teachingFocus} onChange={setTeachingFocus} />
            <CheckboxGroup label="Lineage" options={LINEAGES_LIST} value={lineage} onChange={setLineage} max={3} />
          </div>
        )}

        {/* SCHOOL: School Profile */}
        {profile?.role === 'school' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-[#1a2744]">School Profile</h2>

            <CheckboxGroup label="Programs Offered" options={PROGRAMS_LIST} value={programsOffered} onChange={setProgramsOffered} />

            <div>
              <label className={LABEL}>Year Established</label>
              <input className={INPUT} value={schoolEstablished} onChange={e => setSchoolEstablished(e.target.value)} placeholder="e.g. 2015" maxLength={4} type="number" min={1900} max={2026} />
            </div>

            <div>
              <label className={LABEL}>Course Delivery Format</label>
              <div className="flex gap-4 mt-1.5">
                {['In-Person', 'Online', 'Hybrid'].map(f => (
                  <label key={f} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="deliveryFormat" value={f} checked={deliveryFormat === f} onChange={() => setDeliveryFormat(f)} className="accent-[#2dd4bf]" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </label>
                ))}
              </div>
            </div>

            <CheckboxGroup label="Lineage" options={LINEAGES_LIST} value={lineage} onChange={setLineage} max={3} />
          </div>
        )}

        {/* SECTION 2: Account Information */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#1a2744]">Account Information</h2>

          {/* Email */}
          <div>
            <label className={LABEL}>Email Address</label>
            <div className="flex gap-2">
              <input className={INPUT + ' flex-1'} type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <button type="button" onClick={handleEmailUpdate} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors whitespace-nowrap">
                Update
              </button>
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={LABEL}>Member Number (MRN)</label>
              <span className="inline-block font-mono bg-slate-100 px-3 py-2 rounded-lg text-sm text-slate-800 tracking-widest">{profile?.mrn ?? '—'}</span>
            </div>
            <div>
              <label className={LABEL}>Member Since</label>
              <span className="inline-block text-sm text-slate-700 py-2">{memberSince}</span>
            </div>
            <div>
              <label className={LABEL}>Role</label>
              <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${ROLE_BADGE[profile?.role ?? 'student'] ?? 'bg-slate-100 text-slate-700'}`}>
                {(profile?.role ?? 'student').replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Danger Zone */}
        <div className="rounded-2xl border-2 border-red-100 bg-red-50/20 p-6">
          <h2 className="text-lg font-bold text-red-700 mb-1">Danger Zone</h2>
          <p className="text-sm text-red-500/80 mb-5">These actions are permanent or hard to reverse.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowEndSubModal(true)} className="px-4 py-2.5 border-2 border-red-200 text-red-600 font-semibold text-sm rounded-xl hover:bg-red-50 transition-colors">
              End Subscription
            </button>
            <button type="button" onClick={() => setShowDeleteModal(true)} className="px-4 py-2.5 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors">
              Delete My Account
            </button>
          </div>
        </div>

      </div>

      {/* END SUBSCRIPTION MODAL */}
      {showEndSubModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">End Subscription?</h3>
            <p className="text-slate-500 text-sm mb-6">Your access will continue until the end of the current billing period. No refunds for partial months.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndSubModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => { setShowEndSubModal(false); showToast('Cancellation request submitted.'); }} className="flex-1 px-4 py-2.5 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Your Account?</h3>
            <p className="text-slate-500 text-sm mb-4">This will permanently delete your profile and all associated data. Type <strong>DELETE</strong> to confirm.</p>
            <input className={INPUT.replace('bg-white', 'bg-slate-50')} placeholder="Type DELETE" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowDeleteModal(false); setDeleteInput(''); }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleDeleteAccount} disabled={deleteInput !== 'DELETE'} className="flex-1 px-4 py-2.5 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 disabled:opacity-40 transition-colors">Delete Account</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-xl text-sm font-medium z-50 animate-step-in ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#1a2744] text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
