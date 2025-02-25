<template>
  <div class="about-view">
    <h1>About Mental Math Trainer</h1>
    
    <div class="about-content">
      <div class="book-reference">
        <img src="/book-cover.jpg" alt="Secrets of Mental Math book cover" class="book-cover">
        <div class="book-info">
          <h2>Based on "Secrets of Mental Math"</h2>
          <p>This application is an implementation of the techniques described in <a href="https://www.amazon.com/Secrets-Mental-Math-Mathemagicians-Calculation/dp/0307338401" target="_blank">Secrets of Mental Math: The Mathemagician's Guide to Lightning Calculation and Amazing Math Tricks</a> by Arthur Benjamin and Michael Shermer.</p>
        </div>
      </div>
      
      <div class="app-description">
        <h2>Practice Mental Math on the Go</h2>
        <p>Mental Math Trainer helps you develop powerful mental calculation skills through interactive lessons and practice exercises. The application follows the left-to-right calculation methods described in the book, allowing you to perform impressive calculations in your head without the need for paper, pencil, or calculator.</p>
        
        <p>With regular practice using this app, you'll be able to:</p>
        <ul>
          <li>Add and subtract multi-digit numbers in your head</li>
          <li>Perform calculations faster than people using calculators</li>
          <li>Impress friends and colleagues with your mental math abilities</li>
          <li>Develop greater confidence with numbers in everyday situations</li>
        </ul>
        
        <p>The techniques taught in this application are the same ones used by "mathemagicians" to perform seemingly impossible calculations at amazing speeds.</p>
      </div>
      
      <div class="how-to-use">
        <h2>How to Use This Application</h2>
        <p>Start by reading through the chapters to learn the mental math techniques. Each chapter introduces specific methods for different types of calculations. After studying a technique, use the practice exercises to reinforce your skills.</p>
        
        <p>Regular practice is the key to developing mental math proficiency. We recommend spending at least 10-15 minutes per day practicing these techniques.</p>
      </div>
    </div>
    
    <div class="disclaimer">
      <p>This application is not affiliated with or endorsed by the authors or publishers of "Secrets of Mental Math." It is created as an educational tool to help people practice mental calculation techniques.</p>
    </div>
  </div>
</template>

<style scoped>
.about-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.book-reference {
  display: flex;
  gap: 2rem;
  align-items: center;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.book-cover {
  width: 150px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.book-info {
  flex: 1;
}

.book-info h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.book-info a {
  color: #3498db;
  text-decoration: none;
}

.book-info a:hover {
  text-decoration: underline;
}

.app-description, .how-to-use {
  background-color: white;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
}

h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

ul {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

.disclaimer {
  margin-top: 3rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #6c757d;
  text-align: center;
}
</style>
