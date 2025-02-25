/**
 * Generates a random integer between min and max (inclusive)
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random number with the specified number of digits
 */
function generateRandomNumber(digitCount, maxValue) {
  const min = Math.pow(10, digitCount - 1);
  const max = Math.min(Math.pow(10, digitCount) - 1, maxValue);
  return getRandomInt(min, max);
}

/**
 * Generates an addition exercise based on difficulty
 */
export function generateAdditionExercise(difficulty) {
  const { digitCount, maxValue } = difficulty;
  
  const num1 = generateRandomNumber(digitCount, maxValue);
  const num2 = generateRandomNumber(digitCount, maxValue);
  
  return {
    num1,
    num2,
    operation: '+',
    correctAnswer: num1 + num2,
    steps: generateAdditionSteps(num1, num2)
  };
}

/**
 * Generates a subtraction exercise based on difficulty
 */
export function generateSubtractionExercise(difficulty) {
  const { digitCount, maxValue, minResult = 0 } = difficulty;
  
  const num1 = generateRandomNumber(digitCount, maxValue);
  let num2;
  
  // Ensure the result is not negative or less than minResult
  do {
    num2 = generateRandomNumber(digitCount, num1);
  } while (num1 - num2 < minResult);
  
  return {
    num1,
    num2,
    operation: '-',
    correctAnswer: num1 - num2,
    steps: generateSubtractionSteps(num1, num2)
  };
}

/**
 * Generates step-by-step explanation for addition
 */
function generateAdditionSteps(num1, num2) {
  const steps = [];
  const num1Str = num1.toString();
  const num2Str = num2.toString();
  
  // Pad the shorter number with leading zeros
  const maxLength = Math.max(num1Str.length, num2Str.length);
  const paddedNum1 = num1Str.padStart(maxLength, '0');
  const paddedNum2 = num2Str.padStart(maxLength, '0');
  
  let runningTotal = 0;
  
  // Process each place value from left to right
  for (let i = 0; i < maxLength; i++) {
    const placeValue = Math.pow(10, maxLength - i - 1);
    const digit1 = parseInt(paddedNum1[i]);
    const digit2 = parseInt(paddedNum2[i]);
    
    const placeSum = digit1 * placeValue + digit2 * placeValue;
    runningTotal += placeSum;
    
    const placeValueName = getPlaceValueName(maxLength - i - 1);
    
    steps.push({
      description: `Add the ${placeValueName}: ${digit1 * placeValue} + ${digit2 * placeValue} = ${placeSum}`,
      runningTotal
    });
  }
  
  return steps;
}

/**
 * Generates step-by-step explanation for subtraction
 */
function generateSubtractionSteps(num1, num2) {
  const steps = [];
  const num1Str = num1.toString();
  const num2Str = num2.toString();
  
  // Pad the shorter number with leading zeros
  const maxLength = Math.max(num1Str.length, num2Str.length);
  const paddedNum1 = num1Str.padStart(maxLength, '0');
  const paddedNum2 = num2Str.padStart(maxLength, '0');
  
  let runningTotal = 0;
  
  // Process each place value from left to right
  for (let i = 0; i < maxLength; i++) {
    const placeValue = Math.pow(10, maxLength - i - 1);
    const digit1 = parseInt(paddedNum1[i]);
    const digit2 = parseInt(paddedNum2[i]);
    
    const placeDiff = (digit1 - digit2) * placeValue;
    runningTotal += placeDiff;
    
    const placeValueName = getPlaceValueName(maxLength - i - 1);
    
    steps.push({
      description: `Subtract the ${placeValueName}: ${digit1 * placeValue} - ${digit2 * placeValue} = ${placeDiff}`,
      runningTotal
    });
  }
  
  return steps;
}

/**
 * Returns the name of the place value
 */
function getPlaceValueName(exponent) {
  switch (exponent) {
    case 0: return 'ones';
    case 1: return 'tens';
    case 2: return 'hundreds';
    case 3: return 'thousands';
    default: return `10^${exponent}`;
  }
}

/**
 * Generates an exercise based on type and difficulty
 */
export function generateExercise(type, difficultyLevel) {
  const exerciseTypes = {
    addition: generateAdditionExercise,
    subtraction: generateSubtractionExercise
  };
  
  if (!exerciseTypes[type]) {
    throw new Error(`Unknown exercise type: ${type}`);
  }
  
  return exerciseTypes[type](difficultyLevel);
}

// Main Exercise Generator Router
import { 
  generateMultiplyBy11Exercises,
  generateSquaringExercises,
  generateSpecialMultiplicationExercises
} from './generators/chapter0Generator.js';

import {
  generateAdditionExercises,
  generateSubtractionExercises
} from './generators/chapter1Generator.js';

/**
 * Generate exercises based on chapter, exercise type, and difficulty
 */
export function generateExercises(chapterId, exerciseType, difficulty = 'easy', count = 10) {
  // Chapter 0: Quick Tricks
  if (chapterId === 0) {
    if (exerciseType === 'multiply-by-11') {
      return generateMultiplyBy11Exercises(difficulty, count);
    } else if (exerciseType === 'squaring') {
      return generateSquaringExercises(difficulty, count);
    } else if (exerciseType === 'special-multiplication') {
      return generateSpecialMultiplicationExercises(difficulty, count);
    }
  }
  // Chapter 1: Addition and Subtraction
  else if (chapterId === 1) {
    if (exerciseType === 'left-to-right-addition') {
      return generateAdditionExercises(difficulty, count);
    } else if (exerciseType === 'left-to-right-subtraction') {
      return generateSubtractionExercises(difficulty, count);
    }
  }
  
  return [];
} 