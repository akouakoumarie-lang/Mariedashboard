/** Catalogue de DÉMONSTRATION partagé par l'API (seed) et la version web autonome. */
export { INGREDIENTS as DEMO_INGREDIENTS, type SeedIngredient } from './ingredients';
export { RECIPES as DEMO_RECIPES, type SeedRecipe } from './recipes';

export const DEMO_PRICE_SOURCE = 'Estimation indicative de démonstration — non relevée en magasin, à vérifier';
export const DEMO_NUTRITION_SOURCE = 'Valeurs approximatives (ordre de grandeur Ciqual/ANSES) — estimation';
export const DEMO_PRICE_DATE = '2026-10-26';

/** UUID v4 déterministe dérivé d'un texte (identifiants stables du catalogue hors base de données). */
export function stableUuid(text: string): string {
  let hex = '';
  for (let round = 0; hex.length < 32; round++) {
    let h = 0x811c9dc5 ^ round;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
    hex += h.toString(16).padStart(8, '0');
  }
  const c = hex.slice(0, 32).split('');
  c[12] = '4';
  c[16] = '89ab'[parseInt(c[16]!, 16) % 4]!;
  const s = c.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}
