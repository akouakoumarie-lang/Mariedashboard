/** Les dates de repas sont stockées en type DATE (minuit UTC). */
export const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10);
export const fromIsoDate = (s: string): Date => new Date(`${s}T00:00:00Z`);
export const todayIso = (): string => new Date().toISOString().slice(0, 10);
