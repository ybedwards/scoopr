"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "not-admin" ? "That account is not an admin." : null,
  );

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Admin accounts are never created from this page.
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setError(error.message);
    else {
      router.replace("/applications");
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={sent ? verify : sendCode}
      className="mx-auto mt-24 flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-6"
    >
      <h1 className="text-2xl font-bold">Scoopr Admin</h1>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={sent}
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </label>
      {sent ? (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Code from your email
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base"
          />
        </label>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        disabled={busy}
        className="rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {sent ? "Sign in" : "Email me a code"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
