import {
  getQuestionTypeErrorMessage,
  normalizeBooleanAnswer,
  normalizeEquationAnswer,
  normalizePercentageAnswer,
  normalizeTimeAnswer,
  normalizeUnitAnswer,
  resolveQuestionType,
} from './questionTypes';

const FRACTION_PATTERN = /^-?\d+\s*\/\s*-?\d+$/;
const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(?:[.,]\d+)?$/;

const formatNumericString = (value) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const normalizeFraction = (value) => {
  const [numeratorPart, denominatorPart] = value
    .split('/')
    .map((part) => part.trim());
  const numerator = Number(numeratorPart);
  const denominator = Number(denominatorPart);

  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return null;
  }

  return `${numerator}/${denominator}`;
};

export const validateCorrectAnswer = (type, value) => {
  const rawValue = String(value ?? '').trim();
  const normalizedType = resolveQuestionType(type, {
    correctAnswer: rawValue,
    allowInferFromAnswer: false,
    fallback: null,
  });

  if (!rawValue) {
    return {
      isValid: false,
      error: 'La reponse correcte est obligatoire.',
    };
  }

  if (normalizedType === 'fraction') {
    if (!FRACTION_PATTERN.test(rawValue)) {
      return {
        isValid: false,
        error: 'La fraction doit etre au format numerateur/denominateur.',
      };
    }

    const normalized = normalizeFraction(rawValue);

    if (!normalized) {
      return {
        isValid: false,
        error: 'La fraction est invalide.',
      };
    }

    return {
      isValid: true,
      type: normalizedType,
      normalized,
    };
  }

  if (normalizedType === 'integer') {
    if (!INTEGER_PATTERN.test(rawValue.replace(',', '.'))) {
      return {
        isValid: false,
        error: 'La reponse entiere doit contenir uniquement des chiffres.',
      };
    }

    return {
      isValid: true,
      type: normalizedType,
      normalized: String(Math.trunc(Number(rawValue.replace(',', '.')))),
    };
  }

  if (normalizedType === 'decimal') {
    if (!DECIMAL_PATTERN.test(rawValue)) {
      return {
        isValid: false,
        error: 'La reponse decimale est invalide.',
      };
    }

    const numeric = Number(rawValue.replace(',', '.'));

    if (!Number.isFinite(numeric)) {
      return {
        isValid: false,
        error: 'La reponse decimale est invalide.',
      };
    }

    return {
      isValid: true,
      type: normalizedType,
      normalized: formatNumericString(numeric),
    };
  }

  if (normalizedType === 'percentage') {
    const normalized = normalizePercentageAnswer(rawValue);

    if (!normalized) {
      return {
        isValid: false,
        error: 'Le pourcentage doit etre un nombre suivi du symbole %.',
      };
    }

    return {
      isValid: true,
      type: normalizedType,
      normalized,
    };
  }

  if (normalizedType === 'time') {
    const normalized = normalizeTimeAnswer(rawValue);

    if (!normalized) {
      return {
        isValid: false,
        error: "L'heure doit etre au format HH:MM ou 9h30.",
      };
    }

    return {
      isValid: true,
      type: normalizedType,
      normalized,
    };
  }

  if (normalizedType === 'boolean') {
    const normalized = normalizeBooleanAnswer(rawValue);

    if (!normalized) {
      return {
        isValid: false,
        error: 'La reponse doit etre vrai ou faux.',
      };
    }

    return {
      isValid: true,
      type: normalizedType,
      normalized,
    };
  }

  if (normalizedType === 'equation') {
    const normalized = normalizeEquationAnswer(rawValue);

    if (!normalized) {
      return {
        isValid: false,
        error: "L'equation ne peut pas etre vide.",
      };
    }

    return {
      isValid: true,
      type: normalizedType,
      normalized,
    };
  }

  if (normalizedType === 'unit') {
    const normalized = normalizeUnitAnswer(rawValue);

    if (!normalized) {
      return {
        isValid: false,
        error: 'La reponse avec unite doit contenir une valeur et une unite.',
      };
    }

    return {
      isValid: true,
      type: normalizedType,
      normalized,
    };
  }

  return {
    isValid: false,
    error: getQuestionTypeErrorMessage('server'),
  };
};
