export type UserRole = 'customer' | 'scooper' | 'admin';

export type YardSize = 'small' | 'medium' | 'large';

/** How often a customer wants service. `one_time` is a single cleanup. */
export type Frequency = 'twice_weekly' | 'weekly' | 'biweekly' | 'one_time';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export interface PricingRules {
  /** Price in cents for one visit, one dog, small yard, weekly service. */
  baseVisitCents: number;
  /** Added per dog beyond the first, in cents. */
  extraDogCents: number;
  yardMultiplier: Record<YardSize, number>;
  /** Multiplier on the per-visit price for each recurring frequency. */
  frequencyMultiplier: Record<Exclude<Frequency, 'one_time'>, number>;
  /** Flat price in cents for a one-time cleanup, before dogs and yard size. */
  oneTimeBaseCents: number;
  /** Share of each visit the platform keeps, 0 to 1. */
  commissionRate: number;
}

export interface QuoteInput {
  dogs: number;
  yardSize: YardSize;
  frequency: Frequency;
}

export interface Quote {
  /** What the customer pays per visit, in cents. */
  perVisitCents: number;
  /** What the scooper earns per visit before tips, in cents. */
  scooperPayoutCents: number;
  /** What the platform keeps per visit, in cents. */
  platformFeeCents: number;
  /** Rough monthly total for recurring plans (visits × 52 / 12), in cents. Null for one-time. */
  estimatedMonthlyCents: number | null;
}
