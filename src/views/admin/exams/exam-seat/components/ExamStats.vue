<template>
  <div class="exam-stats">
    <div class="stat-card" v-for="(s, i) in stats" :key="s.label" :style="{ animationDelay: i * 0.06 + 's' }">
      <div class="stat-accent" :class="s.accent"></div>
      <div class="stat-body">
        <div class="stat-value" :class="{ warn: s.warn }">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useExamSeatStore } from '@/views/admin/exams/exam-seat/store/examSeatStore.js'

const store = useExamSeatStore()

const stats = computed(() => {
  const items = [
    { label: '学生总数', value: store.totalStudents, accent: 'ink', warn: false },
    { label: '已安排', value: store.assignedCount, accent: 'jade', warn: false },
    { label: '未安排', value: store.unassignedCount, accent: 'amber', warn: store.unassignedCount > 0 },
    { label: '考场教室', value: store.rooms.length, accent: 'gold', warn: false },
    { label: '总座位', value: store.rooms.reduce((s, r) => s + r.rows * r.cols, 0), accent: 'indigo', warn: false }
  ]
  if (store.conflicts.length > 0) {
    items.push({ label: '冲突', value: store.conflicts.length, accent: 'vermillion', warn: true })
  }
  return items
})
</script>

<style scoped>
.exam-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--es-surface);
  border: 1px solid var(--es-border);
  border-radius: var(--es-radius);
  overflow: hidden;
  flex: 1;
  min-width: 130px;
  animation: es-stat-reveal 0.4s ease-out both;
}
.stat-accent {
  width: 3px;
  align-self: stretch;
  flex-shrink: 0;
}
.stat-accent.ink { background: #c9c0b0; }
.stat-accent.jade { background: var(--es-jade); }
.stat-accent.amber { background: var(--es-amber); }
.stat-accent.gold { background: var(--es-gold); }
.stat-accent.indigo { background: var(--es-indigo); }
.stat-accent.vermillion { background: var(--es-vermillion); animation: es-progress-pulse 2s ease-in-out infinite; }
.stat-body {
  padding: 12px 18px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--es-text);
  line-height: 1.1;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-feature-settings: "tnum";
}
.stat-value.warn { color: var(--es-amber); }
.stat-label {
  font-size: 11px;
  color: var(--es-text-secondary);
  margin-top: 3px;
  letter-spacing: 0.5px;
}
</style>
