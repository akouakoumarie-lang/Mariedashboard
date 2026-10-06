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

  const CATEGORIES = [
    { slug: "tous", label: "Tous nos coffrets", title: "Tous nos coffrets", sub: "Pièces d’artisans, saveurs de nos marchés, rituels de beauté : chaque coffret raconte un morceau du Bénin." },
    { slug: "made-in-benin", label: "Made in Benin", tag: "100 % béninois", line: "Fabriqué de Cotonou à l’Atacora", photo: "amazone", size: "l", sub: "Des coffrets entièrement fabriqués au Bénin, de l’écrin au dernier objet." },
    { slug: "beaute", label: "Beauté", tag: "Rituels", line: "Karité brut, savon noir, huiles", photo: "femmes", size: "l", sub: "Les gestes de beauté de nos mères et grands-mères, en version précieuse." },
    { slug: "gourmand", label: "Gourmand", tag: "Épicerie fine", line: "Cajou, ananas, kinkéliba", photo: "condiments", sub: "Les saveurs des marchés de Cotonou, sélectionnées chez de petits producteurs." },
    { slug: "artisanat", label: "Artisanat", tag: "Savoir-faire", line: "Tentures, vannerie, laiton", photo: "abomey", sub: "Le travail des ateliers d’Abomey, de Porto-Novo et du Nord, en pièces durables." },
    { slug: "pour-elle", label: "Pour elle", tag: "Idées cadeaux", line: "Douceur et élégance", photo: "peuhle", sub: "Pour une mère, une sœur, une amie : des coffrets pensés pour la faire rayonner." },
    { slug: "pour-lui", label: "Pour lui", tag: "Idées cadeaux", line: "Caractère et authenticité", photo: "tataSomba", sub: "Pour un père, un frère, un partenaire : des coffrets sobres et généreux." },
    { slug: "anniversaire", label: "Anniversaire", tag: "Occasion", line: "Un an de plus, sous le soleil", photo: "ouidahPlage", size: "o", sub: "Bougies, douceurs et petites attentions pour souffler ses bougies à la béninoise." },
    { slug: "noel", label: "Noël", tag: "Occasion", line: "Les fêtes, version Cotonou", photo: "heve", size: "o", sub: "Des coffrets de fêtes chaleureux, à glisser sous le sapin ou à partager en famille." },
    { slug: "avent", label: "Calendrier de l’Avent", tag: "Édition limitée", line: "24 jours de Bénin", photo: "abomey2", size: "o", sub: "Notre calendrier de l’Avent : 24 surprises béninoises jusqu’à Noël." },
  ];

  const BJ = "Bénin";
  const PRODUCTS = [
    {
      id: "signature", name: "Le Signature", price: 69, badge: "Best-seller", photo: "ganvie2",
      cats: ["made-in-benin", "beaute", "gourmand", "pour-elle", "pour-lui"],
      short: "L’essentiel du Bénin dans un écrin vert et or.",
      desc: "Notre coffret emblématique : le meilleur de nos producteurs réuni dans un écrin rigide habillé d’un pagne tissé à la main.",
      contents: [["Beurre de karité brut, coopérative de Djougou", BJ], ["Noix de cajou grillées au sel de mer", BJ], ["Tisane de kinkéliba", BJ], ["Savon noir artisanal", BJ], ["Pochette en pagne", BJ]],
      origin: "Composé à Cotonou, de la main de notre atelier.",
    },
    {
      id: "rituel-karite", name: "Rituel Karité", price: 54, photo: "femmes2",
      cats: ["beaute", "pour-elle", "made-in-benin"],
      short: "Le soin d’or des femmes du Nord.",
      desc: "Un rituel complet pour le corps et les cheveux, autour du karité récolté et baratté à la main par une coopérative de femmes de Djougou.",
      contents: [["Beurre de karité fouetté à la citronnelle, 200 ml", BJ], ["Savon noir au karité", BJ], ["Huile de coco vierge pressée à froid", BJ], ["Éponge végétale traditionnelle", BJ], ["Peigne en bois sculpté", BJ]],
      origin: "Fabriqué par une coopérative de 40 femmes à Djougou.",
    },
    {
      id: "grand-marche", name: "Le Grand Marché", price: 59, photo: "condiments",
      cats: ["gourmand", "made-in-benin", "pour-lui"],
      short: "Une promenade gourmande dans Dantokpa.",
      desc: "Les trésors de l’épicerie béninoise, sélectionnés auprès de petits producteurs et conditionnés en bocaux de verre.",
      contents: [["Noix de cajou caramélisées au gingembre", BJ], ["Ananas pain de sucre séché", BJ], ["Klui-klui, croquants d’arachide", BJ], ["Piment de Cayenne fumé", BJ], ["Confiture de mangue et passion", BJ]],
      origin: "Producteurs d’Allada, de Savalou et de Cotonou.",
    },
    {
      id: "kinkeliba", name: "Matins de Kinkéliba", price: 39, photo: "ouidahLagune",
      cats: ["gourmand", "pour-elle", "anniversaire"],
      short: "Le rituel du petit-déjeuner béninois.",
      desc: "Le kinkéliba, c’est l’odeur des matins au Bénin. Un coffret infusions et douceurs pour retrouver cette lenteur.",
      contents: [["Kinkéliba en feuilles, 80 g", BJ], ["Citronnelle et gingembre séchés", BJ], ["Miel de mangrove", BJ], ["Tasse en céramique de Sè", BJ]],
      origin: "Feuilles cueillies autour d’Abomey-Calavi.",
    },
    {
      id: "atelier-abomey", name: "L’Atelier d’Abomey", price: 89, badge: "Pièce d’art", photo: "abomey3",
      cats: ["artisanat", "made-in-benin", "pour-lui", "noel"],
      short: "Une tenture appliquée des ateliers royaux.",
      desc: "Les tentures appliquées d’Abomey racontaient l’histoire des rois du Dahomey. Une famille d’artisans perpétue ce savoir-faire : chaque pièce est unique.",
      contents: [["Tenture appliquée cousue main, 40 × 60 cm", BJ], ["Livret illustré sur les symboles royaux", BJ], ["Bougie à la vanille de Bohicon", BJ]],
      origin: "Atelier familial, quartier des artisans d’Abomey.",
    },
    {
      id: "gentleman", name: "Le Porto-Novo", price: 74, photo: "tataSomba2",
      cats: ["pour-lui", "beaute", "gourmand", "anniversaire"],
      short: "Le coffret élégant pour lui.",
      desc: "Pour l’homme qui aime les belles choses : soin de barbe au karité, noix de cajou épicées et un nœud papillon en pagne.",
      contents: [["Baume à barbe karité & vétiver", BJ], ["Savon noir au charbon", BJ], ["Noix de cajou au poivre de Penja", BJ], ["Nœud papillon en pagne wax", BJ], ["Carnet relié en tissu", "France"]],
      origin: "Composé à Cotonou · une touche française.",
    },
    {
      id: "panier-ouidah", name: "Panier de Ouidah", price: 64, photo: "dantokpa",
      cats: ["artisanat", "made-in-benin", "pour-elle"],
      short: "Vannerie tressée et trésors de la côte.",
      desc: "Un panier tressé à la main, à garder longtemps, garni de petits trésors de la côte béninoise.",
      contents: [["Panier en fibres de raphia tressé", BJ], ["Huile de coco vierge", BJ], ["Savon au lait de coco", BJ], ["Foulard en pagne", BJ]],
      origin: "Vanniers de la région de Ouidah.",
    },
    {
      id: "soleil-elle", name: "Ganvié", price: 79, badge: "Nouveau", photo: "ganvie3",
      cats: ["pour-elle", "beaute", "made-in-benin"],
      short: "Bijoux en laiton et soins précieux.",
      desc: "Inspiré par la lumière sur le lac Nokoué : un bracelet en laiton coulé à la cire perdue et des soins parfumés.",
      contents: [["Bracelet en laiton, fonte à la cire perdue", BJ], ["Huile sèche karité & ylang-ylang", BJ], ["Brume de citronnelle", BJ], ["Pochette en bazin brodé", BJ]],
      origin: "Bronziers d’Abomey et parfumeurs de Cotonou.",
    },
    {
      id: "anniversaire", name: "Joyeux Anniversaire", price: 49, photo: "cocotiers",
      cats: ["anniversaire", "gourmand", "pour-elle", "pour-lui"],
      short: "Souffler ses bougies à la béninoise.",
      desc: "Un coffret festif qui sent le soleil, avec une carte d’anniversaire illustrée par une artiste de Cotonou.",
      contents: [["Bougie parfumée ananas & coco", BJ], ["Chips de banane plantain", BJ], ["Noix de coco caramélisées", BJ], ["Carte illustrée à la main", BJ], ["Bonbons au chocolat d’un artisan", "France"]],
      origin: "Composé à Cotonou · une touche française.",
    },
    {
      id: "mini-douceur", name: "Mini Douceur", price: 29, photo: "beninoise",
      cats: ["anniversaire", "pour-elle", "beaute"],
      short: "La petite attention qui fait plaisir.",
      desc: "Le format idéal pour dire merci ou fêter un anniversaire : petit écrin, grande attention.",
      contents: [["Beurre de karité fouetté, 50 ml", BJ], ["Savon noir au miel", BJ], ["Tisane de citronnelle", BJ]],
      origin: "Coopérative de femmes de Djougou.",
    },
    {
      id: "noel-cocotiers", name: "Noël sous les cocotiers", price: 79, badge: "Noël", badgeStyle: "terra", photo: "heve",
      cats: ["noel", "gourmand", "made-in-benin"],
      short: "Les fêtes, version Cotonou.",
      desc: "Un coffret de fêtes chaleureux à partager en famille : douceurs, épices et une décoration à suspendre au sapin.",
      contents: [["Décoration en laiton d’Abomey", BJ], ["Confiture d’ananas à la vanille", BJ], ["Noix de cajou au caramel épicé", BJ], ["Sirop de bissap", BJ], ["Bougie au bois de santal", BJ]],
      origin: "Composé à Cotonou pour les fêtes.",
    },
    {
      id: "prestige", name: "Coffret Prestige", price: 149, badge: "Édition limitée", photo: "pecheurs",
      cats: ["noel", "artisanat", "gourmand", "beaute", "pour-elle", "pour-lui"],
      short: "Notre malle en bois, pour les grandes occasions.",
      desc: "Une malle en bois de teck sculptée, réutilisable, garnie de nos plus belles pièces. Le cadeau d’entreprise ou de famille par excellence.",
      contents: [["Malle en teck sculptée à la main", BJ], ["Tenture appliquée d’Abomey", BJ], ["Rituel karité complet", BJ], ["Épicerie fine : cajou, ananas, bissap", BJ], ["Chocolat noir de manufacture", "France"]],
      origin: "Numérotée, 200 exemplaires.",
    },
    {
      id: "calendrier-avent", name: "Calendrier de l’Avent", price: 119, badge: "Précommande", badgeStyle: "sun", photo: "abomey2",
      cats: ["avent", "noel", "beaute", "gourmand", "made-in-benin"],
      short: "24 jours, 24 trésors du Bénin.",
      desc: "24 fenêtres à ouvrir jusqu’à Noël : beauté, épicerie fine et petits objets d’artisans. Expédition à partir du 15 novembre.",
      contents: [["10 soins (karité, savon noir, huiles…)", BJ], ["9 gourmandises (cajou, ananas, kinkéliba…)", BJ], ["4 objets d’artisans (laiton, pagne…)", BJ], ["1 surprise de Noël", "France"]],
      origin: "Écrin illustré à Cotonou, série numérotée.",
    },
    {
      id: "avent-mini", name: "Petit Avent Gourmand", price: 59, photo: "ananas",
      cats: ["avent", "gourmand", "noel"],
      short: "24 douceurs de nos marchés.",
      desc: "Une version gourmande et plus légère de notre calendrier : 24 bouchées des marchés béninois.",
      contents: [["Cajou, ananas séché, mangue séchée", BJ], ["Klui-klui et caramels de coco", BJ], ["Sachets de kinkéliba et citronnelle", BJ]],
      origin: "Producteurs d’Allada et de Savalou.",
    },
  ];

  // ---------- Utilitaires ----------
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const euro = (n) => `${n.toLocaleString("fr-FR")} €`;
  const catLabel = (slug) => (CATEGORIES.find((c) => c.slug === slug) || {}).label || "";
  const fileUrl = (name, w = 1400) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${w}`;
  const filePage = (name) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ } },
  };

  // Charge une photo, puis essaie les fichiers de secours si elle échoue.
  function setPhoto(img, key, width) {
    const list = PHOTOS[key] || [];
    let i = 0;
    const w = width || Number(img.dataset.w) || 1400;
    img.classList.remove("is-broken");
    img.onerror = () => {
      i += 1;
      if (i < list.length) img.src = fileUrl(list[i], w);
      else img.classList.add("is-broken");
    };
    if (list.length) img.src = fileUrl(list[0], w);
    else img.classList.add("is-broken");
  }
  const photoTag = (key, alt, w = 900, lazy = true) =>
    `<img data-photo="${key}" data-w="${w}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ""}>`;
  function hydratePhotos(root = document) {
    $$("img[data-photo]", root).forEach((img) => {
      if (img.dataset.done) return;
      img.dataset.done = "1";
      setPhoto(img, img.dataset.photo, Number(img.dataset.w) || (img.closest(".hero, .newsletter, .manifesto") ? 2000 : 1200));
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
       <a href="#maison">Notre histoire</a><a href="#carnet">Carnet du Bénin</a><a href="#composer">Sur mesure</a>`;
    $("#filters").innerHTML = CATEGORIES.map((c) =>
      `<button class="chip" role="tab" data-cat="${c.slug}">${esc(c.slug === "tous" ? "Tout" : c.label)}</button>`).join("");
  }

  function renderUniverses() {
    $("#universes").innerHTML = CATEGORIES.filter((c) => c.slug !== "tous").map((c) => `
      <a class="universe${c.size ? " universe--" + c.size : ""}" href="#c/${c.slug}">
        <figure class="ph">${photoTag(c.photo, c.label, c.size === "l" ? 1400 : 900)}</figure>
        <span class="universe__label"><small>${esc(c.tag)}</small><span>${esc(c.label)}</span><i>${esc(c.line)}</i></span>
      </a>`).join("");
  }

  // ---------- Catalogue ----------
  let currentCat = "tous";
  let currentSort = "featured";

  function renderProducts() {
    const cat = CATEGORIES.find((c) => c.slug === currentCat) || CATEGORIES[0];
    $("#collectionTitle").textContent = cat.title || cat.label;
    $("#collectionSub").textContent = cat.sub;
    $$("[data-cat]").forEach((el) => el.classList.toggle("is-active", el.dataset.cat === currentCat));

    let list = currentCat === "tous" ? [...PRODUCTS] : PRODUCTS.filter((p) => p.cats.includes(currentCat));
    if (currentSort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (currentSort === "price-desc") list.sort((a, b) => b.price - a.price);

    $("#productGrid").innerHTML = list.length ? list.map((p, i) => `
      <article class="card" style="animation-delay:${Math.min(i, 8) * 50}ms">
        <figure class="card__media ph" data-open="${p.id}">
          ${p.badge ? `<span class="badge${p.badgeStyle ? " badge--" + p.badgeStyle : ""}">${esc(p.badge)}</span>` : ""}
          ${photoTag(p.photo, p.name)}
          <button class="card__quick" data-add="${p.id}">Ajouter au panier</button>
        </figure>
        <div class="card__body">
          <p class="card__cat">${esc(catLabel(p.cats[0]))}</p>
          <h3 class="card__title" data-open="${p.id}">${esc(p.name)}</h3>
          <p class="card__desc">${esc(p.short)}</p>
          <p class="card__price">${euro(p.price)}</p>
        </div>
      </article>`).join("") : `<p class="empty">Bientôt de nouveaux coffrets dans cet univers.</p>`;
    hydratePhotos($("#productGrid"));
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
    const img = $("#pmImg");
    img.alt = p.name;
    setPhoto(img, p.photo, 1200);
    $("#pmCats").textContent = p.cats.slice(0, 3).map(catLabel).join(" · ");
    $("#pmTitle").textContent = p.name;
    $("#pmPrice").textContent = euro(p.price);
    $("#pmDesc").textContent = p.desc;
    $("#pmContents").innerHTML = p.contents.map(([item, from]) =>
      `<li class="${from === "France" ? "fr" : ""}"><span>${esc(item)}</span><small>${from === BJ ? "Fait au Bénin" : "Touche française"}</small></li>`).join("");
    $("#pmOrigin").textContent = p.origin;
    openLayer($("#productModal"));
  }

  // ---------- Panier ----------
  const FREE_SHIPPING = 80;
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
    const btn = $("#cartBtn");
    btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 400 });
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
        <figure class="ph">${photoTag(p.photo, p.name, 300, false)}</figure>
        <div>
          <p class="line__title">${esc(p.name)}</p>
          <p class="line__price">${euro(p.price)}</p>
          <div class="qty"><button data-dec="${p.id}" aria-label="Retirer un">−</button><span>${l.qty}</span><button data-inc="${p.id}" aria-label="Ajouter un">+</button></div>
        </div>
        <button class="line__remove" data-rm="${p.id}">Retirer</button>
      </div>`;
    }).join("") : `<div class="cart__empty"><p>Votre panier est vide</p><p>Laissez-vous tenter par un peu de Bénin.</p><a class="btn btn--green" href="#c/tous" data-close>Voir les coffrets</a></div>`;
    hydratePhotos($("#cartBody"));

    $("#cartFoot").hidden = cart.length === 0;
    $("#cartTotal").textContent = euro(total);
    const left = FREE_SHIPPING - total;
    $("#cartShip").innerHTML = (left > 0
      ? `Plus que <strong>${euro(left)}</strong> pour la livraison offerte`
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

  // ---------- Calendrier (décor) ----------
  function renderDoors() {
    const order = [7, 14, 3, 21, 10, 1, 18, 5, 24, 12, 9, 16, 2, 20, 11, 6, 23, 15, 4, 19, 8, 13, 22, 17];
    $("#adventDoors").innerHTML = order.map((n) => `<span class="door">${n}</span>`).join("");
  }

  function renderCredits() {
    $("#credits").innerHTML = CREDITS.map(([label, file, author]) =>
      `<li><a href="${filePage(file)}" target="_blank" rel="noopener">${esc(label)}</a>${author ? ` — ${esc(author)}` : ""}, Wikimedia Commons</li>`).join("");
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
    const inc = t.closest("[data-inc]"), dec = t.closest("[data-dec]"), rm = t.closest("[data-rm]");
    if (inc || dec || rm) {
      const id = (inc || dec || rm).dataset[inc ? "inc" : dec ? "dec" : "rm"];
      const line = cart.find((l) => l.id === id);
      if (line) { if (inc) line.qty += 1; else if (dec) line.qty -= 1; else line.qty = 0; }
      saveCart(); renderCart(); return;
    }
    if (t.closest("[data-close]") || t.classList.contains("drawer") || t.classList.contains("modal")) { closeLayers(); }
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
  renderNav();
  renderUniverses();
  renderDoors();
  renderCredits();
  renderProducts();
  renderCart();
  hydratePhotos();
  applyHash(true);
})();
