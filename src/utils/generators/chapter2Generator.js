/**
 * Exercise generator for Chapter 2: Squaring Numbers
 * Implements exercises based on the squaring techniques taught in Chapter 2
 */

/**
 * Generate squaring exercises for two-digit numbers
 */
export function generateChapter2SquaringExercises(difficulty, count) {
  const exercises = [];
  
  for (let i = 0; i < count; i++) {
    let num;
    
    if (difficulty === 'easy') {
      // Easy: Numbers ending in 5 or smaller two-digit numbers
      if (Math.random() < 0.6) {
        // Generate a number ending in 5
        num = getRandomInt(1, 3) * 10 + 5; // 15, 25, 35
      } else {
        // Generate smaller two-digit numbers
        num = getRandomInt(10, 25);
      }
    } else if (difficulty === 'medium') {
      // Medium: Mix of all types of two-digit numbers
      if (Math.random() < 0.4) {
        // Generate a number ending in 5
        num = getRandomInt(3, 6) * 10 + 5; // 35, 45, 55, 65
      } else {
        // Generate medium two-digit numbers
        num = getRandomInt(25, 60);
      }
    } else {
      // Hard: Larger two-digit numbers
      if (Math.random() < 0.3) {
        // Generate a number ending in 5
        num = getRandomInt(6, 9) * 10 + 5; // 65, 75, 85, 95
      } else {
        // Generate larger two-digit numbers
        num = getRandomInt(60, 99);
      }
    }
    
    // Calculate the correct answer
    const answer = num * num;
    
    exercises.push({
      id: i,
      question: `${num} × ${num}`,
      answer: answer.toString()
    });
  }
  
  return exercises;
}

/**
 * Generate distributive property exercises (2-by-1 multiplication)
 */
export function generateDistributiveExercises(difficulty, count) {
  const exercises = [];
  
  for (let i = 0; i < count; i++) {
    let num1, num2;
    
    if (difficulty === 'easy') {
      // Easy: Smaller 2-digit numbers and single-digit multipliers
      num1 = getRandomInt(10, 30);
      num2 = getRandomInt(2, 4);
    } else if (difficulty === 'medium') {
      // Medium: Medium 2-digit numbers
      num1 = getRandomInt(25, 60);
      num2 = getRandomInt(4, 7);
    } else {
      // Hard: Larger 2-digit numbers
      num1 = getRandomInt(50, 99);
      num2 = getRandomInt(6, 9);
    }
    
    // Calculate the correct answer
    const answer = num1 * num2;
    
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