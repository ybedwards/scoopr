import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';
import { Body, Screen, Title } from '@/ui/kit';

export default function Index() {
  const { session, profile } = useAuth();
  if (!session) return <Redirect href="/sign-in" />;
  if (profile?.role === 'customer') return <Redirect href="/customer" />;
  if (profile?.role === 'scooper') return <Redirect href="/scooper" />;
  return (
    <Screen>
      <Title>Admin account</Title>
      <Body muted>Admins use the Scoopr admin website, not the app.</Body>
    </Screen>
  );
}
