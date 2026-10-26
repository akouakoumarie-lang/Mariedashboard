import { formatEuros, formatQuantity, type BaseUnit, type Unit } from '@nutriplan/core';

export { formatEuros };

export function formatAmount(quantity: number, unit: string): string {
  return formatQuantity(quantity, unit as BaseUnit | Unit);
}

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);

export function formatDayLong(iso: string): string {
  const d = parse(iso);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function formatDayShort(iso: string): { weekday: string; day: number } {
  const d = parse(iso);
  return { weekday: DAYS[d.getUTCDay()]!.slice(0, 3), day: d.getUTCDate() };
}

/** Date locale du téléphone au format AAAA-MM-JJ. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
