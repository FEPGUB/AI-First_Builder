import { NextResponse } from "next/server";
import type { SessionUser } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

/** Responde con el usuario y deja la sesión iniciada en una cookie HttpOnly. */
export async function respondWithSession(user: SessionUser, status: number) {
  const response = NextResponse.json({ user: { id: user.id, email: user.email } }, { status });
  const token = await signSession({ userId: user.id, sessionVersion: user.sessionVersion });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}

/** Lee el cuerpo JSON; si no es JSON válido devuelve null. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
