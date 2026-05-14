import { addChoices } from '../utils/choiceGenerator';

// Room data and configurations
export const ROOMS = [
  {
    id: 1,
    name: "Salle d'arithmetique",
    description: 'Maitrise les operations de base',
    color: 'from-blue-600 to-blue-400',
    borderColor: 'border-blue-500',
    bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    emoji: '🔢',
    timer: 30,
  },
  {
    id: 2,
    name: "Salle d'algebre",
    description: 'Resous les equations',
    color: 'from-purple-600 to-purple-400',
    borderColor: 'border-purple-500',
    bgLight: 'bg-purple-50 dark:bg-purple-900/20',
    emoji: '🔤',
    timer: 30,
  },
  {
    id: 3,
    name: 'Salle de geometrie',
    description: 'Calcule les formes',
    color: 'from-emerald-600 to-emerald-400',
    borderColor: 'border-emerald-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    emoji: '📐',
    timer: 30,
  },
  {
    id: 4,
    name: 'Salle de logique',
    description: 'Trouve le motif',
    color: 'from-orange-600 to-orange-400',
    borderColor: 'border-orange-500',
    bgLight: 'bg-orange-50 dark:bg-orange-900/20',
    emoji: '🧩',
    timer: 30,
  },
  {
    id: 5,
    name: 'Evasion finale',
    description: 'Le defi ultime',
    color: 'from-red-600 to-red-400',
    borderColor: 'border-red-500',
    bgLight: 'bg-red-50 dark:bg-red-900/20',
    emoji: '👑',
    timer: 20,
  },
];

// Question generators by room
export const generateQuestion = (roomId, level) => {
  if (roomId === 1) {
    return generateArithmeticQuestion(level);
  } else if (roomId === 2) {
    return generateAlgebraQuestion(level);
  } else if (roomId === 3) {
    return generateGeometryQuestion(level);
  } else if (roomId === 4) {
    return generateLogicQuestion(level);
  } else if (roomId === 5) {
    return generateFinalQuestion(level);
  }
};

// Room 1: Arithmetic Questions
const generateArithmeticQuestion = (level) => {
  let question, answer, difficulty;

  if (level === 1) {
    // Simple addition
    difficulty = 'easy';
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    question = `${a} + ${b} = ?`;
    answer = a + b;
  } else if (level === 2) {
    // Simple subtraction
    difficulty = 'easy';
    const a = Math.floor(Math.random() * 20) + 10;
    const b = Math.floor(Math.random() * a);
    question = `${a} - ${b} = ?`;
    answer = a - b;
  } else if (level === 3) {
    // Multiplication
    difficulty = 'medium';
    const a = Math.floor(Math.random() * 10) + 2;
    const b = Math.floor(Math.random() * 10) + 2;
    question = `${a} × ${b} = ?`;
    answer = a * b;
  } else if (level === 4) {
    // Division
    difficulty = 'medium';
    const b = Math.floor(Math.random() * 9) + 2;
    const result = Math.floor(Math.random() * 10) + 2;
    const a = b * result;
    question = `${a} ÷ ${b} = ?`;
    answer = result;
  } else {
    // Mixed operations
    difficulty = 'hard';
    const ops = ['+', '-', '×'];
    const op1 = ops[Math.floor(Math.random() * ops.length)];
    const op2 = ops[Math.floor(Math.random() * ops.length)];
    const a = Math.floor(Math.random() * 15) + 5;
    const b = Math.floor(Math.random() * 15) + 5;
    const c = Math.floor(Math.random() * 15) + 5;

    question = `${a} ${op1} ${b} ${op2} ${c} = ?`;
    answer = eval(`${a} ${op1.replace('×', '*')} ${b} ${op2.replace('×', '*')} ${c}`);
  }

  return addChoices({
    question,
    answer,
    difficulty,
    type: 'arithmetic',
  });
};

// Room 2: Algebra Questions
const generateAlgebraQuestion = (level) => {
  let question, answer, difficulty;

  if (level === 1) {
    // x + a = b
    difficulty = 'easy';
    const a = Math.floor(Math.random() * 10) + 1;
    const answer_val = Math.floor(Math.random() * 10) + 1;
    const b = a + answer_val;
    question = `Solve: x + ${a} = ${b}`;
    answer = answer_val;
  } else if (level === 2) {
    // ax = b
    difficulty = 'medium';
    const a = Math.floor(Math.random() * 9) + 2;
    const answer_val = Math.floor(Math.random() * 10) + 1;
    const b = a * answer_val;
    question = `Solve: ${a}x = ${b}`;
    answer = answer_val;
  } else if (level === 3) {
    // ax + b = c
    difficulty = 'medium';
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 10) + 1;
    const answer_val = Math.floor(Math.random() * 8) + 2;
    const c = a * answer_val + b;
    question = `Solve: ${a}x + ${b} = ${c}`;
    answer = answer_val;
  } else if (level === 4) {
    // ax + b = cx + d
    difficulty = 'hard';
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 10) + 5;
    const c = Math.floor(Math.random() * 5) + 1;
    const answer_val = Math.floor(Math.random() * 10) + 2;
    const d = c * answer_val + b + 10;
    question = `Solve: ${a}x + ${b} = ${c}x + ${d}`;
    answer = (d - b) / (a - c);
  } else {
    // 2(x + a) = b
    difficulty = 'hard';
    const a = Math.floor(Math.random() * 8) + 2;
    const answer_val = Math.floor(Math.random() * 8) + 2;
    const b = 2 * (answer_val + a);
    question = `Solve: 2(x + ${a}) = ${b}`;
    answer = answer_val;
  }

  return addChoices({
    question,
    answer: Math.round(answer * 100) / 100,
    difficulty,
    type: 'algebra',
  });
};

// Room 3: Geometry Questions
const generateGeometryQuestion = (level) => {
  let question, answer, difficulty;

  if (level === 1) {
    // Rectangle area
    difficulty = 'easy';
    const w = Math.floor(Math.random() * 15) + 3;
    const h = Math.floor(Math.random() * 15) + 3;
    question = `Area of rectangle: width=${w}, height=${h}`;
    answer = w * h;
  } else if (level === 2) {
    // Square perimeter
    difficulty = 'medium';
    const side = Math.floor(Math.random() * 15) + 5;
    question = `Perimeter of square: side=${side}`;
    answer = side * 4;
  } else if (level === 3) {
    // Triangle area
    difficulty = 'medium';
    const base = Math.floor(Math.random() * 20) + 5;
    const height = Math.floor(Math.random() * 20) + 5;
    question = `Area of triangle: base=${base}, height=${height}`;
    answer = (base * height) / 2;
  } else if (level === 4) {
    // Circle area (π)
    difficulty = 'hard';
    const radius = Math.floor(Math.random() * 10) + 2;
    question = `Area of circle: radius=${radius} (use π≈3.14)`;
    answer = Math.round((Math.PI * radius * radius) * 100) / 100;
  } else {
    // Mixed shapes
    difficulty = 'hard';
    const shapes = ['rectangle', 'triangle', 'circle'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    if (shape === 'rectangle') {
      const w = Math.floor(Math.random() * 20) + 5;
      const h = Math.floor(Math.random() * 20) + 5;
      question = `Rectangle perimeter: w=${w}, h=${h}`;
      answer = 2 * (w + h);
    } else if (shape === 'triangle') {
      const a = Math.floor(Math.random() * 20) + 5;
      const b = Math.floor(Math.random() * 20) + 5;
      const c = Math.floor(Math.random() * 20) + 5;
      question = `Triangle perimeter: a=${a}, b=${b}, c=${c}`;
      answer = a + b + c;
    } else {
      const radius = Math.floor(Math.random() * 10) + 2;
      question = `Circle circumference: radius=${radius} (use π≈3.14)`;
      answer = Math.round((2 * Math.PI * radius) * 100) / 100;
    }
  }

  return addChoices({
    question,
    answer: Math.round(answer * 100) / 100,
    difficulty,
    type: 'geometry',
  });
};

// Room 4: Logic Questions
const generateLogicQuestion = (level) => {
  let question, answer, difficulty;

  if (level === 1) {
    // Simple sequence
    difficulty = 'easy';
    const dif = Math.floor(Math.random() * 5) + 1;
    const start = Math.floor(Math.random() * 10) + 1;
    const seq = [start, start + dif, start + 2 * dif, start + 3 * dif];
    question = `Sequence: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ?`;
    answer = seq[3] + dif;
  } else if (level === 2) {
    // Fibonacci-like
    difficulty = 'medium';
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 5) + 2;
    const c = a + b;
    const d = b + c;
    const e = c + d;
    question = `Sequence: ${a}, ${b}, ${c}, ${d}, ${e}, ?`;
    answer = d + e;
  } else if (level === 3) {
    // Powers/Squares
    difficulty = 'medium';
    const start = Math.floor(Math.random() * 4) + 2;
    const seq = [start * start, (start + 1) * (start + 1), (start + 2) * (start + 2), (start + 3) * (start + 3)];
    question = `Pattern: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ?`;
    answer = (start + 4) * (start + 4);
  } else if (level === 4) {
    // Complex pattern
    difficulty = 'hard';
    const mul = Math.floor(Math.random() * 3) + 2;
    const seq = [1, mul, mul * mul, mul * mul * mul];
    question = `Sequence: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ?`;
    answer = seq[3] * mul;
  } else {
    // Very complex
    difficulty = 'hard';
    const seq = [2, 3, 5, 8, 13, 21];
    question = `Find the pattern: 2, 3, 5, 8, 13, 21, ?`;
    answer = 34;
  }

  return addChoices({
    question,
    answer,
    difficulty,
    type: 'logic',
  });
};

// Room 5: Final Escape (Mixed Hard Questions)
const generateFinalQuestion = (level) => {
  const allTypes = ['arithmetic', 'algebra', 'geometry', 'logic'];
  const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];

  let result;
  if (randomType === 'arithmetic') {
    result = generateArithmeticQuestion(5);
  } else if (randomType === 'algebra') {
    result = generateAlgebraQuestion(5);
  } else if (randomType === 'geometry') {
    result = generateGeometryQuestion(5);
  } else {
    result = generateLogicQuestion(5);
  }
  
  // Ensure Final Escape questions are marked as hard
  return { ...result, difficulty: 'hard' };  // Already has choices from sub-generator
};
