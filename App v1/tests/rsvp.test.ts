import { beforeEach, describe, expect, it } from "vitest";
import { POST as rsvpRoute } from "../app/api/rsvp/[token]/route";
import { prisma } from "@/lib/db";
import { getInvitation, respondToInvitation } from "@/lib/rsvp";
import { generateGuestToken } from "@/lib/tokens";

const ba = (iso: string) => new Date(`${iso}-03:00`);

// Evento a las 15:00 del día 5 (BA). El plazo de respuesta vence a las 15:00 del día 4.
const STARTS_AT = ba("2026-11-05T15:00:00");
const ANTES_DEL_PLAZO = ba("2026-11-03T12:00:00");

let organizerId: string;

async function crearEvento(overrides: { canceledAt?: Date | null; title?: string } = {}) {
  return prisma.event.create({
    data: {
      title: overrides.title ?? "Asado",
      startsAt: STARTS_AT,
      location: "https://meet.example.com/asado",
      description: "Traer bebida",
      organizerId,
      canceledAt: overrides.canceledAt ?? null,
    },
  });
}

async function crearInvitado(
  eventId: string,
  email = "ana@example.com",
  status: "PENDING" | "ACCEPTED" | "REJECTED" = "PENDING",
) {
  return prisma.guest.create({ data: { eventId, email, status, token: generateGuestToken() } });
}

const estado = async (id: string) => (await prisma.guest.findUniqueOrThrow({ where: { id } })).status;

beforeEach(async () => {
  await prisma.guest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  organizerId = (await prisma.user.create({ data: { email: "org@example.com", passwordHash: "x" } })).id;
});

describe("responder la invitación (RF-17)", () => {
  it("AC-24: un invitado Pendiente elige 'Asistiré' y pasa a Aceptado", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    const result = await respondToInvitation(guest.token, "ACCEPTED", ANTES_DEL_PLAZO);
    expect(result).toEqual({ ok: true, status: "ACCEPTED" });
    expect(await estado(guest.id)).toBe("ACCEPTED");
    expect((await prisma.guest.findUniqueOrThrow({ where: { id: guest.id } })).respondedAt).toEqual(ANTES_DEL_PLAZO);
  });

  it("AC-25: elige 'No asistiré' y pasa a Rechazado", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    expect(await respondToInvitation(guest.token, "REJECTED", ANTES_DEL_PLAZO)).toEqual({ ok: true, status: "REJECTED" });
    expect(await estado(guest.id)).toBe("REJECTED");
  });

  it("AC-26: con menos de 24 horas el sistema rechaza la respuesta", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    const result = await respondToInvitation(guest.token, "ACCEPTED", ba("2026-11-04T15:01:00"));
    expect(result).toEqual({ ok: false, error: "deadline_passed" });
    expect(await estado(guest.id)).toBe("PENDING");
  });

  it("AC-27: con exactamente 24 horas todavía acepta", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    expect((await respondToInvitation(guest.token, "ACCEPTED", ba("2026-11-04T15:00:00"))).ok).toBe(true);
    expect(await estado(guest.id)).toBe("ACCEPTED");
  });

  it("AC-28: a las 14:59 del día 4 en BA, con el servidor pensando en UTC, acepta", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    const result = await respondToInvitation(guest.token, "ACCEPTED", new Date("2026-11-04T17:59:00Z"));
    expect(result.ok).toBe(true);
  });
});

describe("cambiar la respuesta (RF-18)", () => {
  it("AC-29: Aceptado -> Rechazado con 24 horas o más", async () => {
    const guest = await crearInvitado((await crearEvento()).id, "ana@example.com", "ACCEPTED");
    expect((await respondToInvitation(guest.token, "REJECTED", ANTES_DEL_PLAZO)).ok).toBe(true);
    expect(await estado(guest.id)).toBe("REJECTED");
  });

  it("AC-30: Rechazado -> Aceptado con 24 horas o más", async () => {
    const guest = await crearInvitado((await crearEvento()).id, "ana@example.com", "REJECTED");
    expect((await respondToInvitation(guest.token, "ACCEPTED", ANTES_DEL_PLAZO)).ok).toBe(true);
    expect(await estado(guest.id)).toBe("ACCEPTED");
  });

  it("AC-31: Aceptado con menos de 24 horas no puede cambiar y sigue Aceptado", async () => {
    const guest = await crearInvitado((await crearEvento()).id, "ana@example.com", "ACCEPTED");
    const result = await respondToInvitation(guest.token, "REJECTED", ba("2026-11-04T15:01:00"));
    expect(result).toEqual({ ok: false, error: "deadline_passed" });
    expect(await estado(guest.id)).toBe("ACCEPTED");
  });

  it("AC-32: Aceptado con exactamente 24 horas puede pasar a Rechazado", async () => {
    const guest = await crearInvitado((await crearEvento()).id, "ana@example.com", "ACCEPTED");
    expect((await respondToInvitation(guest.token, "REJECTED", ba("2026-11-04T15:00:00"))).ok).toBe(true);
    expect(await estado(guest.id)).toBe("REJECTED");
  });
});

describe("evento cancelado (RF-37)", () => {
  it("AC-71: un invitado Aceptado no puede cambiar a 'No asistiré'", async () => {
    const event = await crearEvento({ canceledAt: ba("2026-11-02T09:00:00") });
    const guest = await crearInvitado(event.id, "ana@example.com", "ACCEPTED");
    expect(await respondToInvitation(guest.token, "REJECTED", ANTES_DEL_PLAZO)).toEqual({ ok: false, error: "canceled" });
    expect(await estado(guest.id)).toBe("ACCEPTED");
  });

  it("AC-72: un invitado Pendiente no puede responder y sigue Pendiente", async () => {
    const event = await crearEvento({ canceledAt: ba("2026-11-02T09:00:00") });
    const guest = await crearInvitado(event.id);
    expect(await respondToInvitation(guest.token, "ACCEPTED", ANTES_DEL_PLAZO)).toEqual({ ok: false, error: "canceled" });
    expect(await estado(guest.id)).toBe("PENDING");
  });

  it("la ficha sigue visible pero marcada como cancelada y sin permitir responder", async () => {
    const event = await crearEvento({ canceledAt: ba("2026-11-02T09:00:00") });
    const guest = await crearInvitado(event.id);
    expect(await getInvitation(guest.token, ANTES_DEL_PLAZO)).toMatchObject({
      canceled: true,
      canRespond: false,
      blockedBy: "canceled",
    });
  });
});

describe("ficha vía enlace único (RF-20, RF-40)", () => {
  it("AC-35: el invitado ve título, fecha, hora, ubicación y descripción", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    const invitation = await getInvitation(guest.token, ANTES_DEL_PLAZO);
    expect(invitation).toMatchObject({
      guestStatus: "PENDING",
      canceled: false,
      canRespond: true,
      blockedBy: null,
      event: {
        title: "Asado",
        startsAt: STARTS_AT,
        location: "https://meet.example.com/asado",
        description: "Traer bebida",
      },
    });
  });

  it("la ficha se ve en cualquier estado de respuesta", async () => {
    const event = await crearEvento();
    for (const status of ["PENDING", "ACCEPTED", "REJECTED"] as const) {
      const guest = await crearInvitado(event.id, `${status.toLowerCase()}@example.com`, status);
      expect(await getInvitation(guest.token, ANTES_DEL_PLAZO)).toMatchObject({ guestStatus: status });
    }
  });

  it("AC-37: a las 2 horas del evento ve la ficha pero no puede responder", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    const dosHorasDespues = ba("2026-11-05T17:00:00");
    expect(await getInvitation(guest.token, dosHorasDespues)).toMatchObject({
      canRespond: false,
      blockedBy: "deadline_passed",
    });
    expect(await respondToInvitation(guest.token, "ACCEPTED", dosHorasDespues)).toEqual({
      ok: false,
      error: "deadline_passed",
    });
    expect(await estado(guest.id)).toBe("PENDING");
  });

  it("AC-86: a las 18:59 del día 5 en BA todavía ve la ficha", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    expect(await getInvitation(guest.token, ba("2026-11-05T18:59:00"))).not.toBeNull();
    expect(await getInvitation(guest.token, ba("2026-11-05T19:00:00"))).not.toBeNull();
  });

  it("AC-75: pasadas más de 4 horas no acepta el token ni muestra datos ni registra respuestas", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    const tarde = ba("2026-11-05T19:01:00");
    expect(await getInvitation(guest.token, tarde)).toBeNull();
    expect(await respondToInvitation(guest.token, "ACCEPTED", tarde)).toEqual({ ok: false, error: "not_found" });
    expect(await estado(guest.id)).toBe("PENDING");
  });
});

describe("tokens inválidos (RF-41)", () => {
  it("AC-76: un token inexistente no muestra datos ni registra respuestas", async () => {
    await crearInvitado((await crearEvento()).id);
    const inexistente = generateGuestToken();
    expect(await getInvitation(inexistente, ANTES_DEL_PLAZO)).toBeNull();
    expect(await respondToInvitation(inexistente, "ACCEPTED", ANTES_DEL_PLAZO)).toEqual({ ok: false, error: "not_found" });
  });

  it("AC-77: un token con un carácter modificado es rechazado", async () => {
    const guest = await crearInvitado((await crearEvento()).id);
    const ultimo = guest.token.at(-1)!;
    const alterado = guest.token.slice(0, -1) + (ultimo === "A" ? "B" : "A");
    expect(await getInvitation(alterado, ANTES_DEL_PLAZO)).toBeNull();
    expect(await respondToInvitation(alterado, "ACCEPTED", ANTES_DEL_PLAZO)).toEqual({ ok: false, error: "not_found" });
    expect(await estado(guest.id)).toBe("PENDING");
  });

  it("rechaza formatos que no son un token", async () => {
    for (const basura of ["", "abc", "x".repeat(200), "../../etc/passwd", "%00", " ", "a".repeat(42), "a".repeat(44)]) {
      expect(await getInvitation(basura, ANTES_DEL_PLAZO), basura).toBeNull();
    }
  });
});

describe("aislamiento entre invitados y eventos (RF-42, RF-43)", () => {
  it("AC-78: el enlace del invitado A solo cambia el estado de A", async () => {
    const event = await crearEvento();
    const a = await crearInvitado(event.id, "a@example.com");
    const b = await crearInvitado(event.id, "b@example.com");
    await respondToInvitation(a.token, "ACCEPTED", ANTES_DEL_PLAZO);
    expect(await estado(a.id)).toBe("ACCEPTED");
    expect(await estado(b.id)).toBe("PENDING");
  });

  it("el mismo correo invitado a otro evento no se ve afectado", async () => {
    const x = await crearEvento({ title: "Evento X" });
    const y = await crearEvento({ title: "Evento Y" });
    const enX = await crearInvitado(x.id);
    const enY = await crearInvitado(y.id);
    await respondToInvitation(enX.token, "ACCEPTED", ANTES_DEL_PLAZO);
    expect(await estado(enY.id)).toBe("PENDING");
  });

  it("AC-79: el token del evento X solo da acceso al evento X, nunca al Y", async () => {
    const x = await crearEvento({ title: "Evento X" });
    await crearEvento({ title: "Evento Y secreto" });
    const guestX = await crearInvitado(x.id);
    const invitation = await getInvitation(guestX.token, ANTES_DEL_PLAZO);
    expect(invitation?.event.title).toBe("Evento X");
    expect(JSON.stringify(invitation)).not.toContain("Evento Y");
  });

  it("no expone otros invitados, correos ni datos del organizador", async () => {
    const event = await crearEvento();
    const ana = await crearInvitado(event.id, "ana@example.com");
    await crearInvitado(event.id, "otro@example.com");
    const serializado = JSON.stringify(await getInvitation(ana.token, ANTES_DEL_PLAZO));
    for (const secreto of ["otro@example.com", "ana@example.com", "org@example.com", ana.token]) {
      expect(serializado).not.toContain(secreto);
    }
  });
});

describe("POST /api/rsvp/[token]", () => {
  const llamar = (token: string, body: unknown) =>
    rsvpRoute(
      new Request("http://localhost/api/rsvp/x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ token }) },
    );

  // La ruta usa la hora real: se crea un evento lejano (dentro del plazo) y uno ya pasado.
  async function eventoEn(dias: number) {
    return prisma.event.create({
      data: {
        title: "E",
        startsAt: new Date(Date.now() + dias * 24 * 60 * 60 * 1000),
        location: "L",
        description: "D",
        organizerId,
      },
    });
  }

  it("registra la respuesta y devuelve el estado", async () => {
    const guest = await crearInvitado((await eventoEn(10)).id);
    const res = await llamar(guest.token, { response: "ACCEPTED" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ACCEPTED" });
    expect(await estado(guest.id)).toBe("ACCEPTED");
  });

  it("404 con un token inexistente", async () => {
    expect((await llamar(generateGuestToken(), { response: "ACCEPTED" })).status).toBe(404);
  });

  it("409 con el plazo vencido, sin cambiar el estado", async () => {
    const guest = await crearInvitado((await eventoEn(0.5)).id); // faltan 12 horas
    const res = await llamar(guest.token, { response: "ACCEPTED" });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("deadline_passed");
    expect(await estado(guest.id)).toBe("PENDING");
  });

  it("409 si el evento está cancelado", async () => {
    const event = await eventoEn(10);
    await prisma.event.update({ where: { id: event.id }, data: { canceledAt: new Date() } });
    const guest = await crearInvitado(event.id);
    const res = await llamar(guest.token, { response: "ACCEPTED" });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("canceled");
  });

  it("400 con una respuesta inválida o un cuerpo que no es JSON", async () => {
    const guest = await crearInvitado((await eventoEn(10)).id);
    expect((await llamar(guest.token, { response: "PENDING" })).status).toBe(400);
    expect((await llamar(guest.token, {})).status).toBe(400);
    const noJson = await rsvpRoute(new Request("http://localhost/api/rsvp/x", { method: "POST", body: "no-json" }), {
      params: Promise.resolve({ token: guest.token }),
    });
    expect(noJson.status).toBe(400);
    expect(await estado(guest.id)).toBe("PENDING");
  });
});
