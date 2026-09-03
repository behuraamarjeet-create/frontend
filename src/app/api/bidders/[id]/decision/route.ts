import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchBidderDetail, mapAuditEntry } from "@/lib/verification";
import type { Recommendation } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_BY_DECISION: Record<Recommendation, string> = {
  QUALIFY: "VERIFIED",
  CLARIFY: "MANUAL_REVIEW",
  DISQUALIFY: "REJECTED",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const decision = body?.decision as Recommendation | undefined;
  // `note` is accepted for future use but not persisted (schema has no field).
  if (typeof body?.note !== "undefined" && typeof body?.note !== "string") {
    return NextResponse.json({ error: "note must be a string." }, { status: 400 });
  }

  if (decision !== "QUALIFY" && decision !== "CLARIFY" && decision !== "DISQUALIFY") {
    return NextResponse.json(
      { error: 'decision must be one of "QUALIFY", "CLARIFY" or "DISQUALIFY".' },
      { status: 400 }
    );
  }

  const bidder = await db.bidder.findUnique({
    where: { id },
    include: { tender: { select: { code: true } } },
  });
  if (!bidder) {
    return NextResponse.json({ error: "Bidder not found." }, { status: 404 });
  }

  await db.bidder.update({
    where: { id },
    data: { status: STATUS_BY_DECISION[decision], recommendation: decision },
  });

  const audit = await db.auditEntry.create({
    data: {
      action: "OFFICER_DECISION",
      message: `Officer decision — ${decision}`,
      decision,
      bidderName: bidder.company,
      bidderId: id,
      tenderCode: bidder.tender.code,
      score: bidder.score,
      model: null,
      officer: "Procurement Officer",
    },
  });

  const detail = await fetchBidderDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Bidder not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, bidder: detail, audit: mapAuditEntry(audit) });
}
