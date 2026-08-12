import { describe, expect, it } from "vitest";
import {
  addOneMonth,
  extendPaidUntil,
  graceEndsAt,
  subscriptionStatus,
} from "./subscription";

const utc = (iso: string) => new Date(iso);

describe("addOneMonth", () => {
  it("suma un mes calendario normal", () => {
    expect(addOneMonth(utc("2026-07-15T12:00:00Z"))).toEqual(utc("2026-08-15T12:00:00Z"));
  });

  it("aplica tope de fin de mes", () => {
    expect(addOneMonth(utc("2026-01-31T12:00:00Z"))).toEqual(utc("2026-02-28T12:00:00Z"));
    expect(addOneMonth(utc("2026-08-31T12:00:00Z"))).toEqual(utc("2026-09-30T12:00:00Z"));
  });

  it("respeta el 29 de febrero en bisiesto", () => {
    expect(addOneMonth(utc("2028-01-31T12:00:00Z"))).toEqual(utc("2028-02-29T12:00:00Z"));
  });

  it("cruza el fin de año", () => {
    expect(addOneMonth(utc("2026-12-10T12:00:00Z"))).toEqual(utc("2027-01-10T12:00:00Z"));
  });
});

describe("extendPaidUntil", () => {
  const now = utc("2026-07-15T12:00:00Z");

  it("pagar antes de vencer acumula desde el vencimiento", () => {
    const vigente = utc("2026-07-20T12:00:00Z");
    expect(extendPaidUntil(vigente, now)).toEqual(utc("2026-08-20T12:00:00Z"));
  });

  it("pagar vencido cuenta desde hoy, sin mora retroactiva", () => {
    const vencida = utc("2026-06-01T12:00:00Z");
    expect(extendPaidUntil(vencida, now)).toEqual(utc("2026-08-15T12:00:00Z"));
  });

  it("sin vigencia previa cuenta desde hoy", () => {
    expect(extendPaidUntil(null, now)).toEqual(utc("2026-08-15T12:00:00Z"));
  });
});

describe("subscriptionStatus", () => {
  const now = utc("2026-07-15T12:00:00Z");
  const precio = 20_000;

  it("conjunto con precio 0 siempre es exenta", () => {
    expect(subscriptionStatus(null, 0, now)).toBe("exenta");
    expect(subscriptionStatus(utc("2020-01-01T00:00:00Z"), 0, now)).toBe("exenta");
  });

  it("vigente es activa", () => {
    expect(subscriptionStatus(utc("2026-07-16T00:00:00Z"), precio, now)).toBe("activa");
  });

  it("vencida hace menos de graceDays está en gracia", () => {
    expect(subscriptionStatus(utc("2026-07-13T12:00:00Z"), precio, now)).toBe("gracia");
  });

  it("vencida más allá de la gracia queda vencida", () => {
    expect(subscriptionStatus(utc("2026-07-10T11:00:00Z"), precio, now)).toBe("vencida");
  });

  it("sin paidUntil es vencida", () => {
    expect(subscriptionStatus(null, precio, now)).toBe("vencida");
  });
});

describe("graceEndsAt", () => {
  it("la gracia termina graceDays después del vencimiento", () => {
    expect(graceEndsAt(utc("2026-07-15T12:00:00Z"))).toEqual(utc("2026-07-20T12:00:00Z"));
  });
});
