import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  auditMessageFor,
  fetchBidderDetail,
  mapAuditEntry,
  MODEL_LABEL,
  persistVerificationResult,
  runVerificationForBidder,
} from "@/lib/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  // Show a visible processing state while the (simulated) engine runs.
  await db.bidder.update({ where: { id }, data: { status: "PROCESSING" } });

  await new Promise((resolve) => setTimeout(resolve, 2200));

  const outcome = await runVerificationForBidder(id);
  await persistVerificationResult(id, outcome);

  const audit = await db.auditEntry.create({
    data: {
      action: "VERIFICATION_COMPLETE",
      message: auditMessageFor(outcome.recommendation),
      bidderName: bidder.company,
      bidderId: id,
      tenderCode: bidder.tender.code,
      score: outcome.score,
      model: MODEL_LABEL,
      officer: "Procurement Officer",
    },
  });

  const [detail, mappedAudit] = await Promise.all([
    fetchBidderDetail(id),
    Promise.resolve(mapAuditEntry(audit)),
  ]);
  if (!detail) {
    return NextResponse.json({ error: "Bidder not found." }, { status: 404 });
  }

  return NextResponse.json({ bidder: detail, audit: mappedAudit });
}
