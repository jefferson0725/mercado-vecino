import { afterEach, describe, expect, it, vi } from "vitest";
import { TIME_REGEX, isWithinSchedule, formatDias, describeSchedule } from "./schedule";

// Bogotá es UTC-5 sin horario de verano: fijar el reloj en UTC basta.
function enBogota(isoUtc: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(isoUtc));
}

afterEach(() => vi.useRealTimers());

describe("TIME_REGEX", () => {
  it("acepta HH:MM de 24 horas y rechaza el resto", () => {
    expect(TIME_REGEX.test("00:00")).toBe(true);
    expect(TIME_REGEX.test("23:59")).toBe(true);
    expect(TIME_REGEX.test("24:00")).toBe(false);
    expect(TIME_REGEX.test("9:00")).toBe(false);
  });
});

describe("isWithinSchedule", () => {
  it("sin horario ni días siempre está abierto", () => {
    enBogota("2026-07-10T17:00:00Z");
    expect(isWithinSchedule({ opensAt: null, closesAt: null, openDays: [] })).toBe(true);
  });

  it("respeta un rango diurno", () => {
    // Viernes 12:00 en Bogotá
    enBogota("2026-07-10T17:00:00Z");
    expect(isWithinSchedule({ opensAt: "09:00", closesAt: "18:00", openDays: [] })).toBe(true);
    expect(isWithinSchedule({ opensAt: "14:00", closesAt: "18:00", openDays: [] })).toBe(false);
  });

  it("admite rangos nocturnos que cruzan medianoche", () => {
    const horario = { opensAt: "22:00", closesAt: "02:00", openDays: [] as never[] };
    // Viernes 23:00 en Bogotá
    enBogota("2026-07-11T04:00:00Z");
    expect(isWithinSchedule(horario)).toBe(true);
    // Sábado 01:00 en Bogotá (aún dentro del rango del viernes)
    enBogota("2026-07-11T06:00:00Z");
    expect(isWithinSchedule(horario)).toBe(true);
    // Sábado 03:00 en Bogotá
    enBogota("2026-07-11T08:00:00Z");
    expect(isWithinSchedule(horario)).toBe(false);
  });

  it("la madrugada de un rango nocturno cuenta como el día anterior", () => {
    const horario = { opensAt: "22:00", closesAt: "02:00", openDays: ["VIERNES" as const] };
    // Sábado 01:00 en Bogotá → efectivamente viernes
    enBogota("2026-07-11T06:00:00Z");
    expect(isWithinSchedule(horario)).toBe(true);
    // Domingo 01:00 en Bogotá → efectivamente sábado, no abre
    enBogota("2026-07-12T06:00:00Z");
    expect(isWithinSchedule(horario)).toBe(false);
  });

  it("cierra los días no marcados", () => {
    // Viernes 12:00 en Bogotá
    enBogota("2026-07-10T17:00:00Z");
    expect(isWithinSchedule({ opensAt: null, closesAt: null, openDays: ["LUNES"] })).toBe(false);
    expect(isWithinSchedule({ opensAt: null, closesAt: null, openDays: ["VIERNES"] })).toBe(true);
  });
});

describe("formatDias", () => {
  it("agrupa días consecutivos en rangos", () => {
    expect(formatDias(["VIERNES", "SABADO", "DOMINGO"])).toBe("vie a dom");
    expect(formatDias(["LUNES", "MIERCOLES"])).toBe("lun, mié");
    expect(formatDias(["LUNES", "MARTES"])).toBe("lun y mar");
    expect(formatDias([])).toBe("todos los días");
  });
});

describe("describeSchedule", () => {
  it("devuelve null sin horario ni días", () => {
    expect(describeSchedule({ opensAt: null, closesAt: null, openDays: [] })).toBeNull();
  });

  it("combina días y horas", () => {
    const texto = describeSchedule({
      opensAt: "19:00",
      closesAt: "22:00",
      openDays: ["VIERNES", "SABADO"],
    });
    expect(texto).toContain("vie y sáb");
    expect(texto).toContain("7:00");
  });
});
