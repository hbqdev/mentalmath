// Phonetic code mapping based on Chapter 7
const PHONETIC_CODE = {
  0: ['s', 'z'], // zero starts with z
  1: ['t', 'd'], // t/d has 1 downstroke
  2: ['n'], // n has 2 downstrokes
  3: ['m'], // m has 3 downstrokes
  4: ['r'], // ends in r
  5: ['l'], // L shape with hand
  6: ['j', 'ch', 'sh'], // J looks like backward 6
  7: ['k', 'g'], // K made from two 7s
  8: ['f', 'v'], // cursive f looks like 8
  9: ['p', 'b'], // 9 looks like backward p
}

// Common words for each number combination (based on book examples)
const WORD_EXAMPLES = {
  // Single digit examples
  1: ['tie', 'tea', 'toe'],
  2: ['knee', 'new', 'now'],
  3: ['ma', 'me', 'may'],
  4: ['ray', 'row', 'rye'],
  5: ['law', 'lie', 'lay'],
  6: ['shoe', 'shy', 'jay'],
  7: ['key', 'go', 'cow'],
  8: ['fee', 'foe', 'view'],
  9: ['pie', 'bow', 'bay'],
  0: ['see', 'say', 'zoo'],

  // Two digit examples from the book
  42: ['rain', 'rhino', 'Reno', 'ruin', 'urn'],
  74: ['car', 'cry', 'guru', 'carry'],
  67: ['jug', 'shock', 'chalk', 'joke', 'shake', 'hijack'],
  86: ['fish', 'fudge'],
  93: ['bum', 'bomb', 'beam', 'palm', 'pam'],
  10: ['toss', 'dice', 'toes', 'dizzy', 'oats', 'hats'],
  55: ['lily', 'lola', 'hallelujah'],
}

export function generateNumberToWordExercises(difficulty, count = 1) {
  const exercises = []

  for (let i = 0; i < count; i++) {
    let number
    switch (difficulty) {
      case 'easy':
        // Generate 2-digit numbers
        number = Math.floor(Math.random() * 90 + 10)
        break
      case 'medium':
        // Generate 3-digit numbers
        number = Math.floor(Math.random() * 900 + 100)
        break
      case 'hard':
        // Generate numbers up to 4 digits (like book examples 826, 951)
        number = Math.floor(Math.random() * 9000 + 1000)
        break
    }

    const numberStr = number.toString()
    const examples = WORD_EXAMPLES[numberStr] || []

    exercises.push({
      question: `Convert ${numberStr} into a memorable word using the phonetic code.`,
      number: numberStr,
      type: 'number-to-word',
      hint:
        examples.length > 0 ? `Example words for ${numberStr}: ${examples.join(', ')}` : undefined,
      verifyAnswer: (answer) => isValidPhoneticWord(numberStr, answer.toLowerCase()),
    })
  }

  return exercises
}

export function generateWordToNumberExercises(difficulty, count = 1) {
  const exercises = []
  const words = {
    easy: ['dog', 'oven', 'cart'], // From book examples
    medium: ['fossil', 'banana', 'garage'],
    hard: ['pencil', 'Cleveland', 'multiplication'],
  }

  for (let i = 0; i < count; i++) {
    const wordList = words[difficulty]
    const word = wordList[Math.floor(Math.random() * wordList.length)]

    exercises.push({
      question: `Convert the word "${word}" back to its number using the phonetic code.`,
      word: word,
      type: 'word-to-number',
      correctAnswer: getNumberFromWord(word),
    })
  }

  return exercises
}

export function generateMemoryChainExercises(difficulty, count = 1) {
  const exercises = []

  // Pi digits from the book examples
  const piSequences = {
    easy: '314159', // First 6 digits
    medium: '3141592653', // First 10 digits
    hard: '314159265358979', // First 15 digits
  }

  for (let i = 0; i < count; i++) {
    const sequence = piSequences[difficulty]

    exercises.push({
      question: `Create a memorable sentence to remember this number sequence: ${sequence}`,
      sequence: sequence,
      type: 'memory-chain',
      hint:
        difficulty === 'easy'
          ? 'Example from book: "My turtle Pancho will" can represent 314159'
          : undefined,
      verifyAnswer: (story) => isValidMemoryChainStory(sequence, story),
    })
  }

  return exercises
}

export function generateDigitSoundExercises(difficulty, count = 1) {
  const exercises = []

  for (let i = 0; i < count; i++) {
    const digit = Math.floor(Math.random() * 10)
    const sounds = PHONETIC_CODE[digit].join(', ')

    exercises.push({
      question: `What digit corresponds to the sound(s): ${sounds}?`,
      sounds: sounds,
      type: 'digit-sound',
      correctAnswer: digit.toString(),
    })
  }

  return exercises
}

// Helper functions
function isValidPhoneticWord(number, word) {
  const consonants = word.split('').filter((char) => /[bcdfgjklmnpqrstvwxz]/.test(char))
  const numberDigits = number.split('')

  if (consonants.length !== numberDigits.length) return false

  return consonants.every((consonant, index) => {
    const validSounds = PHONETIC_CODE[numberDigits[index]]
    return validSounds.includes(consonant)
  })
}

function getNumberFromWord(word) {
  const consonants = word
    .toLowerCase()
    .split('')
    .filter((char) => /[bcdfgjklmnpqrstvwxz]/.test(char))

  return consonants
    .map((consonant) => {
      for (const [digit, sounds] of Object.entries(PHONETIC_CODE)) {
        if (sounds.includes(consonant)) return digit
      }
      return ''
    })
    .join('')
}

function isValidMemoryChainStory(sequence, story) {
  // Extract consonants from the story
  const consonants = story
    .toLowerCase()
    .split('')
    .filter((char) => /[bcdfgjklmnpqrstvwxz]/.test(char))
    .join('')

  // Convert consonants to numbers
  const storyNumber = getNumberFromWord(consonants)

  // Check if the story's number matches the sequence
  return storyNumber === sequence
}
