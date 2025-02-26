<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
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
    loadMathJax()
  }
})

watch(activeSection, () => {
  nextTick(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise()
    }
  })
})

function loadMathJax() {
  if (window.MathJax) {
    window.MathJax.typesetPromise()
    return
  }

  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
  script.async = true
  script.onload = () => {
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
      }
    }
    window.MathJax.typesetPromise()
  }
  document.head.appendChild(script)
}

function setActiveSection(sectionId) {
  activeSection.value = sectionId
}

function startExercise(exerciseType) {
  // Reset any state if needed
  nextTick(() => {
    router.push(`/exercises/${chapterId.value}/${exerciseType}`)
  })
}

function formatContent(content) {
  if (!content) return ''
  
  let formattedContent = content
  
  // Format exercise titles separately from the exercise content
  formattedContent = formattedContent.replace(
    /EXERCISE: ([^\n]+)/g,
    (match, p1) => {
      return `<div class="exercise-title-container"><div class="exercise-title-line"></div><h3 class="exercise-title">${p1}</h3><div class="exercise-title-line"></div></div>`
    }
  )
  
  // Format exercise problems with proper alignment
  formattedContent = formattedContent.replace(
    /<!-- math:exercise-start -->([\s\S]*?)<!-- math:exercise-end -->/g,
    (match, p1) => {
      return `<div class="exercise-problems">${p1}</div>`
    }
  )
  
  // Format biographical sidebars
  formattedContent = formattedContent.replace(
    /<!-- bio-start -->([\s\S]*?)<!-- bio-end -->/g,
    (match, p1) => {
      return `<div class="biographical-sidebar">${p1}</div>`
    }
  )
  
  // Format paragraphs with proper spacing
  formattedContent = formattedContent.replace(
    /<!-- paragraph -->([\s\S]*?)<!-- \/paragraph -->/g,
    (match, p1) => {
      return `<p class="book-paragraph">${p1.trim()}</p>`
    }
  )
  
  // Format section headings
  formattedContent = formattedContent.replace(
    /<!-- heading -->([\s\S]*?)<!-- \/heading -->/g,
    (match, p1) => {
      return `<h3 class="book-heading">${p1.trim()}</h3>`
    }
  )
  
  // Format vertical math problems
  formattedContent = formattedContent.replace(
    /<!-- math:vertical-start -->([\s\S]*?)<!-- math:vertical-end -->/g,
    (match, p1) => {
      // Split the content by lines
      const lines = p1.trim().split('\n');
      
      // Extract the top number (first line)
      const topNumber = lines[0].trim();
      
      // Extract the operation and bottom number (second line)
      const secondLine = lines[1].trim();
      const operationMatch = secondLine.match(/^([+\-×÷])\s*(.*)/);
      
      if (operationMatch) {
        const operation = operationMatch[1];
        let bottomText = operationMatch[2].trim();
        
        // Check if there's an explanation in parentheses
        const parts = bottomText.match(/^(\d+)(\s*\(.+\))?$/);
        const mainNumber = parts ? parts[1] : bottomText;
        const explanation = parts && parts[2] ? parts[2] : '';
        
        // Calculate padding to align numbers
        const padding = ' '.repeat(operation.length + 1); // +1 for the space after operation
        
        // Format with proper alignment using pre-formatted text
        return `
          <div class="math-problem-container">
            <pre class="math-vertical-problem">
${padding}${topNumber}
${operation} ${mainNumber}${explanation}
${'─'.repeat(Math.max(topNumber.length + padding.length, mainNumber.length + explanation.length + padding.length))}
</pre>
          </div>
        `;
      }
      
      // Fallback if the parsing fails
      return `<div class="math-problem-container"><div class="math-vertical-problem">${p1}</div></div>`;
    }
  )
  
  // Format math diagrams with better alignment
  formattedContent = formattedContent.replace(
    /<!-- math:diagram-start -->([\s\S]*?)<!-- math:diagram-end -->/g,
    (match, p1) => {
      // Process the content to format it properly
      const lines = p1.trim().split('\n');
      
      // Format each line, preserving spaces but adding annotation styling
      const formattedLines = lines.map(line => {
        return line.replace(/\(([^)]+)\)/g, '<span class="diagram-annotation">($1)</span>');
      });
      
      return `<div class="math-diagram">${formattedLines.join('\n')}</div>`;
    }
  )
  
  // Format math expressions
  formattedContent = formattedContent.replace(
    /<!-- math:expression-start -->([\s\S]*?)<!-- math:expression-end -->/g,
    (match, p1) => {
      return `<div class="math-expression">${p1}</div>`
    }
  )
  
  // Format number sequences
  formattedContent = formattedContent.replace(
    /<!-- math:sequence-start -->([\s\S]*?)<!-- math:sequence-end -->/g,
    (match, p1) => {
      return `<div class="number-sequence">${p1}</div>`
    }
  )
  
  return formattedContent
}

onBeforeUnmount(() => {
  // Clean up any resources
  activeSection.value = null
})
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
          <li v-for="exerciseType in chapter.exercises?.types || []" :key="exerciseType.id">
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

<style scoped>
.book-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.book-page {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: calc(100vh - 120px);
  border-top: 1px solid #e0e0e0;
  background-color: #fff;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.sidebar {
  width: 250px;
  background-color: #f9f9f9;
  border-right: 1px solid #e0e0e0;
  padding: 1.5rem;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #444;
}

.toc-list, .practice-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.toc-list li, .practice-list li {
  padding: 0.5rem 0;
  cursor: pointer;
  transition: color 0.3s ease;
}

.toc-list li:hover, .practice-list li a:hover {
  color: #2c3e50;
}

.toc-list li.active {
  font-weight: bold;
  color: #2c3e50;
  border-left: 3px solid #2c3e50;
  padding-left: 0.5rem;
  margin-left: -0.5rem;
}

.practice-list li a {
  color: #555;
  text-decoration: none;
  display: block;
}

.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.chapter-title {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.section-title {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 2rem 0 1rem;
}

.section-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  padding: 0 2rem;
  font-family: 'Georgia', serif;
  max-width: 700px;
  margin: 0 auto;
}

.section-content :deep(.math-diagram) {
  font-family: monospace;
  white-space: pre;
  margin: 1rem auto;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  text-align: center;
  font-size: 1.2rem;
  line-height: 1.3;
  display: block;
  min-width: 80%;
  max-width: 100%;
  overflow-x: auto;
}

.section-content :deep(.diagram-annotation) {
  font-size: 0.8rem;
  color: #555;
  font-style: italic;
  font-family: Georgia, serif;
  display: inline-block;
  position: relative;
  white-space: pre;
}

.section-content :deep(.math-explanation) {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  display: inline-block;
  margin: 0.5rem 1rem;
}

.section-content :deep(.math-problem) {
  font-family: monospace;
  white-space: pre;
  margin: 1.5rem auto;
  padding: 1rem;
  text-align: right;
  width: 120px;
  font-size: 1.2rem;
}

.section-content :deep(.subtraction-line) {
  border-top: 1px solid #000;
  padding-top: 2px;
}

.section-content :deep(.math-expression) {
  font-family: monospace;
  text-align: center;
  margin: 1.5rem auto;
  font-size: 1.2rem;
}

.section-content :deep(.math-parenthetical) {
  font-size: 0.9rem;
  color: #555;
}

.section-content :deep(.number-sequence) {
  font-family: monospace;
  text-align: center;
  margin: 1.5rem auto;
  font-size: 1.2rem;
  letter-spacing: 0.5rem;
}

.section-content :deep(.exercise-row) {
  font-family: monospace;
  white-space: pre;
  margin: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  background-color: #f9f9f9;
  padding: 0.5rem;
  border-radius: 4px;
}

.section-content :deep(.math-problem-container) {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.section-content :deep(.math-vertical-problem) {
  font-family: monospace;
  font-size: 1.3rem;
  line-height: 1.5;
  white-space: pre;
  text-align: left;
  margin: 0;
}

.section-content :deep(.math-vertical-problem .problem-content) {
  position: relative;
}

.section-content :deep(.math-vertical-problem .top-row) {
  text-align: right;
  margin-bottom: 0.5rem;
}

.section-content :deep(.math-vertical-problem .bottom-row) {
  position: relative;
  text-align: right;
  margin-bottom: 0.2rem;
}

.section-content :deep(.math-vertical-problem .operation) {
  position: absolute;
  left: 0;
}

.section-content :deep(.math-vertical-problem .explanation-row) {
  text-align: right;
  margin-bottom: 0.5rem;
  white-space: nowrap;
}

.section-content :deep(.math-vertical-problem .operation-line) {
  height: 1px;
  background-color: #000;
}

.section-content :deep(.number-line) {
  margin-bottom: 0.25rem;
}

.section-content :deep(.operation-line) {
  margin-top: 0.25rem;
}

.page-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.nav-btn {
  border: none;
  cursor: pointer;
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

.section-content :deep(.book-paragraph) {
  margin: 1.5rem 0;
  text-indent: 2rem;
}

.section-content :deep(.book-heading) {
  font-size: 1.3rem;
  font-weight: bold;
  margin: 2rem 0 1rem;
  color: #333;
}

.section-content :deep(.biographical-sidebar) {
  background-color: #f2f2f2;
  border: 1px solid #ddd;
  padding: 1.5rem;
  margin: 2rem 0;
  font-family: Georgia, serif;
}

.section-content :deep(.biographical-sidebar) h3 {
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.section-content :deep(.biographical-sidebar) p:first-of-type::first-letter {
  float: left;
  font-size: 3.5rem;
  line-height: 0.8;
  padding-right: 0.2rem;
  padding-top: 0.1rem;
  color: #666;
}

.section-content :deep(.exercise-title-container) {
  text-align: center;
  margin: 2rem 0 1rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-content :deep(.exercise-title-line) {
  height: 1px;
  background-color: #333;
  flex: 1;
  max-width: 200px;
}

.section-content :deep(.exercise-title) {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin: 0 1rem;
  padding: 0;
  text-transform: none;
  letter-spacing: normal;
  font-family: Georgia, serif;
}

.section-content :deep(.exercise-problems) {
  font-family: monospace;
  white-space: pre;
  text-align: center;
  margin: 1.5rem auto;
  max-width: 700px;
  font-size: 1.1rem;
  line-height: 1.8;
}
</style> 