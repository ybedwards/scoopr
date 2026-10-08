import type { UserRole } from '@scoopr/shared';
import { useState } from 'react';

import { supabase } from '@/lib/supabase';
import { Body, Button, Chips, ErrorText, Field, Screen, Title } from '@/ui/kit';

type Step = 'email' | 'code';

export default function SignIn() {
  const [step, setStep] = useState<Step>('email');
  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setBusy(true);
    setError(null);
    // Role and name only apply when this email is new; existing accounts keep theirs.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, data: { role, full_name: fullName.trim() } },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setStep('code');
  }

  async function verify() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) setError(error.message);
    // On success the auth listener switches to the right home screen.
  }

  if (step === 'code') {
    return (
      <Screen>
        <Title>Check your email</Title>
        <Body muted>We sent a sign-in code to {email.trim()}.</Body>
        <Field
          label="Code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
        />
        <ErrorText>{error}</ErrorText>
        <Button title="Sign in" onPress={verify} loading={busy} disabled={code.trim().length < 6} />
        <Button title="Use a different email" variant="secondary" onPress={() => setStep('email')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Pet waste pickup in Philly</Title>
      <Body muted>Book a scooper for your yard, or sign up to earn money scooping.</Body>
      <Chips
        label="I want to"
        options={[
          { value: 'customer', label: 'Get my yard cleaned' },
          { value: 'scooper', label: 'Work as a scooper' },
        ]}
        selected={[role]}
        onToggle={setRole}
      />
      <Field label="Your name" value={fullName} onChangeText={setFullName} autoComplete="name" />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Send me a code" onPress={sendCode} loading={busy} disabled={!email.includes('@')} />
      <Body muted>Already have an account? Just enter your email.</Body>
    </Screen>
  );
}
