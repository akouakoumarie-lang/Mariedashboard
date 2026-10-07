/* Cotonou Box — collections, coffrets, recherche, fiche produit et panier */
(() => {
  "use strict";

  // Collections : photo ronde, ou pictogramme cadeau sur fond sable.
  const COLLECTIONS = [
    { slug: "beaute", label: "Beauté", photo: "photos/col-beaute.jpg", sub: "Sublimez votre peau avec les trésors naturels du Bénin." },
    { slug: "gourmand", label: "Gourmand", photo: "photos/col-gourmand.jpg", sub: "Miel, cajou, confitures : les saveurs authentiques du Bénin." },
    { slug: "artisanat", label: "Artisanat", photo: "photos/col-artisanat.jpg", sub: "Pagnes wax et objets d’artisans béninois." },
    { slug: "coffrets", label: "Coffrets cadeaux", photo: "photos/col-coffrets.jpg", sub: "Des coffrets prêts à offrir, composés à la main à Cotonou." },
    { slug: "avent", label: "Calendrier de l’Avent", photo: "photos/col-avent.jpg", sub: "24 jours de découvertes béninoises jusqu’à Noël." },
    { slug: "pour-elle", label: "Pour elle", sub: "Pour une mère, une sœur, une amie." },
    { slug: "pour-lui", label: "Pour lui", sub: "Pour un père, un frère, un ami." },
    { slug: "occasions", label: "Occasions", sub: "Anniversaire, remerciements, fêtes de fin d’année." },
  ];
  const EXTRA = { "made-in-benin": { label: "Made in Benin", sub: "Des coffrets fabriqués au Bénin, de l’écrin au dernier produit." } };

  const PRODUCTS = [
    {
      id: "discovery", name: "Cotonou Discovery Box", price: 49.9, rating: 4.9, reviews: 126, badge: "Meilleure vente",
      photo: "photos/coffret-discovery.jpg",
      cats: ["coffrets", "made-in-benin", "artisanat", "pour-elle", "pour-lui", "occasions"],
      short: "Le meilleur du Bénin dans un seul coffret.",
      desc: "Notre coffret signature, dans son écrin vert et or garni de pagne wax : un voyage complet entre gourmandises, soins et savoir-faire béninois.",
      contents: ["Miel pur du Bénin", "Bougie parfumée", "Huile naturelle", "Noix de cajou grillées", "Pochette en pagne wax", "Carte personnalisée « Akpé, merci »"],
    },
    {
      id: "beaute", name: "Coffret Beauté Béninoise", price: 44.9, rating: 4.8, reviews: 86, badge: "Nouveau",
      photo: "photos/coffret-beaute.jpg",
      cats: ["beaute", "coffrets", "pour-elle", "made-in-benin"],
      short: "Sublimez votre peau avec des trésors naturels.",
      desc: "Un rituel de beauté autour du karité et des huiles naturelles, préparé avec des coopératives de femmes béninoises.",
      contents: ["Savon artisanal", "Beurre de karité", "Huile naturelle", "Petit parfum", "Accessoire beauté", "Carte personnalisée"],
    },
    {
      id: "gourmand", name: "Coffret Gourmand", price: 39.9, rating: 4.9, reviews: 73, badge: "Coup de cœur",
      photo: "photos/coffret-gourmand.jpg",
      cats: ["gourmand", "coffrets", "pour-lui", "made-in-benin", "occasions"],
      short: "Les saveurs authentiques du Bénin.",
      desc: "Les gourmandises de nos marchés, sélectionnées chez de petits producteurs et présentées dans un coffret kraft habillé de wax.",
      contents: ["Miel de mangrove", "Confiture de mangue", "Noix de cajou caramélisées", "Ananas pain de sucre séché", "Épices du marché Dantokpa", "Carte personnalisée"],
    },
    {
      id: "avent", name: "Calendrier de l’Avent", price: 79.9, rating: 5.0, reviews: 42, badge: "Édition limitée",
      photo: "photos/calendrier-avent.jpg",
      cats: ["avent", "coffrets", "occasions", "pour-elle", "pour-lui"],
      short: "24 jours de découvertes béninoises.",
      desc: "24 cases à ouvrir jusqu’à Noël : soins, gourmandises et petits objets d’artisans, pour un voyage quotidien au Bénin.",
      contents: ["10 soins (karité, savon, huiles…)", "9 gourmandises (cajou, ananas, miel…)", "4 objets d’artisans", "1 surprise de Noël"],
    },
  ];

  // ---------- Utilitaires ----------
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const euro = (n) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (id, cls = "ico ico--sm") => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const store = {
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ } },
  };
  function stars(rating) {
    let s = "";
    for (let i = 1; i <= 5; i++) {
      const fill = Math.max(0, Math.min(1, rating - (i - 1)));
      s += `<span class="star" style="--f:${Math.round(fill * 100)}%">★</span>`;
    }
    return s;
  }
  const findColl = (slug) => COLLECTIONS.find((c) => c.slug === slug) || EXTRA[slug];

  // ---------- Collections ----------
  function renderCollections() {
    $("#collectionsRow").innerHTML = COLLECTIONS.map((c) => `
      <a class="coll" href="#coffrets" data-filter="${c.slug}">
        <span class="coll__circle${c.photo ? "" : " coll__circle--icon"}">
          ${c.photo ? `<img src="${c.photo}" alt="" loading="lazy">` : icon("i-gift", "coll__gift")}
        </span>
        <span class="coll__label">${esc(c.label)}</span>
        ${icon("i-arrow", "ico ico--sm coll__arrow")}
      </a>`).join("");
    const links = COLLECTIONS.map((c) => `<a href="#coffrets" data-filter="${c.slug}">${esc(c.label)}</a>`).join("");
    $("#collMenu").innerHTML = links;
    $("#footerCats").innerHTML = COLLECTIONS.map((c) => `<li><a href="#coffrets" data-filter="${c.slug}">${esc(c.label)}</a></li>`).join("");
    $("#mobileNav").innerHTML =
      `<a href="#top">Accueil</a><a href="#coffrets" data-filter="tous">Nos coffrets</a>
       <a href="#coffrets" data-filter="made-in-benin">Made in Benin</a><a href="#a-propos">À propos</a>
       <p class="drawer__sub">Collections</p>${links}`;
  }

  // ---------- Coffrets ----------
  let filter = "tous";
  let query = "";

  function renderProducts() {
    const q = query.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => filter === "tous" || p.cats.includes(filter));
    if (q) list = PRODUCTS.filter((p) => [p.name, p.short, p.desc, ...p.contents].join(" ").toLowerCase().includes(q));

    const coll = findColl(filter);
    $("#featTitle").textContent = q ? `Résultats pour « ${query.trim()} »` : filter === "tous" ? "Nos coffrets phares" : coll.label;
    $("#featSub").textContent = q ? `${list.length} coffret${list.length > 1 ? "s" : ""} trouvé${list.length > 1 ? "s" : ""}.` : filter === "tous" ? "Des créations uniques pour toutes les occasions." : coll.sub;
    $$(".coll").forEach((el) => el.classList.toggle("is-active", !q && el.dataset.filter === filter));

    $("#productGrid").innerHTML = list.length ? list.map((p) => `
      <article class="card">
        <button class="card__media" data-open="${p.id}" aria-label="Voir le détail : ${esc(p.name)}">
          <img src="${p.photo}" alt="${esc(p.name)}" loading="lazy">
          ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
        </button>
        <div class="card__body">
          <h3 class="card__title"><button data-open="${p.id}">${esc(p.name)}</button></h3>
          <p class="card__desc">${esc(p.short)}</p>
          <p class="stars">${stars(p.rating)}<span class="stars__n">${p.rating.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} (${p.reviews})</span></p>
          <p class="card__price">${euro(p.price)}</p>
          <button class="btn btn--green btn--block btn--card" data-add="${p.id}">Ajouter au panier ${icon("i-cart")}</button>
        </div>
      </article>`).join("")
      : `<p class="empty">Aucun coffret ne correspond. <button class="link-arrow" data-filter="tous">Voir tous les coffrets</button></p>`;
  }

  function setFilter(slug) {
    filter = slug || "tous";
    query = "";
    $("#searchInput").value = "";
    renderProducts();
  }

  // ---------- Fiche produit ----------
  let openId = null;
  function openProduct(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    openId = id;
    $("#pmImg").src = p.photo;
    $("#pmImg").alt = p.name;
    $("#pmTitle").textContent = p.name;
    $("#pmStars").innerHTML = `${stars(p.rating)}<span class="stars__n">${p.rating.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} (${p.reviews} avis)</span>`;
    $("#pmPrice").textContent = euro(p.price);
    $("#pmDesc").textContent = p.desc;
    $("#pmContents").innerHTML = p.contents.map((c) => `<li>${esc(c)}</li>`).join("");
    openLayer($("#productModal"));
  }

  // ---------- Panier ----------
  const SHIPPING = 5.9, FREE_FROM = 80;
  let cart = store.get("cotonoubox-cart-v2", []);
  const saveCart = () => store.set("cotonoubox-cart-v2", cart);

  function addToCart(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    const line = cart.find((l) => l.id === id);
    if (line) line.qty += 1; else cart.push({ id, qty: 1 });
    saveCart();
    renderCart();
    toast(`<b>${esc(p.name)}</b> ajouté au panier`);
  }

  function renderCart() {
    cart = cart.filter((l) => PRODUCTS.some((p) => p.id === l.id) && l.qty > 0);
    const count = cart.reduce((s, l) => s + l.qty, 0);
    const sub = cart.reduce((s, l) => s + l.qty * PRODUCTS.find((p) => p.id === l.id).price, 0);
    const ship = sub >= FREE_FROM || sub === 0 ? 0 : SHIPPING;
    $("#cartCount").textContent = `(${count})`;

    $("#cartBody").innerHTML = cart.length ? cart.map((l) => {
      const p = PRODUCTS.find((x) => x.id === l.id);
      return `<div class="line">
        <img src="${p.photo}" alt="">
        <div>
          <p class="line__title">${esc(p.name)}</p>
          <p class="line__price">${euro(p.price)}</p>
          <div class="qty"><button data-dec="${p.id}" aria-label="Retirer un">−</button><span>${l.qty}</span><button data-inc="${p.id}" aria-label="Ajouter un">+</button></div>
        </div>
        <button class="line__remove" data-rm="${p.id}">Retirer</button>
      </div>`;
    }).join("") : `<div class="cart__empty"><p>Votre panier est vide</p><p>Laissez-vous tenter par un peu de Bénin.</p><a class="btn btn--green" href="#coffrets" data-filter="tous" data-close>Voir les coffrets</a></div>`;

    $("#cartFoot").hidden = cart.length === 0;
    $("#cartShip").textContent = ship ? euro(ship) : "Offerte";
    $("#cartTotal").textContent = euro(sub + ship);
  }

  // ---------- Calques ----------
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
  function setMenu(open) {
    $("#collMenu").hidden = !open;
    $("#collToggle").setAttribute("aria-expanded", String(open));
  }

  let toastTimer;
  function toast(html) {
    const t = $("#toast");
    t.innerHTML = html;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 2800);
  }

  // ---------- Événements ----------
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t.closest(".nav__drop")) setMenu(false);
    const add = t.closest("[data-add]");
    if (add) { addToCart(add.dataset.add); return; }
    const open = t.closest("[data-open]");
    if (open) { openProduct(open.dataset.open); return; }
    const f = t.closest("[data-filter]");
    if (f) {
      setFilter(f.dataset.filter);
      setMenu(false);
      if (t.closest(".drawer")) closeLayers();
      if (f.tagName === "BUTTON") $("#coffrets").scrollIntoView({ behavior: "smooth" });
      return;
    }
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

  $("#collToggle").addEventListener("click", () => setMenu($("#collMenu").hidden));
  $("#cartBtn").addEventListener("click", () => openLayer($("#cartDrawer")));
  $("#menuBtn").addEventListener("click", () => openLayer($("#menuDrawer")));
  $("#pmAdd").addEventListener("click", () => { if (openId) { addToCart(openId); closeLayers(); } });
  $("#searchBtn").addEventListener("click", () => {
    const bar = $("#searchBar");
    bar.hidden = !bar.hidden;
    if (!bar.hidden) $("#searchInput").focus();
  });
  $("#searchInput").addEventListener("input", (e) => {
    query = e.target.value;
    renderProducts();
  });
  $("#searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#coffrets").scrollIntoView({ behavior: "smooth" });
  });
  $("#accountBtn").addEventListener("click", () => toast("L’espace client ouvre très bientôt ✦"));
  $("#chatBtn").addEventListener("click", () => toast("Une question sur un coffret ? Écrivez-nous, nous répondons sous 24 h ✦"));
  $("#checkoutBtn").addEventListener("click", () => toast("Merci ✦ Le paiement en ligne ouvre très bientôt. Votre panier est gardé."));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeLayers(); setMenu(false); }
  });

  // ---------- Démarrage ----------
  renderCollections();
  renderProducts();
  renderCart();
})();
