import { redirect } from 'next/navigation';
import { ensureProfile, getSession } from '@/lib/session';
import { companyFromEmail, firstName, safeNext } from '@/lib/util';
import { OnboardingForm } from './OnboardingForm';

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const session = await getSession();
  const user = session.user;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/onboarding?next=${next}`)}`);
  const profile = session.profile ?? (await ensureProfile(session.supabase, user!));
  if (!profile) throw new Error('Could not create your card. Check that supabase/schema.sql has been run.');

  const company = companyFromEmail(user!.email);
  const guess = profile!.role_line || (company ? `at ${company}` : '');

  return (
    <main className="shell">
      <OnboardingForm
        next={next}
        name={profile!.full_name}
        first={firstName(profile!.full_name)}
        avatar={profile!.avatar_url}
        guess={guess}
        guessed={!!company && !profile!.role_line}
        status={profile!.status}
        topics={profile!.topics.join(', ')}
        linkedin={profile!.linkedin_url}
        viaLinkedIn={!!user!.identities?.some((i) => i.provider === 'linkedin_oidc')}
      />
    </main>
  );
}
