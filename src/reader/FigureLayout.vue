<script setup lang="ts">
import type { FigureSpec } from '@/content/figures/types'
import { RichText } from './RichText'
defineProps<{ spec: FigureSpec }>()

const CELL = 44
const ccWidth = (n: number) => n * CELL
const ccX = (i: number) => i * CELL + CELL / 2
</script>

<template>
  <!-- column: label | op | value | note -->
  <div v-if="spec.kind === 'column'" class="fl column" :class="{ captioned: spec.caption }">
    <span v-if="spec.caption" class="caption">{{ spec.caption }}</span>
    <template v-for="(line, i) in spec.lines" :key="i">
      <span class="lbl">{{ line.label ?? '' }}</span>
      <span class="op" :class="{ rule: line.rule && line.op }">{{ line.op ?? '' }}</span>
      <span class="value" :class="{ rule: line.rule, carry: line.carry }">{{ line.value }}</span>
      <span class="note">{{ line.note ?? '' }}</span>
    </template>
  </div>

  <div v-else-if="spec.kind === 'chain'" class="fl chain">
    <template v-for="(step, i) in spec.steps" :key="i">
      <span v-if="i === 0" class="step"><RichText :text="step" /></span>
      <span v-else class="link">
        <span class="eq">
          <span class="sign">{{
            step.startsWith('≈') || step.startsWith('<') ? step[0] : '='
          }}</span>
          <span v-if="spec.notes?.[i - 1]" class="under">{{ spec.notes[i - 1] }}</span>
        </span>
        <span class="step"><RichText :text="step.replace(/^[≈<] ?/, '')" /></span>
      </span>
    </template>
  </div>

  <div
    v-else-if="spec.kind === 'text'"
    class="fl text"
    :class="[spec.align ?? 'center', { serif: spec.serif }]"
  >
    <p v-for="(line, i) in spec.lines" :key="i"><RichText :text="line" /></p>
  </div>

  <div v-else-if="spec.kind === 'pre'" class="fl pre" :class="spec.align ?? 'left'">
    <p v-for="(line, i) in spec.lines" :key="i"><RichText :text="line" /></p>
  </div>

  <span v-else-if="spec.kind === 'inline'" class="fl inline"><RichText :text="spec.text" /></span>

  <div v-else-if="spec.kind === 'grid'" class="fl gridk" :class="spec.align ?? 'right'">
    <div v-for="(row, r) in spec.rows" :key="r" class="grow">
      <span
        v-for="(cell, c) in row"
        :key="c"
        class="gcell"
        :class="{ arrow: /^[→↓←]+$/.test(cell), empty: cell === '' }"
        ><RichText :text="cell"
      /></span>
    </div>
  </div>

  <div v-else-if="spec.kind === 'longdiv'" class="fl longdiv">
    <div class="ld">
      <span class="quot">{{ spec.quotient }}</span>
      <span class="divd"
        ><span class="divisor">{{ spec.divisor }}</span
        ><span class="bracket">)</span><span class="dividend">{{ spec.dividend }}</span></span
      >
      <span v-for="(line, i) in spec.lines" :key="i" class="ldl" :class="{ rule: line.rule }">
        <span class="v">{{ line.value }}</span
        ><span v-if="line.note" class="note">{{ line.note }}</span>
      </span>
    </div>
    <p v-if="spec.answer" class="answer"><RichText :text="spec.answer" /></p>
  </div>

  <svg
    v-else-if="spec.kind === 'crisscross'"
    class="fl crisscross"
    :viewBox="`0 0 ${ccWidth(Math.max(spec.top.length, spec.bottom.length))} 76`"
    :style="{ width: `${Math.max(spec.top.length, spec.bottom.length) * 2.2}em` }"
    aria-hidden="true"
  >
    <line v-for="([a, b], i) in spec.links" :key="i" :x1="ccX(a)" y1="20" :x2="ccX(b)" y2="56" />
    <text v-for="(d, i) in spec.top" :key="'t' + i" :x="ccX(i)" y="14">{{ d }}</text>
    <text v-for="(d, i) in spec.bottom" :key="'b' + i" :x="ccX(i)" y="70">{{ d }}</text>
  </svg>

  <table
    v-else-if="spec.kind === 'table'"
    class="fl table"
    :class="{ grid: spec.grid, plain: spec.plain }"
  >
    <thead v-if="spec.head.length">
      <tr>
        <th v-for="(h, i) in spec.head" :key="i" :colspan="spec.headSpan?.[i] ?? 1">{{ h }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, r) in spec.rows" :key="r" :class="{ hi: spec.highlight === r }">
        <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
      </tr>
    </tbody>
  </table>

  <div v-else-if="spec.kind === 'split'" class="fl split">
    <span class="base">{{ spec.base }}</span>
    <svg class="fan out" viewBox="0 0 40 40" aria-hidden="true">
      <line x1="2" y1="20" x2="34" y2="6" />
      <polygon points="36,5 32.2,8.8 30.6,5.2" />
      <line x1="2" y1="20" x2="34" y2="34" />
      <polygon points="36,35 32.2,31.2 30.6,34.8" />
      <text x="16" y="9">{{ spec.upLabel }}</text>
      <text x="16" y="39">{{ spec.downLabel }}</text>
    </svg>
    <span class="branches">
      <span class="branch">{{ spec.up }}</span>
      <span class="branch">{{ spec.down }}</span>
    </span>
    <template v-if="spec.result !== undefined">
      <svg class="fan in" viewBox="0 0 40 40" aria-hidden="true">
        <line x1="2" y1="5" x2="34" y2="19" />
        <line x1="2" y1="35" x2="34" y2="21" />
        <polygon points="36,20 30.6,19.8 32.2,16.2" />
        <polygon points="36,20 30.6,20.2 32.2,23.8" />
      </svg>
      <span class="resbox">
        <small v-if="spec.label" class="lbl">{{ spec.label }}</small>
        <span class="result">{{ spec.result }}</span>
      </span>
    </template>
  </div>

  <div v-else-if="spec.kind === 'eleven'" class="fl eleven">
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
  align-items: baseline;
}
.column .lbl {
  text-align: right;
  white-space: pre;
  padding-right: 0.4em;
}
.column .op {
  text-align: left;
  min-width: 0.9em;
  padding-left: 0.1em;
}
.column .value {
  text-align: right;
  padding-right: 0.1em;
}
.column .carry {
  font-size: 0.7em;
  line-height: 1;
  color: var(--muted);
  white-space: pre;
}
.column .rule {
  border-bottom: 0.09em solid currentColor;
  padding-bottom: 0.05em;
}
.column .note {
  text-align: left;
  white-space: nowrap;
  padding-left: 0.5em;
}
.column .note:empty,
.column .lbl:empty {
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
.chain .link {
  display: inline-flex;
  align-items: flex-start;
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

/* text, pre, inline, grid */
.text.left {
  text-align: left;
}
.text.serif {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 1em;
  max-width: 100%;
}
.text.serif p {
  white-space: normal;
}
.text p,
.pre p {
  margin: 0;
  white-space: pre-wrap;
}
.pre p {
  white-space: pre;
  text-align: left;
}
.pre.center {
  display: inline-block;
}
.inline {
  font-size: 1em;
}
.gridk {
  display: inline-grid;
  grid-auto-flow: row;
  column-gap: 0.6em;
  row-gap: 0.15em;
}
.gridk .gcell {
  text-align: right;
  white-space: nowrap;
  padding: 0 0.3em;
}
.gridk .gcell.empty {
  min-width: 1.4em;
}
.gridk.left .gcell {
  text-align: left;
}
.gridk.center .gcell {
  text-align: center;
}
.gridk .arrow {
  color: var(--muted);
  font-weight: 400;
  text-align: center;
}
.column .caption {
  grid-column: 1 / -1;
  text-align: right;
  font-family: var(--font-sans);
  font-weight: 400;
  color: var(--muted);
  font-size: 0.8em;
}

/* rich text */
:deep(.rt-frac) {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
  line-height: 1.05;
  font-size: 0.85em;
  margin: 0 0.1em;
}
:deep(.rt-num) {
  border-bottom: 0.08em solid currentColor;
  padding: 0 0.15em;
}
:deep(.rt-den) {
  padding: 0 0.15em;
}
:deep(.rt-over) {
  text-decoration: overline;
  text-decoration-thickness: 0.08em;
}
:deep(.rt-under) {
  text-decoration: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.1em;
}
:deep(.rt-sup) {
  font-size: 0.7em;
}

/* long division */
.longdiv .ld {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
}
.longdiv .quot,
.longdiv .ldl .v {
  white-space: pre;
}
.longdiv .divd {
  display: inline-flex;
  align-items: baseline;
}
.longdiv .bracket {
  margin: 0 0.05em;
}
.longdiv .dividend {
  border-top: 0.09em solid currentColor;
  padding-top: 0.05em;
  white-space: pre;
}
.longdiv .ldl {
  display: inline-flex;
  align-items: baseline;
  position: relative;
}
.longdiv .ldl.rule .v {
  border-bottom: 0.09em solid currentColor;
}
.longdiv .ldl .note {
  position: absolute;
  left: 100%;
  margin-left: 0.6em;
  white-space: nowrap;
}
.longdiv .answer {
  margin: 0.6em 0 0;
  text-align: left;
}

/* criss-cross */
.crisscross {
  display: inline-block;
  height: auto;
  stroke: currentColor;
  stroke-width: 1.2;
  overflow: visible;
}
.crisscross text {
  fill: currentColor;
  stroke: none;
  font-size: 20px;
  text-anchor: middle;
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
.table.grid:not(.plain) th,
.table.grid:not(.plain) td:first-child {
  font-weight: 700;
  background: var(--card);
}
.table.plain td {
  padding: 0.3em 0.9em;
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
  width: 2.6em;
  height: 2.6em;
  stroke: currentColor;
  stroke-width: 1.4;
  fill: none;
  flex: none;
  overflow: visible;
}
.split .fan polygon {
  fill: currentColor;
  stroke: none;
}
.split .fan text {
  fill: var(--muted);
  stroke: none;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  text-anchor: middle;
}
.split .branches {
  display: inline-flex;
  flex-direction: column;
  gap: 0.9em;
}
.split .branch {
  line-height: 1.1;
}
.split .resbox {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
}
.split .resbox .lbl {
  font-size: 0.65em;
  line-height: 1;
  margin-bottom: 0.1em;
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
  max-width: 100%;
}
.stack.indent {
  align-items: flex-start;
}
/* The inner square sits under the right half of the outer one, never wider than it. */
.stack.indent > :nth-child(n + 2) {
  align-self: flex-end;
}
@media (max-width: 719px) {
  .fl {
    font-size: 0.95em;
  }
  .split {
    font-size: 0.8em;
  }
  .split .fan {
    width: 2.2em;
    height: 2.2em;
  }
  .table.grid td,
  .table.grid th {
    padding: 0.12em 0.3em;
  }
}
</style>
