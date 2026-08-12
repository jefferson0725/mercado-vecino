import { afterEach, describe, expect, it, vi } from "vitest";
import { slugify, normalizeWhatsapp, isValidImageUrl } from "./utils";

describe("slugify", () => {
  it("convierte a minúsculas con guiones", () => {
    expect(slugify("Donas de María")).toBe("donas-de-maria");
  });

  it("elimina tildes y caracteres especiales", () => {
    expect(slugify("Café ¡El Ñato! #1")).toBe("cafe-el-nato-1");
  });

  it("colapsa espacios, guiones y guiones bajos", () => {
    expect(slugify("  hola -- _ mundo  ")).toBe("hola-mundo");
  });

  it("devuelve vacío si no hay letras ni números", () => {
    expect(slugify("!!! ???")).toBe("");
  });
});

describe("normalizeWhatsapp", () => {
  it("antepone 57 a un celular colombiano de 10 dígitos", () => {
    expect(normalizeWhatsapp("300 111 2233")).toBe("573001112233");
  });

  it("acepta números internacionales de 11 a 15 dígitos", () => {
    expect(normalizeWhatsapp("+52 1 55 1234 5678")).toBe("5215512345678");
  });

  it("rechaza números demasiado cortos", () => {
    expect(normalizeWhatsapp("12345")).toBeNull();
  });

  it("rechaza 10 dígitos que no empiezan por 3", () => {
    expect(normalizeWhatsapp("6011112233")).toBeNull();
  });
});

describe("isValidImageUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("acepta vacío (sin imagen) y rutas de /uploads/", () => {
    expect(isValidImageUrl("")).toBe(true);
    expect(isValidImageUrl("/uploads/demo/foto-abc123.webp")).toBe(true);
  });

  it("acepta URLs del prefijo público de R2", () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://cdn.ejemplo.com/");
    expect(isValidImageUrl("https://cdn.ejemplo.com/demo/foto.webp")).toBe(true);
  });

  it("rechaza URLs externas arbitrarias", () => {
    vi.stubEnv("R2_PUBLIC_URL", "https://cdn.ejemplo.com");
    expect(isValidImageUrl("https://evil.com/foto.webp")).toBe(false);
    expect(isValidImageUrl("https://cdn.ejemplo.com.evil.com/foto.webp")).toBe(false);
  });
});
