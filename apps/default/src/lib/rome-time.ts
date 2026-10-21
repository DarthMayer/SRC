export const ROME_TIME_ZONE = 'Europe/Rome';

export function romeDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ROME_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

export function romeToday() {
  const parts = romeDateParts();
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function romeHour() {
  return Number(romeDateParts().hour);
}

export function dateInputToRomeIso(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return undefined;
  const guess = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const offsetText = new Intl.DateTimeFormat('en-US', { timeZone: ROME_TIME_ZONE, timeZoneName: 'longOffset' }).formatToParts(guess).find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+01:00';
  const offset = offsetText.replace('GMT', '') || '+00:00';
  return new Date(`${value}T00:00:00${offset}`).toISOString();
}

export function formatRomeDate(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  const parts = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: ROME_TIME_ZONE }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.day}/${values.month}/${values.year}`;
}
