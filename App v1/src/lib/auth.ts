import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { verifySession } from "@/lib/session";

// bcrypt solo considera los primeros 72 bytes de la contraseña.
const MAX_PASSWORD_BYTES = 72;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .refine((p) => new TextEncoder().encode(p).length <= MAX_PASSWORD_BYTES, {
      message: "La contraseña es demasiado larga",
    }),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type PublicUser = { id: string; email: string };
export type SessionUser = PublicUser & { sessionVersion: number };

export type RegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: "invalid"; message: string }
  | { ok: false; error: "email_taken" };

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: "invalid_credentials" };

export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid", message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { email, password } = parsed.data;
  try {
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password) },
    });
    return { ok: true, user: { id: user.id, email: user.email, sessionVersion: user.sessionVersion } };
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return { ok: false, error: "email_taken" };
    }
    throw error;
  }
}

// Hash de relleno para que el tiempo de respuesta no revele si el correo existe.
let dummyHash: Promise<string> | undefined;

export async function authenticate(input: unknown): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_credentials" };
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    dummyHash ??= hashPassword("relleno");
    await verifyPassword(password, await dummyHash);
    return { ok: false, error: "invalid_credentials" };
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "invalid_credentials" };
  }
  return { ok: true, user: { id: user.id, email: user.email, sessionVersion: user.sessionVersion } };
}

/**
 * Resuelve el usuario de un JWT. Además de la firma y el vencimiento, exige que la
 * versión de sesión coincida con la guardada, para que un logout invalide los tokens.
 */
export async function getUserFromToken(token: string | undefined): Promise<PublicUser | null> {
  const session = await verifySession(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.sessionVersion !== session.sessionVersion) return null;
  return { id: user.id, email: user.email };
}
