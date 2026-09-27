#!/usr/bin/env node
// Static server for the built site: dependency-free, SPA fallback, correct types and cache
// headers for the service worker. Usage: node scripts/serve.mjs <dir> <port> [host]
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'

const [dir = 'dist', port = '8547', host = '0.0.0.0'] = process.argv.slice(2)
const root = resolve(dir)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function cacheControl(pathname) {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable' // hashed bundles
  if (/^\/(index\.html|sw\.js|workbox-.*\.js|manifest\.webmanifest|registerSW\.js)$/.test(pathname))
    return 'no-cache'
  return 'public, max-age=604800' // figures, icons
}

function fileFor(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(root, clean)
  if (!candidate.startsWith(root + sep) && candidate !== root) return null
  try {
    const st = statSync(candidate)
    if (st.isFile()) return { path: candidate, size: st.size, mtime: st.mtime }
    if (st.isDirectory()) return fileFor(join(clean, 'index.html'))
  } catch {
    /* fall through */
  }
  return null
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  let pathname = url.pathname
  let file = fileFor(pathname)
  if (!file && !extname(pathname)) {
    pathname = '/index.html' // client-side route
    file = fileFor(pathname)
  }
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end('not found')
    return
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(file.path).toLowerCase()] ?? 'application/octet-stream',
    'content-length': file.size,
    'last-modified': file.mtime.toUTCString(),
    'cache-control': cacheControl(pathname),
  })
  if (req.method === 'HEAD') return res.end()
  createReadStream(file.path).pipe(res)
})

server.listen(Number(port), host, () => {
  console.log(`serving ${root} on http://${host}:${port}`)
})
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)))
