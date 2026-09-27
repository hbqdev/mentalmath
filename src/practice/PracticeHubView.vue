<script setup lang="ts">
import { computed } from 'vue'
import { useProgress } from '@/app/progress'
import { readableChapters } from '@/content/loader'
import { bookExercises } from '@/exercises/bookSets'
import { bookSetsFor, generatedSetsFor } from '@/exercises/registry'
import { createRng } from '@/exercises/rng'
import type { Difficulty } from '@/exercises/types'

const { bestScore, state } = useProgress()
const lastAttempt = (id: string) => state.value.practice[id]?.attempts.at(-1)

interface Technique {
  id: string
  chapterId: string
  title: string
  description: string
  sectionId: string
  generated?: string
  book?: { id: string; count: number }
}

/** One card per technique: a generated drill with the book set it covers, or a book-only set. */
const chapters = computed(() =>
  readableChapters()
    .map((c) => {
      const gens = generatedSetsFor(c.id)
      const covered = new Set(gens.flatMap((g) => g.coversBookSets ?? []))
      const techniques: Technique[] = gens.map((g) => {
        const bookId = g.coversBookSets?.[0]
        return {
          id: g.id,
          chapterId: c.id,
          title: g.title,
          description: g.description,
          sectionId: g.sectionId,
          generated: g.id,
          book: bookId ? { id: bookId, count: bookExercises(bookId).length } : undefined,
        }
      })
      for (const b of bookSetsFor(c.id)) {
        if (covered.has(b.id)) continue
        techniques.push({
          id: b.id,
          chapterId: c.id,
          title: b.title,
          description: 'Problems from the book.',
          sectionId: b.sectionId,
          book: { id: b.id, count: bookExercises(b.id).length },
        })
      }
      return { meta: c, techniques }
    })
    .filter((c) => c.techniques.length > 0),
)

const DIFFICULTIES: Array<Difficulty | 'mixed'> = ['mixed', 'easy', 'medium', 'hard']

/** A fresh seed per click so every Generate draws new numbers. */
function generateTo(t: Technique, difficulty: Difficulty | 'mixed' = 'mixed') {
  return {
    name: 'practice',
    params: { chapter: t.chapterId, set: t.generated! },
    query: { mode: 'generated', seed: String(createRng().seed), difficulty },
  }
}
</script>

<template>
  <div class="hub">
    <header class="head">
      <p class="kicker">Every technique in the book</p>
      <h1>Practice</h1>
      <p class="sub">
        Pick any technique and go: <strong>Generate</strong> draws ten fresh problems that follow
        the chapter's method, with worked steps after each answer; <strong>Book set</strong> replays
        the authors' own problems.
      </p>
    </header>

    <section
      v-for="c in chapters"
      :key="c.meta.id"
      class="chapter"
      :data-testid="`hub-chapter-${c.meta.id}`"
    >
      <h2>
        <span class="k">{{ c.meta.kicker }}</span>
        <RouterLink :to="{ name: 'read', params: { chapter: c.meta.id } }" class="t">{{
          c.meta.title
        }}</RouterLink>
      </h2>
      <ul class="grid">
        <li v-for="t in c.techniques" :key="t.id" class="card" :data-testid="`technique-${t.id}`">
          <div class="body">
            <strong class="title">{{ t.title }}</strong>
            <p class="desc">{{ t.description }}</p>
            <p v-if="bestScore(t.generated ?? t.book!.id) !== undefined" class="meta">
              Best {{ bestScore(t.generated ?? t.book!.id)
              }}<template v-if="lastAttempt(t.generated ?? t.book!.id)">
                · last {{ lastAttempt(t.generated ?? t.book!.id)!.correct }} /
                {{ lastAttempt(t.generated ?? t.book!.id)!.total }}</template
              >
            </p>
          </div>
          <div class="actions">
            <template v-if="t.generated">
              <RouterLink class="btn primary" data-testid="generate" :to="generateTo(t)"
                >Generate</RouterLink
              >
              <span class="levels" aria-label="Difficulty">
                <RouterLink
                  v-for="d in DIFFICULTIES.slice(1)"
                  :key="d"
                  class="lvl"
                  :to="generateTo(t, d)"
                  >{{ d }}</RouterLink
                >
              </span>
            </template>
            <RouterLink
              v-if="t.book"
              class="btn ghost"
              data-testid="book-set"
              :to="{
                name: 'practice',
                params: { chapter: t.chapterId, set: t.book.id },
                query: { mode: 'book' },
              }"
              >📖 Book set · {{ t.book.count }}</RouterLink
            >
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hub {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem var(--gutter) 5rem;
}
.head h1 {
  font-size: clamp(2rem, 4vw, 2.6rem);
  margin: 0.2rem 0 0.6rem;
}
.sub {
  color: var(--muted);
  max-width: 62ch;
  font-family: var(--font-sans);
}
.chapter {
  margin-top: 2.5rem;
}
.chapter h2 {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 1.15rem;
  margin: 0 0 0.75rem;
  font-family: var(--font-sans);
}
.chapter .k {
  white-space: nowrap;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}
.chapter .t {
  color: var(--ink);
}
.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}
.card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: var(--card);
  border: 1px solid var(--card-rule);
  border-radius: var(--radius);
  font-family: var(--font-sans);
}
.title {
  font-size: 1.02rem;
}
.desc {
  margin: 0.2rem 0 0;
  color: var(--muted);
  font-size: 0.88rem;
}
.meta {
  margin: 0.3rem 0 0;
  color: var(--muted);
  font-size: 0.8rem;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.btn {
  font-weight: 700;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius);
  border: 1px solid var(--accent);
  font-size: 0.9rem;
}
.btn.primary {
  background: var(--accent);
  color: var(--accent-ink);
}
.btn.ghost {
  color: var(--accent);
  background: transparent;
}
.btn:hover {
  text-decoration: none;
  filter: brightness(1.08);
}
.levels {
  display: inline-flex;
  gap: 0.15rem;
}
.lvl {
  font-size: 0.75rem;
  color: var(--muted);
  padding: 0.25rem 0.4rem;
  border-radius: 999px;
  border: 1px solid var(--rule);
  text-transform: capitalize;
}
.lvl:hover {
  color: var(--accent);
  border-color: var(--accent);
  text-decoration: none;
}
</style>
