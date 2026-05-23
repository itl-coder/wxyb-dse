<template>
  <el-drawer
    v-model="visible"
    title="审核做题技巧"
    size="480px"
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <div class="trp-body">
      <!-- Tip Info -->
      <div class="trp-section">
        <div class="trp-label">技巧信息</div>
        <div class="trp-info-grid">
          <div class="trp-info-item">
            <span class="trp-k">科目</span>
            <span class="trp-v">{{ tip.subject }}</span>
          </div>
          <div class="trp-info-item">
            <span class="trp-k">题型</span>
            <span class="trp-v">{{ tip.questionType }}</span>
          </div>
          <div class="trp-info-item">
            <span class="trp-k">状态</span>
            <span class="admin-tag" :class="statusClass(tip.status)">{{ statusLabel(tip.status) }}</span>
          </div>
          <div class="trp-info-item">
            <span class="trp-k">提交者</span>
            <span class="trp-v">{{ tip.createdBy || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Title -->
      <div class="trp-section">
        <div class="trp-label">技巧标题</div>
        <div class="trp-title">{{ tip.techniqueTitle }}</div>
      </div>

      <!-- Content (read-only) -->
      <div class="trp-section">
        <div class="trp-label">技巧内容</div>
        <div class="trp-content" v-html="renderedContent"></div>
      </div>

      <!-- Review History -->
      <div class="trp-section">
        <TipReviewHistory :history="tip.reviewHistory || []" />
      </div>

      <!-- Review Actions -->
      <div class="trp-section" v-if="tip.status === 'pending'">
        <div class="trp-label">审核操作</div>
        <div class="trp-actions">
          <el-input
            v-model="reviewComment"
            type="textarea"
            :rows="2"
            placeholder="驳回时请填写原因（通过可不填）"
            size="small"
          />
          <div class="trp-btns">
            <el-button size="small" type="success" @click="handleApprove" :loading="submitting">
              通过
            </el-button>
            <el-button size="small" type="danger" @click="handleReject" :loading="submitting">
              驳回
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import TipReviewHistory from './TipReviewHistory.vue'
import { marked } from 'marked'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tip: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'approved', 'rejected'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const reviewComment = ref('')
const submitting = ref(false)

function resetForm() {
  reviewComment.value = ''
  submitting.value = false
}

const statusLabelMap = { draft: '草稿', pending: '待审核', approved: '已通过', rejected: '已拒绝' }
function statusLabel(s) { return statusLabelMap[s] || s }
function statusClass(s) {
  return { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'info'
}

const renderedContent = computed(() => {
  if (!props.tip.content) return '<p style="color:#999">暂无内容</p>'
  return marked.parse(props.tip.content)
})

function handleApprove() {
  submitting.value = true
  emit('approved', { comment: reviewComment.value })
  visible.value = false
  ElMessage.success('已通过审核')
}

function handleReject() {
  if (!reviewComment.value.trim()) {
    ElMessage.warning('驳回时请填写驳回原因')
    submitting.value = false
    return
  }
  submitting.value = true
  emit('rejected', { comment: reviewComment.value })
  visible.value = false
  ElMessage.success('已驳回')
}
</script>

<style scoped>
.trp-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.trp-section {
  /* spacing handled by parent gap */
}

.trp-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--admin-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.trp-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.trp-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trp-k {
  font-size: 11px;
  color: var(--admin-text-muted, #64748b);
  min-width: 40px;
}

.trp-v {
  font-size: 12px;
  color: var(--admin-text, #e2e8f0);
  font-weight: 500;
}

.trp-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text, #e2e8f0);
  line-height: 1.5;
}

.trp-content {
  font-size: 12px;
  line-height: 1.8;
  color: var(--admin-text-secondary, #94a3b8);
  max-height: 360px;
  overflow-y: auto;
  padding: 12px;
  background: var(--admin-bg, #0f172a);
  border-radius: 6px;
  border: 1px solid var(--admin-border, rgba(255,255,255,0.06));
}

.trp-content :deep(h1), .trp-content :deep(h2), .trp-content :deep(h3) {
  color: var(--admin-text, #e2e8f0);
  margin: 12px 0 6px;
  font-size: 14px;
}

.trp-content :deep(p) { margin: 4px 0; }
.trp-content :deep(ul), .trp-content :deep(ol) { padding-left: 1.5em; }
.trp-content :deep(blockquote) {
  border-left: 3px solid var(--admin-accent, #c9a050);
  padding: 4px 12px;
  margin: 6px 0;
  background: rgba(201,160,80,0.06);
}

.trp-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trp-btns {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
