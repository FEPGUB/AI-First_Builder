// Todas las reglas de fechas y plazos del sistema (RNF-04): se evalúan en
// America/Argentina/Buenos_Aires con precisión de 1 minuto, sin depender de la
// zona horaria del servidor.

export const TIME_ZONE = "America/Argentina/Buenos_Aires";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const MIN_CREATION_LEAD_DAYS = 4; // RF-04
export const RESPONSE_DEADLINE_HOURS = 24; // plazo de respuesta
export const VISIBILITY_AFTER_EVENT_HOURS = 4; // ventana de visibilidad

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** Descompone un instante en fecha y hora de Buenos Aires. */
export function zonedParts(date: Date): ZonedParts {
  const parts: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", { timeZone: TIME_ZONE, dateStyle: "full" });
const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Fecha legible en hora de Buenos Aires, p. ej. "jueves, 5 de noviembre de 2026". */
export function formatEventDate(date: Date): string {
  return dateFormatter.format(date);
}

/** Hora en formato 24 h de Buenos Aires, p. ej. "15:00". */
export function formatEventTime(date: Date): string {
  return timeFormatter.format(date);
}

/** Descarta los segundos: los plazos se evalúan con precisión de 1 minuto. */
export function truncateToMinute(date: Date): Date {
  return new Date(Math.floor(date.getTime() / MINUTE_MS) * MINUTE_MS);
}

/** Número de día calendario (en Buenos Aires) contando días desde 1970-01-01. */
function calendarDayNumber(date: Date): number {
  const { year, month, day } = zonedParts(date);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

/** Días calendario de Buenos Aires entre `from` y `to` (positivo si `to` es posterior). */
export function calendarDaysBetween(from: Date, to: Date): number {
  return calendarDayNumber(to) - calendarDayNumber(from);
}

/**
 * Convierte fecha y hora ingresadas por el usuario (hora de Buenos Aires) en el
 * instante absoluto correspondiente. Devuelve null si el formato es inválido.
 */
export function buenosAiresToInstant(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const [year, month, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const [hour, minute] = [Number(t[1]), Number(t[2])];
  if (hour > 23 || minute > 59) return null;

  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(asUtc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null; // fecha inexistente, p. ej. 2026-02-31
  }

  // Corrige por el offset real de la zona en ese momento.
  let instant = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(new Date(instant));
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    instant += asUtc - shown;
  }
  return new Date(instant);
}

/** RF-04: el evento debe ser al menos 4 días calendario posterior a hoy. */
export function isCreationLeadTimeValid(now: Date, startsAt: Date): boolean {
  return calendarDaysBetween(now, startsAt) >= MIN_CREATION_LEAD_DAYS;
}

/** Último instante en que el invitado puede responder o cambiar su respuesta. */
export function responseDeadline(startsAt: Date): Date {
  return new Date(
    truncateToMinute(startsAt).getTime() - RESPONSE_DEADLINE_HOURS * HOUR_MS,
  );
}

/** Plazo de respuesta: faltan 24 horas o más, inclusive el minuto exacto. */
export function isWithinResponseWindow(now: Date, startsAt: Date): boolean {
  return truncateToMinute(now).getTime() <= responseDeadline(startsAt).getTime();
}

/** Fin de la ventana de visibilidad del invitado (4 horas después del evento). */
export function visibilityDeadline(startsAt: Date): Date {
  return new Date(
    truncateToMinute(startsAt).getTime() + VISIBILITY_AFTER_EVENT_HOURS * HOUR_MS,
  );
}

/** Ventana de visibilidad del invitado: hasta 4 horas después del evento, inclusive. */
export function isWithinVisibilityWindow(now: Date, startsAt: Date): boolean {
  return truncateToMinute(now).getTime() <= visibilityDeadline(startsAt).getTime();
}
