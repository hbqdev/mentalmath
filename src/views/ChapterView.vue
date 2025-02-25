<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapters } from '@/data/chapters'

const route = useRoute()
const router = useRouter()

const chapterId = computed(() => parseInt(route.params.chapterId))
const chapter = computed(() => chapters.find(c => c.id === chapterId.value))
const activeSection = ref(null)

onMounted(() => {
  if (chapter.value && chapter.value.sections.length > 0) {
    activeSection.value = chapter.value.sections[0].id
  }
})

function setActiveSection(sectionId) {
  activeSection.value = sectionId
}

function startExercise(exerciseType) {
  router.push(`/exercises/${chapterId.value}/${exerciseType}`)
}
</script>

<template>
  <div v-if="chapter" class="book-container">
    <div class="book-page">
      <div class="sidebar">
        <h3>Contents</h3>
        <ul class="toc-list">
          <li 
            v-for="section in chapter.sections" 
            :key="section.id"
            :class="{ active: activeSection === section.id }"
            @click="setActiveSection(section.id)"
          >
            {{ section.title }}
          </li>
        </ul>
        
        <h3>Practice</h3>
        <ul class="practice-list">
          <li v-for="exerciseType in chapter.exercises.types" :key="exerciseType.id">
            <a href="#" @click.prevent="startExercise(exerciseType.id)">
              {{ exerciseType.title }}
            </a>
          </li>
        </ul>
      </div>

      <div class="content">
        <h1 class="chapter-title">Chapter {{ chapter.id }}: {{ chapter.title }}</h1>
        
        <div v-for="section in chapter.sections" :key="section.id" v-show="activeSection === section.id">
          <h2 class="section-title">{{ section.title }}</h2>
          <div class="section-content" v-html="formatContent(section.content)"></div>
        </div>
        
        <div class="page-navigation">
          <button 
            class="nav-btn prev"
            @click="setActiveSection(chapter.sections[Math.max(0, chapter.sections.findIndex(s => s.id === activeSection) - 1)].id)"
            :disabled="chapter.sections.findIndex(s => s.id === activeSection) === 0"
          >
            Previous
          </button>
          <span class="page-number">
            Page {{ chapter.sections.findIndex(s => s.id === activeSection) + 1 }} of {{ chapter.sections.length }}
          </span>
          <button 
            class="nav-btn next"
            @click="setActiveSection(chapter.sections[Math.min(chapter.sections.length - 1, chapter.sections.findIndex(s => s.id === activeSection) + 1)].id)"
            :disabled="chapter.sections.findIndex(s => s.id === activeSection) === chapter.sections.length - 1"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <h1>Chapter not found</h1>
    <router-link to="/">Return to Home</router-link>
  </div>
</template>

<script>
function formatContent(content) {
  // Replace newlines with <br>
  let formatted = content.replace(/\n/g, '<br>');
  
  // Format math examples
  // Example: 67 + 28 = 87 + 8 = 95
  formatted = formatted.replace(/(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/g, 
    '<div class="math-example"><div class="math-row"><span>$1 + $2</span><span>=</span><span>$3 + $4</span><span>=</span><span>$5</span></div></div>');
  
  // Format math examples with notes
  // Example: 84 + 57 = 134 + 7 = 141
  //         (first add 50)   (then add 7)
  formatted = formatted.replace(/(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)\s*\(first add (\d+)\)\s*\(then add (\d+)\)/g, 
    '<div class="math-example"><div class="math-row"><span>$1 + $2</span><span>=</span><span>$3 + $4</span><span>=</span><span>$5</span></div><div class="math-notes"><span>(first add $6)</span><span>(then add $7)</span></div></div>');
  
  // Format single line math examples
  // Example: 84 + 57 (50 + 7)
  formatted = formatted.replace(/(\d+)\s*\+\s*(\d+)\s*\((\d+)\s*\+\s*(\d+)\)/g, 
    '<div class="math-example"><div class="math-row"><span>$1</span><span>+ $2</span><span>($3 + $4)</span></div></div>');
  
  return formatted;
}
</script>

<style scoped>
.book-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  background-color: white;
}

.book-page {
  display: flex;
  min-height: calc(100vh - 120px);
  border-top: 1px solid #e0e0e0;
}

.sidebar {
  width: 220px;
  padding: 2rem 1rem;
  border-right: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.sidebar h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
}

.toc-list, .practice-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.toc-list li, .practice-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.toc-list li.active {
  font-weight: bold;
  color: #2c3e50;
  border-left: 3px solid #2c3e50;
  padding-left: 0.5rem;
}

.practice-list a {
  color: #2c3e50;
  text-decoration: none;
}

.content {
  flex: 1;
  padding: 2rem 3rem;
  line-height: 1.6;
}

.chapter-title {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
  color: #2c3e50;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.section-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
}

.section-content p {
  margin-bottom: 1.5rem;
}

/* Math example styling */
.math-example {
  margin: 2rem 0;
  text-align: center;
  font-family: 'Georgia', serif;
}

.math-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.math-notes {
  display: flex;
  justify-content: space-around;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

.page-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.nav-btn {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background-color: #e5e5e5;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number {
  font-size: 0.9rem;
  color: #777;
}

.not-found {
  text-align: center;
  padding: 3rem;
}

@media (max-width: 768px) {
  .book-page {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
}
</style> 