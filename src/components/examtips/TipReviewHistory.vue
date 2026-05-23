<template>
  <div class="trh-root" v-if="history.length">
    <div class="trh-title">审核记录</div>
    <div class="trh-timeline">
      <div v-for="(entry, i) in history" :key="i" class="trh-entry">
        <div class="trh-dot" :class="actionClass(entry.action)"></div>
        <div class="trh-line" v-if="i < history.length - 1"></div>
        <div class="trh-body">
          <div class="trh-action">{{ actionLabel(entry.action) }}</div>
          <div class="trh-meta">
            <span>审核人：{{ entry.reviewedBy || '系统' }}</span>
            <span>{{ entry.reviewedAt }}</span>
          </div>
          <div v-if="entry.action === 'rejected' && entry.comment" class="trh-comment">
            驳回原因：{{ entry.comment }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  history: { type: Array, default: () => [] }
})

const actionLabels = {
  draft: '保存草稿',
  pending: '提交审核',
  approved: '审核通过',
  rejected: '审核驳回',
  resubmitted: '重新提交'
}

function actionLabel(action) {
  return actionLabels[action] || action
}

function actionClass(action) {
  return {
    draft: 'trh-draft',
    pending: 'trh-pending',
    approved: 'trh-approved',
    rejected: 'trh-rejected',
    resubmitted: 'trh-resubmitted'
  }[action] || ''
}
</script>

<style scoped>
.trh-root {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--admin-border, rgba(255,255,255,0.06));
}

.trh-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--admin-text-muted, #64748b);
  margin-bottom: 10px;
}

.trh-timeline {
  position: relative;
  padding-left: 20px;
}

.trh-entry {
  position: relative;
  padding-bottom: 12px;
}

.trh-dot {
  position: absolute;
  left: -20px;
  top: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--admin-border, rgba(255,255,255,0.08));
  background: var(--admin-surface, #1e293b);
  z-index: 1;
}

.trh-dot.trh-draft { border-color: #909399; background: #909399; }
.trh-dot.trh-pending { border-color: #e6a23c; background: #e6a23c; }
.trh-dot.trh-approved { border-color: #67c23a; background: #67c23a; }
.trh-dot.trh-rejected { border-color: #f56c6c; background: #f56c6c; }
.trh-dot.trh-resubmitted { border-color: #e6a23c; background: #e6a23c; }

.trh-line {
  position: absolute;
  left: -16px;
  top: 14px;
  bottom: 0;
  width: 2px;
  background: var(--admin-border, rgba(255,255,255,0.06));
}

.trh-body {
  font-size: 11px;
  color: var(--admin-text-secondary, #94a3b8);
}

.trh-action {
  font-weight: 600;
  color: var(--admin-text, #e2e8f0);
  margin-bottom: 2px;
}

.trh-meta {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: var(--admin-text-muted, #64748b);
}

.trh-comment {
  margin-top: 4px;
  padding: 6px 8px;
  background: rgba(245, 108, 108, 0.08);
  border-radius: 4px;
  font-size: 10px;
  color: #f56c6c;
  line-height: 1.5;
}
</style>
