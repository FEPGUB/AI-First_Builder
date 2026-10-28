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
Pendiente de definir: todavía no hay comandos de instalar, levantar ni tests.

## Qué NO hacer
- No implementar notificaciones Push (fuera de alcance).
- No cambiar SQLite por otra base de datos (dependencia declarada en el PRD).
- No enviar emails reales desde desarrollo ni tests.
