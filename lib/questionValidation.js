import { getQuestionTypeErrorMessage, resolveQuestionType } from './questionTypes';

const FRACTION_PATTERN = /^-?\d+\s*\/\s*-?\d+$/;
const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(?:[.,]\d+)?$/;

const normalizeFraction = (value) => {
  const [numeratorPart, denominatorPart] = value.split('/').map((part) => part.trim());
  const numerator = Number(numeratorPart);
  const denominator = Number(denominatorPart);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
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
      normalized: String(Math.round(numeric * 100) / 100),
    };
  }

  return {
    isValid: false,
    error: getQuestionTypeErrorMessage('server'),
  };
};
