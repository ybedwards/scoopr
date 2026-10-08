import {
  MAX_DOGS,
  YARD_SIZE_LABELS,
  formatCents,
  normalizeZip,
  quote,
  type YardSize,
} from '@scoopr/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { usePricing } from '@/lib/pricing';
import { supabase } from '@/lib/supabase';
import { useServiceZips } from '@/lib/useServiceZips';
import { Body, Button, Card, Chips, ErrorText, Field, Screen, Stepper, SwitchRow } from '@/ui/kit';

const YARD_SIZES: YardSize[] = ['small', 'medium', 'large'];

export default function PropertyForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const rules = usePricing();
  const { zips, loading: zipsLoading } = useServiceZips();

  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('Philadelphia');
  const [zipInput, setZipInput] = useState('');
  const [dogs, setDogs] = useState(1);
  const [yardSize, setYardSize] = useState<YardSize>('small');
  const [gateNotes, setGateNotes] = useState('');
  const [dogOutside, setDogOutside] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setLine1(data.address_line1);
        setLine2(data.address_line2 ?? '');
        setCity(data.city);
        setZipInput(data.zip);
        setDogs(data.dogs);
        setYardSize(data.yard_size);
        setGateNotes(data.gate_notes ?? '');
        setDogOutside(data.dog_outside);
      });
  }, [id]);

  const zip = normalizeZip(zipInput);
  const zipCovered = useMemo(() => !!zip && zips.some((z) => z.zip === zip), [zip, zips]);
  const weekly = quote({ dogs, yardSize, frequency: 'weekly' }, rules);

  async function save() {
    if (!zip || !zipCovered) return;
    setBusy(true);
    setError(null);
    const row = {
      customer_id: session!.user.id,
      address_line1: line1.trim(),
      address_line2: line2.trim() || null,
      city: city.trim(),
      zip,
      dogs,
      yard_size: yardSize,
      gate_notes: gateNotes.trim() || null,
      dog_outside: dogOutside,
    };
    const { error } = id
      ? await supabase.from('properties').update(row).eq('id', id)
      : await supabase.from('properties').insert(row);
    setBusy(false);
    if (error) setError(error.message);
    else router.back();
  }

  return (
    <Screen>
      <Field label="Street address" value={line1} onChangeText={setLine1} autoComplete="street-address" />
      <Field label="Apartment or unit (optional)" value={line2} onChangeText={setLine2} />
      <Field label="City or town" value={city} onChangeText={setCity} />
      <Field
        label="ZIP code"
        value={zipInput}
        onChangeText={setZipInput}
        keyboardType="number-pad"
        autoComplete="postal-code"
        maxLength={10}
      />
      {zip && !zipsLoading && !zipCovered ? (
        <ErrorText>
          We don&apos;t serve {zip} yet. We&apos;re starting in Philadelphia and nearby suburbs.
        </ErrorText>
      ) : null}
      <Stepper label="Dogs" value={dogs} min={1} max={MAX_DOGS} onChange={setDogs} />
      <Chips
        label="Yard size"
        options={YARD_SIZES.map((v) => ({ value: v, label: YARD_SIZE_LABELS[v] }))}
        selected={[yardSize]}
        onToggle={setYardSize}
      />
      <Field
        label="Gate code or access notes"
        value={gateNotes}
        onChangeText={setGateNotes}
        multiline
        placeholder="e.g. Side gate, code 1234"
      />
      <SwitchRow label="A dog may be in the yard during visits" value={dogOutside} onChange={setDogOutside} />
      <Card>
        <Body>Weekly service: {formatCents(weekly.perVisitCents)} per visit</Body>
      </Card>
      <ErrorText>{error}</ErrorText>
      <Button
        title="Save"
        onPress={save}
        loading={busy}
        disabled={!line1.trim() || !city.trim() || !zipCovered}
      />
    </Screen>
  );
}
