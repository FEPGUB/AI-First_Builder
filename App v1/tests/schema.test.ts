import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";

async function crearOrganizador() {
  return prisma.user.create({
    data: { email: "org@example.com", passwordHash: "hash" },
  });
}

describe("modelo de datos", () => {
  beforeEach(async () => {
    await prisma.guest.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
  });

  it("crea un usuario con sessionVersion 0 y rechaza emails duplicados", async () => {
    const user = await crearOrganizador();
    expect(user.sessionVersion).toBe(0);
    await expect(crearOrganizador()).rejects.toThrow();
  });

  it("crea un evento con invitados Pendiente y token único", async () => {
    const org = await crearOrganizador();
    const event = await prisma.event.create({
      data: {
        title: "Asado",
        startsAt: new Date("2026-11-05T18:00:00Z"),
        location: "https://meet.example.com/x",
        description: "Descripción",
        organizerId: org.id,
        guests: {
          create: [
            { email: "a@example.com", token: "token-a" },
            { email: "b@example.com", token: "token-b" },
          ],
        },
      },
      include: { guests: true },
    });
    expect(event.canceledAt).toBeNull();
    expect(event.guests.map((g) => g.status)).toEqual(["PENDING", "PENDING"]);
  });

  it("no permite el mismo email dos veces en un evento ni tokens repetidos", async () => {
    const org = await crearOrganizador();
    const event = await prisma.event.create({
      data: {
        title: "E",
        startsAt: new Date("2026-11-05T18:00:00Z"),
        location: "L",
        description: "D",
        organizerId: org.id,
      },
    });
    await prisma.guest.create({
      data: { email: "a@example.com", token: "t1", eventId: event.id },
    });
    await expect(
      prisma.guest.create({
        data: { email: "a@example.com", token: "t2", eventId: event.id },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.guest.create({
        data: { email: "c@example.com", token: "t1", eventId: event.id },
      }),
    ).rejects.toThrow();
  });
});
