import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const { directory } = JSON.parse(await readFile('dist/visual/latest.json', 'utf8'))
const root = path.resolve(directory, 'assets')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
createServer(async (request, response) => {
  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
  response.setHeader('Content-Security-Policy', "connect-src 'self'; frame-ancestors 'none'")
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    if (pathname === '/api' || pathname.startsWith('/api/')) { response.writeHead(404).end(); return }
    let filename = path.resolve(root, `.${pathname}`)
    if (filename !== root && !filename.startsWith(root + path.sep)) { response.writeHead(403).end(); return }
    if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html')
    response.setHeader('Content-Type', types[path.extname(filename)] ?? 'application/octet-stream')
    response.end(await readFile(filename))
  } catch {
    response.writeHead(404).end('Não encontrado')
  }
}).listen(3013, '127.0.0.1', () => console.log('Homologação visual estática em http://127.0.0.1:3013'))
