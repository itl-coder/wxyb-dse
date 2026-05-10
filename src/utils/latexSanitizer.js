/**
 * LaTeX Sanitizer — Unified formula preprocessing
 *
 * Handles:
 *   - Double-escape cleanup (\\ → \)
 *   - Delimiter normalization ($$, \[, \(, $ → unified)
 *   - HTML entity decoding
 *   - Whitespace trimming
 *
 * Output: clean, standard LaTeX ready for KaTeX or MathJax
 */

// HTML entities commonly found in formula text
const HTML_ENTITIES = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>',
  '&quot;': '"', '&#39;': "'", '&apos;': "'",
  '&nbsp;': ' ', '&#x27;': "'"
}

function decodeHTMLEntities(text) {
  return text.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp|#x27);/g, m => HTML_ENTITIES[m] || m)
}

/**
 * Clean LaTeX string:
 * 1. Decode HTML entities
 * 2. Normalize double backslashes (Vue template artifact)
 * 3. Trim whitespace
 */
export function sanitizeLatex(input) {
  if (!input || typeof input !== 'string') return ''
  let s = input.trim()
  if (!s) return ''

  // Decode HTML entities (must happen before backslash processing)
  s = decodeHTMLEntities(s)

  // Normalize double-escaped backslashes:
  // Vue template attributes may produce \\\\ → need \\
  // Actual LaTeX commands like \frac, \sin, \vec etc. need single \
  //
  // Strategy: reduce repeated backslashes to single
  // \\\\ → \\, \\\ → \, but preserve intentional double-backslash (line breaks)
  //
  // In practice: Vue templates render \ as \\ in text content.
  // So \\frac → \frac after one level of unescaping.
  // But if the source has \\\\frac → \\frac → \frac after two levels.
  //
  // We use a heuristic: replace \\ followed by a LaTeX command letter
  // with single \, then clean up any remaining doubles.

  // First pass: \\ followed by alphabetic char → \ (LaTeX command)
  s = s.replace(/\\\\(?=[a-zA-Z])/g, '\\')

  // Second pass: \\ followed by {, }, [, ], (, ) → \
  s = s.replace(/\\\\(?=[{}[\]()])/g, '\\')

  // Third pass: clean up any remaining adjacent backslashes (3+)
  s = s.replace(/\\{2,}/g, '\\')

  // Fix |expr| → \left|expr\right| for proper sizing
  s = s.replace(/\|\s*(.*?)\s*\|/g, '\\left|$1\\right|')

  return s.trim()
}

/**
 * Normalize all common LaTeX delimiters to standard $...$ (inline) and $$...$$ (block).
 * Input may contain: \(...\), \[...\], $$...$$, $...$
 * Output: { formula, displayMode } with delimiters stripped
 */
export function normalizeLatex(input) {
  if (!input || typeof input !== 'string') return { formula: '', displayMode: false }

  let s = input.trim()

  // Block display: $$...$$ or \[...\]
  const blockMatch = s.match(/^\$\$([\s\S]*?)\$\$$/) || s.match(/^\\\[([\s\S]*?)\\\]$/)
  if (blockMatch) {
    return { formula: sanitizeLatex(blockMatch[1]), displayMode: true }
  }

  // Inline: $...$ or \(...\)
  const inlineMatch = s.match(/^\$([\s\S]*?)\$$/) || s.match(/^\\\(([\s\S]*?)\\\)$/)
  if (inlineMatch) {
    return { formula: sanitizeLatex(inlineMatch[1]), displayMode: false }
  }

  // No delimiters found — return sanitized as-is, infer displayMode from content
  const cleaned = sanitizeLatex(s)
  const displayMode = cleaned.includes('\\begin{') || cleaned.includes('\\displaystyle') || cleaned.length > 60
  return { formula: cleaned, displayMode }
}

/**
 * Split mixed text (text + inline formulas) into segments.
 * Detects \(...\), $...$, $$...$$, \[...\] delimiters.
 * Returns array of { type: 'text'|'latex', content: string, displayMode?: boolean }
 */
export function splitMixedLatex(text) {
  if (!text || typeof text !== 'string') return [{ type: 'text', content: '' }]

  const segments = []
  // Match all LaTeX delimiters in order
  const regex = /\\\(([\s\S]*?)\\\)|\$(\d+)|\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$([^$]+?)\$/g

  let lastIdx = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIdx) {
      const textBefore = text.slice(lastIdx, match.index)
      if (textBefore.trim()) segments.push({ type: 'text', content: textBefore })
    }

    const display = match[3] || match[4] // $$...$$ or \[...\]
    const formula = match[1] || match[3] || match[4] || match[5]
    if (formula && formula.trim()) {
      segments.push({
        type: 'latex',
        content: sanitizeLatex(formula),
        displayMode: !!display
      })
    }

    lastIdx = match.index + match[0].length
  }

  // Remaining text after last match
  if (lastIdx < text.length) {
    const remaining = text.slice(lastIdx)
    if (remaining.trim()) segments.push({ type: 'text', content: remaining })
  }

  // If no formulas found, return entire text as single text segment
  if (segments.length === 0 && text.trim()) {
    segments.push({ type: 'text', content: text })
  }

  return segments
}

export default { sanitizeLatex, normalizeLatex, splitMixedLatex, fixLatex }

/**
 * Quick-fix common LaTeX formatting issues.
 * - Strips \(...\) delimiter wrappers
 * - Converts |...| to \left|...\right| (proper absolute/determinant sizing)
 */
export function fixLatex(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/\(\s*/g, '')
    .replace(/\s*\)/g, '')
    .replace(/\|\s*(.*?)\s*\|/g, '\\left|$1\\right|')
}
