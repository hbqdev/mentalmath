import { phoneticDigits } from '../checker'
import type { GeneratedSetDef, Rng } from '../types'

const CODE: Array<[string, string, string]> = [
  ['0', 's, z', 'z is the first letter of zero'],
  ['1', 't, d', 't has one downstroke'],
  ['2', 'n', 'n has two downstrokes'],
  ['3', 'm', 'm has three downstrokes'],
  ['4', 'r', 'four ends in r'],
  ['5', 'l', 'L is 50 in Roman numerals'],
  ['6', 'j, ch, sh', 'J looks like a backward 6'],
  ['7', 'k, hard c, hard g', 'K is made of two 7s'],
  ['8', 'f, v', 'cursive f looks like 8'],
  ['9', 'p, b', '9 looks like a backward p'],
]

const WORDS = [
  'rain',
  'car',
  'jug',
  'fish',
  'bum',
  'toss',
  'lily',
  'cow',
  'shoe',
  'tie',
  'knee',
  'ma',
  'ray',
  'law',
  'key',
  'fee',
  'pie',
  'zoo',
  'dog',
  'oven',
  'cart',
  'fossil',
  'banana',
  'garage',
  'pencil',
  'Cleveland',
  'turtle',
  'pancho',
  'mover',
  'ginger',
  'rhino',
  'nickel',
  'tomato',
  'lemon',
  'camera',
  'candle',
  'carpet',
  'pillow',
  'rocket',
  'button',
  'mirror',
  'dollar',
  'ladder',
  'cabbage',
  'volcano',
]

function digitString(rng: Rng, len: number): string {
  let s = ''
  for (let i = 0; i < len; i++) s += String(rng.int(i === 0 ? 1 : 0, 9))
  return s
}

function hintFor(ds: string): string[] {
  return ds.split('').map((d) => {
    const row = CODE[Number(d)]!
    return `${d} → ${row[1]}`
  })
}

export const sets: GeneratedSetDef[] = [
  {
    id: 'gen7-number-to-word',
    chapterId: '7',
    sectionId: 'the-phonetic-code',
    title: 'Number to word',
    description: 'Turn a number into a word whose consonant sounds spell it.',
    generate(difficulty, rng) {
      const ds = digitString(rng, difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4)
      return {
        difficulty,
        prompt: {
          kind: 'text',
          text: `Find a word for ${ds} using the phonetic code.`,
          emphasis: ds,
        },
        answer: { kind: 'phonetic', digits: ds },
        solution: {
          steps: [...hintFor(ds), `Any word with exactly those consonant sounds spells ${ds}`],
        },
      }
    },
  },
  {
    id: 'gen7-word-to-number',
    chapterId: '7',
    sectionId: 'the-phonetic-code',
    title: 'Word to number',
    description: 'Read the consonant sounds back into digits.',
    generate(difficulty, rng) {
      const pool = WORDS.filter((w) => {
        const n = phoneticDigits(w).length
        return difficulty === 'easy' ? n <= 2 : difficulty === 'medium' ? n === 3 : n >= 4
      })
      const word = rng.pick(pool.length ? pool : WORDS)
      const ds = phoneticDigits(word)
      return {
        difficulty,
        prompt: {
          kind: 'text',
          text: `What number does the word “${word}” encode?`,
          emphasis: word,
        },
        answer: { kind: 'text', accept: [ds], normalize: 'digits' },
        solution: { steps: [...hintFor(ds), `${word} → ${ds}`] },
      }
    },
  },
  {
    id: 'gen7-digit-sounds',
    chapterId: '7',
    sectionId: 'the-phonetic-code',
    title: 'Digit sounds',
    description: 'Which digit does a consonant sound stand for?',
    generate(difficulty, rng) {
      const row = rng.pick(CODE)
      const sound = difficulty === 'easy' ? row[1].split(', ')[0]! : rng.pick(row[1].split(', '))
      return {
        difficulty,
        prompt: {
          kind: 'text',
          text: `Which digit does the sound “${sound}” stand for?`,
          emphasis: sound,
        },
        answer: { kind: 'choice', options: CODE.map((c) => c[0]), correct: row[0] },
        solution: { steps: [`${row[1]} → ${row[0]} (${row[2]})`] },
      }
    },
  },
  {
    id: 'gen7-memory-chain',
    chapterId: '7',
    sectionId: 'memory-magic',
    title: 'Memory chain',
    description: 'Turn a longer number into a phrase; every consonant sound counts.',
    generate(difficulty, rng) {
      const ds = digitString(rng, difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8)
      return {
        difficulty,
        prompt: { kind: 'text', text: `Make a phrase that encodes ${ds}.`, emphasis: ds },
        answer: { kind: 'phonetic', digits: ds },
        solution: {
          steps: [...hintFor(ds), `The phrase's consonant sounds, in order, must spell ${ds}`],
        },
      }
    },
  },
]
