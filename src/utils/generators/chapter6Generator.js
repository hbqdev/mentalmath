/**
 * Chapter 6 Exercise Generators
 * For "Math for the Board: Pencil-and-Paper Math"
 */

/**
 * Generates column addition exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateColumnAdditionExercises(difficulty, count) {
  const exercises = []

  const ranges = {
    easy: { min: 100, max: 999, count: 5 },
    medium: { min: 100, max: 9999, count: 6 },
    hard: { min: 100, max: 99999, count: 7 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    const numbers = []
    let sum = 0

    // Generate the column of numbers
    for (let j = 0; j < range.count; j++) {
      const num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      numbers.push(num)
      sum += num
    }

    // Calculate mod sum for verification
    const modSum = calculateModSum(sum)
    const numbersModSum = numbers.reduce((acc, num) => (acc + calculateModSum(num)) % 9, 0)

    exercises.push({
      question: numbers.join('\n+'),
      answer: sum.toString(),
      modSum,
      numbersModSum,
    })
  }

  return exercises
}

/**
 * Generates mod sums checking exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateModSumsExercises(difficulty, count) {
  const exercises = []

  const ranges = {
    easy: { min: 1000, max: 9999 },
    medium: { min: 10000, max: 99999 },
    hard: { min: 100000, max: 999999 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    const num2 = Math.floor(Math.random() * (num1 - range.min + 1)) + range.min
    const sum = num1 + num2

    exercises.push({
      question: `${num1}\n+${num2}`,
      answer: sum.toString(),
      modSum: calculateModSum(sum),
      numbersModSum: (calculateModSum(num1) + calculateModSum(num2)) % 9,
    })
  }

  return exercises
}

/**
 * Generates paper subtraction exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generatePaperSubtractionExercises(difficulty, count) {
  const exercises = []

  const ranges = {
    easy: { min: 10000, max: 99999 },
    medium: { min: 100000, max: 999999 },
    hard: { min: 1000000, max: 9999999 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    const num2 = Math.floor(Math.random() * (num1 - range.min + 1)) + range.min
    const difference = num1 - num2

    exercises.push({
      question: `${num1}\n-${num2}`,
      answer: difference.toString(),
      modSum: calculateModSum(difference),
      numbersModSum: (calculateModSum(num1) - calculateModSum(num2) + 9) % 9,
    })
  }

  return exercises
}

/**
 * Generates square root calculation exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateSquareRootExercises(difficulty, count) {
  const exercises = []

  // Define ranges for perfect squares based on difficulty
  const ranges = {
    easy: [15, 19, 25, 36, 49, 64, 81], // 2-digit numbers
    medium: [100, 144, 196, 225, 289, 324, 361, 400, 441, 484], // 3-digit numbers
    hard: [502, 625, 729, 841, 900, 961, 1024, 1156, 1225, 1296], // 4-digit numbers
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Select a random number from the appropriate range
    const index = Math.floor(Math.random() * range.length)
    const number = range[index]

    // Format question with 4 decimal places as shown in book
    const question = `√${number}`

    // Calculate the answer (square root)
    const answer = Math.sqrt(number).toString()

    exercises.push({
      question,
      answer,
      displayFormat: 'squareRoot',
    })
  }

  return exercises
}

/**
 * Generates criss-cross multiplication exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateCrissCrossMultiplicationExercises(difficulty, count) {
  const exercises = []

  const ranges = {
    easy: { digits: 2 },
    medium: { digits: 3 },
    hard: { digits: 4 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    const num1 =
      Math.floor(Math.random() * (Math.pow(10, range.digits) - Math.pow(10, range.digits - 1))) +
      Math.pow(10, range.digits - 1)
    const num2 =
      Math.floor(Math.random() * (Math.pow(10, range.digits) - Math.pow(10, range.digits - 1))) +
      Math.pow(10, range.digits - 1)
    const product = num1 * num2

    exercises.push({
      question: `${num1} × ${num2}`,
      answer: product.toString(),
      modSum: calculateModSum(product),
      numbersModSum: (calculateModSum(num1) * calculateModSum(num2)) % 9,
    })
  }

  return exercises
}

// Helper function to calculate mod sum (casting out nines)
function calculateModSum(number) {
  let sum = 0
  const digits = number.toString().split('').map(Number)

  for (const digit of digits) {
    sum += digit
  }

  while (sum > 9) {
    sum = sum
      .toString()
      .split('')
      .map(Number)
      .reduce((a, b) => a + b, 0)
  }

  return sum === 0 ? 9 : sum
}
