<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapters } from '@/data/chapters'
import { generateExercises } from '@/utils/exerciseGenerator'
import ChapterNavigation from '@/components/ChapterNavigation.vue'

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

  let num1,
    num2,
    operator,
    isExponent = false,
    exponent = ''

  // Handle different question formats
  if (exercise.question.includes('×')) {
    operator = '×'
    ;[num1, num2] = exercise.question.split('×').map((part) => parseInt(part.trim()))
  } else if (exercise.question.includes('+')) {
    operator = '+'
    ;[num1, num2] = exercise.question.split('+').map((part) => parseInt(part.trim()))
  } else if (exercise.question.includes('-')) {
    operator = '-'
    ;[num1, num2] = exercise.question.split('-').map((part) => parseInt(part.trim()))
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
  } else {
    console.error('Unknown operator in question:', exercise.question)
    return
  }

  currentExercise.value = {
    num1,
    num2,
    operator,
    isExponent,
    exponent,
    correctAnswer: parseInt(exercise.answer),
  }

  // Focus the input field after a short delay
  nextTick(() => {
    if (answerInput.value) {
      answerInput.value.focus()
    }
  })
}

function checkAnswer() {
  const userNum = parseInt(userAnswer.value)

  if (isNaN(userNum)) {
    feedback.value = {
      correct: false,
      message: 'Please enter a valid number.',
    }
    return
  }

  if (userNum === currentExercise.value.correctAnswer) {
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
            <div class="numbers">
              <!-- For regular operations (multiplication, addition, subtraction) -->
              <template v-if="!currentExercise.isExponent">
                <span class="number">{{ currentExercise.num1 }}</span>
                <span class="operator">{{ currentExercise.operator }}</span>
                <span class="number">{{ currentExercise.num2 }}</span>
              </template>

              <!-- For exponents (squares, cubes) - using proper HTML superscript -->
              <template v-else>
                <div class="exponent-container">
                  <span class="number">{{ currentExercise.num1 }}</span>
                  <sup class="exponent">{{ currentExercise.exponent }}</sup>
                </div>
              </template>
            </div>

            <div class="answer-section">
              <input
                type="text"
                v-model="userAnswer"
                placeholder="Your answer"
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
</style>
