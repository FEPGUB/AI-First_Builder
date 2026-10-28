import { NextResponse } from "next/server";
import { readJson } from "@/lib/auth-response";
import { respondToInvitation } from "@/lib/rsvp";

const ERRORS = {
  not_found: { status: 404, message: "El enlace no es válido o ya venció" },
  canceled: { status: 409, message: "El evento fue cancelado" },
  deadline_passed: { status: 409, message: "El plazo para responder ya venció" },
} as const;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await readJson(request)) as { response?: unknown } | null;
  const answer = body?.response;
  if (answer !== "ACCEPTED" && answer !== "REJECTED") {
    return NextResponse.json({ error: "Respuesta inválida" }, { status: 400 });
  }

  const result = await respondToInvitation(token, answer);
  if (result.ok) return NextResponse.json({ status: result.status });

  const { status, message } = ERRORS[result.error];
  return NextResponse.json({ error: message, code: result.error }, { status });
}
