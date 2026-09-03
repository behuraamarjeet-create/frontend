import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapAuditEntry } from "@/lib/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.auditEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return NextResponse.json({ entries: rows.map(mapAuditEntry) });
}
