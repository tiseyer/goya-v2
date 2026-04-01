export default function PlaceholderTab({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-6 py-16 text-center">
        <h3 className="text-base font-semibold text-[#1B3A5C]">{title}</h3>
        <p className="text-sm text-[#6B7280] mt-2">{body}</p>
      </div>
    </div>
  )
}
