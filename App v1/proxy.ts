import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "@/lib/session";

// RNF-02: cada solicitud autenticada renueva los 30 días de la sesión. La versión de
// sesión no se revisa acá (no se consulta la base): getUserFromToken lo hace en cada
// acceso, así que un token reemitido tras un logout sigue siendo inválido.
export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  // Estas rutas ya emiten su propia cookie de sesión.
  if (pathname === "/api/auth/login" || pathname === "/api/auth/register") return response;

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) {
    response.cookies.set(SESSION_COOKIE, await signSession(session), sessionCookieOptions);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
