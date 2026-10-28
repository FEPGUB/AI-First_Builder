"use client";

import { useState, type FormEvent } from "react";

type Props = { mode: "login" | "register" };

const COPY = {
  login: { title: "Iniciar sesión", submit: "Ingresar", endpoint: "/api/auth/login", done: "Sesión iniciada como" },
  register: { title: "Crear cuenta", submit: "Registrarme", endpoint: "/api/auth/register", done: "Cuenta creada. Sesión iniciada como" },
} as const;

export function AuthForm({ mode }: Props) {
  const copy = COPY[mode];
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(copy.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = await res.json();
      setMessage(
        res.ok
          ? { ok: true, text: `${copy.done} ${data.user.email}` }
          : { ok: false, text: data.error ?? "No se pudo completar la operación" },
      );
    } catch {
      setMessage({ ok: false, text: "No se pudo conectar con el servidor" });
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      <h1>{copy.title}</h1>
      <form onSubmit={onSubmit}>
        <label>
          Correo electrónico
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
        </label>
        <button type="submit" disabled={pending}>
          {copy.submit}
        </button>
      </form>
      {message && <p role={message.ok ? "status" : "alert"}>{message.text}</p>}
    </main>
  );
}
