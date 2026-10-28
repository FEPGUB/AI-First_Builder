import { cookies } from "next/headers";
import { getUserFromToken, type PublicUser } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

/** Usuario de la sesión actual en Server Components, o null si no hay sesión válida. */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  return getUserFromToken(store.get(SESSION_COOKIE)?.value);
}
