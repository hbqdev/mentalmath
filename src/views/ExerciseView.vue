<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapters } from '@/data/chapters'

const route = useRoute()
const router = useRouter()

const chapterId = computed(() => parseInt(route.params.chapterId))
const exerciseType = computed(() => route.params.exerciseType)

const chapter = computed(() => chapters.find(c => c.id === chapterId.value))
const exerciseConfig = computed(() => {
  if (!chapter.value) return null
  return chapter.value.exercises.types.find(t => t.id === exerciseType.value)
})

const difficulty = ref('easy')
const currentExercise = ref(null)
const userAnswer = ref('')
const feedback = ref(null)
const showSteps = ref(false)
const exercisesCompleted = ref(0)
const correctAnswers = ref(0)

function setDifficulty(level) {
  difficulty.value = level
  generateExercise()
}

function generateExercise() {
  feedback.value = null
  userAnswer.value = ''
  
  if (exerciseType.value === 'addition') {
    generateAdditionExercise()
  } else if (exerciseType.value === 'subtraction') {
    generateSubtractionExercise()
  }
}

function generateAdditionExercise() {
  let num1, num2
  
  if (difficulty.value === 'easy') {
    num1 = Math.floor(Math.random() * 90) + 10 // 10-99
    num2 = Math.floor(Math.random() * 90) + 10 // 10-99
  } else if (difficulty.value === 'medium') {
    num1 = Math.floor(Math.random() * 900) + 100 // 100-999
    num2 = Math.floor(Math.random() * 900) + 100 // 100-999
  } else {
    num1 = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
    num2 = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
  }
  
  currentExercise.value = {
    num1,
    num2,
    operator: '+',
    correctAnswer: num1 + num2
  }
}

function generateSubtractionExercise() {
  let num1, num2
  
  if (difficulty.value === 'easy') {
    num1 = Math.floor(Math.random() * 90) + 10 // 10-99
    num2 = Math.floor(Math.random() * num1) + 1 // 1 to num1-1
  } else if (difficulty.value === 'medium') {
    num1 = Math.floor(Math.random() * 900) + 100 // 100-999
    num2 = Math.floor(Math.random() * (num1 - 10)) + 10 // 10 to num1-1
  } else {
    num1 = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
    num2 = Math.floor(Math.random() * (num1 - 100)) + 100 // 100 to num1-1
  }
  
  currentExercise.value = {
    num1,
    num2,
    operator: '-',
    correctAnswer: num1 - num2
  }
}

function checkAnswer() {
  const userNum = parseInt(userAnswer.value)
  
  if (isNaN(userNum)) {
    feedback.value = {
      correct: false,
      message: 'Please enter a valid number.'
    }
    return
  }
  
  if (userNum === currentExercise.value.correctAnswer) {
    feedback.value = {
      correct: true,
      message: 'Correct! Great job!'
    }
  } else {
    feedback.value = {
      correct: false,
      message: `Incorrect. The correct answer is ${currentExercise.value.correctAnswer}.`
    }
  }
}

function nextExercise() {
  generateExercise()
}

function toggleSteps() {
  showSteps.value = !showSteps.value
}

function returnToChapter() {
  router.push(`/chapters/${chapterId.value}`)
}

onMounted(() => {
  if (exerciseConfig.value) {
    generateExercise()
  }
})
</script>

<template>
  <div v-if="exerciseConfig" class="exercise-view">
    <div class="exercise-header">
      <h1>{{ exerciseConfig.title }}</h1>
      <p>{{ exerciseConfig.description }}</p>
      
      <div class="difficulty-selector">
        <span>Difficulty:</span>
        <button 
          v-for="level in exerciseConfig.difficulty" 
          :key="level"
          :class="{ active: difficulty === level }"
          @click="setDifficulty(level)"
        >
          {{ level.charAt(0).toUpperCase() + level.slice(1) }}
        </button>
      </div>
    </div>
    
    <div v-if="currentExercise" class="exercise-container">
      <div class="problem">
        <div class="number">{{ currentExercise.num1 }}</div>
        <div class="operator">{{ currentExercise.operator }}</div>
        <div class="number">{{ currentExercise.num2 }}</div>
      </div>
      
      <div class="answer-section">
        <input 
          v-model="userAnswer" 
          type="number" 
          placeholder="Your answer"
          :disabled="feedback !== null"
          @keyup.enter="checkAnswer"
        >
        <button 
          v-if="feedback === null" 
          @click="checkAnswer" 
          class="check-btn"
        >
          Check
        </button>
      </div>
      
      <div v-if="feedback" class="feedback" :class="{ correct: feedback.correct }">
        <p>{{ feedback.message }}</p>
        <button @click="nextExercise" class="next-btn">Next Exercise</button>
      </div>
    </div>
    
    <button @click="returnToChapter" class="return-btn">Return to Chapter</button>
  </div>
  <div v-else class="not-found">
    <h1>Exercise not found</h1>
    <router-link to="/">Return to Home</router-link>
  </div>
</template>

<style scoped>
.exercise-view {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 2rem;
  border: 1px solid #eee;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.exercise-header {
  margin-bottom: 2rem;
  text-align: center;
}

.exercise-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.difficulty-selector {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.difficulty-selector button {
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.difficulty-selector button.active {
  background-color: #2c3e50;
  color: white;
  border-color: #2c3e50;
}

.exercise-container {
  margin: 2rem 0;
  padding: 2rem;
  border: 1px solid #eee;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.problem {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.number {
  font-weight: bold;
}

.answer-section {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.answer-section input {
  padding: 0.75rem;
  font-size: 1.2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 150px;
  text-align: center;
}

.check-btn {
  padding: 0.75rem 1.5rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.feedback {
  text-align: center;
  padding: 1rem;
  border-radius: 4px;
  background-color: #f8d7da;
  color: #721c24;
  margin-bottom: 1.5rem;
}

.feedback.correct {
  background-color: #d4edda;
  color: #155724;
}

.next-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.return-btn {
  display: block;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.return-btn:hover {
  background-color: #5a6268;
}

.not-found {
  text-align: center;
  padding: 3rem;
}
</style> 