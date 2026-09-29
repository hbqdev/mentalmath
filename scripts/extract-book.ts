import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { imageSize } from 'image-size'
import type { ChapterMeta } from '../src/content/types'
import { openEpub, planUnits, readSpine, readText, readToc, type EpubArchive } from './lib/epub'
import { parseUnit, type ExerciseCandidate } from './lib/parse-unit'
import { renderIndex } from './lib/write-index'

export interface ExtractOptions {
  contentDir: string // e.g. src/content
  figuresDir: string // e.g. public/book/figures
  publicPrefix: string // e.g. /book/figures
  exerciseSets: Record<string, string>
  exerciseAfter?: Record<string, string>
}
export interface ExtractResult {
  units: Array<{ id: string; sections: number; figures: number }>
  candidates: Array<ExerciseCandidate & { unitId: string }>
  answersHtml: string[]
}

export function extract(bytes: Uint8Array, opts: ExtractOptions): ExtractResult {
  const archive = openEpub(bytes)
  const spine = readSpine(archive)
  const toc = readToc(archive)
  const plans = planUnits(spine, toc)

  const chaptersDir = path.join(opts.contentDir, 'chapters')
  rmSync(chaptersDir, { recursive: true, force: true })
  rmSync(opts.figuresDir, { recursive: true, force: true })
  mkdirSync(chaptersDir, { recursive: true })

  const metas: ChapterMeta[] = []
  const result: ExtractResult = { units: [], candidates: [], answersHtml: [] }

  for (const plan of plans) {
    if (plan.id === 'answers') {
      result.answersHtml = plan.files.map((f) => readText(archive, f.path))
      continue
    }
    const parsed = parseUnit(
      { ...plan, files: plan.files.map((f) => ({ ...f, html: readText(archive, f.path) })) },
      {
        exerciseSets: opts.exerciseSets,
        exerciseAfter: opts.exerciseAfter ?? {},
        imageSize: (p) => sizeOf(archive, p),
        figureSrc: (unitId, figureId) => `${opts.publicPrefix}/${unitId}/${figureId}.jpeg`,
      },
    )
    const unitFigDir = path.join(opts.figuresDir, plan.id)
    mkdirSync(unitFigDir, { recursive: true })
    for (const fig of parsed.figures) {
      const src = archive.files.get(fig.sourcePath)
      if (!src) throw new Error(`Figure ${fig.id} points at missing ${fig.sourcePath}`)
      writeFileSync(path.join(unitFigDir, `${fig.id}.jpeg`), src)
    }
    writeFileSync(
      path.join(chaptersDir, `${plan.id}.json`),
      JSON.stringify(parsed.doc, null, 2) + '\n',
    )
    metas.push({
      id: parsed.doc.id,
      number: parsed.doc.number,
      title: parsed.doc.title,
      kicker: parsed.doc.kicker,
      sections: parsed.doc.sections.map((s) => ({ id: s.id, title: s.title })),
      sets: parsed.doc.sections.flatMap((s) =>
        s.blocks.flatMap((b) => (b.type === 'exercise' ? [{ id: b.setId, sectionId: s.id }] : [])),
      ),
    })
    result.units.push({
      id: plan.id,
      sections: parsed.doc.sections.length,
      figures: parsed.figures.length,
    })
    result.candidates.push(...parsed.candidates.map((c) => ({ ...c, unitId: plan.id })))
  }

  writeFileSync(path.join(opts.contentDir, 'index.ts'), renderIndex(metas))
  return result
}

function sizeOf(archive: EpubArchive, p: string): { width: number; height: number } {
  const bytes = archive.files.get(p)
  if (!bytes) throw new Error(`Missing image ${p}`)
  const { width, height } = imageSize(bytes)
  return { width: width ?? 0, height: height ?? 0 }
}

// CLI
const invokedDirectly =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (invokedDirectly) {
  const epubPath = process.argv[2]
  if (!epubPath) {
    console.error('Usage: npm run extract -- <path-to-epub>')
    process.exit(2)
  }
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
  const map = JSON.parse(readFileSync(path.join(root, 'scripts', 'book-map.json'), 'utf8')) as {
    exerciseSets: Record<string, string>
    exerciseAfter?: Record<string, string>
  }
  const result = extract(readFileSync(epubPath), {
    contentDir: path.join(root, 'src', 'content'),
    figuresDir: path.join(root, 'public', 'book', 'figures'),
    publicPrefix: '/book/figures',
    exerciseSets: map.exerciseSets,
    exerciseAfter: map.exerciseAfter ?? {},
  })
  for (const u of result.units)
    console.log(`unit ${u.id}: ${u.sections} sections, ${u.figures} figures`)
  if (result.candidates.length) {
    console.log('\nExercise-set candidates (add confirmed ones to scripts/book-map.json):')
    for (const c of result.candidates) console.log(`  ${c.figureId}  …${c.after.slice(-110)}`)
  }
}
