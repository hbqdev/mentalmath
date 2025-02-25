/**
 * Chapter 0 Exercise Generators
 * For "Quick Tricks: Easy (and Impressive) Calculations"
 */

/**
 * Generate multiply-by-11 exercises
 */
export function generateMultiplyBy11Exercises(difficulty, count) {
  const exercises = [];
  
  for (let i = 0; i < count; i++) {
    let num;
    let answer;
    
    if (difficulty === 'easy') {
      // Easy: Two-digit numbers where digits sum < 10 (no carrying)
      do {
        num = getRandomInt(10, 50);
      } while (Math.floor(num / 10) + (num % 10) >= 10);
      
      // Calculate the answer for two-digit number
      const digit1 = Math.floor(num / 10);
      const digit2 = num % 10;
      const sum = digit1 + digit2;
      
      answer = digit1 * 100 + sum * 10 + digit2;
      
    } else if (difficulty === 'medium') {
      // Medium: Two-digit numbers where digits sum >= 10 (with carrying)
      do {
        num = getRandomInt(50, 90);
      } while (Math.floor(num / 10) + (num % 10) < 10);
      
      // Calculate the answer for two-digit number with carrying
      const digit1 = Math.floor(num / 10);
      const digit2 = num % 10;
      const sum = digit1 + digit2;
      
      answer = (digit1 + 1) * 100 + (sum - 10) * 10 + digit2;
      
    } else {
      // Hard: Three-digit numbers (100-999)
      num = getRandomInt(100, 999);
      
      // Calculate the answer for three-digit number
      const digit1 = Math.floor(num / 100);
      const digit2 = Math.floor((num % 100) / 10);
      const digit3 = num % 10;
      
      // The multiplication is done in stages
      // For ABC × 11:
      // 1. Start with A and C
      // 2. Calculate A+B and B+C for the middle digits
      // 3. Handle carrying where needed
      
      let carry1 = 0, carry2 = 0;
      const sum1 = digit1 + digit2;
      const sum2 = digit2 + digit3;
      
      let midDigit1 = sum1 % 10 + carry1;
      carry2 = Math.floor(sum1 / 10);
      
      let midDigit2 = sum2 % 10 + carry2;
      const carry3 = Math.floor(sum2 / 10) + Math.floor(midDigit2 / 10);
      midDigit2 = midDigit2 % 10;
      
      answer = digit1 * 1000 + midDigit1 * 100 + midDigit2 * 10 + digit3 + carry3 * 10000;
    }
    
    exercises.push({
      id: i,
      question: `${num} × 11`,
      answer: answer.toString()
    });
  }
  
  return exercises;
}

/**
 * Generate squaring exercises for numbers ending in 5
 */
export function generateSquaringExercises(difficulty, count) {
  const exercises = [];
  
  for (let i = 0; i < count; i++) {
    let num;
    
    if (difficulty === 'easy') {
      // Easy: Single-digit first number (15, 25, 35, etc.)
      num = getRandomInt(1, 9) * 10 + 5;
    } else if (difficulty === 'medium') {
      // Medium: Double-digit first number (35, 45, 55, etc.)
      num = getRandomInt(3, 9) * 10 + 5;
    } else {
      // Hard: Proper three-digit numbers ending in 5 (105, 115, ..., 995)
      num = getRandomInt(10, 99) * 10 + 5;
    }
    
    // Calculate the correct answer using the special formula
    const firstPart = Math.floor(num / 10);
    const answer = firstPart * (firstPart + 1) * 100 + 25;
    
    exercises.push({
      id: i,
      question: `${num} × ${num}`,
      answer: answer.toString()
    });
  }
  
  return exercises;
}

/**
 * Generate special multiplication exercises for numbers with the same first digit
 * and second digits that sum to 10
 */
export function generateSpecialMultiplicationExercises(difficulty, count) {
  const exercises = [];
  
  for (let i = 0; i < count; i++) {
    let firstDigit, secondDigit1, secondDigit2;
    
    if (difficulty === 'easy') {
      // Easy: First digit is small (2-4)
      firstDigit = getRandomInt(2, 4);
      secondDigit1 = getRandomInt(1, 5);
      secondDigit2 = 10 - secondDigit1;
    } else if (difficulty === 'medium') {
      // Medium: First digit is medium (5-7)
      firstDigit = getRandomInt(5, 7);
      secondDigit1 = getRandomInt(1, 9);
      secondDigit2 = 10 - secondDigit1;
    } else {
      // Hard: First digit is large (8-9) and calculations are more complex
      firstDigit = getRandomInt(8, 9);
      // Force at least one of the second digits to be larger
      secondDigit1 = getRandomInt(6, 9);
      secondDigit2 = 10 - secondDigit1;
    }
    
    const num1 = firstDigit * 10 + secondDigit1;
    const num2 = firstDigit * 10 + secondDigit2;
    
    // Calculate the answer: (first digit × (first digit + 1)) followed by (second digit1 × second digit2)
    const part1 = firstDigit * (firstDigit + 1);
    const part2 = secondDigit1 * secondDigit2;
    const answer = part1 * 100 + part2;
    
    exercises.push({
      id: i,
      question: `${num1} × ${num2}`,
      answer: answer.toString()
    });
  }
  
  return exercises;
}

/**
 * Helper function to get a random integer between min and max (inclusive)
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
} 