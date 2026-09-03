"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  FileText,
  Home,
  LogOut,
  ScrollText,
  Search,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore, type View } from "@/lib/store";
import { Mark } from "./motion";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV: { view: View; label: string; icon: typeof Home }[] = [
  { view: "home", label: "Home", icon: Home },
  { view: "search", label: "Tender Search", icon: Search },
  { view: "tenders", label: "Tenders", icon: FileText },
  { view: "verification", label: "Verification", icon: BadgeCheck },
  { view: "audit", label: "Audit Logs", icon: ScrollText },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const view = useAppStore((s) => s.view);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const signOut = useAppStore((s) => s.signOut);

  const go = (v: View) => {
    navigate(v);
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      {/* wordmark */}
      <button
        onClick={() => go("home")}
        className="flex items-center gap-3 px-6 pt-6 pb-7 text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
          <Mark className="size-5.5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight">
            AI Tender Compliance
          </span>
          <span className="block text-[11px] text-muted-foreground">
            Government Procurement
          </span>
        </span>
      </button>

      {/* nav */}
      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.22em] text-muted-foreground/80 uppercase">
          Workspace
        </p>
        {NAV.map(({ view: v, label, icon: Icon }) => {
          const active = view === v;
          return (
            <button
              key={v}
              onClick={() => go(v)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl border border-border bg-card shadow-[0_1px_3px_oklch(0.245_0.014_105/0.05)]"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex flex-1 items-center gap-3">
                <Icon
                  className={cn(
                    "size-4 transition-transform duration-300 group-hover:scale-110",
                    active ? "text-primary" : ""
                  )}
                  strokeWidth={active ? 2 : 1.75}
                />
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* footer */}
      <div className="space-y-3 px-4 pb-5">
        <div className="rounded-xl border border-warn/25 bg-warn-soft/60 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warn">
            <Zap className="size-3.5" />
            Demo mode
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Simulated government databases
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-primary-foreground">
            {initials(user?.name ?? "Officer")}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium">
              {user?.name ?? "Officer"}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {user?.email ?? "officer@gov.in"}
            </span>
          </span>
          <button
            onClick={() => {
              signOut();
              toast("Signed out", { description: "Your session was closed safely." });
            }}
            aria-label="Sign out"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-bad"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
