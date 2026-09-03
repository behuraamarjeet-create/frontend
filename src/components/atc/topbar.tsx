"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Bell, Search, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { AuditEntry } from "@/lib/types";
import { timeAgo, initials } from "@/lib/format";
import { SidebarContent } from "./sidebar";
import { AiWorkerStatus } from "./ai-worker-status";
import { cn } from "@/lib/utils";

function crumbFor(
  view: string,
  tenderLabel?: string,
  bidderLabel?: string
): { label: string; accent?: boolean }[] {
  switch (view) {
    case "home":
      return [{ label: "Overview", accent: true }];
    case "search":
      return [{ label: "Tender Search", accent: true }];
    case "tenders":
      return [{ label: "All Tenders", accent: true }];
    case "tender":
      return [{ label: "Tenders" }, { label: tenderLabel ?? "Detail", accent: true }];
    case "bidder":
      return [
        { label: "Tenders" },
        { label: tenderLabel ?? "Tender" },
        { label: bidderLabel ?? "Bidder", accent: true },
      ];
    case "verification":
      return [{ label: "Verification Results", accent: true }];
    case "audit":
      return [{ label: "Audit Logs", accent: true }];
    default:
      return [{ label: "Overview", accent: true }];
  }
}

export function Topbar() {
  const { view, tenderLabel, bidderLabel, navigate, setCommandOpen, user } =
    useAppStore();
  const [bellOpen, setBellOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [unseen, setUnseen] = useState(true);

  useEffect(() => {
    if (!bellOpen || entries) return;
    api
      .getAudit()
      .then((r) => setEntries(r.entries.slice(0, 6)))
      .catch(() => setEntries([]));
  }, [bellOpen, entries]);

  const crumbs = crumbFor(view, tenderLabel, bidderLabel);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* mobile menu */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <button
              className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-4.5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[290px] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* breadcrumb */}
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1 text-sm">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                )}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={c.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.22 }}
                    className={cn(
                      "truncate",
                      c.accent
                        ? "font-medium text-foreground"
                        : "hidden text-muted-foreground sm:inline"
                    )}
                  >
                    {c.label}
                  </motion.span>
                </AnimatePresence>
              </li>
            ))}
          </ol>
        </nav>

        {/* command trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden min-h-10 items-center gap-2.5 rounded-full border border-border bg-card py-2 pr-2.5 pl-4 text-sm text-muted-foreground transition-all hover:border-foreground/25 hover:text-foreground sm:flex"
        >
          <Search className="size-3.5" />
          Search…
          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <button
          onClick={() => setCommandOpen(true)}
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>

        {/* AI worker status */}
        <div className="hidden md:block">
          <AiWorkerStatus />
        </div>
        <div className="md:hidden">
          <AiWorkerStatus compact />
        </div>

        {/* notifications */}
        <DropdownMenu open={bellOpen} onOpenChange={(o) => { setBellOpen(o); if (o) setUnseen(false); }}>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unseen && (
                <span className="absolute top-2.5 right-2.5 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-bad/60" />
                  <span className="relative inline-flex size-2 rounded-full bg-bad" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-1.5">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium tracking-wide text-muted-foreground">
              Recent activity
            </DropdownMenuLabel>
            {entries === null && (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="shimmer h-10 rounded-lg" />
                ))}
              </div>
            )}
            {entries?.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Nothing yet.
              </p>
            )}
            {entries && entries.length > 0 && (
              <div className="max-h-80 space-y-0.5 overflow-y-auto">
                {entries.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => { setBellOpen(false); navigate("audit"); }}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        e.decision === "DISQUALIFY"
                          ? "bg-bad"
                          : e.decision === "CLARIFY"
                            ? "bg-warn"
                            : "bg-ok"
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px]">{e.message}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {e.bidderName ?? "System"} · {timeAgo(e.createdAt)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => { setBellOpen(false); navigate("audit"); }}
              className="mt-1 w-full rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              View full audit log
            </button>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden h-6 w-px bg-border sm:block" />

        {/* user chip */}
        <button
          onClick={() => navigate("home")}
          className="flex min-h-10 items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pr-3.5 pl-1.5 transition-colors hover:bg-muted"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-primary-foreground">
            {initials(user?.name ?? "Officer")}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-xs font-semibold">{user?.name ?? "Officer"}</span>
            <span className="block text-[10px] text-muted-foreground">
              {user?.department ?? "Dept. of Procurement"}
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}
