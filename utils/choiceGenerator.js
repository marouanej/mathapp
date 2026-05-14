import { getQuestionTypeErrorMessage, resolveQuestionType } from '../lib/questionTypes';

const MAX_CHOICES = 4;

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

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }

  return { numerator, denominator };
};

const formatFraction = (numerator, denominator) => `${numerator}/${denominator}`;

const reverseIntegerDigits = (value) => {
  const sign = value < 0 ? -1 : 1;
  const reversed = Number(String(Math.abs(value)).split('').reverse().join(''));

  return sign * reversed;
};

const createUniqueChoices = (correctAnswer, candidates, formatter = (value) => value) => {
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

    if (wrongAnswers.length === MAX_CHOICES - 1) {
      break;
    }
  }

  return shuffle([correctAnswer, ...wrongAnswers]);
};

const fillChoices = (correctAnswer, type, choices) => {
  const used = new Set(choices.map((choice) => String(choice)));
  const completedChoices = [...choices];

  const appendChoice = (choice) => {
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
  } else if (Number.isFinite(numericCorrect)) {
    appendChoice(type === 'decimal' ? roundToTwo(numericCorrect + 0.25) : numericCorrect + 5);
    appendChoice(type === 'decimal' ? roundToTwo(numericCorrect - 0.25) : numericCorrect - 5);
    appendChoice(type === 'decimal' ? roundToTwo(numericCorrect + 1) : numericCorrect + 10);
  }

  while (completedChoices.length < MAX_CHOICES) {
    appendChoice(`${correctAnswer}-${completedChoices.length + 1}`);
  }

  return shuffle(completedChoices.slice(0, MAX_CHOICES));
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

  return createUniqueChoices(numeric, candidates, (value) => {
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.round(value);
  });
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

  return createUniqueChoices(roundToTwo(numeric), candidates, (value) => {
    if (!Number.isFinite(value)) {
      return null;
    }

    return roundToTwo(value);
  });
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

  return createUniqueChoices(correctAnswer, candidates, (value) => {
    const parsed = normalizeFraction(value);

    if (!parsed || parsed.denominator === 0) {
      return null;
    }

    return formatFraction(parsed.numerator, parsed.denominator);
  });
};

const FALLBACK_EXPLANATIONS = {
  integer: 'Erreur classique : pense aux voisins du nombre et a l ordre des chiffres.',
  decimal: 'Erreur classique : regarde bien la virgule et les arrondis.',
  fraction: 'Erreur classique : verifie le numerateur et le denominateur.',
};

export const generateChoices = (correctAnswer, type) => {
  const normalizedType = resolveQuestionType(type, {
    correctAnswer,
    allowInferFromAnswer: true,
    fallback: 'integer',
  });

  if (normalizedType === 'integer') {
    return fillChoices(correctAnswer, normalizedType, generateIntegerChoices(correctAnswer));
  }

  if (normalizedType === 'decimal') {
    return fillChoices(correctAnswer, normalizedType, generateDecimalChoices(correctAnswer));
  }

  if (normalizedType === 'fraction') {
    return fillChoices(correctAnswer, normalizedType, generateFractionChoices(correctAnswer));
  }

  return fillChoices(correctAnswer, normalizedType, [correctAnswer]);
};

export const explainWrongAnswer = (correctAnswer, selectedAnswer, type) => {
  const normalizedType = resolveQuestionType(type, {
    correctAnswer,
    allowInferFromAnswer: true,
    fallback: 'integer',
  });

  if (normalizedType === 'integer') {
    const numericCorrect = Number(correctAnswer);
    const numericSelected = Number(selectedAnswer);

    if (numericSelected === numericCorrect + 1 || numericSelected === numericCorrect - 1) {
      return 'Tu es tres proche : attention a l erreur de plus ou moins 1.';
    }

    if (numericSelected === reverseIntegerDigits(numericCorrect)) {
      return "Attention : les chiffres semblent avoir ete inverses.";
    }
  }

  if (normalizedType === 'decimal') {
    const numericCorrect = Number(correctAnswer);
    const numericSelected = Number(selectedAnswer);

    if (numericSelected === roundToTwo(numericCorrect * 10) || numericSelected === roundToTwo(numericCorrect / 10)) {
      return 'Attention a la position de la virgule.';
    }

    if (numericSelected === roundToTwo(Math.round(numericCorrect)) || numericSelected === roundToTwo(Number(numericCorrect.toFixed(1)))) {
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

  return FALLBACK_EXPLANATIONS[normalizedType] || getQuestionTypeErrorMessage('client');
};

export const buildQuestionWithChoices = (question) => ({
  ...question,
  responseType: resolveQuestionType(question.responseType ?? question.type, {
    correctAnswer: question.correctAnswer,
    allowInferFromAnswer: true,
    fallback: 'integer',
  }),
  type: resolveQuestionType(question.responseType ?? question.type, {
    correctAnswer: question.correctAnswer,
    allowInferFromAnswer: true,
    fallback: 'integer',
  }),
  correctAnswer:
    resolveQuestionType(question.responseType ?? question.type, {
      correctAnswer: question.correctAnswer,
      allowInferFromAnswer: true,
      fallback: 'integer',
    }) === 'fraction'
      ? question.correctAnswer
      : roundToTwo(Number(String(question.correctAnswer).replace(',', '.'))),
  choices: generateChoices(
    resolveQuestionType(question.responseType ?? question.type, {
      correctAnswer: question.correctAnswer,
      allowInferFromAnswer: true,
      fallback: 'integer',
    }) === 'fraction'
      ? question.correctAnswer
      : roundToTwo(Number(String(question.correctAnswer).replace(',', '.'))),
    resolveQuestionType(question.responseType ?? question.type, {
      correctAnswer: question.correctAnswer,
      allowInferFromAnswer: true,
      fallback: 'integer',
    })
  ),
});

export const addChoices = ({ question, answer, correctAnswer, type, ...rest }) => {
  const finalAnswer = correctAnswer ?? answer;
  const normalizedType = resolveQuestionType(type, {
    correctAnswer: finalAnswer,
    allowInferFromAnswer: true,
    fallback: 'integer',
  });

  return {
    ...rest,
    question,
    type: normalizedType,
    responseType: normalizedType,
    correctAnswer: finalAnswer,
    choices: generateChoices(finalAnswer, normalizedType),
  };
};

export const generateChoicesExample = buildQuestionWithChoices({
  question: 'Combien font 1,2 + 0,3 ?',
  correctAnswer: 1.5,
  type: 'decimal',
});
