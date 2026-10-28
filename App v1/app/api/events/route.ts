import { NextResponse, type NextRequest } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { readJson } from "@/lib/auth-response";
import { createEvent } from "@/lib/events";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const result = await createEvent(user.id, await readJson(request));
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });

  return NextResponse.json({ event: { id: result.event.id }, emails: result.emails }, { status: 201 });
}
