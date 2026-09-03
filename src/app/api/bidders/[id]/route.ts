import { NextRequest, NextResponse } from "next/server";
import { fetchBidderDetail } from "@/lib/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const bidder = await fetchBidderDetail(id);
  if (!bidder) {
    return NextResponse.json({ error: "Bidder not found." }, { status: 404 });
  }

  return NextResponse.json({ bidder });
}
