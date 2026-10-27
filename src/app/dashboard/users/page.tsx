import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { ActionForm, SubmitButton } from "@/components/dashboard/ActionForm";
import { RolePill } from "@/components/dashboard/Pills";
import { setUserRole, setUserVerified } from "../actions";
import type { Profile } from "@/lib/types";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession(["owner"]);
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  const term = q?.trim().replace(/[%,()]/g, "");
  if (term) query = query.ilike("full_name", `%${term}%`);
  const { data } = await query;
  const users = (data ?? []) as Profile[];

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <form className="mt-4 flex max-w-md gap-2" role="search">
        <input name="q" defaultValue={q ?? ""} placeholder="Search by name" aria-label="Search users by name" className="input" />
        <button className="btn-secondary" type="submit">Search</button>
      </form>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className="transition hover:bg-sage-50/60">
                <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                <td className="px-4 py-3">
                  <ActionForm action={setUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="role" defaultValue={u.role} aria-label={`Role for ${u.full_name ?? "user"}`} className="input w-auto py-1">
                      <option value="customer">customer</option>
                      <option value="organizer">organizer</option>
                      <option value="owner">owner</option>
                    </select>
                    <SubmitButton className="chip" pendingLabel="…">Save</SubmitButton>
                    <RolePill role={u.role} />
                  </ActionForm>
                </td>
                <td className="px-4 py-3 text-muted">{u.organization_name || "—"}</td>
                <td className="px-4 py-3">
                  <ActionForm action={setUserVerified}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="verified" value={String(!u.is_verified)} />
                    <SubmitButton
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        u.is_verified ? "bg-sage-100 text-sage-700 hover:bg-sage-200" : "bg-line text-muted hover:bg-sage-50"
                      }`}
                      pendingLabel="…"
                    >
                      {u.is_verified ? "Verified ✓" : "Verify"}
                    </SubmitButton>
                  </ActionForm>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
