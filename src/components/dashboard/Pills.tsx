import { STATUS_STYLES, capitalize } from "@/lib/format";
import type { EventStatus, RegistrationStatus, Role } from "@/lib/types";

export const ROLE_STYLES: Record<Role, string> = {
  owner: "bg-lavender-100 text-lavender-700",
  organizer: "bg-sky-100 text-sky-700",
  customer: "bg-sage-100 text-sage-700",
};

export const EVENT_STATUS_STYLES: Record<EventStatus, string> = {
  draft: "bg-butter-100 text-butter-700",
  published: "bg-sage-100 text-sage-700",
  cancelled: "bg-peach-100 text-peach-700",
  completed: "bg-lavender-100 text-lavender-700",
};

const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function RolePill({ role }: { role: Role }) {
  return <span className={`${base} ${ROLE_STYLES[role]}`}>{capitalize(role)}</span>;
}
export function RegStatusPill({ status }: { status: RegistrationStatus }) {
  return <span className={`${base} ${STATUS_STYLES[status]}`}>{capitalize(status)}</span>;
}
export function EventStatusPill({ status }: { status: EventStatus }) {
  return <span className={`${base} ${EVENT_STATUS_STYLES[status]}`}>{capitalize(status)}</span>;
}
