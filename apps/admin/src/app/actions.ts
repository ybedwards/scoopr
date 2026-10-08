"use server";

import type { ApplicationStatus } from "@scoopr/shared";
import { normalizeZip } from "@scoopr/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const STATUSES: ApplicationStatus[] = ["pending", "approved", "rejected", "deactivated"];

export async function setApplicationStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const scooperId = String(formData.get("scooperId"));
  const status = String(formData.get("status")) as ApplicationStatus;
  if (!STATUSES.includes(status)) throw new Error("Unknown status");
  const note = String(formData.get("note") ?? "").trim();

  const { error } = await supabase
    .from("scooper_applications")
    .update({ status, review_note: note || null })
    .eq("scooper_id", scooperId);
  if (error) throw new Error(error.message);
  revalidatePath("/applications");
}

function positiveNumber(formData: FormData, name: string): number {
  const value = Number(formData.get(name));
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number`);
  return value;
}

function dollarsToCents(formData: FormData, name: string): number {
  return Math.round(positiveNumber(formData, name) * 100);
}

export async function updatePricing(formData: FormData) {
  const { supabase } = await requireAdmin();
  const commissionPercent = Number(formData.get("commission_percent"));
  if (!(commissionPercent >= 0 && commissionPercent < 100)) {
    throw new Error("Commission must be between 0 and 100 percent");
  }
  const extraDog = Number(formData.get("extra_dog"));
  if (!(extraDog >= 0)) throw new Error("Extra dog price must be 0 or more");

  const { error } = await supabase
    .from("pricing_rules")
    .update({
      base_visit_cents: dollarsToCents(formData, "base_visit"),
      extra_dog_cents: Math.round(extraDog * 100),
      yard_small: positiveNumber(formData, "yard_small"),
      yard_medium: positiveNumber(formData, "yard_medium"),
      yard_large: positiveNumber(formData, "yard_large"),
      freq_twice_weekly: positiveNumber(formData, "freq_twice_weekly"),
      freq_weekly: positiveNumber(formData, "freq_weekly"),
      freq_biweekly: positiveNumber(formData, "freq_biweekly"),
      one_time_base_cents: dollarsToCents(formData, "one_time_base"),
      commission_rate: commissionPercent / 100,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/pricing");
}

export async function setZipActive(formData: FormData) {
  const { supabase } = await requireAdmin();
  const zip = String(formData.get("zip"));
  const active = formData.get("active") === "true";
  const { error } = await supabase.from("service_zips").update({ active }).eq("zip", zip);
  if (error) throw new Error(error.message);
  revalidatePath("/service-area");
}

export async function addZip(formData: FormData) {
  const { supabase } = await requireAdmin();
  const zip = normalizeZip(String(formData.get("zip") ?? ""));
  const area = String(formData.get("area") ?? "").trim();
  if (!zip || !area) throw new Error("Enter a 5-digit ZIP code and an area name");
  const { error } = await supabase
    .from("service_zips")
    .upsert({ zip, area, active: true });
  if (error) throw new Error(error.message);
  revalidatePath("/service-area");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
