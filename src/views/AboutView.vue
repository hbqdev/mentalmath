<script setup lang="ts"></script>

<template>
  <div class="about-view">
    <p class="kicker">About</p>
    <h1>Mental Math Trainer</h1>

    <div class="about-content">
      <div class="book-reference">
        <img src="/book-cover.jpg" alt="Secrets of Mental Math book cover" class="book-cover" />
        <div class="book-info">
          <h2>Based on “Secrets of Mental Math”</h2>
          <p>
            This application is an interactive edition of the techniques described in
            <a
              href="https://www.amazon.com/Secrets-Mental-Math-Mathemagicians-Calculation/dp/0307338401"
              target="_blank"
              rel="noopener"
              >Secrets of Mental Math: The Mathemagician's Guide to Lightning Calculation and
              Amazing Math Tricks</a
            >
            by Arthur Benjamin and Michael Shermer.
          </p>
        </div>
      </div>

      <div class="panel">
        <h2>Practice Mental Math on the Go</h2>
        <p>
          Mental Math Trainer helps you develop powerful mental calculation skills through the
          book's own chapters and practice exercises. The application follows the calculation
          methods described in the book, allowing you to perform impressive calculations in your
          head without paper, pencil, or calculator.
        </p>
        <p>With regular practice using this app, you'll be able to:</p>
        <ul>
          <li>Do calculations with multi-digit numbers in your head</li>
          <li>Perform calculations faster than people using calculators</li>
          <li>Impress friends and colleagues with your mental math abilities</li>
          <li>Develop greater confidence with numbers in everyday situations</li>
        </ul>
      </div>

      <div class="panel">
        <h2>How to Use This Application</h2>
        <p>
          Start by reading through the chapters to learn the mental math techniques. Each chapter
          introduces specific methods for different types of calculations. After studying a
          technique, use the practice exercises to reinforce your skills.
        </p>
        <p>
          Regular practice is the key to developing mental math proficiency. Ten to fifteen minutes
          a day is a good rhythm.
        </p>
      </div>
    </div>

    <div class="disclaimer">
      <p>
        This application is not affiliated with or endorsed by the authors or publishers of "Secrets
        of Mental Math." It is created as an educational tool to help people practice mental
        calculation techniques.
      </p>
    </div>
  </div>
</template>

<style scoped>
.about-view {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 2rem var(--gutter) 4rem;
}
h1 {
  font-size: 2rem;
  margin: 0.2rem 0 1.5rem;
}
h2 {
  font-size: 1.1rem;
  margin-bottom: 0.6rem;
}
.about-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.book-reference {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}
.book-cover {
  width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.book-info {
  flex: 1;
}
.panel {
  padding: 1.25rem;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}
ul {
  margin: 0.5rem 0 0 1.25rem;
}
li {
  margin-bottom: 0.3rem;
}
.disclaimer {
  margin-top: 2.5rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: var(--radius);
  font-size: 0.9rem;
  color: var(--muted);
  text-align: center;
}
@media (max-width: 719px) {
  .book-reference {
    flex-direction: column;
    text-align: center;
  }
}
</style>
