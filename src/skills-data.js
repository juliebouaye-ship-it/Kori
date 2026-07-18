// ============================================================
// Contenu statique du Carnet de Kori
// (identique pour tout le monde → embarqué dans l'appli, pas de BDD)
// Pour ajouter une compétence : un objet dans SKILLS, c'est tout.
// Les prérequis sont un tableau (DAG) — une compétence peut en avoir plusieurs.
// ============================================================

export const CATEGORIES = [
  { id: 'fondations', name: 'Fondations', icon: '🧱', color: '#C0653F' },
  { id: 'balade', name: 'Balade', icon: '🌿', color: '#7C8F5E' },
  { id: 'cerveau', name: 'Cerveau', icon: '🧠', color: '#5B7FA6' },
  { id: 'tours', name: 'Tours', icon: '🎪', color: '#B0648C' },
];

// rating d'une séance → friandises (🦴) gagnées
export const RATINGS = [
  { id: 'dur', label: 'Dur', emoji: '😮‍💨', xp: 2 },
  { id: 'correct', label: 'Correct', emoji: '🙂', xp: 4 },
  { id: 'top', label: 'Au top', emoji: '🤩', xp: 6 },
];

// Paliers globaux (niveau) — basés sur le total cumulé à vie, qui ne baisse jamais
export const TIERS = [
  { min: 0, name: 'Chiot tout fou', emoji: '🐣' },
  { min: 30, name: 'Élève curieuse', emoji: '🌱' },
  { min: 80, name: 'Apprentie appliquée', emoji: '🎓' },
  { min: 160, name: 'Complice confirmée', emoji: '🤝' },
  { min: 280, name: 'Exploratrice sereine', emoji: '🧭' },
  { min: 450, name: 'Kori la légende', emoji: '👑' },
];

// ------------------------------------------------------------
// Journal de balade — pensé pour ZÉRO charge mentale.
// Un seul geste obligatoire après la sortie : taper un niveau de « verre »
// (métaphore du seau qui se remplit / trigger stacking). Lieu et déclencheurs
// sont facultatifs, pour qui veut creuser les patterns.
// ------------------------------------------------------------

// Lieux fournis par l'utilisatrice — sélection en un tap, jamais de texte libre.
// NB : le terrain d'agility se trouve vers le Chemin des lapins mais les
// aboiements portent sur tout le chemin → capturé via le tag « chiens/agility »
// posé sur ce lieu, pas comme un lieu distinct.
export const LOCATIONS = [
  { id: 'foret', label: 'Petite forêt', icon: '🌲' },
  { id: 'amadia', label: 'Lotissement Amadia', icon: '🏘️' },
  { id: 'centre', label: 'Centre ville', icon: '🏙️' },
  { id: 'lidl', label: 'Tour Lidl', icon: '🛒' },
  { id: 'lapins', label: 'Chemin des lapins', icon: '🐇' },
];

// Déclencheurs (tags multi-select facultatifs)
export const WALK_TRIGGERS = [
  { id: 'chat', label: 'Chat', icon: '🐱' },
  { id: 'chien', label: 'Chien', icon: '🐕' },
  { id: 'agility', label: 'Chiens / agility', icon: '🐾' },
  { id: 'velo', label: 'Vélo', icon: '🚲' },
  { id: 'bruit', label: 'Bruit', icon: '🔊' },
  { id: 'autre', label: 'Autre', icon: '❓' },
];

// Niveau du « verre » — un seul tap suffit pour enregistrer la sortie.
export const CUP_LEVELS = [
  {
    id: 'vert',
    emoji: '🟢',
    label: 'Verre presque vide',
    short: 'Sereine',
    color: '#7C8F5E',
    help: 'Sortie tranquille : Kori est restée sous son seuil, elle a pu renifler, répondre, se poser.',
  },
  {
    id: 'jaune',
    emoji: '🟡',
    label: 'Verre à moitié plein',
    short: 'Chargée',
    color: '#D9A441',
    help: 'Un ou deux déclencheurs, un peu d’excitation, mais elle a réussi à redescendre en cours de route.',
  },
  {
    id: 'rouge',
    emoji: '🔴',
    label: 'Verre débordé',
    short: 'Stackée',
    color: '#B6482F',
    help: 'Les déclencheurs se sont accumulés sans récupération (trigger stacking). Le cortisol met 48-72 h à partir : les 1-2 jours suivants gagnent à rester calmes.',
  },
];

// Idées pour les jours de décompression (défi « calme » qui remplace l'exercice intense)
export const CALM_ACTIVITIES = [
  '🔎 Tapis de fouille ou croquettes cachées dans le jardin : le flair fait redescendre l’excitation mieux que la dépense physique.',
  '🦴 Un bon truc à mâcher (fromage de yak, carotte glacée) : mâcher apaise.',
  '🐌 Sortie « sniffari » : longe détendue, allure lente, on la laisse renifler sans objectif ni croisement de chiens.',
  '🧘 Capture du calme sur le tapis : on récompense doucement dès qu’elle se pose, sans rien demander.',
];

// ------------------------------------------------------------
// skill : id · name · category · icon · description (ce que c'est)
//         purpose (à quoi ça sert) · difficulty (1-3) · cost (🦴) · bonus (🦴)
//         prereqs: [ids] · paliers: [{ id, label, criterion }]
// ------------------------------------------------------------
export const SKILLS = [
  // ---------- FONDATIONS ----------
  {
    id: 'assis',
    name: 'Assis',
    category: 'fondations',
    icon: '🪑',
    cue: 'Assis',
    signal: 'Un doigt au-dessus de sa tête.',
    description: 'Kori pose ses fesses au sol sur demande.',
    purpose: 'La position de politesse universelle : la base de presque tout le reste.',
    difficulty: 1,
    cost: 4,
    bonus: 4,
    prereqs: [],
    paliers: [
      { id: 'assis-1', label: 'Assis avec leurre', criterion: 'S’assoit en suivant la friandise, 5 fois de suite.' },
      { id: 'assis-2', label: 'Assis sur demande', criterion: 'S’assoit au mot seul, sans geste, 8 fois sur 10.' },
      { id: 'assis-3', label: 'Assis partout', criterion: 'S’assoit dans 3 pièces différentes et dehors.' },
    ],
  },
  {
    id: 'couche',
    name: 'Couché',
    category: 'fondations',
    icon: '🛏️',
    cue: 'Couché',
    signal: 'Main à plat vers le sol.',
    description: 'Kori se couche entièrement au sol sur demande.',
    purpose: 'Position plus posée que l’assis : première brique du calme durable.',
    difficulty: 1,
    cost: 4,
    bonus: 4,
    prereqs: ['assis'],
    paliers: [
      { id: 'couche-1', label: 'Couché avec leurre', criterion: 'Se couche en suivant la friandise, 5 fois de suite.' },
      { id: 'couche-2', label: 'Couché sur demande', criterion: 'Se couche au mot seul, 8 fois sur 10.' },
      { id: 'couche-3', label: 'Couché qui dure', criterion: 'Reste couchée 30 secondes avant la récompense.' },
    ],
  },
  {
    id: 'panier',
    name: 'Au panier',
    category: 'fondations',
    icon: '🧺',
    description: 'Kori rejoint son panier sur demande et s’y installe.',
    purpose: 'Un endroit refuge où l’envoyer (repas, visites, besoin de calme).',
    difficulty: 1,
    cost: 5,
    bonus: 5,
    prereqs: ['couche'],
    paliers: [
      { id: 'panier-1', label: 'Va au panier montré', criterion: 'Va au panier quand on le montre du doigt.' },
      { id: 'panier-2', label: 'Au panier sur demande', criterion: 'Y va depuis 2 m au mot seul.' },
      { id: 'panier-3', label: 'Y reste', criterion: 'Reste au panier 1 minute pendant qu’on bouge dans la pièce.' },
    ],
  },
  {
    id: 'check',
    name: 'Check (regard)',
    category: 'fondations',
    icon: '👀',
    description: 'Kori croise ton regard sur demande (ou spontanément).',
    purpose: 'Le canal de communication : tout passe par l’attention qu’elle te donne.',
    difficulty: 1,
    cost: 4,
    bonus: 4,
    prereqs: [],
    paliers: [
      { id: 'check-1', label: 'Regard capturé', criterion: 'Récompensée dès qu’elle croise ton regard, 10 fois.' },
      { id: 'check-2', label: 'Check sur demande', criterion: 'Tourne la tête vers toi au mot, 8 fois sur 10 en intérieur.' },
      { id: 'check-3', label: 'Check dehors', criterion: 'Répond au check en balade calme.' },
    ],
  },
  {
    id: 'reste',
    name: 'Pas bouger',
    category: 'fondations',
    icon: '✋',
    cue: 'Pas bouger',
    signal: 'Quatre doigts devant le museau.',
    description: 'Kori tient sa position (assis ou couché) jusqu’au signal de libération.',
    purpose: 'Sécurité (portes, voiture) et self-control : elle apprend à attendre.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: ['assis', 'couche'],
    paliers: [
      { id: 'reste-1', label: '3 secondes', criterion: 'Tient un assis-reste 3 secondes face à toi.' },
      { id: 'reste-2', label: 'Distance', criterion: 'Tient pendant que tu recules de 3 pas et reviens.' },
      { id: 'reste-3', label: 'Distraction', criterion: 'Tient 10 secondes pendant que tu bouges autour d’elle.' },
    ],
  },
  {
    id: 'calme-tapis',
    name: 'Calme sur tapis',
    category: 'fondations',
    icon: '🧘',
    description: 'Kori apprend à se poser et à se détendre vraiment sur son tapis, sans demande permanente.',
    purpose: 'LE chantier de fond : un chien qui sait « ne rien faire ». Base du travail avec le chat.',
    difficulty: 2,
    cost: 8,
    bonus: 10,
    prereqs: ['panier'],
    paliers: [
      { id: 'calme-1', label: 'Le tapis paie', criterion: 'Se pose sur le tapis spontanément (capture du calme, sans ordre).' },
      { id: 'calme-2', label: 'Relâchement', criterion: 'Hanche basculée ou tête posée : signes de vraie détente sur le tapis.' },
      { id: 'calme-3', label: 'Calme ambiant', criterion: 'Reste posée 5 minutes pendant une activité normale de la maison.' },
    ],
  },

  // ---------- BALADE ----------
  {
    id: 'rappel',
    name: 'Rappel',
    category: 'balade',
    icon: '📣',
    cue: 'Viens !',
    signal: 'Main ouverte à côté de la jambe.',
    description: 'Kori revient vers toi dès que tu l’appelles, où qu’elle soit.',
    purpose: 'Priorité n°1 : c’est sa sécurité. Un bon rappel peut lui sauver la vie.',
    note: '🟡 Attendu jusqu’au jaune. En 🔴 (débordée), elle est au-dessus de son seuil : elle ne peut plus répondre, ce n’est pas de la désobéissance. Là on gère (distance, retour au calme), on ne travaille pas le rappel → voir « Décrocher / demi-tour » et le diagnostic 💡.',
    difficulty: 2,
    cost: 8,
    bonus: 12,
    prereqs: ['check'],
    paliers: [
      { id: 'rappel-1', label: 'Le mot magique', criterion: 'Le mot du rappel = fête assurée. 10 associations sans rien demander.' },
      { id: 'rappel-2', label: 'Rappel intérieur', criterion: 'Vient au mot depuis une autre pièce, 8 fois sur 10.' },
      { id: 'rappel-3', label: 'Rappel en longe', criterion: 'Vient en balade calme, en longe de 10 m.' },
      { id: 'rappel-4', label: 'Distractions légères', criterion: 'Vient malgré une odeur intéressante ou un bruit.' },
    ],
  },
  {
    id: 'rappel-repos',
    name: 'Rappel depuis le repos',
    category: 'balade',
    icon: '☀️',
    description: 'Kori se lève et vient même quand elle est confortablement installée (allongée dans l’herbe, au soleil…).',
    purpose: 'Son point de blocage précis : le confort s’auto-récompense, se lever a un coût. C’est un exercice à part entière, distinct du rappel en mouvement.',
    difficulty: 3,
    cost: 12,
    bonus: 15,
    prereqs: ['rappel', 'calme-tapis'],
    paliers: [
      { id: 'rrepos-1', label: 'Debout payé', criterion: 'Se lève quand tu l’appelles depuis une position couchée, à la maison.' },
      { id: 'rrepos-2', label: 'Depuis le confort', criterion: 'Vient alors qu’elle est posée au soleil dehors, en longe.' },
      { id: 'rrepos-3', label: 'Retour au repos', criterion: 'Après le rappel, elle est renvoyée profiter de sa place (récompense de vie).' },
    ],
  },
  {
    id: 'marche-laisse',
    name: 'Marche en laisse',
    category: 'balade',
    icon: '🦮',
    description: 'Kori marche à côté de toi sans tirer, laisse détendue.',
    purpose: 'Des balades agréables pour vous deux — et la porte d’entrée vers la ville.',
    difficulty: 2,
    cost: 8,
    bonus: 10,
    prereqs: ['check'],
    paliers: [
      { id: 'laisse-1', label: 'Laisse détendue', criterion: '10 pas sans tension dans un endroit calme.' },
      { id: 'laisse-2', label: 'Demi-tours', criterion: 'Suit tes changements de direction en gardant la laisse souple.' },
      { id: 'laisse-3', label: 'Balade complète', criterion: 'Une balade courte entière avec la laisse détendue.' },
    ],
  },
  {
    id: 'stop-distance',
    name: 'Stop à distance',
    category: 'balade',
    icon: '🛑',
    description: 'Kori s’assoit ou s’arrête au signal, même loin de toi.',
    purpose: 'Le frein d’urgence complémentaire du rappel (route, danger devant elle).',
    difficulty: 3,
    cost: 12,
    bonus: 12,
    prereqs: ['reste', 'rappel'],
    paliers: [
      { id: 'stop-1', label: 'Stop proche', criterion: 'S’assoit au signal à 2 m de toi.' },
      { id: 'stop-2', label: 'Stop en mouvement', criterion: 'S’arrête alors qu’elle marche vers toi.' },
      { id: 'stop-3', label: 'Stop loin', criterion: 'S’assoit au signal à 10 m.' },
    ],
  },

  {
    id: 'decrocher',
    name: 'Décrocher / demi-tour',
    category: 'balade',
    icon: '↩️',
    cue: 'On y va',
    signal: 'Demi-tour enjoué + voix qui invite.',
    description: 'Kori détache son attention d’un déclencheur (chien, chat, odeur au loin) et fait demi-tour avec toi, avant de basculer au-dessus de son seuil.',
    purpose: 'La réponse à la zone rouge : ce n’est PAS du rappel, c’est de la régulation. On l’aide à redescendre avant le débordement, et à ne jamais laisser une poursuite aboutir. Sert aussi contre la prédation.',
    note: '🟡 C’est l’outil pour rester sous le seuil : on décroche pendant qu’elle PEUT encore penser (vert/jaune), pas une fois débordée. Se travaille en jardin / rue calme, pas besoin d’une vraie balade.',
    difficulty: 2,
    cost: 8,
    bonus: 12,
    prereqs: ['check', 'tu-laisses'],
    paliers: [
      { id: 'decro-1', label: 'Décroche facile', criterion: 'Détache son regard d’un objet peu tentant et revient vers toi sur signal, à la maison.' },
      { id: 'decro-2', label: 'Demi-tour joyeux', criterion: 'Fait demi-tour avec toi de bon cœur sur signal, en balade calme (jeu, pas contrainte).' },
      { id: 'decro-3', label: 'Décroche d’un déclencheur', criterion: 'Repère un chien/chat AU LOIN, décroche et revient, tout en restant sous son seuil (🟢/🟡).' },
    ],
  },

  // ---------- CERVEAU ----------
  {
    id: 'tu-laisses',
    name: 'Tu laisses',
    category: 'cerveau',
    icon: '🚫',
    cue: 'Laisse',
    signal: 'Sans geste (à la voix).',
    description: 'Kori détourne la tête d’un objet convoité sur demande.',
    purpose: 'Self-control face aux tentations (nourriture au sol, objets… et le chat).',
    difficulty: 2,
    cost: 8,
    bonus: 10,
    prereqs: ['check'],
    paliers: [
      { id: 'laisses-1', label: 'Main fermée', criterion: 'Recule devant la friandise cachée dans ta main fermée.' },
      { id: 'laisses-2', label: 'Au sol', criterion: 'Ignore la friandise posée au sol sur demande.' },
      { id: 'laisses-3', label: 'En mouvement', criterion: 'Ignore un objet croisé en marchant.' },
    ],
  },
  {
    id: 'attends',
    name: 'Attends',
    category: 'cerveau',
    icon: '⏳',
    cue: 'Attends',
    signal: 'Main ouverte, quatre doigts collés devant le museau.',
    description: 'Kori marque une pause et patiente jusqu’au signal de libération (avant de manger, de franchir une porte, de sortir de voiture).',
    purpose: 'Le self-control du quotidien : elle apprend à différer, à ne pas se précipiter. Complète « Pas bouger » (tenir une position) par une pause courte avant une action.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: ['assis'],
    paliers: [
      { id: 'attends-1', label: 'La pause main', criterion: 'Marque un arrêt sur « Attends » 2 secondes avant ton « OK » de libération.' },
      { id: 'attends-2', label: 'Avant la gamelle', criterion: 'Attend que tu poses la gamelle et donnes le signal avant de manger.' },
      { id: 'attends-3', label: 'Aux passages', criterion: 'Attend au seuil d’une porte / au bord du trottoir jusqu’au signal.' },
    ],
  },
  {
    id: 'chat-zen',
    name: 'Zen avec le chat',
    category: 'cerveau',
    icon: '🐱',
    description: 'Kori reste détendue en présence du chat, d’abord à distance, puis dans la même pièce.',
    purpose: 'L’objectif cohabitation : une maison où tout le monde circule sans stress.',
    difficulty: 3,
    cost: 12,
    bonus: 18,
    prereqs: ['calme-tapis', 'tu-laisses'],
    paliers: [
      { id: 'chat-1', label: 'Sous le seuil', criterion: 'Reste détendue porte fermée, avec l’odeur et les bruits du chat.' },
      { id: 'chat-2', label: 'Portillon zen', criterion: 'Posée à distance du portillon : regarde le chat, puis se retourne vers toi.' },
      { id: 'chat-3', label: 'Présence courte', criterion: '2 minutes dans la même pièce, chat en hauteur, Kori détendue.' },
      { id: 'chat-4', label: 'Cohabitation guidée', criterion: 'Séances régulières sans fixation ni montée d’excitation.' },
    ],
  },

  // ---------- TOURS ----------
  {
    id: 'patte',
    name: 'Donne la patte',
    category: 'tours',
    icon: '🐾',
    cue: 'Check !',
    signal: 'Montrer la main ouverte avec un geste franc.',
    description: 'Kori pose sa patte dans ta main sur demande.',
    purpose: 'Le tour plaisir par excellence — et utile pour les soins (griffes, pattes).',
    difficulty: 1,
    cost: 5,
    bonus: 5,
    prereqs: ['assis'],
    paliers: [
      { id: 'patte-1', label: 'Patte levée', criterion: 'Lève la patte vers ta main fermée.' },
      { id: 'patte-2', label: 'Patte sur demande', criterion: 'Donne la patte au mot, 8 fois sur 10.' },
      { id: 'patte-3', label: 'Les deux pattes', criterion: 'Alterne patte droite / patte gauche sur demande.' },
    ],
  },
  {
    id: 'tourne',
    name: 'Tourne',
    category: 'tours',
    icon: '🌀',
    description: 'Kori fait un tour complet sur elle-même sur demande.',
    purpose: 'Un tour rigolo qui muscle la proprioception et renforce la complicité.',
    difficulty: 1,
    cost: 5,
    bonus: 5,
    prereqs: ['assis'],
    paliers: [
      { id: 'tourne-1', label: 'Tour avec leurre', criterion: 'Suit la friandise sur un tour complet.' },
      { id: 'tourne-2', label: 'Tour sur demande', criterion: 'Tourne au mot ou au geste seul.' },
      { id: 'tourne-3', label: 'Les deux sens', criterion: 'Tourne à droite et à gauche sur deux mots différents.' },
    ],
  },
  {
    id: 'monte',
    name: 'Monte',
    category: 'tours',
    icon: '⬆️',
    cue: 'Monte',
    signal: 'Appui de la main sur l’endroit où monter.',
    description: 'Kori monte et se pose sur une cible désignée (banc, souche, marche, table de soin).',
    purpose: 'Un ciblage utile ET ludique : gérer les soins (table véto), franchir un obstacle en balade, et canaliser son énergie sur une tâche.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: [],
    paliers: [
      { id: 'monte-1', label: 'Deux pattes', criterion: 'Pose deux pattes sur la cible indiquée en suivant ta main.' },
      { id: 'monte-2', label: 'Monte au mot', criterion: 'Monte entièrement sur la cible au mot + geste.' },
      { id: 'monte-3', label: 'Cibles variées', criterion: 'Monte sur 3 supports différents (banc, souche, marche…).' },
    ],
  },
];

// ------------------------------------------------------------
// Diagnostics : une aide consultable à la demande.
// Question à choix multiple → analyse sourcée + actions concrètes.
// ------------------------------------------------------------
export const DIAGS = [
  {
    id: 'diag-rappel',
    icon: '📣',
    title: 'Le rappel',
    subtitle: 'Pourquoi elle ne revient pas (toujours)',
    question: 'Dans quelle situation le rappel de Kori échoue-t-il le plus ?',
    options: [
      {
        label: 'Quand elle est posée / allongée, bien installée (soleil, herbe…)',
        verdict:
          'Ce n’est pas une distraction classique : c’est un état de confort auto-récompensant. Rester allongée au soleil « paie » toute seule, et se lever a un coût. Ce n’est pas de la désobéissance — le rappel depuis le repos est un exercice à part entière, différent du rappel en mouvement.',
        actions: [
          'Travailler « Rappel depuis le repos » comme une compétence dédiée (elle est dans l’arbre 🌱).',
          'Sortir une récompense de très haute valeur, réservée à cet exercice (fromage, saucisse…).',
          'Après le rappel réussi, la renvoyer profiter de sa place : la suite agréable renforce le fait de venir (principe de Premack).',
          'Commencer à la maison depuis un couché confortable, avant de tenter dehors.',
        ],
        sources: [
          { label: 'Karen Pryor Clicker Training — rappel & renforcement positif', url: 'https://www.clickertraining.com' },
          { label: 'AVSAB — position sur le dressage sans contrainte', url: 'https://avsab.org/resources/position-statements/' },
        ],
      },
      {
        label: 'Quand elle est débordée / surexcitée (zone rouge 🔴)',
        verdict:
          'Ce n’est pas un problème de rappel : c’est un problème d’état. Au-dessus de son seuil, le système limbique (émotion, arousal) prend le dessus sur le cortex préfrontal, et les comportements appris deviennent temporairement inaccessibles. Elle ne t’ignore pas — elle ne peut littéralement plus répondre (un chien débordé ne prend souvent même plus la friandise sous le nez). On n’apprend rien au-dessus du seuil : tant qu’elle est en 🔴, on est en gestion, pas en entraînement. Le rappel n’est attendu que jusqu’au jaune.',
        actions: [
          'Créer de la distance TOUT DE SUITE pour la ramener sous son seuil (vert/jaune), avant toute demande.',
          'Ne pas répéter le mot de rappel dans le rouge : répété sans effet, il s’use (empoisonnement du signal).',
          'Anticiper : décrocher AVANT le débordement — c’est la compétence « Décrocher / demi-tour » (dans l’arbre ↩️).',
          'Travailler la régulation en amont, à froid : « Calme sur tapis », décompression, et attention aux jours à cortisol (48-72 h après une balade 🔴).',
        ],
        sources: [
          { label: 'Whole Dog Journal — le seuil (threshold) chez le chien', url: 'https://www.whole-dog-journal.com/behavior/5-things-to-know-about-a-dogs-threshold/' },
          { label: 'AVSAB — arousal et apprentissage sans contrainte', url: 'https://avsab.org/resources/position-statements/' },
        ],
      },
      {
        label: 'Quand elle joue avec un autre chien ou suit une odeur',
        verdict:
          'Distraction classique : la concurrence est simplement trop forte pour son niveau actuel. Le rappel se construit sur un gradient de difficulté — appeler face à une grosse distraction avant que la base soit solide « use » le mot.',
        actions: [
          'Utiliser une longe de 10 m : elle garantit le succès sans conflit.',
          'Monter le gradient doucement : calme → odeurs → chiens loin → chiens proches.',
          'Ne jamais gronder un retour lent : tout retour est payé, sinon revenir devient risqué pour elle.',
          'Appeler seulement si tu paries qu’elle va réussir — sinon aller la chercher.',
        ],
        sources: [
          { label: 'Karen Pryor Clicker Training — construire un rappel fiable', url: 'https://www.clickertraining.com' },
          { label: 'RSPCA — apprendre le rappel', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
        ],
      },
      {
        label: 'Ça marche à la maison, mais presque jamais dehors',
        verdict:
          'Problème de généralisation : les chiens n’extrapolent pas naturellement. « Viens » dans le salon et « viens » dans un pré plein d’odeurs sont deux exercices différents pour elle.',
        actions: [
          'Refaire les premières étapes du rappel dans chaque nouvel environnement (jardin, rue calme, pré…).',
          'Baisser l’exigence quand le lieu change : distance courte, grosses récompenses.',
          'Multiplier les lieux d’entraînement plutôt que la difficulté dans un seul lieu.',
        ],
        sources: [
          { label: 'ASPCA — principes d’entraînement du chien', url: 'https://www.aspca.org/pet-care/dog-care' },
        ],
      },
      {
        label: 'Un peu partout, même à la maison',
        verdict:
          'Le mot de rappel est peut-être « usé » : répété sans conséquence (ou associé à des choses désagréables comme la fin de la balade), il a perdu sa valeur.',
        actions: [
          'Choisir un mot neuf et le reconditionner de zéro : mot → fête, 10 fois par jour, sans rien demander.',
          'Ne jamais appeler pour quelque chose qu’elle n’aime pas (bain, fin de jeu) — aller la chercher dans ces cas-là.',
          'Payer chaque rappel pendant des mois : c’est un investissement sécurité.',
        ],
        sources: [
          { label: 'Karen Pryor Clicker Training — « empoisonnement » du signal', url: 'https://www.clickertraining.com' },
          { label: 'AVSAB — renforcement positif', url: 'https://avsab.org/resources/position-statements/' },
        ],
      },
    ],
  },
  {
    id: 'diag-chat',
    icon: '🐱',
    title: 'Le chat de la maison',
    subtitle: 'La cohabitation qui coince au portillon',
    question: 'Au portillon, comment Kori réagit-elle face au chat ?',
    options: [
      {
        label: 'Fixée / excitée dès qu’elle le voit',
        verdict:
          'Elle est au-dessus de son seuil : trop près, trop intense. Or la désensibilisation ne fonctionne que sous le seuil — un chien qui fixe n’apprend plus rien, il répète l’excitation. Si après plusieurs semaines elle s’excite encore, c’est le signe que la distance de départ est trop courte ou que la récompense arrive trop tard.',
        actions: [
          'Augmenter nettement la distance au portillon (même si ça veut dire l’autre bout du couloir).',
          'Récompenser aux tout premiers signes d’attention au chat — avant la fixation, pas après.',
          'Séances très courtes (1-2 min) qui se terminent avant la montée d’excitation.',
          'Objectif : regarde le chat → se retourne vers toi = jackpot (pattern « Look at That »).',
        ],
        sources: [
          { label: 'Battersea — présenter chiens et chats', url: 'https://www.battersea.org.uk/pet-advice' },
          { label: 'AVSAB — désensibilisation et contre-conditionnement', url: 'https://avsab.org/resources/position-statements/' },
        ],
      },
      {
        label: 'Calme au début, puis l’excitation monte',
        verdict:
          'La durée est le problème : elle tient un moment sous le seuil, puis la pression s’accumule. Les séances sont probablement trop longues — il faut s’arrêter pendant que c’est encore facile.',
        actions: [
          'Raccourcir : mieux vaut trois séances de 90 secondes qu’une de 10 minutes.',
          'Terminer sur un succès, avant les premiers signes de tension (oreilles, fixité, gémissements).',
          'Alterner avec des pauses sur son tapis de calme, loin du portillon.',
        ],
        sources: [
          { label: 'Battersea — présenter chiens et chats', url: 'https://www.battersea.org.uk/pet-advice' },
        ],
      },
      {
        label: 'Ça va tant que le chat ne bouge pas',
        verdict:
          'Le mouvement est son déclencheur (poursuite). C’est le cas le plus courant chien/chat : un chat statique est « meuble », un chat qui file devient une proie potentielle.',
        actions: [
          'Travailler d’abord avec le chat posé/statique (sur un meuble haut, dans son coin).',
          'Désensibiliser le mouvement à part : jouet qui roule au loin → elle regarde puis te regarde → récompense.',
          'Verrouiller « Tu laisses » avant de passer aux vraies situations de mouvement du chat.',
        ],
        sources: [
          { label: 'Battersea — présenter chiens et chats', url: 'https://www.battersea.org.uk/pet-advice' },
          { label: 'AVSAB — gestion des comportements de poursuite', url: 'https://avsab.org/resources/position-statements/' },
        ],
      },
      {
        label: 'Plutôt calme, mais jamais vraiment détendue',
        verdict:
          'Il reste de la vigilance résiduelle : elle se contient, mais ne se détend pas. C’est déjà un bon niveau — l’étape suivante est de récompenser la détente elle-même, pas seulement l’absence de réaction.',
        actions: [
          'Récompenser les signaux de détente : regard détourné, soupir, se coucher, hanche basculée.',
          'Installer son tapis de calme dans la pièce des séances, comme point d’ancrage.',
          'Laisser toujours au chat une sortie en hauteur : un chat serein aide Kori à l’être.',
        ],
        sources: [
          { label: 'Battersea — présenter chiens et chats', url: 'https://www.battersea.org.uk/pet-advice' },
          { label: 'Kikopup (Emily Larlham) — capture du calme', url: 'https://www.youtube.com/user/kikopup' },
        ],
      },
    ],
  },
  {
    id: 'diag-chats-dehors',
    icon: '🐈‍⬛',
    title: 'Les chats croisés dehors',
    subtitle: 'Ça s’aggrave et ne redescend pas — probablement de la prédation',
    question: 'Comment se passe la réaction de Kori quand elle croise un chat en balade ?',
    options: [
      {
        label: 'Ça empire avec le temps, et elle ne redescend plus de la balade',
        verdict:
          'Signature de l’instinct de prédation, pas de la peur. Contrairement à la réactivité chien-chien (souvent peur ou frustration sociale, qui retombe en 5-10 min), la séquence de chasse (repérer → fixer → poursuivre → attraper) est intrinsèquement gratifiante : chaque occasion de poursuivre — même ratée — verse un shot d’adrénaline et renforce le comportement. D’où l’aggravation dans le temps, et une excitation qui met bien plus longtemps à redescendre. Ce n’est ni de la désobéissance ni de la méchanceté : c’est un système émotionnel différent.',
        actions: [
          'Empêcher toute poursuite d’aboutir : laisse courte, JAMAIS de laisse extensible, demi-tour précoce dès le repérage (avant la fixation).',
          'Gérer d’abord, entraîner ensuite : tant qu’elle est au-dessus du seuil, on est en gestion (on protège), pas en train de construire une compétence.',
          'Anticiper les zones à chats (bordures de jardins, voitures) et changer de trottoir avant qu’elle ne fixe.',
          'Récompenser massivement le désengagement spontané : elle regarde puis revient vers toi = jackpot.',
        ],
        sources: [
          { label: 'Dogs Trust — comprendre la prédation du chien', url: 'https://www.dogstrust.org.uk/dog-advice/training' },
          { label: 'AVSAB — comportements de poursuite', url: 'https://avsab.org/resources/position-statements/' },
        ],
      },
      {
        label: 'Elle fixe et se fige avant de tenter de foncer',
        verdict:
          'Tu vois le tout début de la séquence de chasse (l’« œil » du prédateur). Bonne nouvelle : c’est le moment le plus facile à interrompre — bien plus qu’une fois qu’elle est lancée. La compétence à construire s’appelle le désengagement : réussir à « décrocher » son regard de la cible.',
        actions: [
          'Travailler le désengagement sur un leurre CONTRÔLABLE d’abord (fausse fourrure / jouet à ficelle, perche à leurrer) : bien plus prévisible qu’un vrai chat.',
          'Pattern « regarde → décroche → revient » à distance, en montant la difficulté seulement quand c’est fluide.',
          'Dehors, augmenter la distance jusqu’à ce qu’elle puisse voir le chat sans se figer — c’est ça, son seuil du moment.',
          'Renforcer « Tu laisses » et le rappel comme filets de secours.',
        ],
        sources: [
          { label: 'Karen Pryor Clicker Training — désengagement / “Look at That”', url: 'https://www.clickertraining.com' },
          { label: 'Dogs Trust — training et jeux de leurre', url: 'https://www.dogstrust.org.uk/dog-advice/training' },
        ],
      },
      {
        label: 'Elle a un vrai besoin de courir après quelque chose',
        verdict:
          'La pulsion de chasse est un besoin comportemental normal chez beaucoup de chiens — la refouler complètement ne marche pas. La stratégie qui fonctionne est de lui offrir un exutoire légitime et cadré, pour que la vraie faune devienne moins nécessaire.',
        actions: [
          'Jeux de poursuite cadrés : perche à leurrer (flirt pole), lancer d’un jouet qu’elle rapporte, tir à la corde en récompense.',
          'Mettre ces jeux sous contrôle (départ sur signal, arrêt sur signal) : elle apprend que la chasse a un interrupteur.',
          'Canaliser aussi le flair (pistage, recherche d’objets) : ça sollicite le nez et fatigue mentalement sans dopage à l’adrénaline.',
          'Rythmer : un défouloir « chasse » régulier réduit la pression sur les balades.',
        ],
        sources: [
          { label: 'Dogs Trust — canaliser l’instinct de chasse', url: 'https://www.dogstrust.org.uk/dog-advice/training' },
          { label: 'RSPCA — besoins comportementaux du chien', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
        ],
      },
      {
        label: 'C’est vraiment intense et je me sens dépassée',
        verdict:
          'Quand l’intensité et la durée restent extrêmes malgré une bonne gestion, ce n’est pas un échec de ta part : la prédation est l’un des comportements les plus difficiles à modifier seul, et un accompagnement en direct fait gagner un temps précieux (et évite de renforcer le pattern par erreur).',
        actions: [
          'Chercher un·e éducateur·rice / comportementaliste en méthodes positives (idéalement certifié·e, ex. réseaux CPDT/ABTC, ou vétérinaire comportementaliste).',
          'En attendant, tenir la gestion : équipement sûr (harnais + longe non extensible), éviter les créneaux/lieux à faune, sorties de décompression.',
          'Filmer une séquence (à distance de sécurité) : très utile pour le/la pro.',
          'Écarter une composante médicale/douleur avec le vétérinaire si le changement est brutal.',
        ],
        sources: [
          { label: 'AVSAB — quand consulter un professionnel du comportement', url: 'https://avsab.org/resources/position-statements/' },
          { label: 'RSPCA — trouver un éducateur en méthodes positives', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
        ],
      },
    ],
  },
  {
    id: 'diag-stagne',
    icon: '🧗',
    title: 'Je stagne',
    subtitle: 'Plafond de verre sur un palier (et peur de se lasser)',
    question: 'Comment se passent les séances sur le palier qui bloque ?',
    options: [
      {
        label: 'Elle réussit une fois sur deux, pas plus',
        verdict:
          'La marche est trop haute : entre le palier précédent et celui-ci, il manque des étapes intermédiaires. En éducation positive on dit « be a splitter, not a lumper » — découper plutôt qu’empiler. Un taux de réussite d’environ 80 % est le signal pour monter d’un cran ; à 50 %, on consolide en dessous.',
        actions: [
          'Découper le palier en micro-étapes : si « rappel avec odeur » échoue, essayer « rappel à 2 m de l’odeur », puis 1 m…',
          'Ne monter la difficulté que quand elle réussit ~8 fois sur 10.',
          'Séances très courtes qui se terminent sur une victoire facile.',
          'Noter quand même la séance (« Dur » rapporte aussi des 🦴 — l’effort compte).',
        ],
        sources: [
          { label: 'Karen Pryor Clicker Training — splitting & critères', url: 'https://www.clickertraining.com' },
          { label: 'Kikopup (Emily Larlham) — découper les apprentissages', url: 'https://www.youtube.com/user/kikopup' },
        ],
      },
      {
        label: 'Elle n’y arrive presque jamais',
        verdict:
          'L’environnement est trop dur pour ce stade : distance, durée ou distraction (les « 3 D ») sont montées trop vite. Redescendre d’un palier n’est pas un échec, c’est la route normale — on redescend pour remonter plus solide.',
        actions: [
          'Reprendre le palier précédent quelques jours, jusqu’à ce que ce soit facile et fluide.',
          'Ne changer qu’un seul « D » à la fois : plus loin OU plus longtemps OU plus distrayant, jamais deux en même temps.',
          'Vérifier la récompense : pour un palier dur, croquette ≠ fromage.',
        ],
        sources: [
          { label: 'Karen Pryor Clicker Training — les 3 D', url: 'https://www.clickertraining.com' },
          { label: 'AVSAB — apprentissage sans contrainte', url: 'https://avsab.org/resources/position-statements/' },
        ],
      },
      {
        label: 'Elle y arrivait avant, mais elle régresse',
        verdict:
          'À environ 1 an, Kori est en pleine adolescence canine — une vraie phase, documentée : une étude (Asher et al., 2020) a montré que les chiens adolescents répondent temporairement moins bien aux demandes de leur humain de référence, comme les ados humains. Ça passe. La régression ponctuelle fait aussi partie de tout apprentissage.',
        actions: [
          'Ne pas paniquer ni durcir le ton : c’est une phase, pas une perte de la compétence.',
          'Redescendre de un ou deux paliers pendant quelques jours et « re-payer » généreusement les bases.',
          'Garder les séances courtes et gagnantes pour protéger la motivation (la sienne et la tienne).',
        ],
        sources: [
          { label: 'Asher et al. 2020, Biology Letters — adolescence canine', url: 'https://royalsocietypublishing.org/doi/10.1098/rsbl.2020.0097' },
          { label: 'RSPCA — comportement du jeune chien', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
        ],
      },
      {
        label: 'C’est moi qui n’ai plus envie',
        verdict:
          'La lassitude de l’humain est LE risque n°1 des plans d’entraînement — c’est exactement pour ça que ce carnet existe. La bonne nouvelle : les pauses ne détruisent pas le travail. Une compétence apprise ne s’efface pas en une semaine de vacances, et un chien travaille mieux avec un humain motivé 3 fois par semaine qu’un humain épuisé 2 fois par jour.',
        actions: [
          'Réduire l’objectif : UNE séance de 2 minutes compte (et se note !). La série 🔥 tient tant que tu notes quelque chose dans la journée.',
          'Alterner avec du pur plaisir : un tour rigolo (Donne la patte, Tourne) recharge la motivation des deux côtés.',
          'S’autoriser une vraie pause de quelques jours sans culpabilité, puis reprendre un palier en dessous.',
          'Regarder l’onglet Progrès 📊 : le chemin déjà parcouru est la meilleure friandise pour l’humain.',
        ],
        sources: [
          { label: 'Karen Pryor Clicker Training — motivation du binôme', url: 'https://www.clickertraining.com' },
          { label: 'ASPCA — bonnes pratiques d’entraînement', url: 'https://www.aspca.org/pet-care/dog-care' },
        ],
      },
    ],
  },
  {
    id: 'diag-calme',
    icon: '🧘',
    title: 'Le calme',
    subtitle: 'Elle bouge tout le temps',
    question: 'Que fait Kori quand il ne se passe rien à la maison ?',
    options: [
      {
        label: 'Elle bouge tout le temps, cherche quoi faire',
        verdict:
          'À 2 mois d’adoption, c’est attendu : d’après le repère « 3-3-3 » des refuges (3 jours de décompression, 3 semaines d’apprentissage des routines, 3 mois pour se sentir chez soi), Kori est encore en phase d’ajustement. Et surtout : le calme n’est pas un trait, c’est une compétence qui s’apprend.',
        actions: [
          'Capturer le calme : dès qu’elle se pose d’elle-même, une friandise arrive doucement entre ses pattes (sans un mot).',
          'Travailler « Calme sur tapis » (dans l’arbre 🌱) en micro-séances quotidiennes.',
          'Des routines fixes (repas, balades, siestes aux mêmes heures) accélèrent l’installation.',
        ],
        sources: [
          { label: 'ASPCA — accueillir un chien adopté', url: 'https://www.aspca.org/pet-care/dog-care' },
          { label: 'Kikopup (Emily Larlham) — capturing calmness', url: 'https://www.youtube.com/user/kikopup' },
          { label: 'Dr Karen Overall — Protocol for Relaxation', url: 'https://journeydogtraining.com/karen-overalls-relaxation-protocol/' },
        ],
      },
      {
        label: 'Elle se pose, mais se relève au moindre bruit',
        verdict:
          'Elle dort en veille : son lieu de repos ne lui semble pas encore assez sûr pour un vrai relâchement. Fréquent chez les chiens de refuge qui ont dormi dans le bruit.',
        actions: [
          'Placer le panier dans un coin calme, hors passage, d’où elle voit la pièce sans être surprise.',
          'Ne jamais la déranger quand elle y est : le panier = zone 100 % tranquille, y compris pour les invités.',
          'Récompenser calmement quand elle reste posée malgré un petit bruit.',
        ],
        sources: [
          { label: 'ASPCA — accueillir un chien adopté', url: 'https://www.aspca.org/pet-care/dog-care' },
        ],
      },
      {
        label: 'Elle se pose seulement après beaucoup d’exercice',
        verdict:
          'Attention au piège : l’épuisement n’est pas du calme. Un chien toujours plus exercé devient souvent un athlète toujours plus endurant. La détente vient davantage des activités apaisantes que de la dépense pure.',
        actions: [
          'Ajouter mastication (fromage de yak, carotte…) et léchage (tapis de léchage) : activités naturellement apaisantes.',
          'Remplacer une partie de l’exercice physique par du travail mental (flair, tapis de fouille, petits exercices).',
          'Ritualiser un « temps calme » après chaque activité intense, sur le tapis.',
        ],
        sources: [
          { label: 'Dr Karen Overall — Protocol for Relaxation', url: 'https://journeydogtraining.com/karen-overalls-relaxation-protocol/' },
          { label: 'RSPCA — besoins comportementaux du chien', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
        ],
      },
      {
        label: 'Elle s’ennuie et fait des bêtises',
        verdict:
          'Les « bêtises » d’un jeune chien sont presque toujours des besoins non couverts qui débordent : mâcher, flairer, creuser, déchiqueter sont des comportements normaux qui cherchent une sortie.',
        actions: [
          'Donner des exutoires légitimes : jouets à mâcher variés, cartons à déchiqueter, jeux de flair.',
          'Enrichir les repas : gamelle anti-glouton, nourriture cachée, Kong fourré.',
          'Anticiper : proposer l’occupation avant le moment critique de la journée, pas après la bêtise.',
        ],
        sources: [
          { label: 'RSPCA — enrichissement et besoins du chien', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
          { label: 'ASPCA — comportements du jeune chien', url: 'https://www.aspca.org/pet-care/dog-care' },
        ],
      },
    ],
  },
];

// ------------------------------------------------------------
// Garde-fou : vérifie que le graphe de prérequis est un vrai DAG
// (pas de cycle, pas de prérequis inconnu). Appelé au démarrage en dev.
// ------------------------------------------------------------
export function validateDag(skills = SKILLS) {
  const ids = new Set(skills.map((s) => s.id));
  const errors = [];
  for (const s of skills) {
    for (const p of s.prereqs) {
      if (!ids.has(p)) errors.push(`Prérequis inconnu « ${p} » pour « ${s.id} »`);
    }
  }
  // détection de cycle par DFS
  const state = {}; // 0 = non visité, 1 = en cours, 2 = terminé
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const visit = (id, path) => {
    if (state[id] === 2) return;
    if (state[id] === 1) {
      errors.push(`Cycle détecté : ${[...path, id].join(' → ')}`);
      return;
    }
    state[id] = 1;
    for (const p of byId[id]?.prereqs ?? []) visit(p, [...path, id]);
    state[id] = 2;
  };
  for (const s of skills) visit(s.id, []);
  return errors;
}
