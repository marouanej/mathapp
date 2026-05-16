import {
  DEFAULT_QUESTION_TYPE,
  getQuestionTypeChoiceCount,
  getQuestionTypeErrorMessage,
  normalizeBooleanAnswer,
  normalizeEquationAnswer,
  normalizePercentageAnswer,
  normalizeTimeAnswer,
  normalizeUnitAnswer,
  resolveQuestionType,
} from '../lib/questionTypes';

const shuffle = (items) => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
};

const roundToTwo = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
};

const formatNumberString = (value) => {
  const rounded = roundToTwo(value);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const normalizeFraction = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const parts = value.split('/').map((part) => part.trim());

  if (parts.length !== 2) {
    return null;
  }

  const numerator = Number(parts[0]);
  const denominator = Number(parts[1]);

  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return null;
  }

  return { numerator, denominator };
};

const formatFraction = (numerator, denominator) =>
  `${numerator}/${denominator}`;

const reverseIntegerDigits = (value) => {
  const sign = value < 0 ? -1 : 1;
  const reversed = Number(String(Math.abs(value)).split('').reverse().join(''));

  return sign * reversed;
};

const createUniqueChoices = (
  correctAnswer,
  candidates,
  formatter = (value) => value,
  choiceCount = getQuestionTypeChoiceCount(DEFAULT_QUESTION_TYPE)
) => {
  const used = new Set([String(correctAnswer)]);
  const wrongAnswers = [];

  for (const candidate of candidates) {
    const formatted = formatter(candidate);

    if (formatted === null || formatted === undefined || formatted === '') {
      continue;
    }

    const key = String(formatted);

    if (used.has(key)) {
      continue;
    }

    used.add(key);
    wrongAnswers.push(formatted);

    if (wrongAnswers.length === choiceCount - 1) {
      break;
    }
  }

  return shuffle([correctAnswer, ...wrongAnswers]);
};

const fillChoices = (correctAnswer, type, choices) => {
  const choiceCount = getQuestionTypeChoiceCount(type, correctAnswer);
  const used = new Set(choices.map((choice) => String(choice)));
  const completedChoices = [...choices];

  const appendChoice = (choice) => {
    if (choice === null || choice === undefined || choice === '') {
      return;
    }

    const key = String(choice);

    if (!used.has(key)) {
      used.add(key);
      completedChoices.push(choice);
    }
  };

  const numericCorrect = Number(correctAnswer);

  if (type === 'fraction') {
    appendChoice('1/2');
    appendChoice('2/3');
    appendChoice('3/4');
  } else if (type === 'percentage') {
    const numericCorrect = Number(String(correctAnswer).replace('%', ''));
    if (Number.isFinite(numericCorrect)) {
      appendChoice(`${formatNumberString(numericCorrect + 5)}%`);
      appendChoice(`${formatNumberString(numericCorrect - 5)}%`);
      appendChoice(`${formatNumberString(numericCorrect + 10)}%`);
    }
  } else if (type === 'time') {
    appendChoice(shiftTimeChoice(correctAnswer, 5));
    appendChoice(shiftTimeChoice(correctAnswer, -5));
    appendChoice(shiftTimeChoice(correctAnswer, 30));
  } else if (type === 'boolean') {
    appendChoice(String(correctAnswer) === 'true' ? 'false' : 'true');
  } else if (type === 'equation') {
    appendChoice(replaceFirstNumericToken(correctAnswer, (value) => value + 1));
    appendChoice(replaceFirstNumericToken(correctAnswer, (value) => value - 1));
    appendChoice(swapEquationSides(correctAnswer));
  } else if (type === 'unit') {
    const unitVariant = buildUnitChoiceVariant(correctAnswer);
    appendChoice(unitVariant?.incremented);
    appendChoice(unitVariant?.decremented);
    appendChoice(unitVariant?.alternateUnit);
  } else if (Number.isFinite(numericCorrect)) {
    appendChoice(
      type === 'decimal'
        ? roundToTwo(numericCorrect + 0.25)
        : numericCorrect + 5
    );
    appendChoice(
      type === 'decimal'
        ? roundToTwo(numericCorrect - 0.25)
        : numericCorrect - 5
    );
    appendChoice(
      type === 'decimal' ? roundToTwo(numericCorrect + 1) : numericCorrect + 10
    );
  }

  while (completedChoices.length < choiceCount) {
    appendChoice(`${correctAnswer}-${completedChoices.length + 1}`);
  }

  return shuffle(completedChoices.slice(0, choiceCount));
};

const generateIntegerChoices = (correctAnswer) => {
  const numeric = Number(correctAnswer);
  const candidates = [
    numeric + 1,
    numeric - 1,
    numeric + 2,
    numeric - 2,
    reverseIntegerDigits(numeric),
    numeric + 10,
    numeric - 10,
    numeric * 2,
    numeric === 0 ? 1 : numeric / 2,
  ];

  if (Math.abs(numeric) < 10) {
    candidates.push(numeric + 3, numeric - 3);
  }

  return createUniqueChoices(
    numeric,
    candidates,
    (value) => {
      if (!Number.isFinite(value)) {
        return null;
      }

      return Math.round(value);
    },
    getQuestionTypeChoiceCount('integer')
  );
};

const generateDecimalChoices = (correctAnswer) => {
  const numeric = Number(correctAnswer);
  const roundedOne = roundToTwo(Number(numeric.toFixed(1)));
  const roundedZero = roundToTwo(Math.round(numeric));
  const candidates = [
    roundedOne,
    roundedZero,
    roundToTwo(numeric * 10),
    roundToTwo(numeric / 10),
    roundToTwo(numeric + 0.1),
    roundToTwo(numeric - 0.1),
    roundToTwo(numeric + 1),
    roundToTwo(numeric - 1),
    roundToTwo(Math.trunc(numeric) + 0.5),
  ];

  return createUniqueChoices(
    roundToTwo(numeric),
    candidates,
    (value) => {
      if (!Number.isFinite(value)) {
        return null;
      }

      return roundToTwo(value);
    },
    getQuestionTypeChoiceCount('decimal')
  );
};

const generateFractionChoices = (correctAnswer) => {
  const fraction = normalizeFraction(correctAnswer);

  if (!fraction) {
    return shuffle([correctAnswer]);
  }

  const { numerator, denominator } = fraction;
  const candidates = [
    formatFraction(numerator + 1, denominator),
    formatFraction(numerator - 1, denominator),
    formatFraction(numerator, denominator + 1),
    formatFraction(numerator + denominator, denominator),
    formatFraction(numerator, numerator + denominator),
    formatFraction(numerator + 1, denominator + 1),
    formatFraction(numerator * 2, denominator),
    formatFraction(numerator, denominator * 2),
  ];

  return createUniqueChoices(
    correctAnswer,
    candidates,
    (value) => {
      const parsed = normalizeFraction(value);

      if (!parsed || parsed.denominator === 0) {
        return null;
      }

      return formatFraction(parsed.numerator, parsed.denominator);
    },
    getQuestionTypeChoiceCount('fraction')
  );
};

const parsePercentageChoice = (value) => {
  const normalized = normalizePercentageAnswer(value);

  if (!normalized) {
    return null;
  }

  return Number(normalized.slice(0, -1));
};

const shiftTimeChoice = (value, deltaMinutes) => {
  const normalized = normalizeTimeAnswer(value);

  if (!normalized) {
    return null;
  }

  const [hours, minutes] = normalized.split(':').map(Number);
  const totalMinutes =
    (((hours * 60 + minutes + deltaMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);

  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(
    totalMinutes % 60
  ).padStart(2, '0')}`;
};

const replaceFirstNumericToken = (value, transform) => {
  const source = String(value ?? '');
  const match = source.match(/-?\d+(?:[.,]\d+)?/);

  if (!match) {
    return null;
  }

  const numeric = Number(match[0].replace(',', '.'));

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return source.replace(match[0], formatNumberString(transform(numeric)));
};

const swapEquationSides = (value) => {
  const normalized = normalizeEquationAnswer(value);

  if (!normalized || !normalized.includes('=')) {
    return null;
  }

  const parts = normalized.split('=');

  if (parts.length !== 2) {
    return null;
  }

  return `${parts[1].trim()} = ${parts[0].trim()}`;
};

const parseUnitChoice = (value) => {
  const normalized = normalizeUnitAnswer(value);

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^(-?\d+(?:\.\d+)?)\s+(.+)$/);

  if (!match) {
    return null;
  }

  const numeric = Number(match[1]);
  const unit = match[2].trim();

  if (!Number.isFinite(numeric) || !unit) {
    return null;
  }

  return {
    numeric,
    unit,
  };
};

const UNIT_VARIANTS = {
  cm: 'm',
  m: 'cm',
  mm: 'cm',
  km: 'm',
  g: 'kg',
  kg: 'g',
  l: 'mL',
  ml: 'L',
  min: 'h',
  h: 'min',
};

const buildUnitChoiceVariant = (value) => {
  const parsed = parseUnitChoice(value);

  if (!parsed) {
    return null;
  }

  const alternateUnit = UNIT_VARIANTS[parsed.unit.toLowerCase()];

  return {
    incremented: `${formatNumberString(parsed.numeric + 1)} ${parsed.unit}`,
    decremented: `${formatNumberString(parsed.numeric - 1)} ${parsed.unit}`,
    alternateUnit: alternateUnit
      ? `${formatNumberString(parsed.numeric)} ${alternateUnit}`
      : null,
  };
};

const generateTimeChoices = (correctAnswer) =>
  createUniqueChoices(
    correctAnswer,
    [
      shiftTimeChoice(correctAnswer, 5),
      shiftTimeChoice(correctAnswer, -5),
      shiftTimeChoice(correctAnswer, 10),
      shiftTimeChoice(correctAnswer, -10),
      shiftTimeChoice(correctAnswer, 15),
      shiftTimeChoice(correctAnswer, 30),
    ],
    (value) => normalizeTimeAnswer(value),
    getQuestionTypeChoiceCount('time', correctAnswer)
  );

const generatePercentageChoices = (correctAnswer) => {
  const numeric = parsePercentageChoice(correctAnswer);

  if (!Number.isFinite(numeric)) {
    return shuffle([correctAnswer]);
  }

  return createUniqueChoices(
    correctAnswer,
    [
      `${formatNumberString(numeric + 5)}%`,
      `${formatNumberString(numeric - 5)}%`,
      `${formatNumberString(numeric + 10)}%`,
      `${formatNumberString(numeric - 10)}%`,
      `${formatNumberString(numeric / 10)}%`,
      `${formatNumberString(numeric * 10)}%`,
    ],
    (value) => normalizePercentageAnswer(value),
    getQuestionTypeChoiceCount('percentage', correctAnswer)
  );
};

const generateBooleanChoices = (correctAnswer) =>
  shuffle([correctAnswer, String(correctAnswer) === 'true' ? 'false' : 'true']);

const generateEquationChoices = (correctAnswer) =>
  createUniqueChoices(
    correctAnswer,
    [
      replaceFirstNumericToken(correctAnswer, (value) => value + 1),
      replaceFirstNumericToken(correctAnswer, (value) => value - 1),
      replaceFirstNumericToken(correctAnswer, (value) => value + 2),
      swapEquationSides(correctAnswer),
      String(correctAnswer).includes('+')
        ? String(correctAnswer).replace('+', '-')
        : null,
      String(correctAnswer).includes('-')
        ? String(correctAnswer).replace('-', '+')
        : null,
    ],
    (value) => normalizeEquationAnswer(value),
    getQuestionTypeChoiceCount('equation', correctAnswer)
  );

const generateUnitChoices = (correctAnswer) => {
  const variants = buildUnitChoiceVariant(correctAnswer);

  if (!variants) {
    return shuffle([correctAnswer]);
  }

  return createUniqueChoices(
    correctAnswer,
    [variants.incremented, variants.decremented, variants.alternateUnit],
    (value) => normalizeUnitAnswer(value),
    getQuestionTypeChoiceCount('unit', correctAnswer)
  );
};

const FALLBACK_EXPLANATIONS = {
  integer:
    'Erreur classique : pense aux voisins du nombre et a l ordre des chiffres.',
  decimal: 'Erreur classique : regarde bien la virgule et les arrondis.',
  fraction: 'Erreur classique : verifie le numerateur et le denominateur.',
  time: 'Regarde attentivement les heures et les minutes.',
  percentage: 'Verifie la valeur et le symbole %.',
  boolean: "Relis bien l'affirmation avant de choisir vrai ou faux.",
  equation: "Reprends l'equation et verifie chaque terme.",
  unit: "Verifie la valeur numerique et l'unite.",
};

export const generateChoices = (correctAnswer, type) => {
  const normalizedType = resolveQuestionType(type, {
    correctAnswer,
    allowInferFromAnswer: true,
    fallback: DEFAULT_QUESTION_TYPE,
  });

  if (normalizedType === 'integer') {
    return fillChoices(
      correctAnswer,
      normalizedType,
      generateIntegerChoices(correctAnswer)
    );
  }

  if (normalizedType === 'decimal') {
    return fillChoices(
      correctAnswer,
      normalizedType,
      generateDecimalChoices(correctAnswer)
    );
  }

  if (normalizedType === 'fraction') {
    return fillChoices(
      correctAnswer,
      normalizedType,
      generateFractionChoices(correctAnswer)
    );
  }

  if (normalizedType === 'time') {
    return fillChoices(
      correctAnswer,
      normalizedType,
      generateTimeChoices(correctAnswer)
    );
  }

  if (normalizedType === 'percentage') {
    return fillChoices(
      correctAnswer,
      normalizedType,
      generatePercentageChoices(correctAnswer)
    );
  }

  if (normalizedType === 'boolean') {
    return fillChoices(
      correctAnswer,
      normalizedType,
      generateBooleanChoices(correctAnswer)
    );
  }

  if (normalizedType === 'equation') {
    return fillChoices(
      correctAnswer,
      normalizedType,
      generateEquationChoices(correctAnswer)
    );
  }

  if (normalizedType === 'unit') {
    return fillChoices(
      correctAnswer,
      normalizedType,
      generateUnitChoices(correctAnswer)
    );
  }

  return fillChoices(correctAnswer, normalizedType, [correctAnswer]);
};

export const explainWrongAnswer = (correctAnswer, selectedAnswer, type) => {
  const normalizedType = resolveQuestionType(type, {
    correctAnswer,
    allowInferFromAnswer: true,
    fallback: DEFAULT_QUESTION_TYPE,
  });

  if (normalizedType === 'integer') {
    const numericCorrect = Number(correctAnswer);
    const numericSelected = Number(selectedAnswer);

    if (
      numericSelected === numericCorrect + 1 ||
      numericSelected === numericCorrect - 1
    ) {
      return 'Tu es tres proche : attention a l erreur de plus ou moins 1.';
    }

    if (numericSelected === reverseIntegerDigits(numericCorrect)) {
      return 'Attention : les chiffres semblent avoir ete inverses.';
    }
  }

  if (normalizedType === 'decimal') {
    const numericCorrect = Number(correctAnswer);
    const numericSelected = Number(selectedAnswer);

    if (
      numericSelected === roundToTwo(numericCorrect * 10) ||
      numericSelected === roundToTwo(numericCorrect / 10)
    ) {
      return 'Attention a la position de la virgule.';
    }

    if (
      numericSelected === roundToTwo(Math.round(numericCorrect)) ||
      numericSelected === roundToTwo(Number(numericCorrect.toFixed(1)))
    ) {
      return "Attention a l'arrondi.";
    }
  }

  if (normalizedType === 'fraction') {
    const correct = normalizeFraction(correctAnswer);
    const selected = normalizeFraction(selectedAnswer);

    if (correct && selected) {
      if (selected.numerator === correct.numerator + correct.denominator) {
        return 'Attention : il ne faut pas additionner numerateur et denominateur.';
      }

      if (selected.denominator !== correct.denominator) {
        return 'Verifie bien le denominateur commun.';
      }
    }
  }

  if (normalizedType === 'time') {
    const selectedTime = normalizeTimeAnswer(selectedAnswer);
    const correctTime = normalizeTimeAnswer(correctAnswer);

    if (selectedTime && correctTime) {
      return 'Regarde bien les minutes et la position de chaque chiffre.';
    }
  }

  if (normalizedType === 'percentage') {
    const numericCorrect = parsePercentageChoice(correctAnswer);
    const numericSelected = parsePercentageChoice(selectedAnswer);

    if (
      Number.isFinite(numericCorrect) &&
      Number.isFinite(numericSelected) &&
      numericSelected === numericCorrect / 10
    ) {
      return 'Attention : le pourcentage semble decale d un facteur 10.';
    }
  }

  return (
    FALLBACK_EXPLANATIONS[normalizedType] ||
    getQuestionTypeErrorMessage('client')
  );
};

const normalizeCorrectAnswerForChoices = (correctAnswer, type) => {
  const rawValue = String(correctAnswer ?? '').trim();

  if (type === 'fraction') {
    return rawValue;
  }

  if (type === 'integer') {
    return Math.round(Number(rawValue.replace(',', '.')));
  }

  if (type === 'decimal') {
    return roundToTwo(Number(rawValue.replace(',', '.')));
  }

  if (type === 'time') {
    return normalizeTimeAnswer(rawValue) || rawValue;
  }

  if (type === 'percentage') {
    return normalizePercentageAnswer(rawValue) || rawValue;
  }

  if (type === 'boolean') {
    return normalizeBooleanAnswer(rawValue) || rawValue;
  }

  if (type === 'equation') {
    return normalizeEquationAnswer(rawValue) || rawValue;
  }

  if (type === 'unit') {
    return normalizeUnitAnswer(rawValue) || rawValue;
  }

  return rawValue;
};

export const buildQuestionWithChoices = (question) => {
  const normalizedType = resolveQuestionType(
    question.responseType ?? question.type,
    {
      correctAnswer: question.correctAnswer,
      allowInferFromAnswer: true,
      fallback: DEFAULT_QUESTION_TYPE,
    }
  );
  const normalizedCorrectAnswer = normalizeCorrectAnswerForChoices(
    question.correctAnswer,
    normalizedType
  );

  return {
    ...question,
    responseType: normalizedType,
    type: normalizedType,
    correctAnswer: normalizedCorrectAnswer,
    choices: generateChoices(normalizedCorrectAnswer, normalizedType),
  };
};

export const addChoices = ({
  question,
  answer,
  correctAnswer,
  type,
  ...rest
}) => {
  const finalAnswer = correctAnswer ?? answer;
  const normalizedType = resolveQuestionType(type, {
    correctAnswer: finalAnswer,
    allowInferFromAnswer: true,
    fallback: DEFAULT_QUESTION_TYPE,
  });
  const normalizedCorrectAnswer = normalizeCorrectAnswerForChoices(
    finalAnswer,
    normalizedType
  );

  return {
    ...rest,
    question,
    type: normalizedType,
    responseType: normalizedType,
    correctAnswer: normalizedCorrectAnswer,
    choices: generateChoices(normalizedCorrectAnswer, normalizedType),
  };
};

export const generateChoicesExample = buildQuestionWithChoices({
  question: 'Combien font 1,2 + 0,3 ?',
  correctAnswer: 1.5,
  type: 'decimal',
});
