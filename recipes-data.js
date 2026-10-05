// Recettes saines d'exemple (modifiables ou supprimables dans l'app).
// kcal = estimation approximative par portion.

export const RECIPE_CATEGORIES = {
  matin: '🥣 Petit-déj',
  midi: '🥗 Déjeuner',
  soir: '🍲 Dîner',
  snack: '🍎 Snack',
  dessert: '🍓 Dessert',
  boisson: '🥤 Boisson',
};

export const RECIPE_TAGS = ['🌱 Végé', '💪 Protéiné', '⚡ Rapide', '📦 Meal prep', '🌾 Sans gluten', '🥛 Sans lactose', '🔥 Léger'];

export const MEALS = { matin: 'Matin', midi: 'Midi', soir: 'Soir' };

export const SAMPLE_RECIPES = [
  {
    emoji: '🥣',
    title: 'Overnight oats aux fruits rouges',
    category: 'matin',
    tags: ['🌱 Végé', '⚡ Rapide', '📦 Meal prep'],
    time: 5,
    servings: 1,
    kcal: 380,
    ingredients: ['40 g de flocons d’avoine', '120 g de yaourt grec nature', '80 ml de lait (ou lait d’amande)', '1 c. à soupe de graines de chia', '80 g de fruits rouges', '1 c. à café de miel'],
    steps: ['Dans un bocal, mélange les flocons d’avoine, le yaourt, le lait et les graines de chia.', 'Ajoute le miel, remue bien, ferme le bocal.', 'Laisse une nuit au frigo.', 'Le matin, ajoute les fruits rouges et déguste.'],
  },
  {
    emoji: '🍣',
    title: 'Bowl saumon avocat',
    category: 'midi',
    tags: ['💪 Protéiné'],
    time: 25,
    servings: 2,
    kcal: 560,
    ingredients: ['150 g de riz complet', '2 pavés de saumon', '1 avocat', '1/2 concombre', '1 carotte', '2 c. à soupe de sauce soja', '1 c. à café d’huile de sésame', '1 c. à soupe de graines de sésame'],
    steps: ['Fais cuire le riz selon le paquet.', 'Pendant ce temps, saisis les pavés de saumon à la poêle, 4 minutes de chaque côté.', 'Coupe l’avocat, le concombre en dés et râpe la carotte.', 'Répartis le riz dans deux bols, ajoute les légumes et le saumon émietté.', 'Arrose de sauce soja et d’huile de sésame, parsème de graines.'],
  },
  {
    emoji: '🍛',
    title: 'Curry de pois chiches au lait de coco',
    category: 'soir',
    tags: ['🌱 Végé', '📦 Meal prep', '🥛 Sans lactose'],
    time: 30,
    servings: 4,
    kcal: 420,
    ingredients: ['2 boîtes de pois chiches (400 g)', '400 ml de lait de coco léger', '400 g de tomates concassées', '1 oignon', '2 gousses d’ail', '2 c. à soupe de pâte de curry', '150 g d’épinards frais', '1 citron vert'],
    steps: ['Émince l’oignon et l’ail, fais-les revenir 5 minutes dans un filet d’huile.', 'Ajoute la pâte de curry et remue 1 minute.', 'Verse les tomates, le lait de coco et les pois chiches égouttés. Laisse mijoter 15 minutes.', 'Ajoute les épinards et laisse-les fondre 2 minutes.', 'Termine avec le jus du citron vert. Sers avec du riz ou du pain naan.'],
  },
  {
    emoji: '🥗',
    title: 'Salade de quinoa, feta & menthe',
    category: 'midi',
    tags: ['🌱 Végé', '⚡ Rapide', '📦 Meal prep', '🌾 Sans gluten'],
    time: 15,
    servings: 2,
    kcal: 450,
    ingredients: ['120 g de quinoa', '1/2 concombre', '150 g de tomates cerises', '100 g de feta', '1 poignée de menthe fraîche', '2 c. à soupe d’huile d’olive', '1 citron'],
    steps: ['Rince le quinoa puis fais-le cuire 12 minutes dans l’eau bouillante. Égoutte et laisse refroidir.', 'Coupe le concombre en dés et les tomates cerises en deux.', 'Émiette la feta et cisèle la menthe.', 'Mélange le tout avec l’huile d’olive et le jus du citron. Sale, poivre.'],
  },
  {
    emoji: '🥤',
    title: 'Smoothie vert banane & beurre de cacahuète',
    category: 'boisson',
    tags: ['🌱 Végé', '⚡ Rapide', '🥛 Sans lactose'],
    time: 5,
    servings: 1,
    kcal: 320,
    ingredients: ['1 banane', '1 poignée d’épinards', '150 ml de lait d’amande', '1/2 pomme', '1 c. à soupe de beurre de cacahuète'],
    steps: ['Mets tous les ingrédients dans le blender.', 'Mixe jusqu’à ce que ce soit bien lisse.', 'Ajoute quelques glaçons si tu l’aimes bien frais.'],
  },
];
