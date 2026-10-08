import type { Frequency, PricingRules, Quote, QuoteInput } from './types';

/** Starting prices for the Philadelphia launch. Admins change these in the admin site. */
export const DEFAULT_PRICING: PricingRules = {
  baseVisitCents: 1600,
  extraDogCents: 400,
  yardMultiplier: { small: 1, medium: 1.15, large: 1.35 },
  frequencyMultiplier: { twice_weekly: 0.9, weekly: 1, biweekly: 1.25 },
  oneTimeBaseCents: 6000,
  commissionRate: 0.2,
};

export const MAX_DOGS = 10;

const VISITS_PER_YEAR: Record<Exclude<Frequency, 'one_time'>, number> = {
  twice_weekly: 104,
  weekly: 52,
  biweekly: 26,
};

/** Rounds to the nearest 50 cents so prices look clean. */
function roundToHalfDollar(cents: number): number {
  return Math.round(cents / 50) * 50;
}

export function quote(input: QuoteInput, rules: PricingRules = DEFAULT_PRICING): Quote {
  const { dogs, yardSize, frequency } = input;
  if (!Number.isInteger(dogs) || dogs < 1 || dogs > MAX_DOGS) {
    throw new RangeError(`dogs must be a whole number from 1 to ${MAX_DOGS}`);
  }

  const extraDogs = (dogs - 1) * rules.extraDogCents;
  const yard = rules.yardMultiplier[yardSize];

  let perVisitCents: number;
  let estimatedMonthlyCents: number | null = null;
  if (frequency === 'one_time') {
    perVisitCents = roundToHalfDollar((rules.oneTimeBaseCents + extraDogs) * yard);
  } else {
    perVisitCents = roundToHalfDollar(
      (rules.baseVisitCents + extraDogs) * yard * rules.frequencyMultiplier[frequency],
    );
    estimatedMonthlyCents = Math.round((perVisitCents * VISITS_PER_YEAR[frequency]) / 12);
  }

  const platformFeeCents = Math.round(perVisitCents * rules.commissionRate);
  return {
    perVisitCents,
    platformFeeCents,
    scooperPayoutCents: perVisitCents - platformFeeCents,
    estimatedMonthlyCents,
  };
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
