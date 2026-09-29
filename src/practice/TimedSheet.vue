<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  SHOTS,
  SPRINTS,
  describeTimed,
  type ShotSeconds,
  type SprintSeconds,
  type TimedOptions,
} from './timing'

const props = defineProps<{ title?: string; initial?: TimedOptions }>()
const emit = defineEmits<{ start: [opts: TimedOptions]; close: [] }>()

const sprint = ref<SprintSeconds | undefined>(props.initial?.sprint)
const shot = ref<ShotSeconds>(props.initial?.shot ?? 0)
const opts = computed<TimedOptions>(() => ({ sprint: sprint.value, shot: shot.value }))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="scrim" data-testid="timed-sheet" @click.self="emit('close')">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="timed-title">
      <header>
        <p class="kicker">Timed drill</p>
        <h2 id="timed-title">{{ title ?? 'Against the clock' }}</h2>
        <button
          type="button"
          class="close"
          aria-label="Close"
          data-testid="timed-close"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <p class="label">Length</p>
      <div class="seg" role="group" aria-label="Length">
        <button
          type="button"
          class="opt"
          :class="{ on: sprint === undefined }"
          :aria-pressed="sprint === undefined"
          data-testid="len-10"
          @click="sprint = undefined"
        >
          10 problems
        </button>
        <button
          v-for="s in SPRINTS"
          :key="s"
          type="button"
          class="opt"
          :class="{ on: sprint === s }"
          :aria-pressed="sprint === s"
          :data-testid="`len-${s}`"
          @click="sprint = s"
        >
          {{ s / 60 }} min
        </button>
      </div>
      <p class="hint">A sprint keeps the problems coming until the clock runs out.</p>

      <p class="label">Per problem</p>
      <div class="seg" role="group" aria-label="Shot clock">
        <button
          v-for="s in SHOTS"
          :key="s"
          type="button"
          class="opt"
          :class="{ on: shot === s }"
          :aria-pressed="shot === s"
          :data-testid="`shot-${s}`"
          @click="shot = s"
        >
          {{ s === 0 ? 'No limit' : `${s} s` }}
        </button>
      </div>
      <p class="hint">When the shot clock runs out the problem counts as wrong.</p>

      <footer>
        <span class="summary" data-testid="timed-summary">{{ describeTimed(opts) }}</span>
        <button type="button" class="start" data-testid="timed-start" @click="emit('start', opts)">
          Start ›
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
@media (min-width: 720px) {
  .scrim {
    align-items: center;
  }
}
.sheet {
  width: min(100%, 30rem);
  background: var(--surface);
  color: var(--ink);
  border-radius: 16px 16px 0 0;
  padding: 1rem var(--gutter) calc(1rem + env(safe-area-inset-bottom, 0px));
  font-family: var(--font-sans);
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.2);
}
@media (min-width: 720px) {
  .sheet {
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
  }
}
header {
  position: relative;
  margin-bottom: 0.75rem;
}
h2 {
  font-size: 1.2rem;
  margin: 0.1rem 0 0;
  padding-right: 2.5rem;
}
.close {
  position: absolute;
  right: 0;
  top: 0;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--rule);
  background: none;
  color: var(--muted);
}
.label {
  margin: 0.9rem 0 0.35rem;
}
.seg {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.opt {
  min-height: 44px;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--rule);
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.95rem;
}
.opt.on {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
  font-weight: 700;
}
.hint {
  margin: 0.4rem 0 0;
  font-size: 0.85rem;
  color: var(--muted);
}
footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.25rem;
}
.summary {
  color: var(--muted);
  font-size: 0.9rem;
}
.start {
  min-height: 48px;
  padding: 0 1.4rem;
  border-radius: 12px;
  border: 0;
  background: var(--accent);
  color: var(--accent-ink);
  font: inherit;
  font-weight: 700;
  font-size: 1.05rem;
}
</style>
