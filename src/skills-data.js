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
  { id: 'sport', name: 'Sport', icon: '🎽', color: '#6E7B8B' },
  { id: 'soins', name: 'Soins', icon: '🩺', color: '#6FA098' },
  { id: 'autonomie', name: 'Autonomie', icon: '🏠', color: '#A8845C' },
];

// rating d'une séance → friandises (🦴) gagnées
export const RATINGS = [
  { id: 'dur', label: 'Dur', emoji: '😮‍💨', xp: 2 },
  { id: 'correct', label: 'Correct', emoji: '🙂', xp: 4 },
  { id: 'top', label: 'Au top', emoji: '🤩', xp: 6 },
];

// Tour rapide : 3-4 ordres demandés en passant, pour voir si ça tient encore.
// Ce n'est pas une séance au rabais — la pratique distribuée (séances courtes
// et espacées) donne une meilleure acquisition et une meilleure rétention que
// les séances longues et rapprochées (Meyer & Ladewig 2008 ; Demant et al.
// 2011). Ça rapporte donc de vraies 🦴 et ça compte comme un jour
// d'entraînement — mais ça ne valide aucun palier : vérifier que 4 ordres
// passent encore ne teste pas un critère du type « 8 fois sur 10 ».
export const QUICK_XP = 2;

// ------------------------------------------------------------
// Bibliothèque de méthodes — écrites UNE fois, réutilisées par les paliers.
// Les mêmes dix façons de faire reviennent sur les 107 paliers : plutôt que
// 107 recettes, chaque palier pointe une méthode + deux lignes sur mesure
// (le décor, le piège). Objectif : que Julie et Kévin retiennent la méthode
// et sachent inventer leurs propres exercices, pas qu'ils suivent une recette.
// `name` en français courant ; `technical` garde le terme du métier pour qui
// veut creuser. C'est ici que vit le sourcing de fond.
// ------------------------------------------------------------
export const METHODS = [
  {
    id: 'association',
    name: 'L’association',
    technical: 'conditionnement classique',
    tagline: 'Une chose en annonce une autre. On ne demande rien.',
    detail:
      'Le mot, l’objet ou le bruit apparaît, et quelque chose d’excellent tombe — sans qu’elle ait rien à faire. On construit une émotion, pas un comportement. C’est ce qui donne un mot de rappel qui la fait décoller, un harnais qu’elle vient chercher, un coupe-griffes qui ne fait plus peur. Condition non négociable : l’association ne doit jamais être trahie, sinon elle se défait plus vite qu’elle ne s’est construite.',
    sources: [
      { label: 'ASPCA — désensibilisation et contre-conditionnement', url: 'https://www.aspca.org/pet-care/dog-care' },
    ],
  },
  {
    id: 'leurre',
    name: 'Le leurre',
    technical: 'luring',
    tagline: 'Sa truffe suit la friandise, le corps suit la truffe.',
    detail:
      'Tu tiens une friandise contre sa truffe et tu la déplaces lentement : la position vient toute seule, sans contrainte et sans un mot. On ne nomme rien tant que le mouvement n’est pas fluide — sinon le mot s’associe à une hésitation.',
    sources: [
      { label: 'AVSAB — position sur les méthodes d’entraînement', url: 'https://avsab.org/resources/position-statements/' },
    ],
  },
  {
    id: 'effacer-leurre',
    name: 'Effacer le leurre',
    technical: 'fading',
    tagline: 'La friandise quitte la main avant que le geste ne rétrécisse.',
    detail:
      'Étape que presque tout le monde saute, et c’est pour ça que tant de chiens n’obéissent que si on a quelque chose dans la main. On fait le même geste avec la main VIDE, on récompense depuis l’autre main, puis on réduit le geste petit à petit. Si elle décroche, c’est qu’on a réduit trop vite.',
    sources: [
      { label: 'AVSAB — position sur les méthodes d’entraînement', url: 'https://avsab.org/resources/position-statements/' },
    ],
  },
  {
    id: 'mot-avant-geste',
    name: 'Le mot avant le geste',
    technical: 'transfert de signal',
    tagline: 'Le mot, une seconde de silence, puis le geste qu’elle connaît.',
    detail:
      'Pour qu’un mot prenne la place d’un geste, il doit le PRÉCÉDER, jamais l’accompagner. Mot, on attend une seconde, puis geste habituel, puis récompense. Au bout de quelques répétitions elle anticipe et répond au mot seul. Dit en même temps que le geste, le mot reste inutile — le chien regarde la main.',
    sources: [
      { label: 'AVSAB — position sur les méthodes d’entraînement', url: 'https://avsab.org/resources/position-statements/' },
    ],
  },
  {
    id: '3d',
    name: 'Les 3 D',
    technical: 'durée, distance, distraction',
    tagline: 'On complique une seule chose à la fois.',
    detail:
      'Un exercice se durcit sur trois axes : la durée, la distance, la distraction. On n’en monte qu’un, et on redescend les deux autres au minimum quand on attaque le troisième. Presque tous les « il ne le fait plus » viennent d’avoir monté deux axes en même temps.',
    sources: [
      { label: 'RSPCA — comportement et apprentissage du chien', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
    ],
  },
  {
    id: 'faconnement',
    name: 'Le façonnement',
    technical: 'shaping',
    tagline: 'On paye ce qui ressemble un peu, puis un peu plus.',
    detail:
      'Quand le comportement final est trop loin pour être leurré, on récompense les approximations : un regard vers l’objet, un pas vers lui, une patte dessus. On ne monte l’exigence que lorsque l’étape en cours tombe facilement. Si elle sèche trois fois de suite, c’est qu’on a sauté une marche : on redescend, ce n’est pas un échec.',
    sources: [
      { label: 'Meyer & Ladewig 2008 — fréquence des séances et apprentissage', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0168159107001943' },
    ],
  },
  {
    id: 'capture',
    name: 'La capture',
    technical: 'capturing',
    tagline: 'Elle le fait toute seule, tu le payes.',
    detail:
      'Rien à demander : on guette le comportement spontané (elle se couche, elle te regarde, elle se pose) et on le marque au moment exact où il arrive. C’est la méthode la moins fatigante des deux côtés, et la meilleure pour tout ce qui touche au calme — parce qu’on ne peut pas ordonner à un chien d’être détendu.',
    sources: [
      { label: 'Dr Karen Overall — Protocol for Relaxation', url: 'https://journeydogtraining.com/karen-overalls-relaxation-protocol/' },
    ],
  },
  {
    id: 'generaliser',
    name: 'Généraliser',
    technical: 'généralisation',
    tagline: 'Un chien n’apprend pas « assis », il apprend « assis dans la cuisine ».',
    detail:
      'Le contexte fait partie de ce qu’elle a appris : nouvelle pièce, nouveau sol, toi debout au lieu d’assise, une autre personne qui demande. À chaque changement, on redescend l’exigence de deux crans et ça remonte très vite. Ce n’est pas de la désobéissance, c’est un exercice qu’elle n’a jamais fait.',
    sources: [
      { label: 'RSPCA — comportement et apprentissage du chien', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
    ],
  },
  {
    id: 'contre-conditionnement',
    name: 'Changer l’émotion',
    technical: 'contre-conditionnement / désensibilisation',
    tagline: 'Le truc qui l’inquiète annonce le meilleur moment de la journée.',
    detail:
      'On ne demande RIEN. Le déclencheur apparaît à une intensité où elle le remarque sans se crisper, et le poulet tombe. Il disparaît, le poulet s’arrête. On travaille l’émotion, pas l’obéissance. Si elle est trop près pour manger, on est trop près : on recule, c’est tout.',
    sources: [
      { label: 'ASPCA — désensibilisation et contre-conditionnement', url: 'https://www.aspca.org/pet-care/dog-care' },
    ],
  },
  {
    id: 'premack',
    name: 'La récompense de vie',
    technical: 'principe de Premack',
    tagline: 'La récompense, c’est l’accès à ce qu’elle voulait déjà.',
    detail:
      'Elle veut aller renifler, dire bonjour, retourner au soleil. Au lieu de lutter contre cette envie, on la vend : elle donne le comportement, et l’envie est exaucée. C’est ce qui rend un rappel fiable dehors — revenir doit rendre la balade meilleure, jamais l’interrompre.',
    sources: [
      { label: 'RSPCA — comportement et apprentissage du chien', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour' },
    ],
  },
  {
    id: 'decoupage',
    name: 'Découper',
    technical: 'splitting',
    tagline: 'Trop dur trois fois de suite : la marche est trop haute.',
    detail:
      'Le réflexe quand ça bloque est de répéter plus fort. Le bon geste est de couper l’exercice en deux et de payer la moitié. On perd cinq minutes, on gagne trois séances. C’est la réponse à peu près universelle à « elle ne comprend pas ».',
    sources: [
      { label: 'Demant et al. 2011 — durée des séances, acquisition et mémoire', url: 'https://www.sciencedirect.com/science/article/abs/pii/S016815911100181X' },
    ],
  },
];

export const METHOD_BY_ID = Object.fromEntries(METHODS.map((m) => [m.id, m]));

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

// Lieux de balade HISTORIQUES — ne servent plus qu'à migrer un carnet existant.
// ------------------------------------------------------------
// Les lieux vivent désormais DANS le carnet (`state.places`) et non dans le
// code : la liste se construit toute seule au fil des balades, ce qui évite à la
// fois une saisie initiale fastidieuse et le fait de coder en dur les habitudes
// d'un seul foyer. Ce tableau ne sert qu'à retrouver le libellé des balades déjà
// enregistrées avec ces identifiants (voir `ensurePlaces` dans domain.js).
// NB : le terrain d'agility se trouve vers le Chemin des lapins mais les
// aboiements portent sur tout le chemin → capturé via le tag « chiens/agility »
// posé sur ce lieu, pas comme un lieu distinct.
export const LEGACY_LOCATIONS = [
  { id: 'foret', label: 'Petite forêt', icon: '🌲' },
  { id: 'amadia', label: 'Lotissement Amadia', icon: '🏘️' },
  { id: 'centre', label: 'Centre ville', icon: '🏙️' },
  { id: 'lidl', label: 'Tour Lidl', icon: '🛒' },
  { id: 'lapins', label: 'Chemin des lapins', icon: '🐇' },
];

// Icône par défaut d'un lieu créé à la volée.
export const PLACE_ICON = '📍';

// Durées de balade proposées en un tap. Facultatif : on peut très bien
// enregistrer une sortie sans durée. Stockées en MINUTES pour rester
// exploitables (moyennes, corrélation avec le niveau du verre) — d'où l'absence
// de seau ouvert type « 1 h + », qui ne se moyenne pas honnêtement.
export const WALK_DURATIONS = [
  { min: 10, label: '10 min' },
  { min: 20, label: '20 min' },
  { min: 30, label: '30 min' },
  { min: 45, label: '45 min' },
  { min: 60, label: '1 h' },
  { min: 90, label: '1 h 30' },
];

// Déclencheurs (tags multi-select facultatifs)
export const WALK_TRIGGERS = [
  { id: 'chat', label: 'Chat', icon: '🐱' },
  { id: 'chien', label: 'Chien', icon: '🐕' },
  { id: 'velo', label: 'Vélo', icon: '🚲' },
  { id: 'bruit', label: 'Bruit', icon: '🔊' },
  // Journée sociale (repas de famille, apéro chez des amis…). C'est un tag
  // d'observation, jamais un déclencheur : une longue journée chez des gens
  // n'est PAS un verre rouge en soi. Excitation n'est pas détresse, et un
  // chien qui aime les gens peut passer 4 h en visite et rentrer serein.
  // Le niveau reste ce que Julie a vu, jamais ce que l'appli déduit.
  { id: 'monde', label: 'Monde / invités', icon: '🎉' },
  // « Autre » ouvre la note de la sortie : ce qu'on y écrit s'affiche ensuite
  // dans le journal, sinon le tag ne dirait rien trois semaines plus tard.
  { id: 'autre', label: 'Autre', icon: '❓' },
];

// Déclencheurs retirés du sélecteur mais encore présents dans l'historique :
// on garde de quoi les afficher, pour qu'une ancienne balade ne perde pas
// silencieusement son tag.
export const RETIRED_TRIGGERS = [{ id: 'agility', label: 'Chiens / agility', icon: '🐾' }];

// Identifiant du tag « Autre » — celui qui déclenche la saisie libre.
export const OTHER_TRIGGER = 'autre';

// Niveau du « verre » — un seul tap suffit pour enregistrer la sortie.
export const CUP_LEVELS = [
  {
    id: 'vert',
    emoji: '🟢',
    label: 'Verre presque vide',
    short: 'Sereine',
    color: '#7C8F5E',
  },
  {
    id: 'jaune',
    emoji: '🟡',
    label: 'Verre à moitié plein',
    short: 'Chargée',
    color: '#D9A441',
  },
  {
    id: 'rouge',
    emoji: '🔴',
    label: 'Verre débordé',
    short: 'Stackée',
    color: '#B6482F',
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
    signal: '',
    description: 'Kori pose ses fesses au sol sur demande.',
    purpose: 'La position de politesse universelle : la base de presque tout le reste.',
    difficulty: 1,
    cost: 4,
    bonus: 4,
    prereqs: [],
    paliers: [
      {
        id: 'assis-1',
        label: 'Assis avec leurre',
        criterion: 'S’assoit en suivant la friandise, 5 fois de suite.',
        how: {
          method: 'leurre',
          setup: 'Cuisine, 5 friandises, 2 minutes.',
          pitfall: 'Lever la friandise trop haut : elle décolle les pattes avant au lieu de poser les fesses.',
        },
      },
      {
        id: 'assis-2',
        label: 'Assis sur demande',
        criterion: 'S’assoit au mot seul, sans geste, 8 fois sur 10.',
        how: {
          method: 'mot-avant-geste',
          setup: 'Même endroit, main vide, 10 répétitions.',
          pitfall: 'Dire « Assis » en même temps que le geste : le mot ne sert alors à rien.',
        },
      },
      {
        id: 'assis-3',
        label: 'Assis partout',
        criterion: 'S’assoit dans 3 pièces différentes et dehors.',
        how: {
          method: 'generaliser',
          setup: 'Une pièce nouvelle par séance, 5 répétitions.',
          pitfall: 'Attendre le même résultat qu’à la cuisine dès le premier essai.',
        },
      },
    ],
  },
  {
    id: 'couche',
    name: 'Couché',
    category: 'fondations',
    icon: '🛏️',
    cue: 'Couché',
    signal: '',
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
      {
        id: 'check-1',
        label: 'Regard capturé',
        criterion: 'Récompensée dès qu’elle croise ton regard, 10 fois.',
        how: {
          method: 'capture',
          setup: 'N’importe où, friandises en poche, on guette sans rien demander.',
          pitfall: 'Appeler son nom pour provoquer le regard : c’est elle qui doit l’offrir.',
        },
      },
      {
        id: 'check-2',
        label: 'Check sur demande',
        criterion: 'Tourne la tête vers toi au mot, 8 fois sur 10 en intérieur.',
        how: {
          method: 'mot-avant-geste',
          setup: 'Salon au calme, 10 répétitions.',
          pitfall: 'Répéter le mot quand elle ne répond pas : il perd sa valeur à chaque fois.',
        },
      },
      {
        id: 'check-3',
        label: 'Check dehors',
        criterion: 'Répond au check en balade calme.',
        how: {
          method: 'generaliser',
          setup: 'Balade calme, 5 essais, rien d’autre au programme.',
          pitfall: 'Le tenter au moment le plus excitant de la sortie.',
        },
      },
    ],
  },
  {
    id: 'reste',
    name: 'Pas bouger',
    category: 'fondations',
    icon: '✋',
    cue: 'Pas bouger',
    signal: '',
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
    signal: '',
    description: 'Kori revient vers toi dès que tu l’appelles, où qu’elle soit.',
    purpose: 'Priorité n°1 : c’est sa sécurité. Un bon rappel peut lui sauver la vie.',
    note: '🟡 Attendu jusqu’au jaune. En 🔴 (débordée), elle est au-dessus de son seuil : elle ne peut plus répondre, ce n’est pas de la désobéissance. Là on gère (distance, retour au calme), on ne travaille pas le rappel → voir « Décrocher / demi-tour » et le diagnostic 💡.',
    difficulty: 2,
    cost: 8,
    bonus: 12,
    prereqs: ['check'],
    paliers: [
      {
        id: 'rappel-1',
        label: 'Le mot magique',
        criterion: 'Le mot du rappel = fête assurée. 10 associations sans rien demander.',
        how: {
          method: 'association',
          setup: 'Maison, 10 morceaux de poulet. Tu dis le mot, le poulet tombe. Elle n’a rien à faire.',
          pitfall: 'Utiliser ce mot pour autre chose que la fête — le bain, la fin de la balade, une réprimande.',
        },
      },
      {
        id: 'rappel-2',
        label: 'Rappel intérieur',
        criterion: 'Vient au mot depuis une autre pièce, 8 fois sur 10.',
        how: {
          method: '3d',
          setup: 'Cuisine vers salon. 10 friandises, 3 minutes. On ne monte que la distance.',
          pitfall: 'L’appeler quand elle est déjà occupée à autre chose : c’est de la distraction, pas de la distance.',
        },
      },
      {
        id: 'rappel-3',
        label: 'Rappel en longe',
        criterion: 'Vient en balade calme, en longe de 10 m.',
        how: {
          method: 'generaliser',
          setup: 'Longe de 10 m, endroit connu et calme, 5 rappels maximum sur la sortie.',
          pitfall: 'Rappeler pour rentrer : le mot devient l’annonce que la balade s’arrête.',
        },
      },
      {
        id: 'rappel-4',
        label: 'Distractions légères',
        criterion: 'Vient malgré une odeur intéressante ou un bruit.',
        how: {
          method: '3d',
          setup: 'Endroit déjà connu, une seule distraction choisie, distance courte.',
          pitfall: 'Monter la distraction et la distance en même temps.',
        },
      },
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
      {
        id: 'rrepos-1',
        label: 'Debout payé',
        criterion: 'Se lève quand tu l’appelles depuis une position couchée, à la maison.',
        how: {
          method: 'faconnement',
          setup: 'Elle est couchée. Tu appelles. Tu payes le simple fait qu’elle se lève.',
          pitfall: 'Attendre qu’elle arrive jusqu’à toi avant de payer : c’est le décollage qui est dur, pas le trajet.',
        },
      },
      {
        id: 'rrepos-2',
        label: 'Depuis le confort',
        criterion: 'Vient alors qu’elle est posée au soleil dehors, en longe.',
        how: {
          method: 'premack',
          setup: 'Jardin, elle est installée au soleil, longe. 3 essais maximum.',
          pitfall: 'Lui faire regretter d’être venue. Si revenir coûte sa place au soleil, elle arbitrera contre toi.',
        },
      },
      {
        id: 'rrepos-3',
        label: 'Retour au repos',
        criterion: 'Après le rappel, elle est renvoyée profiter de sa place (récompense de vie).',
        how: {
          method: 'premack',
          setup: 'Tu rappelles, tu payes, et tu la renvoies aussitôt à son coin. Le rappel rend sa place meilleure.',
          pitfall: 'La garder près de toi après le rappel : c’est exactement ce qu’elle cherchait à éviter.',
        },
      },
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
      {
        id: 'laisse-1',
        label: 'Laisse détendue',
        criterion: '10 pas sans tension dans un endroit calme.',
        how: {
          method: 'faconnement',
          setup: 'Jardin ou couloir. 10 pas. Tu t’arrêtes net dès que ça tire, tu repars dès que ça se détend.',
          pitfall: 'Avancer alors que la laisse est tendue : chaque pas dans ces conditions paye la traction.',
        },
      },
      {
        id: 'laisse-2',
        label: 'Demi-tours',
        criterion: 'Suit tes changements de direction en gardant la laisse souple.',
        how: {
          method: 'faconnement',
          setup: 'Endroit calme, changements de direction fréquents et imprévisibles, sur 5 minutes.',
          pitfall: 'Tirer sur la laisse pour la faire tourner au lieu de l’appeler et de payer le suivi.',
        },
      },
      {
        id: 'laisse-3',
        label: 'Balade complète',
        criterion: 'Une balade courte entière avec la laisse détendue.',
        how: {
          method: 'generaliser',
          setup: 'La plus courte et la plus calme de vos balades, à une heure creuse.',
          pitfall: 'Tester ça un jour chargé, ou sur un trajet plein de croisements.',
        },
      },
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
    signal: '',
    description: 'Kori détache son attention d’un déclencheur (chien, chat, odeur au loin) et fait demi-tour avec toi, avant de basculer au-dessus de son seuil.',
    purpose: 'La réponse à la zone rouge : ce n’est PAS du rappel, c’est de la régulation. On l’aide à redescendre avant le débordement, et à ne jamais laisser une poursuite aboutir. Sert aussi contre la prédation.',
    note: '🟡 C’est l’outil pour rester sous le seuil : on décroche pendant qu’elle PEUT encore penser (vert/jaune), pas une fois débordée. Se travaille en jardin / rue calme, pas besoin d’une vraie balade.',
    difficulty: 2,
    cost: 8,
    bonus: 12,
    prereqs: ['check', 'tu-laisses'],
    paliers: [
      {
        id: 'decro-1',
        label: 'Décroche facile',
        criterion: 'Détache son regard d’un objet peu tentant et revient vers toi sur signal, à la maison.',
        how: {
          method: 'faconnement',
          setup: 'Maison, un objet sans grand intérêt posé au sol. Tu payes le moment où elle s’en détourne, 10 essais.',
          pitfall: 'Cacher l’objet ou la tirer quand elle le fixe : c’est elle qui doit choisir de décrocher.',
        },
      },
      {
        id: 'decro-2',
        label: 'Demi-tour joyeux',
        criterion: 'Fait demi-tour avec toi de bon cœur sur signal, en balade calme (jeu, pas contrainte).',
        how: {
          method: 'association',
          setup: 'Balade calme, sans rien à éviter. Le signal du demi-tour annonce une course et une friandise.',
          pitfall: 'Ne l’utiliser que lorsqu’il y a un problème : le signal devient l’annonce d’une mauvaise nouvelle.',
        },
      },
      {
        id: 'decro-3',
        label: 'Décroche d’un déclencheur',
        criterion: 'Repère un chien/chat AU LOIN, décroche et revient, tout en restant sous son seuil (🟢/🟡).',
        how: {
          method: 'contre-conditionnement',
          setup: 'La distance où elle repère le déclencheur ET accepte encore de manger. Souvent bien plus loin qu’on ne croit.',
          pitfall: 'Se rapprocher parce que « ça se passe bien ». Si elle refuse la friandise, on était déjà trop près.',
        },
      },
    ],
  },

  // ---------- CERVEAU ----------
  {
    id: 'tu-laisses',
    name: 'Tu laisses',
    category: 'cerveau',
    icon: '🚫',
    cue: 'Laisse',
    signal: '',
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
    signal: '',
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
    signal: '',
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
    signal: '',
    description: 'Kori monte et se pose sur une cible désignée (banc, souche, marche, table de soin).',
    purpose: 'Un ciblage utile ET ludique : gérer les soins (table véto), franchir un obstacle en balade, et canaliser son énergie sur une tâche.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: [],
    paliers: [
      {
        id: 'monte-1',
        label: 'Deux pattes',
        criterion: 'Pose deux pattes sur la cible indiquée en suivant ta main.',
        how: {
          method: 'leurre',
          setup: 'Une cible basse et stable (marche, caisse). Ta main guide, 5 essais.',
          pitfall: 'Une cible qui bouge ou qui glisse : une seule mauvaise surprise et elle n’y remonte plus.',
        },
      },
      {
        id: 'monte-2',
        label: 'Monte au mot',
        criterion: 'Monte entièrement sur la cible au mot + geste.',
        how: {
          method: 'mot-avant-geste',
          setup: 'Même cible, 10 répétitions. Le mot, une seconde, puis l’appui de la main.',
          pitfall: 'Enchaîner les répétitions sans pause : monter et descendre fatigue plus que ça n’en a l’air.',
        },
      },
      {
        id: 'monte-3',
        label: 'Cibles variées',
        criterion: 'Monte sur 3 supports différents (banc, souche, marche…).',
        how: {
          method: 'generaliser',
          setup: 'Un nouveau support par séance, en commençant par le plus bas et le plus stable.',
          pitfall: 'Passer à une cible haute ou instable trop vite — on généralise la surface, pas la difficulté.',
        },
      },
    ],
  },

  // ---------- SPORT (cani-rando) ----------
  // Kori est une Amstaff : muscle dense + museau court = mauvaise dissipation
  // de la chaleur, donc pas de course d'endurance (avis véto). En revanche le
  // bull-and-terrier est bâti pour la traction courte et puissante : la
  // cani-rando (traction à allure de marche) lui va bien mieux que le canicross.
  // Presque tout se travaille À VIDE : seuls les paliers qui chargent réellement
  // les épaules portent un `gate` (feu vert véto, plaques de croissance).
  {
    id: 'harnais',
    name: 'Le harnais de traction',
    category: 'sport',
    icon: '🦺',
    cue: 'Harnais',
    signal: '',
    description: 'Kori se présente au harnais de traction et le porte sans gêne, détendue.',
    purpose:
      'Le harnais est le signal qui ouvre tout le reste : il dit « ici, tirer est autorisé ». Un chien qui le subit ne tirera jamais franchement.',
    note:
      'Harnais en X ou en Y avec attache dans l’axe du dos : il dégage les épaules. Un harnais de balade anti-traction ferait exactement l’inverse.',
    difficulty: 1,
    cost: 6,
    bonus: 6,
    prereqs: [],
    paliers: [
      { id: 'harnais-1', label: 'Le harnais est sympa', criterion: 'Met la tête dedans d’elle-même pour attraper une friandise, 5 fois.' },
      { id: 'harnais-2', label: 'Porté sans gêne', criterion: 'Le porte 5 minutes à la maison sans se figer, se gratter ni le mordiller.' },
      { id: 'harnais-3', label: 'Harnais = on y va', criterion: 'Vient se présenter au harnais quand tu le sors, et reste calme le temps de l’attacher.' },
    ],
  },
  {
    id: 'allez',
    name: 'Allez (partir devant)',
    category: 'sport',
    icon: '➡️',
    cue: 'Allez',
    signal: '',
    description: 'Au mot, Kori part devant toi et se met en tension légère dans la longe.',
    purpose:
      'Le cœur de la cani-rando : tirer devient un comportement demandé, pas une bagarre. C’est aussi ce qui protège la marche en laisse — le harnais autorise, le collier interdit.',
    note:
      'Discrimination par le matériel : harnais de traction = tirer autorisé, laisse ou collier = marche au pied. Ne mélange jamais les deux dans la même sortie tant que la distinction n’est pas nette.',
    difficulty: 2,
    cost: 10,
    bonus: 10,
    prereqs: ['harnais'],
    paliers: [
      { id: 'allez-1', label: 'Suivre une cible', criterion: 'Avance de 5 mètres devant toi pour rejoindre une personne ou une gamelle, en harnais.' },
      { id: 'allez-2', label: 'Partir au mot', criterion: 'Part devant au mot « Allez » seul, sur 20 mètres, 8 fois sur 10.' },
      {
        id: 'allez-3',
        label: 'Tension légère tenue',
        criterion: 'Maintient une tension douce et régulière sur 100 mètres, sans se retourner.',
        gate: 'traction',
      },
    ],
  },
  {
    id: 'directions',
    name: 'Droite / Gauche',
    category: 'sport',
    icon: '↔️',
    cue: 'Droite / Gauche',
    signal: '',
    description: 'Kori change de direction au mot, sans que tu aies à la guider physiquement.',
    purpose:
      'Sur un sentier, c’est ce qui rend la rando fluide : bifurcation, contournement, se ranger sur le côté. Et ça évite de corriger à la longe.',
    difficulty: 3,
    cost: 12,
    bonus: 12,
    prereqs: ['allez'],
    paliers: [
      { id: 'directions-1', label: 'Un mot par côté', criterion: 'Suit un leurre à droite ou à gauche pendant que tu dis le mot, 10 fois par côté.' },
      { id: 'directions-2', label: 'Bifurcation évidente', criterion: 'Prend le bon côté à un vrai embranchement en Y, 7 fois sur 10.' },
      { id: 'directions-3', label: 'Au mot seul', criterion: 'Change de côté au mot seul, sans geste ni ralentissement, sur 3 sentiers différents.' },
    ],
  },
  {
    id: 'stop-traction',
    name: 'Stop et Doucement',
    category: 'sport',
    icon: '🛑',
    cue: 'Stop / Doucement',
    signal: '',
    description: 'Kori s’arrête net ou ralentit franchement au mot, même en tension.',
    purpose:
      'C’est le frein, et c’est la compétence de sécurité de la branche : descente, croisement, sentier étroit, obstacle surprise. À travailler avant d’allonger les distances.',
    note:
      'Le frein se travaille toujours avant la puissance. Un chien de 21 kg en tension qui n’a pas de « Stop » fiable, c’est toi qui décides de rien.',
    difficulty: 2,
    cost: 10,
    bonus: 10,
    prereqs: ['allez'],
    paliers: [
      { id: 'stop-traction-1', label: 'Stop à l’arrêt', criterion: 'S’arrête et attend au mot, en harnais, sans tension, 8 fois sur 10.' },
      { id: 'stop-traction-2', label: 'Stop en mouvement', criterion: 'S’arrête au mot alors qu’elle avance devant toi, 8 fois sur 10.' },
      { id: 'stop-traction-3', label: 'Doucement', criterion: 'Réduit visiblement l’allure au mot « Doucement » et tient le rythme 20 mètres.' },
    ],
  },
  {
    id: 'devant',
    name: 'Rester devant',
    category: 'sport',
    icon: '🧭',
    cue: 'Devant',
    signal: '',
    description: 'Kori tient sa place devant toi sans se retourner, s’emmêler ni partir renifler.',
    purpose:
      'Ce qui distingue une vraie cani-rando d’une promenade chaotique. C’est aussi ce qui évite qu’elle se prenne la longe dans les pattes.',
    difficulty: 2,
    cost: 10,
    bonus: 10,
    prereqs: ['allez'],
    paliers: [
      { id: 'devant-1', label: 'Ne pas se retourner', criterion: 'Reste orientée vers l’avant sur 50 mètres quand tu parles ou t’arrêtes.' },
      { id: 'devant-2', label: 'Ignorer une odeur', criterion: 'Passe devant une zone odorante sans s’arrêter, au mot, 7 fois sur 10.' },
      { id: 'devant-3', label: 'Sentier complet', criterion: 'Tient sa place sur un sentier entier, longe jamais emmêlée.', gate: 'traction' },
    ],
  },
  {
    id: 'croiser-traction',
    name: 'Croiser en traction',
    category: 'sport',
    icon: '🐕‍🦺',
    cue: '',
    signal: '',
    description: 'Kori croise un chien, un vélo ou un joggeur en restant dans son travail, sans dévier.',
    purpose:
      'Sans ça, chaque croisement transforme la rando en gestion. C’est ici que la branche Sport rejoint le travail de balade.',
    note:
      'En tension, une réaction est bien plus difficile à récupérer qu’en laisse. Tant que le croisement n’est pas net à vide, on se range et on laisse passer : c’est de la gestion, et c’est très bien.',
    difficulty: 3,
    cost: 14,
    bonus: 14,
    prereqs: ['devant', 'stop-traction', 'decrocher'],
    paliers: [
      { id: 'croiser-traction-1', label: 'À distance', criterion: 'Croise un chien à 30 mètres en gardant sa place, 5 fois.' },
      { id: 'croiser-traction-2', label: 'Se ranger', criterion: 'Se range sur le côté et attend le passage au mot, 7 fois sur 10.' },
      { id: 'croiser-traction-3', label: 'Croisement rapproché', criterion: 'Croise un vélo ou un joggeur à moins de 5 mètres sans dévier.' },
    ],
  },
  {
    id: 'rando-duree',
    name: 'Endurance de rando',
    category: 'sport',
    icon: '⛰️',
    cue: '',
    signal: '',
    description: 'Kori tire régulièrement sur une sortie longue, avec des pauses et une allure de marche.',
    purpose:
      'La finalité de la branche : partir en rando ensemble. Se construit très progressivement, en distance seulement — jamais en vitesse.',
    note:
      'Amstaff : la chaleur est le vrai facteur limitant, pas le souffle. Pas de sortie en pleine journée de juin à septembre — lever du jour ou après le coucher du soleil, et l’humidité compte double pour un museau court.',
    difficulty: 3,
    cost: 16,
    bonus: 16,
    prereqs: ['devant', 'stop-traction'],
    gate: 'traction',
    paliers: [
      { id: 'rando-duree-1', label: 'Vingt minutes', criterion: 'Sortie de 20 minutes en traction douce, à l’aise, sans traîner au retour.', gate: 'traction' },
      { id: 'rando-duree-2', label: 'Quarante minutes', criterion: 'Sortie de 40 minutes avec deux pauses, récupération rapide.', gate: 'traction' },
      { id: 'rando-duree-3', label: 'Une vraie rando', criterion: 'Sortie d’une heure sur terrain varié, allure de marche, forme intacte le lendemain.', gate: 'traction' },
    ],
  },

  // ---------- SOINS COOPÉRATIFS ----------
  // Principe transversal de la branche : le chien garde un moyen de dire
  // « pause ». On ne contient pas, on ne surprend pas, on ne va jamais
  // jusqu'à la lutte. Le menton posé sert de bouton marche/arrêt : tant
  // qu'il est posé on continue, s'il se lève on s'arrête vraiment — sinon
  // le signal ne veut plus rien dire et le chien cesse de le donner.
  {
    id: 'menton',
    name: 'Le menton posé',
    category: 'soins',
    icon: '🤝',
    cue: 'Menton',
    signal: '',
    description: 'Kori pose son menton dans ta main ou sur ton genou et l’y laisse pendant qu’on la manipule.',
    purpose:
      'La brique de toute la branche Soins : c’est son « oui ». Elle pose le menton pour dire qu’on peut continuer, elle le lève pour demander une pause.',
    note:
      'Ça ne marche que si le lever de menton arrête vraiment le soin, à chaque fois. Un signal qu’on ignore une seule fois est un signal que le chien arrête de donner.',
    difficulty: 1,
    cost: 6,
    bonus: 6,
    prereqs: [],
    paliers: [
      { id: 'menton-1', label: 'Le menton dans la main', criterion: 'Pose le menton dans ta paume et l’y laisse 3 secondes, 8 fois sur 10.' },
      { id: 'menton-2', label: 'Tenir pendant qu’on touche', criterion: 'Garde le menton posé 10 secondes pendant que tu lui touches la tête et les épaules.' },
      { id: 'menton-3', label: 'Le signal de pause', criterion: 'Lève le menton quand c’est trop, le repose d’elle-même quand elle est prête — sur 3 soins différents.' },
    ],
  },
  {
    id: 'pattes-soin',
    name: 'Les pattes manipulées',
    category: 'soins',
    icon: '🐾',
    cue: '',
    signal: '',
    description: 'Kori laisse prendre, tenir et écarter ses doigts sans retirer la patte.',
    purpose:
      'La patte est la zone la plus refusée par les chiens, et celle dont on a le plus besoin : griffes, épines, coussinets, boue, examen véto.',
    note:
      'À ne pas confondre avec « Donne la patte », qui est un tour. Ici on ne demande rien : c’est elle qui accepte qu’on manipule.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: ['menton'],
    paliers: [
      { id: 'pattes-soin-1', label: 'La patte touchée', criterion: 'Laisse toucher chaque patte 3 secondes sans la retirer, sur les 4 pattes.' },
      { id: 'pattes-soin-2', label: 'La patte tenue', criterion: 'Laisse soulever et tenir la patte 10 secondes, menton posé.' },
      { id: 'pattes-soin-3', label: 'Les doigts écartés', criterion: 'Laisse écarter les doigts et inspecter entre les coussinets, sur les 4 pattes.' },
    ],
  },
  {
    id: 'griffes',
    name: 'Les griffes',
    category: 'soins',
    icon: '✂️',
    cue: '',
    signal: '',
    description: 'Kori accepte la coupe ou la lime des griffes, une griffe à la fois, sans contention.',
    purpose:
      'Des griffes trop longues déforment la posture et font mal. C’est aussi le soin où tout se joue : une mauvaise expérience se paye pendant des années.',
    note:
      'Une griffe par séance suffit. Rien n’oblige à finir les quatre pattes le même jour — c’est la vitesse qui casse ce soin, jamais la lenteur.',
    difficulty: 3,
    cost: 12,
    bonus: 12,
    prereqs: ['pattes-soin'],
    paliers: [
      { id: 'griffes-1', label: 'L’outil est sympa', criterion: 'Renifle le coupe-griffes et reste détendue quand il approche de la patte, 10 fois.' },
      { id: 'griffes-2', label: 'Le contact sans couper', criterion: 'Laisse poser l’outil sur la griffe sans couper, menton posé, sur les 4 pattes.' },
      { id: 'griffes-3', label: 'Une griffe coupée', criterion: 'Laisse couper une griffe et revient d’elle-même pour la suivante.' },
    ],
  },
  {
    id: 'oreilles',
    name: 'Oreilles et yeux',
    category: 'soins',
    icon: '👂',
    cue: '',
    signal: '',
    description: 'Kori laisse inspecter et nettoyer ses oreilles et le tour de ses yeux.',
    purpose:
      'Ce sont les soins les plus fréquents en vrai : otites, gouttes, poussière. Un chien qui les accepte se soigne à la maison au lieu d’aller chez le véto.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: ['menton'],
    paliers: [
      { id: 'oreilles-1', label: 'L’oreille soulevée', criterion: 'Laisse soulever et regarder l’intérieur de chaque oreille, menton posé.' },
      { id: 'oreilles-2', label: 'Le produit', criterion: 'Reste en place pendant une instillation dans l’oreille, sans secouer avant la fin.' },
      { id: 'oreilles-3', label: 'Le tour des yeux', criterion: 'Laisse essuyer le tour des yeux avec une compresse, sans reculer.' },
    ],
  },
  {
    id: 'brossage',
    name: 'Le brossage',
    category: 'soins',
    icon: '🪮',
    cue: 'Brossage',
    signal: '',
    description: 'Kori se pose pour être brossée et reste détendue pendant le passage de la brosse.',
    purpose:
      'Poil court ne veut pas dire zéro entretien : le gant ou la brosse douce enlèvent le poil mort et donnent un rendez-vous calme et régulier à deux.',
    difficulty: 1,
    cost: 6,
    bonus: 6,
    prereqs: ['menton'],
    paliers: [
      { id: 'brossage-1', label: 'La brosse posée', criterion: 'Reste en place pendant 5 passages de brosse sur le dos.' },
      { id: 'brossage-2', label: 'Le corps entier', criterion: 'Accepte le brossage du dos, des flancs et du poitrail sur une séance.' },
      { id: 'brossage-3', label: 'Les zones sensibles', criterion: 'Laisse brosser le ventre et l’arrière-train sans se lever.' },
    ],
  },
  {
    id: 'museliere',
    name: 'La muselière',
    category: 'soins',
    icon: '😷',
    cue: 'Muselière',
    signal: '',
    description: 'Kori met le museau dans sa muselière d’elle-même et la porte détendue, sans chercher à l’enlever.',
    purpose:
      'Pour une Amstaff en France, c’est l’équipement qui conditionne toutes les sorties. Autant qu’elle l’adore plutôt qu’elle la subisse — et une muselière bien vécue rend aussi le véto et l’imprévu beaucoup plus simples.',
    note:
      'Muselière panier uniquement, jamais un modèle en nylon qui ferme la gueule : Kori doit pouvoir haleter et boire. Pour une race qui dissipe mal la chaleur, ce détail est une question de sécurité, pas de confort.',
    difficulty: 2,
    cost: 10,
    bonus: 10,
    prereqs: ['menton'],
    paliers: [
      { id: 'museliere-1', label: 'Le museau dedans', criterion: 'Met le museau dans la muselière d’elle-même pour attraper une friandise, 10 fois.' },
      { id: 'museliere-2', label: 'Attachée quelques minutes', criterion: 'Porte la muselière attachée 5 minutes à la maison sans la frotter ni la retirer.' },
      { id: 'museliere-3', label: 'Portée dehors', criterion: 'Fait une sortie complète en muselière, détendue, en buvant sans difficulté.' },
    ],
  },
  {
    id: 'examen-veto',
    name: 'L’examen vétérinaire',
    category: 'soins',
    icon: '🩺',
    cue: '',
    signal: '',
    description: 'Kori accepte les gestes de l’examen : monter sur la table, se faire palper, ouvrir la gueule, la piqûre.',
    purpose:
      'Un chien qui se laisse examiner se fait mieux soigner et se fait dépister plus tôt. Et pour une race soumise à évaluation comportementale, c’est loin d’être un détail.',
    difficulty: 3,
    cost: 14,
    bonus: 14,
    prereqs: ['pattes-soin', 'monte'],
    paliers: [
      { id: 'examen-veto-1', label: 'La table', criterion: 'Monte sur une surface surélevée et y reste 30 secondes, détendue.' },
      { id: 'examen-veto-2', label: 'La palpation', criterion: 'Laisse palper le ventre, les hanches et soulever les babines, menton posé.' },
      { id: 'examen-veto-3', label: 'La piqûre pour de faux', criterion: 'Reste immobile pendant un pincement de peau au garrot, 8 fois sur 10.' },
    ],
  },

  // ---------- AUTONOMIE ----------
  {
    id: 'autre-piece',
    name: 'Rester dans une autre pièce',
    category: 'autonomie',
    icon: '🚪',
    cue: '',
    signal: '',
    description: 'Kori reste posée quand tu passes dans une autre pièce, sans te suivre ni geindre.',
    purpose:
      'La première marche vers la solitude, et la plus souvent sautée. Un chien qui ne supporte pas une porte fermée ne supportera pas une absence.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: ['calme-tapis'],
    paliers: [
      { id: 'autre-piece-1', label: 'Tu t’éloignes', criterion: 'Reste sur son tapis pendant que tu traverses la pièce, 10 fois.' },
      { id: 'autre-piece-2', label: 'Hors de vue', criterion: 'Reste posée 30 secondes pendant que tu es dans une autre pièce.' },
      { id: 'autre-piece-3', label: 'Porte fermée', criterion: 'Reste calme 5 minutes avec une porte fermée entre vous.' },
    ],
  },
  {
    id: 'solitude',
    name: 'Rester seule',
    category: 'autonomie',
    icon: '🏠',
    cue: '',
    signal: '',
    description: 'Kori reste seule à la maison sans détresse : elle se pose, dort, s’occupe.',
    purpose:
      'La compétence qui rend une vie normale possible pour vous trois. Elle se construit par paliers de durée, jamais en laissant « pleurer un bon coup ».',
    note:
      'Si elle panique, détruit ou vocalise dès les premières minutes, ce n’est plus de l’apprentissage : l’anxiété de séparation se travaille avec un pro, pas en allongeant les durées.',
    difficulty: 3,
    cost: 14,
    bonus: 14,
    prereqs: ['autre-piece'],
    paliers: [
      { id: 'solitude-1', label: 'Cinq minutes', criterion: 'Reste seule 5 minutes, calme, sans vocaliser (vérifié en vidéo).' },
      { id: 'solitude-2', label: 'Une demi-heure', criterion: 'Reste seule 30 minutes et se couche d’elle-même après ton départ.' },
      { id: 'solitude-3', label: 'Deux heures', criterion: 'Reste seule 2 heures, retrouvailles calmes, rien de détruit.' },
    ],
  },
  {
    id: 'voiture',
    name: 'Le trajet en voiture',
    category: 'autonomie',
    icon: '🚗',
    cue: '',
    signal: '',
    description: 'Kori monte en voiture d’elle-même, s’installe et reste posée pendant le trajet.',
    purpose:
      'Sans ça, pas de rando, pas de véto serein, pas de vacances. Et un chien qui a peur de la voiture arrive déjà stressé à destination.',
    difficulty: 2,
    cost: 10,
    bonus: 10,
    prereqs: [],
    paliers: [
      { id: 'voiture-1', label: 'Monter à vide', criterion: 'Monte d’elle-même dans le coffre moteur éteint et s’y couche.' },
      { id: 'voiture-2', label: 'Le moteur tourne', criterion: 'Reste couchée 2 minutes moteur allumé, sans haleter ni baver.' },
      { id: 'voiture-3', label: 'Un vrai trajet', criterion: 'Fait 20 minutes de route et sort détendue, sans salive excessive.' },
    ],
  },
  {
    id: 'visiteurs',
    name: 'L’arrivée d’un visiteur',
    category: 'autonomie',
    icon: '🔔',
    cue: '',
    signal: '',
    description: 'Kori va à sa place à la sonnette et attend d’être invitée pour aller dire bonjour.',
    purpose:
      'Le moment le plus explosif de la maison. Une routine claire vaut mieux que dix rappels à l’ordre — et pour une Amstaff, un accueil posé change le regard des gens.',
    difficulty: 2,
    cost: 10,
    bonus: 10,
    prereqs: ['panier', 'attends'],
    paliers: [
      { id: 'visiteurs-1', label: 'La sonnette annonce le panier', criterion: 'Part vers son panier au son de la sonnette, 8 fois sur 10 (à vide).' },
      { id: 'visiteurs-2', label: 'Quelqu’un entre', criterion: 'Reste au panier pendant qu’une personne connue entre et s’assoit.' },
      { id: 'visiteurs-3', label: 'Bonjour sur invitation', criterion: 'Attend l’autorisation pour aller saluer, et salue sans sauter.' },
    ],
  },

  // ---------- CERVEAU (2e vague) ----------
  {
    id: 'touche',
    name: 'Touche',
    category: 'cerveau',
    icon: '👉',
    cue: 'Touche',
    signal: '',
    description: 'Kori vient poser son truffe contre la main tendue.',
    purpose:
      'La brique la plus rentable de l’arbre. Une cible qu’on déplace permet de la faire bouger sans la toucher ni la leurrer : se replacer, monter, passer un portillon, se détourner d’un truc. Elle resservira dans les soins et en balade.',
    difficulty: 1,
    cost: 6,
    bonus: 8,
    prereqs: [],
    paliers: [
      {
        id: 'touche-1',
        label: 'La main qui paie',
        criterion: 'Vient toucher ta paume tendue à 10 cm, 8 fois sur 10.',
        how: {
          method: 'faconnement',
          setup:
            'Main plate à côté d’elle, sans rien dedans. Le moindre mouvement du museau vers la main est payé, puis seulement le contact.',
          pitfall:
            'Cacher une friandise dans la main : elle apprend à flairer la nourriture, pas à toucher. La main doit être vide, la friandise vient de l’autre.',
        },
      },
      {
        id: 'touche-2',
        label: 'Elle se déplace pour toucher',
        criterion: 'Fait deux ou trois pas pour venir toucher la main.',
        how: {
          method: '3d',
          setup: 'On augmente la distance seule : la main s’éloigne, le décor et la durée ne bougent pas.',
          pitfall: 'Tendre la main trop haut : elle saute au lieu d’avancer.',
        },
      },
      {
        id: 'touche-3',
        label: 'Sur le mot, ailleurs',
        criterion: 'Répond à « Touche » dans une autre pièce, puis dans le jardin.',
        how: {
          method: 'generaliser',
          setup: 'Même exercice, un décor nouveau à la fois. On redescend d’un cran à chaque changement.',
          pitfall: 'Considérer que c’est acquis parce que ça marche au salon.',
        },
      },
    ],
  },
  {
    id: 'cherche',
    name: 'Cherche !',
    category: 'cerveau',
    icon: '👃',
    cue: 'Cherche',
    signal: '',
    description: 'Kori cherche au flair des friandises éparpillées, puis cachées.',
    purpose:
      'L’activité la plus utile pour une chienne à qui la course est interdite : ça fatigue sans solliciter les articulations, et ça se fait par tous les temps.',
    note:
      'Le flair a un effet mesuré sur l’humeur : dans une étude de Duranton et Horowitz (2019), des chiens ayant pratiqué des séances de recherche olfactive pendant deux semaines montraient un biais de jugement plus optimiste que le groupe témoin. À privilégier les jours de décompression.',
    difficulty: 1,
    cost: 6,
    bonus: 8,
    prereqs: [],
    paliers: [
      {
        id: 'cherche-1',
        label: 'À vue',
        criterion: 'Ramasse cinq friandises jetées au sol devant elle, sans se précipiter sur toi.',
        how: {
          method: 'capture',
          setup: 'Tu jettes, tu dis « Cherche » pendant qu’elle mange. Le mot se colle sur ce qu’elle fait déjà.',
          pitfall: 'Dire le mot avant de jeter : il annonce ta main, pas la recherche.',
        },
      },
      {
        id: 'cherche-2',
        label: 'Dans l’herbe',
        criterion: 'Trouve des friandises éparpillées dans un carré d’herbe, museau au sol.',
        how: {
          method: '3d',
          setup: 'On augmente la difficulté par la hauteur d’herbe, pas par la surface.',
          pitfall: 'Trop grande zone d’un coup : elle abandonne et revient te voir.',
        },
      },
      {
        id: 'cherche-3',
        label: 'Hors de vue',
        criterion: 'Trouve une friandise cachée dans la pièce pendant qu’elle attendait ailleurs.',
        how: {
          method: 'decoupage',
          setup: 'Une seule cachette, toujours la même au début, puis on varie.',
          pitfall: 'Cacher pendant qu’elle regarde : elle utilise ses yeux, pas son nez.',
        },
      },
    ],
  },
  {
    id: 'nommer',
    name: 'Le nom des objets',
    category: 'cerveau',
    icon: '🏷️',
    cue: '',
    signal: '',
    description: 'Kori rapporte l’objet qu’on lui nomme, parmi plusieurs.',
    purpose: 'Du vrai travail de tête. Long à construire, très gratifiant, et ça se joue assis dans le canapé.',
    difficulty: 3,
    cost: 12,
    bonus: 14,
    prereqs: ['apporte'],
    paliers: [
      {
        id: 'nommer-1',
        label: 'Un seul objet',
        criterion: 'Rapporte « Lapin » quand c’est le seul objet présent, 8 fois sur 10.',
        how: {
          method: 'mot-avant-geste',
          setup: 'Le nom se dit AVANT qu’elle parte, une seule fois, toujours pareil.',
          pitfall: 'Répéter le nom pendant qu’elle cherche : le mot devient un bruit de fond.',
        },
      },
      {
        id: 'nommer-2',
        label: 'Entre deux',
        criterion: 'Choisit le bon objet parmi deux, dont un jamais nommé.',
        how: {
          method: 'decoupage',
          setup: 'Le second objet est d’abord inintéressant (un torchon), et loin du premier.',
          pitfall: 'Deux objets qu’elle adore : elle prend le préféré, pas celui qu’on nomme.',
        },
      },
      {
        id: 'nommer-3',
        label: 'Entre trois',
        criterion: 'Choisit le bon parmi trois objets nommés, en variant les positions.',
      },
    ],
  },
  {
    id: 'cache-cache',
    name: 'Cache-cache',
    category: 'cerveau',
    icon: '🙈',
    cue: 'Cherche-moi',
    signal: '',
    description: 'Quelqu’un se cache, Kori le retrouve.',
    purpose:
      'Le meilleur jeu pour muscler le rappel sans le travailler frontalement : te retrouver devient une victoire, pas une contrainte. Se joue à deux, à l’intérieur comme dehors.',
    difficulty: 2,
    cost: 8,
    bonus: 10,
    prereqs: ['rappel'],
    paliers: [
      {
        id: 'cachecache-1',
        label: 'Derrière la porte',
        criterion: 'Te retrouve quand tu es à peine caché·e, dans la même pièce.',
        how: {
          method: 'decoupage',
          setup:
            'Kévin la retient, tu vas te mettre derrière un meuble à moitié visible, tu appelles une fois. Grosse fête à l’arrivée.',
          pitfall: 'Se cacher trop bien du premier coup : elle renonce et le jeu s’éteint.',
        },
      },
      {
        id: 'cachecache-2',
        label: 'Dans la maison',
        criterion: 'Te retrouve dans une autre pièce, hors de vue, sans que tu appelles deux fois.',
      },
      {
        id: 'cachecache-3',
        label: 'Dehors',
        criterion: 'Te retrouve derrière un arbre en zone calme et clôturée.',
        how: {
          method: 'generaliser',
          setup: 'Dehors, tout est plus dur : on repart du niveau « à peine caché ».',
          pitfall: 'Le faire là où elle est déjà distraite — le jeu perd contre l’environnement.',
        },
      },
    ],
  },

  // ---------- TOURS (2e vague) ----------
  {
    id: 'roule',
    name: 'Roulé',
    category: 'tours',
    icon: '🔄',
    cue: 'Roule',
    signal: '',
    description: 'Kori roule sur le dos, d’un côté puis de l’autre.',
    purpose: 'Un tour qui a un bénéfice caché : elle apprend à se mettre sur le dos volontairement, ce qui sert au contrôle du ventre chez le véto.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: ['couche'],
    paliers: [
      {
        id: 'roule-1',
        label: 'La bascule',
        criterion: 'Bascule sur une hanche depuis le couché en suivant la friandise.',
        how: {
          method: 'leurre',
          setup: 'Couchée, la friandise part de sa truffe vers son épaule, lentement, en arc.',
          pitfall: 'Aller vite : elle se relève. On paie la bascule seule, pas le tour entier.',
        },
      },
      {
        id: 'roule-2',
        label: 'Le tour complet',
        criterion: 'Fait un tour complet en suivant la main.',
      },
      {
        id: 'roule-3',
        label: 'Sans la main',
        criterion: 'Roule sur le mot seul, main vide, 8 fois sur 10.',
        how: {
          method: 'effacer-leurre',
          setup: 'On réduit le geste un peu à chaque séance : grand arc, puis petit, puis rien.',
          pitfall: 'Retirer la main d’un coup — on remonte alors d’un cran, sans insister.',
        },
      },
    ],
  },
  {
    id: 'beau',
    name: 'Fais le beau',
    category: 'tours',
    icon: '🙌',
    cue: 'Fais le beau',
    signal: '',
    description: 'Kori se redresse sur son arrière-train, antérieurs levés.',
    purpose: 'Un classique qui plaît, et qui travaille les abdominaux et l’équilibre.',
    note:
      'À garder court : la position met en charge le dos et les postérieurs. Quelques secondes, quelques répétitions, sur un sol non glissant — et on passe à autre chose si elle retombe systématiquement.',
    difficulty: 2,
    cost: 8,
    bonus: 8,
    prereqs: ['assis'],
    paliers: [
      {
        id: 'beau-1',
        label: 'Les antérieurs décollent',
        criterion: 'Lève les deux antérieurs depuis l’assis en suivant la friandise.',
        how: {
          method: 'leurre',
          setup: 'Assise, la friandise monte droit au-dessus de sa tête, très près.',
          pitfall: 'Monter trop haut ou trop loin : elle se met debout au lieu de se redresser.',
        },
      },
      {
        id: 'beau-2',
        label: 'Deux secondes',
        criterion: 'Tient la position deux secondes avant la friandise.',
      },
      {
        id: 'beau-3',
        label: 'Sur le mot',
        criterion: 'Se redresse sur le mot seul.',
        how: { method: 'effacer-leurre', setup: 'Le geste rétrécit séance après séance.', pitfall: 'Rallonger la durée en même temps qu’on efface le geste.' },
      },
    ],
  },
  {
    id: 'slalom',
    name: 'Slalom entre les jambes',
    category: 'tours',
    icon: '🐍',
    cue: 'Slalom',
    signal: '',
    description: 'Kori passe en huit entre tes jambes pendant que tu marches.',
    purpose: 'Spectaculaire, facile à travailler dans un couloir, et ça la fait bouger les jours où on ne sort pas beaucoup.',
    difficulty: 2,
    cost: 8,
    bonus: 10,
    prereqs: ['touche'],
    paliers: [
      {
        id: 'slalom-1',
        label: 'Un passage',
        criterion: 'Passe sous une jambe écartée pour venir toucher ta main de l’autre côté.',
        how: {
          method: 'leurre',
          setup: 'Jambes bien écartées, la main passe dessous et appelle de l’autre côté.',
          pitfall: 'Écart trop faible : elle contourne au lieu de passer dessous.',
        },
      },
      {
        id: 'slalom-2',
        label: 'Le huit',
        criterion: 'Enchaîne deux passages, un de chaque côté, à l’arrêt.',
      },
      {
        id: 'slalom-3',
        label: 'En marchant',
        criterion: 'Enchaîne trois passages pendant que tu avances lentement.',
        how: {
          method: 'decoupage',
          setup: 'D’abord un pas entre deux passages, puis deux, puis une marche continue.',
          pitfall: 'Marcher normalement d’emblée : elle ne suit plus et le huit se casse.',
        },
      },
    ],
  },
  {
    id: 'tenir',
    name: 'Tenir un objet',
    category: 'tours',
    icon: '🦷',
    cue: 'Tiens',
    signal: '',
    description: 'Kori prend un objet dans sa gueule et le garde jusqu’au signal.',
    purpose:
      'La base du rapport, construite proprement : elle apprend à tenir parce que ça paie, pas parce qu’on lui met l’objet dans la bouche.',
    difficulty: 3,
    cost: 10,
    bonus: 12,
    prereqs: [],
    paliers: [
      {
        id: 'tenir-1',
        label: 'Elle prend',
        criterion: 'Referme la gueule sur l’objet présenté, 8 fois sur 10.',
        how: {
          method: 'faconnement',
          setup:
            'On paie par étapes : le regard vers l’objet, puis le museau qui touche, puis les dents qui se posent, puis la prise. Une étape par séance.',
          pitfall:
            'Ouvrir sa gueule pour y glisser l’objet. Ça fabrique une chienne qui recule dès qu’elle voit l’objet arriver.',
        },
      },
      {
        id: 'tenir-2',
        label: 'Trois secondes',
        criterion: 'Garde l’objet trois secondes avant de le lâcher dans ta main.',
        how: {
          method: '3d',
          setup: 'On allonge d’une seconde à la fois, en revenant souvent à une durée facile.',
          pitfall: 'Tendre la main trop tôt : elle lâche pour prendre la friandise.',
        },
      },
      {
        id: 'tenir-3',
        label: 'Elle bouge avec',
        criterion: 'Fait trois pas en gardant l’objet.',
      },
    ],
  },
  {
    id: 'apporte',
    name: 'Apporte',
    category: 'tours',
    icon: '🎾',
    cue: 'Apporte',
    signal: '',
    description: 'Kori va chercher un objet lancé et revient te le donner en main.',
    purpose:
      'Utile pour de vrai, et c’est le rappel déguisé en jeu : revenir vers toi devient la partie amusante. Attention à ne pas en faire une course répétée — lancer vingt fois de suite sollicite les articulations et monte l’excitation.',
    difficulty: 2,
    cost: 10,
    bonus: 12,
    prereqs: ['tenir'],
    paliers: [
      {
        id: 'apporte-1',
        label: 'Elle revient avec',
        criterion: 'Revient vers toi avec l’objet lancé à deux mètres.',
        how: {
          method: 'premack',
          setup: 'Le relancer est la récompense : elle rend, tu relances aussitôt.',
          pitfall: 'Lui courir après pour récupérer l’objet — le jeu devient « garde-le ».',
        },
      },
      {
        id: 'apporte-2',
        label: 'Dans la main',
        criterion: 'Dépose l’objet dans ta main plutôt qu’au sol.',
      },
      {
        id: 'apporte-3',
        label: 'Plus loin',
        criterion: 'Rapporte depuis dix mètres, en extérieur clôturé.',
        how: {
          method: 'generaliser',
          setup: 'Dehors on repart court, avec l’objet le plus connu.',
          pitfall: 'Changer d’objet et de lieu en même temps.',
        },
      },
    ],
  },
  {
    id: 'ranger-jouets',
    name: 'Ranger ses jouets',
    category: 'tours',
    icon: '🧸',
    cue: 'Range',
    signal: '',
    description: 'Kori rapporte ses jouets et les lâche dans leur caisse.',
    purpose: 'La suite logique d’« Apporte », et un enchaînement dont on voit le résultat par terre le soir.',
    difficulty: 3,
    cost: 12,
    bonus: 14,
    prereqs: ['apporte'],
    paliers: [
      {
        id: 'ranger-1',
        label: 'Lâcher au-dessus',
        criterion: 'Lâche l’objet dans la caisse quand tu la tiens sous sa gueule.',
        how: {
          method: 'decoupage',
          setup: 'On commence par la fin : caisse haute, tenue juste sous sa tête, elle n’a qu’à lâcher.',
          pitfall: 'Poser la caisse au sol tout de suite : viser un trou par terre est bien plus dur.',
        },
      },
      {
        id: 'ranger-2',
        label: 'La caisse au sol',
        criterion: 'Apporte un jouet et le lâche dans la caisse posée au sol.',
      },
      {
        id: 'ranger-3',
        label: 'Trois jouets',
        criterion: 'Enchaîne trois jouets d’affilée sur un seul « Range ».',
      },
    ],
  },

  // ---------- BALADE (2e vague) ----------
  {
    id: 'au-pied',
    name: 'Au pied',
    category: 'balade',
    icon: '🦵',
    cue: 'Au pied',
    signal: '',
    description: 'Kori vient se placer le long de ta jambe et y reste.',
    purpose:
      'La position de secours en balade : un trottoir étroit, un cycliste, un croisement serré. Différent de la marche en laisse, qui dure ; ici c’est une place précise qu’on demande ponctuellement.',
    difficulty: 2,
    cost: 10,
    bonus: 10,
    prereqs: ['marche-laisse'],
    paliers: [
      {
        id: 'aupied-1',
        label: 'La place',
        criterion: 'Vient se placer le long de ta jambe depuis un pas de distance.',
        how: {
          method: 'leurre',
          setup: 'La main guide le long de la couture du pantalon, elle finit parallèle à toi.',
          pitfall: 'Payer quand elle est devant toi ou de travers : c’est la position exacte qu’on paie.',
        },
      },
      {
        id: 'aupied-2',
        label: 'Elle y reste',
        criterion: 'Garde la position pendant trois pas.',
      },
      {
        id: 'aupied-3',
        label: 'De plus loin, dehors',
        criterion: 'Vient se placer depuis deux mètres, en balade, laisse détendue.',
        how: {
          method: '3d',
          setup: 'Distance d’abord, en environnement calme. La distraction viendra après.',
          pitfall: 'Demander « Au pied » la première fois au moment où un chien arrive.',
        },
      },
    ],
  },
  {
    id: 'milieu',
    name: 'Au milieu',
    category: 'balade',
    icon: '🧍',
    cue: 'Milieu',
    signal: '',
    description: 'Kori vient se placer entre tes jambes, face à la même direction que toi.',
    purpose:
      'La position la plus rassurante qu’on puisse lui offrir dehors : tes jambes font barrière des deux côtés, elle est contre toi, et tu gardes les mains libres. Parfaite quand un vélo ou un chien passe et qu’on veut juste laisser passer.',
    difficulty: 2,
    cost: 10,
    bonus: 10,
    prereqs: ['touche'],
    paliers: [
      {
        id: 'milieu-1',
        label: 'Elle passe',
        criterion: 'Traverse l’espace entre tes jambes pour venir toucher ta main devant.',
        how: {
          method: 'leurre',
          setup: 'Jambes écartées, la main tendue devant toi l’appelle à travers.',
          pitfall: 'La faire venir par le côté : on veut qu’elle entre par l’arrière, dans ton axe.',
        },
      },
      {
        id: 'milieu-2',
        label: 'Elle s’arrête là',
        criterion: 'S’immobilise entre tes jambes et y reste cinq secondes.',
      },
      {
        id: 'milieu-3',
        label: 'En balade',
        criterion: 'Vient au milieu sur demande pendant une sortie, avant qu’un truc passe.',
        how: {
          method: 'generaliser',
          setup: 'On la demande dix fois pour rien, dans le calme, avant de s’en servir un jour utile.',
          pitfall: 'Ne l’utiliser qu’en situation tendue : la position finit par annoncer le danger.',
        },
      },
    ],
  },
  {
    id: 'croiser-chien',
    name: 'Croiser un chien',
    category: 'balade',
    icon: '🐩',
    cue: '',
    signal: '',
    description: 'Kori croise un chien en laisse sans se tendre ni tirer.',
    purpose:
      'Le sujet quotidien. Ce n’est pas un exercice d’obéissance mais un travail d’émotion : on ne lui demande pas de se retenir, on change ce qu’elle ressent quand un chien apparaît.',
    note:
      'La distance est la seule variable qui compte. Trop près, elle est au-dessus de son seuil et rien ne s’apprend : on est en gestion, pas en entraînement. Mieux vaut dix croisements à trente mètres qu’un seul à trois.',
    difficulty: 3,
    cost: 12,
    bonus: 14,
    prereqs: ['decrocher'],
    paliers: [
      {
        id: 'croiser-1',
        label: 'Loin, elle mange',
        criterion: 'Voit un chien au loin, te regarde et prend la friandise sans se figer.',
        how: {
          method: 'contre-conditionnement',
          setup:
            'Le chien apparaît → la pluie de friandises commence. Le chien disparaît → elle s’arrête. C’est l’apparition qui annonce la nourriture, pas l’inverse.',
          pitfall:
            'Demander « Assis » ou « Regarde » d’abord. On ne veut pas un ordre bien exécuté, on veut qu’elle apprenne que chien = bonne nouvelle.',
        },
      },
      {
        id: 'croiser-2',
        label: 'À mi-distance',
        criterion: 'Même chose à la distance où elle remarque le chien mais reste détendue.',
        how: {
          method: '3d',
          setup: 'On réduit la distance de quelques mètres par séance, jamais de moitié.',
          pitfall: 'Réduire la distance le jour où elle est déjà chargée — le seuil bouge d’un jour à l’autre.',
        },
      },
      {
        id: 'croiser-3',
        label: 'Le vrai croisement',
        criterion: 'Croise un chien sur un trottoir large, laisse détendue.',
      },
    ],
  },
  {
    id: 'sniffari',
    name: 'Le sniffari',
    category: 'balade',
    icon: '🌾',
    cue: '',
    signal: '',
    description: 'Une sortie où c’est elle qui décide où aller et combien de temps renifler.',
    purpose:
      'Ce n’est pas une compétence du chien, c’est une habitude à prendre pour nous : une balade sans objectif, sans exercice, sans distance à faire. Le contrepoids exact des sorties chargées.',
    note:
      'Renifler n’est pas du temps perdu : dans l’étude de Duranton et Horowitz (2019), des chiens pratiquant régulièrement des activités olfactives montraient un biais de jugement plus optimiste. Une sortie lente et reniflée fatigue autant qu’une sortie rapide, sans monter l’excitation.',
    difficulty: 1,
    cost: 6,
    bonus: 8,
    prereqs: [],
    paliers: [
      {
        id: 'sniffari-1',
        label: 'Dix minutes sans but',
        criterion: 'Une sortie de dix minutes où tu ne l’as jamais rappelée ni pressée.',
        how: {
          method: 'premack',
          setup: 'La laisse est longue, la direction est la sienne. Ton seul rôle est de suivre.',
          pitfall: 'Vouloir « en profiter pour travailler le rappel ». Ce n’est pas le moment.',
        },
      },
      {
        id: 'sniffari-2',
        label: 'Le bon endroit',
        criterion: 'Tu as identifié un lieu où elle peut renifler longtemps sans croiser grand-monde.',
      },
      {
        id: 'sniffari-3',
        label: 'Le réflexe',
        criterion: 'Un sniffari a suivi une sortie chargée ou un jour de décompression.',
      },
    ],
  },
  {
    id: 'rappel-urgence',
    name: 'Rappel d’urgence',
    category: 'balade',
    icon: '🚨',
    cue: '',
    signal: '',
    description: 'Un second mot, gardé pour les vraies urgences, auquel elle revient sans réfléchir.',
    purpose:
      'Le rappel ordinaire s’use : on l’emploie dix fois par jour, parfois pour interrompre quelque chose d’agréable. Ce mot-là ne sert jamais à rien d’ordinaire, il paie énormément à chaque fois, et il reste donc intact le jour où il faut vraiment.',
    note:
      'Trois règles, sans exception. Le mot ne s’utilise jamais pour du confort. Il est toujours payé d’un jackpot, même s’il a fallu du temps. Il ne s’emploie jamais pour finir une balade ou faire quelque chose qu’elle n’aime pas — sinon il s’abîme comme l’autre.',
    difficulty: 2,
    cost: 12,
    bonus: 16,
    prereqs: ['rappel'],
    paliers: [
      {
        id: 'urgence-1',
        label: 'Charger le mot',
        criterion: 'Le mot est suivi d’un jackpot vingt fois de suite, sans qu’on lui demande rien.',
        how: {
          method: 'association',
          setup:
            'Elle est à côté, tranquille. Le mot, puis immédiatement une poignée de très bon. On ne lui demande RIEN — on colle une émotion sur un son.',
          pitfall: 'Attendre qu’elle vienne avant de payer. À ce stade, le mot annonce, il ne demande pas.',
        },
      },
      {
        id: 'urgence-2',
        label: 'À la maison',
        criterion: 'Fait demi-tour et arrive au galop depuis une autre pièce, jackpot à l’arrivée.',
      },
      {
        id: 'urgence-3',
        label: 'Dehors, une seule fois',
        criterion: 'Testé une fois en extérieur clôturé, avec une distraction modérée. Puis on le remet au placard.',
        how: {
          method: 'generaliser',
          setup: 'Un test, pas un entraînement. On recharge le mot à la maison entre deux essais.',
          pitfall: 'S’en servir « pour voir » : chaque emploi sans urgence l’use un peu.',
        },
      },
    ],
  },
  {
    id: 'trottoir',
    name: 'Le trottoir',
    category: 'balade',
    icon: '🚦',
    cue: 'On traverse',
    signal: '',
    description: 'Kori reste sur le trottoir, ne descend pas seule, et traverse au mot.',
    purpose:
      'La règle de sécurité la plus utile en ville : la chaussée n’existe pas tant qu’on ne l’a pas dit. Ça vaut aussi le jour où la laisse échappe des mains.',
    difficulty: 2,
    cost: 10,
    bonus: 12,
    prereqs: ['attends'],
    paliers: [
      {
        id: 'trottoir-1',
        label: 'Rester dessus',
        criterion: 'Marche sur le trottoir sans descendre sur la chaussée, sur cent mètres.',
        how: {
          method: 'capture',
          setup: 'On paie discrètement quand elle marche bien à l’intérieur du trottoir, sans rien demander.',
          pitfall: 'Ne réagir que quand elle descend : elle apprend que descendre attire l’attention.',
        },
      },
      {
        id: 'trottoir-2',
        label: 'S’arrêter au bord',
        criterion: 'S’arrête d’elle-même au bord du trottoir, sans que tu aies à retenir la laisse.',
        how: {
          method: 'capture',
          setup:
            'Tu t’arrêtes systématiquement à chaque bordure, en silence. Quand elle s’arrête aussi, tu paies. Au bout d’un moment la bordure devient le signal.',
          pitfall: 'Dire « Attends » à chaque fois : c’est la bordure qui doit déclencher l’arrêt, pas ta voix.',
        },
      },
      {
        id: 'trottoir-3',
        label: 'Traverser au mot',
        criterion: 'Ne s’engage sur la chaussée qu’après le mot, 8 fois sur 10.',
        how: {
          method: 'mot-avant-geste',
          setup: 'Le mot d’abord, puis tu avances. Jamais l’inverse.',
          pitfall: 'Avancer en même temps qu’on parle : c’est ton mouvement qu’elle suit, pas le mot.',
        },
      },
    ],
  },
];

// ------------------------------------------------------------
// Verrous non pédagogiques : un palier peut être prêt dans la tête du chien
// mais pas dans son corps. Le `gate` s'affiche, il ne bloque rien — c'est un
// avertissement, pas une punition. Aucune date n'est codée en dur : c'est le
// véto qui tranche, pas l'appli.
// ------------------------------------------------------------
export const GATES = {
  traction: {
    label: 'Feu vert véto requis',
    detail:
      'Ce palier fait réellement tirer Kori. Tant que les plaques de croissance ne sont pas fermées, la traction répétée peut abîmer le cartilage de façon définitive. Chez un gabarit moyen à grand, la fermeture se situe entre 12 et 18 mois. À faire valider en visite, avec un contrôle des hanches, des genoux et de la démarche.',
  },
};

// ------------------------------------------------------------
// Prérequis DURS : les seuls qui empêchent réellement de débloquer.
// ------------------------------------------------------------
// Par défaut, un prérequis est un CONSEIL d'ordre pédagogique : « ça se passe
// mieux dans cet ordre », pas « c'est interdit autrement ». On travaille très
// souvent une compétence avant celle qui la précède dans l'arbre, et l'appli
// n'a pas à empêcher de noter du travail réellement fait.
//
// Ne restent bloquants que les cas où l'ordre engage le CORPS du chien ou sa
// sécurité — jamais la pédagogie. Même esprit que GATES : on ne verrouille que
// ce qui peut faire mal.
export const HARD_PREREQS = {
  // Couper des griffes à un chien qui n'accepte pas encore qu'on manipule ses
  // pattes, c'est se garantir une mauvaise expérience (et un risque de couper
  // dans le vif) qui contamine toute la branche des soins.
  griffes: ['pattes-soin'],
  // Faire tirer sur autre chose qu'un harnais adapté fait porter la traction au
  // cou : risque trachéal et cervical.
  allez: ['harnais'],
  // Croiser un autre chien en traction sans signal de décrochage fiable, c'est
  // un départ en poursuite avec 21 kg au bout de la longe.
  'croiser-traction': ['decrocher'],
};

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
