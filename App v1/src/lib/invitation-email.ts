import type { EmailMessage } from "@/lib/email";
import { formatEventDate, formatEventTime, responseDeadline } from "@/lib/time";

export type InvitationEvent = {
  title: string;
  startsAt: Date;
  location: string;
  description: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** RF-15: invitación individual con los datos del evento y el enlace único de respuesta. */
export function buildInvitationEmail(params: {
  to: string;
  event: InvitationEvent;
  link: string;
}): EmailMessage {
  const { to, event, link } = params;
  const fecha = formatEventDate(event.startsAt);
  const hora = `${formatEventTime(event.startsAt)} (hora de Buenos Aires)`;
  const deadline = responseDeadline(event.startsAt);
  const plazo = `${formatEventDate(deadline)} a las ${formatEventTime(deadline)}`;

  const text = [
    `Te invitaron a "${event.title}".`,
    "",
    `Fecha: ${fecha}`,
    `Hora: ${hora}`,
    `Ubicación: ${event.location}`,
    `Descripción: ${event.description}`,
    "",
    `Confirmá si asistís hasta el ${plazo}:`,
    link,
  ].join("\n");

  const html = `<p>Te invitaron a <strong>${escapeHtml(event.title)}</strong>.</p>
<ul>
<li><strong>Fecha:</strong> ${escapeHtml(fecha)}</li>
<li><strong>Hora:</strong> ${escapeHtml(hora)}</li>
<li><strong>Ubicación:</strong> ${escapeHtml(event.location)}</li>
<li><strong>Descripción:</strong> ${escapeHtml(event.description)}</li>
</ul>
<p>Confirmá si asistís hasta el ${escapeHtml(plazo)}:</p>
<p><a href="${escapeHtml(link)}">Responder la invitación</a></p>`;

  return { to, subject: `Invitación: ${event.title}`, text, html };
}
