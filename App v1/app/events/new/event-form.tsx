"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function EventForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          date: form.get("date"),
          time: form.get("time"),
          location: form.get("location"),
          description: form.get("description"),
          // Un correo por línea, o separados por comas, punto y coma o espacios.
          guests: String(form.get("guests") ?? "")
            .split(/[\s,;]+/)
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/events/${data.event.id}`);
        return;
      }
      setError(data.error ?? "No se pudo crear el evento");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      <h1>Nuevo evento</h1>
      <form onSubmit={onSubmit}>
        <label>
          Título
          <input name="title" required maxLength={200} />
        </label>
        <label>
          Fecha
          <input name="date" type="date" required />
        </label>
        <label>
          Hora (hora de Buenos Aires)
          <input name="time" type="time" required />
        </label>
        <label>
          Ubicación (dirección o enlace virtual)
          <input name="location" required maxLength={500} />
        </label>
        <label>
          Descripción
          <textarea name="description" required rows={4} maxLength={5000} />
        </label>
        <label>
          Invitados (un correo por línea, hasta 100)
          <textarea name="guests" required rows={5} />
        </label>
        <button type="submit" disabled={pending}>
          Crear evento y enviar invitaciones
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
