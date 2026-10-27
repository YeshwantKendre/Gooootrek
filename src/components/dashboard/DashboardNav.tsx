"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarPlus,
  LayoutDashboard,
  ShieldCheck,
  Tickets,
  UserCircle,
  Users,
  Mountain,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["owner", "organizer", "customer"] },
  { href: "/dashboard/registrations", label: "My Treks", icon: Tickets, roles: ["owner", "organizer", "customer"] },
  { href: "/dashboard/events", label: "My Events", icon: Mountain, roles: ["owner", "organizer"] },
  { href: "/dashboard/events/new", label: "New event", icon: CalendarPlus, roles: ["owner", "organizer"] },
  { href: "/dashboard/users", label: "Users", icon: Users, roles: ["owner"] },
  { href: "/dashboard/moderation", label: "Moderation", icon: ShieldCheck, roles: ["owner"] },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle, roles: ["owner", "organizer", "customer"] },
];

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => i.roles.includes(role));
  // Most specific matching href wins.
  const active = items
    .filter((i) => (i.href === "/dashboard" ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Dashboard" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {items.map((i) => {
        const Icon = i.icon;
        const isActive = active === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition lg:rounded-xl ${
              isActive ? "bg-sage-100 text-sage-900" : "text-muted hover:bg-sage-50 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
