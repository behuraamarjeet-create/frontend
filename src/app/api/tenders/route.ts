import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Tender, TenderStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";

  const rows = await db.tender.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { bidders: true } } },
  });

  const tenders: Tender[] = rows
    .filter((t) => {
      if (!q) return true;
      return (
        t.code.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
      );
    })
    .map((t) => ({
      id: t.id,
      code: t.code,
      title: t.title,
      department: t.department,
      category: t.category,
      status: t.status as TenderStatus,
      publishedAt: t.publishedAt.toISOString(),
      closesAt: t.closesAt.toISOString(),
      value: t.value,
      bidderCount: t._count.bidders,
    }));

  return NextResponse.json({ tenders });
}
