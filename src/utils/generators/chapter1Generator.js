/**
 * Chapter 1 Exercise Generators
 * For "A Little Give and Take: Mental Addition and Subtraction"
 */

/**
 * Generate addition exercises
 */
export function generateAdditionExercises(difficulty, count) {
  const exercises = [];
  
  for (let i = 0; i < count; i++) {
    let num1, num2;
    
    if (difficulty === 'easy') {
      // Easy: 2-digit numbers without carrying
      num1 = getRandomInt(10, 50);
      num2 = getRandomInt(10, 40);
      
      // Safer approach: max 10 attempts to find non-carrying numbers
      let attempts = 0;
      while ((num1 % 10) + (num2 % 10) >= 10 && attempts < 10) {
        num2 = getRandomInt(10, 40);
        attempts++;
      }
      
      // If we still couldn't find a good match, force it
      if ((num1 % 10) + (num2 % 10) >= 10) {
        num2 = 10 - (num1 % 10);
      }
    } else if (difficulty === 'medium') {
      // Medium: 2-digit and 3-digit numbers with carrying
      num1 = getRandomInt(50, 99);
      num2 = getRandomInt(30, 99);
      
      // Safer approach: max 10 attempts to find carrying numbers
      let attempts = 0;
      while ((num1 % 10) + (num2 % 10) < 10 && attempts < 10) {
        num2 = getRandomInt(30, 99);
        attempts++;
      }
      
      // If we still couldn't find a good match, force it
      if ((num1 % 10) + (num2 % 10) < 10) {
        num2 = (10 - (num1 % 10)) + getRandomInt(30, 90);
      }
    } else {
      // Hard: 3-digit with carrying
      num1 = getRandomInt(100, 999);
      num2 = getRandomInt(100, 999);
      
      // We don't need strict conditions for hard - having 3-digit numbers is challenging enough
    }
    
    const answer = num1 + num2;
    
    exercises.push({
      id: i,
      question: `${num1} + ${num2}`,
      answer: answer.toString()
    });
  }
  
  return exercises;
}

/**
 * Generate subtraction exercises
 */
export function generateSubtractionExercises(difficulty, count) {
  const exercises = [];
  
  for (let i = 0; i < count; i++) {
    let num1, num2;
    
    if (difficulty === 'easy') {
      // Easy: 2-digit numbers without borrowing
      num2 = getRandomInt(11, 49);
      // Ensure ones digit of num1 is larger than ones digit of num2
      const ones1 = getRandomInt(Math.max(2, num2 % 10 + 1), 9);
      // Ensure tens digit of num1 is larger than tens digit of num2
      const tens1 = getRandomInt(Math.max(2, Math.floor(num2 / 10) + 1), 9);
      num1 = tens1 * 10 + ones1;
    } else if (difficulty === 'medium') {
      // Medium: 2-digit and 3-digit numbers with single borrowing
      num1 = getRandomInt(100, 999);
      num2 = getRandomInt(20, 99);
      
      // Safer approach: max 10 attempts to find suitable borrowing
      let attempts = 0;
      while ((num1 % 10) >= (num2 % 10) && attempts < 10) {
        num2 = getRandomInt(20, 99);
        attempts++;
      }
      
      // If we still couldn't find a good match, force it
      if ((num1 % 10) >= (num2 % 10)) {
        num2 = getRandomInt(20, 99);
        // Ensure the ones digit of num2 is larger than num1
        if ((num1 % 10) < 9) {
          num2 = Math.floor(num2 / 10) * 10 + ((num1 % 10) + 1);
        }
      }
    } else {
      // Hard: 3-digit numbers
      num1 = getRandomInt(300, 999);
      num2 = getRandomInt(100, 299);
      
      // For hard, we don't need to force complex borrowing patterns
      // Any 3-digit subtraction will be challenging enough
    }
    
    const answer = num1 - num2;
    
    exercises.push({
      id: i,
      question: `${num1} - ${num2}`,
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