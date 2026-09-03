import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BidderListItem, BidderStatus, RiskLevel, TenderDetail, TenderStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tender = await db.tender.findUnique({
    where: { id },
    include: { bidders: { orderBy: { createdAt: "asc" } } },
  });

  if (!tender) {
    return NextResponse.json({ error: "Tender not found." }, { status: 404 });
  }

  const stats = {
    total: tender.bidders.length,
    verified: tender.bidders.filter((b) => b.status === "VERIFIED").length,
    pending: tender.bidders.filter(
      (b) => b.status === "PENDING" || b.status === "PROCESSING"
    ).length,
    highRisk: tender.bidders.filter((b) => b.risk === "HIGH").length,
    critical: tender.bidders.filter((b) => b.risk === "CRITICAL").length,
  };

  const bidders: BidderListItem[] = tender.bidders.map((b) => ({
    id: b.id,
    contactName: b.contactName,
    company: b.company,
    gstin: b.gstin,
    status: b.status as BidderStatus,
    score: b.score,
    risk: (b.risk ?? null) as RiskLevel | null,
    lastCheckedAt: b.lastCheckedAt ? b.lastCheckedAt.toISOString() : null,
  }));

  const detail: TenderDetail = {
    id: tender.id,
    code: tender.code,
    title: tender.title,
    department: tender.department,
    category: tender.category,
    status: tender.status as TenderStatus,
    publishedAt: tender.publishedAt.toISOString(),
    closesAt: tender.closesAt.toISOString(),
    value: tender.value,
    bidderCount: tender.bidders.length,
    stats,
    bidders,
  };

  return NextResponse.json({ tender: detail });
}
