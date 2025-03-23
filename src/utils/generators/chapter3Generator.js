/**
 * Exercise generators for Chapter 3
 */

/**
 * Generates exercises for 2-by-2 addition method multiplication
 * This method typically involves:
 * 1. Multiply outer digits (tens)
 * 2. Multiply inner digits (ones)
 * 3. Add the two products
 *
 * @param {string} difficulty - easy, medium, or hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateAdditionMethodExercises(difficulty, count) {
  const exercises = []

  // Set difficulty ranges
  let ranges = {
    easy: { min1: 21, max1: 39, min2: 11, max2: 29 },
    medium: { min1: 31, max1: 69, min2: 21, max2: 49 },
    hard: { min1: 51, max1: 99, min2: 41, max2: 99 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate two 2-digit numbers
    const num1 = Math.floor(Math.random() * (range.max1 - range.min1 + 1)) + range.min1
    const num2 = Math.floor(Math.random() * (range.max2 - range.min2 + 1)) + range.min2

    // Calculate answer
    const answer = num1 * num2

    // Create question string
    const question = `${num1} × ${num2}`

    // Generate steps for solving using the addition method
    const a = Math.floor(num1 / 10) // First number tens digit
    const b = num1 % 10 // First number ones digit
    const c = Math.floor(num2 / 10) // Second number tens digit
    const d = num2 % 10 // Second number ones digit

    const step1 = `Multiply outer digits: ${a} × ${c} = ${a * c}`
    const step2 = `Multiply inner digits: ${b} × ${d} = ${b * d}`
    const step3 = `Add the products: ${a * c}${b * d} = ${answer}`

    exercises.push({
      question,
      answer: answer.toString(),
      steps: [step1, step2, step3],
    })
  }

  return exercises
}

/**
 * Generates exercises for 2-by-2 subtraction method multiplication
 * This method typically involves:
 * 1. Find a nearby round number
 * 2. Multiply by that number
 * 3. Subtract the extra product
 *
 * @param {string} difficulty - easy, medium, or hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateSubtractionMethodExercises(difficulty, count) {
  const exercises = []

  // Set difficulty ranges
  let ranges = {
    easy: { min1: 21, max1: 59, min2: 21, max2: 49 },
    medium: { min1: 41, max1: 79, min2: 31, max2: 59 },
    hard: { min1: 61, max1: 99, min2: 31, max2: 79 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate two 2-digit numbers
    const num1 = Math.floor(Math.random() * (range.max1 - range.min1 + 1)) + range.min1
    const num2 = Math.floor(Math.random() * (range.max2 - range.min2 + 1)) + range.min2

    // Calculate answer
    const answer = num1 * num2

    // Create question string
    const question = `${num1} × ${num2}`

    // Generate steps for solving using the subtraction method
    // Find a convenient round number near num1
    const base = Math.round(num1 / 10) * 10
    const diff = num1 - base

    const step1 = `Use ${base} as a base number (nearest multiple of 10 to ${num1})`
    const step2 = `${base} × ${num2} = ${base * num2}`
    const step3 = `Adjust by ${diff} × ${num2} = ${diff * num2}`
    const step4 = `${base * num2} + ${diff * num2} = ${answer}`

    exercises.push({
      question,
      answer: answer.toString(),
      steps: [step1, step2, step3, step4],
    })
  }

  return exercises
}

/**
 * Generates exercises for 2-by-2 factoring method multiplication
 * This method involves breaking down one or both numbers into factors
 *
 * @param {string} difficulty - easy, medium, or hard
 * @param {number} count - number of exercises to generate
 * @returns {Array} array of exercise objects
 */
export function generateFactoringMethodExercises(difficulty, count) {
  const exercises = []

  // Set difficulty ranges - using numbers that can be easily factored
  let ranges = {
    easy: { min1: 12, max1: 48, min2: 12, max2: 36 },
    medium: { min1: 24, max1: 72, min2: 14, max2: 48 },
    hard: { min1: 33, max1: 96, min2: 16, max2: 86 },
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate two 2-digit numbers preferably with common factors
    const num1 = Math.floor(Math.random() * (range.max1 - range.min1 + 1)) + range.min1
    const num2 = Math.floor(Math.random() * (range.max2 - range.min2 + 1)) + range.min2

    // Calculate answer
    const answer = num1 * num2

    // Create question string
    const question = `${num1} × ${num2}`

    // Find a simple factor for demonstration purposes
    let factor1 = 2
    while (num1 % factor1 !== 0 && factor1 < 10) {
      factor1++
    }

    const factor2 = num1 / factor1

    const step1 = `Factor ${num1} into ${factor1} × ${factor2}`
    const step2 = `Calculate (${factor1} × ${num2}) × ${factor2}`
    const step3 = `${factor1} × ${num2} = ${factor1 * num2}`
    const step4 = `${factor1 * num2} × ${factor2} = ${answer}`

    exercises.push({
      question,
      answer: answer.toString(),
      steps: [step1, step2, step3, step4],
    })
  }

  return exercises
}

/**
 * Generates exercises for three-digit square calculations
 */
export function generateThreeDigitSquareExercises(difficulty, count) {
  const exercises = []

  // Set difficulty ranges based on how "nice" the numbers are to square
  let ranges = {
    easy: { min: 100, max: 400 }, // Lower numbers, easier to square
    medium: { min: 300, max: 700 }, // Mid-range
    hard: { min: 600, max: 999 }, // Higher numbers, harder to square
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate a 3-digit number
    const num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min

    // Calculate answer
    const answer = num * num

    // Create question string - use a format our component can parse
    const question = `${num}²`

    exercises.push({
      id: i, // Add id property
      question,
      answer: answer.toString(),
      steps: [
        `Split ${num} into ${Math.floor(num / 100)}00 + ${num % 100}`,
        `(${Math.floor(num / 100)}00)² = ${Math.floor(num / 100) * Math.floor(num / 100)}0000`,
        `2 × ${Math.floor(num / 100)}00 × ${num % 100} = ${2 * Math.floor(num / 100) * 100 * (num % 100)}`,
        `${num % 100}² = ${(num % 100) * (num % 100)}`,
        `${Math.floor(num / 100) * Math.floor(num / 100)}0000 + ${2 * Math.floor(num / 100) * 100 * (num % 100)} + ${(num % 100) * (num % 100)} = ${answer}`,
      ],
    })
  }

  return exercises
}

/**
 * Generates exercises for two-digit cube calculations
 */
export function generateTwoDigitCubeExercises(difficulty, count) {
  const exercises = []

  // Set difficulty ranges
  let ranges = {
    easy: { min: 10, max: 30 }, // Lower numbers
    medium: { min: 25, max: 60 }, // Mid-range
    hard: { min: 50, max: 99 }, // Higher numbers
  }

  const range = ranges[difficulty]

  for (let i = 0; i < count; i++) {
    // Generate a 2-digit number
    const num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min

    // Calculate answer
    const answer = num * num * num

    // Create question string - use a format our component can parse
    const question = `${num}³`

    exercises.push({
      id: i, // Add id property
      question,
      answer: answer.toString(),
      steps: [
        `First, square ${num}: ${num}² = ${num * num}`,
        `Then multiply by ${num} again: ${num * num} × ${num} = ${answer}`,
      ],
    })
  }

  return exercises
}
