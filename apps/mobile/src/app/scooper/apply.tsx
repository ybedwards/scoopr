import { DAY_LABELS } from '@scoopr/shared';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useServiceZips } from '@/lib/useServiceZips';
import {
  Body,
  Button,
  Chips,
  ErrorText,
  Field,
  Label,
  Loading,
  Screen,
  Stepper,
  SwitchRow,
} from '@/ui/kit';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function ScooperApply() {
  const { session, profile, refreshProfile } = useAuth();
  const { zips, loading } = useServiceZips();
  const userId = session!.user.id;

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [selectedZips, setSelectedZips] = useState<string[]>([]);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [maxVisits, setMaxVisits] = useState(10);
  const [hasTools, setHasTools] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    supabase
      .from('scooper_applications')
      .select('*')
      .eq('scooper_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setIsEdit(true);
        setSelectedZips(data.service_zips);
        setDays(data.available_days);
        setMaxVisits(data.max_visits_per_day);
        setHasTools(data.has_tools);
        setHasVehicle(data.has_vehicle);
      });
  }, [userId]);

  const byArea = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const z of zips) groups.set(z.area, [...(groups.get(z.area) ?? []), z.zip]);
    return [...groups.entries()];
  }, [zips]);

  async function submit() {
    setBusy(true);
    setError(null);
    const profileUpdate = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', userId);
    const application = await supabase.from('scooper_applications').upsert({
      scooper_id: userId,
      service_zips: selectedZips,
      available_days: [...days].sort((a, b) => a - b),
      max_visits_per_day: maxVisits,
      has_tools: hasTools,
      has_vehicle: hasVehicle,
    });
    setBusy(false);
    const failed = profileUpdate.error ?? application.error;
    if (failed) {
      setError(failed.message);
      return;
    }
    await refreshProfile();
    router.back();
  }

  if (loading) return <Loading />;

  return (
    <Screen>
      <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
      <Field
        label="Mobile phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <Chips
        label="Days you can work"
        options={DAY_LABELS.map((label, value) => ({ value, label }))}
        selected={days}
        onToggle={(d) => setDays((cur) => toggle(cur, d))}
      />
      <Stepper label="Visits per day, at most" value={maxVisits} min={1} max={40} onChange={setMaxVisits} />
      <SwitchRow label="I have my own scooping tools" value={hasTools} onChange={setHasTools} />
      <SwitchRow label="I have a car or reliable transport" value={hasVehicle} onChange={setHasVehicle} />
      <Label>Where you want to work</Label>
      <Body muted>Tap an area to pick all its ZIP codes, or tap single ZIP codes.</Body>
      {byArea.map(([area, areaZips]) => {
        const allOn = areaZips.every((z) => selectedZips.includes(z));
        return (
          <Chips
            key={area}
            options={[
              { value: `area:${area}`, label: area },
              ...(areaZips.length > 1 ? areaZips.map((z) => ({ value: z, label: z })) : []),
            ]}
            selected={[...(allOn ? [`area:${area}`] : []), ...selectedZips]}
            onToggle={(value) => {
              if (value.startsWith('area:')) {
                setSelectedZips((cur) =>
                  allOn ? cur.filter((z) => !areaZips.includes(z)) : [...new Set([...cur, ...areaZips])],
                );
              } else {
                setSelectedZips((cur) => toggle(cur, value));
              }
            }}
          />
        );
      })}
      <ErrorText>{error}</ErrorText>
      <Button
        title={isEdit ? 'Save changes' : 'Submit application'}
        onPress={submit}
        loading={busy}
        disabled={!fullName.trim() || phone.replace(/\D/g, '').length < 10 || selectedZips.length === 0 || days.length === 0}
      />
      <Body muted>
        After you apply we run a quick ID and background check before your first job.
      </Body>
    </Screen>
  );
}
