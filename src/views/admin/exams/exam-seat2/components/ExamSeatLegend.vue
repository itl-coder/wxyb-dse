<template>
  <div class="esl-root">
    <span
      v-for="item in legendItems"
      :key="item.label"
      class="esl-item"
    >
      <span class="esl-swatch" :class="item.cls"></span>
      <span class="esl-label">{{ item.label }}</span>
    </span>
  </div>
</template>

<script setup>
const legendItems = [
  { label: '已占', cls: 'esl-occupied' },
  { label: '空位', cls: 'esl-empty' },
  { label: '锁定', cls: 'esl-locked' },
  { label: '预留', cls: 'esl-reserved' },
  { label: '外班预留', cls: 'esl-ext-reserved' },
  { label: '屏蔽', cls: 'esl-blocked' },
  { label: '缺考', cls: 'esl-absent' },
  { label: '特殊', cls: 'esl-special' },
  { label: '专属', cls: 'esl-exclusive' },
  { label: '冲突', cls: 'esl-conflict' }
]
</script>

<style scoped>
.esl-root {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 6px 0;
}
.esl-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--admin-text-secondary);
}
.esl-swatch {
  width: 10px; height: 10px;
  border-radius: 2px;
  display: inline-block;
  border: 1px solid rgba(255,255,255,0.08);
}
.esl-occupied { background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)); border-color: var(--admin-border-light); }
.esl-empty { background: rgba(255,255,255,0.02); border-color: var(--admin-border); }
.esl-locked { background: rgba(99,102,241,0.15); border-left: 2px solid #6366f1; border-color: rgba(99,102,241,0.2); }
.esl-reserved { background: rgba(251,146,60,0.15); border-left: 2px solid #f97316; border-color: rgba(251,146,60,0.22); }
.esl-ext-reserved { background: rgba(234,88,12,0.15); border-left: 2px solid #ea580c; border-color: rgba(234,88,12,0.22); }
.esl-blocked { background: rgba(0,0,0,0.1); border-color: var(--admin-border); }
.esl-absent { background: rgba(239,68,68,0.12); border-left: 2px solid #ef4444; border-color: rgba(239,68,68,0.25); }
.esl-special { background: rgba(245,158,11,0.12); border-left: 2px solid #f59e0b; border-color: rgba(245,158,11,0.25); }
.esl-exclusive { background: rgba(16,185,129,0.08); border-left: 2px solid #10b981; border-color: rgba(16,185,129,0.15); }
.esl-conflict { background: rgba(239,68,68,0.08); border-left: 2px solid #ef4444; border-color: rgba(239,68,68,0.2); }
</style>
