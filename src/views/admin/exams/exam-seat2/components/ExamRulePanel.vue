<template>
  <div class="erp-root" :class="{ 'erp-collapsed': collapsed }">
    <div class="erp-header" @click="collapsed = !collapsed">
      <div class="erp-header-left">
        <svg class="erp-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span class="erp-title">排座规则说明</span>
      </div>
      <span class="erp-toggle">{{ collapsed ? '展开' : '收起' }}</span>
    </div>
    <div class="erp-body" v-show="!collapsed">
      <div class="erp-tags">
        <span
          v-for="rule in rules"
          :key="rule.key"
          class="erp-tag"
          :class="{ 'erp-tag-active': rule.active, 'erp-tag-inactive': !rule.active }"
        >
          {{ rule.active ? '✓' : '—' }} {{ rule.label }}
        </span>
      </div>
      <div class="erp-conflict-summary" v-if="store.selectedRoom">
        <span class="erp-cs-label">当前考场冲突评分：</span>
        <span class="erp-cs-val" :class="conflictBadgeClass">{{ roomConflictScore }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'

const store = useExamSeat2Store()

const collapsed = ref(false)

const rules = computed(() => [
  { key: 'snake', label: 'S型蛇形排座', active: true },
  { key: 'class_gap', label: '同班间隔1位', active: true },
  { key: 'stagger', label: '优先前后错开', active: true },
  { key: 'exclusive', label: '专属班优先填充', active: true },
  { key: 'reserved_skip', label: '预留位自动跳过', active: true },
  { key: 'blocked_skip', label: '屏蔽位跳过', active: true },
  { key: 'special_first', label: '特殊考生前置', active: true },
  { key: 'conflict_score', label: '最低冲突方案', active: true },
  { key: 'auto_lock', label: '排座后自动锁定', active: true },
])

const roomConflictScore = computed(() => {
  if (!store.selectedRoom) return '—'
  return store.conflictScores?.[store.selectedRoom.id] ?? '—'
})

const conflictBadgeClass = computed(() => {
  const s = roomConflictScore.value
  if (s === '—') return ''
  if (s <= 5) return 'erp-cs-low'
  if (s <= 15) return 'erp-cs-mid'
  return 'erp-cs-high'
})
</script>

<style scoped>
.erp-root {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}
.erp-collapsed {
  opacity: 0.7;
}
.erp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s;
}
.erp-header:hover {
  background: rgba(255,255,255,0.02);
}
.erp-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.erp-icon {
  color: var(--admin-accent-light);
}
.erp-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--admin-text-secondary);
}
.erp-toggle {
  font-size: 10px;
  color: var(--admin-text-muted);
}
.erp-body {
  padding: 6px 10px 10px;
}
.erp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.erp-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;
}
.erp-tag-active {
  background: rgba(99,102,241,0.08);
  color: var(--admin-accent-light);
  border: 1px solid rgba(99,102,241,0.12);
}
.erp-tag-inactive {
  background: transparent;
  color: var(--admin-text-muted);
  border: 1px solid transparent;
  opacity: 0.5;
}
.erp-conflict-summary {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--admin-border);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.erp-cs-label {
  color: var(--admin-text-muted);
}
.erp-cs-val {
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  font-size: 13px;
}
.erp-cs-low { color: var(--admin-success); }
.erp-cs-mid { color: var(--admin-warning); }
.erp-cs-high { color: var(--admin-danger); }
</style>
