"use client";

import { useState } from "react";

type Status = "PENDING" | "ACCEPTED" | "REJECTED";

const STATUS_LABELS: Record<Status, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptado",
  REJECTED: "Rechazado",
};

export function RsvpActions({ token, initialStatus }: { token: string; initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function respond(response: "ACCEPTED" | "REJECTED") {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rsvp/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      const data = await res.json();
      if (res.ok) setStatus(data.status);
      else setError(data.error ?? "No se pudo registrar tu respuesta");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  return (
    <section>
      <p>Tu respuesta actual: {STATUS_LABELS[status]}</p>
      <div className="actions">
        <button type="button" disabled={pending} aria-pressed={status === "ACCEPTED"} onClick={() => respond("ACCEPTED")}>
          Asistiré
        </button>
        <button type="button" disabled={pending} aria-pressed={status === "REJECTED"} onClick={() => respond("REJECTED")}>
          No asistiré
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
