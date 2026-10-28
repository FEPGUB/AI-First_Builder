import nodemailer from "nodemailer";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearOutbox,
  createSmtpTransport,
  getOutbox,
  sendEmail,
  sendEmails,
  selectTransport,
  smtpConfigFromEnv,
  type EmailMessage,
  type EmailTransport,
} from "@/lib/email";

const mensaje = (to: string): EmailMessage => ({ to, subject: "Asunto", text: "Cuerpo" });

const smtpEnv = {
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "usuario",
  SMTP_PASS: "clave",
  SMTP_FROM: "Orgenicemos <no-responder@example.com>",
};

afterEach(() => {
  clearOutbox();
  vi.restoreAllMocks();
});

describe("selección de transport (no enviar mails reales fuera de producción)", () => {
  it("en test usa la bandeja en memoria", async () => {
    await sendEmail(mensaje("a@example.com"));
    expect(getOutbox()).toEqual([mensaje("a@example.com")]);
  });

  it("en desarrollo imprime en consola aunque haya SMTP configurado", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const createTransport = vi.spyOn(nodemailer, "createTransport");

    const transport = selectTransport({ ...smtpEnv, NODE_ENV: "development" });
    await transport.send(mensaje("a@example.com"));

    expect(createTransport).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toContain("a@example.com");
  });

  it("sin NODE_ENV tampoco usa SMTP", () => {
    const createTransport = vi.spyOn(nodemailer, "createTransport");
    selectTransport({ ...smtpEnv });
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("en producción usa SMTP y exige la configuración", () => {
    expect(() => selectTransport({ NODE_ENV: "production" })).toThrow(/SMTP_HOST, SMTP_FROM/);

    const createTransport = vi.spyOn(nodemailer, "createTransport");
    selectTransport({ ...smtpEnv, NODE_ENV: "production" });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.example.com", port: 587, secure: false, auth: { user: "usuario", pass: "clave" } }),
    );
  });
});

describe("configuración SMTP", () => {
  it("aplica valores por defecto: puerto 587 con STARTTLS", () => {
    const config = smtpConfigFromEnv({ SMTP_HOST: "h", SMTP_FROM: "f@example.com" });
    expect(config).toMatchObject({ port: 587, secure: false, user: undefined, pass: undefined });
  });

  it("usa TLS implícito en el puerto 465 salvo que se indique otra cosa", () => {
    const base = { SMTP_HOST: "h", SMTP_FROM: "f@example.com" };
    expect(smtpConfigFromEnv({ ...base, SMTP_PORT: "465" }).secure).toBe(true);
    expect(smtpConfigFromEnv({ ...base, SMTP_PORT: "465", SMTP_SECURE: "false" }).secure).toBe(false);
  });

  it("rechaza un puerto inválido", () => {
    expect(() => smtpConfigFromEnv({ SMTP_HOST: "h", SMTP_FROM: "f", SMTP_PORT: "abc" })).toThrow(/SMTP_PORT/);
  });
});

describe("transport SMTP", () => {
  it("entrega al servidor el remitente, destinatario y contenido (sin red)", async () => {
    // jsonTransport arma el mensaje como lo mandaría nodemailer, pero no abre ninguna conexión.
    const transporter = nodemailer.createTransport({ jsonTransport: true });
    const sendMail = vi.spyOn(transporter, "sendMail");

    await createSmtpTransport(transporter, "Orgenicemos <no-responder@example.com>").send({
      ...mensaje("a@example.com"),
      html: "<p>Cuerpo</p>",
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "Orgenicemos <no-responder@example.com>",
      to: "a@example.com",
      subject: "Asunto",
      text: "Cuerpo",
      html: "<p>Cuerpo</p>",
    });
  });
});

describe("envío masivo (RNF-07)", () => {
  it("entrega los 100 correos respetando el límite de concurrencia", async () => {
    let enVuelo = 0;
    let maxEnVuelo = 0;
    const entregados: string[] = [];
    const transport: EmailTransport = {
      async send(message) {
        enVuelo++;
        maxEnVuelo = Math.max(maxEnVuelo, enVuelo);
        await new Promise((r) => setTimeout(r, 2));
        entregados.push(message.to);
        enVuelo--;
      },
    };

    const mensajes = Array.from({ length: 100 }, (_, i) => mensaje(`g${i}@example.com`));
    const result = await sendEmails(mensajes, { transport, concurrency: 5 });

    expect(result).toEqual({ sent: 100, failed: [] });
    expect(new Set(entregados).size).toBe(100);
    expect(maxEnVuelo).toBeLessThanOrEqual(5);
    expect(maxEnVuelo).toBeGreaterThan(1);
  });

  it("un fallo individual no corta el resto y se informa", async () => {
    const transport: EmailTransport = {
      async send(message) {
        if (message.to === "malo@example.com") throw new Error("buzón inexistente");
      },
    };
    const result = await sendEmails(
      [mensaje("a@example.com"), mensaje("malo@example.com"), mensaje("b@example.com")],
      { transport },
    );
    expect(result.sent).toBe(2);
    expect(result.failed).toEqual([{ to: "malo@example.com", error: "buzón inexistente" }]);
  });

  it("con una lista vacía no hace nada", async () => {
    expect(await sendEmails([], { transport: { send: vi.fn() } })).toEqual({ sent: 0, failed: [] });
  });

  it("por defecto usa el transport del entorno (bandeja en test)", async () => {
    await sendEmails([mensaje("a@example.com"), mensaje("b@example.com")]);
    expect(getOutbox().map((m) => m.to)).toEqual(["a@example.com", "b@example.com"]);
  });
});
