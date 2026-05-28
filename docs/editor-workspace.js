function stripDoctype(source) {
  return source.replace(/<!DOCTYPE[^>]*>\s*/i, '').trim()
}

function normalizeNewlines(source) {
  return String(source || '').replace(/\r\n?/g, '\n')
}

function extractMatch(source, pattern) {
  const match = source.match(pattern)
  return match ? match[1].trim() : ''
}

function injectWorkspaceReferences(html) {
  let next = html

  if (/<style[\s\S]*?<\/style>/i.test(next)) {
    next = next.replace(/<style[\s\S]*?<\/style>/i, '<link rel="stylesheet" href="./styles/game.css">')
  } else if (/<\/head>/i.test(next)) {
    next = next.replace(/<\/head>/i, '  <link rel="stylesheet" href="./styles/game.css">\n</head>')
  }

  if (/<script[\s\S]*?<\/script>/i.test(next)) {
    next = next.replace(/<script[\s\S]*?<\/script>/i, '<script type="module" src="./scripts/game.js"></script>')
  } else if (/<\/body>/i.test(next)) {
    next = next.replace(/<\/body>/i, '  <script type="module" src="./scripts/game.js"></script>\n</body>')
  }

  return next.trim()
}

export function getLanguageFromPath(filePath) {
  if (filePath.endsWith('.html')) return 'html'
  if (filePath.endsWith('.css')) return 'css'
  if (filePath.endsWith('.js') || filePath.endsWith('.ts')) return 'javascript'
  return 'text'
}

export function createWorkspaceFromHtml(source) {
  const normalized = normalizeNewlines(source)
  const css = extractMatch(normalized, /<style[^>]*>([\s\S]*?)<\/style>/i)
  const js = extractMatch(normalized, /<script[^>]*>([\s\S]*?)<\/script>/i)
  const html = injectWorkspaceReferences(stripDoctype(normalized))

  const files = [
    { id: 'index.html', path: 'index.html', name: 'index.html', group: 'app', language: 'html', content: html },
    { id: 'styles/game.css', path: 'styles/game.css', name: 'game.css', group: 'styles', language: 'css', content: css },
    { id: 'scripts/game.js', path: 'scripts/game.js', name: 'game.js', group: 'scripts', language: 'javascript', content: js },
  ]

  return { files }
}

export function bundleWorkspaceFiles(files) {
  const byPath = new Map((files || []).map(file => [file.path, file.content || '']))
  let html = normalizeNewlines(byPath.get('index.html') || '')
  const css = normalizeNewlines(byPath.get('styles/game.css') || '')
  const js = normalizeNewlines(byPath.get('scripts/game.js') || '')

  // Replace any <link> pointing to game.css (flexible match)
  html = html.replace(
    /<link\b[^>]*href=["']\.\/styles\/game\.css["'][^>]*\/?>\s*/i,
    css ? `<style>\n${css}\n</style>\n` : '',
  )
  // Replace any <script> pointing to game.js (flexible match, with or without type=module)
  html = html.replace(
    /<script\b[^>]*src=["']\.\/scripts\/game\.js["'][^>]*><\/script>\s*/i,
    js ? `<script>\n${js}\n</script>\n` : '',
  )

  if (!/<!DOCTYPE/i.test(html)) {
    html = `<!DOCTYPE html>\n${html}`
  }

  return html.trim()
}
