<template>
  <div class="eslt-root" v-if="room">
    <div class="eslt-group">
      <button class="eslt-btn eslt-btn-lock" :disabled="!hasAssignments" @click="store.lockAllInRoom(room.id)">
        <svg width="12" height="12" viewBox="0 0 10 12" fill="none"><rect x="1" y="4" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M2.5 4V2.5a2.5 2.5 0 0 1 5 0V4" stroke="currentColor" stroke-width="1.2"/></svg>
        全部锁定
      </button>
      <button class="eslt-btn eslt-btn-unlock" :disabled="!hasAssignments" @click="store.unlockAllInRoom(room.id)">
        <svg width="12" height="12" viewBox="0 0 10 12" fill="none"><rect x="1" y="4" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M2.5 4V2.5a2.5 2.5 0 0 1 5 0V4" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1 0.5"/></svg>
        全部解锁
      </button>
    </div>
    <div class="eslt-sep"></div>
    <div class="eslt-group">
      <button class="eslt-btn eslt-btn-lock" :disabled="!hasSelection" @click="onLockSelected">
        锁定选中
      </button>
      <button class="eslt-btn eslt-btn-unlock" :disabled="!hasSelection" @click="onUnlockSelected">
        解锁选中
      </button>
    </div>
    <span class="eslt-hint" v-if="selectedCount > 0">{{ selectedCount }} 座选中</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'

const props = defineProps({
  /** @type {import('vue').Prop<Set<string>>} */
  selectedSeats: { type: Set, default: () => new Set() }
})

const emit = defineEmits(['clearSelection'])

const store = useExamSeat2Store()

const room = computed(() => store.selectedRoom)

const hasAssignments = computed(() => {
  if (!room.value) return false
  return store.assignments.some(a => a.roomId === room.value.id)
})

const hasSelection = computed(() => props.selectedSeats.size > 0)
const selectedCount = computed(() => props.selectedSeats.size)

function onLockSelected() {
  if (!room.value) return
  const items = [...props.selectedSeats].map(key => {
    const [rid, si] = key.split('_')
    return { roomId: parseInt(rid), seatIndex: parseInt(si) }
  })
  store.batchLockSeats(items)
  emit('clearSelection')
}

function onUnlockSelected() {
  if (!room.value) return
  const items = [...props.selectedSeats].map(key => {
    const [rid, si] = key.split('_')
    return { roomId: parseInt(rid), seatIndex: parseInt(si) }
  })
  store.batchUnlockSeats(items)
  emit('clearSelection')
}
</script>

<style scoped>
.eslt-root {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  flex-shrink: 0;
}
.eslt-group {
  display: flex;
  gap: 4px;
}
.eslt-sep {
  width: 1px;
  height: 18px;
  background: var(--admin-border);
  opacity: 0.6;
}
.eslt-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border: 1px solid var(--admin-border);
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-family: var(--admin-font);
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
  background: var(--admin-surface);
  color: var(--admin-text-secondary);
}
.eslt-btn:hover:not(:disabled) { border-color: var(--admin-border-light); background: var(--admin-surface-hover); }
.eslt-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.eslt-btn-lock:hover:not(:disabled) {
  border-color: #6366f1;
  color: #818cf8;
  background: rgba(99,102,241,0.08);
}
.eslt-btn-unlock:hover:not(:disabled) {
  border-color: #f59e0b;
  color: #fbbf24;
  background: rgba(245,158,11,0.08);
}
.eslt-hint {
  font-size: 10px;
  color: var(--admin-accent-light);
  font-weight: 600;
  white-space: nowrap;
  margin-left: auto;
}
</style>
