<template>
  <MathRenderer
    :formula="text"
    :display-mode="!inline"
    :fallback="true"
    :debounce-ms="80"
    class="katex-display"
  />
</template>

<script setup>
/**
 * 模块：KatexDisplay
 * 功能：MathRenderer 的轻量封装，提供更简洁的 text + inline 属性接口，用于页面中快速嵌入 LaTeX 公式
 * 使用位置：各页面中需要展示行内或块级公式的位置
 */
import MathRenderer from '@/components/common/MathRenderer.vue'

defineProps({
  text: { type: String, default: '' },
  inline: { type: Boolean, default: false }
})
</script>

<style scoped>
.katex-display {
  line-height: 1.8;
}
.katex-display :deep(p) { margin: 8px 0; }
.katex-display :deep(ul), .katex-display :deep(ol) { margin: 6px 0; padding-left: 1.5em; }
.katex-display :deep(li) { margin: 2px 0; }
.katex-display :deep(strong) { font-weight: 600; }
.katex-display :deep(pre) {
  background: var(--admin-bg, #f5f5f5);
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.6;
}
.katex-display :deep(code) {
  background: var(--admin-bg, #f0f0f0);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Fira Code', 'Segoe UI Mono', 'Consolas', monospace;
}
.katex-display :deep(pre code) { background: none; padding: 0; }
.katex-display :deep(.katex-error) { color: #ef4444; }
.katex-display :deep(h1), .katex-display :deep(h2), .katex-display :deep(h3) {
  margin: 12px 0 6px;
  font-weight: 600;
}
.katex-display :deep(blockquote) {
  border-left: 3px solid var(--admin-accent, #6366f1);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--admin-text-secondary, #666);
}
</style>
