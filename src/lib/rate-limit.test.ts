import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";

const WINDOW = { limit: 3, windowMs: 60_000 };

describe("rateLimit", () => {
  it("permite hasta el límite y bloquea después", () => {
    const t0 = 1_000_000;
    expect(rateLimit("a", WINDOW, t0)).toBe(true);
    expect(rateLimit("a", WINDOW, t0 + 1)).toBe(true);
    expect(rateLimit("a", WINDOW, t0 + 2)).toBe(true);
    expect(rateLimit("a", WINDOW, t0 + 3)).toBe(false);
  });

  it("reinicia el contador al vencer la ventana", () => {
    const t0 = 2_000_000;
    for (let i = 0; i < 4; i++) rateLimit("b", WINDOW, t0);
    expect(rateLimit("b", WINDOW, t0 + WINDOW.windowMs)).toBe(true);
  });

  it("lleva contadores independientes por clave", () => {
    const t0 = 3_000_000;
    for (let i = 0; i < 4; i++) rateLimit("c", WINDOW, t0);
    expect(rateLimit("d", WINDOW, t0)).toBe(true);
  });
});
