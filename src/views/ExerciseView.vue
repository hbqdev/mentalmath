<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapters } from '@/data/chapters'
import { generateExercises } from '@/utils/exerciseGenerator'
//import ChapterNavigation from '@/components/ChapterNavigation.vue'

const route = useRoute()
const router = useRouter()

const chapterId = computed(() => parseInt(route.params.chapterId))
const exerciseType = computed(() => route.params.exerciseType)

const chapter = ref(null)
const exerciseInfo = ref(null)
const generatedExercises = ref([])
const currentExerciseIndex = ref(0)
const currentExercise = ref(null)
const userAnswer = ref('')
const feedback = ref(null)
const exercisesCompleted = ref(0)
const correctAnswers = ref(0)
const answerInput = ref(null)

// Add new display types
const displayType = ref('normal') // 'normal', 'fraction', 'division', 'divisibilityTest'

onMounted(() => {
  loadChapterData()
  // Automatically generate exercises when the component mounts
  generateNewExercises()
})

// Clean up when component is unmounted
onBeforeUnmount(() => {
  resetState()
})

// Watch for route changes to reset component state
watch(
  () => [route.params.chapterId, route.params.exerciseType],
  (newVal, oldVal) => {
    if (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1]) {
      resetState()
      nextTick(() => {
        loadChapterData()
        generateNewExercises() // Generate new exercises when route changes
      })
    }
  },
)

function resetState() {
  // Clear all reactive references
  generatedExercises.value = []
  currentExerciseIndex.value = 0
  currentExercise.value = null
  userAnswer.value = ''
  feedback.value = null
  exercisesCompleted.value = 0
  correctAnswers.value = 0

  // Force garbage collection where possible
  if (window.gc) window.gc()
}

function loadChapterData() {
  chapter.value = chapters.find((c) => c.id === chapterId.value)
  if (chapter.value && chapter.value.exercises) {
    exerciseInfo.value = chapter.value.exercises.types.find((t) => t.id === exerciseType.value)
  }
}

function generateNewExercises() {
  // Generate exercises using our utility - no difficulty parameter now
  generatedExercises.value = generateExercises(chapterId.value, exerciseType.value, 10)
  currentExerciseIndex.value = 0
  setCurrentExercise()

  // Reset state
  feedback.value = null
  userAnswer.value = ''
  exercisesCompleted.value = 0
  correctAnswers.value = 0
}

function setCurrentExercise() {
  const exercise = generatedExercises.value[currentExerciseIndex.value]
  if (!exercise) return

  // Special handling for Chapter 7 exercises
  if (chapterId.value === 7) {
    currentExercise.value = {
      ...exercise,
      displayType: exercise.type, // Use the exercise type directly
    }
    return
  }

  let num1,
    num2,
    operator,
    isExponent = false,
    exponent = ''
  let numerator1, denominator1, numerator2, denominator2
  let isDivisibilityTest = false

  // Reset display type to default
  displayType.value = 'normal'

  // Handle different question formats
  if (exercise.question.includes('×')) {
    // Check if it's fraction multiplication
    if (exercise.question.includes('/')) {
      displayType.value = 'fraction'
      const fractions = exercise.question.split('×')
      const frac1 = fractions[0].trim().split('/')
      const frac2 = fractions[1].trim().split('/')

      numerator1 = parseInt(frac1[0])
      denominator1 = parseInt(frac1[1])
      numerator2 = parseInt(frac2[0])
      denominator2 = parseInt(frac2[1])
      operator = '×'
    } else {
      operator = '×'
      ;[num1, num2] = exercise.question.split('×').map((part) => parseInt(part.trim()))
    }
  } else if (exercise.question.includes('+')) {
    // Check if it's a fraction addition
    if (exercise.question.includes('/')) {
      displayType.value = 'fraction'
      const fractions = exercise.question.split('+')
      const frac1 = fractions[0].trim().split('/')
      const frac2 = fractions[1].trim().split('/')

      numerator1 = parseInt(frac1[0])
      denominator1 = parseInt(frac1[1])
      numerator2 = parseInt(frac2[0])
      denominator2 = parseInt(frac2[1])
      operator = '+'
    } else {
      operator = '+'
      ;[num1, num2] = exercise.question.split('+').map((part) => parseInt(part.trim()))
    }
  } else if (exercise.question.includes('-')) {
    // Check if it's a fraction subtraction
    if (exercise.question.includes('/')) {
      displayType.value = 'fraction'
      const fractions = exercise.question.split('-')
      const frac1 = fractions[0].trim().split('/')
      const frac2 = fractions[1].trim().split('/')

      numerator1 = parseInt(frac1[0])
      denominator1 = parseInt(frac1[1])
      numerator2 = parseInt(frac2[0])
      denominator2 = parseInt(frac2[1])
      operator = '-'
    } else {
      operator = '-'
      ;[num1, num2] = exercise.question.split('-').map((part) => parseInt(part.trim()))
    }
  } else if (exercise.question.includes('÷')) {
    // Check if it's a fraction division problem (containing both ÷ and /)
    if (exercise.question.includes('/')) {
      displayType.value = 'fraction'
      const parts = exercise.question.split('÷')
      const frac1 = parts[0].trim().split('/')
      const frac2 = parts[1].trim().split('/')

      numerator1 = parseInt(frac1[0])
      denominator1 = parseInt(frac1[1])
      numerator2 = parseInt(frac2[0])
      denominator2 = parseInt(frac2[1])
      operator = '÷'
    } else {
      // Regular division problems (not fractions)
      displayType.value = 'division'
      operator = '÷'
      ;[num1, num2] = exercise.question.split('÷').map((part) => parseInt(part.trim()))
    }
  } else if (exercise.question.includes('divisible by')) {
    // Divisibility test problems
    displayType.value = 'divisibilityTest'
    isDivisibilityTest = true
    // Extract the number and divisor from question like "Is 123 divisible by 3?"
    const match = exercise.question.match(/Is (\d+) divisible by (\d+)\?/)
    if (match) {
      num1 = parseInt(match[1])
      num2 = parseInt(match[2])
    }
  } else if (exercise.question.includes('²')) {
    // Handle square exercises
    isExponent = true
    exponent = '2'
    num1 = parseInt(exercise.question.replace('²', '').trim())
    num2 = null
  } else if (exercise.question.includes('³')) {
    // Handle cube exercises
    isExponent = true
    exponent = '3'
    num1 = parseInt(exercise.question.replace('³', '').trim())
    num2 = null
  } else if (exercise.question.includes('/')) {
    // Handle single fraction (for simplification or decimalization)
    displayType.value = 'singleFraction'
    const parts = exercise.question.split('/')
    numerator1 = parseInt(parts[0].trim())
    denominator1 = parseInt(parts[1].trim())
    // No operator or second fraction
    operator = null
    numerator2 = null
    denominator2 = null
  } else if (exercise.question.includes('% of')) {
    // Percentage calculation
    displayType.value = 'percentage'
    const parts = exercise.question.split('% of')
    const percentage = parseFloat(parts[0])
    const number = parseInt(parts[1].trim())

    num1 = percentage
    num2 = number
    operator = '% of'
  } else if (exercise.question.includes('Convert')) {
    // Fraction-decimal conversion
    displayType.value = 'conversion'
    const match = exercise.question.match(/Convert (.*) to a (.*)/)
    if (match) {
      num1 = match[1] // The value to convert
      num2 = match[2] // The target format (decimal or fraction)
    }
  } else if (exercise.question.includes('Calculate the square root of')) {
    // Square root calculation
    displayType.value = 'squareRoot'
    num1 = parseInt(exercise.question.replace('Calculate the square root of', '').trim())
    num2 = null
  } else if (exercise.displayFormat === 'squareRoot') {
    displayType.value = 'squareRoot'
    num1 = exercise.question.replace('√', '')
  } else if (exercise.question.includes('number-to-word')) {
    displayType.value = 'number-to-word'
    num1 = parseInt(exercise.question.split('number-to-word ')[1])
  } else if (exercise.question.includes('word-to-number')) {
    displayType.value = 'word-to-number'
    num1 = exercise.question.split('word-to-number ')[1]
  } else if (exercise.question.includes('memory-chain')) {
    displayType.value = 'memory-chain'
    const [sequence, hint] = exercise.question.split('memory-chain ')
    num1 = sequence
    num2 = hint
  } else if (exercise.question.includes('digit-sound')) {
    displayType.value = 'digit-sound'
    const sounds = exercise.question.split('digit-sound ')[1]
    num1 = sounds
    num2 = null
  } else {
    console.error('Unknown question format:', exercise.question)
    return
  }

  currentExercise.value = {
    num1,
    num2,
    operator,
    isExponent,
    exponent,
    displayType: displayType.value,
    isDivisibilityTest,
    numerator1,
    denominator1,
    numerator2,
    denominator2,
    correctAnswer: exercise.answer,
  }

  // Focus the input field after a short delay
  nextTick(() => {
    if (answerInput.value) {
      answerInput.value.focus()
    }
  })
}

function checkAnswer() {
  if (!currentExercise.value) return

  let isCorrect = false
  const userInput = userAnswer.value.trim()

  // Special handling for Chapter 7 exercises
  if (chapterId.value === 7) {
    if (currentExercise.value.type === 'number-to-word') {
      isCorrect = currentExercise.value.verifyAnswer(userInput)
      if (isCorrect) {
        feedback.value = {
          correct: true,
          message: 'Correct! Great job!',
        }
      } else {
        feedback.value = {
          correct: false,
          message: `Incorrect. Try another word using the phonetic code. ${currentExercise.value.hint || ''}`,
        }
      }
    } else if (currentExercise.value.type === 'word-to-number') {
      isCorrect = userInput === currentExercise.value.correctAnswer
      if (isCorrect) {
        feedback.value = {
          correct: true,
          message: 'Correct! Great job!',
        }
      } else {
        feedback.value = {
          correct: false,
          message: `Incorrect. The word "${currentExercise.value.word}" converts to ${currentExercise.value.correctAnswer} using the phonetic code.`,
        }
      }
    } else if (currentExercise.value.type === 'memory-chain') {
      isCorrect = currentExercise.value.verifyAnswer(userInput)
      if (isCorrect) {
        feedback.value = {
          correct: true,
          message: 'Correct! Your sentence correctly represents the number sequence!',
        }
      } else {
        feedback.value = {
          correct: false,
          message: `Incorrect. Try creating another sentence that represents ${currentExercise.value.sequence}. ${currentExercise.value.hint || ''}`,
        }
      }
    } else if (currentExercise.value.type === 'digit-sound') {
      isCorrect = userInput === currentExercise.value.correctAnswer
      if (isCorrect) {
        feedback.value = {
          correct: true,
          message: `Correct! The sounds "${currentExercise.value.sounds}" correspond to the digit ${currentExercise.value.correctAnswer}.`,
        }
      } else {
        feedback.value = {
          correct: false,
          message: `Incorrect. The sounds "${currentExercise.value.sounds}" correspond to the digit ${currentExercise.value.correctAnswer}.`,
        }
      }
    }

    if (isCorrect) {
      correctAnswers.value++
    }
    exercisesCompleted.value++
    return
  }

  if (currentExercise.value.isDivisibilityTest) {
    // For divisibility tests, accept yes/no or y/n (case insensitive)
    const normalizedUserInput = userInput.toLowerCase()
    const normalizedCorrectAnswer = currentExercise.value.correctAnswer.toLowerCase()

    isCorrect =
      normalizedUserInput === normalizedCorrectAnswer ||
      normalizedUserInput === normalizedCorrectAnswer[0] // First letter only (y/n)
  } else if (
    currentExercise.value.displayType === 'singleFraction' ||
    currentExercise.value.displayType === 'fraction'
  ) {
    // For fractions, handle various answer formats
    // Correct answer might be "3/4" or "0.75" or "3 / 4" etc.
    const normalizedUserInput = userInput.replace(/\s+/g, '')
    const normalizedCorrectAnswer = currentExercise.value.correctAnswer.replace(/\s+/g, '')

    isCorrect = normalizedUserInput === normalizedCorrectAnswer
  } else if (currentExercise.value.displayType === 'division') {
    // For division, correct answer might include "remainder" text
    // Accept various formats: "5 r 2", "5 remainder 2", etc.
    const normalizedUserInput = userInput.toLowerCase().replace(/\s+/g, ' ')
    const normalizedCorrectAnswer = currentExercise.value.correctAnswer.toLowerCase()

    isCorrect =
      normalizedUserInput === normalizedCorrectAnswer ||
      normalizedUserInput.replace('remainder', 'r') ===
        normalizedCorrectAnswer.replace('remainder', 'r')
  } else if (currentExercise.value.displayType === 'percentage') {
    // For percentage calculations, allow for small rounding differences
    const userNum = parseFloat(userInput.replace(/[^\d.-]/g, ''))
    const correctNum = parseFloat(currentExercise.value.correctAnswer.replace(/[^\d.-]/g, ''))
    isCorrect = !isNaN(userNum) && Math.abs(userNum - correctNum) < 0.1
  } else if (currentExercise.value.displayType === 'conversion') {
    // For conversions, normalize input
    const normalizedUserInput = userInput.replace(/\s+/g, '').toLowerCase()
    const normalizedCorrectAnswer = currentExercise.value.correctAnswer
      .replace(/\s+/g, '')
      .toLowerCase()

    // Special handling for recurring decimals
    if (normalizedCorrectAnswer.includes('...')) {
      const correctBase = normalizedCorrectAnswer.replace('...', '')
      isCorrect =
        normalizedUserInput.startsWith(correctBase) ||
        normalizedUserInput === normalizedCorrectAnswer
    } else {
      isCorrect = normalizedUserInput === normalizedCorrectAnswer
    }
  } else if (currentExercise.value.displayType === 'squareRoot') {
    // For square root calculations, accept approximate answers
    const userNum = parseFloat(userInput)
    const correctNum = Math.sqrt(currentExercise.value.num1)
    isCorrect = !isNaN(userNum) && Math.abs(userNum - correctNum) < 0.1
  } else {
    // For normal arithmetic, parse as number
    const userNum = parseInt(userInput)
    const correctNum = parseInt(currentExercise.value.correctAnswer)
    isCorrect = !isNaN(userNum) && userNum === correctNum
  }

  if (
    isNaN(parseInt(userInput)) &&
    !currentExercise.value.isDivisibilityTest &&
    currentExercise.value.displayType !== 'singleFraction' &&
    currentExercise.value.displayType !== 'fraction' &&
    !userInput.includes('/')
  ) {
    feedback.value = {
      correct: false,
      message: 'Please enter a valid answer.',
    }
    return
  }

  if (isCorrect) {
    feedback.value = {
      correct: true,
      message: 'Correct! Great job!',
    }
    correctAnswers.value++
  } else {
    feedback.value = {
      correct: false,
      message: `Incorrect. The correct answer is ${currentExercise.value.correctAnswer}.`,
    }
  }

  exercisesCompleted.value++
}

function nextExercise() {
  if (currentExerciseIndex.value < generatedExercises.value.length - 1) {
    currentExerciseIndex.value++
    setCurrentExercise()
    feedback.value = null
    userAnswer.value = ''
  } else {
    // End of exercises, show results
    currentExercise.value = null
  }
}

function returnToChapter() {
  // Navigate back to the chapter (the saved page state will be restored by ChapterView)
  router.push(`/chapters/${chapterId.value}`)
}
</script>

<template>
  <div class="exercise-view">
    <div v-if="!chapter || !exerciseInfo" class="loading">Loading exercise...</div>

    <div v-else class="exercise-container">
      <h1>{{ exerciseInfo.title }}</h1>
      <p class="description">{{ exerciseInfo.description }}</p>

      <!-- Generate button for manually generating new exercises -->
      <div class="generate-section">
        <button @click="generateNewExercises" class="btn btn-primary generate-btn">Generate</button>
      </div>

      <div class="exercise-box">
        <div v-if="currentExercise" class="exercise-content">
          <div class="question">
            <!-- For Chapter 7 exercises -->
            <div v-if="chapterId === 7" class="chapter7-exercises">
              <!-- Number to Word -->
              <div v-if="currentExercise.type === 'number-to-word'" class="number-word-conversion">
                <p>Convert this number to a memorable word using the phonetic code:</p>
                <div class="number">{{ currentExercise.number }}</div>
                <div class="hint" v-if="currentExercise.hint">
                  <small>{{ currentExercise.hint }}</small>
                </div>
              </div>

              <!-- Word to Number -->
              <div
                v-else-if="currentExercise.type === 'word-to-number'"
                class="word-number-conversion"
              >
                <p>Convert this word back to its number:</p>
                <div class="word">{{ currentExercise.word }}</div>
              </div>

              <!-- Memory Chain -->
              <div v-else-if="currentExercise.type === 'memory-chain'" class="memory-chain">
                <p>Create a memorable sentence for this number sequence:</p>
                <div class="sequence">{{ currentExercise.sequence }}</div>
                <div class="hint" v-if="currentExercise.hint">
                  <small>{{ currentExercise.hint }}</small>
                </div>
              </div>

              <!-- Digit Sound Association -->
              <div v-else-if="currentExercise.type === 'digit-sound'" class="digit-sound">
                <p>What digit corresponds to these consonant sounds?</p>
                <div class="sounds">{{ currentExercise.sounds }}</div>
                <div class="hint">
                  <small>Enter the single digit (0-9) that matches these sounds.</small>
                </div>
              </div>
            </div>

            <!-- For other chapter exercises -->
            <div v-else>
              <!-- For normal operations (multiplication, addition, subtraction) -->
              <div v-if="currentExercise.displayType === 'normal'" class="numbers">
                <template v-if="!currentExercise.isExponent">
                  <span class="number">{{ currentExercise.num1 }}</span>
                  <span class="operator">{{ currentExercise.operator }}</span>
                  <span class="number">{{ currentExercise.num2 }}</span>
                </template>
                <template v-else>
                  <div class="exponent-container">
                    <span class="number">{{ currentExercise.num1 }}</span>
                    <sup class="exponent">{{ currentExercise.exponent }}</sup>
                  </div>
                </template>
              </div>

              <!-- For division operations -->
              <div v-else-if="currentExercise.displayType === 'division'" class="numbers">
                <span class="number">{{ currentExercise.num1 }}</span>
                <span class="operator">÷</span>
                <span class="number">{{ currentExercise.num2 }}</span>
              </div>

              <!-- For divisibility tests -->
              <div
                v-else-if="currentExercise.displayType === 'divisibilityTest'"
                class="divisibility-test"
              >
                <p>Is {{ currentExercise.num1 }} divisible by {{ currentExercise.num2 }}?</p>
              </div>

              <!-- For fractions (addition, subtraction, multiplication, division) -->
              <div
                v-else-if="currentExercise.displayType === 'fraction'"
                class="fraction-operation"
              >
                <div class="fraction">
                  <div class="numerator">{{ currentExercise.numerator1 }}</div>
                  <div class="fraction-line"></div>
                  <div class="denominator">{{ currentExercise.denominator1 }}</div>
                </div>
                <span class="operator">{{ currentExercise.operator }}</span>
                <div class="fraction">
                  <div class="numerator">{{ currentExercise.numerator2 }}</div>
                  <div class="fraction-line"></div>
                  <div class="denominator">{{ currentExercise.denominator2 }}</div>
                </div>
              </div>

              <!-- For single fractions (simplification or decimalization) -->
              <div
                v-else-if="currentExercise.displayType === 'singleFraction'"
                class="single-fraction"
              >
                <div class="fraction">
                  <div class="numerator">{{ currentExercise.numerator1 }}</div>
                  <div class="fraction-line"></div>
                  <div class="denominator">{{ currentExercise.denominator1 }}</div>
                </div>
              </div>

              <!-- For percentage calculations -->
              <div
                v-else-if="currentExercise.displayType === 'percentage'"
                class="percentage-calculation"
              >
                <div class="percentage-formula">
                  <span class="number">{{ currentExercise.num1 }}</span>
                  <span class="operator">% of</span>
                  <span class="number">{{ currentExercise.num2 }}</span>
                </div>
              </div>

              <!-- For fraction/decimal conversion -->
              <div v-else-if="currentExercise.displayType === 'conversion'" class="conversion">
                <p class="conversion-prompt">
                  Convert {{ currentExercise.num1 }} to a {{ currentExercise.num2 }}
                </p>
              </div>

              <!-- For square root calculations -->
              <div
                v-else-if="currentExercise.displayType === 'squareRoot'"
                class="square-root-calculation"
              >
                <p>Calculate the square root of:</p>
                <div class="number">{{ currentExercise.num1 }}</div>
              </div>

              <!-- For number-to-word conversion -->
              <div
                v-else-if="currentExercise.displayType === 'number-to-word'"
                class="number-word-conversion"
              >
                <p>Convert this number to a memorable word:</p>
                <div class="number">{{ currentExercise.num1 }}</div>
                <div class="hint" v-if="currentExercise.num2">
                  <small>{{ currentExercise.num2 }}</small>
                </div>
              </div>

              <!-- For word-to-number conversion -->
              <div
                v-else-if="currentExercise.displayType === 'word-to-number'"
                class="word-number-conversion"
              >
                <p>Convert this word back to its number:</p>
                <div class="word">{{ currentExercise.num1 }}</div>
              </div>

              <!-- For memory chain exercises -->
              <div v-else-if="currentExercise.displayType === 'memory-chain'" class="memory-chain">
                <p>Create a memorable sentence for this number sequence:</p>
                <div class="sequence">{{ currentExercise.num1 }}</div>
                <div class="hint" v-if="currentExercise.num2">
                  <small>{{ currentExercise.num2 }}</small>
                </div>
              </div>
            </div>

            <div class="answer-section">
              <input
                type="text"
                v-model="userAnswer"
                :placeholder="currentExercise.isDivisibilityTest ? 'Yes or No' : 'Your answer'"
                @keyup.enter="checkAnswer"
                :disabled="!!feedback"
                ref="answerInput"
                class="answer-input"
              />

              <button @click="checkAnswer" :disabled="!!feedback" class="btn check-btn">
                Check
              </button>
            </div>

            <div
              v-if="feedback"
              class="feedback"
              :class="{ correct: feedback.correct, incorrect: !feedback.correct }"
            >
              {{ feedback.message }}
            </div>

            <div class="exercise-nav">
              <button v-if="feedback" @click="nextExercise" class="btn next-btn">
                {{ currentExerciseIndex < generatedExercises.length - 1 ? 'Next' : 'See Results' }}
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="exercisesCompleted > 0" class="results">
          <h2>Results</h2>
          <p>You got {{ correctAnswers }} out of {{ exercisesCompleted }} correct.</p>
          <p>Score: {{ Math.round((correctAnswers / exercisesCompleted) * 100) }}%</p>

          <button @click="generateNewExercises" class="btn generate-btn">Practice Again</button>
        </div>

        <div v-else class="start-section">
          <p>Click "Generate" to start practicing.</p>
        </div>
      </div>

      <div class="bottom-nav">
        <button @click="returnToChapter" class="btn return-btn">Return to Chapter</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exercise-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.exercise-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  margin-bottom: 0.5rem;
}

.description {
  margin-bottom: 1.5rem;
  text-align: center;
}

.generate-section {
  margin-bottom: 1.5rem;
  text-align: center;
}

.exercise-box {
  width: 100%;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.question {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.numbers {
  font-size: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
}

.number {
  font-weight: bold;
}

.operator {
  margin: 0 1rem;
}

.exponent-container {
  display: inline-flex;
  align-items: flex-start;
}

.exponent {
  font-size: 1.2rem;
  font-weight: bold;
  line-height: 1;
  margin-left: 2px;
}

.answer-section {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.answer-input {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.btn {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
}

.btn-primary {
  background-color: #2c3e50;
  color: white;
}

.check-btn {
  background-color: #4caf50;
  color: white;
}

.next-btn {
  background-color: #007bff;
  color: white;
}

.return-btn {
  background-color: #6c757d;
  color: white;
}

.generate-btn {
  background-color: #2c3e50;
  color: white;
}

.feedback {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.correct {
  background-color: #d4edda;
  color: #155724;
}

.incorrect {
  background-color: #f8d7da;
  color: #721c24;
}

.exercise-nav {
  margin-top: 1rem;
}

.results {
  text-align: center;
}

.results h2 {
  margin-bottom: 1rem;
}

.results p {
  margin-bottom: 0.5rem;
}

.bottom-nav {
  width: 100%;
  display: flex;
  justify-content: center;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.start-section {
  text-align: center;
}

/* New styles for fractions and division */
.fraction-operation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.single-fraction {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.fraction {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.numerator,
.denominator {
  padding: 0.25rem 0.5rem;
  font-weight: bold;
  font-size: 1.8rem;
}

.fraction-line {
  width: 100%;
  height: 2px;
  background-color: #000;
  margin: 0.25rem 0;
}

.divisibility-test {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

/* Add to the style section */
.percentage-calculation,
.conversion {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
}

.percentage-formula {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.conversion-prompt {
  font-weight: normal;
}

.square-root-calculation {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
}

.square-root-calculation .number {
  font-weight: bold;
  font-size: 2rem;
}

.number-word-conversion,
.word-number-conversion,
.memory-chain {
  text-align: center;
  margin-bottom: 2rem;
}

.number-word-conversion .number,
.word-number-conversion .word,
.memory-chain .sequence {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 1rem 0;
}

.hint {
  color: #666;
  font-style: italic;
  margin: 0.5rem 0;
}

.chapter7-exercises {
  text-align: center;
  margin-bottom: 2rem;
}

.number-word-conversion .number,
.word-number-conversion .word,
.memory-chain .sequence {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 1rem 0;
  font-family: monospace;
}

.hint {
  color: #666;
  font-style: italic;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

/* Add to your existing styles */
.digit-sound {
  text-align: center;
  margin-bottom: 2rem;
}

.digit-sound .sounds {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 1rem 0;
  font-family: monospace;
  color: #2c3e50;
}

.digit-sound .hint {
  color: #666;
  font-style: italic;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}
</style>
