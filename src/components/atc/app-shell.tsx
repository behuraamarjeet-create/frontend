"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { SidebarContent } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandMenu } from "./command-menu";
import { HomeView } from "./views/home-view";
import { SearchView } from "./views/search-view";
import { TendersView } from "./views/tenders-view";
import { TenderDetailView } from "./views/tender-detail-view";
import { BidderDetailView } from "./views/bidder-detail-view";
import { VerificationView } from "./views/verification-view";
import { AuditView } from "./views/audit-view";

export function AppShell() {
  const { view, tenderId, bidderId } = useAppStore();
  const viewKey = `${view}:${tenderId ?? ""}:${bidderId ?? ""}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1560px]">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-border lg:block">
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 pt-7 pb-20 sm:px-6 lg:px-10 lg:pt-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={viewKey}
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto w-full max-w-6xl"
              >
                {view === "home" && <HomeView />}
                {view === "search" && <SearchView />}
                {view === "tenders" && <TendersView />}
                {view === "tender" && tenderId && <TenderDetailView tenderId={tenderId} />}
                {view === "bidder" && bidderId && (
                  <BidderDetailView bidderId={bidderId} />
                )}
                {view === "verification" && <VerificationView />}
                {view === "audit" && <AuditView />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <CommandMenu />
    </div>
  );
}
