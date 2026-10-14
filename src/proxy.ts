import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export function proxy(request: NextRequest) {
  const expected = process.env.PAINEL_SENHA;
  const authorization = request.headers.get("authorization") || "";
  let provided = "";
  if (authorization.startsWith("Basic ")) {
    try { provided = atob(authorization.slice(6)).split(":").slice(1).join(":"); } catch { /* malformed header */ }
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected || "");
  if (expected && a.length === b.length && timingSafeEqual(a, b)) return NextResponse.next();
  return new NextResponse("Área interna protegida", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="TRES Painel"' } });
}

export const config = { matcher: ["/atendente/:path*", "/dashboard/:path*", "/api/painel/:path*"] };
