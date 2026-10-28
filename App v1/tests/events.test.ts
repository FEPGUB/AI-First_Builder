import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as createEventRoute } from "../app/api/events/route";
import { prisma } from "@/lib/db";
import { clearOutbox, getOutbox } from "@/lib/email";
import { createEvent, MAX_GUESTS } from "@/lib/events";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { formatEventDate, formatEventTime } from "@/lib/time";
import { generateGuestToken } from "@/lib/tokens";

const ba = (iso: string) => new Date(`${iso}-03:00`);

// "Hoy" fijo para las reglas de anticipación: día 1 a las 10:00 en Buenos Aires.
const HOY = ba("2026-11-01T10:00:00");

const entrada = (overrides: Record<string, unknown> = {}) => ({
  title: "Asado de fin de año",
  date: "2026-11-05",
  time: "15:00",
  location: "https://meet.example.com/asado",
  description: "Traer bebida",
  guests: ["ana@example.com"],
  ...overrides,
});

let organizerId: string;

beforeEach(async () => {
  await prisma.guest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  clearOutbox();
  organizerId = (await prisma.user.create({ data: { email: "org@example.com", passwordHash: "x" } })).id;
});

afterEach(() => clearOutbox());

describe("tokens de invitación (RNF-03)", () => {
  it("AC-85: son distintos y tienen al menos 43 caracteres base64url", () => {
    const a = generateGuestToken();
    const b = generateGuestToken();
    expect(a).not.toBe(b);
    for (const t of [a, b]) {
      expect(t.length).toBeGreaterThanOrEqual(43);
      expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});

describe("crear evento (RF-03, RF-04)", () => {
  it("AC-04: guarda título, fecha, hora, ubicación y descripción tal como se cargaron", async () => {
    const result = await createEvent(organizerId, entrada(), HOY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const saved = await prisma.event.findUniqueOrThrow({ where: { id: result.event.id } });
    expect(saved).toMatchObject({
      title: "Asado de fin de año",
      location: "https://meet.example.com/asado",
      description: "Traer bebida",
      organizerId,
      canceledAt: null,
    });
    expect(saved.startsAt.toISOString()).toBe("2026-11-05T18:00:00.000Z");
    expect(formatEventTime(saved.startsAt)).toBe("15:00");
    expect(formatEventDate(saved.startsAt)).toContain("5 de noviembre de 2026");
  });

  it("AC-05: el día 1 rechaza un evento del día 4, sin guardar nada ni enviar invitaciones", async () => {
    const result = await createEvent(organizerId, entrada({ date: "2026-11-04" }), HOY);
    expect(result).toMatchObject({ ok: false, error: "lead_time" });
    expect(await prisma.event.count()).toBe(0);
    expect(getOutbox()).toHaveLength(0);
  });

  it("AC-06: a las 23:30 del día 1 en BA (02:30 UTC del día 2) acepta un evento del día 5", async () => {
    const result = await createEvent(organizerId, entrada(), new Date("2026-11-02T02:30:00Z"));
    expect(result.ok).toBe(true);
  });

  it("normaliza los correos y descarta repetidos", async () => {
    const result = await createEvent(
      organizerId,
      entrada({ guests: ["Ana@Example.com", " ana@example.com ", "beto@example.com"] }),
      HOY,
    );
    expect(result.ok).toBe(true);
    const guests = await prisma.guest.findMany({ orderBy: { email: "asc" } });
    expect(guests.map((g) => g.email)).toEqual(["ana@example.com", "beto@example.com"]);
    expect(guests.every((g) => g.status === "PENDING")).toBe(true);
    expect(getOutbox()).toHaveLength(2);
  });

  it("rechaza datos inválidos sin guardar ni enviar nada", async () => {
    const casos: Record<string, unknown>[] = [
      entrada({ title: "   " }),
      entrada({ location: "" }),
      entrada({ description: undefined }),
      entrada({ date: "2026-02-31" }),
      entrada({ time: "25:00" }),
      entrada({ guests: [] }),
      entrada({ guests: ["ana@example.com", "no-es-correo"] }),
      entrada({ guests: "ana@example.com" }),
      entrada({ guests: Array.from({ length: MAX_GUESTS + 1 }, (_, i) => `g${i}@example.com`) }),
    ];
    for (const caso of casos) {
      const result = await createEvent(organizerId, caso, HOY);
      expect(result, JSON.stringify(caso)).toMatchObject({ ok: false, error: "invalid" });
    }
    expect(await prisma.event.count()).toBe(0);
    expect(getOutbox()).toHaveLength(0);
  });

  it("acepta el máximo de 100 invitados", async () => {
    const guests = Array.from({ length: MAX_GUESTS }, (_, i) => `g${i}@example.com`);
    const result = await createEvent(organizerId, entrada({ guests }), HOY);
    expect(result.ok).toBe(true);
    expect(getOutbox()).toHaveLength(MAX_GUESTS);
  });

  it("colapsa los saltos de línea del título (va en el asunto del correo)", async () => {
    const result = await createEvent(organizerId, entrada({ title: "Hola\r\nBcc: x@example.com" }), HOY);
    expect(result.ok && result.event.title).toBe("Hola Bcc: x@example.com");
  });
});

describe("invitaciones por correo (RF-15)", () => {
  it("AC-21: el invitado recibe título, fecha, hora, ubicación, descripción y su enlace único", async () => {
    const result = await createEvent(organizerId, entrada(), HOY);
    expect(result.ok).toBe(true);

    const [mail] = getOutbox();
    const guest = await prisma.guest.findFirstOrThrow({ where: { email: "ana@example.com" } });
    expect(mail.to).toBe("ana@example.com");
    expect(mail.subject).toContain("Asado de fin de año");
    for (const dato of ["Asado de fin de año", "5 de noviembre de 2026", "15:00", "https://meet.example.com/asado", "Traer bebida"]) {
      expect(mail.text).toContain(dato);
    }
    expect(mail.text).toContain(`http://localhost:3000/rsvp/${guest.token}`);
    expect(mail.html).toContain(`http://localhost:3000/rsvp/${guest.token}`);
  });

  it("AC-22: con 3 invitados se envían 3 correos individuales con enlaces distintos", async () => {
    const result = await createEvent(
      organizerId,
      entrada({ guests: ["a@example.com", "b@example.com", "c@example.com"] }),
      HOY,
    );
    expect(result.ok && result.emails).toEqual({ sent: 3, failed: [] });

    const outbox = getOutbox();
    expect(outbox.map((m) => m.to).sort()).toEqual(["a@example.com", "b@example.com", "c@example.com"]);
    const enlaces = outbox.map((m) => /\/rsvp\/(\S+)/.exec(m.text)![1]);
    expect(new Set(enlaces).size).toBe(3);
    // cada correo trae el token de su propio invitado, y ningún otro
    for (const mail of outbox) {
      const guest = await prisma.guest.findFirstOrThrow({ where: { email: mail.to } });
      expect(mail.text).toContain(`/rsvp/${guest.token}`);
    }
  });

  it("escapa el contenido del evento en la versión HTML", async () => {
    await createEvent(organizerId, entrada({ description: '<script>alert("x")</script>' }), HOY);
    const [mail] = getOutbox();
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

describe("POST /api/events", () => {
  // Fecha dentro de 10 días respecto del reloj real (la ruta usa la hora actual).
  const dentroDeDiezDias = () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  async function llamar(body: unknown, cookie?: string) {
    return createEventRoute(
      new NextRequest("http://localhost/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(body),
      }),
    );
  }

  it("sin sesión responde 401 y no crea nada", async () => {
    const res = await llamar(entrada({ date: dentroDeDiezDias() }));
    expect(res.status).toBe(401);
    expect(await prisma.event.count()).toBe(0);
    expect(getOutbox()).toHaveLength(0);
  });

  it("con una sesión de un usuario eliminado o con versión vieja responde 401", async () => {
    const token = await signSession({ userId: organizerId, sessionVersion: 99 });
    const res = await llamar(entrada({ date: dentroDeDiezDias() }), `${SESSION_COOKIE}=${token}`);
    expect(res.status).toBe(401);
  });

  it("con sesión crea el evento a nombre del usuario y envía las invitaciones", async () => {
    const token = await signSession({ userId: organizerId, sessionVersion: 0 });
    const res = await llamar(entrada({ date: dentroDeDiezDias() }), `${SESSION_COOKIE}=${token}`);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.emails).toEqual({ sent: 1, failed: [] });
    const saved = await prisma.event.findUniqueOrThrow({ where: { id: body.event.id } });
    expect(saved.organizerId).toBe(organizerId);
  });

  it("con sesión pero datos inválidos responde 400 con el motivo", async () => {
    const token = await signSession({ userId: organizerId, sessionVersion: 0 });
    const res = await llamar(entrada({ date: "2020-01-01" }), `${SESSION_COOKIE}=${token}`);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/4 días/);
  });
});
