import type { ServiceZipRow } from '@scoopr/shared';
import { useEffect, useState } from 'react';

import { supabase } from './supabase';

export function useServiceZips(): { zips: ServiceZipRow[]; loading: boolean } {
  const [zips, setZips] = useState<ServiceZipRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase
      .from('service_zips')
      .select('*')
      .eq('active', true)
      .order('area')
      .order('zip')
      .then(({ data }) => {
        setZips(data ?? []);
        setLoading(false);
      });
  }, []);
  return { zips, loading };
}
