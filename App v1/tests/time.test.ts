import { describe, expect, it } from "vitest";
import {
  buenosAiresToInstant,
  calendarDaysBetween,
  isCreationLeadTimeValid,
  isWithinResponseWindow,
  isWithinVisibilityWindow,
  responseDeadline,
  zonedParts,
} from "@/lib/time";

// Buenos Aires es UTC-3 todo el año; se construyen instantes con offset explícito
// para que los tests no dependan de la implementación bajo prueba.
const ba = (iso: string) => new Date(`${iso}-03:00`);

describe("anticipación de creación (RF-04)", () => {
  it("AC-05: el día 1 rechaza un evento del día 4", () => {
    expect(isCreationLeadTimeValid(ba("2026-11-01T10:00:00"), ba("2026-11-04T18:00:00"))).toBe(false);
  });

  it("acepta un evento del día 5 creado el día 1", () => {
    expect(isCreationLeadTimeValid(ba("2026-11-01T10:00:00"), ba("2026-11-05T09:00:00"))).toBe(true);
  });

  it("AC-06: a las 23:30 del día 1 en BA (02:30 UTC del día 2) acepta el día 5", () => {
    const now = new Date("2026-11-02T02:30:00Z");
    expect(isCreationLeadTimeValid(now, ba("2026-11-05T15:00:00"))).toBe(true);
    // y sigue rechazando el día 4, aunque en UTC "hoy" ya sea el día 2
    expect(isCreationLeadTimeValid(now, ba("2026-11-04T15:00:00"))).toBe(false);
  });

  it("cuenta días calendario y no bloques de 24 horas", () => {
    expect(calendarDaysBetween(ba("2026-11-01T23:59:00"), ba("2026-11-05T00:00:00"))).toBe(4);
  });
});

describe("plazo de respuesta (24 horas)", () => {
  const evento = ba("2026-11-05T15:00:00");

  it("AC-26: con menos de 24 horas ya no se puede responder", () => {
    expect(isWithinResponseWindow(ba("2026-11-04T15:01:00"), evento)).toBe(false);
  });

  it("AC-27/32: con exactamente 24 horas todavía se puede responder", () => {
    expect(isWithinResponseWindow(ba("2026-11-04T15:00:00"), evento)).toBe(true);
  });

  it("precisión de 1 minuto: 15:00:30 cuenta como 15:00", () => {
    expect(isWithinResponseWindow(ba("2026-11-04T15:00:30"), evento)).toBe(true);
    expect(isWithinResponseWindow(ba("2026-11-04T15:01:00"), evento)).toBe(false);
  });

  it("AC-28: a las 14:59 del día 4 en BA (servidor en UTC) se puede responder", () => {
    expect(isWithinResponseWindow(new Date("2026-11-04T17:59:00Z"), new Date("2026-11-05T18:00:00Z"))).toBe(true);
  });

  it("calcula el vencimiento 24 horas antes del evento", () => {
    expect(responseDeadline(evento).toISOString()).toBe(ba("2026-11-04T15:00:00").toISOString());
  });
});

describe("ventana de visibilidad (4 horas)", () => {
  const evento = ba("2026-11-05T15:00:00");

  it("AC-37: a las 2 horas del evento todavía es visible", () => {
    expect(isWithinVisibilityWindow(ba("2026-11-05T17:00:00"), evento)).toBe(true);
  });

  it("AC-39/86: a exactamente 4 horas todavía es visible (18:59 también)", () => {
    expect(isWithinVisibilityWindow(ba("2026-11-05T19:00:00"), evento)).toBe(true);
    expect(isWithinVisibilityWindow(ba("2026-11-05T18:59:00"), evento)).toBe(true);
  });

  it("AC-38/75: pasadas más de 4 horas deja de ser visible", () => {
    expect(isWithinVisibilityWindow(ba("2026-11-05T19:01:00"), evento)).toBe(false);
  });

  it("precisión de 1 minuto: 19:00:30 cuenta como 19:00", () => {
    expect(isWithinVisibilityWindow(ba("2026-11-05T19:00:30"), evento)).toBe(true);
  });
});

describe("conversión de fecha y hora de Buenos Aires", () => {
  it("convierte 15:00 de BA a 18:00 UTC", () => {
    expect(buenosAiresToInstant("2026-11-05", "15:00")?.toISOString()).toBe("2026-11-05T18:00:00.000Z");
  });

  it("maneja el cambio de día respecto de UTC", () => {
    expect(buenosAiresToInstant("2026-11-05", "23:30")?.toISOString()).toBe("2026-11-06T02:30:00.000Z");
  });

  it("rechaza formatos y fechas inválidas", () => {
    expect(buenosAiresToInstant("2026-02-31", "10:00")).toBeNull();
    expect(buenosAiresToInstant("2026-11-05", "25:00")).toBeNull();
    expect(buenosAiresToInstant("05/11/2026", "10:00")).toBeNull();
    expect(buenosAiresToInstant("2026-11-05", "9:00")).toBeNull();
  });

  it("zonedParts devuelve la hora de Buenos Aires, no la del servidor", () => {
    expect(zonedParts(new Date("2026-11-02T02:30:00Z"))).toMatchObject({ day: 1, hour: 23, minute: 30 });
  });
});
