import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  formatQuestionTypeValue,
  getQuestionTypeChoiceCount,
  normalizePercentageAnswer,
  normalizeTimeAnswer,
  resolveQuestionType,
} from '../../lib/questionTypes';
import {
  buildQuestionWithChoices,
  explainWrongAnswer,
} from '../../utils/choiceGenerator';

const INITIAL_LIVES = 3;
const BASE_POINTS = 100;
const STREAK_BONUS = 10;
const SCREENS = {
  rooms: 'rooms',
  modules: 'modules',
  play: 'play',
  summary: 'summary',
};
const TIME_BY_DIFFICULTY = { easy: 30, medium: 20, hard: 15 };
const CHOICE_STYLES = [
  'border-sky-300 bg-[linear-gradient(180deg,#38bdf8,#0ea5e9)] text-white shadow-[0_8px_0_#0284c7]',
  'border-emerald-300 bg-[linear-gradient(180deg,#34d399,#10b981)] text-white shadow-[0_8px_0_#059669]',
  'border-amber-300 bg-[linear-gradient(180deg,#fcd34d,#f59e0b)] text-slate-900 shadow-[0_8px_0_#d97706]',
  'border-fuchsia-300 bg-[linear-gradient(180deg,#f472b6,#ec4899)] text-white shadow-[0_8px_0_#db2777]',
];

const cx = (...classes) => classes.filter(Boolean).join(' ');
const id = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(
    36
  )}`;
const formatChoice = (value, type) => {
  if (typeof value === 'number') {
    return String(value).replace('.', ',');
  }

  return formatQuestionTypeValue(type, value);
};
const shuffle = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const inferDifficulty = (question) => {
  const prompt = `${question?.question || ''} ${question?.correctAnswer || ''}`;
  const numbers =
    prompt
      .match(/-?\d+(?:[.,]\d+)?/g)
      ?.map((entry) => Number(entry.replace(',', '.')))
      .filter((entry) => Number.isFinite(entry)) || [];
  const hasDecimal =
    /-?\d+[.,]\d+/.test(prompt) ||
    question?.type === 'decimal' ||
    question?.type === 'percentage';
  const isComplex =
    question?.type === 'fraction' ||
    question?.type === 'equation' ||
    question?.type === 'unit' ||
    question?.type === 'time' ||
    (prompt.match(/[+\-x*/÷]/g) || []).length >= 2 ||
    prompt.length > 44;

  if (question?.type === 'boolean') return 'easy';
  if (hasDecimal || isComplex) return 'hard';
  if (numbers.length && numbers.every((entry) => Math.abs(entry) <= 10))
    return 'easy';
  return 'medium';
};

const fallbackChoices = (correctAnswer, type) => {
  if (type === 'boolean') {
    return [String(correctAnswer) === 'true' ? 'false' : 'true'];
  }

  if (type === 'fraction' || String(correctAnswer).includes('/')) {
    const [n, d] = String(correctAnswer)
      .split('/')
      .map((value) => Number(value.trim()));
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) {
      return [`${n + 1}/${d}`, `${Math.max(1, n - 1)}/${d}`, `${n}/${d + 1}`];
    }
    return ['1/2', '2/3', '3/4'];
  }

  if (type === 'percentage') {
    const normalized = normalizePercentageAnswer(correctAnswer);
    const numeric = normalized
      ? Number(normalized.replace('%', ''))
      : Number.NaN;

    if (Number.isFinite(numeric)) {
      return [`${numeric + 5}%`, `${numeric - 5}%`, `${numeric + 10}%`];
    }
  }

  if (type === 'time') {
    const normalized = normalizeTimeAnswer(correctAnswer);

    if (normalized) {
      const [hours, minutes] = normalized.split(':').map(Number);
      const toValue = (delta) => {
        const totalMinutes =
          (((hours * 60 + minutes + delta) % (24 * 60)) + 24 * 60) % (24 * 60);
        return `${String(Math.floor(totalMinutes / 60)).padStart(
          2,
          '0'
        )}:${String(totalMinutes % 60).padStart(2, '0')}`;
      };

      return [toValue(5), toValue(-5), toValue(30)];
    }
  }

  const numeric = Number(String(correctAnswer).replace(',', '.'));
  if (!Number.isFinite(numeric)) return ['A', 'B', 'C'];
  if (
    type === 'decimal' ||
    String(correctAnswer).includes('.') ||
    String(correctAnswer).includes(',')
  ) {
    return [
      Number((numeric + 0.1).toFixed(2)),
      Number((numeric - 0.1).toFixed(2)),
      Number((numeric + 1).toFixed(2)),
    ];
  }
  return [numeric + 1, numeric - 1, numeric + 2];
};

const prepareQuestion = (question) => {
  const responseType = resolveQuestionType(
    question.responseType ?? question.type,
    {
      correctAnswer: question.correctAnswer,
    }
  );
  const built = buildQuestionWithChoices({
    ...question,
    type: responseType,
    responseType,
  });
  const targetChoiceCount = getQuestionTypeChoiceCount(
    built.type,
    built.correctAnswer
  );
  const used = new Set((built.choices || []).map((choice) => String(choice)));
  const choices = [...(built.choices || [])];
  if (!used.has(String(built.correctAnswer))) {
    used.add(String(built.correctAnswer));
    choices.unshift(built.correctAnswer);
  }
  fallbackChoices(built.correctAnswer, built.type).forEach((choice) => {
    if (choices.length < targetChoiceCount && !used.has(String(choice))) {
      used.add(String(choice));
      choices.push(choice);
    }
  });
  while (choices.length < targetChoiceCount) {
    const choice = `${built.correctAnswer}-${choices.length + 1}`;
    if (!used.has(choice)) {
      used.add(choice);
      choices.push(choice);
    }
  }
  const difficulty = inferDifficulty(built);
  return {
    ...built,
    prompt: built.question,
    difficulty,
    timeLimit: TIME_BY_DIFFICULTY[difficulty],
    choices: shuffle(choices.slice(0, targetChoiceCount)),
  };
};

const emptyResults = (questions) =>
  Object.fromEntries(
    questions.map((question) => [
      question.id,
      {
        questionId: question.id,
        selectedAnswer: '',
        isCorrect: false,
        earnedPoints: 0,
        attempts: 0,
      },
    ])
  );

const performanceMessage = (value) => {
  if (value >= 9) return 'Excellent';
  if (value >= 6) return 'Good';
  return 'Keep practicing';
};

const buildEvaluationBundle = ({
  questions,
  results,
  studentId,
  roomId,
  moduleId,
  score,
  correctAnswers,
}) => {
  const evaluationId = id('evaluation');
  const totalQuestions = questions.length;
  const evaluation = {
    id: evaluationId,
    studentId,
    roomId,
    moduleId,
    score,
    totalQuestions,
    correctAnswers,
    successRate: totalQuestions
      ? Number(((correctAnswers / totalQuestions) * 100).toFixed(2))
      : 0,
    createdAt: new Date().toISOString(),
  };
  const responses = questions.map((question) => ({
    id: id('response'),
    evaluationId,
    studentId,
    questionId: question.id,
    selectedAnswer: String(results[question.id]?.selectedAnswer ?? ''),
    isCorrect: Boolean(results[question.id]?.isCorrect),
    earnedPoints: Number(results[question.id]?.earnedPoints || 0),
    createdAt: new Date().toISOString(),
  }));
  return { evaluation, responses };
};

const simulateSave = async (bundle) => {
  await new Promise((resolve) => setTimeout(resolve, 450));
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      'escape-math:last-evaluation',
      JSON.stringify(bundle)
    );
  }
  return bundle;
};

const GameHeader = ({
  roomTitle,
  moduleTitle,
  questionNumber,
  totalQuestions,
  lives,
  streak,
  score,
  timeLeft,
  timeLimit,
}) => {
  const ratio = timeLimit ? (timeLeft / timeLimit) * 100 : 0;
  const progress = totalQuestions
    ? ((questionNumber - 1) / totalQuestions) * 100
    : 0;
  const urgent = timeLeft <= 5;
  return (
    <div className="sticky top-2 z-10 rounded-[28px] bg-slate-900 p-3 text-white shadow-sm sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-300 font-semibold">
              {roomTitle}
            </p>
            <h2 className="mt-1 truncate text-base font-black sm:text-lg">
              {moduleTitle}
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Question {questionNumber} / {totalQuestions}
            </p>
          </div>
          <div
            className={cx(
              'rounded-2xl px-3 py-1 text-xs font-black',
              urgent ? 'bg-rose-500 animate-pulse' : 'bg-white/10'
            )}
          >
            {timeLeft}s
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cx(
                'h-full rounded-full transition-all duration-500',
                ratio > 40
                  ? 'bg-emerald-400'
                  : ratio > 20
                  ? 'bg-amber-300'
                  : 'bg-rose-400'
              )}
              style={{ width: `${Math.max(0, Math.min(100, ratio))}%` }}
            />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sky-300 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/10 px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
            Lives
            <p className="mt-1 text-sm font-black">
              {'❤'.repeat(lives) || '0'}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
            Streak<p className="mt-1 text-sm font-black">x{streak}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
            Points<p className="mt-1 text-sm font-black">{score}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestionCard = ({ question }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
    <div
      className={cx(
        'inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em]',
        question.difficulty === 'easy'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : question.difficulty === 'hard'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      )}
    >
      {question.difficulty} · {question.timeLimit}s
    </div>
    <p className="mt-3 text-center text-base font-black leading-snug text-slate-900 sm:text-lg">
      {question.prompt}
    </p>
  </div>
);

const ChoiceGrid = ({
  question,
  selectedChoice,
  feedback,
  disabled,
  onAnswer,
}) => (
  <div className="grid gap-2.5">
    {question.choices.map((choice, index) => {
      const selected = selectedChoice === choice;
      const correct = choice === question.correctAnswer;
      const success = feedback?.tone === 'success' && correct;
      const error = feedback?.tone === 'error' && selected;
      return (
        <button
          key={`${question.id}-${String(choice)}`}
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(choice)}
          className={cx(
            'w-full rounded-[26px] border-2 px-3.5 py-3 text-left text-sm font-black transition duration-200 active:scale-[0.98]',
            success
              ? 'border-emerald-300 bg-[linear-gradient(180deg,#34d399,#10b981)] text-white shadow-sm'
              : error
              ? 'border-rose-300 bg-[linear-gradient(180deg,#fb7185,#f43f5e)] text-white shadow-sm'
              : selected
              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
              : CHOICE_STYLES[index % CHOICE_STYLES.length]
          )}
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 break-words">
              {String.fromCharCode(65 + index)}.{' '}
              {formatChoice(choice, question.type)}
            </span>
            {(success || error) && (
              <span className="text-xs font-semibold">
                {success ? 'Correct' : 'Wrong'}
              </span>
            )}
          </div>
        </button>
      );
    })}
  </div>
);

const FeedbackCard = ({ feedback, onContinue }) =>
  !feedback ? null : (
    <div
      className={cx(
        'rounded-[28px] border p-3 shadow-sm sm:p-4',
        feedback.tone === 'success'
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-rose-200 bg-rose-50'
      )}
    >
      <h3 className="text-lg font-black text-slate-900">{feedback.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {feedback.explanation}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className={cx(
          'mt-4 w-full rounded-2xl px-3 py-3 text-sm font-black text-white transition active:translate-y-0.5',
          feedback.tone === 'success'
            ? 'bg-emerald-600 shadow-sm'
            : 'bg-orange-500 shadow-sm'
        )}
      >
        {feedback.actionLabel}
      </button>
    </div>
  );

const SummaryScreen = ({ summary, onReplay, onModules, onRooms }) =>
  !summary ? null : (
    <div className="space-y-2.5">
      <div
        className={cx(
          'rounded-[28px] p-3 text-white shadow-sm sm:p-4',
          summary.kind === 'success' ? 'bg-sky-700' : 'bg-orange-600'
        )}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/80">
          {summary.roomTitle}
        </p>
        <h2 className="mt-2 text-xl font-black sm:text-2xl">
          {summary.kind === 'success' ? 'Mission complete' : 'Try again'}
        </h2>
        <p className="mt-2 text-sm leading-5 text-white/90">
          {summary.kind === 'success'
            ? `${summary.moduleTitle} cleared with ${summary.correctAnswers} correct answers.`
            : `Game over. You solved ${summary.correctAnswers} question${
                summary.correctAnswers === 1 ? '' : 's'
              } before running out of lives.`}
        </p>
        {summary.lastEvent?.explanation ? (
          <p className="mt-3 rounded-2xl bg-white/10 px-3 py-3 text-sm leading-5 text-white/90">
            {summary.lastEvent.explanation}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center text-xs font-black text-slate-900">
          Score<p className="mt-2 text-2xl">{summary.scoreOutOfTen}/10</p>
          <span className="block mt-1 text-xs text-slate-500">
            {summary.performance}
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center text-xs font-black text-slate-900">
          Points<p className="mt-2 text-2xl">{summary.score}</p>
          <span className="block mt-1 text-xs text-slate-500">
            {summary.responsesCount} saved
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onReplay}
          className="w-full rounded-2xl bg-slate-900 px-3 py-3 text-sm font-black text-white shadow-sm"
        >
          {summary.kind === 'success' ? 'Play again' : 'Retry module'}
        </button>
        <button
          type="button"
          onClick={onModules}
          className="w-full rounded-2xl bg-white px-3 py-3 text-sm font-black text-slate-900 border border-slate-200 shadow-sm"
        >
          Choose another module
        </button>
        <button
          type="button"
          onClick={onRooms}
          className="w-full rounded-2xl bg-slate-50 px-3 py-3 text-sm font-black text-slate-900 border border-slate-200 shadow-sm"
        >
          Change room
        </button>
      </div>
    </div>
  );

export const StudentPanel = ({ rooms = [] }) => {
  const { data: session } = useSession();
  const timeoutHandledRef = useRef(false);
  const [screen, setScreen] = useState(SCREENS.rooms);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerPrimed, setIsTimerPrimed] = useState(false);
  const [timerSeed, setTimerSeed] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState({});
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);

  const availableRooms = useMemo(
    () => rooms.filter((room) => room?.isActive !== false),
    [rooms]
  );
  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === selectedRoomId) || null,
    [availableRooms, selectedRoomId]
  );
  const modules = useMemo(
    () =>
      (selectedRoom?.modules || []).filter(
        (module) => module?.isActive !== false
      ),
    [selectedRoom]
  );
  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) || null,
    [modules, selectedModuleId]
  );
  const questions = useMemo(
    () =>
      (selectedModule?.questions || [])
        .filter((question) => question?.isActive !== false)
        .map(prepareQuestion),
    [selectedModule]
  );
  const currentQuestion = questions[questionIndex] || null;
  const studentId = session?.user?.id || 'student_local_demo';

  useEffect(() => {
    if (!availableRooms.length) return;
    if (!availableRooms.some((room) => room.id === selectedRoomId))
      setSelectedRoomId(availableRooms[0].id);
  }, [availableRooms, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoom) return;
    if (!modules.some((module) => module.id === selectedModuleId))
      setSelectedModuleId(modules[0]?.id || '');
  }, [modules, selectedModuleId, selectedRoom]);

  useEffect(() => {
    if (screen !== SCREENS.play || !currentQuestion || feedback || saving)
      return undefined;

    timeoutHandledRef.current = false;
    setIsTimerPrimed(false);
    setTimeLeft(currentQuestion.timeLimit);
    const primeId = window.requestAnimationFrame(() => {
      setIsTimerPrimed(true);
    });
    const timerId = window.setInterval(
      () => setTimeLeft((value) => (value <= 1 ? 0 : value - 1)),
      1000
    );
    return () => {
      window.cancelAnimationFrame(primeId);
      window.clearInterval(timerId);
      setIsTimerPrimed(false);
    };
  }, [currentQuestion, feedback, saving, screen, timerSeed]);

  const startRun = useCallback(() => {
    if (!questions.length) return;

    setQuestionIndex(0);
    setLives(INITIAL_LIVES);
    setStreak(0);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(questions[0].timeLimit);
    setIsTimerPrimed(false);
    setSelectedChoice(null);
    setFeedback(null);
    setSummary(null);
    setResults(emptyResults(questions));
    setScreen(SCREENS.play);
    setTimerSeed((value) => value + 1);
  }, [questions]);

  const finishRun = useCallback(
    async ({
      kind,
      nextLives,
      nextScore,
      nextCorrectAnswers,
      nextResults,
      lastEvent,
    }) => {
      const bundle = buildEvaluationBundle({
        questions,
        results: nextResults,
        studentId,
        roomId: selectedRoom?.id || '',
        moduleId: selectedModule?.id || '',
        score: nextScore,
        correctAnswers: nextCorrectAnswers,
      });
      const scoreOutOfTen = questions.length
        ? Math.round((nextCorrectAnswers / questions.length) * 10)
        : 0;
      setLives(nextLives);
      setScore(nextScore);
      setCorrectAnswers(nextCorrectAnswers);
      setResults(nextResults);
      setSelectedChoice(null);
      setFeedback(null);
      setSaving(true);
      try {
        await simulateSave(bundle);
        setSummary({
          kind,
          roomTitle: selectedRoom?.title || 'Room',
          moduleTitle: selectedModule?.title || 'Module',
          score: nextScore,
          correctAnswers: nextCorrectAnswers,
          scoreOutOfTen,
          performance: performanceMessage(scoreOutOfTen),
          responsesCount: bundle.responses.length,
          lastEvent,
        });
        setScreen(SCREENS.summary);
      } finally {
        setSaving(false);
      }
    },
    [questions, selectedModule, selectedRoom, studentId]
  );

  const failAttempt = useCallback(
    ({ selectedAnswer, timeout = false }) => {
      if (!currentQuestion) return;
      const nextLives = Math.max(0, lives - 1);
      const nextResults = {
        ...results,
        [currentQuestion.id]: {
          ...(results[currentQuestion.id] || {
            questionId: currentQuestion.id,
            selectedAnswer: '',
            isCorrect: false,
            earnedPoints: 0,
            attempts: 0,
          }),
          selectedAnswer: timeout ? 'TIMEOUT' : String(selectedAnswer ?? ''),
          isCorrect: false,
          earnedPoints: 0,
          attempts: (results[currentQuestion.id]?.attempts || 0) + 1,
        },
      };
      const explanation =
        currentQuestion.hint ||
        explainWrongAnswer(
          currentQuestion.correctAnswer,
          selectedAnswer ?? currentQuestion.correctAnswer,
          currentQuestion.type
        );
      setLives(nextLives);
      setStreak(0);
      setSelectedChoice(timeout ? null : selectedAnswer ?? null);
      setResults(nextResults);
      if (nextLives === 0) {
        finishRun({
          kind: 'gameover',
          nextLives,
          nextScore: score,
          nextCorrectAnswers: correctAnswers,
          nextResults,
          lastEvent: { explanation },
        });
        return;
      }
      setFeedback({
        tone: 'error',
        title: timeout ? 'Time up ⏱' : 'Wrong answer',
        explanation,
        actionLabel: 'Retry',
      });
    },
    [correctAnswers, currentQuestion, finishRun, lives, results, score]
  );

  useEffect(() => {
    if (
      screen !== SCREENS.play ||
      !currentQuestion ||
      feedback ||
      saving ||
      !isTimerPrimed ||
      timeLeft > 0 ||
      timeoutHandledRef.current
    )
      return;
    timeoutHandledRef.current = true;
    failAttempt({ timeout: true });
  }, [
    currentQuestion,
    failAttempt,
    feedback,
    isTimerPrimed,
    saving,
    screen,
    timeLeft,
  ]);

  const handleAnswer = useCallback(
    (choice) => {
      if (!currentQuestion || feedback || saving || screen !== SCREENS.play)
        return;
      setSelectedChoice(choice);
      if (choice !== currentQuestion.correctAnswer) {
        failAttempt({ selectedAnswer: choice });
        return;
      }
      const nextStreak = streak + 1;
      const earnedPoints = BASE_POINTS + nextStreak * STREAK_BONUS;
      const nextScore = score + earnedPoints;
      const nextCorrectAnswers = correctAnswers + 1;
      const nextResults = {
        ...results,
        [currentQuestion.id]: {
          ...(results[currentQuestion.id] || {
            questionId: currentQuestion.id,
            attempts: 0,
          }),
          selectedAnswer: String(choice),
          isCorrect: true,
          earnedPoints,
          attempts: (results[currentQuestion.id]?.attempts || 0) + 1,
        },
      };
      setStreak(nextStreak);
      setScore(nextScore);
      setCorrectAnswers(nextCorrectAnswers);
      setResults(nextResults);
      if (questionIndex === questions.length - 1) {
        finishRun({
          kind: 'success',
          nextLives: lives,
          nextScore,
          nextCorrectAnswers,
          nextResults,
          lastEvent: {
            explanation: currentQuestion.explanation || 'Excellent work.',
          },
        });
        return;
      }
      setFeedback({
        tone: 'success',
        title: 'Correct ✅',
        explanation: currentQuestion.explanation || 'Great job. Keep going.',
        actionLabel: 'Next question',
      });
    },
    [
      correctAnswers,
      currentQuestion,
      failAttempt,
      feedback,
      finishRun,
      lives,
      questionIndex,
      questions.length,
      results,
      saving,
      score,
      screen,
      streak,
    ]
  );

  const continueGame = useCallback(() => {
    if (!feedback) return;

    const nextQuestion =
      feedback.tone === 'success'
        ? questions[questionIndex + 1] || null
        : currentQuestion;

    if (nextQuestion) {
      setTimeLeft(nextQuestion.timeLimit);
    }

    setSelectedChoice(null);
    setFeedback(null);
    if (feedback.tone === 'success') setQuestionIndex((value) => value + 1);
    timeoutHandledRef.current = false;
    setIsTimerPrimed(false);
    setTimerSeed((value) => value + 1);
  }, [currentQuestion, feedback, questionIndex, questions]);

  if (!availableRooms.length) {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-4 text-center shadow-sm">
        <h2 className="text-lg font-black text-slate-900">
          No rooms available yet
        </h2>
        <p className="mt-2 text-sm leading-5 text-slate-500">
          Ask your teacher to create and activate a room before starting the
          game.
        </p>
      </section>
    );
  }

  return (
    <section className="safe-bottom space-y-3 pb-4">
      {screen === SCREENS.rooms ? (
        <>
          <div className="rounded-[28px] bg-gradient-to-r from-orange-500 to-pink-500 p-3 text-white shadow-sm sm:p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/80">
              Select Room
            </p>
            <h1 className="mt-2 text-xl font-black sm:text-2xl">
              Choose your adventure
            </h1>
            <p className="mt-2 text-xs leading-5 text-white/90">
              Pick a room, then choose a module and jump into the challenge.
            </p>
          </div>
          <div className="space-y-3">
            {availableRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setSelectedModuleId('');
                  setScreen(SCREENS.modules);
                }}
                className={cx(
                  'w-full rounded-[28px] border px-3.5 py-3 text-left transition active:scale-[0.98]',
                  room.id === selectedRoomId
                    ? 'border-sky-500 bg-sky-500 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-900 shadow-sm'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cx(
                        'text-[10px] font-black uppercase tracking-[0.3em]',
                        room.id === selectedRoomId
                          ? 'text-sky-100'
                          : 'text-sky-500'
                      )}
                    >
                      Room
                    </p>
                    <h3 className="mt-2 truncate text-base font-black">
                      {room.title}
                    </h3>
                    <p
                      className={cx(
                        'mt-1 text-xs leading-5',
                        room.id === selectedRoomId
                          ? 'text-sky-100'
                          : 'text-slate-500'
                      )}
                    >
                      {room.description ||
                        'Choose this room to explore its math missions.'}
                    </p>
                  </div>
                  <div
                    className={cx(
                      'rounded-full px-2 py-1 text-[10px] font-black',
                      room.id === selectedRoomId
                        ? 'bg-white/15 text-white'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {room.level || '6e primaire'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {screen === SCREENS.modules ? (
        <>
          <div className="rounded-[28px] bg-gradient-to-r from-violet-600 to-sky-600 p-3 text-white shadow-sm sm:p-4">
            <button
              type="button"
              onClick={() => setScreen(SCREENS.rooms)}
              className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-white"
            >
              Back
            </button>
            <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-violet-100">
              Select Module
            </p>
            <h1 className="mt-2 truncate text-xl font-black sm:text-2xl">
              {selectedRoom?.title}
            </h1>
            <p className="mt-2 text-xs leading-5 text-violet-100">
              Choose a module with questions, then start the game loop.
            </p>
          </div>
          <div className="space-y-3">
            {modules.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => setSelectedModuleId(module.id)}
                className={cx(
                  'w-full rounded-[28px] border px-3.5 py-3 text-left transition active:scale-[0.98]',
                  module.id === selectedModuleId
                    ? 'border-violet-500 bg-violet-500 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-900 shadow-sm'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cx(
                        'text-[10px] font-black uppercase tracking-[0.3em]',
                        module.id === selectedModuleId
                          ? 'text-violet-100'
                          : 'text-violet-500'
                      )}
                    >
                      Module
                    </p>
                    <h3 className="mt-2 truncate text-base font-black">
                      {module.title}
                    </h3>
                    <p
                      className={cx(
                        'mt-1 text-xs leading-5',
                        module.id === selectedModuleId
                          ? 'text-violet-100'
                          : 'text-slate-500'
                      )}
                    >
                      {module.description ||
                        'A focused challenge pack for this room.'}
                    </p>
                  </div>
                  <div
                    className={cx(
                      'rounded-full px-2 py-1 text-[10px] font-black',
                      (module.questions?.length || 0) > 0
                        ? module.id === selectedModuleId
                          ? 'bg-white/15 text-white'
                          : 'bg-emerald-50 text-emerald-700'
                        : module.id === selectedModuleId
                        ? 'bg-white/10 text-white/90'
                        : 'bg-rose-50 text-rose-700'
                    )}
                  >
                    {(module.questions?.length || 0) > 0
                      ? `${module.questions.length} Q`
                      : 'Empty'}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="text-base font-black text-slate-900">
              {selectedModule?.title || 'Choose a module'}
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              {questions.length
                ? `${questions.length} questions ready`
                : 'This module needs questions before it can start.'}
            </p>
            <button
              type="button"
              onClick={startRun}
              disabled={!selectedModule || !questions.length}
              className={cx(
                'mt-4 w-full rounded-3xl px-4 py-3 text-sm font-black text-white transition active:translate-y-0.5',
                selectedModule && questions.length
                  ? 'bg-emerald-600 shadow-sm'
                  : 'cursor-not-allowed bg-slate-300 shadow-sm'
              )}
            >
              Start game
            </button>
          </div>
        </>
      ) : null}

      {screen === SCREENS.play && currentQuestion ? (
        <div className="space-y-3">
          <GameHeader
            roomTitle={selectedRoom?.title || 'Room'}
            moduleTitle={selectedModule?.title || 'Module'}
            questionNumber={questionIndex + 1}
            totalQuestions={questions.length}
            lives={lives}
            streak={streak}
            score={score}
            timeLeft={timeLeft}
            timeLimit={currentQuestion.timeLimit}
          />
          <QuestionCard question={currentQuestion} />
          <ChoiceGrid
            question={currentQuestion}
            selectedChoice={selectedChoice}
            feedback={feedback}
            disabled={Boolean(feedback) || saving}
            onAnswer={handleAnswer}
          />
          <FeedbackCard feedback={feedback} onContinue={continueGame} />
          {saving ? (
            <div className="rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-sky-700 animate-pulse">
              Saving evaluation...
            </div>
          ) : null}
        </div>
      ) : null}

      {screen === SCREENS.summary ? (
        <SummaryScreen
          summary={summary}
          onReplay={startRun}
          onModules={() => setScreen(SCREENS.modules)}
          onRooms={() => setScreen(SCREENS.rooms)}
        />
      ) : null}
    </section>
  );
};
