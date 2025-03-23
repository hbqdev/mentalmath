<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chapters } from '@/data/chapters'
import { getChapterPages, getImageUrl } from '@/utils/chapterLoader'
import ChapterNavigation from '@/components/ChapterNavigation.vue'

const route = useRoute()
const router = useRouter()

const chapterId = computed(() => parseInt(route.params.chapterId))
const chapter = ref(null)
const activePage = ref(1)
const chapterPages = ref([])

const isLoading = ref(true)

// Function to handle page selection
function goToPage(event) {
  const pageId = parseInt(event.target.value)
  setActivePage(pageId)
}

// Load chapter data and pages
async function loadChapter() {
  isLoading.value = true
  try {
    // Load chapter from the chapters array
    chapter.value = chapters.find((c) => c.id === chapterId.value)

    // Dynamically load pages for this chapter
    chapterPages.value = getChapterPages(chapterId.value)

    // Check sessionStorage for saved page number
    const savedPage = sessionStorage.getItem(`chapter${chapterId.value}Page`)

    // Initialize to the saved page if available, otherwise first page
    if (savedPage && parseInt(savedPage) > 0) {
      // Make sure the saved page exists in the current chapter
      const pageNumber = parseInt(savedPage)
      if (chapterPages.value.find((p) => p.id === pageNumber)) {
        activePage.value = pageNumber
      } else {
        // If page doesn't exist, default to first page
        activePage.value = chapterPages.value.length > 0 ? chapterPages.value[0].id : 1
      }
    } else {
      // No saved page, use first page
      activePage.value = chapterPages.value.length > 0 ? chapterPages.value[0].id : 1
    }
  } catch (error) {
    console.error('Error loading chapter:', error)
    chapter.value = null
    chapterPages.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for route changes to reset component state
watch(
  () => route.params.chapterId,
  () => {
    loadChapter()
  },
  { immediate: true },
)

onMounted(() => {
  loadChapter()
})

function setActivePage(pageId) {
  activePage.value = pageId
  // Save current page to session storage
  sessionStorage.setItem(`chapter${chapterId.value}Page`, pageId.toString())
}

function startExercise(exerciseType) {
  // No need to reset page state anymore
  nextTick(() => {
    router.push(`/exercises/${chapterId.value}/${exerciseType}`)
  })
}

// Go to previous page
function prevPage() {
  if (chapterPages.value.length > 0) {
    const currentIndex = chapterPages.value.findIndex((p) => p.id === activePage.value)
    if (currentIndex > 0) {
      setActivePage(chapterPages.value[currentIndex - 1].id)
    }
  }
}

// Go to next page
function nextPage() {
  if (chapterPages.value.length > 0) {
    const currentIndex = chapterPages.value.findIndex((p) => p.id === activePage.value)
    if (currentIndex < chapterPages.value.length - 1) {
      setActivePage(chapterPages.value[currentIndex + 1].id)
    }
  }
}

// Get the current page object
const currentPage = computed(() => {
  return chapterPages.value.find((p) => p.id === activePage.value)
})
</script>

<template>
  <div class="chapter-view">
    <div v-if="isLoading" class="loading">Loading chapter content...</div>

    <div v-else-if="!chapter" class="error">
      <h1>Chapter not found</h1>
      <p>Sorry, the requested chapter could not be found.</p>
      <router-link to="/" class="btn">Return to Home</router-link>
    </div>

    <div v-else class="chapter-content">
      <h1>Chapter {{ chapter.id }}: {{ chapter.title }}</h1>

      <!-- Add the chapter navigation component -->
      <ChapterNavigation />

      <!-- Page navigation controls -->
      <div class="page-navigation">
        <button
          @click="prevPage"
          :disabled="!chapterPages.length || activePage === chapterPages[0].id"
        >
          Previous Page
        </button>
        <select v-model="activePage" @change="goToPage">
          <option v-for="page in chapterPages" :key="page.id" :value="page.id">
            Page {{ page.id }}
          </option>
        </select>
        <button
          @click="nextPage"
          :disabled="
            !chapterPages.length || activePage === chapterPages[chapterPages.length - 1].id
          "
        >
          Next Page
        </button>
      </div>

      <!-- Display the current page image -->
      <div class="page-container">
        <img
          v-if="currentPage"
          :src="getImageUrl(currentPage.path)"
          :alt="`Chapter ${chapter.id} - Page ${activePage}`"
          class="chapter-page-image"
        />
        <p v-else class="no-pages">No pages found for this chapter.</p>
      </div>

      <!-- Exercise links if available -->
      <div v-if="chapter.exercises && chapter.exercises.types.length > 0" class="exercises-section">
        <h2>Practice Exercises</h2>
        <div class="exercise-links">
          <button
            v-for="exercise in chapter.exercises.types"
            :key="exercise.id"
            @click="startExercise(exercise.id)"
            class="exercise-link"
          >
            {{ exercise.title }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chapter-view {
  width: 100%;
  max-width: 100%;
  padding: 0 1rem;
}

.loading,
.error,
.no-pages {
  text-align: center;
  padding: 2rem;
}

.chapter-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 1rem 0;
}

.page-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.chapter-page-image {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.exercises-section {
  margin: 2rem 0;
  text-align: center;
}

.exercise-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.exercise-link {
  padding: 0.75rem 1.5rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.exercise-link:hover {
  background-color: #1a2533;
}

/* Responsive adjustments for larger screens */
@media (min-width: 1200px) {
  .chapter-page-image {
    max-height: 80vh;
  }
}
</style>
