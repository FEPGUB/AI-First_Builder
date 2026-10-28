import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { beforeEach, describe, expect, it } from "vitest";
import { GET as me } from "../app/api/auth/me/route";
import { POST as login } from "../app/api/auth/login/route";
import { POST as register } from "../app/api/auth/register/route";
import { proxy } from "../proxy";
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
} from "@/lib/session";

const DAY_MS = 24 * 60 * 60 * 1000;

function post(handler: (r: Request) => Promise<Response>, body: unknown) {
  return handler(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function sessionCookie(response: Response): string {
  const header = response.headers.getSetCookie().find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  expect(header).toBeDefined();
  return header!;
}

const tokenOf = (cookie: string) => cookie.split(";")[0].split("=")[1];

beforeEach(async () => {
  await prisma.guest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
});

describe("contraseñas (RNF-01)", () => {
  it("AC-82: el hash es bcrypt con costo >= 12 y no es la contraseña", async () => {
    const hash = await hashPassword("una-clave-segura");
    expect(hash).toMatch(/^\$2[aby]\$(1[2-9]|[2-3]\d)\$/);
    expect(hash).not.toContain("una-clave-segura");
    expect(await verifyPassword("una-clave-segura", hash)).toBe(true);
    expect(await verifyPassword("otra", hash)).toBe(false);
  });
});

describe("registro (RF-01)", () => {
  it("AC-01: crea la cuenta, guarda el hash y deja la sesión iniciada", async () => {
    const res = await post(register, { email: "  Ana@Example.COM ", password: "clave-12345" });
    expect(res.status).toBe(201);
    expect((await res.json()).user.email).toBe("ana@example.com");

    const user = await prisma.user.findUniqueOrThrow({ where: { email: "ana@example.com" } });
    expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(user.passwordHash).not.toContain("clave-12345");

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(new RegExp(`Max-Age=${SESSION_MAX_AGE_SECONDS}`, "i"));
  });

  it("rechaza un correo ya registrado (sin distinguir mayúsculas)", async () => {
    await post(register, { email: "ana@example.com", password: "clave-12345" });
    const res = await post(register, { email: "ANA@example.com", password: "otra-clave-1" });
    expect(res.status).toBe(409);
    expect(await prisma.user.count()).toBe(1);
  });

  it("rechaza correos y contraseñas inválidos", async () => {
    expect((await post(register, { email: "no-es-correo", password: "clave-12345" })).status).toBe(400);
    expect((await post(register, { email: "a@example.com", password: "corta" })).status).toBe(400);
    expect((await post(register, { email: "a@example.com", password: "x".repeat(73) })).status).toBe(400);
    expect((await post(register, {})).status).toBe(400);
    expect(await prisma.user.count()).toBe(0);
  });

  it("rechaza un cuerpo que no es JSON", async () => {
    const res = await register(new Request("http://localhost/api", { method: "POST", body: "no-json" }));
    expect(res.status).toBe(400);
  });
});

describe("inicio de sesión (RF-02)", () => {
  beforeEach(async () => {
    await post(register, { email: "ana@example.com", password: "clave-12345" });
  });

  it("AC-02: con credenciales correctas autentica y emite la cookie", async () => {
    const res = await post(login, { email: "Ana@example.com", password: "clave-12345" });
    expect(res.status).toBe(200);
    const user = await getUserFromToken(tokenOf(sessionCookie(res)));
    expect(user?.email).toBe("ana@example.com");
  });

  it("AC-03: con contraseña incorrecta rechaza y no emite cookie", async () => {
    const res = await post(login, { email: "ana@example.com", password: "equivocada" });
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it("rechaza un correo inexistente con el mismo mensaje", async () => {
    const bad = await post(login, { email: "ana@example.com", password: "equivocada" });
    const unknown = await post(login, { email: "nadie@example.com", password: "clave-12345" });
    expect(unknown.status).toBe(401);
    expect(await unknown.json()).toEqual(await bad.json());
  });
});

describe("sesión JWT (RNF-02)", () => {
  const payload = { userId: "u1", sessionVersion: 3 };

  it("AC-83: a los 29 días sin usar la app la sesión sigue vigente", async () => {
    const issued = new Date("2026-11-01T10:00:00Z");
    const token = await signSession(payload, issued);
    expect(await verifySession(token, new Date(issued.getTime() + 29 * DAY_MS))).toEqual(payload);
  });

  it("AC-84: pasados 30 días sin usar la app la sesión vence", async () => {
    const issued = new Date("2026-11-01T10:00:00Z");
    const token = await signSession(payload, issued);
    expect(await verifySession(token, new Date(issued.getTime() + 31 * DAY_MS))).toBeNull();
  });

  it("rechaza tokens alterados, firmados con otro secreto o sin versión", async () => {
    const token = await signSession(payload);
    expect(await verifySession(token + "x")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("basura")).toBeNull();

    const ajeno = await new SignJWT({ sv: 3 })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("otro-secreto-distinto-de-32-caracteres!!"));
    expect(await verifySession(ajeno)).toBeNull();

    const sinVersion = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
    expect(await verifySession(sinVersion)).toBeNull();
  });

  it("un token con versión de sesión vieja deja de valer (base del logout, RF-39)", async () => {
    const res = await post(register, { email: "ana@example.com", password: "clave-12345" });
    const token = tokenOf(sessionCookie(res));
    expect(await getUserFromToken(token)).not.toBeNull();

    await prisma.user.update({ where: { email: "ana@example.com" }, data: { sessionVersion: { increment: 1 } } });
    expect(await getUserFromToken(token)).toBeNull();
  });

  it("GET /api/auth/me devuelve el usuario con sesión y 401 sin ella", async () => {
    const res = await post(register, { email: "ana@example.com", password: "clave-12345" });
    const token = tokenOf(sessionCookie(res));

    const ok = await me(new NextRequest("http://localhost/api/auth/me", { headers: { cookie: `${SESSION_COOKIE}=${token}` } }));
    expect(ok.status).toBe(200);
    expect((await ok.json()).user.email).toBe("ana@example.com");

    const sinSesion = await me(new NextRequest("http://localhost/api/auth/me"));
    expect(sinSesion.status).toBe(401);
  });

  it("el proxy reemite el JWT con 30 días nuevos en cada solicitud autenticada", async () => {
    const hace10Dias = new Date(Date.now() - 10 * DAY_MS);
    const viejo = await signSession(payload, hace10Dias);
    const res = await proxy(new NextRequest("http://localhost/eventos", { headers: { cookie: `${SESSION_COOKIE}=${viejo}` } }));

    const nuevo = tokenOf(sessionCookie(res));
    expect(nuevo).not.toBe(viejo);
    const en29Dias = new Date(Date.now() + 29 * DAY_MS);
    expect(await verifySession(nuevo, en29Dias)).toEqual(payload);
    expect(await verifySession(viejo, en29Dias)).toBeNull(); // el viejo ya habría vencido
  });

  it("el proxy no emite cookie si no hay sesión válida", async () => {
    const sin = await proxy(new NextRequest("http://localhost/eventos"));
    expect(sin.headers.getSetCookie()).toHaveLength(0);
    const invalida = await proxy(new NextRequest("http://localhost/eventos", { headers: { cookie: `${SESSION_COOKIE}=basura` } }));
    expect(invalida.headers.getSetCookie()).toHaveLength(0);
  });
});
