/**
 * Chapter 5 Exercise Generators
 * For "Good Enough: The Art of Guesstimation"
 */

/**
 * Generates percentage calculation exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generatePercentageCalculationExercises(difficulty, count) {
  const exercises = []

  // Define ranges for percentages and numbers based on difficulty
  const ranges = {
    easy: {
      percentages: [10, 15, 20, 25, 50],
      minNumber: 10,
      maxNumber: 100,
    },
    medium: {
      percentages: [5, 15, 25, 30, 33, 66, 75],
      minNumber: 50,
      maxNumber: 500,
    },
    hard: {
      percentages: [6.5, 7.25, 7.75, 8.5, 12.5, 37.5, 62.5, 87.5],
      minNumber: 100,
      maxNumber: 1000,
    },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Select a random percentage
    const percentIndex = Math.floor(Math.random() * range.percentages.length)
    const percentage = range.percentages[percentIndex]

    // Generate a base number
    let baseNumber
    if (difficulty === 'easy') {
      // For easy exercises, prefer round numbers
      baseNumber = Math.floor(Math.random() * (range.maxNumber / 10)) * 10 + 10
    } else {
      baseNumber = Math.floor(Math.random() * (range.maxNumber - range.minNumber + 1)) + range.minNumber
    }

    // Format the question
    const question = `${percentage}% of ${baseNumber}`

    // Calculate the answer
    const answer = (percentage * baseNumber / 100).toFixed(2).replace(/\.00$/, '')

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates exercises for converting between fractions and decimals
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateFractionDecimalConversionExercises(difficulty, count) {
  const exercises = []

  // Common fractions/decimals based on difficulty
  const conversionMap = {
    easy: [
      { fraction: '1/2', decimal: '0.5' },
      { fraction: '1/4', decimal: '0.25' },
      { fraction: '3/4', decimal: '0.75' },
      { fraction: '1/5', decimal: '0.2' },
      { fraction: '2/5', decimal: '0.4' },
      { fraction: '3/5', decimal: '0.6' },
      { fraction: '4/5', decimal: '0.8' },
      { fraction: '1/10', decimal: '0.1' },
    ],
    medium: [
      { fraction: '1/3', decimal: '0.333...' },
      { fraction: '2/3', decimal: '0.666...' },
      { fraction: '1/6', decimal: '0.166...' },
      { fraction: '5/6', decimal: '0.833...' },
      { fraction: '1/8', decimal: '0.125' },
      { fraction: '3/8', decimal: '0.375' },
      { fraction: '5/8', decimal: '0.625' },
      { fraction: '7/8', decimal: '0.875' },
      { fraction: '1/20', decimal: '0.05' },
      { fraction: '7/20', decimal: '0.35' },
    ],
    hard: [
      { fraction: '1/7', decimal: '0.142857...' },
      { fraction: '2/7', decimal: '0.285714...' },
      { fraction: '3/7', decimal: '0.428571...' },
      { fraction: '4/7', decimal: '0.571428...' },
      { fraction: '5/7', decimal: '0.714285...' },
      { fraction: '6/7', decimal: '0.857142...' },
      { fraction: '1/9', decimal: '0.111...' },
      { fraction: '2/9', decimal: '0.222...' },
      { fraction: '4/9', decimal: '0.444...' },
      { fraction: '5/9', decimal: '0.555...' },
      { fraction: '7/9', decimal: '0.777...' },
      { fraction: '8/9', decimal: '0.888...' },
      { fraction: '1/11', decimal: '0.090909...' },
      { fraction: '1/12', decimal: '0.083333...' },
    ],
  }

  const conversions = conversionMap[difficulty]

  for (let i = 0; i < count; i++) {
    // Choose a random conversion
    const index = Math.floor(Math.random() * conversions.length)
    const { fraction, decimal } = conversions[index]

    // 50% chance to go from fraction to decimal, 50% chance to go from decimal to fraction
    const toDecimal = Math.random() < 0.5

    let question, answer
    if (toDecimal) {
      question = `Convert ${fraction} to a decimal`
      answer = decimal
    } else {
      question = `Convert ${decimal} to a fraction`
      answer = fraction
    }

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates addition guesstimation exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateAdditionGuesstimationExercises(difficulty, count) {
  const exercises = []

  // Define ranges for numbers based on difficulty
  const ranges = {
    easy: { min: 100, max: 2000 },
    medium: { min: 1000, max: 50000 },
    hard: { min: 10000, max: 10000000 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate two numbers
    const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    const num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min

    // Format the question
    const question = `${num1} + ${num2}`

    // Calculate the exact answer
    const exactAnswer = num1 + num2

    // Calculate acceptable range for guesstimation (within 5% of exact answer)
    const lowerBound = Math.floor(exactAnswer * 0.95)
    const upperBound = Math.ceil(exactAnswer * 1.05)

    // Include both exact answer and range in the answer field
    const answer = `${exactAnswer} (${lowerBound}-${upperBound})`

    exercises.push({
      question,
      answer,
      acceptableRange: { min: lowerBound, max: upperBound },
      exactAnswer,
    })
  }

  return exercises
}

/**
 * Generates subtraction guesstimation exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateSubtractionGuesstimationExercises(difficulty, count) {
  const exercises = []

  // Define ranges for numbers based on difficulty
  const ranges = {
    easy: { min: 1000, max: 10000 },
    medium: { min: 10000, max: 100000 },
    hard: { min: 100000, max: 10000000 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate minuend and ensure subtrahend is smaller
    const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    const maxSubtrahend = Math.min(num1 - 1, range.max)
    const minSubtrahend = Math.max(Math.floor(num1 * 0.1), range.min)
    const num2 = Math.floor(Math.random() * (maxSubtrahend - minSubtrahend + 1)) + minSubtrahend

    // Format the question
    const question = `${num1} - ${num2}`

    // Calculate the exact answer
    const exactAnswer = num1 - num2

    // Calculate acceptable range for guesstimation (within 5% of exact answer)
    const lowerBound = Math.floor(exactAnswer * 0.95)
    const upperBound = Math.ceil(exactAnswer * 1.05)

    // Include both exact answer and range in the answer field
    const answer = `${exactAnswer} (${lowerBound}-${upperBound})`

    exercises.push({
      question,
      answer,
      acceptableRange: { min: lowerBound, max: upperBound },
      exactAnswer,
    })
  }

  return exercises
}
