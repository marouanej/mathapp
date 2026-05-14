export const COMMON = {
  rooms: 'Salles',
  levels: 'Niveaux',
  lives: 'Vies',
};

export const HOME_COPY = {
  title: 'Echappe Math',
  subtitle: "Maitrise les maths pour t'echapper !",
  startGame: 'Commencer le jeu',
  instructions: 'Comment jouer',
  canYouEscape: "Peux-tu t'echapper de toutes les salles ?",
};

export const ROOM_SELECTION_COPY = {
  back: '< Retour',
  title: 'Selectionner une salle',
  subtitle: 'Termine les 5 niveaux de chaque salle',
  levels: 'Niveaux',
  completed: 'Termine',
  lockedMessage: "Termine la salle precedente d'abord",
  rooms: {
    1: { name: "Salle d'arithmetique", description: 'Maitrise les operations de base' },
    2: { name: "Salle d'algebre", description: 'Resous les equations' },
    3: { name: 'Salle de geometrie', description: 'Calcule les formes' },
    4: { name: 'Salle de logique', description: 'Trouve le motif' },
    5: { name: 'Evasion finale', description: 'Le defi ultime' },
  },
};

export const GAME_COPY = {
  correct: 'Correct !',
  wrong: 'Faux !',
  levelOf: (level) => `Niveau ${level} sur 5`,
  timeLabel: (time) => `Temps : ${time}s`,
  questionOf: (current, total) => `Question ${current}/${total}`,
  bonusPoints: (bonus) => `+${bonus} bonus !`,
};

export const ROOM_CLEAR_COPY = {
  title: 'Salle terminee !',
  levelsCompleted: 'Tous les 5 niveaux sont termines !',
  scoreAchieved: 'Score obtenu',
  roomsCleared: 'Salles terminees',
  totalScore: 'Score total',
  escaped: {
    title: "Tu t'es echappe !",
    message: "Tu as termine les 5 salles et tu t'es echappe du donjon mathematique !",
  },
  nextRoom: {
    title: 'Salle suivante debloquee !',
    message: (emoji, name) => `${emoji} ${name}`,
  },
  viewResults: 'Voir les resultats',
  continueToNext: 'Continuer vers la salle suivante',
};

export const GAME_OVER_COPY = {
  title: 'Jeu termine',
  message: (roomName) => `Tu as perdu toutes tes vies dans ${roomName}.`,
  finalScore: 'Score final',
  levelsCompleted: 'Niveaux termines',
  feedback: {
    beginner: "Continue a t'entrainer ! Tu vas progresser.",
    intermediate: 'Tu te debrouilles bien ! Reessaie pour aller plus loin.',
    advanced: 'Tu es tres proche ! Encore un essai !',
    expert: "Presque sorti ! Tu as failli t'echapper !",
  },
  tryAgain: 'Reessayer',
  backToHome: "Retour a l'accueil",
};

export const VICTORY_COPY = {
  title: "Tu t'es echappe !",
  message: "Tu t'es echappe avec succes du donjon mathematique !",
  finalScore: 'Score final',
  pointsEarned: 'Points gagnes',
  achievements: {
    title: 'Recompenses debloquees',
    master: 'Maitre mathematicien',
    expert: 'Expert en escape room',
    champion: 'Champion speedrun',
    liberator: 'Liberateur du donjon',
  },
  stats: {
    rooms: 'Salles',
    levels: 'Niveaux',
    completed: 'Termine',
  },
  playAgain: 'Rejouer',
  backToHome: "Retour a l'accueil",
  footer: "Merci d'avoir joue ! Peux-tu battre ton score ?",
};

export const INSTRUCTIONS_COPY = {
  title: 'Comment jouer',
  overview: {
    title: 'Apercu du jeu',
    description: "Tu es piege dans un donjon mathematique avec 5 salles. Termine les 5 niveaux de chaque salle pour t'echapper !",
  },
  rooms: {
    title: 'Les 5 salles',
    arithmetic: { name: "Salle d'arithmetique", description: 'Addition, soustraction, multiplication, division' },
    algebra: { name: "Salle d'algebre", description: 'Resoudre les equations lineaires' },
    geometry: { name: 'Salle de geometrie', description: 'Calculer les aires et perimetres' },
    logic: { name: 'Salle de logique', description: 'Trouver les motifs et suites' },
    final: { name: 'Evasion finale', description: 'Questions melangees de toutes les salles' },
  },
  gameplay: {
    title: 'Gameplay',
    rules: [
      'Selectionne une salle pour entrer.',
      'Reponds a 5 niveaux de questions mathematiques.',
      'Termine une salle pour debloquer la suivante.',
      "Bats les 5 salles pour t'echapper !",
    ],
  },
  health: {
    title: 'Systeme de vies',
    description: 'Tu commences avec 3 vies. Chaque mauvaise reponse coute 1 vie.',
  },
  timer: {
    title: 'Minuteur',
    description: "Tu as un temps limite pour chaque question. Dans la salle finale, tu as un peu moins de temps.",
  },
  scoring: {
    title: 'Score',
    description: 'Base : 100 points. Bonus temps : plus tu reponds vite, plus tu gagnes de points.',
  },
  tips: {
    title: 'Conseils',
    list: [
      'Lis bien la question.',
      'Entre uniquement des reponses numeriques.',
      'Utilise des decimales si necessaire.',
      'Arrondis a 2 decimales si besoin.',
      'Repondre plus vite donne un meilleur score.',
    ],
  },
  close: 'Compris !',
};
