<template>
  <div class="fc">
    <div v-if="!formula" class="fc-empty">
      <div class="fc-empty-icon">📐</div>
      <p>请从左侧选择公式开始学习</p>
    </div>
    <template v-else>
      <div class="fc-header">
        <h2 class="fc-title">{{ formula.label }}</h2>
        <div v-if="formula.tags" class="fc-tags">
          <span v-for="t in formula.tags" :key="t" class="fc-tag">{{ t }}</span>
        </div>
      </div>

      <p v-if="formula.description" class="fc-desc">{{ formula.description }}</p>

      <!-- Main Formula Display -->
      <div v-if="formula.formula" class="fc-formula-card">
        <div class="fc-formula-label">公式定义</div>
        <div class="fc-formula-render" v-html="renderedFormula"></div>
      </div>

      <!-- Variants / Cases -->
      <div v-if="formula.variants && formula.variants.length" class="fc-section">
        <h3 class="fc-section-title">形式变体</h3>
        <div v-for="(v, i) in formula.variants" :key="i" class="fc-variant">
          <span class="fc-variant-label">{{ v.label || `变体 ${i + 1}` }}</span>
          <span class="fc-variant-formula" v-html="renderInlineLatex(v.formula)"></span>
        </div>
      </div>

      <!-- Derivation Steps -->
      <div v-if="formula.derivation && formula.derivation.length" class="fc-section">
        <h3 class="fc-section-title">推导过程</h3>
        <div class="fc-steps">
          <div v-for="(step, i) in formula.derivation" :key="i" class="fc-step">
            <div class="fc-step-num">{{ i + 1 }}</div>
            <div class="fc-step-content">
              <div class="fc-step-text">{{ step.text }}</div>
              <div v-if="step.formula" class="fc-step-formula" v-html="renderInlineLatex(step.formula)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Points -->
      <div v-if="formula.keyPoints && formula.keyPoints.length" class="fc-section">
        <h3 class="fc-section-title">关键要点</h3>
        <ul class="fc-keypoints">
          <li v-for="(kp, i) in formula.keyPoints" :key="i">{{ kp }}</li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useKatex } from '@/composables/useKatex'

const props = defineProps({
  formula: { type: Object, default: null }
})

const { renderBlock, renderInline } = useKatex()

const renderedFormula = computed(() => {
  if (!props.formula?.formula) return ''
  return renderBlock(props.formula.formula)
})

function renderInlineLatex(text) {
  if (!text) return ''
  return renderInline(text)
}
</script>

<style scoped>
.fc {
  height: 100%;
}

.fc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--admin-text-muted);
  gap: 12px;
}

.fc-empty-icon { font-size: 48px; opacity: 0.4; }

.fc-empty p { font-size: 13px; margin: 0; }

.fc-header {
  margin-bottom: 12px;
}

.fc-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: var(--admin-text);
}

.fc-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.fc-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--admin-accent, #6366f1);
  font-weight: 500;
}

.fc-desc {
  font-size: 13px;
  color: var(--admin-text-secondary);
  line-height: 1.7;
  margin: 0 0 16px;
}

.fc-formula-card {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.fc-formula-label {
  font-size: 10px;
  color: var(--admin-text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.fc-formula-render {
  display: flex;
  justify-content: center;
}

.fc-section {
  margin-bottom: 20px;
}

.fc-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--admin-border);
}

.fc-variant {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: var(--admin-bg);
  border-radius: 6px;
}

.fc-variant-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--admin-text-secondary);
  flex-shrink: 0;
  min-width: 50px;
}

.fc-variant-formula { overflow-x: auto; }

.fc-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fc-step {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  background: var(--admin-bg);
  border-radius: 8px;
  border-left: 3px solid var(--admin-accent, #6366f1);
}

.fc-step-num {
  width: 22px; height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-accent, #6366f1);
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.fc-step-content {
  flex: 1;
  min-width: 0;
}

.fc-step-text {
  font-size: 12px;
  color: var(--admin-text);
  line-height: 1.7;
  margin-bottom: 4px;
}

.fc-step-formula { overflow-x: auto; }

.fc-keypoints {
  margin: 0;
  padding-left: 1.2em;
}

.fc-keypoints li {
  font-size: 12px;
  color: var(--admin-text);
  line-height: 1.8;
  margin-bottom: 4px;
}

.fc-keypoints li::marker {
  color: var(--admin-accent, #6366f1);
}
</style>
