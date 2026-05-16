const QUESTION_TYPE_DEFINITIONS = [
  {
    value: 'integer',
    label: 'Entier',
    answerPlaceholder: 'Ex. 42',
    helperText: 'Nombre entier, positif ou negatif, sans unite.',
    choiceCount: 4,
  },
  {
    value: 'decimal',
    label: 'Décimal',
    answerPlaceholder: 'Ex. 3,14',
    helperText: 'Nombre decimal avec virgule ou point.',
    choiceCount: 4,
  },
  {
    value: 'fraction',
    label: 'Fraction',
    answerPlaceholder: 'Ex. 3/4',
    helperText: 'Format attendu : numerateur/denominateur.',
    choiceCount: 4,
  },
  {
    value: 'time',
    label: 'Heure',
    answerPlaceholder: 'Ex. 09:30 ou 9h30',
    helperText: 'Horaire au format HH:MM ou avec la lettre h.',
    choiceCount: 4,
  },
  {
    value: 'percentage',
    label: 'Pourcentage',
    answerPlaceholder: 'Ex. 25%',
    helperText: 'Valeur numerique avec le symbole %.',
    choiceCount: 4,
  },
  {
    value: 'boolean',
    label: 'Vrai / Faux',
    answerPlaceholder: 'Ex. vrai',
    helperText: 'Reponse attendue : vrai ou faux.',
    choiceCount: 2,
  },
  {
    value: 'equation',
    label: 'Équation',
    answerPlaceholder: 'Ex. x = 4',
    helperText: 'Expression ou equation courte.',
    choiceCount: 4,
  },
  {
    value: 'unit',
    label: 'Unité',
    answerPlaceholder: 'Ex. 12 cm',
    helperText: 'Valeur avec unite, par exemple cm, kg, min ou L.',
    choiceCount: 4,
  },
];

export const DEFAULT_QUESTION_TYPE = 'integer';

export const QUESTION_TYPE_OPTIONS = QUESTION_TYPE_DEFINITIONS.map(
  ({ value, label }) => ({
    value,
    label,
  })
);

export const QUESTION_TYPES = QUESTION_TYPE_DEFINITIONS.map(
  ({ value }) => value
);

const QUESTION_TYPE_CONFIG = Object.fromEntries(
  QUESTION_TYPE_DEFINITIONS.map((definition) => [definition.value, definition])
);

const QUESTION_TYPE_ALIASES = {
  integer: 'integer',
  int: 'integer',
  entier: 'integer',
  number: 'integer',
  whole: 'integer',
  decimal: 'decimal',
  dec: 'decimal',
  float: 'decimal',
  double: 'decimal',
  fraction: 'fraction',
  frac: 'fraction',
  time: 'time',
  heure: 'time',
  clock: 'time',
  percentage: 'percentage',
  pourcentage: 'percentage',
  percent: 'percentage',
  pourcent: 'percentage',
  boolean: 'boolean',
  bool: 'boolean',
  vrai: 'boolean',
  faux: 'boolean',
  truefalse: 'boolean',
  equation: 'equation',
  equ: 'equation',
  eq: 'equation',
  unit: 'unit',
  unite: 'unit',
  measurement: 'unit',
};

const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(?:[.,]\d+)?$/;
const FRACTION_PATTERN = /^-?\d+\s*\/\s*-?\d+$/;
const PERCENTAGE_PATTERN = /^-?\d+(?:[.,]\d+)?\s*%$/;
const TIME_PATTERN = /^([01]?\d|2[0-3])(?:\s*[:hH]\s*([0-5]\d))?$/;

const BOOLEAN_TRUE_VALUES = new Set(['true', 'vrai', 'oui', 'yes', '1']);
const BOOLEAN_FALSE_VALUES = new Set(['false', 'faux', 'non', 'no', '0']);

const cleanValue = (value) => String(value ?? '').trim();

const formatNumericString = (value) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

export const normalizeBooleanAnswer = (value) => {
  const normalized = cleanValue(value).toLowerCase();

  if (BOOLEAN_TRUE_VALUES.has(normalized)) {
    return 'true';
  }

  if (BOOLEAN_FALSE_VALUES.has(normalized)) {
    return 'false';
  }

  return null;
};

export const normalizePercentageAnswer = (value) => {
  const rawValue = cleanValue(value);

  if (!rawValue) {
    return null;
  }

  const compactValue = rawValue.replace(/\s+/g, '');
  const numericPart = compactValue.endsWith('%')
    ? compactValue.slice(0, -1)
    : compactValue;

  if (!numericPart || !DECIMAL_PATTERN.test(numericPart)) {
    return null;
  }

  const numeric = Number(numericPart.replace(',', '.'));

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return `${formatNumericString(numeric)}%`;
};

export const normalizeTimeAnswer = (value) => {
  const rawValue = cleanValue(value);
  const match = rawValue.match(TIME_PATTERN);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? '0');

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}`;
};

export const normalizeEquationAnswer = (value) => {
  const normalized = cleanValue(value).replace(/\s+/g, ' ');
  return normalized || null;
};

export const normalizeUnitAnswer = (value) => {
  const normalized = cleanValue(value).replace(/\s+/g, ' ');

  if (!normalized || !/[a-zA-Zµ°]/.test(normalized)) {
    return null;
  }

  const match = normalized.match(/^(-?\d+(?:[.,]\d+)?)\s*([^\d\s].*)$/);

  if (!match) {
    return normalized;
  }

  const numeric = Number(match[1].replace(',', '.'));
  const unit = match[2].trim();

  if (!Number.isFinite(numeric) || !unit) {
    return normalized;
  }

  return `${formatNumericString(numeric)} ${unit}`;
};

export const normalizeQuestionType = (value, fallback = null) => {
  const normalizedKey = cleanValue(value).toLowerCase();

  if (!normalizedKey) {
    return fallback;
  }

  if (QUESTION_TYPE_CONFIG[normalizedKey]) {
    return normalizedKey;
  }

  if (QUESTION_TYPE_ALIASES[normalizedKey]) {
    return QUESTION_TYPE_ALIASES[normalizedKey];
  }

  return fallback;
};

export const inferQuestionTypeFromAnswer = (
  value,
  fallback = DEFAULT_QUESTION_TYPE
) => {
  const rawValue = cleanValue(value);

  if (!rawValue) {
    return fallback;
  }

  if (normalizeBooleanAnswer(rawValue)) {
    return 'boolean';
  }

  if (FRACTION_PATTERN.test(rawValue)) {
    return 'fraction';
  }

  if (PERCENTAGE_PATTERN.test(rawValue)) {
    return 'percentage';
  }

  if (normalizeTimeAnswer(rawValue)) {
    return 'time';
  }

  if (rawValue.includes('.') || rawValue.includes(',')) {
    return DECIMAL_PATTERN.test(rawValue) ? 'decimal' : fallback;
  }

  if (INTEGER_PATTERN.test(rawValue)) {
    return 'integer';
  }

  if (rawValue.includes('=')) {
    return 'equation';
  }

  if (normalizeUnitAnswer(rawValue)) {
    return 'unit';
  }

  return fallback;
};

export const resolveQuestionType = (value, options = {}) => {
  const {
    fallback = DEFAULT_QUESTION_TYPE,
    correctAnswer,
    allowInferFromAnswer = true,
  } = options;

  const normalizedType = normalizeQuestionType(value);

  if (normalizedType) {
    return normalizedType;
  }

  if (allowInferFromAnswer) {
    return inferQuestionTypeFromAnswer(correctAnswer, fallback);
  }

  return fallback;
};

export const getQuestionTypeMeta = (value) =>
  QUESTION_TYPE_CONFIG[normalizeQuestionType(value, DEFAULT_QUESTION_TYPE)] ||
  QUESTION_TYPE_CONFIG[DEFAULT_QUESTION_TYPE];

export const getQuestionTypeChoiceCount = (value, correctAnswer) =>
  getQuestionTypeMeta(
    resolveQuestionType(value, {
      correctAnswer,
      allowInferFromAnswer: true,
      fallback: DEFAULT_QUESTION_TYPE,
    })
  ).choiceCount;

export const formatQuestionTypeValue = (type, value) => {
  const normalizedType = resolveQuestionType(type, {
    correctAnswer: value,
    allowInferFromAnswer: true,
    fallback: DEFAULT_QUESTION_TYPE,
  });
  const rawValue = cleanValue(value);

  if (!rawValue) {
    return '';
  }

  if (normalizedType === 'boolean') {
    const normalizedBoolean = normalizeBooleanAnswer(rawValue);

    if (normalizedBoolean === 'true') {
      return 'Vrai';
    }

    if (normalizedBoolean === 'false') {
      return 'Faux';
    }
  }

  if (normalizedType === 'time') {
    return normalizeTimeAnswer(rawValue) || rawValue;
  }

  if (normalizedType === 'percentage') {
    return (normalizePercentageAnswer(rawValue) || rawValue).replace(
      /\./g,
      ','
    );
  }

  if (normalizedType === 'decimal') {
    return rawValue.replace(/\./g, ',');
  }

  return rawValue;
};

export const isQuestionType = (value) => Boolean(normalizeQuestionType(value));

export const getQuestionTypeErrorMessage = (side = 'server') =>
  side === 'client'
    ? 'Type de reponse inconnu cote client.'
    : 'Type de reponse inconnu.';

export const mapType = (value, options) => resolveQuestionType(value, options);
