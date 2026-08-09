const LOCALE = "pt-BR";
// Precisa ser NEXT_PUBLIC_: as mesmas datas são formatadas no servidor e no cliente,
// e um fuso diferente dos dois lados quebraria a hidratação.
const TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "America/Sao_Paulo";

const money = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BRL",
});

const dateTime = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dayAndHour = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const monthLabel = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  month: "long",
  year: "numeric",
});

const weekdayFull = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const hourOnly = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

export function brl(value: number) {
  return money.format(Number.isFinite(value) ? value : 0);
}

/** "09/08/2026, 14:32" */
export function formatDateTime(iso: string | null) {
  return iso ? dateTime.format(new Date(iso)) : "—";
}

/** "09 de ago., 14:32" */
export function formatDayAndHour(iso: string | null) {
  return iso ? dayAndHour.format(new Date(iso)).replace(",", " •") : "—";
}

/** "agosto de 2026" — usado para agrupar o histórico. */
export function formatMonth(iso: string | null) {
  return iso ? monthLabel.format(new Date(iso)) : "Sem data";
}

/** "sábado, 9 de agosto de 2026" */
export function formatWeekday(iso: string | null) {
  return iso ? weekdayFull.format(new Date(iso)) : "—";
}

/** "14:32" */
export function formatHour(iso: string | null) {
  return iso ? hourOnly.format(new Date(iso)) : "—";
}

/** "1h 24min" — duração entre início e fim da compra. */
export function formatDuration(startIso: string | null, endIso: string | null) {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}min`;
}

/** Quantidade sem zeros à toa: 1, 1,5, 0,25 */
export function formatQuantity(value: number) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 }).format(value);
}

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
