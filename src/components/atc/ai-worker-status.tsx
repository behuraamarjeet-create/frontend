"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkerState =
  | { kind: "checking" }
  | { kind: "online"; gemini: boolean; version: string | null }
  | { kind: "offline" };

const LABELS: Record<WorkerState["kind"], string> = {
  checking: "AI Worker",
  online: "AI Worker",
  offline: "AI Worker",
};

function SubLabel({ state }: { state: WorkerState }) {
  if (state.kind === "checking") return "checking…";
  if (state.kind === "offline") return "offline";
  return state.gemini ? "Gemini 1.5 Flash" : "template mode";
}

/**
 * Live status pill for the Python AI worker (FastAPI on :3010).
 * Polls /api/ai-worker/health every 30s — shows Gemini vs template
 * mode so officers know which engine is verifying.
 */
export function AiWorkerStatus({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<WorkerState>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch("/api/ai-worker/health", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setState(
            data.online
              ? {
                  kind: "online",
                  gemini: !/not configured/i.test(data.ai_source ?? ""),
                  version: data.version ?? null,
                }
              : { kind: "offline" }
          );
        }
      } catch {
        if (!cancelled) setState({ kind: "offline" });
      }
    };

    check();
    const t = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const dotColor =
    state.kind === "checking"
      ? "bg-muted-foreground/50"
      : state.kind === "offline"
        ? "bg-bad"
        : state.gemini
          ? "bg-ok"
          : "bg-warn";

  return (
    <span
      className="flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3 py-2"
      title={
        state.kind === "online"
          ? `Python AI worker ${state.version ?? ""} — ${state.gemini ? "Gemini summaries active" : "rule engine active, template summaries (no Gemini key)"}`
          : "Python AI worker (FastAPI :3010)"
      }
    >
      <Cpu className="size-3.5 text-muted-foreground" />
      {compact ? (
        <span className="relative flex size-2">
          {state.kind !== "offline" && (
            <span
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                dotColor
              )}
            />
          )}
          <span className={cn("relative inline-flex size-2 rounded-full", dotColor)} />
        </span>
      ) : (
        <>
          <span className="hidden text-[11px] font-medium tracking-wide text-muted-foreground lg:inline">
            {LABELS[state.kind]}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={state.kind + (state.kind === "online" ? String(state.gemini) : "")}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-1.5 text-[11px] leading-none"
            >
              <span className="relative flex size-1.5">
                {state.kind === "checking" && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-muted-foreground/40" />
                )}
                <span className={cn("relative inline-flex size-1.5 rounded-full", dotColor)} />
              </span>
              <span
                className={cn(
                  "font-medium",
                  state.kind === "offline" ? "text-bad" : "text-foreground"
                )}
              >
                <SubLabel state={state} />
              </span>
            </motion.span>
          </AnimatePresence>
        </>
      )}
    </span>
  );
}
