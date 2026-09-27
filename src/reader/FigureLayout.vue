<script setup lang="ts">
import type { FigureSpec } from '@/content/figures/types'
defineProps<{ spec: FigureSpec }>()
</script>

<template>
  <!-- column: label | op | value | note -->
  <div v-if="spec.kind === 'column'" class="fl column" role="math">
    <template v-for="(line, i) in spec.lines" :key="i">
      <span class="label">{{ line.label ?? '' }}</span>
      <span class="op" :class="{ rule: line.rule }">{{ line.op ?? '' }}</span>
      <span class="value" :class="{ rule: line.rule }">{{ line.value }}</span>
      <span class="note">{{ line.note ?? '' }}</span>
    </template>
  </div>

  <div v-else-if="spec.kind === 'chain'" class="fl chain" role="math">
    <template v-for="(step, i) in spec.steps" :key="i">
      <span class="step">{{ step }}</span>
      <span v-if="i < spec.steps.length - 1" class="eq">
        <span class="sign">=</span>
        <span v-if="spec.notes?.[i]" class="under">{{ spec.notes[i] }}</span>
      </span>
    </template>
  </div>

  <div v-else-if="spec.kind === 'text'" class="fl text" :class="spec.align ?? 'center'">
    <p v-for="(line, i) in spec.lines" :key="i">{{ line }}</p>
  </div>

  <table v-else-if="spec.kind === 'table'" class="fl table" :class="{ grid: spec.grid }">
    <thead>
      <tr>
        <th v-for="(h, i) in spec.head" :key="i">{{ h }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, r) in spec.rows" :key="r" :class="{ hi: spec.highlight === r }">
        <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
      </tr>
    </tbody>
  </table>

  <div v-else-if="spec.kind === 'split'" class="fl split" role="math">
    <span class="base">{{ spec.base }}</span>
    <svg class="fan out" viewBox="0 0 40 40" aria-hidden="true">
      <line x1="2" y1="20" x2="36" y2="5" />
      <line x1="2" y1="20" x2="36" y2="35" />
    </svg>
    <span class="branches">
      <span class="branch up"
        ><small>{{ spec.upLabel }}</small
        >{{ spec.up }}</span
      >
      <span class="branch down"
        ><small>{{ spec.downLabel }}</small
        >{{ spec.down }}</span
      >
    </span>
    <template v-if="spec.result">
      <svg class="fan in" viewBox="0 0 40 40" aria-hidden="true">
        <line x1="2" y1="5" x2="36" y2="20" />
        <line x1="2" y1="35" x2="36" y2="20" />
      </svg>
      <span class="result">{{ spec.result }}</span>
    </template>
  </div>

  <div v-else-if="spec.kind === 'eleven'" class="fl eleven" role="math">
    <span class="col">
      <span class="value">{{ spec.n }}</span>
      <span class="value rule">× 11</span>
    </span>
    <span class="gap">
      <span class="digits"
        ><span>{{ spec.n[0] }}</span
        ><span class="blank" /><span>{{ spec.n[1] }}</span></span
      >
      <span class="sum">{{ spec.sum }}</span>
    </span>
    <span class="value">= {{ spec.result }}</span>
  </div>

  <div v-else-if="spec.kind === 'row'" class="fl row">
    <template v-for="(item, i) in spec.items" :key="i">
      <span v-if="i > 0 && spec.sep" class="sep">{{ spec.sep }}</span>
      <FigureLayout :spec="item" />
    </template>
  </div>

  <div v-else class="fl stack" :class="{ indent: spec.indent }">
    <FigureLayout v-for="(item, i) in spec.items" :key="i" :spec="item" />
  </div>
</template>

<style scoped>
.fl {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 1.05em;
  line-height: 1.45;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.note,
.under,
small,
.sep {
  font-family: var(--font-sans);
  font-weight: 400;
  color: var(--muted);
}

/* column */
.column {
  display: inline-grid;
  grid-template-columns: auto auto auto auto;
  column-gap: 0.35em;
  align-items: baseline;
}
.column .label {
  text-align: right;
  white-space: pre;
}
.column .op {
  text-align: left;
  min-width: 0.7em;
  padding-left: 0.1em;
}
.column .value {
  text-align: right;
  padding-right: 0.1em;
}
.column .rule {
  border-bottom: 0.09em solid currentColor;
  padding-bottom: 0.05em;
}
.column .note {
  text-align: left;
  white-space: nowrap;
  padding-left: 0.2em;
}
.column .note:empty,
.column .label:empty {
  padding: 0;
}

/* chain */
.chain {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  row-gap: 0.4em;
}
.chain .step {
  white-space: nowrap;
}
.chain .eq {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 0 0.75em;
  min-width: 1em;
}
.chain .under {
  font-size: 0.7em;
  line-height: 1.2;
  white-space: nowrap;
  margin-top: -0.2em;
}

/* text */
.text p {
  margin: 0;
}
.text.center {
  text-align: center;
}

/* table */
.table {
  border-collapse: collapse;
  margin: 0 auto;
  font-size: 0.95em;
}
.table th {
  font-family: var(--font-sans);
  font-weight: 700;
  padding: 0.15em 0.6em;
  vertical-align: bottom;
  white-space: pre-line;
  line-height: 1.15;
}
.table td {
  padding: 0.12em 0.6em;
  text-align: center;
  font-weight: 500;
}
.table:not(.grid) td:first-child,
.table:not(.grid) th:first-child {
  text-align: center;
}
.table.grid td,
.table.grid th {
  border: 1px solid var(--rule);
  text-align: center;
}
.table.grid th,
.table.grid td:first-child {
  font-weight: 700;
  background: var(--card);
}
.table .hi td {
  background: var(--card);
  box-shadow: inset 0 0 0 1px var(--card-rule);
}

/* split (squaring diagram) */
.split {
  display: inline-flex;
  align-items: center;
  gap: 0.15em;
}
.split .fan {
  width: 2.2em;
  height: 2.2em;
  stroke: currentColor;
  stroke-width: 1.6;
  fill: none;
  flex: none;
}
.split .branches {
  display: inline-flex;
  flex-direction: column;
  gap: 0.9em;
}
.split .branch {
  position: relative;
  line-height: 1.1;
}
.split .branch small {
  position: absolute;
  left: -1.6em;
  font-size: 0.65em;
  line-height: 1;
  color: var(--muted);
}
.split .branch.up small {
  top: -1.1em;
}
.split .branch.down small {
  bottom: -1.1em;
}
.split .result {
  white-space: nowrap;
  padding-left: 0.1em;
}

/* eleven */
.eleven {
  display: inline-flex;
  align-items: flex-start;
  gap: 1.6em;
}
.eleven .col {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
}
.eleven .col .rule {
  border-bottom: 0.09em solid currentColor;
}
.eleven .gap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}
.eleven .digits {
  display: inline-flex;
  align-items: flex-end;
}
.eleven .blank {
  display: inline-block;
  width: 1.4em;
  border-bottom: 0.09em solid currentColor;
  margin: 0 0.1em 0.15em;
}
.eleven .sum {
  line-height: 1.1;
}

/* groups */
.row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  column-gap: 2.5em;
  row-gap: 1em;
}
.row .sep {
  font-style: italic;
  align-self: center;
}
.stack {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1em;
}
.stack.indent {
  align-items: flex-start;
}
.stack.indent > :nth-child(n + 2) {
  margin-left: 45%;
}
@media (max-width: 719px) {
  .fl {
    font-size: 0.95em;
  }
  .stack.indent > :nth-child(n + 2) {
    margin-left: 25%;
  }
}
</style>
