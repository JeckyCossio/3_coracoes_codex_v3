import { NextResponse } from "next/server";
import { getStats, sweepExpired } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  sweepExpired();
  return NextResponse.json(getStats());
}
