// Textes de prière et mystères du Rosaire (textes liturgiques traditionnels en français).

export const PRAYERS = {
  croix: { title: 'Signe de croix', text: 'Au nom du Père, et du Fils, et du Saint-Esprit. Amen.' },
  credo: {
    title: 'Je crois en Dieu',
    text: 'Je crois en Dieu, le Père tout-puissant, Créateur du ciel et de la terre. Et en Jésus-Christ, son Fils unique, notre Seigneur, qui a été conçu du Saint-Esprit, est né de la Vierge Marie, a souffert sous Ponce Pilate, a été crucifié, est mort et a été enseveli, est descendu aux enfers, le troisième jour est ressuscité des morts, est monté aux cieux, est assis à la droite de Dieu le Père tout-puissant, d’où il viendra juger les vivants et les morts. Je crois en l’Esprit-Saint, à la sainte Église catholique, à la communion des saints, à la rémission des péchés, à la résurrection de la chair, à la vie éternelle. Amen.',
  },
  pater: {
    title: 'Notre Père',
    text: 'Notre Père, qui es aux cieux, que ton nom soit sanctifié, que ton règne vienne, que ta volonté soit faite sur la terre comme au ciel. Donne-nous aujourd’hui notre pain de ce jour. Pardonne-nous nos offenses, comme nous pardonnons aussi à ceux qui nous ont offensés. Et ne nous laisse pas entrer en tentation, mais délivre-nous du Mal. Amen.',
  },
  ave: {
    title: 'Je vous salue Marie',
    text: 'Je vous salue, Marie, pleine de grâce ; le Seigneur est avec vous. Vous êtes bénie entre toutes les femmes, et Jésus, le fruit de vos entrailles, est béni. Sainte Marie, Mère de Dieu, priez pour nous, pauvres pécheurs, maintenant et à l’heure de notre mort. Amen.',
  },
  gloria: {
    title: 'Gloire au Père',
    text: 'Gloire au Père, et au Fils, et au Saint-Esprit, comme il était au commencement, maintenant et toujours, et dans les siècles des siècles. Amen.',
  },
  fatima: {
    title: 'Ô mon Jésus',
    text: 'Ô mon Jésus, pardonnez-nous nos péchés, préservez-nous du feu de l’enfer, conduisez au ciel toutes les âmes, spécialement celles qui ont le plus besoin de votre miséricorde.',
  },
  salve: {
    title: 'Salut, ô Reine',
    text: 'Salut, ô Reine, Mère de miséricorde, notre vie, notre douceur, notre espérance, salut ! Enfants d’Ève, exilés, nous crions vers vous ; vers vous nous soupirons, gémissant et pleurant dans cette vallée de larmes. Ô vous, notre avocate, tournez vers nous vos regards miséricordieux. Et, après cet exil, montrez-nous Jésus, le fruit béni de vos entrailles. Ô clémente, ô miséricordieuse, ô douce Vierge Marie.',
  },
};

export const MYSTERIES = {
  joyeux: {
    label: 'Mystères joyeux',
    adj: 'joyeux',
    list: ['L’Annonciation', 'La Visitation', 'La Nativité', 'La Présentation de Jésus au Temple', 'Le Recouvrement de Jésus au Temple'],
  },
  lumineux: {
    label: 'Mystères lumineux',
    adj: 'lumineux',
    list: ['Le Baptême de Jésus', 'Les Noces de Cana', 'L’Annonce du Royaume de Dieu', 'La Transfiguration', 'L’Institution de l’Eucharistie'],
  },
  douloureux: {
    label: 'Mystères douloureux',
    adj: 'douloureux',
    list: ['L’Agonie de Jésus au jardin des Oliviers', 'La Flagellation', 'Le Couronnement d’épines', 'Le Portement de la Croix', 'La Crucifixion et la mort de Jésus'],
  },
  glorieux: {
    label: 'Mystères glorieux',
    adj: 'glorieux',
    list: ['La Résurrection', 'L’Ascension', 'La Pentecôte', 'L’Assomption de Marie', 'Le Couronnement de Marie'],
  },
};

// Dimanche → samedi
export const MYSTERY_OF_DAY = ['glorieux', 'joyeux', 'douloureux', 'glorieux', 'lumineux', 'douloureux', 'joyeux'];

const ORDINALS = ['Premier', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième'];

// Déroulé complet d'un chapelet : une étape par grain / prière.
export function rosarySteps(setKey) {
  const set = MYSTERIES[setKey] || MYSTERIES.joyeux;
  const steps = [];
  const add = (prayers, label, extra = {}) => steps.push({ prayers, label, ...extra });
  add(['croix', 'credo'], 'Signe de croix · Je crois en Dieu', { bead: 'cross' });
  add(['pater'], 'Notre Père', { bead: 'big' });
  ['pour la foi', 'pour l’espérance', 'pour la charité'].forEach((intention, i) => add(['ave'], `Je vous salue Marie · ${intention}`, { bead: 'small', n: i + 1, of: 3 }));
  add(['gloria'], 'Gloire au Père', { bead: 'none' });
  set.list.forEach((mystery, d) => {
    add([], `${ORDINALS[d]} mystère ${set.adj}`, { mystery, decade: d + 1, bead: 'none' });
    add(['pater'], 'Notre Père', { mystery, decade: d + 1, bead: 'big' });
    for (let i = 1; i <= 10; i++) add(['ave'], 'Je vous salue Marie', { mystery, decade: d + 1, bead: 'small', n: i, of: 10 });
    add(['gloria', 'fatima'], 'Gloire au Père · Ô mon Jésus', { mystery, decade: d + 1, bead: 'none' });
  });
  add(['salve', 'croix'], 'Salut, ô Reine · Signe de croix', { bead: 'cross' });
  return steps;
}

export const NOVENA_TEMPLATES = [
  'Neuvaine à Marie qui défait les nœuds',
  'Neuvaine à la Divine Miséricorde',
  'Neuvaine au Saint-Esprit',
  'Neuvaine à saint Joseph',
  'Neuvaine au Sacré-Cœur',
  'Neuvaine à sainte Rita',
  'Neuvaine à Notre-Dame de Lourdes',
  'Neuvaine de l’Immaculée Conception',
];
