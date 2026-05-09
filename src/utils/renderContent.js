// Rich content renderer — Markdown + LaTeX support for question text and answers
// Supports: **bold**, *italic*, `code`, ```code blocks```, $latex$, $$display$$, \(...\) for inline LaTeX

import katex from 'katex'

export function renderRichContent(text) {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks ```...```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="rc-code-block"><code>${code.trim()}</code></pre>`
  })

  // Display math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), { throwOnError: false, displayMode: true })
    } catch { return _ }
  })

  // Inline math $...$ (but not $$)
  html = html.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), { throwOnError: false, displayMode: false })
    } catch { return _ }
  })

  // Inline LaTeX \(...\)
  html = html.replace(/\\\((.+?)\\\)/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), { throwOnError: false, displayMode: false })
    } catch { return _ }
  })

  // Display LaTeX \[...\]
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), { throwOnError: false, displayMode: true })
    } catch { return _ }
  })

  // Bold **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  // Italic *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')
  // Inline code `code`
  html = html.replace(/`(.+?)`/g, '<code class="rc-inline-code">$1</code>')

  // Lists (unordered: - or * at start of line; ordered: 1. 2. etc)
  html = html.replace(/(?:^|\n)(?:[-*]\s+(.+?)(?=\n|$))/gm, '<li>$1</li>')

  // Newlines to <br>
  html = html.replace(/\n/g, '<br>')

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li><br>)+)/g, (match) => {
    return '<ul style="padding-left:2em;margin:4px 0">' + match.replace(/<br>/g, '') + '</ul>'
  })

  return html
}

// Simple version for inline text (no block-level latex)
export function renderSimpleContent(text) {
  if (!text) return ''
  return text.replace(/\n/g, '<br>')
}
