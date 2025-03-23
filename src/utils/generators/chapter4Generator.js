/**
 * Chapter 4 Exercise Generators
 * For "Divide and Conquer: Mental Division"
 */

/**
 * Generates one-digit division exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateOneDigitDivisionExercises(difficulty, count) {
  const exercises = []

  // Set difficulty ranges
  let ranges = {
    easy: { min: 100, max: 500, divisors: [2, 3, 4, 5] },
    medium: { min: 200, max: 1000, divisors: [3, 4, 5, 6, 7, 8, 9] },
    hard: { min: 500, max: 3000, divisors: [6, 7, 8, 9] },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Select a random divisor
    const divisorIndex = Math.floor(Math.random() * range.divisors.length)
    const divisor = range.divisors[divisorIndex]

    // Generate a dividend that will result in a clean division or with a small remainder
    let randomFactor =
      Math.floor(Math.random() * (range.max / divisor - range.min / divisor + 1)) +
      range.min / divisor
    randomFactor = Math.floor(randomFactor)

    // Sometimes add a small remainder for more interesting problems
    let remainder = 0
    if (Math.random() > 0.5) {
      remainder = Math.floor(Math.random() * divisor)
    }

    const dividend = divisor * randomFactor + remainder

    // Ensure the dividend is within the range
    if (dividend < range.min || dividend > range.max) {
      i-- // Try again
      continue
    }

    // Format the division question with the ÷ symbol
    const question = `${dividend} ÷ ${divisor}`

    // Calculate the answer with the remainder if present
    let answer
    if (remainder === 0) {
      answer = randomFactor.toString()
    } else {
      answer = `${randomFactor} with remainder ${remainder}`
    }

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates two-digit division exercises
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateTwoDigitDivisionExercises(difficulty, count) {
  const exercises = []

  // Set difficulty ranges
  let ranges = {
    easy: { min: 200, max: 1000, divisors: [11, 12, 14, 15, 16, 18, 20, 25] },
    medium: { min: 500, max: 5000, divisors: [17, 19, 21, 22, 24, 28, 30, 35] },
    hard: { min: 1000, max: 10000, divisors: [23, 27, 29, 31, 37, 41, 43, 47] },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Select a random divisor
    const divisorIndex = Math.floor(Math.random() * range.divisors.length)
    const divisor = range.divisors[divisorIndex]

    // Generate a dividend that will result in a clean division or with a small remainder
    let randomFactor =
      Math.floor(Math.random() * (range.max / divisor - range.min / divisor + 1)) +
      range.min / divisor
    randomFactor = Math.floor(randomFactor)

    // For medium and hard problems, sometimes add a small remainder
    let remainder = 0
    if ((difficulty === 'medium' || difficulty === 'hard') && Math.random() > 0.6) {
      remainder = Math.floor(Math.random() * divisor)
    }

    const dividend = divisor * randomFactor + remainder

    // Ensure the dividend is within the range
    if (dividend < range.min || dividend > range.max) {
      i-- // Try again
      continue
    }

    // Format the division question with the ÷ symbol
    const question = `${dividend} ÷ ${divisor}`

    // Calculate the answer with the remainder if present
    let answer
    if (remainder === 0) {
      answer = randomFactor.toString()
    } else {
      answer = `${randomFactor} with remainder ${remainder}`
    }

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates exercises for converting fractions to decimals
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateDecimalizationExercises(difficulty, count) {
  const exercises = []

  // Common fractions with their decimal equivalents
  const fractions = {
    easy: [
      { numerator: 1, denominator: 2, decimal: '0.5' },
      { numerator: 1, denominator: 4, decimal: '0.25' },
      { numerator: 3, denominator: 4, decimal: '0.75' },
      { numerator: 1, denominator: 5, decimal: '0.2' },
      { numerator: 2, denominator: 5, decimal: '0.4' },
      { numerator: 3, denominator: 5, decimal: '0.6' },
      { numerator: 4, denominator: 5, decimal: '0.8' },
    ],
    medium: [
      { numerator: 1, denominator: 3, decimal: '0.333...' },
      { numerator: 2, denominator: 3, decimal: '0.666...' },
      { numerator: 1, denominator: 6, decimal: '0.166...' },
      { numerator: 5, denominator: 6, decimal: '0.833...' },
      { numerator: 1, denominator: 8, decimal: '0.125' },
      { numerator: 3, denominator: 8, decimal: '0.375' },
      { numerator: 5, denominator: 8, decimal: '0.625' },
      { numerator: 7, denominator: 8, decimal: '0.875' },
    ],
    hard: [
      { numerator: 1, denominator: 7, decimal: '0.142857...' },
      { numerator: 2, denominator: 7, decimal: '0.285714...' },
      { numerator: 3, denominator: 7, decimal: '0.428571...' },
      { numerator: 4, denominator: 7, decimal: '0.571428...' },
      { numerator: 5, denominator: 7, decimal: '0.714285...' },
      { numerator: 6, denominator: 7, decimal: '0.857142...' },
      { numerator: 1, denominator: 9, decimal: '0.111...' },
      { numerator: 2, denominator: 9, decimal: '0.222...' },
      { numerator: 4, denominator: 9, decimal: '0.444...' },
      { numerator: 5, denominator: 9, decimal: '0.555...' },
      { numerator: 7, denominator: 9, decimal: '0.777...' },
      { numerator: 8, denominator: 9, decimal: '0.888...' },
      { numerator: 1, denominator: 11, decimal: '0.090909...' },
      { numerator: 1, denominator: 12, decimal: '0.083333...' },
    ],
  }

  const selectedFractions = fractions[difficulty]

  for (let i = 0; i < count; i++) {
    // Select a random fraction from the appropriate difficulty level
    const index = Math.floor(Math.random() * selectedFractions.length)
    const fraction = selectedFractions[index]

    // Format the question
    const question = `${fraction.numerator}/${fraction.denominator}`

    // The answer is the decimal equivalent
    const answer = fraction.decimal

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates exercises for testing divisibility rules
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateDivisibilityTestsExercises(difficulty, count) {
  const exercises = []

  // Define divisors to test for each difficulty level
  const divisors = {
    easy: [2, 3, 4, 5, 6, 9],
    medium: [7, 8, 11],
    hard: [13, 17, 19],
  }

  // Range of numbers to test for divisibility
  const ranges = {
    easy: { min: 10, max: 1000 },
    medium: { min: 1000, max: 10000 },
    hard: { min: 10000, max: 1000000 },
  }

  const selectedDivisors = divisors[difficulty]
  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Select a random divisor to test
    const divisorIndex = Math.floor(Math.random() * selectedDivisors.length)
    const divisor = selectedDivisors[divisorIndex]

    // Generate a number to test
    let isDivisible = Math.random() > 0.5 // 50% chance to generate a divisible number
    let number

    if (isDivisible) {
      // Generate a multiple of the divisor
      let factor =
        Math.floor(Math.random() * (range.max / divisor - range.min / divisor + 1)) +
        range.min / divisor
      number = factor * divisor
    } else {
      // Generate a non-multiple of the divisor
      do {
        number = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      } while (number % divisor === 0)
    }

    // Format the question
    const question = `Is ${number} divisible by ${divisor}?`

    // The answer is Yes or No
    const answer = isDivisible ? 'Yes' : 'No'

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates exercises for multiplying fractions
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateMultiplyingFractionsExercises(difficulty, count) {
  const exercises = []

  // Ranges for numerators and denominators based on difficulty
  const ranges = {
    easy: { numMin: 1, numMax: 5, denMin: 2, denMax: 10 },
    medium: { numMin: 1, numMax: 10, denMin: 2, denMax: 15 },
    hard: { numMin: 5, numMax: 15, denMin: 5, denMax: 20 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate two fractions
    const num1 = Math.floor(Math.random() * (range.numMax - range.numMin + 1)) + range.numMin
    const den1 = Math.floor(Math.random() * (range.denMax - range.denMin + 1)) + range.denMin

    const num2 = Math.floor(Math.random() * (range.numMax - range.numMin + 1)) + range.numMin
    const den2 = Math.floor(Math.random() * (range.denMax - range.denMin + 1)) + range.denMin

    // Calculate product
    const resultNum = num1 * num2
    const resultDen = den1 * den2

    // Simplify the result
    const gcd = findGCD(resultNum, resultDen)
    const simplifiedNum = resultNum / gcd
    const simplifiedDen = resultDen / gcd

    // Format the question
    const question = `${num1}/${den1} × ${num2}/${den2}`

    // Format the answer as a simplified fraction
    const answer = `${simplifiedNum}/${simplifiedDen}`

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates exercises for dividing fractions
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateDividingFractionsExercises(difficulty, count) {
  const exercises = []

  // Ranges for numerators and denominators based on difficulty
  const ranges = {
    easy: { numMin: 1, numMax: 5, denMin: 2, denMax: 10 },
    medium: { numMin: 1, numMax: 10, denMin: 2, denMax: 15 },
    hard: { numMin: 5, numMax: 15, denMin: 5, denMax: 20 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate two fractions
    const num1 = Math.floor(Math.random() * (range.numMax - range.numMin + 1)) + range.numMin
    const den1 = Math.floor(Math.random() * (range.denMax - range.denMin + 1)) + range.denMin

    const num2 = Math.floor(Math.random() * (range.numMax - range.numMin + 1)) + range.numMin
    const den2 = Math.floor(Math.random() * (range.denMax - range.denMin + 1)) + range.denMin

    // Calculate division (multiply by reciprocal)
    const resultNum = num1 * den2
    const resultDen = den1 * num2

    // Simplify the result
    const gcd = findGCD(resultNum, resultDen)
    const simplifiedNum = resultNum / gcd
    const simplifiedDen = resultDen / gcd

    // Format the question
    const question = `${num1}/${den1} ÷ ${num2}/${den2}`

    // Format the answer as a simplified fraction
    const answer = `${simplifiedNum}/${simplifiedDen}`

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates exercises for simplifying fractions
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateSimplifyingFractionsExercises(difficulty, count) {
  const exercises = []

  // Difficulty affects the size of numbers and how complex the simplification is
  const factors = {
    easy: [2, 3, 5],
    medium: [2, 3, 5, 7, 11],
    hard: [2, 3, 5, 7, 11, 13, 17, 19],
  }

  const maxNumerator = {
    easy: 50,
    medium: 100,
    hard: 200,
  }

  const selectedFactors = factors[difficulty]
  const maxNum = maxNumerator[difficulty]

  for (let i = 0; i < count; i++) {
    // Start with a simplified fraction
    const simpleNum = Math.floor(Math.random() * maxNum) + 1
    const simpleDen = Math.floor(Math.random() * maxNum) + 1

    if (simpleNum === simpleDen || simpleNum % simpleDen === 0 || simpleDen % simpleNum === 0) {
      i-- // Try again if it's too simple
      continue
    }

    // Create a common factor by multiplying both by the same numbers
    const factor1 = selectedFactors[Math.floor(Math.random() * selectedFactors.length)]
    const factor2 =
      difficulty === 'easy'
        ? 1
        : selectedFactors[Math.floor(Math.random() * selectedFactors.length)]

    const complexFactor = factor1 * factor2
    const complexNum = simpleNum * complexFactor
    const complexDen = simpleDen * complexFactor

    // Simplify to find the answer
    const gcd = findGCD(complexNum, complexDen)
    const answerNum = complexNum / gcd
    const answerDen = complexDen / gcd

    // Format the question
    const question = `${complexNum}/${complexDen}`

    // Format the answer
    const answer = `${answerNum}/${answerDen}`

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates exercises for adding fractions
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateAddingFractionsExercises(difficulty, count) {
  const exercises = []

  // Probability of generating equal denominators
  const equalDenomProb = {
    easy: 0.8, // 80% chance for equal denominators
    medium: 0.5, // 50% chance
    hard: 0.2, // 20% chance
  }

  // Ranges for denominators
  const denomRange = {
    easy: { min: 2, max: 12 },
    medium: { min: 2, max: 20 },
    hard: { min: 2, max: 30 },
  }

  const range = denomRange[difficulty]

  for (let i = 0; i < count; i++) {
    // Decide if we'll generate equal denominators
    const equalDenom = Math.random() < equalDenomProb[difficulty]

    let denom1, denom2, num1, num2

    if (equalDenom) {
      // Equal denominators case
      denom1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      denom2 = denom1

      // Generate numerators less than denominator
      num1 = Math.floor(Math.random() * (denom1 - 1)) + 1
      num2 = Math.floor(Math.random() * (denom2 - 1)) + 1
    } else {
      // Unequal denominators
      denom1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min

      // Make sure denom2 is different
      do {
        denom2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      } while (denom2 === denom1)

      // Generate numerators
      num1 = Math.floor(Math.random() * (denom1 - 1)) + 1
      num2 = Math.floor(Math.random() * (denom2 - 1)) + 1
    }

    // Calculate the answer
    const lcm = findLCM(denom1, denom2)
    const resultNum = num1 * (lcm / denom1) + num2 * (lcm / denom2)
    const resultDenom = lcm

    // Simplify the result
    const gcd = findGCD(resultNum, resultDenom)
    const simplifiedNum = resultNum / gcd
    const simplifiedDenom = resultDenom / gcd

    // Format the question
    const question = `${num1}/${denom1} + ${num2}/${denom2}`

    // Format the answer
    const answer = `${simplifiedNum}/${simplifiedDenom}`

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

/**
 * Generates exercises for subtracting fractions
 * @param {string} difficulty - easy, medium, hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateSubtractingFractionsExercises(difficulty, count) {
  const exercises = []

  // Probability of generating equal denominators
  const equalDenomProb = {
    easy: 0.8, // 80% chance for equal denominators
    medium: 0.5, // 50% chance
    hard: 0.2, // 20% chance
  }

  // Ranges for denominators
  const denomRange = {
    easy: { min: 2, max: 12 },
    medium: { min: 2, max: 20 },
    hard: { min: 2, max: 30 },
  }

  const range = denomRange[difficulty]

  for (let i = 0; i < count; i++) {
    // Decide if we'll generate equal denominators
    const equalDenom = Math.random() < equalDenomProb[difficulty]

    let denom1, denom2, num1, num2

    if (equalDenom) {
      // Equal denominators case
      denom1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      denom2 = denom1

      // Generate numerators less than denominator
      num2 = Math.floor(Math.random() * (denom1 - 1)) + 1
      // Make sure num1 > num2 to avoid negative results
      num1 = Math.floor(Math.random() * (denom1 - num2)) + num2
    } else {
      // Unequal denominators
      denom1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min

      // Make sure denom2 is different
      do {
        denom2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
      } while (denom2 === denom1)

      // Generate numerators to ensure positive result
      num2 = Math.floor(Math.random() * (denom2 - 1)) + 1

      // Find equivalent in denom1
      const lcm = findLCM(denom1, denom2)
      const num2Equiv = num2 * (lcm / denom2)
      const maxNum1 = lcm / denom1

      // Ensure num1 (after conversion) > num2 (after conversion)
      num1 = Math.floor(Math.random() * (denom1 - 1)) + 1
      while (num1 * (lcm / denom1) <= num2Equiv) {
        num1 = Math.floor(Math.random() * (denom1 - 1)) + 1
      }
    }

    // Calculate the answer
    const lcm = findLCM(denom1, denom2)
    const resultNum = num1 * (lcm / denom1) - num2 * (lcm / denom2)
    const resultDenom = lcm

    // Simplify the result
    const gcd = findGCD(resultNum, resultDenom)
    const simplifiedNum = resultNum / gcd
    const simplifiedDenom = resultDenom / gcd

    // Format the question
    const question = `${num1}/${denom1} - ${num2}/${denom2}`

    // Format the answer
    const answer = `${simplifiedNum}/${simplifiedDenom}`

    exercises.push({
      question,
      answer,
    })
  }

  return exercises
}

// Helper function to find the Greatest Common Divisor (GCD)
function findGCD(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

// Helper function to find the Least Common Multiple (LCM)
function findLCM(a, b) {
  return (a * b) / findGCD(a, b)
}
