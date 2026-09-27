<script setup lang="ts">
import { computed } from 'vue'
import { dateText } from '@/exercises/format'
import type { Prompt } from '@/exercises/types'
import BinaryPrompt from './prompts/BinaryPrompt.vue'
import ColumnsPrompt from './prompts/ColumnsPrompt.vue'
import FractionGlyph from './prompts/FractionGlyph.vue'

const props = defineProps<{ prompt: Prompt }>()

const money = (n: number) => (Number.isInteger(n) ? String(n) : `$${n.toFixed(2)}`)
const textParts = computed(() => {
  if (props.prompt.kind !== 'text' || !props.prompt.emphasis) return null
  const { text, emphasis } = props.prompt
  const i = text.indexOf(emphasis)
  if (i < 0) return null
  return { before: text.slice(0, i), em: emphasis, after: text.slice(i + emphasis.length) }
})
</script>

<template>
  <div class="prompt" data-testid="practice-prompt">
    <BinaryPrompt v-if="prompt.kind === 'binary'" :prompt="prompt" />
    <ColumnsPrompt v-else-if="prompt.kind === 'columns'" :prompt="prompt" />

    <div v-else-if="prompt.kind === 'power'" class="big">
      {{ prompt.base }}<sup>{{ prompt.exp }}</sup>
    </div>

    <div v-else-if="prompt.kind === 'root'" class="big root">
      <span class="radical">{{ prompt.degree === 2 ? '√' : '∛' }}</span><span class="radicand">{{ prompt.radicand }}</span>
    </div>

    <div v-else-if="prompt.kind === 'fraction-binary'" class="big">
      <FractionGlyph :value="prompt.a" /> <span class="op">{{ prompt.op === '-' ? '−' : prompt.op }}</span> <FractionGlyph :value="prompt.b" />
    </div>

    <div v-else-if="prompt.kind === 'fraction-task'" class="task">
      <p class="lead">
        {{ prompt.task === 'simplify' ? 'Simplify' : prompt.task === 'rewrite' ? `Write with denominator ${prompt.den}` : 'As a decimal' }}
      </p>
      <div class="big"><FractionGlyph :value="prompt.value" /></div>
    </div>

    <div v-else-if="prompt.kind === 'percent'" class="big">
      {{ prompt.percent }}% <span class="op small">of</span> {{ money(prompt.of) }}
    </div>

    <div v-else-if="prompt.kind === 'divisible'" class="task">
      <p class="lead">Is</p>
      <div class="big">{{ prompt.n.toLocaleString('en-US') }}</div>
      <p class="lead">divisible by <strong>{{ prompt.by }}</strong>?</p>
    </div>

    <div v-else-if="prompt.kind === 'date'" class="task">
      <p class="lead">What day of the week was</p>
      <div class="big date">{{ dateText(prompt.iso) }}</div>
    </div>

    <div v-else class="task text">
      <p v-if="textParts" class="lead">
        {{ textParts.before }}<strong class="em">{{ textParts.em }}</strong>{{ textParts.after }}
      </p>
      <p v-else class="lead">{{ prompt.text }}</p>
    </div>
  </div>
</template>

<style scoped>
.prompt {
  display: flex;
  justify-content: center;
  text-align: center;
  padding: 1.5rem 0 1rem;
  color: var(--ink);
}
.big {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: clamp(2rem, 6vw, 3rem);
  line-height: 1.2;
}
.big sup {
  font-size: 0.55em;
  vertical-align: super;
  margin-left: 0.05em;
}
.op {
  color: var(--accent);
  margin: 0 0.25em;
}
.op.small {
  font-size: 0.6em;
  font-family: var(--font-sans);
}
.root .radical {
  margin-right: 0.05em;
}
.root .radicand {
  border-top: 3px solid currentColor;
  padding: 0 0.15em;
}
.task {
  display: grid;
  gap: 0.5rem;
  justify-items: center;
}
.lead {
  font-family: var(--font-sans);
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  margin: 0;
  max-width: 34ch;
}
.date {
  font-family: var(--font-sans);
  font-size: clamp(1.6rem, 4vw, 2.4rem);
}
.text .em {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 1.3em;
}
</style>
