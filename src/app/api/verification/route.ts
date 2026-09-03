import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BidderStatus, Recommendation, RiskLevel, VerificationListResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const bidders = await db.bidder.findMany({
    where: { lastCheckedAt: { not: null } },
    orderBy: { lastCheckedAt: "desc" },
    include: { tender: { select: { code: true, title: true } } },
  });

  const results: VerificationListResponse["results"] = bidders.map((b) => ({
    id: b.id,
    tenderId: b.tenderId,
    contactName: b.contactName,
    company: b.company,
    gstin: b.gstin,
    pan: b.pan,
    status: b.status as BidderStatus,
    score: b.score,
    risk: (b.risk ?? null) as RiskLevel | null,
    recommendation: (b.recommendation ?? null) as Recommendation | null,
    aiSummary: b.aiSummary,
    confidence: b.confidence,
    lastCheckedAt: b.lastCheckedAt ? b.lastCheckedAt.toISOString() : null,
    dataSource: b.dataSource,
    failedChecks: b.failedChecks,
    tenderCode: b.tender.code,
    tenderTitle: b.tender.title,
  }));

  return NextResponse.json({ results });
}
