import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formatEventDate, formatEventTime } from "@/lib/time";

export const metadata = { title: "Evento | Orgenicemos" };

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  // Por ahora solo el organizador abre la ficha; el acceso de invitados llega con el RSVP.
  if (!event || event.organizerId !== user.id) notFound();

  return (
    <main>
      <h1>{event.title}</h1>
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
    </main>
  );
}
