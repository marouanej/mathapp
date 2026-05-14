export const QUESTION_TYPES = ['integer', 'decimal', 'fraction'];

export const QUESTION_TYPE_OPTIONS = [
  { value: 'integer', label: 'Entier' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'fraction', label: 'Fraction' },
];

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
};

const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(?:[.,]\d+)?$/;
const FRACTION_PATTERN = /^-?\d+\s*\/\s*-?\d+$/;

export const normalizeQuestionType = (value, fallback = null) => {
  const normalizedKey = String(value ?? '')
    .trim()
    .toLowerCase();

  if (QUESTION_TYPE_ALIASES[normalizedKey]) {
    return QUESTION_TYPE_ALIASES[normalizedKey];
  }

  return fallback;
};

export const inferQuestionTypeFromAnswer = (value, fallback = 'integer') => {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return fallback;
  }

  if (FRACTION_PATTERN.test(rawValue)) {
    return 'fraction';
  }

  if (rawValue.includes('.') || rawValue.includes(',')) {
    return DECIMAL_PATTERN.test(rawValue) ? 'decimal' : fallback;
  }

  if (INTEGER_PATTERN.test(rawValue)) {
    return 'integer';
  }

  return fallback;
};

export const resolveQuestionType = (value, options = {}) => {
  const {
    fallback = 'integer',
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

export const isQuestionType = (value) => QUESTION_TYPES.includes(String(value ?? '').trim());

export const getQuestionTypeErrorMessage = (side = 'server') =>
  side === 'client' ? 'Type de reponse inconnu cote client.' : 'Type de reponse inconnu.';

// Backward-compatible alias for older code paths that still reference `mapType`.
export const mapType = (value, options) => resolveQuestionType(value, options);
