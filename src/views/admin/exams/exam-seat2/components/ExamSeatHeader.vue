<template>
  <div class="esh-root">
    <h2 class="esh-exam-name" v-if="store.examName">{{ store.examName }}</h2>
    <h2 class="esh-exam-name" v-else>考试座位安排</h2>

    <div class="esh-meta-row" v-if="store.selectedRoom">
      <div class="esh-meta-group">
        <span class="esh-room-name">{{ store.selectedRoom.name }}</span>
        <span class="esh-meta-sep">·</span>
        <span>{{ store.selectedRoom.rows }} × {{ store.selectedRoom.cols }} 座</span>
        <span class="esh-meta-sep">·</span>
        <span>已安排 {{ roomAssigned }} 人</span>
        <template v-if="roomBlocked > 0">
          <span class="esh-meta-sep">·</span>
          <span>屏蔽 {{ roomBlocked }} 座</span>
        </template>
        <template v-if="store.selectedRoom.examSubject">
          <span class="esh-meta-sep">·</span>
          <span class="esh-badge esh-badge-subject">{{ store.selectedRoom.examSubject }}</span>
        </template>
        <template v-if="store.selectedRoom.proctor">
          <span class="esh-meta-sep">·</span>
          <span class="esh-badge esh-badge-proctor">监考：{{ store.selectedRoom.proctor }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'

const store = useExamSeat2Store()

const roomAssigned = computed(() => {
  if (!store.selectedRoom) return 0
  return store.assignments.filter(a => a.roomId === store.selectedRoom.id).length
})
const roomBlocked = computed(() => {
  if (!store.selectedRoom) return 0
  return store.blockedSeats.filter(b => b.roomId === store.selectedRoom.id).length
})
</script>

<style scoped>
.esh-root {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--admin-border);
}
.esh-exam-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--admin-text);
  letter-spacing: 0.5px;
}
.esh-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.esh-meta-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--admin-text-secondary);
}
.esh-room-name {
  font-weight: 600;
  color: var(--admin-text);
}
.esh-meta-sep { color: var(--admin-text-muted); opacity: 0.4; }

.esh-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;
  white-space: nowrap;
}
.esh-badge-subject {
  background: rgba(99,102,241,0.1);
  color: var(--admin-accent-light);
  border: 1px solid rgba(99,102,241,0.15);
}
.esh-badge-proctor {
  background: rgba(6,182,212,0.1);
  color: var(--admin-accent-cyan);
  border: 1px solid rgba(6,182,212,0.15);
}
</style>
