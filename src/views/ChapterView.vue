<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapters } from '@/data/chapters'
import ChapterNavigation from '@/components/ChapterNavigation.vue'
import { ContentLoader } from '@/content/ContentLoader'

const route = useRoute()
const router = useRouter()

const chapterId = computed(() => parseInt(route.params.chapterId))
const chapter = ref(null)
const activeSection = ref(null)
const contentLoader = new ContentLoader()
const isLoading = ref(true)

// Add a function to handle direct page navigation
function goToPage(event) {
  const sectionId = event.target.value
  setActiveSection(sectionId)
}

// Load chapter from docx file
async function loadChapterFromFile() {
  isLoading.value = true
  try {
    // Only load chapter0.docx for now since that's what we have
    if (chapterId.value === 0) {
      const fileUrl = '/chapter0.docx' // Assuming the file is in the public folder
      const response = await fetch(fileUrl)
      const fileBlob = await response.blob()

      // Load the document using ContentLoader
      const chapters = await contentLoader.loadDocument(fileBlob, 'docx')

      // Set the current chapter
      chapter.value = chapters.find(c => c.id === chapterId.value) ||
                      chapters[0] // Default to first chapter if ID not found

      // If no chapters were found, revert to original method
      if (!chapter.value) {
        chapter.value = chapters.find(c => c.id === chapterId.value)
      }

      // Initialize the active section
      if (chapter.value && chapter.value.sections.length > 0) {
        activeSection.value = chapter.value.sections[0].id
      }
    } else {
      // Fallback to existing JSON data for other chapters
      chapter.value = chapters.find(c => c.id === chapterId.value)
      if (chapter.value && chapter.value.sections.length > 0) {
        activeSection.value = chapter.value.sections[0].id
      }
    }
  } catch (error) {
    console.error('Error loading chapter from file:', error)
    // Fallback to existing JSON data
    chapter.value = chapters.find(c => c.id === chapterId.value)
    if (chapter.value && chapter.value.sections.length > 0) {
      activeSection.value = chapter.value.sections[0].id
    }
  } finally {
    isLoading.value = false

    // Initialize MathJax after content is loaded
    nextTick(() => {
      if (window.MathJax) {
        window.MathJax.typesetPromise()
      }
    })
  }
}

// Watch for route changes to reset component state
watch(() => route.params.chapterId, () => {
  loadChapterFromFile()
}, { immediate: true })

onMounted(() => {
  loadChapterFromFile()
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
  // Reset state before navigation
  activeSection.value = null
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

  // Format multiplication tables
  formattedContent = formattedContent.replace(
    /<!-- math:table-start -->([\s\S]*?)<!-- math:table-end -->/g,
    (match, p1) => {
      // Convert the table text to HTML table
      const rows = p1.trim().split('\n');
      let tableHtml = '<div class="math-table-container"><table class="math-table">';

      // Process header row
      const headerRow = rows[0].split('\t');
      tableHtml += '<tr>';

      // Special handling for the first header which spans multiple columns
      if (headerRow[0].includes('Numbers that add to')) {
        tableHtml += `<th colspan="2">${headerRow[0]}</th>`;

        // Add remaining headers
        for (let i = 1; i < headerRow.length; i++) {
          if (headerRow[i].trim()) {
            tableHtml += `<th>${headerRow[i].trim()}</th>`;
          }
        }
      } else {
        // Standard header processing
        headerRow.forEach(cell => {
          tableHtml += `<th>${cell.trim()}</th>`;
        });
      }
      tableHtml += '</tr>';

      // Add subheader row if it exists (for "from 10" and "from 100")
      if (rows.length > 1 && rows[1].includes('from')) {
        const subheaderRow = rows[1].split('\t');
        tableHtml += '<tr>';

        // Add empty cells for the first two columns
        tableHtml += '<th></th><th></th>';

        // Add remaining subheaders
        for (let i = 2; i < subheaderRow.length; i++) {
          tableHtml += `<th>${subheaderRow[i].trim()}</th>`;
        }
        tableHtml += '</tr>';

        // Process data rows
        for (let i = 2; i < rows.length; i++) {
          const cells = rows[i].split('\t');
          tableHtml += '<tr>';
          cells.forEach(cell => {
            tableHtml += `<td>${cell.trim()}</td>`;
          });
          tableHtml += '</tr>';
        }
      } else {
        // Process data rows without subheader
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].split('\t');
          tableHtml += '<tr>';
          cells.forEach(cell => {
            tableHtml += `<td>${cell.trim()}</td>`;
          });
          tableHtml += '</tr>';
        }
      }

      tableHtml += '</table></div>';
      return tableHtml;
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

  // Format math diagrams with arrows
  formattedContent = formattedContent.replace(
    /<!-- math:diagram-arrows-start -->([\s\S]*?)<!-- math:diagram-arrows-end -->/g,
    (match, p1) => {
      // Parse the diagram data
      const lines = p1.trim().split('\n');
      const diagramData = {};

      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          diagramData[key.trim()] = value.trim();
        }
      });

      // Extract values with defaults if missing
      const baseValue = diagramData.base || '13²';

      let topOffset = '+3';
      let topValue = '16';
      if (diagramData.top_offset) {
        const parts = diagramData.top_offset.split(',');
        topOffset = parts[0];
        topValue = parts[1];
      }

      let bottomOffset = '-3';
      let bottomValue = '10';
      if (diagramData.bottom_offset) {
        const parts = diagramData.bottom_offset.split(',');
        bottomOffset = parts[0];
        bottomValue = parts[1];
      }

      const resultValue = diagramData.result || '160 + 3² = 169';

      // Create the SVG with the parsed values
      return `<div class="math-diagram-arrows">
        <svg viewBox="0 0 500 100" class="diagram-svg">
          <!-- Base value -->
          <text x="70" y="50" class="diagram-text">${baseValue}</text>

          <!-- Top arrow -->
          <text x="120" y="30" class="diagram-label">${topOffset}</text>
          <line x1="95" y1="45" x2="170" y2="30" class="diagram-arrow" />
          <polygon points="170,30 160,27 162,35" class="diagram-arrowhead" />

          <!-- Top value -->
          <text x="190" y="30" class="diagram-text">${topValue}</text>

          <!-- Arrow from top value to result -->
          <line x1="205" y1="35" x2="280" y2="45" class="diagram-arrow" />
          <polygon points="280,45 270,42 272,50" class="diagram-arrowhead" />

          <!-- Bottom arrow -->
          <text x="120" y="70" class="diagram-label">${bottomOffset}</text>
          <line x1="95" y1="55" x2="170" y2="70" class="diagram-arrow" />
          <polygon points="170,70 160,73 162,65" class="diagram-arrowhead" />

          <!-- Bottom value -->
          <text x="190" y="70" class="diagram-text">${bottomValue}</text>

          <!-- Arrow from bottom value to result -->
          <line x1="205" y1="65" x2="280" y2="55" class="diagram-arrow" />
          <polygon points="280,55 270,58 272,50" class="diagram-arrowhead" />

          <!-- Result -->
          <text x="370" y="50" class="diagram-text">${resultValue}</text>
        </svg>
      </div>`;
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
  // Clean up resources
  activeSection.value = null

  // Remove any MathJax elements that might be causing issues
  const mathJaxElements = document.querySelectorAll('.MathJax, .MathJax_Display')
  mathJaxElements.forEach(el => el.remove())
})
</script>

<template>
  <div class="chapter-view">
    <div v-if="isLoading" class="loading">
      <p>Loading chapter content...</p>
    </div>

    <div v-else-if="!chapter" class="error-message">
      <p>Chapter not found. Please select a valid chapter.</p>
      <router-link to="/" class="return-home">Return to Home</router-link>
    </div>

    <div v-else class="chapter-content">
      <h1>Chapter {{ chapter.id }}: {{ chapter.title }}</h1>

      <!-- Add the chapter navigation component -->
      <ChapterNavigation />

      <div class="book-container">
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

              <!-- Add page selector dropdown -->
              <div class="page-selector">
                <select :value="activeSection" @change="goToPage($event)">
                  <option
                    v-for="section in chapter.sections"
                    :key="section.id"
                    :value="section.id"
                  >
                    {{ section.title }}
                  </option>
                </select>
              </div>

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
    </div>
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

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error-message {
  text-align: center;
  padding: 2rem;
}

.return-home {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
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

.section-content :deep(.math-table-container) {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  overflow-x: auto;
}

.section-content :deep(.math-table) {
  border-collapse: collapse;
  font-family: monospace;
  font-size: 1.1rem;
}

.section-content :deep(.math-table td) {
  border: 1px solid #ddd;
  padding: 0.5rem 0.8rem;
  text-align: center;
}

.section-content :deep(.math-table tr:first-child) {
  background-color: #f2f2f2;
  font-weight: bold;
}

.section-content :deep(.math-table tr td:first-child) {
  background-color: #f2f2f2;
  font-weight: bold;
}

.section-content :deep(.math-diagram-arrows) {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.section-content :deep(.diagram-svg) {
  width: 100%;
  max-width: 500px;
  height: auto;
}

.section-content :deep(.diagram-text) {
  font-family: Georgia, serif;
  font-size: 18px;
  font-weight: bold;
  text-anchor: middle;
  dominant-baseline: middle;
}

.section-content :deep(.diagram-label) {
  font-family: Georgia, serif;
  font-size: 16px;
  text-anchor: middle;
  dominant-baseline: middle;
}

.section-content :deep(.diagram-arrow) {
  stroke: #000;
  stroke-width: 2;
  fill: none;
}

.section-content :deep(.diagram-arrowhead) {
  fill: #000;
}

/* Add styles for the page selector */
.page-selector {
  margin: 0 1rem;
}

.page-selector select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 0.9rem;
  cursor: pointer;
}

.page-selector select:focus {
  outline: none;
  border-color: #007bff;
}
</style>
