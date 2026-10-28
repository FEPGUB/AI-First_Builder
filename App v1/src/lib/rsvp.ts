import type { GuestStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { isWithinResponseWindow, isWithinVisibilityWindow } from "@/lib/time";

// 32 bytes en base64url son siempre 43 caracteres; descartar otros formatos evita
// consultar la base con basura.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type RsvpAnswer = Extract<GuestStatus, "ACCEPTED" | "REJECTED">;
export type RsvpBlock = "canceled" | "deadline_passed";

export type Invitation = {
  guestStatus: GuestStatus;
  event: { title: string; startsAt: Date; location: string; description: string };
  canceled: boolean;
  canRespond: boolean;
  /** Por qué no puede responder; null si puede. */
  blockedBy: RsvpBlock | null;
};

/**
 * El token identifica a un único invitado y, por lo tanto, a un único evento
 * (RF-42, RF-43). Pasada la ventana de visibilidad (4 horas después del evento) el
 * token deja de aceptarse (RF-40), igual que uno inexistente o alterado (RF-41).
 */
async function findGuestByToken(token: string, now: Date) {
  if (!TOKEN_PATTERN.test(token)) return null;
  const guest = await prisma.guest.findUnique({ where: { token }, include: { event: true } });
  if (!guest || !isWithinVisibilityWindow(now, guest.event.startsAt)) return null;
  return guest;
}

function blockFor(event: { startsAt: Date; canceledAt: Date | null }, now: Date): RsvpBlock | null {
  if (event.canceledAt) return "canceled"; // RF-37
  if (!isWithinResponseWindow(now, event.startsAt)) return "deadline_passed"; // plazo de respuesta
  return null;
}

/** RF-20: ficha del evento para el invitado, sin importar su estado de respuesta. */
export async function getInvitation(token: string, now: Date = new Date()): Promise<Invitation | null> {
  const guest = await findGuestByToken(token, now);
  if (!guest) return null;
  const blockedBy = blockFor(guest.event, now);
  return {
    guestStatus: guest.status,
    // Solo los datos de la ficha: nada de otros invitados ni del organizador.
    event: {
      title: guest.event.title,
      startsAt: guest.event.startsAt,
      location: guest.event.location,
      description: guest.event.description,
    },
    canceled: guest.event.canceledAt !== null,
    canRespond: blockedBy === null,
    blockedBy,
  };
}

export type RespondResult =
  | { ok: true; status: RsvpAnswer }
  | { ok: false; error: "not_found" | RsvpBlock };

/** RF-17 y RF-18: confirmar, rechazar o cambiar la respuesta dentro del plazo. */
export async function respondToInvitation(
  token: string,
  answer: RsvpAnswer,
  now: Date = new Date(),
): Promise<RespondResult> {
  const guest = await findGuestByToken(token, now);
  if (!guest) return { ok: false, error: "not_found" };

  const blockedBy = blockFor(guest.event, now);
  if (blockedBy) return { ok: false, error: blockedBy };

  // Se actualiza por id: solo cambia el invitado dueño del token.
  await prisma.guest.update({ where: { id: guest.id }, data: { status: answer, respondedAt: now } });
  return { ok: true, status: answer };
}
