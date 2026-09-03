import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AI_WORKER_URL } from "@/lib/ai-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WorkerProbe {
  online: boolean;
  aiSource: string | null;
  version: string | null;
  gemini: boolean;
}

async function probeWorker(): Promise<WorkerProbe> {
  try {
    const res = await fetch(`${AI_WORKER_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as {
      ai_source?: string;
      version?: string | null;
    };
    const aiSource = data.ai_source ?? null;
    return {
      online: true,
      aiSource,
      version: data.version ?? null,
      gemini: !!aiSource && !/not configured/i.test(aiSource),
    };
  } catch {
    return { online: false, aiSource: null, version: null, gemini: false };
  }
}

/**
 * Platform status for the developer Settings console:
 * - SQLite database (standing in for Strapi until the real CMS connects)
 * - Python AI worker (FastAPI on :3010)
 */
export async function GET() {
  const [worker] = await Promise.all([probeWorker()]);

  let database: {
    online: boolean;
    mode: "adapter";
    label: string;
    latencyMs: number | null;
    error: string | null;
  } = {
    online: false,
    mode: "adapter",
    label: "SQLite",
    latencyMs: null,
    error: null,
  };

  const t0 = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    database = {
      online: true,
      mode: "adapter",
      label: "Strapi-compatible adapter · SQLite",
      latencyMs: Date.now() - t0,
      error: null,
    };
  } catch (e) {
    database = {
      online: false,
      mode: "adapter",
      label: "Strapi-compatible adapter · SQLite",
      latencyMs: null,
      error: e instanceof Error ? e.message : "Database unreachable",
    };
  }

  return NextResponse.json({
    aiWorker: worker,
    database,
    aiWorkerUrl: AI_WORKER_URL,
    checkedAt: new Date().toISOString(),
  });
}
