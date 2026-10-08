import { DAY_LABELS, type ApplicationStatus, type ScooperApplicationAdminRow } from "@scoopr/shared";
import Link from "next/link";

import { setApplicationStatus } from "@/app/actions";
import { requireAdmin } from "@/lib/admin";

const TABS: { status: ApplicationStatus; label: string }[] = [
  { status: "pending", label: "Waiting for review" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
  { status: "deactivated", label: "Deactivated" },
];

const ACTIONS: Record<ApplicationStatus, { status: ApplicationStatus; label: string; primary?: boolean }[]> = {
  pending: [
    { status: "approved", label: "Approve", primary: true },
    { status: "rejected", label: "Reject" },
  ],
  approved: [{ status: "deactivated", label: "Deactivate" }],
  rejected: [{ status: "approved", label: "Approve", primary: true }],
  deactivated: [{ status: "approved", label: "Reactivate", primary: true }],
};

export default async function ApplicationsPage({ searchParams }: PageProps<"/applications">) {
  const { supabase } = await requireAdmin();
  const requested = (await searchParams).status;
  const status = TABS.some((t) => t.status === requested) ? (requested as ApplicationStatus) : "pending";

  const { data, error } = await supabase
    .from("scooper_applications_admin")
    .select("*")
    .eq("status", status)
    .order("submitted_at", { ascending: true });
  const apps = (data ?? []) as ScooperApplicationAdminRow[];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Scooper applications</h1>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={`/applications?status=${t.status}`}
            className={`rounded-full px-3 py-1 text-sm ${
              t.status === status ? "bg-brand text-white" : "bg-white border border-neutral-300"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {error ? <p className="text-red-700">{error.message}</p> : null}
      {apps.length === 0 ? <p className="text-neutral-600">Nothing here.</p> : null}
      {apps.map((app) => (
        <section
          key={app.scooper_id}
          className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{app.full_name || "No name"}</h2>
            <span className="text-sm text-neutral-600">
              Applied {new Date(app.submitted_at).toLocaleDateString("en-US")}
            </span>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div>
              <dt className="inline font-medium">Email: </dt>
              <dd className="inline">{app.email ?? "None"}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Phone: </dt>
              <dd className="inline">{app.phone ?? "None"}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Days: </dt>
              <dd className="inline">{app.available_days.map((d) => DAY_LABELS[d]).join(", ") || "None"}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Visits per day: </dt>
              <dd className="inline">up to {app.max_visits_per_day}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Own tools: </dt>
              <dd className="inline">{app.has_tools ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="inline font-medium">Transport: </dt>
              <dd className="inline">{app.has_vehicle ? "Yes" : "No"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="inline font-medium">ZIP codes ({app.service_zips.length}): </dt>
              <dd className="inline">{app.service_zips.join(", ")}</dd>
            </div>
            {app.review_note ? (
              <div className="sm:col-span-2">
                <dt className="inline font-medium">Note: </dt>
                <dd className="inline">{app.review_note}</dd>
              </div>
            ) : null}
          </dl>
          <form action={setApplicationStatus} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="scooperId" value={app.scooper_id} />
            <input
              name="note"
              placeholder="Note to the scooper (optional)"
              defaultValue={app.review_note ?? ""}
              className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {ACTIONS[app.status].map((a) => (
              <button
                key={a.status}
                name="status"
                value={a.status}
                className={`rounded-md px-4 py-2 text-sm font-semibold ${
                  a.primary ? "bg-brand text-white" : "border border-neutral-300"
                }`}
              >
                {a.label}
              </button>
            ))}
          </form>
        </section>
      ))}
    </div>
  );
}
