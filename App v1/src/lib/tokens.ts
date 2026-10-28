import { randomBytes } from "node:crypto";

// RNF-03: 32 bytes (256 bits) de un generador criptográficamente seguro, en base64url
// (43 caracteres). Es el secreto del enlace único de respuesta de cada invitado.
export const GUEST_TOKEN_BYTES = 32;

export function generateGuestToken(): string {
  return randomBytes(GUEST_TOKEN_BYTES).toString("base64url");
}
