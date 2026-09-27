<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { readableChapters } from '@/content/loader'

const chapters = readableChapters()
const { state, chapterCompletion, lastSection } = useProgress()

const resume = computed(() => {
  const entries = Object.entries(state.value.reading)
  if (entries.length === 0) return null
  const sorted = entries.sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))
  const [chapterId, entry] = sorted[0]!
  const meta = chapters.find((c) => c.id === chapterId)
  return meta ? { meta, section: entry.lastSection } : null
})

function pct(id: string, total: number) {
  return Math.round(chapterCompletion(id, total) * 100)
}
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="kicker">An interactive edition</p>
      <h1>Secrets of Mental Math</h1>
      <p class="sub">
        Read the book chapter by chapter, then practice every technique with the book's own
        problem sets and endless generated ones.
      </p>
      <RouterLink
        v-if="resume"
        class="resume"
        :to="{ name: 'read', params: { chapter: resume.meta.id, section: resume.section } }"
      >
        Resume · {{ resume.meta.kicker }} · {{ resume.meta.title }} ›
      </RouterLink>
    </section>

    <section class="toc">
      <h2 class="label">Contents</h2>
      <ol>
        <li v-for="c in chapters" :key="c.id">
          <RouterLink
            :to="{ name: 'read', params: { chapter: c.id, section: lastSection(c.id) } }"
            class="row"
          >
            <span class="k">{{ c.kicker }}</span>
            <span class="t">{{ c.title }}</span>
            <span class="p" :title="`${pct(c.id, c.sections.length)}% read`">
              <i :style="{ width: `${pct(c.id, c.sections.length)}%` }" />
            </span>
          </RouterLink>
        </li>
      </ol>
    </section>

    <p class="credit">
      Based on <em>Secrets of Mental Math</em> by Arthur Benjamin and Michael Shermer. Not
      affiliated with the authors or publisher. <RouterLink to="/about">About this app</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.home {
  max-width: 820px;
  margin: 0 auto;
  padding: 2.5rem var(--gutter) 4rem;
}
.hero h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  margin: 0.2rem 0 0.8rem;
}
.sub {
  color: var(--muted);
  max-width: 60ch;
}
.resume {
  display: inline-block;
  margin-top: 1rem;
  font-family: var(--font-sans);
  font-weight: 700;
  background: var(--accent);
  color: var(--accent-ink);
  padding: 0.6rem 1rem;
  border-radius: var(--radius);
}
.resume:hover {
  text-decoration: none;
  filter: brightness(1.08);
}
.toc {
  margin-top: 3rem;
}
ol {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
}
.row {
  display: grid;
  grid-template-columns: 7.5rem 1fr 6rem;
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--rule);
  color: var(--ink);
}
.row:hover {
  text-decoration: none;
  background: var(--surface);
}
.k {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--accent);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.t {
  font-family: var(--font-sans);
  font-weight: 600;
}
.p {
  height: 4px;
  background: var(--rule);
  border-radius: 2px;
  overflow: hidden;
}
.p i {
  display: block;
  height: 100%;
  background: var(--accent);
}
.credit {
  margin-top: 3rem;
  font-size: 0.85rem;
  color: var(--muted);
}
@media (max-width: 719px) {
  .row {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }
  .p {
    width: 6rem;
  }
}
</style>
