/* Cotonou Box — catalogue, filtres, fiche produit et panier */
(() => {
  "use strict";

  // Photos du Bénin hébergées sur Wikimedia Commons (licences libres, voir crédits en bas de page).
  // Chaque clé liste plusieurs fichiers : si le premier ne charge pas, on essaie le suivant.
  const PHOTOS = {
    ganvie: ["Ganvié_fishing_village_on_stilts_in_Benin_(10282059623)_(2).jpg", "Ganvie_Benin.jpg", "La_vie_sur_l'eau_à_Ganvié_au_Bénin.jpg"],
    ganvie2: ["La_vie_sur_l'eau_à_Ganvié_au_Bénin.jpg", "Maison_sur_pilotis_Ganvié_(Benin).jpg", "Ganvie_Benin.jpg"],
    ganvie3: ["Ganvié_fishing_village_on_stilts_in_Benin_(10282184705)_(2).jpg", "Maison_sur_pilotis_à_Ganvié_Benin.jpg"],
    cocotiers: ["Cocotiers.jpg"],
    amazone: ["Monument_de_l'Amazone_au_Benin.jpg"],
    tataSomba: ["Tata_Somba.jpg", "Benin_Tata_Somba.JPG"],
    tataSomba2: ["Benin_Tata_Somba.JPG", "Tata_Somba.jpg"],
    abomey: ["Palais_du_roi_Guézo_-_entrée_du_musée_historique_d'Abomey.jpg", "Palais_royaux_d'Abomey_en_2020_03.jpg"],
    abomey2: ["Palais_du_roi_Akaba_-_Site_des_Palais_royaux_d'Abomey_03.jpg", "Royal_Palaces_of_Abomey-133469.jpg"],
    abomey3: ["Palais_royaux_d'Abomey_en_2020_03.jpg", "Royal_Palaces_of_Abomey-133477.jpg"],
    ouidahPlage: ["Plage_de_Ouidah_Benin.jpg"],
    ouidahLagune: ["Lagoon_oustide_Ouidah.jpg"],
    ouidah: ["Entrée_de_la_cité_historique_de_Ouidah_01.jpg", "The_city_of_Ouidah.jpg"],
    grandPopo: ["Fleuve_de_la_Bouche_du_Roy_à_Grand-popo_au_Bénin.jpg"],
    pecheurs: ["Beach_seiners_in_Grand-Popo_Benin_3.jpg", "Beach_seiners_in_Grand-Popo_Benin_2.jpg"],
    heve: ["Royal_Palace_of_Heve,_Grand_Popo,_Benin.jpg"],
    dantokpa: ["Ustensiles_en_bois_(Paniers_éventails_Palettes)_traditionnels_exposés_au_marché_Dantokpa_au_Bénin.jpg"],
    condiments: ["VENDEUSE_DE_CONDIMENTS_SUR_LA_PASSERELLE_MARCHE_DANTOKPA-COTONOU_BENIN.jpg"],
    ananas: ["Ananas_du_Bénin.jpg", "VENDEUSE_DE_CONDIMENTS_SUR_LA_PASSERELLE_MARCHE_DANTOKPA-COTONOU_BENIN.jpg"],
    femmes: ["Femmes_du_Bénin_en_tenue_traditionnelle_du_sud_Benin_25.jpg", "Femmes_du_Bénin_en_tenue_traditionnelle_du_sud_Benin_19.jpg"],
    femmes2: ["Femmes_du_Bénin_en_tenue_traditionnelle_du_sud_Benin_19.jpg", "Femmes_du_Bénin_en_tenue_traditionnelle_du_sud_Benin_25.jpg"],
    peuhle: ["Femme_et_le_plaisir_d'être_belle(Peuhl)_du_Benin)_17.jpg", "Femme_béninoise.jpg"],
    beninoise: ["Femme_béninoise.jpg", "Femmes_du_Bénin_en_tenue_traditionnelle_du_sud_Benin_19.jpg"],
    artisanat: ["Centre_de_promotion_de_l'artisanat_du_Bénin_-_Façade.jpg", "Ustensiles_en_bois_(Paniers_éventails_Palettes)_traditionnels_exposés_au_marché_Dantokpa_au_Bénin.jpg"],
  };

  const CREDITS = [
    ["Ganvié", "Ganvié_fishing_village_on_stilts_in_Benin_(10282059623)_(2).jpg"],
    ["Ganvié", "La_vie_sur_l'eau_à_Ganvié_au_Bénin.jpg"],
    ["Ganvié", "Ganvie_Benin.jpg", "Profike"],
    ["Cocotiers", "Cocotiers.jpg", "Padonou Dotou"],
    ["Monument de l’Amazone, Cotonou", "Monument_de_l'Amazone_au_Benin.jpg"],
    ["Tata Somba", "Tata_Somba.jpg"],
    ["Tata Somba, Natitingou", "Benin_Tata_Somba.JPG"],
    ["Palais royaux d’Abomey", "Palais_du_roi_Guézo_-_entrée_du_musée_historique_d'Abomey.jpg"],
    ["Palais royaux d’Abomey", "Palais_du_roi_Akaba_-_Site_des_Palais_royaux_d'Abomey_03.jpg"],
    ["Palais royaux d’Abomey", "Palais_royaux_d'Abomey_en_2020_03.jpg"],
    ["Plage de Ouidah", "Plage_de_Ouidah_Benin.jpg"],
    ["Lagune de Ouidah", "Lagoon_oustide_Ouidah.jpg"],
    ["Cité historique de Ouidah", "Entrée_de_la_cité_historique_de_Ouidah_01.jpg"],
    ["Bouche du Roy, Grand-Popo", "Fleuve_de_la_Bouche_du_Roy_à_Grand-popo_au_Bénin.jpg"],
    ["Pêcheurs de Grand-Popo", "Beach_seiners_in_Grand-Popo_Benin_3.jpg"],
    ["Palais royal de Hêvê, Grand-Popo", "Royal_Palace_of_Heve,_Grand_Popo,_Benin.jpg"],
    ["Marché Dantokpa", "Ustensiles_en_bois_(Paniers_éventails_Palettes)_traditionnels_exposés_au_marché_Dantokpa_au_Bénin.jpg"],
    ["Marché Dantokpa", "VENDEUSE_DE_CONDIMENTS_SUR_LA_PASSERELLE_MARCHE_DANTOKPA-COTONOU_BENIN.jpg"],
    ["Ananas du Bénin", "Ananas_du_Bénin.jpg"],
    ["Femmes du Bénin", "Femmes_du_Bénin_en_tenue_traditionnelle_du_sud_Benin_25.jpg"],
    ["Femmes du Bénin", "Femmes_du_Bénin_en_tenue_traditionnelle_du_sud_Benin_19.jpg"],
    ["Femme peule du Bénin", "Femme_et_le_plaisir_d'être_belle(Peuhl)_du_Benin)_17.jpg"],
    ["Femme béninoise", "Femme_béninoise.jpg"],
    ["Centre de promotion de l’artisanat", "Centre_de_promotion_de_l'artisanat_du_Bénin_-_Façade.jpg"],
  ];


  // Les univers : chaque tuile a sa propre illustration.
  const CATEGORIES = [
    { slug: "tous", label: "Tous nos coffrets", title: "Tous nos coffrets", sub: "Pièces d’artisans, saveurs de nos marchés, rituels de beauté : chaque coffret raconte un morceau du Bénin." },
    { slug: "made-in-benin", label: "Made in Benin", tag: "100 % béninois", line: "De Cotonou à l’Atacora", art: "product:signature", size: "l", sub: "Des coffrets entièrement fabriqués au Bénin, de l’écrin au dernier objet." },
    { slug: "beaute", label: "Beauté", tag: "Rituels", line: "Karité, savon noir, huiles", size: "l", sub: "Les gestes de beauté de nos mères et grands-mères, en version précieuse.",
      still: { theme: "rose", cloth: "url(#cb-waxA)", items: [["bottle", 112, { text: "COCO" }], ["perfume", 200], ["jar", 290]] } },
    { slug: "gourmand", label: "Gourmand", tag: "Épicerie fine", line: "Cajou, ananas, kinkéliba", sub: "Les saveurs des marchés de Cotonou, sélectionnées chez de petits producteurs.",
      still: { theme: "sun", cloth: "url(#cb-waxB)", items: [["pineapple", 108], ["pouch", 204], ["jar", 292, { body: "#f2c14e", label: "#b6553a", text: "MANGUE" }]] } },
    { slug: "artisanat", label: "Artisanat", tag: "Savoir-faire", line: "Tentures, vannerie, laiton", sub: "Le travail des ateliers d’Abomey, de Porto-Novo et du Nord, en pièces durables.",
      still: { theme: "cream", items: [["tenture", 140, { s: 0.95 }], ["basket", 292, { s: 0.8 }]] } },
    { slug: "pour-elle", label: "Pour elle", tag: "Idées cadeaux", line: "Douceur et élégance", sub: "Pour une mère, une sœur, une amie : des coffrets pensés pour la faire rayonner.",
      still: { theme: "rose", items: [["flowers", 116], ["perfume", 214], ["bracelet", 306, { s: 0.8 }]] } },
    { slug: "pour-lui", label: "Pour lui", tag: "Idées cadeaux", line: "Caractère et authenticité", sub: "Pour un père, un frère, un partenaire : des coffrets sobres et généreux.",
      still: { theme: "green", cloth: "url(#cb-waxB)", items: [["bottle", 108, { fill: "url(#cb-dark)", label: "#e7b23c", text: "BAUME" }], ["book", 200], ["soap", 294, { s: 0.85 }]] } },
    { slug: "anniversaire", label: "Anniversaire", tag: "Occasion", line: "Un an de plus, sous le soleil", size: "o", sub: "Bougies, douceurs et petites attentions pour souffler ses bougies à la béninoise.",
      still: { theme: "sun", items: [["cake", 168, { s: 0.85 }], ["gift", 316, { fill: "#b3312a", s: 0.7 }]] } },
    { slug: "noel", label: "Noël", tag: "Occasion", line: "Les fêtes, version Cotonou", size: "o", sub: "Des coffrets de fêtes chaleureux, à glisser sous le sapin ou à partager en famille.",
      still: { theme: "red", cloth: "url(#cb-waxC)", items: [["gift", 126, { fill: "#0f3b2e", s: 0.8 }], ["candle", 228, { text: "SANTAL", band: "#0f3b2e" }], ["ball", 300, { s: 0.9 }], ["ball", 340, { r: 11, fill: "#c9a65c" }]] } },
    { slug: "avent", label: "Calendrier de l’Avent", tag: "Édition limitée", line: "24 jours au Bénin", art: "advent:avent-tile", size: "o", sub: "Notre calendrier de l’Avent : 24 découvertes béninoises jusqu’à Noël." },
  ];

  // Prix en FCFA (1 € = 655,957 FCFA).
  const BJ = "Bénin";
  const PRODUCTS = [
    {
      id: "signature", name: "Le Signature", price: 35000, badge: "Best-seller", reviews: 124,
      cats: ["made-in-benin", "beaute", "gourmand", "pour-elle", "pour-lui"],
      art: { theme: "peach", items: [["bottle", 92, { text: "COCO" }], ["jar", 160], ["tea", 230], ["pouch", 300]], card: [312, 330, { rot: 9 }] },
      short: "L’essentiel du Bénin dans un écrin vert et or.",
      desc: "Notre coffret emblématique : le meilleur de nos producteurs réuni dans un écrin rigide, garni de pagne wax.",
      contents: [["Beurre de karité brut, coopérative de Djougou", BJ], ["Noix de cajou grillées au sel de mer", BJ], ["Tisane de kinkéliba", BJ], ["Huile de coco vierge", BJ], ["Carte personnalisée", BJ]],
      origin: "Composé à Cotonou, de la main de notre atelier.",
    },
    {
      id: "rituel-karite", name: "Rituel Karité", price: 25000, reviews: 87,
      cats: ["beaute", "pour-elle", "made-in-benin"],
      art: { theme: "rose", wax: "url(#cb-waxC)", items: [["jar", 100, { w: 70 }], ["bottle", 168, { text: "COCO" }], ["soap", 236], ["jar", 304, { w: 52, h: 40, label: "#b6553a", text: "GOMMAGE" }]] },
      short: "Le soin d’or des femmes du Nord.",
      desc: "Un rituel complet pour le corps et les cheveux, autour du karité récolté et baratté à la main par une coopérative de femmes de Djougou.",
      contents: [["Beurre de karité fouetté à la citronnelle", BJ], ["Savon noir au karité", BJ], ["Huile de coco vierge pressée à froid", BJ], ["Gommage au sucre de canne", BJ], ["Éponge végétale traditionnelle", BJ]],
      origin: "Fabriqué par une coopérative de 40 femmes à Djougou.",
    },
    {
      id: "grand-marche", name: "Le Grand Marché", price: 20000, reviews: 66,
      cats: ["gourmand", "made-in-benin", "pour-lui"],
      art: { theme: "sun", items: [["pineapple", 96, { s: 0.85 }], ["jar", 166, { body: "#f2c14e", label: "#b6553a", text: "MANGUE" }], ["pouch", 236], ["jar", 304, { w: 54, label: "#b3312a", text: "PIMENT" }]] },
      short: "Une promenade gourmande dans Dantokpa.",
      desc: "Les trésors de l’épicerie béninoise, sélectionnés auprès de petits producteurs et conditionnés en bocaux de verre.",
      contents: [["Noix de cajou caramélisées au gingembre", BJ], ["Ananas pain de sucre séché", BJ], ["Klui-klui, croquants d’arachide", BJ], ["Piment fumé", BJ], ["Confiture de mangue et passion", BJ]],
      origin: "Producteurs d’Allada, de Savalou et de Cotonou.",
    },
    {
      id: "kinkeliba", name: "Matins de Kinkéliba", price: 15000, reviews: 41,
      cats: ["gourmand", "pour-elle", "anniversaire"],
      art: { theme: "green", wax: "url(#cb-waxC)", items: [["tea", 100], ["tea", 166, { fill: "#b6553a", text: "Citronnelle" }], ["jar", 236, { body: "#e9a93a", text: "MIEL" }], ["cup", 304]] },
      short: "Le rituel du petit-déjeuner béninois.",
      desc: "Le kinkéliba, c’est l’odeur des matins au Bénin. Un coffret infusions et douceurs pour retrouver cette lenteur.",
      contents: [["Kinkéliba en feuilles", BJ], ["Citronnelle et gingembre séchés", BJ], ["Miel de mangrove", BJ], ["Tasse en céramique de Sè", BJ]],
      origin: "Feuilles cueillies autour d’Abomey-Calavi.",
    },
    {
      id: "atelier-abomey", name: "L’Atelier d’Abomey", price: 55000, badge: "Pièce d’art", reviews: 23,
      cats: ["artisanat", "made-in-benin", "pour-lui", "noel"],
      art: { theme: "cream", wax: "url(#cb-waxD)", items: [["tenture", 140, { s: 0.78 }], ["candle", 262, { text: "VANILLE" }]], card: [310, 334, { rot: 7, l1: "Une pièce unique", l2: "cousue à Abomey" }] },
      short: "Une tenture appliquée des ateliers royaux.",
      desc: "Les tentures appliquées d’Abomey racontaient l’histoire des rois du Dahomey. Une famille d’artisans perpétue ce savoir-faire : chaque pièce est unique.",
      contents: [["Tenture appliquée cousue main, 40 × 60 cm", BJ], ["Livret illustré sur les symboles royaux", BJ], ["Bougie à la vanille de Bohicon", BJ]],
      origin: "Atelier familial, quartier des artisans d’Abomey.",
    },
    {
      id: "gentleman", name: "Le Porto-Novo", price: 32000, reviews: 38,
      cats: ["pour-lui", "beaute", "gourmand", "anniversaire"],
      art: { theme: "green", box: "wood", wax: "url(#cb-waxB)", items: [["jar", 100, { body: "#2b2a28", label: "#e7b23c", ink: "#0f3b2e", text: "BAUME" }], ["soap", 176], ["pouch", 244], ["book", 308]], front: [["bowtie", 302, { b: 404, s: 0.8 }]] },
      short: "Le coffret élégant pour lui.",
      desc: "Pour l’homme qui aime les belles choses : soin de barbe au karité, noix de cajou épicées et un nœud papillon en pagne.",
      contents: [["Baume à barbe karité & vétiver", BJ], ["Savon noir au charbon", BJ], ["Noix de cajou au poivre", BJ], ["Nœud papillon en pagne wax", BJ], ["Carnet relié en tissu", "France"]],
      origin: "Composé à Cotonou · une touche française.",
    },
    {
      id: "panier-ouidah", name: "Panier de Ouidah", price: 30000, reviews: 29,
      cats: ["artisanat", "made-in-benin", "pour-elle"],
      art: { theme: "terra", wax: "url(#cb-waxC)", items: [["basket", 134, { s: 0.82 }], ["bottle", 244, { text: "COCO" }], ["soap", 306, { s: 0.8 }]] },
      short: "Vannerie tressée et trésors de la côte.",
      desc: "Un panier tressé à la main, à garder longtemps, garni de petits trésors de la côte béninoise.",
      contents: [["Panier en fibres de raphia tressé", BJ], ["Huile de coco vierge", BJ], ["Savon au lait de coco", BJ], ["Foulard en pagne", BJ]],
      origin: "Vanniers de la région de Ouidah.",
    },
    {
      id: "ganvie", name: "Ganvié", price: 40000, badge: "Nouveau", reviews: 18,
      cats: ["pour-elle", "beaute", "made-in-benin"],
      art: { theme: "rose", items: [["perfume", 104], ["bottle", 172, { fill: "url(#cb-gold)", text: "HUILE" }], ["bottle", 234, { fill: "#5f9a7a", h: 110, text: "BRUME" }], ["jar", 302, { w: 56, text: "YLANG" }]], front: [["bracelet", 300, { b: 404, s: 0.75 }]] },
      short: "Bijoux en laiton et soins précieux.",
      desc: "Inspiré par la lumière sur le lac Nokoué : un bracelet en laiton coulé à la cire perdue et des soins parfumés.",
      contents: [["Bracelet en laiton, fonte à la cire perdue", BJ], ["Huile sèche karité & ylang-ylang", BJ], ["Brume de citronnelle", BJ], ["Eau de parfum fleur de frangipanier", BJ]],
      origin: "Bronziers d’Abomey et parfumeurs de Cotonou.",
    },
    {
      id: "maman", name: "Maman Chérie", price: 28000, reviews: 52,
      cats: ["pour-elle", "beaute", "anniversaire"],
      art: { theme: "rose", wax: "url(#cb-waxA)", items: [["perfume", 108], ["flowers", 196, { s: 0.75 }], ["jar", 296]], card: [306, 336, { rot: 8, l1: "Pour toi, Maman", l2: "avec tout notre amour" }] },
      short: "Pour celle qui nous a tout donné.",
      desc: "Un coffret tendre pour la fête des mères ou juste pour dire merci : parfum, soins et une carte écrite à la main.",
      contents: [["Eau de parfum frangipanier", BJ], ["Beurre de karité à l’hibiscus", BJ], ["Tisane de bissap", BJ], ["Carte écrite à la main", BJ]],
      origin: "Composé à Cotonou.",
    },
    {
      id: "anniversaire", name: "Joyeux Anniversaire", price: 22000, reviews: 47,
      cats: ["anniversaire", "gourmand", "pour-elle", "pour-lui"],
      art: { theme: "sun", wax: "url(#cb-waxD)", items: [["candle", 96], ["pouch", 166, { fill: "#d8a548", text: "PLANTAIN" }], ["jar", 236, { body: "#fff", text: "COCO" }], ["choco", 304]] },
      short: "Souffler ses bougies à la béninoise.",
      desc: "Un coffret festif qui sent le soleil, avec une carte d’anniversaire illustrée par une artiste de Cotonou.",
      contents: [["Bougie parfumée ananas & coco", BJ], ["Chips de banane plantain", BJ], ["Noix de coco caramélisées", BJ], ["Carte illustrée à la main", BJ], ["Chocolat d’un artisan", "France"]],
      origin: "Composé à Cotonou · une touche française.",
    },
    {
      id: "mini-douceur", name: "Mini Douceur", price: 12000, reviews: 73,
      cats: ["anniversaire", "pour-elle", "beaute"],
      art: { theme: "peach", wax: "url(#cb-waxC)", items: [["jar", 128], ["soap", 206], ["tea", 282, { fill: "#2f7a4f", text: "Citronnelle" }]] },
      short: "La petite attention qui fait plaisir.",
      desc: "Le format idéal pour dire merci ou fêter un anniversaire : petit écrin, grande attention.",
      contents: [["Beurre de karité fouetté, 50 ml", BJ], ["Savon noir au miel", BJ], ["Tisane de citronnelle", BJ]],
      origin: "Coopérative de femmes de Djougou.",
    },
    {
      id: "noel-cocotiers", name: "Noël sous les cocotiers", price: 38000, badge: "Noël", badgeStyle: "terra", reviews: 34,
      cats: ["noel", "gourmand", "made-in-benin"],
      art: { theme: "red", items: [["jar", 96, { body: "#f2c14e", label: "#b3312a", text: "ANANAS" }], ["bottle", 162, { fill: "url(#cb-wine)", text: "BISSAP", ink: "#7a1f22" }], ["pouch", 230], ["candle", 302, { text: "SANTAL", band: "#0f3b2e" }]], front: [["ball", 370, { b: 478, r: 14 }], ["ball", 344, { b: 482, r: 9, fill: "#c9a65c" }]] },
      short: "Les fêtes, version Cotonou.",
      desc: "Un coffret de fêtes chaleureux à partager en famille : douceurs, épices et une décoration à suspendre au sapin.",
      contents: [["Décoration en laiton d’Abomey", BJ], ["Confiture d’ananas à la vanille", BJ], ["Noix de cajou au caramel épicé", BJ], ["Sirop de bissap", BJ], ["Bougie au bois de santal", BJ]],
      origin: "Composé à Cotonou pour les fêtes.",
    },
    {
      id: "prestige", name: "Coffret Prestige", price: 75000, badge: "Édition limitée", reviews: 15,
      cats: ["noel", "artisanat", "gourmand", "beaute", "pour-elle", "pour-lui"],
      art: { theme: "green", box: "wood", wax: "url(#cb-waxB)", items: [["tenture", 110, { s: 0.68 }], ["bottle", 192, { fill: "url(#cb-wine)", text: "BISSAP", ink: "#7a1f22" }], ["jar", 254], ["choco", 312]] },
      short: "Notre malle en bois, pour les grandes occasions.",
      desc: "Une malle en bois sculptée, réutilisable, garnie de nos plus belles pièces. Le cadeau d’entreprise ou de famille par excellence.",
      contents: [["Malle en bois sculptée à la main", BJ], ["Tenture appliquée d’Abomey", BJ], ["Rituel karité complet", BJ], ["Épicerie fine : cajou, ananas, bissap", BJ], ["Chocolat noir de manufacture", "France"]],
      origin: "Numérotée, 200 exemplaires.",
    },
    {
      id: "calendrier-avent", name: "Calendrier de l’Avent", price: 45000, badge: "Précommande", badgeStyle: "sun", reviews: 61,
      cats: ["avent", "noel", "beaute", "gourmand", "made-in-benin"],
      advent: { theme: "red" },
      short: "24 jours, 24 découvertes béninoises.",
      desc: "24 fenêtres habillées de wax à ouvrir jusqu’à Noël : beauté, épicerie fine et petits objets d’artisans. Expédition à partir du 15 novembre.",
      contents: [["10 soins (karité, savon noir, huiles…)", BJ], ["9 gourmandises (cajou, ananas, kinkéliba…)", BJ], ["4 objets d’artisans (laiton, pagne…)", BJ], ["1 surprise de Noël", "France"]],
      origin: "Écrin illustré à Cotonou, série numérotée.",
    },
    {
      id: "avent-mini", name: "Petit Avent Gourmand", price: 28000, reviews: 20,
      cats: ["avent", "gourmand", "noel"],
      advent: { theme: "sun" },
      short: "24 douceurs de nos marchés.",
      desc: "Une version gourmande et plus légère de notre calendrier : 24 bouchées des marchés béninois.",
      contents: [["Cajou, ananas séché, mangue séchée", BJ], ["Klui-klui et caramels de coco", BJ], ["Sachets de kinkéliba et citronnelle", BJ]],
      origin: "Producteurs d’Allada et de Savalou.",
    },
  ];

  // ---------- Utilitaires ----------
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const catLabel = (slug) => (CATEGORIES.find((c) => c.slug === slug) || {}).label || "";
  const fileUrl = (name, w = 1400) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${w}`;
  const filePage = (name) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ } },
  };

  // ---------- Devise ----------
  const EUR_RATE = 655.957;
  let currency = store.get("cotonoubox-cur", "FCFA");
  const money = (fcfa) => currency === "EUR"
    ? `${Math.round(fcfa / EUR_RATE).toLocaleString("fr-FR")} €`
    : `${fcfa.toLocaleString("fr-FR")} FCFA`;
  function refreshPrices() {
    $$("[data-price]").forEach((el) => { el.textContent = money(Number(el.dataset.price)); });
    $$("[data-cur]").forEach((b) => b.classList.toggle("is-active", b.dataset.cur === currency));
  }

  // ---------- Illustrations ----------
  const A = window.CBArt;
  document.body.insertAdjacentHTML("afterbegin", A.defs);

  function artFor(ref) {
    const [kind, id] = ref.split(":");
    if (kind === "product") {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return "";
      return p.advent ? A.advent({ ...p.advent, label: p.name }) : A.coffret({ ...p.art, label: p.name });
    }
    if (kind === "still") {
      const c = CATEGORIES.find((x) => x.slug === id);
      return c && c.still ? A.still({ ...c.still, label: c.label }) : "";
    }
    if (kind === "advent") return A.advent({ theme: id === "avent-tile" ? "terra" : "red" });
    return "";
  }
  function hydrateArt(root = document) {
    $$(".art[data-art]", root).forEach((el) => {
      if (el.dataset.done) return;
      el.dataset.done = "1";
      el.insertAdjacentHTML("afterbegin", artFor(el.dataset.art));
    });
  }
  function hydrateEmblems(root = document) {
    $$("[data-emblem]", root).forEach((el) => { el.innerHTML = A.emblem(Number(el.dataset.emblem)); });
  }

  // Photos : un paysage illustré sert de fond si la photo ne se charge pas.
  function setPhoto(img, key, width) {
    const list = PHOTOS[key] || [];
    let i = 0;
    img.classList.remove("is-broken");
    img.onerror = () => {
      i += 1;
      if (i < list.length) img.src = fileUrl(list[i], width);
      else img.classList.add("is-broken");
    };
    if (list.length) img.src = fileUrl(list[0], width);
    else img.classList.add("is-broken");
  }
  function hydratePhotos(root = document) {
    $$("img[data-photo]", root).forEach((img, i) => {
      if (img.dataset.done) return;
      img.dataset.done = "1";
      img.insertAdjacentHTML("beforebegin", `<div class="ph__scene">${A.landscape({ sunX: 380 + ((i * 230) % 700) })}</div>`);
      setPhoto(img, img.dataset.photo, 1400);
    });
  }

  // ---------- Navigation ----------
  function renderNav() {
    $("#catNav").innerHTML = CATEGORIES.map((c) => `<a href="#c/${c.slug}" data-cat="${c.slug}">${esc(c.label)}</a>`).join("");
    $("#footerCats").innerHTML = CATEGORIES.map((c) => `<li><a href="#c/${c.slug}">${esc(c.label)}</a></li>`).join("");
    $("#mobileNav").innerHTML =
      `<p class="drawer__sub">Coffrets</p>` +
      CATEGORIES.map((c) => `<a href="#c/${c.slug}">${esc(c.label)}</a>`).join("") +
      `<p class="drawer__sub">La maison</p>
       <a href="#maison">Notre histoire</a><a href="#carnet">Carnet du Bénin</a><a href="#app">L’application</a><a href="#composer">Sur mesure</a>`;
    $("#filters").innerHTML = CATEGORIES.map((c) =>
      `<button class="chip" role="tab" data-cat="${c.slug}">${esc(c.slug === "tous" ? "Tout" : c.label)}</button>`).join("");
  }

  function renderUniverses() {
    $("#universes").innerHTML = CATEGORIES.filter((c) => c.slug !== "tous").map((c) => `
      <a class="universe${c.size ? " universe--" + c.size : ""}" href="#c/${c.slug}">
        <div class="universe__art art" data-art="${c.art || "still:" + c.slug}"></div>
        <span class="universe__label"><small>${esc(c.tag)}</small><span>${esc(c.label)}</span><i>${esc(c.line)}</i></span>
      </a>`).join("");
    hydrateArt($("#universes"));
  }

  // ---------- Catalogue ----------
  let currentCat = "tous";
  let currentSort = "featured";

  function renderProducts() {
    const cat = CATEGORIES.find((c) => c.slug === currentCat) || CATEGORIES[0];
    $("#collectionTitle").textContent = cat.title || cat.label;
    $("#collectionSub").textContent = cat.sub;
    $$("[data-cat]").forEach((el) => el.classList.toggle("is-active", el.dataset.cat === currentCat));

    const list = currentCat === "tous" ? [...PRODUCTS] : PRODUCTS.filter((p) => p.cats.includes(currentCat));
    if (currentSort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (currentSort === "price-desc") list.sort((a, b) => b.price - a.price);

    $("#productGrid").innerHTML = list.length ? list.map((p, i) => `
      <article class="card" style="animation-delay:${Math.min(i, 8) * 50}ms">
        <div class="card__media art" data-art="product:${p.id}" data-open="${p.id}">
          ${p.badge ? `<span class="badge${p.badgeStyle ? " badge--" + p.badgeStyle : ""}">${esc(p.badge)}</span>` : ""}
          <button class="card__quick" data-add="${p.id}">Ajouter au panier</button>
        </div>
        <div class="card__body">
          <p class="card__cat">${esc(catLabel(p.cats[0]))}</p>
          <h3 class="card__title" data-open="${p.id}">${esc(p.name)}</h3>
          <p class="card__desc">${esc(p.short)}</p>
          <p class="card__price" data-price="${p.price}">${money(p.price)}</p>
        </div>
      </article>`).join("") : `<p class="empty">Bientôt de nouveaux coffrets dans cet univers.</p>`;
    hydrateArt($("#productGrid"));
  }

  function applyHash(scroll) {
    const m = location.hash.match(/^#c\/([\w-]+)/);
    if (!m) return;
    currentCat = CATEGORIES.some((c) => c.slug === m[1]) ? m[1] : "tous";
    renderProducts();
    if (scroll) $("#coffrets").scrollIntoView({ behavior: "smooth" });
  }

  // ---------- Fiche produit ----------
  let openId = null;
  function openProduct(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    openId = id;
    $("#pmArt").innerHTML = artFor(`product:${p.id}`);
    $("#pmCats").textContent = p.cats.slice(0, 3).map(catLabel).join(" · ");
    $("#pmTitle").textContent = p.name;
    $("#pmReviews").textContent = `${p.reviews} avis`;
    $("#pmPrice").dataset.price = p.price;
    $("#pmPrice").textContent = money(p.price);
    $("#pmDesc").textContent = p.desc;
    $("#pmContents").innerHTML = p.contents.map(([item, from]) =>
      `<li class="${from === "France" ? "fr" : ""}"><span>${esc(item)}</span><small>${from === BJ ? "Fait au Bénin" : "Touche française"}</small></li>`).join("");
    $("#pmOrigin").textContent = p.origin;
    openLayer($("#productModal"));
  }

  // ---------- Panier ----------
  const FREE_SHIPPING = 50000;
  let cart = store.get("cotonoubox-cart", []);
  const saveCart = () => store.set("cotonoubox-cart", cart);

  function addToCart(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    const line = cart.find((l) => l.id === id);
    if (line) line.qty += 1; else cart.push({ id, qty: 1 });
    saveCart();
    renderCart();
    toast(`<b>${esc(p.name)}</b> ajouté au panier`);
    $("#cartBtn").animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 400 });
  }

  function renderCart() {
    cart = cart.filter((l) => PRODUCTS.some((p) => p.id === l.id) && l.qty > 0);
    const count = cart.reduce((s, l) => s + l.qty, 0);
    const total = cart.reduce((s, l) => s + l.qty * PRODUCTS.find((p) => p.id === l.id).price, 0);
    const badge = $("#cartCount");
    badge.hidden = count === 0;
    badge.textContent = count;

    $("#cartBody").innerHTML = cart.length ? cart.map((l) => {
      const p = PRODUCTS.find((x) => x.id === l.id);
      return `<div class="line">
        <div class="line__art art" data-art="product:${p.id}"></div>
        <div>
          <p class="line__title">${esc(p.name)}</p>
          <p class="line__price" data-price="${p.price}">${money(p.price)}</p>
          <div class="qty"><button data-dec="${p.id}" aria-label="Retirer un">−</button><span>${l.qty}</span><button data-inc="${p.id}" aria-label="Ajouter un">+</button></div>
        </div>
        <button class="line__remove" data-rm="${p.id}">Retirer</button>
      </div>`;
    }).join("") : `<div class="cart__empty"><p>Votre panier est vide</p><p>Laissez-vous tenter par un peu de Bénin.</p><a class="btn btn--green" href="#c/tous" data-close>Voir les coffrets</a></div>`;
    hydrateArt($("#cartBody"));

    $("#cartFoot").hidden = cart.length === 0;
    $("#cartTotal").dataset.price = total;
    $("#cartTotal").textContent = money(total);
    const left = FREE_SHIPPING - total;
    $("#cartShip").innerHTML = (left > 0
      ? `Plus que <strong data-price="${left}">${money(left)}</strong> pour la livraison offerte`
      : `<strong>Livraison offerte</strong> ✦`) +
      `<div class="cart__bar"><i style="width:${Math.min(100, (total / FREE_SHIPPING) * 100)}%"></i></div>`;
  }

  // ---------- Calques (modale, tiroirs) ----------
  let lastFocus = null;
  function openLayer(el) {
    lastFocus = document.activeElement;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    const f = el.querySelector("[data-close]");
    if (f) setTimeout(() => f.focus(), 50);
    if (el.id === "menuDrawer") $("#menuBtn").setAttribute("aria-expanded", "true");
  }
  function closeLayers() {
    $$(".drawer.is-open, .modal.is-open").forEach((el) => {
      el.classList.remove("is-open");
      el.setAttribute("aria-hidden", "true");
    });
    document.body.classList.remove("is-locked");
    $("#menuBtn").setAttribute("aria-expanded", "false");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  let toastTimer;
  function toast(html) {
    const t = $("#toast");
    t.innerHTML = html;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  function renderCredits() {
    $("#credits").innerHTML = CREDITS.map(([label, file, author]) =>
      `<li><a href="${filePage(file)}" target="_blank" rel="noopener">${esc(label)}</a>${author ? ` — ${esc(author)}` : ""}, Wikimedia Commons</li>`).join("") +
      `<li>Illustrations des coffrets et paysages : Cotonou Box</li>`;
  }

  // ---------- Événements ----------
  document.addEventListener("click", (e) => {
    const t = e.target;
    const add = t.closest("[data-add]");
    if (add) { e.preventDefault(); e.stopPropagation(); addToCart(add.dataset.add); return; }
    const open = t.closest("[data-open]");
    if (open) { openProduct(open.dataset.open); return; }
    const chip = t.closest(".chip[data-cat]");
    if (chip) { history.replaceState(null, "", `#c/${chip.dataset.cat}`); currentCat = chip.dataset.cat; renderProducts(); return; }
    const cur = t.closest("[data-cur]");
    if (cur) { currency = cur.dataset.cur; store.set("cotonoubox-cur", currency); refreshPrices(); return; }
    const inc = t.closest("[data-inc]"), dec = t.closest("[data-dec]"), rm = t.closest("[data-rm]");
    if (inc || dec || rm) {
      const id = (inc || dec || rm).dataset[inc ? "inc" : dec ? "dec" : "rm"];
      const line = cart.find((l) => l.id === id);
      if (line) { if (inc) line.qty += 1; else if (dec) line.qty -= 1; else line.qty = 0; }
      saveCart(); renderCart(); return;
    }
    if (t.closest("[data-close]") || t.classList.contains("drawer") || t.classList.contains("modal")) closeLayers();
    if (t.closest("#mobileNav a")) closeLayers();
  });

  $("#cartBtn").addEventListener("click", () => openLayer($("#cartDrawer")));
  $("#menuBtn").addEventListener("click", () => openLayer($("#menuDrawer")));
  $("#pmAdd").addEventListener("click", () => { if (openId) { addToCart(openId); closeLayers(); } });
  $("#sortSelect").addEventListener("change", (e) => { currentSort = e.target.value; renderProducts(); });
  $("#checkoutBtn").addEventListener("click", () => {
    toast("Merci ✦ Le paiement en ligne ouvre très bientôt. Votre sélection est gardée.");
  });
  $("#nlForm").addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.reset();
    toast("Bienvenue dans <b>la lettre de Cotonou</b> ✦");
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLayers(); });
  window.addEventListener("hashchange", () => applyHash(true));

  // ---------- Démarrage ----------
  $("#heroScene").innerHTML = A.landscape({ sunX: 760 });
  $("#nlScene").innerHTML = A.landscape({ sunX: 900 });
  hydrateEmblems();
  renderNav();
  renderUniverses();
  renderCredits();
  renderProducts();
  renderCart();
  hydrateArt();
  hydratePhotos();
  refreshPrices();
  applyHash(true);
})();
