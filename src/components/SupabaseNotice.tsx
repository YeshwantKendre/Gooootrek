import { Info } from "lucide-react";

export default function SupabaseNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-xl bg-butter-100 px-3 py-2.5 text-sm text-butter-700 ${className}`} role="note">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>Accounts are disabled until Supabase is connected — see README.</p>
    </div>
  );
}
