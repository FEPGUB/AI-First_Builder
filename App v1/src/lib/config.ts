type Env = Record<string, string | undefined>;

/** URL pública de la app, usada para armar los enlaces únicos de los correos. */
export function appUrl(env: Env = process.env): string {
  const url = env.APP_URL?.trim();
  if (url) return url.replace(/\/+$/, "");
  if (env.NODE_ENV === "production") {
    throw new Error("Falta configurar APP_URL");
  }
  return "http://localhost:3000";
}
