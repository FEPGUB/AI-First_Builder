import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getInvitation } from "@/lib/rsvp";
import { formatEventDate, formatEventTime } from "@/lib/time";
import { RsvpActions } from "./rsvp-actions";

// El token viaja en la URL: que no se indexe ni se filtre por el encabezado Referer.
export const metadata: Metadata = {
  title: "Invitación | Orgenicemos",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const STATUS_LABELS = { PENDING: "Pendiente", ACCEPTED: "Aceptado", REJECTED: "Rechazado" } as const;

const BLOCK_MESSAGES = {
  canceled: "El evento fue cancelado, ya no se puede responder la invitación.",
  deadline_passed: "El plazo para responder ya venció (se cerraba 24 horas antes del evento).",
} as const;

export default async function RsvpPage({ params }: { params: Promise<{ token: string }> }) {
  await connection(); // se resuelve en cada pedido, nunca desde caché
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation) notFound();

  const { event } = invitation;
  return (
    <main>
      <h1>{event.title}</h1>
      {invitation.canceled && <p role="alert">Este evento fue cancelado.</p>}
      <dl>
        <dt>Fecha</dt>
        <dd>{formatEventDate(event.startsAt)}</dd>
        <dt>Hora</dt>
        <dd>{formatEventTime(event.startsAt)} (hora de Buenos Aires)</dd>
        <dt>Ubicación</dt>
        <dd>
          {/^https?:\/\//.test(event.location) ? <a href={event.location}>{event.location}</a> : event.location}
        </dd>
        <dt>Descripción</dt>
        <dd>{event.description}</dd>
      </dl>
      {invitation.blockedBy ? (
        <section>
          <p>{BLOCK_MESSAGES[invitation.blockedBy]}</p>
          <p>Tu respuesta actual: {STATUS_LABELS[invitation.guestStatus]}</p>
        </section>
      ) : (
        <RsvpActions token={token} initialStatus={invitation.guestStatus} />
      )}
    </main>
  );
}
