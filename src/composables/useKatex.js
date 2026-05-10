/**
 * Unified math rendering composable
 *
 * All formula rendering goes through MathRenderer component.
 * This composable provides convenience functions that use:
 *   - sanitizeLatex() for pre-processing
 *   - KaTeX for fast sync rendering
 *   - MathJax for complex formula fallback (lazy-loaded)
 */
import { nextTick } from 'vue'
import katex from 'katex'
import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'
import { sanitizeLatex } from '@/utils/latexSanitizer'

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

// MathJax singleton
let mathjaxInstance = null
let mathjaxInitPromise = null

async function getMathJax() {
  if (mathjaxInstance) return mathjaxInstance
  if (mathjaxInitPromise) return mathjaxInitPromise

  mathjaxInitPromise = (async () => {
    try {
      const mj = await import('mathjax')
      await mj.mathjax.init({
        loader: { load: ['input/tex', 'output/chtml'] },
        tex: { packages: { '[+]': ['ams', 'boldsymbol', 'color', 'enclose', 'extpfeil', 'html'] } },
        chtml: { fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2' }
      })
      mathjaxInstance = mj.mathjax
      return mathjaxInstance
    } catch (err) {
      console.warn('[useKatex] MathJax init failed:', err.message)
      return null
    }
  })()

  return mathjaxInitPromise
}

// Complexity patterns that trigger MathJax fallback
const COMPLEX_PATTERNS = [
  /\\begin\{matrix\}/, /\\begin\{pmatrix\}/, /\\begin\{bmatrix\}/,
  /\\begin\{cases\}/, /\\begin\{aligned\}/, /\\begin\{align\}/,
  /\\begin\{array\}/, /\\begin\{gathered\}/, /\\begin\{split\}/,
  /\\xrightarrow/, /\\xleftarrow/, /\\overset/, /\\underset/,
  /\\substack/, /\\genfrac/, /\\hdashline/, /\\multicol/
]

function isComplex(formula) {
  return COMPLEX_PATTERNS.some(p => p.test(formula))
}

export function useKatex() {
  const md = getMarkdownIt()

  function renderMarkdown(text) {
    if (!text) return ''
    const cleaned = sanitizeLatex(text)
    return md.render(cleaned)
  }

  function renderInline(formula) {
    if (!formula) return ''
    const cleaned = sanitizeLatex(formula)
    try {
      return katex.renderToString(cleaned, {
        throwOnError: false,
        displayMode: false,
        strict: false,
        trust: true
      })
    } catch {
      return `<span class="katex-error">${cleaned}</span>`
    }
  }

  function renderBlock(formula) {
    if (!formula) return ''
    const cleaned = sanitizeLatex(formula)
    try {
      return katex.renderToString(cleaned, {
        throwOnError: false,
        displayMode: true,
        strict: false,
        trust: true
      })
    } catch {
      return `<span class="katex-error">${cleaned}</span>`
    }
  }

  /**
   * Hybrid render: KaTeX first, MathJax fallback for complex formulas.
   * Returns Promise<string> — resolves to HTML.
   */
  async function renderHybrid(formula, { displayMode = true, fallback = true } = {}) {
    const cleaned = sanitizeLatex(formula)
    if (!cleaned) return ''

    // Try KaTeX first
    try {
      return katex.renderToString(cleaned, {
        throwOnError: true,
        displayMode,
        strict: false,
        trust: true
      })
    } catch {
      // KaTeX failed — try MathJax if fallback enabled and formula is complex
      if (!fallback || !isComplex(cleaned)) {
        return `<span class="katex-error">公式解析失败: ${cleaned}</span>`
      }
    }

    // Try MathJax
    try {
      const mj = await getMathJax()
      if (!mj) throw new Error('MathJax 不可用')
      const node = await mj.tex2chtmlPromise(cleaned, { display: displayMode, em: 14, ex: 7 })
      const container = document.createElement('div')
      container.appendChild(node)
      return container.innerHTML
    } catch {
      return `<span class="katex-error">公式解析失败: ${cleaned}</span>`
    }
  }

  function validateLatex(formula) {
    if (!formula || !formula.trim()) return { valid: false, error: '空公式' }
    const cleaned = sanitizeLatex(formula)
    try {
      katex.renderToString(cleaned, { throwOnError: true, displayMode: true, strict: false, trust: true })
      return { valid: true, error: null }
    } catch (e) {
      return { valid: false, error: e.message }
    }
  }

  function extractFormulas(text) {
    if (!text) return []
    const formulas = []
    const displayRegex = /\$\$([\s\S]*?)\$\$/g
    const inlineRegex = /\\\(([\s\S]*?)\\\)/g
    let m
    while ((m = displayRegex.exec(text)) !== null) {
      formulas.push({ formula: sanitizeLatex(m[1]), displayMode: true })
    }
    while ((m = inlineRegex.exec(text)) !== null) {
      formulas.push({ formula: sanitizeLatex(m[1]), displayMode: false })
    }
    return formulas
  }

  return {
    renderMarkdown,
    renderInline,
    renderBlock,
    renderHybrid,
    validateLatex,
    extractFormulas
  }
}
