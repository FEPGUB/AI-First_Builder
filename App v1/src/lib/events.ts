import { z } from "zod";
import { appUrl } from "@/lib/config";
import { prisma } from "@/lib/db";
import { sendEmails, type BulkResult } from "@/lib/email";
import { buildInvitationEmail } from "@/lib/invitation-email";
import { buenosAiresToInstant, isCreationLeadTimeValid, MIN_CREATION_LEAD_DAYS } from "@/lib/time";
import { generateGuestToken } from "@/lib/tokens";

// RNF-07 garantiza la entrega para eventos de hasta 100 invitados.
export const MAX_GUESTS = 100;

const text = (label: string, max: number) =>
  z
    .string({ error: `Falta ${label}` })
    .trim()
    .min(1, `Falta ${label}`)
    .max(max, `${label[0].toUpperCase()}${label.slice(1)} es demasiado largo`);

const createEventSchema = z.object({
  // El título viaja en el asunto del correo: se colapsan los saltos de línea.
  title: text("el título", 200).transform((t) => t.replace(/\s+/g, " ")),
  date: z.string({ error: "Falta la fecha" }),
  time: z.string({ error: "Falta la hora" }),
  location: text("la ubicación", 500),
  description: text("la descripción", 5000),
  guests: z
    .array(z.string(), { error: "Falta la lista de invitados" })
    .min(1, "Agregá al menos un invitado")
    .max(MAX_GUESTS, `Se admiten hasta ${MAX_GUESTS} invitados por evento`),
});

export type CreatedEvent = {
  id: string;
  title: string;
  startsAt: Date;
  location: string;
  description: string;
};

export type CreateEventResult =
  | { ok: true; event: CreatedEvent; emails: BulkResult }
  | { ok: false; error: "invalid" | "lead_time"; message: string };

const invalid = (message: string): CreateEventResult => ({ ok: false, error: "invalid", message });

/**
 * RF-03, RF-04 y RF-15: valida y crea el evento con sus invitados (cada uno con su
 * token único) y después envía una invitación individual a cada correo.
 * `now` se inyecta para poder probar las reglas de fecha.
 */
export async function createEvent(
  organizerId: string,
  input: unknown,
  now: Date = new Date(),
): Promise<CreateEventResult> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const data = parsed.data;

  const startsAt = buenosAiresToInstant(data.date, data.time);
  if (!startsAt) return invalid("La fecha u hora no es válida");
  if (!isCreationLeadTimeValid(now, startsAt)) {
    return {
      ok: false,
      error: "lead_time",
      message: `El evento debe ser al menos ${MIN_CREATION_LEAD_DAYS} días posterior a hoy`,
    };
  }

  const emails = new Set<string>();
  for (const raw of data.guests) {
    const email = raw.trim().toLowerCase();
    if (!z.email().safeParse(email).success) return invalid(`Correo de invitado inválido: ${raw.trim() || "(vacío)"}`);
    emails.add(email);
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      startsAt,
      location: data.location,
      description: data.description,
      organizerId,
      guests: { create: [...emails].map((email) => ({ email, token: generateGuestToken() })) },
    },
    include: { guests: true },
  });

  // Las invitaciones salen después de guardar: si algún envío falla, el evento ya existe
  // y el resultado informa a quién no se pudo enviar.
  const base = appUrl();
  const sent = await sendEmails(
    event.guests.map((guest) =>
      buildInvitationEmail({ to: guest.email, event, link: `${base}/rsvp/${guest.token}` }),
    ),
  );

  return {
    ok: true,
    event: {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      location: event.location,
      description: event.description,
    },
    emails: sent,
  };
}
