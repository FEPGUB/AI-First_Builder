import { NextResponse, type NextRequest } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json({ user });
}
