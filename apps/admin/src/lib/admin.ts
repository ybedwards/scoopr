import { redirect } from "next/navigation";

import { createClient } from "./supabase/server";

/** Returns a Supabase client for a signed-in admin, or redirects to /login. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/login?error=not-admin");

  return { supabase, user, profile };
}
