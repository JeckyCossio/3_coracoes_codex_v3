import { NextResponse } from "next/server";
import { getHandoffs, markAttended } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ items: getHandoffs().map((r) => ({ ...r, report: JSON.parse(r.report_json), report_json: undefined })) });
}

export async function POST(request: Request) {
  let body: { id?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Envie um JSON válido." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.id !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: "ID válido obrigatório" }, { status: 400 });
  }
  return NextResponse.json({ updated: markAttended(body.id) });
}
