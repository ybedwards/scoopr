import type { ApplicationStatus, PricingRules, UserRole, YardSize } from './types';

/** Row shapes for the tables in supabase/migrations. Keep in sync with the SQL. */

export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface ServiceZipRow {
  zip: string;
  area: string;
  active: boolean;
}

export interface PricingRulesRow {
  id: 1;
  base_visit_cents: number;
  extra_dog_cents: number;
  yard_small: number | string;
  yard_medium: number | string;
  yard_large: number | string;
  freq_twice_weekly: number | string;
  freq_weekly: number | string;
  freq_biweekly: number | string;
  one_time_base_cents: number;
  commission_rate: number | string;
  updated_at: string;
}

export interface PropertyRow {
  id: string;
  customer_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  dogs: number;
  yard_size: YardSize;
  gate_notes: string | null;
  dog_outside: boolean;
  created_at: string;
}

export interface ScooperApplicationRow {
  scooper_id: string;
  status: ApplicationStatus;
  service_zips: string[];
  has_tools: boolean;
  has_vehicle: boolean;
  available_days: number[];
  max_visits_per_day: number;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
}

export interface ScooperApplicationAdminRow extends ScooperApplicationRow {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

// Postgres numeric columns arrive as strings from PostgREST.
const num = (v: number | string) => (typeof v === 'number' ? v : Number(v));

export function pricingFromRow(row: PricingRulesRow): PricingRules {
  return {
    baseVisitCents: row.base_visit_cents,
    extraDogCents: row.extra_dog_cents,
    yardMultiplier: {
      small: num(row.yard_small),
      medium: num(row.yard_medium),
      large: num(row.yard_large),
    },
    frequencyMultiplier: {
      twice_weekly: num(row.freq_twice_weekly),
      weekly: num(row.freq_weekly),
      biweekly: num(row.freq_biweekly),
    },
    oneTimeBaseCents: row.one_time_base_cents,
    commissionRate: num(row.commission_rate),
  };
}

export const FREQUENCY_LABELS = {
  twice_weekly: 'Twice a week',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  one_time: 'One-time cleanup',
} as const;

export const YARD_SIZE_LABELS = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
} as const;

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
