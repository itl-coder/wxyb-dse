<template>
  <div class="concept-block" ref="blockRef">
    <h4>{{ title }}<span v-if="tag" style="color:#d4351c;font-size:0.85em;font-weight:normal"> {{ tag }}</span></h4>
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onUpdated, nextTick } from 'vue'
import katex from 'katex'
import { sanitizeLatex } from '@/utils/latexSanitizer'

defineProps({
  title: { type: String, required: true },
  tag: { type: String, default: '' }
})

const blockRef = ref(null)

function processFormulas() {
  if (!blockRef.value) return

  const walker = document.createTreeWalker(
    blockRef.value,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_ACCEPT
        // Skip nodes inside already-rendered math containers
        if (parent.closest('.formula-box') || parent.closest('.eg-box') ||
            parent.closest('.katex') || parent.closest('.math-renderer') ||
            parent.closest('mjx-container')) {
          return NodeFilter.FILTER_REJECT
        }
        return /\\[\(\[]|\$/.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      }
    }
  )

  const nodesToReplace = []
  let node
  while ((node = walker.nextNode())) {
    nodesToReplace.push(node)
  }

  nodesToReplace.forEach(textNode => {
    const raw = textNode.textContent
    const span = document.createElement('span')

    let html = raw
    // Replace \(...\) and $...$ with rendered inline KaTeX
    // Also handle \[...\] and $$...$$ as display formulas
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, f) => renderDisplay(f))
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, f) => renderDisplay(f))
    html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_, f) => renderInline(f))
    html = html.replace(/\$([^$]+?)\$/g, (_, f) => renderInline(f))

    span.innerHTML = html
    textNode.replaceWith(span)
  })
}

function renderInline(formula) {
  const cleaned = sanitizeLatex(formula.trim())
  if (!cleaned) return ''
  try {
    return katex.renderToString(cleaned, {
      throwOnError: false,
      displayMode: false,
      strict: false,
      trust: true
    })
  } catch {
    return `<span style="color:#ef4444;font-size:11px">⚠️ ${cleaned}</span>`
  }
}

function renderDisplay(formula) {
  const cleaned = sanitizeLatex(formula.trim())
  if (!cleaned) return ''
  try {
    const html = katex.renderToString(cleaned, {
      throwOnError: false,
      displayMode: true,
      strict: false,
      trust: true
    })
    return `<div style="text-align:center;overflow-x:auto;padding:4px 0">${html}</div>`
  } catch {
    return `<div style="text-align:center;color:#ef4444;font-size:11px;padding:4px 0">⚠️ 公式解析失败: ${cleaned}</div>`
  }
}

onMounted(() => { nextTick(() => processFormulas()) })
onUpdated(() => { nextTick(() => processFormulas()) })
</script>
