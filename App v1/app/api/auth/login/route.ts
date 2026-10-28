import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { readJson, respondWithSession } from "@/lib/auth-response";

export async function POST(request: Request) {
  const result = await authenticate(await readJson(request));
  if (result.ok) return respondWithSession(result.user, 200);
  return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
}
