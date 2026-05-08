import { nextTick } from 'vue'
import katex from 'katex'

export function useKatex() {
  const renderMath = async (el) => {
    await nextTick()
    if (!el) return
    try {
      // 查找所有 KaTeX 公式标记并逐一渲染
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
      const textNodes = []
      while (walker.nextNode()) textNodes.push(walker.currentNode)

      textNodes.forEach(node => {
        const content = node.textContent
        // 替换行内公式 \(...\)
        const replaced = content.replace(/\\\((.+?)\\\)/g, (_, formula) => {
          try {
            return katex.renderToString(formula, { throwOnError: false, displayMode: false })
          } catch { return _ }
        })
        if (replaced !== content) {
          const span = document.createElement('span')
          span.innerHTML = replaced
          node.parentNode.replaceChild(span, node)
        }
      })
    } catch (e) {
      console.warn('KaTeX render error:', e)
    }
  }
  return { renderMath }
}
