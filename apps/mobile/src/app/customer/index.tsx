import {
  FREQUENCY_LABELS,
  YARD_SIZE_LABELS,
  formatCents,
  quote,
  type Frequency,
  type PropertyRow,
} from '@scoopr/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { usePricing } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import { Body, Button, Card, Label, Loading, Screen, Title } from '@/ui/kit';

const FREQUENCIES: Frequency[] = ['weekly', 'twice_weekly', 'biweekly', 'one_time'];

export default function CustomerHome() {
  const { session, profile } = useAuth();
  const rules = usePricing();
  const [property, setProperty] = useState<PropertyRow | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('properties')
        .select('*')
        .eq('customer_id', session!.user.id)
        .order('created_at')
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setProperty(data));
    }, [session]),
  );

  if (property === undefined) return <Loading />;

  if (!property) {
    return (
      <Screen>
        <Title>Hi{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!</Title>
        <Body muted>Tell us about your yard to see your price. It takes about a minute.</Body>
        <Button title="Add my yard" onPress={() => router.push('/customer/property')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Label>Service address</Label>
        <Body>
          {property.address_line1}
          {property.address_line2 ? `, ${property.address_line2}` : ''}
        </Body>
        <Body>
          {property.city}, {property.state} {property.zip}
        </Body>
        <Body muted>
          {property.dogs} {property.dogs === 1 ? 'dog' : 'dogs'} · {YARD_SIZE_LABELS[property.yard_size]} yard
        </Body>
      </Card>
      <Button
        title="Edit yard details"
        variant="secondary"
        onPress={() => router.push({ pathname: '/customer/property', params: { id: property.id } })}
      />
      <Title>Your prices</Title>
      {FREQUENCIES.map((frequency) => {
        const q = quote({ dogs: property.dogs, yardSize: property.yard_size, frequency }, rules);
        return (
          <Card key={frequency}>
            <Label>{FREQUENCY_LABELS[frequency]}</Label>
            <Body>
              {formatCents(q.perVisitCents)} per visit
              {q.estimatedMonthlyCents !== null ? ` · about ${formatCents(q.estimatedMonthlyCents)}/month` : ''}
            </Body>
          </Card>
        );
      })}
      <Body muted>Booking opens soon. We will notify you when scoopers are available in your area.</Body>
    </Screen>
  );
}
