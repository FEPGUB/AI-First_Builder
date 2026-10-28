import nodemailer, { type Transporter } from "nodemailer";

// Módulo de email por SMTP genérico.
// Regla del proyecto: nunca se envían emails reales desde desarrollo ni tests. El
// transport se elige solo por NODE_ENV, sin ninguna variable que lo pueda forzar:
//   production -> SMTP real | test -> bandeja en memoria | resto -> consola

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailTransport = {
  send(message: EmailMessage): Promise<void>;
};

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

type Env = Record<string, string | undefined>;

export function smtpConfigFromEnv(env: Env): SmtpConfig {
  const missing = ["SMTP_HOST", "SMTP_FROM"].filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Falta configurar el SMTP: ${missing.join(", ")}`);
  }
  const port = Number(env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT debe ser un número de puerto válido");
  }
  return {
    host: env.SMTP_HOST!,
    port,
    // Puerto 465 usa TLS implícito; en el resto se negocia STARTTLS.
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
    user: env.SMTP_USER || undefined,
    pass: env.SMTP_PASS || undefined,
    from: env.SMTP_FROM!,
  };
}

export function createSmtpTransport(transporter: Transporter, from: string): EmailTransport {
  return {
    async send(message) {
      await transporter.sendMail({ from, ...message });
    },
  };
}

// Bandeja en memoria: la usan los tests para verificar qué se "envió".
const outbox: EmailMessage[] = [];

export const getOutbox = (): readonly EmailMessage[] => outbox;
export const clearOutbox = () => {
  outbox.length = 0;
};

const memoryTransport: EmailTransport = {
  async send(message) {
    outbox.push(message);
  },
};

// En desarrollo se imprime el mail en la terminal (sirve para copiar los enlaces).
const consoleTransport: EmailTransport = {
  async send(message) {
    console.log(`[email simulado] Para: ${message.to}\nAsunto: ${message.subject}\n\n${message.text}\n`);
  },
};

export function selectTransport(env: Env = process.env): EmailTransport {
  if (env.NODE_ENV === "production") {
    const config = smtpConfigFromEnv(env);
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      pool: true,
      maxConnections: 5,
    });
    return createSmtpTransport(transporter, config.from);
  }
  if (env.NODE_ENV === "test") return memoryTransport;
  return consoleTransport;
}

let defaultTransport: EmailTransport | undefined;

function getTransport(): EmailTransport {
  defaultTransport ??= selectTransport();
  return defaultTransport;
}

export async function sendEmail(
  message: EmailMessage,
  transport: EmailTransport = getTransport(),
): Promise<void> {
  await transport.send(message);
}

export type BulkResult = {
  sent: number;
  failed: { to: string; error: string }[];
};

/**
 * Envía muchos correos con concurrencia acotada (RNF-07: 100 invitados en menos de
 * 5 minutos). Un fallo individual no corta el resto: se informa en `failed`.
 */
export async function sendEmails(
  messages: EmailMessage[],
  { transport = getTransport(), concurrency = 10 }: { transport?: EmailTransport; concurrency?: number } = {},
): Promise<BulkResult> {
  const result: BulkResult = { sent: 0, failed: [] };
  let next = 0;

  async function worker() {
    while (next < messages.length) {
      const message = messages[next++];
      try {
        await transport.send(message);
        result.sent++;
      } catch (error) {
        result.failed.push({ to: message.to, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, messages.length) }, worker));
  return result;
}
