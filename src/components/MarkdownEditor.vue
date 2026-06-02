<template>
  <div class="md-editor">
    <div class="md-toolbar">
      <button class="md-btn" title="加粗 **text**" @click="wrapText('**', '**')"><b>B</b></button>
      <button class="md-btn" title="斜体 *text*" @click="wrapText('*', '*')"><i>I</i></button>
      <button class="md-btn" title="行内代码 `code`" @click="wrapText('`', '`')">&lt;/&gt;</button>
      <button class="md-btn" title="代码块" @click="insertCodeBlock">```</button>
      <button class="md-btn" title="无序列表" @click="insertList">&#9776;</button>
      <button class="md-btn" title="行内公式 $...$" @click="wrapText('$', '$')">&#8721;</button>
      <button class="md-btn" title="块级公式 $$...$$" @click="insertDisplayMath">&#8499;</button>
      <span style="flex:1"></span>
      <button class="md-btn" :class="{ active: mode === 'edit' }" @click="mode = 'edit'">编辑</button>
      <button class="md-btn" :class="{ active: mode === 'split' }" @click="mode = 'split'">分屏</button>
      <button class="md-btn" :class="{ active: mode === 'preview' }" @click="mode = 'preview'">预览</button>
    </div>
    <div class="md-body" :class="'md-mode-' + mode">
      <textarea
        ref="textareaRef"
        class="md-textarea"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        @input="$emit('update:modelValue', $event.target.value)"
      ></textarea>
      <div v-if="mode !== 'edit'" class="md-preview" v-html="renderedHtml"></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 模块：MarkdownEditor
 * 功能：Markdown 编辑器，支持编辑/分屏/预览三种模式，提供加粗、斜体、代码块、列表、LaTeX 公式等工具栏按钮
 * 使用位置：管理后台中需要编辑富文本内容（含公式）的页面
 */
import { ref, computed } from 'vue'
import { renderRichContent } from '@/utils/renderContent'

const props = defineProps({
  modelValue: { type: String, default: '' },
  rows: { type: Number, default: 8 },
  placeholder: { type: String, default: '支持 Markdown + LaTeX 语法...' }
})

const emit = defineEmits(['update:modelValue'])
const mode = ref('edit')
const textareaRef = ref(null)

const renderedHtml = computed(() => renderRichContent(props.modelValue) || '<span style="color:var(--admin-text-muted)">暂无内容</span>')

function wrapText(before, after) {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const text = props.modelValue
  const selected = text.slice(start, end)
  const newText = text.slice(0, start) + before + selected + after + text.slice(end)
  emit('update:modelValue', newText)
}

function insertCodeBlock() {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const text = props.modelValue
  const newText = text.slice(0, start) + '\n```\n\n```\n' + text.slice(start)
  emit('update:modelValue', newText)
}

function insertDisplayMath() {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const text = props.modelValue
  const prefix = start === 0 || text[start - 1] === '\n' ? '' : '\n'
  const newText = text.slice(0, start) + prefix + '$$\n\n$$\n' + text.slice(start)
  emit('update:modelValue', newText)
}

function insertList() {
  const ta = textareaRef.value
  if (!ta) return
  const start = ta.selectionStart
  const text = props.modelValue
  const prefix = start === 0 || text[start - 1] === '\n' ? '' : '\n'
  const newText = text.slice(0, start) + prefix + '- ' + text.slice(start)
  emit('update:modelValue', newText)
}
</script>

<style scoped>
.md-editor {
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--admin-surface);
}
.md-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: var(--admin-bg);
  border-bottom: 1px solid var(--admin-border);
}
.md-btn {
  width: 30px;
  height: 28px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--admin-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.md-btn:hover {
  background: var(--admin-surface-hover);
  border-color: var(--admin-border);
}
.md-btn.active {
  background: var(--admin-accent);
  color: #fff;
  border-color: var(--admin-accent);
}
.md-body {
  display: grid;
  gap: 0;
}
.md-body.md-mode-edit { grid-template-columns: 1fr; }
.md-body.md-mode-split { grid-template-columns: 1fr 1fr; }
.md-body.md-mode-preview { grid-template-columns: 1fr; }
.md-textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: vertical;
  font-family: 'Fira Code', 'Segoe UI Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.7;
  padding: 10px 12px;
  color: var(--admin-text);
  background: var(--admin-surface);
  min-height: 120px;
}
.md-textarea:focus {
  box-shadow: inset 0 0 0 1px var(--admin-accent);
}
.md-preview {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--admin-text);
  background: var(--admin-surface);
  border-left: 1px solid var(--admin-border);
  overflow-y: auto;
  max-height: 400px;
}
.md-preview :deep(p) { margin: 6px 0; }
.md-preview :deep(ul), .md-preview :deep(ol) { margin: 6px 0; padding-left: 1.5em; }
.md-preview :deep(li) { margin: 2px 0; }
.md-preview :deep(strong) { color: var(--admin-text); font-weight: 600; }
.md-preview :deep(h1), .md-preview :deep(h2), .md-preview :deep(h3) { margin: 12px 0 6px; font-weight: 600; }
.md-preview :deep(blockquote) {
  border-left: 3px solid var(--admin-accent, #6366f1);
  padding-left: 12px;
  margin: 8px 0;
  color: var(--admin-text-secondary);
}
.md-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}
.md-preview :deep(th), .md-preview :deep(td) {
  border: 1px solid var(--admin-border);
  padding: 6px 10px;
  text-align: left;
  font-size: 12px;
}
.md-preview :deep(th) {
  background: var(--admin-bg);
  font-weight: 600;
}
.md-preview :deep(pre) {
  background: var(--admin-bg);
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 11px;
  line-height: 1.6;
}
.md-preview :deep(code) {
  background: var(--admin-bg);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
  font-family: 'Fira Code', 'Segoe UI Mono', 'Consolas', monospace;
}
.md-preview :deep(pre code) { background: none; padding: 0; }
.md-preview :deep(.katex-error) { color: #ef4444; text-decoration: underline wavy rgba(239,68,68,0.4); }
</style>
