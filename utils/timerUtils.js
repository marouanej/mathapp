/**
 * Calculate dynamic timer based on difficulty and level progression
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {number} level - Current level (1-5)
 * @param {number} room - Current room (1-5)
 * @returns {number} - Time in seconds
 */
export const getTimeForQuestion = (difficulty, level, room) => {
  // Base time ranges for each difficulty
  const timeRanges = {
    easy: { min: 20, max: 30 },
    medium: { min: 30, max: 45 },
    hard: { min: 45, max: 60 },
  };

  // Final room (room 5) gets slightly less time (boss mode)
  const isBossRoom = room === 5;

  const range = timeRanges[difficulty] || timeRanges.medium;
  let { min, max } = range;

  // Apply level progression scaling (levels 1-5 get progressively more time)
  // This helps harder questions at later levels
  const levelScale = (level - 1) / 4; // 0 to 1 scale
  const scaledTime = min + (max - min) * levelScale;

  // Boss room penalty: reduce by 15%
  const finalTime = isBossRoom ? scaledTime * 0.85 : scaledTime;

  // Round to 1 decimal place
  return Math.round(finalTime * 10) / 10;
};

/**
 * Calculate time-based bonus points
 * Reward faster answers with bonus points
 * @param {number} timeLeft - Remaining time in seconds
 * @param {number} maxTime - Maximum time for this question
 * @returns {number} - Bonus points (0-300)
 */
export const calculateTimeBonus = (timeLeft, maxTime) => {
  // No bonus if time is up
  if (timeLeft <= 0) return 0;

  // More points for faster answers
  // < 25% of time left = 300 points
  // < 50% of time left = 200 points
  // < 75% of time left = 100 points
  // otherwise = 50 points
  const percentageLeft = (timeLeft / maxTime) * 100;

  if (percentageLeft < 25) return 300;
  if (percentageLeft < 50) return 200;
  if (percentageLeft < 75) return 100;
  return 50;
};

/**
 * Get difficulty badge color and label for UI
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {object} - { color, bgColor, label }
 */
export const getDifficultyDisplay = (difficulty) => {
  const displayMap = {
    easy: {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/50',
      borderColor: 'border-emerald-500',
      label: '🟢 Facile',
    },
    medium: {
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/50',
      borderColor: 'border-yellow-500',
      label: '🟡 Moyen',
    },
    hard: {
      color: 'text-red-400',
      bgColor: 'bg-red-900/50',
      borderColor: 'border-red-500',
      label: '🔴 Difficile',
    },
  };

  return displayMap[difficulty] || displayMap.medium;
};

/**
 * Determine difficulty based on level
 * Harder levels get harder difficulties
 * @param {number} level - Current level (1-5)
 * @returns {string} - 'easy', 'medium', or 'hard'
 */
export const getDefaultDifficulty = (level) => {
  if (level <= 2) return 'easy';
  if (level <= 4) return 'medium';
  return 'hard';
};
