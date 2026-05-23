<template>
  <div class="ecp-root">
    <div class="ecp-header">
      <h4 class="ecp-title">冲突检测</h4>
      <span class="ecp-badge" :class="conflictBadgeClass">{{ store.conflicts.length }}</span>
    </div>

    <!-- 评分概览 -->
    <div class="ecp-score-bar" v-if="scoreEntries.length">
      <div
        v-for="entry in scoreEntries"
        :key="entry.roomId"
        class="ecp-score-item"
        :class="{ 'ecp-score-active': entry.roomId === store.selectedRoomId }"
        @click="store.selectRoom(entry.roomId)"
      >
        <span class="ecp-si-name">{{ entry.roomName }}</span>
        <span class="ecp-si-score" :class="entry.scoreClass">{{ entry.score }}</span>
      </div>
    </div>

    <!-- 冲突列表 -->
    <div class="ecp-list" v-if="filteredConflicts.length">
      <div
        v-for="(c, i) in filteredConflicts"
        :key="i"
        class="ecp-item"
        :class="conflictItemClass(c)"
      >
        <div class="ecp-item-head">
          <span class="ecp-type-badge" :class="'ecp-type-' + c.type">{{ typeLabel(c.type) }}</span>
          <span class="ecp-room-tag">{{ c.roomName || '教室' + c.roomId }}</span>
        </div>
        <div class="ecp-item-body">
          <p class="ecp-item-desc">{{ c.description }}</p>
          <div class="ecp-item-seats" v-if="c.seats?.length">
            <span class="ecp-seat-tag" v-for="s in c.seats" :key="s">{{ seatLabel(c.roomId, s) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ecp-empty" v-else-if="store.assignments.length">
      <span class="ecp-empty-glyph">✓</span>
      <p>无冲突，安排合理</p>
    </div>
    <div class="ecp-empty" v-else>
      <p>暂无排座数据</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'

const store = useExamSeat2Store()

const conflictTypeLabels = {
  sameClassAdjacent: '同班相邻',
  sameElectiveAdjacent: '同选相邻',
  sameClassAdjacentVertical: '同班前后',
  crossRoomDuplicate: '跨室重复',
  exclusiveViolation: '专属违规'
}

function typeLabel(type) {
  return conflictTypeLabels[type] || type
}

const scoreEntries = computed(() => {
  if (!store.conflictScores) return []
  return Object.entries(store.conflictScores).map(([roomId, score]) => {
    const room = store.rooms.find(r => r.id === parseInt(roomId))
    return {
      roomId: parseInt(roomId),
      roomName: room?.name || '教室' + roomId,
      score,
      scoreClass: score <= 5 ? 'ecp-low' : score <= 15 ? 'ecp-mid' : 'ecp-high'
    }
  }).sort((a, b) => b.score - a.score)
})

const filteredConflicts = computed(() => {
  if (!store.selectedRoom) return store.conflicts
  return store.conflicts.filter(c => c.roomId === store.selectedRoom.id)
})

function conflictItemClass(c) {
  return {
    'ecp-item-critical': c.type === 'exclusiveViolation' || c.type === 'crossRoomDuplicate',
    'ecp-item-warn': c.type === 'sameClassAdjacent',
    'ecp-item-info': c.type === 'sameElectiveAdjacent' || c.type === 'sameClassAdjacentVertical'
  }
}

function seatLabel(roomId, seatIndex) {
  const room = store.rooms.find(r => r.id === roomId)
  if (!room) return '#' + seatIndex
  const r = Math.floor((seatIndex - 1) / room.cols) + 1
  const c = ((seatIndex - 1) % room.cols) + 1
  return String.fromCharCode(64 + c) + r
}

const conflictBadgeClass = computed(() => {
  const n = store.conflicts.length
  if (n === 0) return 'ecp-badge-ok'
  if (n <= 3) return 'ecp-badge-warn'
  return 'ecp-badge-bad'
})
</script>

<style scoped>
.ecp-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ecp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--admin-border);
  margin-bottom: 8px;
  flex-shrink: 0;
}
.ecp-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-text);
  margin: 0;
}
.ecp-badge {
  font-size: 12px;
  font-weight: 700;
  min-width: 22px;
  text-align: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-family: var(--font-mono, monospace);
}
.ecp-badge-ok { background: rgba(16,185,129,0.1); color: #10b981; }
.ecp-badge-warn { background: rgba(245,158,11,0.1); color: #f59e0b; }
.ecp-badge-bad { background: rgba(239,68,68,0.1); color: #ef4444; }

/* 评分条 */
.ecp-score-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--admin-border);
  margin-bottom: 8px;
  flex-shrink: 0;
}
.ecp-score-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--admin-border);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 10px;
}
.ecp-score-item:hover { border-color: var(--admin-border-light); background: var(--admin-surface-hover); }
.ecp-score-active { border-color: var(--admin-accent); background: rgba(99,102,241,0.06); }
.ecp-si-name {
  color: var(--admin-text-secondary);
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ecp-si-score {
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}
.ecp-low { color: var(--admin-success); }
.ecp-mid { color: var(--admin-warning); }
.ecp-high { color: var(--admin-danger); }

/* 冲突列表 */
.ecp-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ecp-item {
  padding: 6px 8px;
  border-radius: 5px;
  border: 1px solid var(--admin-border);
  background: var(--admin-surface);
}
.ecp-item-critical { border-left: 3px solid #ef4444; }
.ecp-item-warn { border-left: 3px solid #f59e0b; }
.ecp-item-info { border-left: 3px solid #6366f1; }

.ecp-item-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
.ecp-type-badge {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}
.ecp-type-sameClassAdjacent { background: rgba(245,158,11,0.12); color: #f59e0b; }
.ecp-type-sameElectiveAdjacent { background: rgba(99,102,241,0.1); color: #818cf8; }
.ecp-type-sameClassAdjacentVertical { background: rgba(99,102,241,0.08); color: #818cf8; }
.ecp-type-crossRoomDuplicate { background: rgba(239,68,68,0.12); color: #ef4444; }
.ecp-type-exclusiveViolation { background: rgba(239,68,68,0.12); color: #ef4444; }
.ecp-room-tag {
  font-size: 9px;
  color: var(--admin-text-muted);
  margin-left: auto;
}
.ecp-item-body {
  font-size: 10px;
  color: var(--admin-text-secondary);
}
.ecp-item-desc {
  margin: 0;
  line-height: 1.4;
}
.ecp-item-seats {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
}
.ecp-seat-tag {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--admin-border);
  color: var(--admin-text-muted);
  font-family: var(--font-mono, monospace);
}

.ecp-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--admin-text-muted);
  font-size: 12px;
}
.ecp-empty-glyph {
  font-size: 28px;
  margin-bottom: 6px;
  opacity: 0.3;
}
.ecp-empty p { margin: 0; }
</style>
