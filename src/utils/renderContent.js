// Rich content renderer using markdown-it + KaTeX
// Supports full Markdown + LaTeX (inline $...$, display $$...$$, \(...\), \[...\])

import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'

let mdInstance = null
function getMarkdownIt() {
  if (!mdInstance) {
    mdInstance = new MarkdownIt({ html: false, breaks: true, linkify: false })
    mdInstance.use(markdownItKatex, {
      throwOnError: false,
      errorColor: '#ef4444',
      strict: false,
      output: 'html',
      displayMode: false
    })
  }
  return mdInstance
}

export function renderRichContent(text) {
  if (!text) return ''
  return getMarkdownIt().render(text)
}

export function renderSimpleContent(text) {
  if (!text) return ''
  const md = new MarkdownIt({ html: false, breaks: true, linkify: false })
  return md.renderInline(text)
}
