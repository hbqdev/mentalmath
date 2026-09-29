// Publish to Google Play through the Android Developer API with the service account in
// ~/.mentalmath/play-service-account.json. Used by `scripts/mentalmath.sh play:*`.
//
//   node scripts/play.mjs check                     verify access to the app
//   node scripts/play.mjs upload <track> [<aab>]     upload a bundle and release it on a track
//                                                     (internal | alpha | beta | production)
//   node scripts/play.mjs listing                    push store/listing.md, icon, feature graphic and screenshots
import { createReadStream, readFileSync, readdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { google } from 'googleapis'

const PKG = 'dev.hbq.mentalmath'
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const keyFile = path.join(homedir(), '.mentalmath', 'play-service-account.json')
if (!existsSync(keyFile)) throw new Error(`missing ${keyFile}`)
const version = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
})
const play = google.androidpublisher({ version: 'v3', auth })

async function withEdit(fn) {
  const { data: edit } = await play.edits.insert({ packageName: PKG })
  const editId = edit.id
  try {
    const result = await fn(editId)
    await play.edits.commit({ packageName: PKG, editId })
    return result
  } catch (e) {
    await play.edits.delete({ packageName: PKG, editId }).catch(() => {})
    throw e
  }
}

const [cmd, ...args] = process.argv.slice(2)

if (cmd === 'check') {
  const { data: edit } = await play.edits.insert({ packageName: PKG })
  const { data } = await play.edits.tracks.list({ packageName: PKG, editId: edit.id })
  await play.edits.delete({ packageName: PKG, editId: edit.id })
  console.log(
    `access ok: ${PKG}, tracks: ${(data.tracks ?? []).map((t) => t.track).join(', ') || 'none yet'}`,
  )
} else if (cmd === 'upload') {
  const track = args[0] ?? 'internal'
  const aab = args[1] ?? path.join(root, 'store', `mentalmath-${version}-release.aab`)
  if (!existsSync(aab))
    throw new Error(`no bundle at ${aab}; run scripts/mentalmath.sh android:release`)
  const notes =
    readFileSync(path.join(root, 'store', 'listing.md'), 'utf8').match(
      /## Release notes[^\n]*\n\n([^\n]+)/,
    )?.[1] ?? `Version ${version}`
  await withEdit(async (editId) => {
    const { data: bundle } = await play.edits.bundles.upload({
      packageName: PKG,
      editId,
      media: { mimeType: 'application/octet-stream', body: createReadStream(aab) },
    })
    console.log(`uploaded ${path.basename(aab)} as versionCode ${bundle.versionCode}`)
    await play.edits.tracks.update({
      packageName: PKG,
      editId,
      track,
      requestBody: {
        track,
        releases: [
          {
            name: version,
            versionCodes: [String(bundle.versionCode)],
            status: 'completed',
            releaseNotes: [{ language: 'en-US', text: notes }],
          },
        ],
      },
    })
    console.log(`released ${version} on the ${track} track`)
  })
} else if (cmd === 'listing') {
  const md = readFileSync(path.join(root, 'store', 'listing.md'), 'utf8')
  const section = (title) =>
    md
      .split(new RegExp(`\\n## ${title}[^\\n]*\\n`))[1]
      ?.split('\n## ')[0]
      ?.trim() ?? ''
  const shortDescription = section('Short description')
  const fullDescription = section('Full description')
  await withEdit(async (editId) => {
    await play.edits.listings.update({
      packageName: PKG,
      editId,
      language: 'en-US',
      requestBody: {
        language: 'en-US',
        title: 'Mental Math Trainer',
        shortDescription,
        fullDescription,
      },
    })
    console.log('listing text updated')
    const upload = (imageType, file) =>
      play.edits.images.upload({
        packageName: PKG,
        editId,
        language: 'en-US',
        imageType,
        media: { mimeType: 'image/png', body: createReadStream(file) },
      })
    await play.edits.images.deleteall({
      packageName: PKG,
      editId,
      language: 'en-US',
      imageType: 'icon',
    })
    await upload('icon', path.join(root, 'store', 'icon-512.png'))
    await play.edits.images.deleteall({
      packageName: PKG,
      editId,
      language: 'en-US',
      imageType: 'featureGraphic',
    })
    await upload('featureGraphic', path.join(root, 'store', 'feature-graphic.png'))
    await play.edits.images.deleteall({
      packageName: PKG,
      editId,
      language: 'en-US',
      imageType: 'phoneScreenshots',
    })
    const shots = [
      'home',
      'reader-page',
      'reader-page-footer',
      'drill',
      'drill-feedback',
      'worksheet',
      'progress',
      'settings',
    ]
    for (const name of shots) {
      const file = path.join(root, 'screenshots', 'android', `${name}.png`)
      if (existsSync(file)) await upload('phoneScreenshots', file)
    }
    console.log(`images uploaded: icon, feature graphic, ${shots.length} screenshots`)
  })
} else {
  console.error('usage: play.mjs check | upload <track> [aab] | listing')
  process.exit(2)
}
