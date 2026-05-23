<template>
  <div
    ref="containerRef"
    class="math-renderer"
    :class="{
      'math-renderer-display': displayMode,
      'math-renderer-inline': !displayMode,
      'math-renderer-error': hasError,
      'math-renderer-loading': isLoading
    }"
    :style="displayMode ? '' : 'display:inline-block;vertical-align:middle'"
  >
    <!-- Error state -->
    <div v-if="hasError" class="math-error-fallback">
      <div class="math-error-msg">
        <span class="math-error-icon">⚠️</span>
        <span>公式解析失败，请检查语法</span>
      </div>
      <code class="math-error-source">{{ sanitizedFormula }}</code>
    </div>

    <!-- Loading state (MathJax async) -->
    <div v-else-if="isLoading" class="math-loading">
      <span class="math-loading-spinner" />
    </div>

    <!-- Rendered formula (KaTeX HTML or MathJax HTML) -->
    <div v-else v-html="renderedHtml" />
  </div>
</template>

<script setup>
/**
 * 模块：MathRenderer
 * 功能：LaTeX 公式渲染组件，使用 KaTeX 渲染并支持 MathJax 降级，含加载态/错误态/防抖处理
 * 使用位置：各页面中需要渲染数学公式的位置，被 KatexDisplay 等组件封装调用
 */
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import katex from 'katex'
import { sanitizeLatex } from '@/utils/latexSanitizer'

const props = defineProps({
  formula: { type: String, default: '' },
  /** Force display (block) mode */
  displayMode: { type: Boolean, default: false },
  /** Enable MathJax fallback for complex formulas */
  fallback: { type: Boolean, default: true },
  /** Debounce delay in ms */
  debounceMs: { type: Number, default: 120 }
})

const emit = defineEmits(['rendered', 'error'])

// ---- State ----
const containerRef = ref(null)
const renderedHtml = ref('')
const hasError = ref(false)
const isLoading = ref(false)
const renderId = ref(0)
let debounceTimer = null
let mathjaxReady = false
let mathjaxInitPromise = null

// ---- Computed ----
const sanitizedFormula = computed(() => sanitizeLatex(props.formula || ''))

// ---- MathJax lazy loader ----
function initMathJax() {
  if (mathjaxInitPromise) return mathjaxInitPromise
  mathjaxInitPromise = (async () => {
    try {
      const mj = await import('mathjax')
      await mj.mathjax.init({
        loader: { load: ['input/tex', 'output/chtml'] },
        tex: { packages: { '[+]': ['ams', 'boldsymbol', 'color', 'enclose', 'extpfeil', 'html'] } },
        chtml: { fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2' }
      })
      mathjaxReady = true
      return mj.mathjax
    } catch (err) {
      console.warn('[MathRenderer] MathJax init failed:', err.message)
      return null
    }
  })()
  return mathjaxInitPromise
}

// ---- KaTeX render (sync) ----
function renderWithKatex(formula, display) {
  return katex.renderToString(formula, {
    throwOnError: true,
    displayMode: display,
    strict: false,
    trust: true,
    output: 'html'
  })
}

// ---- MathJax render (async) ----
async function renderWithMathJax(formula, display) {
  const mj = await initMathJax()
  if (!mj) throw new Error('MathJax 不可用')
  const node = await mj.tex2chtmlPromise(formula, {
    display,
    em: 14,
    ex: 7
  })
  // Convert MathJax DOM node to HTML string
  const container = document.createElement('div')
  container.appendChild(node)
  return container.innerHTML
}

// ---- Complexity detection ----
function isComplexFormula(formula) {
  const complexPatterns = [
    /\\begin\{matrix\}/, /\\begin\{pmatrix\}/, /\\begin\{bmatrix\}/,
    /\\begin\{cases\}/, /\\begin\{aligned\}/, /\\begin\{align\}/,
    /\\begin\{array\}/, /\\begin\{gathered\}/, /\\begin\{split\}/,
    /\\xrightarrow/, /\\xleftarrow/, /\\overset/, /\\underset/,
    /\\substack/, /\\genfrac/, /\\hdashline/, /\\multicol/
  ]
  return complexPatterns.some(p => p.test(formula))
}

// ---- Main render function ----
async function doRender(formula, display, id) {
  if (!formula) {
    renderedHtml.value = ''
    hasError.value = false
    isLoading.value = false
    return
  }

  // Step 1: Try KaTeX (fast, synchronous)
  try {
    const html = renderWithKatex(formula, display)
    // Check if this render is still current (stale guard)
    if (id !== renderId.value) return
    renderedHtml.value = html
    hasError.value = false
    isLoading.value = false
    emit('rendered', { engine: 'katex', formula })
    return
  } catch (katexErr) {
    // KaTeX failed — try MathJax fallback if enabled and formula is complex
    if (!props.fallback || !isComplexFormula(formula)) {
      if (id !== renderId.value) return
      // No fallback or simple formula — show error
      renderedHtml.value = ''
      hasError.value = true
      isLoading.value = false
      emit('error', { engine: 'katex', error: katexErr.message, formula })
      return
    }
  }

  // Step 2: Try MathJax (async, heavy)
  if (id !== renderId.value) return
  isLoading.value = true
  hasError.value = false

  try {
    const html = await renderWithMathJax(formula, display)
    if (id !== renderId.value) return
    renderedHtml.value = html
    hasError.value = false
    isLoading.value = false
    emit('rendered', { engine: 'mathjax', formula })
  } catch (mjErr) {
    if (id !== renderId.value) return
    renderedHtml.value = ''
    hasError.value = true
    isLoading.value = false
    emit('error', { engine: 'mathjax', error: mjErr.message, formula })
  }
}

// ---- Debounced re-render ----
function scheduleRender() {
  const formula = sanitizedFormula.value
  const display = props.displayMode

  // Clear previous timer
  if (debounceTimer) clearTimeout(debounceTimer)

  // Empty formula — clear immediately
  if (!formula) {
    renderId.value++
    renderedHtml.value = ''
    hasError.value = false
    isLoading.value = false
    return
  }

  debounceTimer = setTimeout(async () => {
    const id = ++renderId.value
    // Clear previous HTML to prevent accumulation
    renderedHtml.value = ''
    isLoading.value = false
    hasError.value = false

    await nextTick()
    if (id !== renderId.value) return // Stale guard
    await doRender(formula, display, id)
  }, props.debounceMs)
}

// ---- Watch formula changes ----
watch(
  () => [props.formula, props.displayMode],
  () => scheduleRender(),
  { immediate: true }
)

// ---- Cleanup ----
onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  renderId.value = -1 // Invalidate all pending renders
})

// ---- Public API (exposed for parent components) ----
defineExpose({
  getSanitized: () => sanitizedFormula.value,
  getHasError: () => hasError.value,
  getEngine: () => renderedHtml.value ? (hasError.value ? 'none' : 'katex') : 'none'
})
</script>

<style scoped>
.math-renderer {
  font-family: 'KaTeX_Main', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  line-height: 1.6;
}
.math-renderer-display {
  display: block;
  text-align: center;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0;
  max-width: 100%;
  scrollbar-width: thin;
}
.math-renderer-inline {
  display: inline-block;
  vertical-align: middle;
}

/* Error fallback */
.math-renderer-error {
  display: inline-block;
  border: 1px dashed #ef4444;
  border-radius: 6px;
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.06);
}
.math-error-fallback {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.math-error-msg {
  font-size: 12px;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 4px;
}
.math-error-icon {
  font-size: 14px;
}
.math-error-source {
  font-size: 11px;
  color: var(--admin-text-muted, #888);
  background: rgba(0, 0, 0, 0.04);
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  max-width: 400px;
  overflow-x: auto;
  white-space: pre-wrap;
}

/* Loading */
.math-loading {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
}
.math-loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--admin-border, #ddd);
  border-top-color: var(--admin-accent, #6366f1);
  border-radius: 50%;
  animation: math-spin 0.6s linear infinite;
}
@keyframes math-spin {
  to { transform: rotate(360deg); }
}

/* KaTeX/MathJax rendered content overrides */
.math-renderer :deep(.katex) {
  font-size: 1em;
}
.math-renderer-display :deep(.katex) {
  font-size: 1.1em;
}
.math-renderer :deep(.katex-display) {
  margin: 0.5em 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}
.math-renderer :deep(mjx-container) {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
}

/* Mobile: allow horizontal scroll for long formulas */
@media (max-width: 640px) {
  .math-renderer-display {
    font-size: 0.95em;
  }
  .math-renderer :deep(.katex),
  .math-renderer-display :deep(.katex) {
    font-size: 0.95em;
  }
}
</style>
