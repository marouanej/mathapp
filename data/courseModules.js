export const COURSE_MODULES = [
  {
    id: 'nombres-calculs',
    label: 'Nombres et calculs',
    description: 'Operations, fractions, nombres decimaux et calcul mental.',
    shortLabel: 'Calculs',
    badgeClass: 'bg-cyan-400/15 text-cyan-100 border-cyan-300/40',
    panelClass: 'border-cyan-400/30 bg-[linear-gradient(145deg,rgba(8,47,73,0.92),rgba(15,23,42,0.92))]',
    specifications: [
      'Calcul mental et pose',
      'Fractions et equivalences',
      'Decimaux et priorites',
    ],
  },
  {
    id: 'grandeurs-mesures',
    label: 'Grandeurs et mesures',
    description: 'Longueurs, masses, contenances, durees et perimetres.',
    shortLabel: 'Mesures',
    badgeClass: 'bg-amber-400/15 text-amber-100 border-amber-300/40',
    panelClass: 'border-amber-400/30 bg-[linear-gradient(145deg,rgba(120,53,15,0.88),rgba(15,23,42,0.92))]',
    specifications: [
      'Conversions d unites',
      'Durees et lecture de tableaux',
      'Perimetres et situations concretes',
    ],
  },
  {
    id: 'espace-geometrie',
    label: 'Espace et geometrie',
    description: 'Figures, solides, reperage dans l espace et vocabulaire geometrique.',
    shortLabel: 'Geometrie',
    badgeClass: 'bg-fuchsia-400/15 text-fuchsia-100 border-fuchsia-300/40',
    panelClass: 'border-fuchsia-400/30 bg-[linear-gradient(145deg,rgba(88,28,135,0.88),rgba(15,23,42,0.92))]',
    specifications: [
      'Figures planes et solides',
      'Reperage spatial',
      'Vocabulaire geometrique',
    ],
  },
];

export const createEmptyModules = () =>
  COURSE_MODULES.map((module) => ({
    id: module.id,
    moduleType: module.id,
    title: module.label,
    description: module.description,
    questions: [],
  }));
