import {
  FREQUENCY_LABELS,
  formatCents,
  pricingFromRow,
  quote,
  type Frequency,
  type PricingRulesRow,
  type YardSize,
} from "@scoopr/shared";

import { updatePricing } from "@/app/actions";
import { requireAdmin } from "@/lib/admin";

const EXAMPLES: { dogs: number; yardSize: YardSize }[] = [
  { dogs: 1, yardSize: "small" },
  { dogs: 2, yardSize: "medium" },
  { dogs: 3, yardSize: "large" },
];
const FREQUENCIES: Frequency[] = ["twice_weekly", "weekly", "biweekly", "one_time"];

function NumberField(props: { name: string; label: string; defaultValue: number; step: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {props.label}
      <input
        type="number"
        name={props.name}
        step={props.step}
        min="0"
        required
        defaultValue={props.defaultValue}
        className="rounded-md border border-neutral-300 px-3 py-2 text-base font-normal"
      />
      {props.hint ? <span className="text-xs font-normal text-neutral-600">{props.hint}</span> : null}
    </label>
  );
}

export default async function PricingPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("pricing_rules").select("*").eq("id", 1).single();
  if (error || !data) {
    return <p className="text-red-700">Pricing is not set up. Run supabase/seed.sql. {error?.message}</p>;
  }
  const row = data as PricingRulesRow;
  const rules = pricingFromRow(row);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Pricing</h1>
      <form action={updatePricing} className="flex flex-col gap-6 rounded-xl border border-neutral-200 bg-white p-4">
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-semibold">Prices (dollars)</legend>
          <NumberField
            name="base_visit"
            label="Weekly visit, 1 dog, small yard"
            step="0.5"
            defaultValue={rules.baseVisitCents / 100}
          />
          <NumberField name="extra_dog" label="Each extra dog" step="0.5" defaultValue={rules.extraDogCents / 100} />
          <NumberField
            name="one_time_base"
            label="One-time cleanup, 1 dog, small yard"
            step="0.5"
            defaultValue={rules.oneTimeBaseCents / 100}
          />
          <NumberField
            name="commission_percent"
            label="Platform commission (%)"
            step="0.5"
            defaultValue={Math.round(rules.commissionRate * 1000) / 10}
          />
        </fieldset>
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <legend className="mb-2 font-semibold">Yard size multipliers</legend>
          <NumberField name="yard_small" label="Small" step="0.05" defaultValue={rules.yardMultiplier.small} />
          <NumberField name="yard_medium" label="Medium" step="0.05" defaultValue={rules.yardMultiplier.medium} />
          <NumberField name="yard_large" label="Large" step="0.05" defaultValue={rules.yardMultiplier.large} />
        </fieldset>
        <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <legend className="mb-2 font-semibold">Per-visit multipliers by frequency</legend>
          <NumberField
            name="freq_twice_weekly"
            label="Twice a week"
            step="0.05"
            defaultValue={rules.frequencyMultiplier.twice_weekly}
            hint="Below 1 gives a discount per visit"
          />
          <NumberField name="freq_weekly" label="Weekly" step="0.05" defaultValue={rules.frequencyMultiplier.weekly} />
          <NumberField
            name="freq_biweekly"
            label="Every 2 weeks"
            step="0.05"
            defaultValue={rules.frequencyMultiplier.biweekly}
            hint="Above 1 because yards build up more"
          />
        </fieldset>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-neutral-600">
            Last changed {new Date(row.updated_at).toLocaleString("en-US")}
          </span>
          <button className="rounded-md bg-brand px-4 py-2 font-semibold text-white">Save prices</button>
        </div>
      </form>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">What customers see per visit</h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="p-3">Yard</th>
                {FREQUENCIES.map((f) => (
                  <th key={f} className="p-3">
                    {FREQUENCY_LABELS[f]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map((ex) => (
                <tr key={`${ex.dogs}-${ex.yardSize}`} className="border-b border-neutral-100 last:border-0">
                  <td className="p-3">
                    {ex.dogs} {ex.dogs === 1 ? "dog" : "dogs"}, {ex.yardSize}
                  </td>
                  {FREQUENCIES.map((frequency) => {
                    const q = quote({ ...ex, frequency }, rules);
                    return (
                      <td key={frequency} className="p-3">
                        {formatCents(q.perVisitCents)}
                        <span className="block text-xs text-neutral-600">
                          scooper gets {formatCents(q.scooperPayoutCents)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
