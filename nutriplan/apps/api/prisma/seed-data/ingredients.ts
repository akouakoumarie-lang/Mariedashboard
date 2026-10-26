/**
 * Ingrédients du catalogue de DÉMONSTRATION.
 *
 * Prix : estimations indicatives de démonstration, en centimes, pour `qty` unités de base.
 *   Ce ne sont PAS des prix relevés en magasin. Ils sont modifiables (table Ingredient)
 *   et datés via `priceUpdatedAt`.
 * Nutrition : valeurs approximatives pour 100 g, ordre de grandeur cohérent avec la table
 *   Ciqual (ANSES). À remplacer par les valeurs exactes de Ciqual avant un usage réel.
 *
 * Format : [slug, nom, catégorie, unité, options]
 */
type Allergen =
  | 'gluten' | 'crustaces' | 'oeufs' | 'poissons' | 'arachides' | 'soja' | 'lait'
  | 'fruits_a_coque' | 'celeri' | 'moutarde' | 'sesame' | 'sulfites' | 'lupin' | 'mollusques';
type Flag = 'viande' | 'porc' | 'volaille' | 'poisson' | 'fruits_de_mer' | 'laitier' | 'lactose' | 'oeuf' | 'miel' | 'gelatine' | 'alcool';

export interface SeedIngredient {
  slug: string;
  name: string;
  category: 'fruits' | 'legumes' | 'feculents' | 'proteines' | 'produits_frais' | 'epicerie' | 'autres';
  unit: 'g' | 'ml' | 'piece';
  gpp?: number;
  density?: number;
  allergens?: Allergen[];
  mayContain?: Allergen[];
  flags?: Flag[];
  staple?: boolean;
  /** [kcal, protéines, glucides, lipides, fibres] pour 100 g */
  n?: [number, number, number, number, number];
  /** [prix en centimes, pour cette quantité d'unités de base, taille du conditionnement] */
  p?: [number, number, number?];
}

const DAIRY: Flag[] = ['laitier', 'lactose'];

export const INGREDIENTS: SeedIngredient[] = [
  // Féculents
  { slug: 'pates', name: 'Pâtes sèches', category: 'feculents', unit: 'g', allergens: ['gluten'], n: [355, 12.5, 70, 1.5, 3], p: [140, 1000, 500] },
  { slug: 'riz', name: 'Riz long', category: 'feculents', unit: 'g', n: [350, 7, 78, 0.6, 1.3], p: [200, 1000, 1000] },
  { slug: 'semoule', name: 'Semoule de blé moyenne', category: 'feculents', unit: 'g', allergens: ['gluten'], n: [360, 12, 73, 1.5, 3.5], p: [180, 1000, 1000] },
  { slug: 'quinoa', name: 'Quinoa', category: 'feculents', unit: 'g', n: [370, 14, 64, 6, 7], p: [900, 1000, 500] },
  { slug: 'flocons-avoine', name: "Flocons d'avoine", category: 'feculents', unit: 'g', allergens: ['gluten'], n: [370, 13, 60, 7, 10], p: [200, 1000, 500] },
  { slug: 'pain-complet', name: 'Pain complet', category: 'feculents', unit: 'g', allergens: ['gluten'], mayContain: ['sesame'], n: [245, 9, 44, 2.5, 7], p: [400, 1000, 500] },
  { slug: 'pommes-de-terre', name: 'Pommes de terre', category: 'feculents', unit: 'g', gpp: 150, n: [77, 2, 16, 0.1, 2], p: [150, 1000] },
  { slug: 'patate-douce', name: 'Patate douce', category: 'feculents', unit: 'g', gpp: 300, n: [86, 1.6, 20, 0.1, 3], p: [350, 1000] },
  { slug: 'lentilles-vertes', name: 'Lentilles vertes sèches', category: 'feculents', unit: 'g', n: [330, 24, 48, 1.5, 11], p: [300, 1000, 500] },
  { slug: 'lentilles-corail', name: 'Lentilles corail sèches', category: 'feculents', unit: 'g', n: [340, 24, 52, 1.5, 11], p: [400, 1000, 500] },
  { slug: 'pois-chiches', name: 'Pois chiches cuits (conserve)', category: 'feculents', unit: 'g', n: [120, 7, 16, 2.5, 5], p: [330, 1000, 400] },
  { slug: 'haricots-rouges', name: 'Haricots rouges cuits (conserve)', category: 'feculents', unit: 'g', n: [110, 8, 13, 0.5, 6], p: [300, 1000, 400] },
  { slug: 'tortillas', name: 'Galettes de blé (tortillas)', category: 'feculents', unit: 'piece', gpp: 40, allergens: ['gluten'], n: [300, 8, 50, 7, 3], p: [200, 8, 8] },
  { slug: 'farine', name: 'Farine de blé', category: 'feculents', unit: 'g', allergens: ['gluten'], staple: true, n: [350, 10, 73, 1, 3], p: [100, 1000, 1000] },
  { slug: 'pate-brisee', name: 'Pâte brisée (rouleau)', category: 'produits_frais', unit: 'piece', gpp: 230, allergens: ['gluten', 'lait'], flags: DAIRY, n: [420, 6, 45, 24, 2], p: [120, 1, 1] },

  // Légumes
  { slug: 'tomate', name: 'Tomate', category: 'legumes', unit: 'g', gpp: 120, n: [18, 0.8, 3, 0.2, 1.2], p: [300, 1000] },
  { slug: 'tomates-concassees', name: 'Tomates concassées (conserve)', category: 'epicerie', unit: 'g', n: [25, 1.2, 4, 0.2, 1.5], p: [225, 1000, 400] },
  { slug: 'oignon', name: 'Oignon', category: 'legumes', unit: 'g', gpp: 100, n: [40, 1.2, 7, 0.2, 1.8], p: [200, 1000] },
  { slug: 'ail', name: "Ail (gousse)", category: 'legumes', unit: 'piece', gpp: 5, staple: true, n: [130, 6, 25, 0.5, 2], p: [50, 10] },
  { slug: 'carotte', name: 'Carotte', category: 'legumes', unit: 'g', gpp: 100, n: [36, 0.8, 7, 0.3, 2.5], p: [150, 1000] },
  { slug: 'courgette', name: 'Courgette', category: 'legumes', unit: 'g', gpp: 250, n: [17, 1.2, 2, 0.3, 1.2], p: [250, 1000] },
  { slug: 'poivron', name: 'Poivron', category: 'legumes', unit: 'g', gpp: 160, n: [26, 1, 4.5, 0.3, 2], p: [400, 1000] },
  { slug: 'aubergine', name: 'Aubergine', category: 'legumes', unit: 'g', gpp: 300, n: [20, 1, 3, 0.2, 2.8], p: [350, 1000] },
  { slug: 'brocoli', name: 'Brocoli', category: 'legumes', unit: 'g', gpp: 400, n: [34, 3, 3, 0.4, 2.6], p: [350, 1000] },
  { slug: 'epinards', name: 'Épinards hachés surgelés', category: 'legumes', unit: 'g', n: [25, 2.6, 1, 0.4, 2.5], p: [300, 1000, 750] },
  { slug: 'champignons', name: 'Champignons de Paris', category: 'legumes', unit: 'g', n: [22, 3, 0.5, 0.3, 1.5], p: [500, 1000, 250] },
  { slug: 'salade', name: 'Laitue', category: 'legumes', unit: 'piece', gpp: 300, n: [15, 1.2, 2, 0.2, 1.3], p: [100, 1] },
  { slug: 'concombre', name: 'Concombre', category: 'legumes', unit: 'piece', gpp: 300, n: [12, 0.6, 2, 0.1, 0.7], p: [90, 1] },
  { slug: 'haricots-verts', name: 'Haricots verts surgelés', category: 'legumes', unit: 'g', n: [30, 2, 4, 0.2, 3], p: [300, 1000, 1000] },
  { slug: 'petits-pois', name: 'Petits pois surgelés', category: 'legumes', unit: 'g', n: [80, 5.5, 11, 0.5, 5], p: [300, 1000, 1000] },
  { slug: 'poireau', name: 'Poireau', category: 'legumes', unit: 'g', gpp: 200, n: [30, 1.5, 4.5, 0.3, 2.5], p: [250, 1000] },
  { slug: 'courge', name: 'Courge butternut', category: 'legumes', unit: 'g', gpp: 1000, n: [35, 1, 7, 0.1, 2], p: [250, 1000] },
  { slug: 'avocat', name: 'Avocat', category: 'legumes', unit: 'piece', gpp: 150, n: [200, 2, 1.5, 20, 6], p: [100, 1] },
  { slug: 'citron', name: 'Citron', category: 'fruits', unit: 'piece', gpp: 100, n: [30, 0.7, 3, 0.3, 2.5], p: [50, 1] },
  { slug: 'herbes', name: 'Herbes fraîches (bouquet)', category: 'legumes', unit: 'piece', gpp: 30, n: [40, 3, 4, 0.7, 3], p: [100, 1] },
  { slug: 'mais', name: 'Maïs doux (conserve)', category: 'epicerie', unit: 'g', n: [90, 3, 16, 1.5, 3], p: [400, 1000, 300] },

  // Fruits
  { slug: 'banane', name: 'Banane', category: 'fruits', unit: 'piece', gpp: 120, n: [90, 1.1, 20, 0.3, 2], p: [25, 1] },
  { slug: 'pomme', name: 'Pomme', category: 'fruits', unit: 'piece', gpp: 150, n: [53, 0.3, 11.5, 0.2, 2], p: [30, 1] },
  { slug: 'fruits-rouges', name: 'Fruits rouges surgelés', category: 'fruits', unit: 'g', n: [45, 1, 7, 0.3, 4.5], p: [800, 1000, 500] },
  { slug: 'orange', name: 'Orange', category: 'fruits', unit: 'piece', gpp: 200, n: [45, 0.9, 9, 0.2, 2], p: [35, 1] },

  // Protéines
  { slug: 'poulet', name: 'Filet de poulet', category: 'proteines', unit: 'g', flags: ['viande', 'volaille'], n: [120, 23, 0, 2.5, 0], p: [1200, 1000, 400] },
  { slug: 'dinde', name: 'Escalope de dinde', category: 'proteines', unit: 'g', flags: ['viande', 'volaille'], n: [110, 24, 0, 1.5, 0], p: [1300, 1000, 400] },
  { slug: 'boeuf-hache', name: 'Bœuf haché 5 % MG', category: 'proteines', unit: 'g', flags: ['viande'], n: [125, 21, 0, 5, 0], p: [1300, 1000, 400] },
  { slug: 'jambon', name: 'Jambon blanc', category: 'proteines', unit: 'g', flags: ['viande', 'porc'], n: [115, 20, 1, 3.5, 0], p: [1300, 1000, 160] },
  { slug: 'lardons', name: 'Lardons', category: 'proteines', unit: 'g', flags: ['viande', 'porc'], n: [270, 15, 1, 23, 0], p: [1000, 1000, 200] },
  { slug: 'saumon', name: 'Pavé de saumon', category: 'proteines', unit: 'g', allergens: ['poissons'], flags: ['poisson'], n: [200, 20, 0, 13, 0], p: [2400, 1000, 250] },
  { slug: 'colin', name: 'Filets de colin surgelés', category: 'proteines', unit: 'g', allergens: ['poissons'], flags: ['poisson'], n: [80, 17, 0, 1, 0], p: [1100, 1000, 400] },
  { slug: 'thon', name: 'Thon au naturel (conserve)', category: 'proteines', unit: 'g', allergens: ['poissons'], flags: ['poisson'], n: [115, 26, 0, 1, 0], p: [1500, 1000, 140] },
  { slug: 'crevettes', name: 'Crevettes cuites décortiquées', category: 'proteines', unit: 'g', allergens: ['crustaces'], flags: ['fruits_de_mer'], n: [100, 22, 0, 1.5, 0], p: [2000, 1000, 200] },
  { slug: 'tofu', name: 'Tofu ferme nature', category: 'proteines', unit: 'g', allergens: ['soja'], n: [120, 12, 2, 7, 1], p: [750, 1000, 400] },
  { slug: 'oeufs', name: 'Œufs', category: 'produits_frais', unit: 'piece', gpp: 55, allergens: ['oeufs'], flags: ['oeuf'], n: [140, 12.5, 0.5, 10, 0], p: [180, 6, 6] },

  // Produits frais
  { slug: 'lait', name: 'Lait demi-écrémé', category: 'produits_frais', unit: 'ml', density: 1.03, allergens: ['lait'], flags: DAIRY, n: [46, 3.2, 4.8, 1.6, 0], p: [100, 1000, 1000] },
  { slug: 'boisson-avoine', name: "Boisson végétale à l'avoine", category: 'produits_frais', unit: 'ml', density: 1.03, mayContain: ['gluten'], n: [45, 0.6, 7, 1.5, 0.8], p: [180, 1000, 1000] },
  { slug: 'yaourt', name: 'Yaourt nature', category: 'produits_frais', unit: 'piece', gpp: 125, allergens: ['lait'], flags: DAIRY, n: [60, 4.2, 5, 3, 0], p: [90, 4, 4] },
  { slug: 'fromage-blanc', name: 'Fromage blanc nature', category: 'produits_frais', unit: 'g', allergens: ['lait'], flags: DAIRY, n: [75, 7.5, 4, 3.2, 0], p: [250, 1000, 500] },
  { slug: 'emmental', name: 'Emmental râpé', category: 'produits_frais', unit: 'g', allergens: ['lait'], flags: DAIRY, n: [380, 28, 0, 29, 0], p: [1000, 1000, 200] },
  { slug: 'mozzarella', name: 'Mozzarella', category: 'produits_frais', unit: 'g', allergens: ['lait'], flags: DAIRY, n: [250, 18, 1, 19, 0], p: [720, 1000, 125] },
  { slug: 'feta', name: 'Feta', category: 'produits_frais', unit: 'g', allergens: ['lait'], flags: DAIRY, n: [265, 15, 1, 22, 0], p: [1200, 1000, 200] },
  { slug: 'beurre', name: 'Beurre doux', category: 'produits_frais', unit: 'g', allergens: ['lait'], flags: DAIRY, staple: true, n: [740, 0.7, 0.7, 82, 0], p: [900, 1000, 250] },
  { slug: 'creme', name: 'Crème fraîche légère 15 %', category: 'produits_frais', unit: 'g', allergens: ['lait'], flags: DAIRY, n: [160, 3, 4, 15, 0], p: [450, 1000, 200] },

  // Épicerie
  { slug: 'huile-olive', name: "Huile d'olive", category: 'epicerie', unit: 'ml', density: 0.92, staple: true, n: [900, 0, 0, 100, 0], p: [900, 1000, 1000] },
  { slug: 'curry', name: 'Curry en poudre', category: 'epicerie', unit: 'g', staple: true, mayContain: ['moutarde', 'celeri'], n: [325, 13, 25, 14, 33], p: [2000, 1000, 50] },
  { slug: 'cumin', name: 'Cumin moulu', category: 'epicerie', unit: 'g', staple: true, n: [375, 18, 44, 22, 10], p: [2500, 1000, 40] },
  { slug: 'bouillon', name: 'Bouillon de légumes (cube)', category: 'epicerie', unit: 'piece', gpp: 10, staple: true, allergens: ['celeri'], mayContain: ['gluten'], n: [250, 10, 30, 10, 0], p: [150, 10, 10] },
  { slug: 'sauce-soja', name: 'Sauce soja', category: 'epicerie', unit: 'ml', density: 1.1, staple: true, allergens: ['soja', 'gluten'], n: [60, 8, 6, 0, 0.8], p: [1000, 1000, 250] },
  { slug: 'moutarde', name: 'Moutarde de Dijon', category: 'epicerie', unit: 'g', staple: true, allergens: ['moutarde'], n: [150, 7, 5, 11, 3], p: [500, 1000, 200] },
  { slug: 'miel', name: 'Miel', category: 'epicerie', unit: 'g', density: 1.4, staple: true, flags: ['miel'], n: [320, 0.4, 80, 0, 0], p: [1000, 1000, 250] },
  { slug: 'lait-coco', name: 'Lait de coco (conserve)', category: 'epicerie', unit: 'ml', density: 1, n: [180, 1.6, 3, 18, 0], p: [600, 1000, 400] },
  { slug: 'vinaigre-balsamique', name: 'Vinaigre balsamique', category: 'epicerie', unit: 'ml', density: 1.05, staple: true, allergens: ['sulfites'], n: [100, 0.5, 17, 0, 0], p: [400, 1000, 250] },
  { slug: 'beurre-cacahuete', name: 'Beurre de cacahuète', category: 'epicerie', unit: 'g', allergens: ['arachides'], n: [600, 25, 15, 50, 6], p: [800, 1000, 350] },
  { slug: 'amandes', name: 'Amandes', category: 'epicerie', unit: 'g', allergens: ['fruits_a_coque'], n: [600, 21, 9, 52, 12], p: [1600, 1000, 200] },
  { slug: 'chocolat-noir', name: 'Chocolat noir 70 %', category: 'epicerie', unit: 'g', mayContain: ['lait', 'fruits_a_coque'], n: [550, 8, 32, 42, 10], p: [1100, 1000, 100] },
  { slug: 'pesto', name: 'Pesto au basilic', category: 'epicerie', unit: 'g', allergens: ['lait'], mayContain: ['fruits_a_coque'], flags: DAIRY, n: [450, 5, 6, 45, 2], p: [1500, 1000, 190] },
  { slug: 'cannelle', name: 'Cannelle moulue', category: 'epicerie', unit: 'g', staple: true, n: [250, 4, 55, 1, 50], p: [3000, 1000, 40] },
];
