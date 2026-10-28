import { jwtVerify, SignJWT } from "jose";

// RNF-02: JWT de 30 días que se reemite en cada solicitud autenticada.
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export type SessionPayload = { userId: string; sessionVersion: number };

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET debe estar definido y tener al menos 32 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(
  { userId, sessionVersion }: SessionPayload,
  now: Date = new Date(),
): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  return new SignJWT({ sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_MAX_AGE_SECONDS)
    .sign(secretKey());
}

/** Devuelve el contenido del token, o null si es inválido, fue alterado o venció. */
export async function verifySession(
  token: string | undefined,
  now: Date = new Date(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
      currentDate: now,
    });
    if (typeof payload.sub !== "string" || typeof payload.sv !== "number") return null;
    return { userId: payload.sub, sessionVersion: payload.sv };
  } catch {
    return null;
  }
}

// HttpOnly para que JavaScript no pueda leerla; Secure en producción (HTTPS).
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
} as const;
