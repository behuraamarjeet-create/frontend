import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  auditMessageFor,
  fetchBidderDetail,
  mapAuditEntry,
  MODEL_LABEL,
  persistVerificationResult,
  runVerificationForBidder,
  type VerificationOutcome,
} from "@/lib/verification";
import { runAiWorkerVerification, WORKER_MODEL_LABEL } from "@/lib/ai-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const bidder = await db.bidder.findUnique({
    where: { id },
    include: { tender: { select: { code: true } } },
  });
  if (!bidder) {
    return NextResponse.json({ error: "Bidder not found." }, { status: 404 });
  }

  // Show a visible processing state while the AI worker runs the pipeline:
  // fetch bidder → query 8 simulated gov registries → rule engine → score →
  // AI summary → persist (via the Strapi-compatible adapter) → audit log.
  await db.bidder.update({ where: { id }, data: { status: "PROCESSING" } });

  let outcome: VerificationOutcome;
  let usedWorker = false;
  try {
    outcome = await runAiWorkerVerification(id);
    usedWorker = true;
  } catch (err) {
    console.warn(
      "[verify] AI worker unavailable, falling back to local engine:",
      err instanceof Error ? err.message : err
    );
    outcome = await runVerificationForBidder(id);
    outcome.dataSource = "LOCAL_ENGINE_FALLBACK";
  }

  // Small floor so the PROCESSING state is perceivable in tables/badges.
  await new Promise((resolve) => setTimeout(resolve, 600));

  await persistVerificationResult(id, outcome);

  let audit;
  if (usedWorker) {
    // The worker already persisted the audit event through the Strapi-compatible
    // adapter (POST /api/verification-logs) before responding — reuse it.
    audit = await db.auditEntry.findFirst({
      where: { bidderId: id, action: "VERIFICATION_COMPLETE" },
      orderBy: { createdAt: "desc" },
    });
  }
  if (!audit) {
    audit = await db.auditEntry.create({
      data: {
        action: "VERIFICATION_COMPLETE",
        message: auditMessageFor(outcome.recommendation),
        bidderName: bidder.company,
        bidderId: id,
        tenderCode: bidder.tender.code,
        score: outcome.score,
        model: usedWorker ? WORKER_MODEL_LABEL : MODEL_LABEL,
        officer: usedWorker ? "ATC AI Worker" : "Procurement Officer",
      },
    });
  }

  const [detail, mappedAudit] = await Promise.all([
    fetchBidderDetail(id),
    Promise.resolve(mapAuditEntry(audit)),
  ]);
  if (!detail) {
    return NextResponse.json({ error: "Bidder not found." }, { status: 404 });
  }

  return NextResponse.json({ bidder: detail, audit: mappedAudit });
}
