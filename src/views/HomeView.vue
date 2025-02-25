<script setup>
import { chapters } from '@/data/chapters'
</script>

<template>
  <div class="home-view">
    <div class="book-cover">
      <h1>Mental Math Trainer</h1>
      <div class="book-subtitle">Master the art of mental calculation</div>
    </div>

    <div class="book-intro">
      <p>
        Welcome to the Mental Math Trainer. This interactive book will help you develop 
        powerful mental calculation skills through step-by-step lessons and practice exercises.
      </p>
    </div>

    <div class="chapters-list">
      <h2>Table of Contents</h2>
      
      <div class="chapter" v-for="chapter in chapters" :key="chapter.id">
        <div class="chapter-info">
          <h3>Chapter {{ chapter.id }}: {{ chapter.title }}</h3>
          <p>{{ chapter.description }}</p>
        </div>
        <router-link :to="`/chapters/${chapter.id}`" class="read-btn">Read Chapter</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  margin: 0;
  padding: 0;
}

.book-cover {
  text-align: center;
  padding: 5% 2%;
  margin-bottom: 2rem;
  background-color: #2c3e50;
  color: white;
}

.book-cover h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: white;
}

.book-subtitle {
  font-size: 1.5rem;
  font-style: italic;
}

.book-intro {
  font-size: 1.2rem;
  line-height: 1.8;
  margin-bottom: 3rem;
  padding: 0 5%;
  text-align: center;
}

.chapters-list {
  background-color: white;
  padding: 3% 5%;
  border-top: 1px solid #eee;
}

.chapters-list h2 {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.chapter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 0;
  border-bottom: 1px solid #eee;
}

.chapter:last-child {
  border-bottom: none;
}

.chapter-info {
  flex: 1;
}

.chapter-info h3 {
  margin-bottom: 0.5rem;
}

.chapter-info p {
  color: #666;
}

.read-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #2c3e50;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s ease;
  margin-left: 1rem;
}

.read-btn:hover {
  background-color: #1e2b38;
}
</style>
