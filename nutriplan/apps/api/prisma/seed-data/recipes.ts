/** Recettes du catalogue de DÉMONSTRATION (isDemo = true), cuisine du quotidien en France. */
type Unit = 'g' | 'kg' | 'ml' | 'cl' | 'l' | 'cs' | 'cc' | 'piece';
type Slot = 'petit_dejeuner' | 'repas' | 'collation';
type Equipment = 'plaques' | 'four' | 'micro_ondes' | 'mixeur' | 'air_fryer' | 'cuiseur_vapeur';

export interface SeedRecipe {
  slug: string;
  name: string;
  description: string;
  category: 'petit_dejeuner' | 'entree' | 'plat' | 'salade' | 'soupe' | 'dessert' | 'collation';
  slots: Slot[];
  prep: number;
  cook: number;
  servings: number;
  equipment: Equipment[];
  tags: string[];
  ing: Array<[string, number, Unit]>;
  steps: string[];
}

export const RECIPES: SeedRecipe[] = [
  // ── Petits-déjeuners ──────────────────────────────────────────────────────
  {
    slug: 'porridge-fruits-rouges', name: 'Porridge aux fruits rouges', category: 'petit_dejeuner', slots: ['petit_dejeuner'],
    description: "Un bol chaud et rassasiant, prêt en 7 minutes.", prep: 2, cook: 5, servings: 2, equipment: ['plaques'], tags: ['rapide', 'végétarien'],
    ing: [['flocons-avoine', 100, 'g'], ['lait', 500, 'ml'], ['fruits-rouges', 150, 'g'], ['miel', 2, 'cc']],
    steps: ["Versez les flocons d'avoine et le lait dans une casserole.", 'Faites cuire 5 minutes à feu doux en remuant.', 'Répartissez dans deux bols, ajoutez les fruits rouges et le miel.'],
  },
  {
    slug: 'tartines-avocat-oeuf', name: 'Tartines avocat et œuf au plat', category: 'petit_dejeuner', slots: ['petit_dejeuner'],
    description: 'Des tartines croustillantes, crémeuses et riches en protéines.', prep: 5, cook: 5, servings: 2, equipment: ['plaques'], tags: ['végétarien', 'protéiné'],
    ing: [['pain-complet', 120, 'g'], ['avocat', 1, 'piece'], ['oeufs', 2, 'piece'], ['citron', 0.5, 'piece'], ['huile-olive', 1, 'cc']],
    steps: ['Faites griller les tranches de pain.', "Écrasez l'avocat avec le jus de citron, salez et poivrez.", 'Faites cuire les œufs au plat dans un filet d’huile.', "Tartinez l'avocat sur le pain et déposez un œuf sur chaque tartine."],
  },
  {
    slug: 'fromage-blanc-pomme-amandes', name: 'Fromage blanc, pomme et amandes', category: 'petit_dejeuner', slots: ['petit_dejeuner', 'collation'],
    description: 'Frais, croquant et sans cuisson.', prep: 5, cook: 0, servings: 2, equipment: [], tags: ['sans cuisson', 'végétarien'],
    ing: [['fromage-blanc', 300, 'g'], ['pomme', 1, 'piece'], ['amandes', 30, 'g'], ['miel', 2, 'cc']],
    steps: ['Coupez la pomme en petits dés.', 'Répartissez le fromage blanc dans deux bols.', 'Ajoutez la pomme, les amandes concassées et le miel.'],
  },
  {
    slug: 'overnight-oats-banane', name: 'Overnight oats banane et cacahuète', category: 'petit_dejeuner', slots: ['petit_dejeuner'],
    description: 'À préparer la veille : le petit-déjeuner est prêt au réveil.', prep: 5, cook: 0, servings: 2, equipment: [], tags: ['végan', 'meal prep', 'sans cuisson'],
    ing: [['flocons-avoine', 100, 'g'], ['boisson-avoine', 300, 'ml'], ['banane', 1, 'piece'], ['beurre-cacahuete', 30, 'g']],
    steps: ['Mélangez les flocons et la boisson végétale dans deux bocaux.', 'Couvrez et placez au réfrigérateur pour la nuit.', 'Le matin, ajoutez la banane en rondelles et le beurre de cacahuète.'],
  },
  {
    slug: 'smoothie-banane-fruits-rouges', name: 'Smoothie banane et fruits rouges', category: 'petit_dejeuner', slots: ['petit_dejeuner', 'collation'],
    description: 'Onctueux et fruité, prêt en 3 minutes.', prep: 3, cook: 0, servings: 2, equipment: ['mixeur'], tags: ['rapide', 'végétarien'],
    ing: [['banane', 2, 'piece'], ['fruits-rouges', 150, 'g'], ['yaourt', 2, 'piece'], ['lait', 100, 'ml']],
    steps: ['Placez tous les ingrédients dans le blender.', "Mixez jusqu'à obtenir une texture lisse.", 'Servez aussitôt.'],
  },
  {
    slug: 'tartines-cacahuete-banane', name: 'Tartines cacahuète et banane', category: 'petit_dejeuner', slots: ['petit_dejeuner'],
    description: 'Un classique économique et gourmand.', prep: 5, cook: 0, servings: 2, equipment: [], tags: ['économique', 'végan'],
    ing: [['pain-complet', 120, 'g'], ['beurre-cacahuete', 40, 'g'], ['banane', 1, 'piece']],
    steps: ['Tartinez le pain de beurre de cacahuète.', 'Ajoutez la banane coupée en rondelles.'],
  },
  {
    slug: 'omelette-epinards', name: 'Omelette aux épinards', category: 'plat', slots: ['petit_dejeuner', 'repas'],
    description: 'Une omelette moelleuse, riche en protéines et en légumes.', prep: 5, cook: 10, servings: 2, equipment: ['plaques'], tags: ['rapide', 'végétarien', 'protéiné'],
    ing: [['oeufs', 4, 'piece'], ['epinards', 150, 'g'], ['emmental', 30, 'g'], ['huile-olive', 1, 'cc']],
    steps: ['Faites revenir les épinards 3 minutes dans la poêle huilée.', 'Battez les œufs, salez, poivrez.', 'Versez les œufs sur les épinards, parsemez d’emmental.', 'Laissez cuire 5 minutes à feu moyen et pliez l’omelette.'],
  },

  // ── Collations et desserts ───────────────────────────────────────────────
  {
    slug: 'pomme-amandes', name: 'Pomme et poignée d’amandes', category: 'collation', slots: ['collation'],
    description: 'La collation simple qui tient au corps.', prep: 1, cook: 0, servings: 1, equipment: [], tags: ['sans cuisson', 'végan'],
    ing: [['pomme', 1, 'piece'], ['amandes', 20, 'g']],
    steps: ['Lavez la pomme et servez-la avec les amandes.'],
  },
  {
    slug: 'houmous-carottes', name: 'Houmous maison et bâtonnets de carottes', category: 'collation', slots: ['collation'],
    description: 'Un houmous crémeux à partager.', prep: 10, cook: 0, servings: 4, equipment: ['mixeur'], tags: ['végan', 'meal prep'],
    ing: [['pois-chiches', 400, 'g'], ['citron', 1, 'piece'], ['huile-olive', 2, 'cs'], ['cumin', 2, 'g'], ['ail', 1, 'piece'], ['carotte', 300, 'g']],
    steps: ['Égouttez et rincez les pois chiches.', "Mixez-les avec le jus de citron, l'huile, l'ail et le cumin ; ajoutez un peu d'eau si besoin.", 'Coupez les carottes en bâtonnets et servez avec le houmous.'],
  },
  {
    slug: 'yaourt-fruits-rouges', name: 'Yaourt aux fruits rouges', category: 'dessert', slots: ['collation'],
    description: 'Un dessert frais en 2 minutes.', prep: 2, cook: 0, servings: 2, equipment: [], tags: ['rapide', 'végétarien'],
    ing: [['yaourt', 2, 'piece'], ['fruits-rouges', 100, 'g'], ['miel', 1, 'cc']],
    steps: ['Décongelez les fruits rouges quelques minutes.', 'Versez-les sur les yaourts et ajoutez le miel.'],
  },
  {
    slug: 'banane-chocolat', name: 'Banane et carrés de chocolat noir', category: 'collation', slots: ['collation'],
    description: 'Le goûter réconfortant.', prep: 1, cook: 0, servings: 2, equipment: [], tags: ['sans cuisson', 'végan'],
    ing: [['banane', 2, 'piece'], ['chocolat-noir', 20, 'g']],
    steps: ['Servez chaque banane avec deux carrés de chocolat.'],
  },
  {
    slug: 'energy-balls', name: 'Energy balls avoine et cacahuète', category: 'collation', slots: ['collation'],
    description: 'Des bouchées à préparer pour la semaine.', prep: 15, cook: 0, servings: 6, equipment: [], tags: ['meal prep', 'végétarien'],
    ing: [['flocons-avoine', 120, 'g'], ['beurre-cacahuete', 80, 'g'], ['miel', 40, 'g'], ['chocolat-noir', 40, 'g']],
    steps: ['Hachez grossièrement le chocolat.', 'Mélangez tous les ingrédients dans un saladier.', 'Formez 12 boules et réservez au frais au moins 30 minutes.'],
  },
  {
    slug: 'compote-pommes', name: 'Compote pomme-cannelle maison', category: 'dessert', slots: ['collation'],
    description: 'Sans sucre ajouté, parfaite pour utiliser des pommes un peu abîmées.', prep: 10, cook: 20, servings: 4, equipment: ['plaques'], tags: ['végan', 'anti-gaspi'],
    ing: [['pomme', 6, 'piece'], ['cannelle', 3, 'g']],
    steps: ['Épluchez et coupez les pommes en morceaux.', "Faites-les cuire 20 minutes à feu doux avec un fond d'eau et la cannelle.", 'Écrasez à la fourchette et laissez refroidir.'],
  },

  // ── Plats ────────────────────────────────────────────────────────────────
  {
    slug: 'pates-sauce-tomate', name: 'Pâtes à la sauce tomate maison', category: 'plat', slots: ['repas'],
    description: 'Le plat économique par excellence, avec une vraie sauce maison.', prep: 10, cook: 20, servings: 4, equipment: ['plaques'], tags: ['économique', 'végan'],
    ing: [['pates', 400, 'g'], ['tomates-concassees', 400, 'g'], ['oignon', 1, 'piece'], ['ail', 2, 'piece'], ['huile-olive', 1, 'cs'], ['herbes', 0.5, 'piece']],
    steps: ["Émincez l'oignon et l'ail, faites-les revenir dans l'huile.", 'Ajoutez les tomates concassées et laissez mijoter 15 minutes.', 'Faites cuire les pâtes selon le paquet.', 'Mélangez les pâtes à la sauce et parsemez d’herbes ciselées.'],
  },
  {
    slug: 'poulet-curry-coco', name: 'Poulet au curry et lait de coco', category: 'plat', slots: ['repas'],
    description: 'Un curry doux et parfumé, servi avec du riz.', prep: 10, cook: 25, servings: 4, equipment: ['plaques'], tags: ['protéiné', 'sans lactose'],
    ing: [['poulet', 500, 'g'], ['lait-coco', 400, 'ml'], ['curry', 10, 'g'], ['oignon', 1, 'piece'], ['riz', 300, 'g']],
    steps: ['Coupez le poulet en morceaux et émincez l’oignon.', 'Faites dorer le poulet et l’oignon, ajoutez le curry.', 'Versez le lait de coco et laissez mijoter 15 minutes.', 'Servez avec le riz cuit.'],
  },
  {
    slug: 'dahl-lentilles-corail', name: 'Dahl de lentilles corail', category: 'plat', slots: ['repas'],
    description: 'Un plat indien réconfortant, végan et très économique.', prep: 10, cook: 25, servings: 4, equipment: ['plaques'], tags: ['végan', 'économique', 'meal prep'],
    ing: [['lentilles-corail', 250, 'g'], ['lait-coco', 200, 'ml'], ['tomates-concassees', 400, 'g'], ['oignon', 1, 'piece'], ['ail', 2, 'piece'], ['curry', 8, 'g'], ['riz', 250, 'g']],
    steps: ["Faites revenir l'oignon et l'ail émincés avec le curry.", 'Ajoutez les lentilles rincées, les tomates, le lait de coco et 40 cl d’eau.', 'Laissez cuire 20 minutes en remuant.', 'Servez avec le riz.'],
  },
  {
    slug: 'chili-sin-carne', name: 'Chili sin carne', category: 'plat', slots: ['repas'],
    description: 'Un chili végétal généreux, encore meilleur le lendemain.', prep: 15, cook: 25, servings: 4, equipment: ['plaques'], tags: ['végan', 'meal prep'],
    ing: [['haricots-rouges', 800, 'g'], ['mais', 300, 'g'], ['tomates-concassees', 400, 'g'], ['oignon', 1, 'piece'], ['poivron', 1, 'piece'], ['cumin', 5, 'g'], ['riz', 300, 'g'], ['huile-olive', 1, 'cs']],
    steps: ["Faites revenir l'oignon et le poivron coupés dans l'huile.", 'Ajoutez le cumin, les tomates, les haricots et le maïs égouttés.', 'Laissez mijoter 20 minutes.', 'Servez avec le riz.'],
  },
  {
    slug: 'chili-con-carne', name: 'Chili con carne', category: 'plat', slots: ['repas'],
    description: 'Le classique tex-mex, généreux et convivial.', prep: 15, cook: 30, servings: 4, equipment: ['plaques'], tags: ['protéiné'],
    ing: [['boeuf-hache', 400, 'g'], ['haricots-rouges', 400, 'g'], ['tomates-concassees', 400, 'g'], ['oignon', 1, 'piece'], ['poivron', 1, 'piece'], ['cumin', 5, 'g'], ['riz', 300, 'g']],
    steps: ["Faites revenir l'oignon et le poivron, puis la viande hachée.", 'Ajoutez le cumin, les tomates et les haricots égouttés.', 'Laissez mijoter 25 minutes.', 'Servez avec le riz.'],
  },
  {
    slug: 'saumon-haricots-verts', name: 'Saumon rôti, haricots verts et pommes de terre', category: 'plat', slots: ['repas'],
    description: 'Un plat complet au four, riche en oméga-3.', prep: 10, cook: 25, servings: 4, equipment: ['four', 'plaques'], tags: ['protéiné', 'sans gluten'],
    ing: [['saumon', 500, 'g'], ['haricots-verts', 600, 'g'], ['pommes-de-terre', 800, 'g'], ['citron', 1, 'piece'], ['huile-olive', 1, 'cs']],
    steps: ['Préchauffez le four à 200 °C.', "Coupez les pommes de terre en quartiers et enfournez-les 25 minutes avec l'huile.", 'Ajoutez le saumon arrosé de citron pour les 12 dernières minutes.', 'Faites cuire les haricots verts à l’eau bouillante 10 minutes.'],
  },
  {
    slug: 'colin-papillote', name: 'Colin en papillote, courgettes et riz', category: 'plat', slots: ['repas'],
    description: 'Léger, rapide et sans matière grasse ajoutée ou presque.', prep: 10, cook: 20, servings: 4, equipment: ['four', 'plaques'], tags: ['léger', 'sans gluten'],
    ing: [['colin', 500, 'g'], ['courgette', 2, 'piece'], ['citron', 1, 'piece'], ['riz', 250, 'g'], ['huile-olive', 1, 'cs']],
    steps: ['Préchauffez le four à 180 °C.', 'Déposez le poisson et les courgettes en rondelles sur du papier cuisson, arrosez de citron et d’huile.', 'Fermez les papillotes et enfournez 20 minutes.', 'Servez avec le riz cuit.'],
  },
  {
    slug: 'quiche-lorraine', name: 'Quiche lorraine', category: 'plat', slots: ['repas'],
    description: 'La recette familiale, avec une salade verte.', prep: 15, cook: 35, servings: 6, equipment: ['four'], tags: ['familial'],
    ing: [['pate-brisee', 1, 'piece'], ['lardons', 200, 'g'], ['oeufs', 3, 'piece'], ['creme', 200, 'g'], ['lait', 100, 'ml'], ['emmental', 50, 'g'], ['salade', 1, 'piece']],
    steps: ['Préchauffez le four à 180 °C et étalez la pâte dans un moule.', 'Faites dorer les lardons à sec.', "Battez les œufs avec la crème et le lait, ajoutez les lardons et l'emmental.", 'Versez sur la pâte et enfournez 35 minutes. Servez avec la salade.'],
  },
  {
    slug: 'quiche-epinards-feta', name: 'Quiche épinards et feta', category: 'plat', slots: ['repas'],
    description: 'Une quiche végétarienne fondante.', prep: 15, cook: 35, servings: 6, equipment: ['four'], tags: ['végétarien'],
    ing: [['pate-brisee', 1, 'piece'], ['epinards', 300, 'g'], ['feta', 150, 'g'], ['oeufs', 3, 'piece'], ['creme', 200, 'g']],
    steps: ['Préchauffez le four à 180 °C et étalez la pâte.', 'Décongelez et égouttez les épinards.', 'Battez les œufs et la crème, ajoutez les épinards et la feta émiettée.', 'Versez sur la pâte et enfournez 35 minutes.'],
  },
  {
    slug: 'gratin-brocoli', name: 'Gratin de brocoli et pommes de terre', category: 'plat', slots: ['repas'],
    description: 'Un gratin doré à la béchamel légère.', prep: 20, cook: 30, servings: 4, equipment: ['four', 'plaques'], tags: ['végétarien', 'familial'],
    ing: [['brocoli', 1, 'piece'], ['pommes-de-terre', 600, 'g'], ['lait', 400, 'ml'], ['emmental', 80, 'g'], ['beurre', 20, 'g'], ['farine', 20, 'g']],
    steps: ['Faites cuire les pommes de terre en rondelles et le brocoli 10 minutes à l’eau.', 'Préparez la béchamel : beurre fondu, farine, puis lait en fouettant.', "Disposez les légumes dans un plat, nappez de béchamel et d'emmental.", 'Enfournez 20 minutes à 200 °C.'],
  },
  {
    slug: 'salade-quinoa-feta', name: 'Salade de quinoa, pois chiches et feta', category: 'salade', slots: ['repas'],
    description: 'Une salade complète, idéale en lunch box.', prep: 15, cook: 12, servings: 4, equipment: ['plaques'], tags: ['végétarien', 'meal prep'],
    ing: [['quinoa', 200, 'g'], ['pois-chiches', 400, 'g'], ['concombre', 1, 'piece'], ['tomate', 2, 'piece'], ['feta', 100, 'g'], ['citron', 1, 'piece'], ['huile-olive', 2, 'cs']],
    steps: ['Faites cuire le quinoa 12 minutes et laissez refroidir.', 'Coupez le concombre et les tomates en dés.', 'Mélangez avec les pois chiches égouttés et la feta.', "Assaisonnez avec le citron et l'huile."],
  },
  {
    slug: 'salade-nicoise', name: 'Salade façon niçoise', category: 'salade', slots: ['repas'],
    description: 'Thon, œufs, légumes : une salade fraîche et complète.', prep: 20, cook: 15, servings: 4, equipment: ['plaques'], tags: ['protéiné', 'sans gluten'],
    ing: [['thon', 280, 'g'], ['oeufs', 4, 'piece'], ['pommes-de-terre', 400, 'g'], ['haricots-verts', 300, 'g'], ['tomate', 2, 'piece'], ['salade', 1, 'piece'], ['huile-olive', 2, 'cs'], ['vinaigre-balsamique', 1, 'cs']],
    steps: ['Faites cuire les pommes de terre et les haricots verts, puis les œufs 9 minutes.', 'Coupez les tomates et les œufs en quartiers.', 'Disposez la salade, les légumes, le thon et les œufs.', "Arrosez d'huile et de vinaigre."],
  },
  {
    slug: 'wraps-poulet', name: 'Wraps au poulet et crudités', category: 'plat', slots: ['repas'],
    description: 'Des wraps frais et faciles à emporter.', prep: 15, cook: 10, servings: 4, equipment: ['plaques'], tags: ['rapide', 'protéiné'],
    ing: [['tortillas', 8, 'piece'], ['poulet', 400, 'g'], ['salade', 0.5, 'piece'], ['tomate', 2, 'piece'], ['fromage-blanc', 150, 'g'], ['citron', 0.5, 'piece']],
    steps: ['Faites cuire le poulet en lamelles 8 minutes.', 'Mélangez le fromage blanc avec le citron, salez, poivrez.', 'Garnissez les galettes de sauce, salade, tomate et poulet.', 'Roulez et coupez en deux.'],
  },
  {
    slug: 'soupe-poireaux', name: 'Soupe poireaux, carottes et pommes de terre', category: 'soupe', slots: ['repas'],
    description: 'La soupe de légumes de saison, douce et économique.', prep: 15, cook: 25, servings: 4, equipment: ['plaques'], tags: ['végan', 'économique', 'de saison'],
    ing: [['poireau', 400, 'g'], ['pommes-de-terre', 400, 'g'], ['carotte', 300, 'g'], ['bouillon', 1, 'piece'], ['pain-complet', 160, 'g']],
    steps: ['Lavez et coupez les légumes.', "Couvrez d'eau (1,2 l), ajoutez le bouillon et faites cuire 25 minutes.", 'Écrasez ou mixez selon vos goûts. Servez avec le pain.'],
  },
  {
    slug: 'veloute-potiron', name: 'Velouté de butternut', category: 'soupe', slots: ['repas'],
    description: 'Un velouté doux et onctueux pour les soirs d’automne.', prep: 15, cook: 25, servings: 4, equipment: ['plaques', 'mixeur'], tags: ['végétarien', 'de saison'],
    ing: [['courge', 1000, 'g'], ['oignon', 1, 'piece'], ['pommes-de-terre', 200, 'g'], ['bouillon', 1, 'piece'], ['creme', 100, 'g'], ['pain-complet', 160, 'g']],
    steps: ['Épluchez et coupez la courge, la pomme de terre et l’oignon.', "Couvrez d'eau avec le bouillon et faites cuire 25 minutes.", 'Mixez avec la crème. Servez avec le pain.'],
  },
  {
    slug: 'dinde-sautee-legumes', name: 'Sauté de dinde aux légumes et riz', category: 'plat', slots: ['repas'],
    description: 'Un wok express, sucré-salé.', prep: 15, cook: 15, servings: 4, equipment: ['plaques'], tags: ['rapide', 'protéiné'],
    ing: [['dinde', 400, 'g'], ['poivron', 1, 'piece'], ['courgette', 1, 'piece'], ['riz', 250, 'g'], ['sauce-soja', 3, 'cs'], ['ail', 1, 'piece'], ['huile-olive', 1, 'cs']],
    steps: ['Faites cuire le riz.', 'Coupez la dinde et les légumes en lanières.', 'Saisissez la dinde dans l’huile, ajoutez les légumes et l’ail.', 'Déglacez à la sauce soja et servez avec le riz.'],
  },
  {
    slug: 'tofu-brocoli-soja', name: 'Tofu sauté au brocoli et sauce soja', category: 'plat', slots: ['repas'],
    description: 'Un plat végan riche en protéines.', prep: 10, cook: 15, servings: 4, equipment: ['plaques'], tags: ['végan', 'protéiné'],
    ing: [['tofu', 400, 'g'], ['brocoli', 400, 'g'], ['riz', 250, 'g'], ['sauce-soja', 3, 'cs'], ['ail', 2, 'piece'], ['huile-olive', 1, 'cs']],
    steps: ['Faites cuire le riz.', 'Coupez le tofu en dés et faites-le dorer dans l’huile.', "Ajoutez le brocoli en fleurettes, l'ail et un fond d'eau ; couvrez 6 minutes.", 'Ajoutez la sauce soja et servez avec le riz.'],
  },
  {
    slug: 'pates-pesto-petits-pois', name: 'Pâtes au pesto et petits pois', category: 'plat', slots: ['repas'],
    description: 'Un plat prêt en 15 minutes.', prep: 5, cook: 12, servings: 4, equipment: ['plaques'], tags: ['rapide', 'végétarien'],
    ing: [['pates', 400, 'g'], ['pesto', 120, 'g'], ['petits-pois', 300, 'g']],
    steps: ['Faites cuire les pâtes, ajoutez les petits pois 4 minutes avant la fin.', 'Égouttez en gardant un peu d’eau de cuisson.', 'Mélangez avec le pesto et un filet d’eau de cuisson.'],
  },
  {
    slug: 'hachis-parmentier', name: 'Hachis parmentier', category: 'plat', slots: ['repas'],
    description: 'Le plat réconfortant de la cuisine française.', prep: 25, cook: 45, servings: 4, equipment: ['four', 'plaques'], tags: ['familial'],
    ing: [['boeuf-hache', 400, 'g'], ['pommes-de-terre', 1000, 'g'], ['lait', 200, 'ml'], ['beurre', 30, 'g'], ['oignon', 1, 'piece'], ['emmental', 60, 'g']],
    steps: ['Faites cuire les pommes de terre 20 minutes et écrasez-les avec le lait et le beurre.', "Faites revenir l'oignon et la viande.", 'Dans un plat, alternez viande et purée, parsemez d’emmental.', 'Enfournez 25 minutes à 200 °C.'],
  },
  {
    slug: 'ratatouille-semoule', name: 'Ratatouille et semoule', category: 'plat', slots: ['repas'],
    description: 'Les légumes du soleil mijotés, avec une semoule légère.', prep: 20, cook: 40, servings: 4, equipment: ['plaques'], tags: ['végan', 'meal prep'],
    ing: [['courgette', 2, 'piece'], ['aubergine', 1, 'piece'], ['poivron', 1, 'piece'], ['tomates-concassees', 400, 'g'], ['oignon', 1, 'piece'], ['ail', 2, 'piece'], ['huile-olive', 2, 'cs'], ['semoule', 250, 'g']],
    steps: ['Coupez tous les légumes en dés.', "Faites revenir l'oignon et l'ail dans l'huile, ajoutez les légumes.", 'Ajoutez les tomates et laissez mijoter 35 minutes.', 'Préparez la semoule selon le paquet.'],
  },
  {
    slug: 'shakshuka', name: 'Shakshuka', category: 'plat', slots: ['repas', 'petit_dejeuner'],
    description: 'Œufs pochés dans une sauce tomate épicée.', prep: 10, cook: 20, servings: 4, equipment: ['plaques'], tags: ['végétarien', 'économique'],
    ing: [['oeufs', 6, 'piece'], ['tomates-concassees', 800, 'g'], ['poivron', 1, 'piece'], ['oignon', 1, 'piece'], ['cumin', 3, 'g'], ['pain-complet', 200, 'g'], ['huile-olive', 1, 'cs']],
    steps: ["Faites revenir l'oignon et le poivron émincés dans l'huile.", 'Ajoutez les tomates et le cumin, laissez réduire 10 minutes.', 'Creusez des puits et cassez-y les œufs ; couvrez 6 à 8 minutes.', 'Servez avec le pain.'],
  },
  {
    slug: 'salade-lentilles', name: 'Salade tiède de lentilles et œuf mollet', category: 'salade', slots: ['repas'],
    description: 'Une salade de bistrot, économique et rassasiante.', prep: 10, cook: 25, servings: 4, equipment: ['plaques'], tags: ['végétarien', 'économique'],
    ing: [['lentilles-vertes', 300, 'g'], ['carotte', 200, 'g'], ['oignon', 1, 'piece'], ['moutarde', 15, 'g'], ['huile-olive', 3, 'cs'], ['vinaigre-balsamique', 1, 'cs'], ['oeufs', 4, 'piece']],
    steps: ['Faites cuire les lentilles 25 minutes avec la carotte en dés.', 'Faites cuire les œufs 6 minutes et écalez-les.', "Préparez une vinaigrette moutarde, huile, vinaigre et oignon ciselé.", 'Mélangez les lentilles tièdes à la vinaigrette et servez avec les œufs.'],
  },
  {
    slug: 'patates-douces-pois-chiches', name: 'Patates douces rôties et pois chiches', category: 'plat', slots: ['repas'],
    description: 'Un plat au four coloré avec une sauce au fromage blanc.', prep: 15, cook: 35, servings: 4, equipment: ['four'], tags: ['végétarien', 'sans gluten'],
    ing: [['patate-douce', 800, 'g'], ['pois-chiches', 400, 'g'], ['cumin', 5, 'g'], ['huile-olive', 2, 'cs'], ['fromage-blanc', 200, 'g'], ['citron', 1, 'piece']],
    steps: ['Préchauffez le four à 200 °C.', "Coupez les patates douces en cubes, mélangez avec les pois chiches, l'huile et le cumin.", 'Enfournez 35 minutes.', 'Servez avec le fromage blanc citronné.'],
  },
  {
    slug: 'crevettes-ail-riz', name: 'Crevettes sautées à l’ail, courgettes et riz', category: 'plat', slots: ['repas'],
    description: 'Un plat rapide aux saveurs méditerranéennes.', prep: 10, cook: 15, servings: 4, equipment: ['plaques'], tags: ['rapide', 'sans gluten'],
    ing: [['crevettes', 300, 'g'], ['courgette', 2, 'piece'], ['riz', 250, 'g'], ['ail', 2, 'piece'], ['citron', 1, 'piece'], ['huile-olive', 1, 'cs']],
    steps: ['Faites cuire le riz.', "Faites sauter les courgettes en dés dans l'huile 8 minutes.", "Ajoutez l'ail et les crevettes 3 minutes.", 'Arrosez de citron et servez avec le riz.'],
  },
  {
    slug: 'pates-jambon-champignons', name: 'Pâtes crémeuses jambon et champignons', category: 'plat', slots: ['repas'],
    description: 'Un plat familial prêt en 20 minutes.', prep: 10, cook: 15, servings: 4, equipment: ['plaques'], tags: ['familial', 'rapide'],
    ing: [['pates', 400, 'g'], ['jambon', 160, 'g'], ['champignons', 250, 'g'], ['creme', 200, 'g'], ['oignon', 1, 'piece']],
    steps: ['Faites cuire les pâtes.', "Faites revenir l'oignon et les champignons émincés.", 'Ajoutez le jambon en lanières et la crème.', 'Mélangez avec les pâtes.'],
  },
  {
    slug: 'dinde-frites-patate-douce', name: 'Dinde et frites de patate douce au air fryer', category: 'plat', slots: ['repas'],
    description: 'Des frites croustillantes avec très peu d’huile.', prep: 10, cook: 20, servings: 4, equipment: ['air_fryer', 'plaques'], tags: ['protéiné', 'sans gluten'],
    ing: [['dinde', 400, 'g'], ['patate-douce', 600, 'g'], ['huile-olive', 1, 'cs'], ['cumin', 2, 'g'], ['salade', 0.5, 'piece']],
    steps: ["Coupez les patates douces en frites, mélangez avec l'huile et le cumin.", 'Faites-les cuire 18 minutes à 200 °C au air fryer en secouant à mi-cuisson.', 'Faites cuire les escalopes à la poêle 4 minutes de chaque côté.', 'Servez avec la salade.'],
  },
  {
    slug: 'patate-douce-farcie', name: 'Patate douce farcie au micro-ondes', category: 'plat', slots: ['repas'],
    description: 'Un repas complet sans four ni plaques.', prep: 5, cook: 12, servings: 2, equipment: ['micro_ondes'], tags: ['végétarien', 'rapide'],
    ing: [['patate-douce', 600, 'g'], ['haricots-rouges', 200, 'g'], ['mais', 150, 'g'], ['fromage-blanc', 100, 'g'], ['cumin', 2, 'g']],
    steps: ['Piquez les patates douces et faites-les cuire 10 à 12 minutes au micro-ondes.', 'Réchauffez les haricots et le maïs avec le cumin 1 minute.', 'Ouvrez les patates, garnissez et ajoutez le fromage blanc.'],
  },
  {
    slug: 'poulet-roti-legumes', name: 'Poulet rôti aux carottes et pommes de terre', category: 'plat', slots: ['repas'],
    description: 'Une plaque au four simple pour toute la famille.', prep: 15, cook: 40, servings: 4, equipment: ['four'], tags: ['familial', 'sans gluten'],
    ing: [['poulet', 600, 'g'], ['carotte', 400, 'g'], ['pommes-de-terre', 800, 'g'], ['oignon', 1, 'piece'], ['huile-olive', 2, 'cs'], ['herbes', 0.5, 'piece']],
    steps: ['Préchauffez le four à 200 °C.', "Coupez légumes et poulet, mélangez avec l'huile et les herbes.", 'Étalez sur la plaque et enfournez 40 minutes en remuant à mi-cuisson.'],
  },
  {
    slug: 'mozzarella-tomate-pain', name: 'Assiette tomate-mozzarella et pain complet', category: 'salade', slots: ['repas'],
    description: 'Sans cuisson, prête en 5 minutes.', prep: 5, cook: 0, servings: 2, equipment: [], tags: ['sans cuisson', 'végétarien', 'rapide'],
    ing: [['tomate', 3, 'piece'], ['mozzarella', 125, 'g'], ['huile-olive', 1, 'cs'], ['herbes', 0.5, 'piece'], ['pain-complet', 120, 'g']],
    steps: ['Coupez les tomates et la mozzarella en tranches.', "Alternez-les dans l'assiette, arrosez d'huile et parsemez d'herbes.", 'Servez avec le pain.'],
  },
  {
    slug: 'lentilles-corail-poireaux', name: 'Soupe de lentilles corail et carottes', category: 'soupe', slots: ['repas'],
    description: 'Une soupe complète et protéinée.', prep: 10, cook: 25, servings: 4, equipment: ['plaques'], tags: ['végan', 'économique'],
    ing: [['lentilles-corail', 200, 'g'], ['carotte', 300, 'g'], ['oignon', 1, 'piece'], ['cumin', 3, 'g'], ['bouillon', 1, 'piece'], ['pain-complet', 160, 'g']],
    steps: ["Faites revenir l'oignon émincé avec le cumin.", 'Ajoutez les carottes en rondelles, les lentilles rincées, le bouillon et 1 l d’eau.', 'Faites cuire 20 minutes et mixez si vous le souhaitez. Servez avec le pain.'],
  },
];
