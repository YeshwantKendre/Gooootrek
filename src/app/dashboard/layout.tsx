import type { ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireSession } from "@/lib/auth";
import SupabaseNotice from "@/components/SupabaseNotice";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { RolePill } from "@/components/dashboard/Pills";
import { LogOut } from "lucide-react";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="container-page py-16">
        <SupabaseNotice />
      </div>
    );
  }
  const session = await requireSession();
  const { profile } = session;
  const name = profile.full_name || session.email;

  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[240px_1fr] lg:gap-8">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card mb-3 hidden p-4 lg:block">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="mb-2 truncate text-xs text-muted">{session.email}</p>
          <RolePill role={profile.role} />
        </div>
        <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
          <p className="truncate text-sm font-semibold">{name}</p>
          <RolePill role={profile.role} />
        </div>
        <DashboardNav role={profile.role} />
        <form action="/auth/signout" method="post" className="mt-3 hidden lg:block">
          <button type="submit" className="btn-ghost w-full justify-start">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </form>
      </aside>
      <div className="min-w-0">
        {children}
        <form action="/auth/signout" method="post" className="mt-8 lg:hidden">
          <button type="submit" className="btn-secondary">
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
