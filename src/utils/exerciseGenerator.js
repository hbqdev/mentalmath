/**
 * Generates a random integer between min and max (inclusive)
 */
function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generates a random number with the specified number of digits
 */
function generateRandomNumber(digitCount, maxValue) {
  const min = Math.pow(10, digitCount - 1)
  const max = Math.min(Math.pow(10, digitCount) - 1, maxValue)
  return getRandomInt(min, max)
}

/**
 * Generates an addition exercise based on difficulty
 */
export function generateAdditionExercise(difficulty) {
  const { digitCount, maxValue } = difficulty

  const num1 = generateRandomNumber(digitCount, maxValue)
  const num2 = generateRandomNumber(digitCount, maxValue)

  return {
    num1,
    num2,
    operation: '+',
    correctAnswer: num1 + num2,
    steps: generateAdditionSteps(num1, num2),
  }
}

/**
 * Generates a subtraction exercise based on difficulty
 */
export function generateSubtractionExercise(difficulty) {
  const { digitCount, maxValue, minResult = 0 } = difficulty

  const num1 = generateRandomNumber(digitCount, maxValue)
  let num2

  // Ensure the result is not negative or less than minResult
  do {
    num2 = generateRandomNumber(digitCount, num1)
  } while (num1 - num2 < minResult)

  return {
    num1,
    num2,
    operation: '-',
    correctAnswer: num1 - num2,
    steps: generateSubtractionSteps(num1, num2),
  }
}

/**
 * Generates step-by-step explanation for addition
 */
function generateAdditionSteps(num1, num2) {
  const steps = []
  const num1Str = num1.toString()
  const num2Str = num2.toString()

  // Pad the shorter number with leading zeros
  const maxLength = Math.max(num1Str.length, num2Str.length)
  const paddedNum1 = num1Str.padStart(maxLength, '0')
  const paddedNum2 = num2Str.padStart(maxLength, '0')

  let runningTotal = 0

  // Process each place value from left to right
  for (let i = 0; i < maxLength; i++) {
    const placeValue = Math.pow(10, maxLength - i - 1)
    const digit1 = parseInt(paddedNum1[i])
    const digit2 = parseInt(paddedNum2[i])

    const placeSum = digit1 * placeValue + digit2 * placeValue
    runningTotal += placeSum

    const placeValueName = getPlaceValueName(maxLength - i - 1)

    steps.push({
      description: `Add the ${placeValueName}: ${digit1 * placeValue} + ${digit2 * placeValue} = ${placeSum}`,
      runningTotal,
    })
  }

  return steps
}

/**
 * Generates step-by-step explanation for subtraction
 */
function generateSubtractionSteps(num1, num2) {
  const steps = []
  const num1Str = num1.toString()
  const num2Str = num2.toString()

  // Pad the shorter number with leading zeros
  const maxLength = Math.max(num1Str.length, num2Str.length)
  const paddedNum1 = num1Str.padStart(maxLength, '0')
  const paddedNum2 = num2Str.padStart(maxLength, '0')

  let runningTotal = 0

  // Process each place value from left to right
  for (let i = 0; i < maxLength; i++) {
    const placeValue = Math.pow(10, maxLength - i - 1)
    const digit1 = parseInt(paddedNum1[i])
    const digit2 = parseInt(paddedNum2[i])

    const placeDiff = (digit1 - digit2) * placeValue
    runningTotal += placeDiff

    const placeValueName = getPlaceValueName(maxLength - i - 1)

    steps.push({
      description: `Subtract the ${placeValueName}: ${digit1 * placeValue} - ${digit2 * placeValue} = ${placeDiff}`,
      runningTotal,
    })
  }

  return steps
}

/**
 * Returns the name of the place value
 */
function getPlaceValueName(exponent) {
  switch (exponent) {
    case 0:
      return 'ones'
    case 1:
      return 'tens'
    case 2:
      return 'hundreds'
    case 3:
      return 'thousands'
    default:
      return `10^${exponent}`
  }
}

/**
 * Generates an exercise based on type and difficulty
 */
export function generateExercise(type, difficultyLevel) {
  const exerciseTypes = {
    addition: generateAdditionExercise,
    subtraction: generateSubtractionExercise,
  }

  if (!exerciseTypes[type]) {
    throw new Error(`Unknown exercise type: ${type}`)
  }

  return exerciseTypes[type](difficultyLevel)
}

// Main Exercise Generator Router
import {
  generateMultiplyBy11Exercises,
  generateSquaringExercises,
  generateSpecialMultiplicationExercises,
} from './generators/chapter0Generator.js'

import {
  generateAdditionExercises,
  generateSubtractionExercises,
} from './generators/chapter1Generator.js'

import {
  generateChapter2SquaringExercises,
  generateDistributiveExercises,
} from './generators/chapter2Generator.js'

import {
  generateAdditionMethodExercises,
  generateSubtractionMethodExercises,
  generateFactoringMethodExercises,
  generateThreeDigitSquareExercises,
  generateTwoDigitCubeExercises,
} from './generators/chapter3Generator'

// Import Chapter 4 generators
import {
  generateOneDigitDivisionExercises,
  generateTwoDigitDivisionExercises,
  generateDecimalizationExercises,
  generateDivisibilityTestsExercises,
  generateMultiplyingFractionsExercises,
  generateDividingFractionsExercises,
  generateSimplifyingFractionsExercises,
  generateAddingFractionsExercises,
  generateSubtractingFractionsExercises,
} from './generators/chapter4Generator'

// Add to your imports
import {
  generatePercentageCalculationExercises,
  generateFractionDecimalConversionExercises,
  generateAdditionGuesstimationExercises,
  generateSubtractionGuesstimationExercises,
} from './generators/chapter5Generator.js'

// Import Chapter 6 generators
import {
  generateColumnAdditionExercises,
  generateModSumsExercises,
  generatePaperSubtractionExercises,
  generateSquareRootExercises,
  generateCrissCrossMultiplicationExercises,
} from './generators/chapter6Generator.js'

// Add to your imports section
import {
  generateNumberToWordExercises,
  generateWordToNumberExercises,
  generateMemoryChainExercises,
  generateDigitSoundExercises,
} from './generators/chapter7Generator.js'

/**
 * Generate exercises based on chapter and exercise type with mixed difficulty levels
 */
export function generateExercises(chapterId, exerciseType, count = 10) {
  // Get a random difficulty level for each exercise
  function getRandomDifficulty() {
    const difficulties = ['easy', 'medium', 'hard']
    const index = Math.floor(Math.random() * difficulties.length)
    return difficulties[index]
  }

  // Generate exercises with mixed difficulty levels
  function generateMixedDifficulty(generatorFn, count) {
    const exercises = []

    // For each exercise, randomly select a difficulty level
    for (let i = 0; i < count; i++) {
      const difficulty = getRandomDifficulty()
      const exercise = generatorFn(difficulty, 1)[0] // Generate one exercise of this difficulty
      exercises.push(exercise)
    }

    return exercises
  }

  // Chapter 0: Quick Tricks
  if (chapterId === 0) {
    if (exerciseType === 'multiply-by-11') {
      return generateMixedDifficulty(generateMultiplyBy11Exercises, count)
    } else if (exerciseType === 'squaring') {
      return generateMixedDifficulty(generateSquaringExercises, count)
    } else if (exerciseType === 'special-multiplication') {
      return generateMixedDifficulty(generateSpecialMultiplicationExercises, count)
    }
  }
  // Chapter 1: Addition and Subtraction
  else if (chapterId === 1) {
    if (exerciseType === 'left-to-right-addition') {
      return generateMixedDifficulty(generateAdditionExercises, count)
    } else if (exerciseType === 'left-to-right-subtraction') {
      return generateMixedDifficulty(generateSubtractionExercises, count)
    }
  }
  // Chapter 2: Multiplication
  else if (chapterId === 2) {
    if (exerciseType === 'squaring') {
      return generateMixedDifficulty(generateChapter2SquaringExercises, count)
    } else if (exerciseType === 'distributive') {
      return generateMixedDifficulty(generateDistributiveExercises, count)
    }
  }
  // Chapter 3: Intermediate Multiplication
  else if (chapterId === 3) {
    if (exerciseType === 'addition-method') {
      return generateMixedDifficulty(generateAdditionMethodExercises, count)
    } else if (exerciseType === 'subtraction-method') {
      return generateMixedDifficulty(generateSubtractionMethodExercises, count)
    } else if (exerciseType === 'factoring-method') {
      return generateMixedDifficulty(generateFactoringMethodExercises, count)
    } else if (exerciseType === 'three-digit-squares') {
      return generateMixedDifficulty(generateThreeDigitSquareExercises, count)
    } else if (exerciseType === 'two-digit-cubes') {
      return generateMixedDifficulty(generateTwoDigitCubeExercises, count)
    }
  }
  // Chapter 4: Division
  else if (chapterId === 4) {
    if (exerciseType === 'one-digit-division') {
      return generateMixedDifficulty(generateOneDigitDivisionExercises, count)
    } else if (exerciseType === 'two-digit-division') {
      return generateMixedDifficulty(generateTwoDigitDivisionExercises, count)
    } else if (exerciseType === 'decimalization') {
      return generateMixedDifficulty(generateDecimalizationExercises, count)
    } else if (exerciseType === 'divisibility-tests') {
      return generateMixedDifficulty(generateDivisibilityTestsExercises, count)
    } else if (exerciseType === 'multiplying-fractions') {
      return generateMixedDifficulty(generateMultiplyingFractionsExercises, count)
    } else if (exerciseType === 'dividing-fractions') {
      return generateMixedDifficulty(generateDividingFractionsExercises, count)
    } else if (exerciseType === 'simplifying-fractions') {
      return generateMixedDifficulty(generateSimplifyingFractionsExercises, count)
    } else if (exerciseType === 'adding-fractions') {
      return generateMixedDifficulty(generateAddingFractionsExercises, count)
    } else if (exerciseType === 'subtracting-fractions') {
      return generateMixedDifficulty(generateSubtractingFractionsExercises, count)
    }
  }
  // Chapter 5: Good Enough: The Art of 'Guesstimation'
  else if (chapterId === 5) {
    switch (exerciseType) {
      case 'percentage-calculation':
        return generateMixedDifficulty(generatePercentageCalculationExercises, count)
      case 'fraction-decimal-conversion':
        return generateMixedDifficulty(generateFractionDecimalConversionExercises, count)
      case 'addition-guesstimation':
        return generateMixedDifficulty(generateAdditionGuesstimationExercises, count)
      case 'subtraction-guesstimation':
        return generateMixedDifficulty(generateSubtractionGuesstimationExercises, count)
      default:
        return []
    }
  }
  // Chapter 6: New Chapter
  else if (chapterId === 6) {
    switch (exerciseType) {
      case 'column-addition':
        return generateMixedDifficulty(generateColumnAdditionExercises, count)
      case 'mod-sums':
        return generateMixedDifficulty(generateModSumsExercises, count)
      case 'paper-subtraction':
        return generateMixedDifficulty(generatePaperSubtractionExercises, count)
      case 'square-root-calculation':
        return generateMixedDifficulty(generateSquareRootExercises, count)
      case 'criss-cross-multiplication':
        return generateMixedDifficulty(generateCrissCrossMultiplicationExercises, count)
      default:
        return []
    }
  }
  // Chapter 7: Memorizing Numbers
  else if (chapterId === 7) {
    switch (exerciseType) {
      case 'number-to-word':
        return generateNumberToWordExercises('medium', count)
      case 'word-to-number':
        return generateWordToNumberExercises('medium', count)
      case 'memory-chain':
        return generateMemoryChainExercises('medium', count)
      case 'digit-sound':
        return generateDigitSoundExercises('medium', count)
      default:
        console.error('Unknown exercise type for chapter 7:', exerciseType)
        return []
    }
  }
  // Add other chapters here...

  return []
}
