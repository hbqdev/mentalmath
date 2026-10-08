// Expected answers for the iOS specs, computed from the app's own generators (run on NightFuryX:
// `npx tsx e2e-ios/make-fixtures.ts`), so the specs on the Mac need no TypeScript.
import { writeFileSync } from 'node:fs'
import { formatAnswer } from '../src/exercises/checker'
import { findGenerated } from '../src/exercises/generators'
import { generateMany } from '../src/exercises/generators/shared'
import { createRng } from '../src/exercises/rng'

const SET = 'gen1-two-digit-addition'
const answers = (seed: number) =>
  generateMany(findGenerated(SET)!, 10, 'mixed', createRng(seed)).map((e) => formatAnswer(e.answer))

writeFileSync(
  new URL('./fixtures.json', import.meta.url),
  JSON.stringify({ set: SET, seed42: answers(42), seed7: answers(7), seed3: answers(3) }, null, 2) +
    '\n',
)
console.log('wrote e2e-ios/fixtures.json')
