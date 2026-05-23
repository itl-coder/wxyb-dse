<template>
  <div class="eda-root">
    <div class="eda-header">
      <h4 class="eda-title">发卷辅助视图</h4>
      <button class="eda-close-btn" @click="$emit('close')">×</button>
    </div>

    <div class="eda-body">
      <!-- 模式切换 -->
      <div class="eda-mode-tabs">
        <button
          class="eda-mode-tab"
          :class="{ 'eda-mode-active': mode === 'subject' }"
          @click="mode = 'subject'"
        >按科目</button>
        <button
          class="eda-mode-tab"
          :class="{ 'eda-mode-active': mode === 'elective' }"
          @click="mode = 'elective'"
        >按选修</button>
      </div>

      <!-- 科目列表 -->
      <div class="eda-item-list" v-if="mode === 'subject'">
        <div
          v-for="item in subjectItems"
          :key="item.name"
          class="eda-item"
          :class="{ 'eda-item-active': activeSubject === item.name }"
          @click="onToggleSubject(item.name)"
        >
          <span class="eda-item-swatch" :style="{ background: item.color }"></span>
          <span class="eda-item-name">{{ item.name }}</span>
          <span class="eda-item-count">{{ item.count }}</span>
        </div>
      </div>

      <!-- 选修列表 -->
      <div class="eda-item-list" v-if="mode === 'elective'">
        <div
          v-for="item in electiveItems"
          :key="item.name"
          class="eda-item"
          :class="{ 'eda-item-active': activeElective === item.name }"
          @click="onToggleElective(item.name)"
        >
          <span class="eda-item-swatch" :style="{ background: item.color }"></span>
          <span class="eda-item-name">{{ item.name }}</span>
          <span class="eda-item-count">{{ item.count }}</span>
        </div>
      </div>

      <!-- 当前高亮信息 -->
      <div class="eda-info" v-if="activeSubject || activeElective">
        <div class="eda-info-row">
          <span class="eda-info-label">当前高亮</span>
          <span class="eda-info-val">{{ activeSubject || activeElective }}</span>
        </div>
        <div class="eda-info-row" v-if="highlightCount > 0">
          <span class="eda-info-label">高亮座位数</span>
          <span class="eda-info-val eda-info-num">{{ highlightCount }}</span>
        </div>
        <button class="eda-clear-btn" @click="clearHighlight">清除高亮</button>
      </div>
      <div class="eda-hint" v-else>
        <p>选择一个科目或选修，座位表上对应考生的格子将以醒目的颜色高亮显示，方便监考老师快速分发试卷。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'

const emit = defineEmits(['close', 'highlightChange'])

const store = useExamSeat2Store()

const mode = ref('subject')
const activeSubject = ref('')
const activeElective = ref('')

const subjectColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
const electiveColors = ['#a78bfa', '#34d399', '#fbbf24', '#f87171', '#c084fc', '#22d3ee', '#f472b6', '#a3e635']

const subjectItems = computed(() => {
  if (!store.selectedRoom) return []
  const map = {}
  const ra = store.assignments.filter(a => a.roomId === store.selectedRoom.id)
  ra.forEach(a => {
    const s = store.students.find(v => v.id === a.studentId)
    if (!s) return
    const subj = s.examSubject || s.subject || '未分类'
    if (!map[subj]) map[subj] = 0
    map[subj]++
  })
  const keys = Object.keys(map).sort()
  return keys.map((k, i) => ({ name: k, count: map[k], color: subjectColors[i % subjectColors.length] }))
})

const electiveItems = computed(() => {
  if (!store.selectedRoom) return []
  const map = {}
  const ra = store.assignments.filter(a => a.roomId === store.selectedRoom.id)
  ra.forEach(a => {
    const s = store.students.find(v => v.id === a.studentId)
    if (!s?.electives?.length) return
    s.electives.forEach(e => {
      if (!map[e]) map[e] = 0
      map[e]++
    })
  })
  const keys = Object.keys(map).sort()
  return keys.map((k, i) => ({ name: k, count: map[k], color: electiveColors[i % electiveColors.length] }))
})

const highlightCount = computed(() => {
  if (!store.selectedRoom) return 0
  const ra = store.assignments.filter(a => a.roomId === store.selectedRoom.id)
  return ra.filter(a => {
    const s = store.students.find(v => v.id === a.studentId)
    if (!s) return false
    if (activeSubject.value) {
      return (s.examSubject || s.subject || '未分类') === activeSubject.value
    }
    if (activeElective.value) {
      return (s.electives || []).includes(activeElective.value)
    }
    return false
  }).length
})

function onToggleSubject(name) {
  activeSubject.value = activeSubject.value === name ? '' : name
  activeElective.value = ''
  notifyChange()
}

function onToggleElective(name) {
  activeElective.value = activeElective.value === name ? '' : name
  activeSubject.value = ''
  notifyChange()
}

function clearHighlight() {
  activeSubject.value = ''
  activeElective.value = ''
  notifyChange()
}

function notifyChange() {
  const seats = new Set()
  if (!store.selectedRoom) {
    emit('highlightChange', { subject: '', elective: '', seats })
    return
  }
  const ra = store.assignments.filter(a => a.roomId === store.selectedRoom.id)
  ra.forEach(a => {
    const s = store.students.find(v => v.id === a.studentId)
    if (!s) return
    let match = false
    if (activeSubject.value && (s.examSubject || s.subject || '未分类') === activeSubject.value) match = true
    if (activeElective.value && (s.electives || []).includes(activeElective.value)) match = true
    if (match) seats.add(a.seatIndex)
  })
  emit('highlightChange', {
    subject: activeSubject.value,
    elective: activeElective.value,
    seats
  })
}

// 当切换教室时清除高亮
watch(() => store.selectedRoomId, () => {
  clearHighlight()
})
</script>

<style scoped>
.eda-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.eda-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--admin-border);
  margin-bottom: 8px;
  flex-shrink: 0;
}
.eda-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-text);
  margin: 0;
}
.eda-close-btn {
  width: 22px; height: 22px;
  border: 1px solid var(--admin-border);
  border-radius: 4px;
  background: transparent;
  color: var(--admin-text-muted);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.eda-close-btn:hover { border-color: var(--admin-danger); color: var(--admin-danger); }

.eda-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eda-mode-tabs {
  display: flex;
  gap: 4px;
}
.eda-mode-tab {
  flex: 1;
  padding: 5px;
  border: 1px solid var(--admin-border);
  border-radius: 5px;
  background: var(--admin-surface);
  color: var(--admin-text-secondary);
  cursor: pointer;
  font-size: 11px;
  font-family: var(--admin-font);
  font-weight: 500;
  transition: all 0.15s;
}
.eda-mode-tab:hover { border-color: var(--admin-border-light); }
.eda-mode-active {
  background: rgba(99,102,241,0.1);
  border-color: var(--admin-accent);
  color: var(--admin-accent-light);
}

.eda-item-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.eda-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.12s;
}
.eda-item:hover { background: var(--admin-surface-hover); }
.eda-item-active {
  background: rgba(99,102,241,0.08);
  border-color: rgba(99,102,241,0.2);
}
.eda-item-swatch {
  width: 8px; height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.eda-item-name {
  font-size: 11px;
  color: var(--admin-text);
  flex: 1;
}
.eda-item-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--admin-text-muted);
  font-family: var(--font-mono, monospace);
}

.eda-info {
  padding: 8px;
  background: rgba(99,102,241,0.06);
  border: 1px solid rgba(99,102,241,0.12);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.eda-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}
.eda-info-label { color: var(--admin-text-muted); }
.eda-info-val { color: var(--admin-text); font-weight: 500; }
.eda-info-num {
  color: var(--admin-accent-light);
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  font-size: 14px;
}
.eda-clear-btn {
  margin-top: 4px;
  padding: 4px 10px;
  border: 1px solid var(--admin-border);
  border-radius: 4px;
  background: var(--admin-surface);
  color: var(--admin-text-muted);
  cursor: pointer;
  font-size: 10px;
  font-family: var(--admin-font);
  align-self: flex-end;
}
.eda-clear-btn:hover { border-color: var(--admin-border-light); color: var(--admin-text); }

.eda-hint {
  font-size: 10px;
  color: var(--admin-text-muted);
  line-height: 1.5;
}
.eda-hint p { margin: 0; }
</style>
