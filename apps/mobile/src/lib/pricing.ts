import { DEFAULT_PRICING, pricingFromRow, type PricingRules } from '@scoopr/shared';
import { useEffect, useState } from 'react';

import { supabase } from './supabase';

/** Live pricing from the admin's settings, falling back to the launch defaults. */
export function usePricing(): PricingRules {
  const [rules, setRules] = useState<PricingRules>(DEFAULT_PRICING);
  useEffect(() => {
    supabase
      .from('pricing_rules')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRules(pricingFromRow(data));
      });
  }, []);
  return rules;
}
