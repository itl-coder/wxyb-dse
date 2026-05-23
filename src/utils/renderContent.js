/**
 * 模块：renderContent
 * 功能：富文本渲染工具，支持 Markdown + LaTeX 数学公式（行内/块级）
 * 依赖：markdown-it, markdown-it-katex
 */

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
