# AGENTS.md

## Propósito
Orgenicemos es una app web responsive para gestionar eventos: invitaciones por email, RSVP, recordatorios automáticos,
observaciones y encuestas. Dos roles: organizador e invitado (este puede responder sin cuenta, vía enlace único).

## Stack
- Next.js 16.4.2 (frontend y backend)
- Prisma sobre SQLite
- Autenticación con JWT
- Email por SMTP genérico
- Next.js Cron Jobs: recordatorios diarios a las 10:00 (America/Argentina/Buenos_Aires) y proceso horario que pasa a Rechazado a los invitados Pendientes con plazo vencido
- Gestor de paquetes: pnpm

## Cómo correr
- Instalar: `pnpm install` (copiar `.env.example` a `.env`)
- Levantar en desarrollo: `pnpm dev` (http://localhost:3000)
- Tests: `pnpm test` (Vitest, en `tests/`)
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- Email: `src/lib/email.ts`. El transport depende solo de `NODE_ENV`: SMTP real únicamente en `production`; en desarrollo se imprime en la terminal y en tests queda en memoria (`getOutbox()`).
- Prisma: `pnpm db:generate` y `pnpm db:migrate`. Se usa Prisma 7.10.1 (estable) con el adapter `better-sqlite3`; el cliente se genera en `src/generated/prisma` (ignorado por git).

## Qué NO hacer
- No implementar notificaciones Push (fuera de alcance).
- No cambiar SQLite por otra base de datos (dependencia declarada en el PRD).
- No enviar emails reales desde desarrollo ni tests.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
