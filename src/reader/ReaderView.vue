<script setup lang="ts">
import { useBreakpoints, useIntersectionObserver } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProgress } from '@/app/progress'
import { getChapterMeta, loadChapter, neighbours, readableChapters } from '@/content/loader'
import type { ChapterDoc } from '@/content/types'
import { allSetsFor } from '@/exercises/registry'
import BottomSheet from './BottomSheet.vue'
import ChapterOutline from './ChapterOutline.vue'
import ContentBlocks from './ContentBlocks.vue'
import PracticeRail from './PracticeRail.vue'
import SectionPill from './SectionPill.vue'

const route = useRoute()
const router = useRouter()
const { state, markVisited, isVisited } = useProgress()

const chapterId = computed(() => String(route.params.chapter ?? ''))
const doc = ref<ChapterDoc | null>(null)
const status = ref<'loading' | 'ready' | 'missing'>('loading')
const activeId = ref('')
const sheetOpen = ref(false)

const bp = useBreakpoints({ tablet: 720, desktop: 1024 })
const isPhone = bp.smaller('tablet')
const isDesktop = bp.greaterOrEqual('desktop')
const focus = computed(() => state.value.settings.focus)

const meta = computed(() => getChapterMeta(chapterId.value))
const sections = computed(() => doc.value?.sections ?? [])
const visited = computed(() => new Set(state.value.reading[chapterId.value]?.visited ?? []))
const activeIndex = computed(() =>
  Math.max(
    0,
    sections.value.findIndex((s) => s.id === activeId.value),
  ),
)
const practiceSets = computed(() => allSetsFor(chapterId.value))
const nav = computed(() => neighbours(chapterId.value))
const allChapters = readableChapters()

// Section tracking: the section nearest the top of the viewport is active;
// a section becomes visited after 2 seconds of visibility.
const sectionEls = ref<Record<string, HTMLElement>>({})
const stops: Array<() => void> = []
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function setSectionEl(id: string, el: unknown) {
  if (el instanceof HTMLElement) sectionEls.value[id] = el
}

function clearObservers() {
  stops.splice(0).forEach((s) => s())
  timers.forEach((t) => clearTimeout(t))
  timers.clear()
}

/** How long a section stays on screen before it counts as read. */
const DWELL_MS = 700
const HEADER_PX = 52

function observeSections() {
  clearObservers()
  if (typeof IntersectionObserver === 'undefined') return
  const cid = chapterId.value
  for (const [id, el] of Object.entries(sectionEls.value)) {
    const { stop } = useIntersectionObserver(
      el,
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          if (
            entry.intersectionRatio > 0.15 ||
            entry.boundingClientRect.top < window.innerHeight / 3
          ) {
            activeId.value = id
          }
          // On screen for a moment counts as read.
          if (!isVisited(cid, id) && !timers.has(id)) {
            timers.set(
              id,
              setTimeout(() => {
                markVisited(cid, id)
                timers.delete(id)
              }, DWELL_MS),
            )
          }
        } else {
          const t = timers.get(id)
          if (t) {
            clearTimeout(t)
            timers.delete(id)
          }
          // Scrolled past the top: a short section that never dwelled long enough still counts as read.
          if (!isVisited(cid, id) && entry.boundingClientRect.bottom < HEADER_PX)
            markVisited(cid, id)
        }
      },
      { threshold: [0, 0.15, 0.5], rootMargin: '-52px 0px -40% 0px' },
    )
    stops.push(stop)
  }
}

onBeforeUnmount(clearObservers)

// Each navigation bumps the sequence; a load that finishes after a newer one started is ignored.
let loadSeq = 0

async function load() {
  const my = ++loadSeq
  clearObservers()
  status.value = 'loading'
  doc.value = null
  sectionEls.value = {}
  try {
    const d = await loadChapter(chapterId.value)
    if (my !== loadSeq) return
    doc.value = d
    status.value = 'ready'
    const wanted = String(route.params.section ?? '')
    const known = wanted && d.sections.some((s) => s.id === wanted)
    const target =
      (known ? wanted : undefined) ??
      state.value.reading[d.id]?.lastSection ??
      d.sections[0]?.id ??
      ''
    activeId.value = target
    await nextTick()
    if (my !== loadSeq) return
    observeSections()
    if (target && target !== d.sections[0]?.id) scrollToSection(target, 'auto', false)
    if (wanted && !known) router.replace({ name: 'read', params: { chapter: d.id } })
  } catch {
    if (my === loadSeq) status.value = 'missing'
  }
}

watch(chapterId, load, { immediate: true })

function scrollToSection(id: string, behavior: ScrollBehavior = 'smooth', updateUrl = true) {
  const el = sectionEls.value[id]
  if (!el) return
  activeId.value = id
  el.scrollIntoView?.({ behavior, block: 'start' })
  if (updateUrl) router.replace({ name: 'read', params: { chapter: chapterId.value, section: id } })
}

function step(delta: number) {
  const s = sections.value[activeIndex.value + delta]
  if (s) scrollToSection(s.id)
}

function goChapter(e: Event) {
  const id = (e.target as HTMLSelectElement).value
  router.push({ name: 'read', params: { chapter: id } })
}

function selectFromSheet(id: string) {
  sheetOpen.value = false
  scrollToSection(id)
}
</script>

<template>
  <div class="reader" :class="{ focus, phone: isPhone }">
    <Teleport to="#shell-center" defer>
      <label v-if="meta" class="switcher">
        <span class="sr">Chapter</span>
        <select :value="chapterId" @change="goChapter">
          <option v-for="c in allChapters" :key="c.id" :value="c.id">
            {{ c.kicker }} · {{ c.title }}
          </option>
        </select>
      </label>
    </Teleport>

    <div v-if="status === 'loading'" class="state">Loading…</div>

    <section v-else-if="status === 'missing'" class="state">
      <p class="kicker">Not found</p>
      <h1>That chapter is not in this book.</h1>
      <RouterLink to="/">Back to the table of contents</RouterLink>
    </section>

    <div v-else-if="doc" class="grid">
      <aside v-if="isDesktop && !focus" class="col-outline">
        <ChapterOutline
          :chapter-id="doc.id"
          :sections="meta?.sections ?? []"
          :active-id="activeId"
          :visited="visited"
          @select="scrollToSection"
        />
        <div class="chapter-nav">
          <RouterLink v-if="nav.prev" :to="{ name: 'read', params: { chapter: nav.prev.id } }"
            >‹ {{ nav.prev.kicker }}</RouterLink
          >
          <RouterLink v-if="nav.next" :to="{ name: 'read', params: { chapter: nav.next.id } }"
            >{{ nav.next.kicker }} ›</RouterLink
          >
        </div>
      </aside>

      <article class="col-text">
        <button
          v-if="focus"
          type="button"
          class="exit-focus"
          data-testid="exit-focus"
          @click="state.settings.focus = false"
        >
          Exit focus · show outline and practice
        </button>
        <header class="chapter-head">
          <p class="kicker">{{ doc.kicker }}</p>
          <h1>{{ doc.title }}</h1>
        </header>
        <section
          v-for="s in sections"
          :id="s.id"
          :key="s.id"
          :ref="(el) => setSectionEl(s.id, el)"
          class="book-section"
        >
          <h2 v-if="s.id !== 'overview'">{{ s.title }}</h2>
          <ContentBlocks :blocks="s.blocks" :chapter-id="doc.id" :section-id="s.id" />
        </section>
        <footer class="chapter-foot">
          <RouterLink
            v-if="nav.next"
            class="next"
            :to="{ name: 'read', params: { chapter: nav.next.id } }"
            >Next: {{ nav.next.kicker }} · {{ nav.next.title }} ›</RouterLink
          >
        </footer>
      </article>

      <aside v-if="!isPhone && !focus" class="col-rail">
        <PracticeRail :chapter-id="doc.id" />
      </aside>
    </div>

    <template v-if="!isDesktop && doc">
      <SectionPill
        :index="activeIndex"
        :total="sections.length"
        :practice-count="practiceSets.length"
        @prev="step(-1)"
        @next="step(1)"
        @practice="sheetOpen = true"
      />
      <BottomSheet :open="sheetOpen" title="Practice" @close="sheetOpen = false">
        <PracticeRail :chapter-id="doc.id" />
        <hr />
        <ChapterOutline
          :chapter-id="doc.id"
          :sections="meta?.sections ?? []"
          :active-id="activeId"
          :visited="visited"
          @select="selectFromSheet"
        />
      </BottomSheet>
    </template>
  </div>
</template>

<style scoped>
.reader {
  padding: 0 var(--gutter) 6rem;
}
.state {
  max-width: var(--measure);
  margin: 3rem auto;
}
.state h1 {
  font-size: 1.6rem;
  margin: 0.25rem 0 1rem;
}
.switcher {
  display: block;
  width: 100%;
}
.switcher select {
  width: 100%;
  max-width: 100%;
  text-overflow: ellipsis;
  font: inherit;
  font-size: 0.85rem;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
}
@media (min-width: 720px) {
  .grid {
    grid-template-columns: minmax(0, 1fr) var(--rail-w);
  }
}
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: var(--outline-w) minmax(0, 1fr) var(--rail-w);
  }
}
.reader.focus .grid {
  grid-template-columns: minmax(0, 1fr);
  max-width: calc(var(--measure) + 2 * var(--gutter));
}

.col-outline,
.col-rail {
  position: sticky;
  top: 68px;
  align-self: start;
  max-height: calc(100dvh - 84px);
  overflow: auto;
  padding-top: 1.5rem;
}
.col-outline {
  border-right: 1px solid var(--rule);
  padding-right: 1rem;
}
.col-rail {
  border-left: 1px solid var(--rule);
  padding-left: 1rem;
}
.chapter-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  font-family: var(--font-sans);
  font-size: 0.8rem;
}

.exit-focus {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  color: var(--muted);
  background: var(--card);
  border: 1px solid var(--card-rule);
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  margin: 1.5rem 0 -0.5rem;
}
.exit-focus:hover {
  color: var(--accent);
  border-color: var(--accent);
}
.col-text {
  max-width: var(--measure);
  padding-top: 1.5rem;
  justify-self: center;
  width: 100%;
  min-width: 0;
}
.chapter-head h1 {
  font-size: clamp(1.6rem, 2.6vw, 2.2rem);
  margin: 0.2rem 0 1.5rem;
}
.book-section {
  scroll-margin-top: 70px;
  padding-bottom: 1rem;
}
.book-section h2 {
  font-size: 1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 2em 0 0.8em;
}
.chapter-foot {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--rule);
  font-family: var(--font-sans);
}
</style>
