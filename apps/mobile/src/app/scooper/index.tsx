import { DAY_LABELS, type ScooperApplicationRow } from '@scoopr/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Body, Button, Card, Label, Loading, Screen, Title } from '@/ui/kit';

const STATUS_COPY: Record<ScooperApplicationRow['status'], { title: string; body: string }> = {
  pending: {
    title: 'Application received',
    body: 'We are reviewing your application. We will email you when you are approved.',
  },
  approved: {
    title: 'You are approved',
    body: 'Jobs in your area will show up here once customer booking opens.',
  },
  rejected: {
    title: 'Application not approved',
    body: 'We could not approve your application right now.',
  },
  deactivated: {
    title: 'Account paused',
    body: 'Your scooper account is paused. Contact support for help.',
  },
};

export default function ScooperHome() {
  const { session, profile } = useAuth();
  const [app, setApp] = useState<ScooperApplicationRow | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('scooper_applications')
        .select('*')
        .eq('scooper_id', session!.user.id)
        .maybeSingle()
        .then(({ data }) => setApp(data));
    }, [session]),
  );

  if (app === undefined) return <Loading />;

  if (!app) {
    return (
      <Screen>
        <Title>Earn money scooping in Philly</Title>
        <Body muted>
          Pick the neighborhoods and days you want to work. Recurring customers stay with you week
          after week, and you are paid weekly.
        </Body>
        <Button title="Start my application" onPress={() => router.push('/scooper/apply')} />
      </Screen>
    );
  }

  const copy = STATUS_COPY[app.status];
  return (
    <Screen>
      <Title>{copy.title}</Title>
      <Body muted>{copy.body}</Body>
      {app.review_note ? (
        <Card>
          <Label>Note from Scoopr</Label>
          <Body>{app.review_note}</Body>
        </Card>
      ) : null}
      <Card>
        <Label>Name</Label>
        <Body>{profile?.full_name || 'Not set'}</Body>
        <Label>Phone</Label>
        <Body>{profile?.phone || 'Not set'}</Body>
        <Label>ZIP codes</Label>
        <Body>{app.service_zips.join(', ')}</Body>
        <Label>Days</Label>
        <Body>{app.available_days.map((d) => DAY_LABELS[d]).join(', ') || 'None picked'}</Body>
        <Label>Visits per day</Label>
        <Body>Up to {app.max_visits_per_day}</Body>
      </Card>
      {app.status === 'pending' || app.status === 'approved' ? (
        <Button title="Edit my details" variant="secondary" onPress={() => router.push('/scooper/apply')} />
      ) : null}
    </Screen>
  );
}
