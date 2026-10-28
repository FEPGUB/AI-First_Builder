import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { readJson, respondWithSession } from "@/lib/auth-response";

export async function POST(request: Request) {
  const result = await registerUser(await readJson(request));
  if (result.ok) return respondWithSession(result.user, 201);
  if (result.error === "email_taken") {
    return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });
  }
  return NextResponse.json({ error: result.message }, { status: 400 });
}
