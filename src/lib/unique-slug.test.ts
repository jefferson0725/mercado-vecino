import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { createWithUniqueSlug, isUniqueViolation } from "./unique-slug";

function p2002(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });
}

describe("isUniqueViolation", () => {
  it("detecta P2002 y la columna afectada", () => {
    const e = p2002(["businessId", "slug"]);
    expect(isUniqueViolation(e)).toBe(true);
    expect(isUniqueViolation(e, "slug")).toBe(true);
    expect(isUniqueViolation(e, "ownerId")).toBe(false);
    expect(isUniqueViolation(new Error("x"))).toBe(false);
  });
});

describe("createWithUniqueSlug", () => {
  it("usa el slug base si no hay colisión", async () => {
    const result = await createWithUniqueSlug("donas", async (slug) => slug);
    expect(result).toBe("donas");
  });

  it("reintenta con sufijos numéricos ante colisiones de slug", async () => {
    const intentos: string[] = [];
    const result = await createWithUniqueSlug("donas", async (slug) => {
      intentos.push(slug);
      if (intentos.length < 3) throw p2002(["businessId", "slug"]);
      return slug;
    });
    expect(intentos).toEqual(["donas", "donas-2", "donas-3"]);
    expect(result).toBe("donas-3");
  });

  it("cae a un sufijo aleatorio al agotar los numéricos", async () => {
    let intentos = 0;
    const result = await createWithUniqueSlug("donas", async (slug) => {
      intentos++;
      if (intentos < 7) throw p2002(["slug"]);
      return slug;
    });
    expect(result).toMatch(/^donas-[a-z0-9]{6}$/);
  });

  it("relanza violaciones de unique ajenas al slug", async () => {
    await expect(
      createWithUniqueSlug("donas", async () => {
        throw p2002(["ownerId"]);
      })
    ).rejects.toThrow("Unique constraint failed");
  });

  it("relanza errores que no son P2002", async () => {
    await expect(
      createWithUniqueSlug("donas", async () => {
        throw new Error("conexión perdida");
      })
    ).rejects.toThrow("conexión perdida");
  });
});
