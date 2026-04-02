interface ProfileBioProps {
  bio: string | null;
}

export default function ProfileBio({ bio }: ProfileBioProps) {
  if (!bio || bio.trim() === '') return null;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
        About
      </h2>
      <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">{bio}</p>
    </div>
  );
}
