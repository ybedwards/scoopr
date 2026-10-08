import Link from "next/link";

import { signOut } from "@/app/actions";
import { requireAdmin } from "@/lib/admin";

const NAV = [
  { href: "/applications", label: "Scooper applications" },
  { href: "/pricing", label: "Pricing" },
  { href: "/service-area", label: "Service area" },
] as const;

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { profile } = await requireAdmin();
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-xl font-bold text-brand">Scoopr Admin</span>
          <nav className="flex flex-wrap gap-4 text-sm font-medium">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-brand">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={signOut} className="flex items-center gap-3 text-sm text-neutral-600">
          <span>{profile.full_name || profile.email}</span>
          <button className="font-medium text-brand">Sign out</button>
        </form>
      </header>
      <main>{children}</main>
    </div>
  );
}
