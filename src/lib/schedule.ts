// Estado abierto/cerrado derivado del horario: se calcula al renderizar,
// nunca se muta en la base de datos (sin crons ni jobs).

import type { Weekday } from "@/generated/prisma/client";

const TIMEZONE = "America/Bogota";

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// En orden de semana; el índice se usa para calcular rangos consecutivos
export const WEEKDAYS: Record<Weekday, { label: string; short: string }> = {
  LUNES: { label: "lunes", short: "lun" },
  MARTES: { label: "martes", short: "mar" },
  MIERCOLES: { label: "miércoles", short: "mié" },
  JUEVES: { label: "jueves", short: "jue" },
  VIERNES: { label: "viernes", short: "vie" },
  SABADO: { label: "sábado", short: "sáb" },
  DOMINGO: { label: "domingo", short: "dom" },
};

export const WEEKDAY_KEYS = Object.keys(WEEKDAYS) as Weekday[];

export function isWeekday(value: string): value is Weekday {
  return value in WEEKDAYS;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// "Mon" de Intl → índice 0 (LUNES) ... 6 (DOMINGO)
const INTL_DAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function nowInBogota(): { minutes: number; dayIndex: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return {
    minutes: hour * 60 + minute,
    dayIndex: INTL_DAY_INDEX[get("weekday")] ?? 0,
  };
}

type Schedule = {
  opensAt: string | null;
  closesAt: string | null;
  openDays: Weekday[];
};

export function isWithinSchedule({ opensAt, closesAt, openDays }: Schedule): boolean {
  const now = nowInBogota();

  const hasHours = Boolean(opensAt && closesAt && opensAt !== closesAt);
  const open = hasHours ? toMinutes(opensAt!) : 0;
  const close = hasHours ? toMinutes(closesAt!) : 0;
  const overnight = hasHours && open > close;

  if (hasHours) {
    const inHours = overnight
      ? now.minutes >= open || now.minutes < close
      : now.minutes >= open && now.minutes < close;
    if (!inHours) return false;
  }

  if (openDays.length === 0) return true;

  // En un rango nocturno, la madrugada pertenece al día anterior:
  // "viernes 22:00–02:00" sigue siendo viernes a la 1:00 a. m. del sábado
  const effectiveDay =
    overnight && now.minutes < close ? (now.dayIndex + 6) % 7 : now.dayIndex;
  return openDays.some((d) => WEEKDAY_KEYS.indexOf(d) === effectiveDay);
}

// El negocio está abierto solo si el vendedor lo activó Y el horario lo permite.
export function isOpenNow(business: { isOpen: boolean } & Schedule): boolean {
  return business.isOpen && isWithinSchedule(business);
}

export function formatHora(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date(Date.UTC(2026, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

export function formatHorario(opensAt: string, closesAt: string): string {
  return `${formatHora(opensAt)} – ${formatHora(closesAt)}`;
}

export function describeSchedule({ opensAt, closesAt, openDays }: Schedule): string | null {
  const hasHours = Boolean(opensAt && closesAt);
  const hasDays = openDays.length > 0;
  if (!hasHours && !hasDays) return null;
  if (!hasHours) return formatDias(openDays);
  return `${formatDias(openDays)}, ${formatHorario(opensAt!, closesAt!)}`;
}

export function formatDias(openDays: Weekday[]): string {
  if (openDays.length === 0 || openDays.length === 7) return "todos los días";
  const indices = openDays
    .map((d) => WEEKDAY_KEYS.indexOf(d))
    .sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const i of indices) {
    const last = groups[groups.length - 1];
    if (last && i === last[last.length - 1] + 1) last.push(i);
    else groups.push([i]);
  }
  return groups
    .map((g) => {
      const first = WEEKDAYS[WEEKDAY_KEYS[g[0]]].short;
      const last = WEEKDAYS[WEEKDAY_KEYS[g[g.length - 1]]].short;
      if (g.length === 1) return first;
      if (g.length === 2) return `${first} y ${last}`;
      return `${first} a ${last}`;
    })
    .join(", ");
}
