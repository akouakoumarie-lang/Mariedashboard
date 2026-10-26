/**
 * Unités et conversions. Chaque ingrédient possède une unité de base (g, ml ou pièce).
 * Une conversion n'est faite que lorsqu'elle est fiable :
 *  - masse ↔ masse et volume ↔ volume : toujours ;
 *  - masse ↔ volume : seulement si la densité de l'ingrédient est connue ;
 *  - pièce ↔ masse : seulement si le poids moyen d'une pièce est connu.
 * Sinon `convertToBase` renvoie `null` et l'appelant doit conserver la quantité séparément.
 */

export const UNITS = ['g', 'kg', 'ml', 'cl', 'l', 'cs', 'cc', 'piece'] as const;
export type Unit = (typeof UNITS)[number];
export type BaseUnit = 'g' | 'ml' | 'piece';

export const UNIT_LABELS: Record<Unit, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  cl: 'cl',
  l: 'l',
  cs: 'c. à soupe',
  cc: 'c. à café',
  piece: 'pièce(s)',
};

const MASS: Partial<Record<Unit, number>> = { g: 1, kg: 1000 };
/** Cuillère à soupe = 15 ml, cuillère à café = 5 ml (valeurs culinaires usuelles). */
const VOLUME: Partial<Record<Unit, number>> = { ml: 1, cl: 10, l: 1000, cs: 15, cc: 5 };

export function dimensionOf(unit: Unit): 'masse' | 'volume' | 'piece' {
  if (unit in MASS) return 'masse';
  if (unit in VOLUME) return 'volume';
  return 'piece';
}

export interface ConversionInfo {
  unit: BaseUnit;
  /** Poids moyen d'une pièce en grammes, si connu. */
  gramsPerPiece?: number | null;
  /** Densité en g/ml, si connue. */
  densityGPerMl?: number | null;
}

/** Convertit une quantité vers l'unité de base de l'ingrédient, ou renvoie null si impossible sans approximation. */
export function convertToBase(quantity: number, unit: Unit, info: ConversionInfo): number | null {
  if (!Number.isFinite(quantity) || quantity < 0) return null;
  const dim = dimensionOf(unit);
  const grams = dim === 'masse' ? quantity * MASS[unit]! : null;
  const millilitres = dim === 'volume' ? quantity * VOLUME[unit]! : null;

  switch (info.unit) {
    case 'g':
      if (grams !== null) return grams;
      if (millilitres !== null && info.densityGPerMl) return millilitres * info.densityGPerMl;
      if (dim === 'piece' && info.gramsPerPiece) return quantity * info.gramsPerPiece;
      return null;
    case 'ml':
      if (millilitres !== null) return millilitres;
      if (grams !== null && info.densityGPerMl) return grams / info.densityGPerMl;
      return null;
    case 'piece':
      if (dim === 'piece') return quantity;
      if (grams !== null && info.gramsPerPiece) return grams / info.gramsPerPiece;
      return null;
  }
}

/** Masse en grammes d'une quantité exprimée dans l'unité de base (utile pour la nutrition). */
export function baseToGrams(quantity: number, info: ConversionInfo): number | null {
  switch (info.unit) {
    case 'g':
      return quantity;
    case 'ml':
      return quantity * (info.densityGPerMl ?? 1);
    case 'piece':
      return info.gramsPerPiece ? quantity * info.gramsPerPiece : null;
  }
}

/** Arrondi lisible pour l'affichage et les listes de courses. */
export function roundQuantity(quantity: number, unit: BaseUnit | Unit): number {
  if (unit === 'piece') return Math.ceil(quantity * 2 - 1e-9) / 2; // demi-pièces
  if (quantity >= 100) return Math.round(quantity / 5) * 5;
  if (quantity >= 10) return Math.round(quantity);
  return Math.round(quantity * 10) / 10;
}

export function formatQuantity(quantity: number, unit: BaseUnit | Unit): string {
  const q = roundQuantity(quantity, unit);
  if (unit === 'g' && q >= 1000) return `${formatNumber(q / 1000)} kg`;
  if (unit === 'ml' && q >= 1000) return `${formatNumber(q / 1000)} l`;
  return `${formatNumber(q)} ${UNIT_LABELS[unit as Unit] ?? unit}`;
}

function formatNumber(n: number): string {
  return (Math.round(n * 100) / 100).toString().replace('.', ',');
}
