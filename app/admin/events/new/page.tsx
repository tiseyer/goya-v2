import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import EventForm from '../components/EventForm';

export default async function NewEventPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const userRole = (profile?.role as string) ?? 'admin';

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Add New Event</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Fill in the details below to create a new event.</p>
      </div>
      <EventForm
        userRole={userRole}
        currentUserId={user.id}
        currentUserName={profile?.full_name ?? user.email ?? 'You'}
        currentUserAvatar={(profile as Record<string, unknown> | null)?.avatar_url as string | null ?? null}
      />
    </div>
  );
}
