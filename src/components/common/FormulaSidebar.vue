<template>
  <div class="fsb">
    <div v-if="!formula" class="fsb-empty">
      <p>选择公式查看详情</p>
    </div>
    <template v-else>
      <!-- Example -->
      <div v-if="formula.examples && formula.examples.length" class="fsb-block">
        <h4 class="fsb-block-title">📝 例题</h4>
        <div v-for="(ex, i) in formula.examples" :key="i" class="fsb-example">
          <div class="fsb-example-q">{{ ex.question }}</div>
          <div v-if="ex.solution" class="fsb-example-s" v-html="renderInlineLatex(ex.solution)"></div>
        </div>
      </div>

      <!-- Related Formulas -->
      <div v-if="formula.related && formula.related.length" class="fsb-block">
        <h4 class="fsb-block-title">🔗 相关公式</h4>
        <div class="fsb-related-list">
          <button
            v-for="r in formula.related"
            :key="r.id"
            class="fsb-related-item"
            @click="$emit('navigate', r.id)"
          >
            <span class="fsb-related-name">{{ r.label }}</span>
            <span class="fsb-related-arrow">→</span>
          </button>
        </div>
      </div>

      <!-- Common Mistakes -->
      <div v-if="formula.mistakes && formula.mistakes.length" class="fsb-block">
        <h4 class="fsb-block-title">⚠ 常见错误</h4>
        <div v-for="(m, i) in formula.mistakes" :key="i" class="fsb-mistake">
          <div class="fsb-mistake-wrong" v-html="renderInlineLatex(m.wrong)"></div>
          <div class="fsb-mistake-arrow">↓ 正确应为</div>
          <div class="fsb-mistake-correct" v-html="renderInlineLatex(m.correct)"></div>
          <div v-if="m.note" class="fsb-mistake-note">{{ m.note }}</div>
        </div>
      </div>

      <!-- Applications -->
      <div v-if="formula.applications && formula.applications.length" class="fsb-block">
        <h4 class="fsb-block-title">💡 应用场景</h4>
        <div v-for="(app, i) in formula.applications" :key="i" class="fsb-app">
          <span class="fsb-app-icon">{{ app.icon || '◆' }}</span>
          <span>{{ app.text }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useKatex } from '@/composables/useKatex'

const props = defineProps({
  formula: { type: Object, default: null }
})

defineEmits(['navigate'])

const { renderInline } = useKatex()

function renderInlineLatex(text) {
  if (!text) return ''
  return renderInline(text)
}
</script>

<style scoped>
.fsb {
  height: 100%;
  overflow-y: auto;
}

.fsb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--admin-text-muted);
  font-size: 12px;
}

.fsb-block {
  margin-bottom: 20px;
}

.fsb-block-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--admin-text);
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--admin-border);
}

.fsb-example {
  margin-bottom: 10px;
  padding: 10px;
  background: var(--admin-bg);
  border-radius: 8px;
}

.fsb-example-q {
  font-size: 12px;
  color: var(--admin-text);
  line-height: 1.7;
  margin-bottom: 6px;
  font-weight: 500;
}

.fsb-example-s {
  font-size: 12px;
  color: var(--admin-accent, #6366f1);
  overflow-x: auto;
}

.fsb-related-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fsb-related-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 8px;
  border: none;
  background: transparent;
  color: var(--admin-text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.15s;
}

.fsb-related-item:hover {
  background: var(--admin-surface-hover);
  color: var(--admin-accent, #6366f1);
}

.fsb-related-name { text-align: left; }

.fsb-related-arrow {
  font-size: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.fsb-related-item:hover .fsb-related-arrow { opacity: 1; }

.fsb-mistake {
  margin-bottom: 10px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: 8px;
}

.fsb-mistake-wrong {
  font-size: 12px;
  color: #ef4444;
  overflow-x: auto;
  margin-bottom: 4px;
  text-decoration: line-through;
  text-decoration-color: rgba(239, 68, 68, 0.3);
}

.fsb-mistake-arrow {
  font-size: 10px;
  color: var(--admin-text-muted);
  margin-bottom: 4px;
}

.fsb-mistake-correct {
  font-size: 12px;
  color: #22c55e;
  overflow-x: auto;
  margin-bottom: 4px;
}

.fsb-mistake-note {
  font-size: 10px;
  color: var(--admin-text-muted);
  line-height: 1.5;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(239, 68, 68, 0.08);
}

.fsb-app {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 11px;
  color: var(--admin-text-secondary);
  line-height: 1.6;
  margin-bottom: 4px;
  padding: 4px 0;
}

.fsb-app-icon {
  flex-shrink: 0;
  font-size: 8px;
  color: var(--admin-accent, #6366f1);
}
</style>
