import type { ServiceZipRow } from "@scoopr/shared";

import { addZip, setZipActive } from "@/app/actions";
import { requireAdmin } from "@/lib/admin";

export default async function ServiceAreaPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("service_zips").select("*").order("area").order("zip");
  const zips = (data ?? []) as ServiceZipRow[];

  const byArea = new Map<string, ServiceZipRow[]>();
  for (const z of zips) byArea.set(z.area, [...(byArea.get(z.area) ?? []), z]);
  const activeCount = zips.filter((z) => z.active).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Service area</h1>
        <p className="text-sm text-neutral-600">
          {activeCount} of {zips.length} ZIP codes are open. Customers outside open ZIP codes cannot sign up a yard.
        </p>
      </div>
      {error ? <p className="text-red-700">{error.message}</p> : null}

      <form action={addZip} className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          ZIP code
          <input name="zip" required pattern="\d{5}" className="w-28 rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Area name
          <input name="area" required className="rounded-md border border-neutral-300 px-3 py-2" />
        </label>
        <button className="rounded-md bg-brand px-4 py-2 font-semibold text-white">Add ZIP code</button>
      </form>

      <div className="flex flex-col gap-3">
        {[...byArea.entries()].map(([area, areaZips]) => (
          <section key={area} className="rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="mb-2 font-semibold">{area}</h2>
            <div className="flex flex-wrap gap-2">
              {areaZips.map((z) => (
                <form key={z.zip} action={setZipActive}>
                  <input type="hidden" name="zip" value={z.zip} />
                  <input type="hidden" name="active" value={String(!z.active)} />
                  <button
                    title={z.active ? "Open. Click to close." : "Closed. Click to open."}
                    className={`rounded-full px-3 py-1 text-sm ${
                      z.active ? "bg-brand text-white" : "border border-neutral-300 text-neutral-500 line-through"
                    }`}
                  >
                    {z.zip}
                  </button>
                </form>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
