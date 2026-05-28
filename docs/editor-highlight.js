export function escapeHtml(source) {
  return String(source)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrap(pattern, className, source) {
  return source.replace(pattern, match => `<span class="${className}">${match}</span>`)
}

function highlightHtml(source) {
  let output = escapeHtml(source)
  output = output.replace(/(&lt;\/?)([\w-]+)/g, (_, prefix, tag) => `${prefix}<span class="tok-tag">${tag}</span>`)
  output = output.replace(/([\w:-]+)=(&quot;[^&]*?&quot;)/g, (_, attr, value) => `<span class="tok-attr">${attr}</span>=<span class="tok-string">${value}</span>`)
  return output
}

function highlightCss(source) {
  let output = escapeHtml(source)
  output = wrap(/\/\*[\s\S]*?\*\//g, 'tok-comment', output)
  output = output.replace(/(^|[\{\}\n]\s*)([^\{\}\n]+?)(\s*\{)/g, (_, before, selector, after) => `${before}<span class="tok-selector">${selector.trim()}</span>${after}`)
  output = output.replace(/([\w-]+)(\s*:)/g, '<span class="tok-prop">$1</span>$2')
  output = output.replace(/(:\s*)(#[0-9a-fA-F]{3,8}|[\w.-]+(?:\([^)]*\))?)/g, '$1<span class="tok-value">$2</span>')
  return output
}

function highlightJavaScript(source) {
  let output = escapeHtml(source)
  output = wrap(/\/\/[^\n]*/g, 'tok-comment', output)
  output = wrap(/\b(function|const|let|var|return|if|else|for|while|export|import|class|new)\b/g, 'tok-keyword', output)
  output = wrap(/(?<=\bfunction\s)([A-Za-z_$][\w$]*)|([A-Za-z_$][\w$]*)(?=\s*\()/g, 'tok-fn', output)
  output = wrap(/&quot;[^&]*?&quot;|'[^']*'/g, 'tok-string', output)
  output = wrap(/\b\d+(?:\.\d+)?\b/g, 'tok-number', output)
  return output
}

export function highlightCode(source, language) {
  const normalized = String(source || '')

  if (language === 'html') return highlightHtml(normalized)
  if (language === 'css') return highlightCss(normalized)
  if (language === 'javascript') return highlightJavaScript(normalized)
  return escapeHtml(normalized)
}
