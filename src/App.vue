<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header>
      <div class="logo">
        <RouterLink to="/">Mental Math Trainer</RouterLink>
      </div>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer>
      <p>Mental Math Trainer &copy; {{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<style>
@import './assets/base.css';

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #f5f5f5;
  color: #333;
  font-family: 'Georgia', serif;
  line-height: 1.6;
  width: 100%;
  overflow-x: hidden;
  display: flex;
  justify-content: center;
}

.app-container {
  width: 1000px;
  background-color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #eee;
  width: 100%;
}

.logo a {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: #555;
  text-decoration: none;
  padding: 0.5rem;
  font-size: 1.1rem;
}

nav a:hover {
  color: #000;
}

nav a.router-link-active {
  font-weight: bold;
  color: #2c3e50;
  border-bottom: 2px solid #2c3e50;
}

main {
  flex: 1;
  width: 100%;
}

footer {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid #eee;
  color: #777;
  font-size: 0.9rem;
  width: 100%;
}

h1, h2, h3, h4 {
  font-family: 'Georgia', serif;
  color: #2c3e50;
}

button {
  cursor: pointer;
}
</style>
