<script setup>
import { chapters } from '@/data/chapters'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentChapterId = parseInt(route.params.chapterId)
</script>

<template>
  <div class="chapter-navigation">
    <div class="chapter-selector">
      <label for="chapter-select">Go to Chapter:</label>
      <select id="chapter-select" @change="$router.push(`/chapters/${$event.target.value}`)">
        <option value="" disabled selected>Select a chapter</option>
        <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
          Chapter {{ chapter.id }}: {{ chapter.title }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.chapter-navigation {
  margin: 1rem 0;
  display: flex;
  justify-content: center;
}

.chapter-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chapter-selector select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 0.9rem;
  cursor: pointer;
}

.chapter-selector select:focus {
  outline: none;
  border-color: #007bff;
}
</style> 