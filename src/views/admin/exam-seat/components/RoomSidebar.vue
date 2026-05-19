<template>
  <div class="room-sidebar">
    <div class="rs-header">
      <h3 class="rs-title">考场教室</h3>
      <button class="rs-add-btn" @click="showConfig = true; editingRoom = null">
        <span>+</span> 新增
      </button>
    </div>

    <div class="room-list">
      <div
        v-for="room in store.roomStats"
        :key="room.id"
        class="room-item"
        :class="{ active: room.id === store.selectedRoomId }"
        @click="store.selectRoom(room.id)"
      >
        <div class="room-item-top">
          <span class="room-name">{{ room.name }}</span>
          <span class="room-actions">
            <button class="room-act-btn" @click.stop="editRoom(room)" title="编辑">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="room-act-btn danger" @click.stop="deleteRoomConfirm(room)" title="删除">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </span>
        </div>
        <div class="room-meta">
          <span class="room-dims">{{ room.rows }}×{{ room.cols }}</span>
          <span class="room-location" v-if="room.location">{{ room.location }}</span>
        </div>
        <!-- 快捷操作 — hover 时显示 -->
        <div class="room-quick-actions">
          <button class="rqa-btn" @click.stop="arrangeThisRoom(room.id)" title="仅为此教室自动排座">⚡排此教室</button>
          <button class="rqa-btn rqa-btn-clear" @click.stop="clearThisRoom(room.id)" title="清除本教室所有非锁定座位">✕清空</button>
        </div>
        <div class="room-progress">
          <div class="progress-track">
            <div
              class="progress-fill"
              :class="{ full: room.assignedCount >= room.totalCapacity && room.totalCapacity > 0 }"
              :style="{ width: room.totalCapacity ? (room.assignedCount / room.totalCapacity * 100) + '%' : '0%' }"
            ></div>
          </div>
          <span class="progress-num">{{ room.assignedCount }}/{{ room.totalCapacity }}</span>
        </div>
      </div>

      <div class="room-item room-item-empty" v-if="store.rooms.length === 0">
        <span style="color:var(--es-text-muted);font-size:12px">暂无教室，点击上方"新增"</span>
      </div>
    </div>

    <RoomConfigDialog
      v-if="showConfig"
      :room="editingRoom"
      @close="showConfig = false; editingRoom = null"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useExamSeatStore } from '../store/examSeatStore.js'
import RoomConfigDialog from './RoomConfigDialog.vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const store = useExamSeatStore()

const showConfig = ref(false)
const editingRoom = ref(null)

function editRoom(room) {
  editingRoom.value = room
  showConfig.value = true
}

async function deleteRoomConfirm(room) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${room.name}」吗？该教室的座位分配也将被清除。`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    store.deleteRoom(room.id)
    ElMessage.success('已删除教室')
  } catch { /* cancelled */ }
}

function arrangeThisRoom(roomId) {
  store.selectRoom(roomId)
  store.runAutoArrange({ targetRoomId: roomId })
}

async function clearThisRoom(roomId) {
  try {
    await ElMessageBox.confirm(
      '确定清空此教室吗？已锁定的座位将保留。',
      '确认清空',
      { confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning' }
    )
    store.clearRoom(roomId)
  } catch { /* cancelled */ }
}
</script>

<style scoped>
.room-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.rs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--es-border);
  margin-bottom: 10px;
}
.rs-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--es-text);
  margin: 0;
}
.rs-add-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 12px;
  border: 1px solid rgba(201,168,76,0.3);
  background: rgba(201,168,76,0.06);
  color: var(--es-gold);
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s;
}
.rs-add-btn:hover {
  background: rgba(201,168,76,0.12);
  border-color: rgba(201,168,76,0.5);
}
.rs-add-btn span { font-size: 14px; line-height: 1; }

.room-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.room-item {
  padding: 12px;
  background: var(--es-surface-alt);
  border: 1px solid transparent;
  border-radius: var(--es-radius);
  cursor: pointer;
  transition: all 0.18s;
}
.room-item:hover { border-color: var(--es-border-active); }
.room-item.active {
  border-color: var(--es-gold);
  background: linear-gradient(135deg, rgba(201,168,76,0.04) 0%, rgba(201,168,76,0.01) 100%);
  box-shadow: var(--es-shadow-gold);
}
.room-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.room-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--es-text);
}
.room-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.room-item:hover .room-actions { opacity: 1; }
.room-act-btn {
  width: 24px; height: 24px;
  border: none;
  background: transparent;
  color: var(--es-text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.room-act-btn:hover { background: rgba(255,255,255,0.06); color: var(--es-text); }
.room-act-btn.danger:hover { background: rgba(196,30,58,0.15); color: var(--es-vermillion); }

.room-meta {
  display: flex;
  gap: 8px;
  margin-top: 5px;
  font-size: 10px;
  color: var(--es-text-muted);
}
.room-dims {
  font-family: "SF Mono", "Cascadia Code", monospace;
  color: var(--es-text-secondary);
}
.room-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.progress-track {
  flex: 1;
  height: 3px;
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--es-gold);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-fill.full { background: var(--es-jade); }
.progress-num {
  font-size: 10px;
  color: var(--es-text-muted);
  font-family: "SF Mono", "Cascadia Code", monospace;
  white-space: nowrap;
}
.room-quick-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}
.room-item:hover .room-quick-actions { opacity: 1; }
.rqa-btn {
  flex: 1;
  padding: 4px 0;
  border: 1px solid rgba(201,168,76,0.25);
  background: rgba(201,168,76,0.05);
  color: var(--es-gold);
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  transition: all 0.15s;
  white-space: nowrap;
}
.rqa-btn:hover {
  background: rgba(201,168,76,0.12);
  border-color: rgba(201,168,76,0.45);
}
.rqa-btn-clear {
  border-color: rgba(196,30,58,0.2);
  background: rgba(196,30,58,0.04);
  color: var(--es-vermillion);
}
.rqa-btn-clear:hover {
  background: rgba(196,30,58,0.1);
  border-color: rgba(196,30,58,0.35);
}

.room-item-empty {
  text-align: center;
  padding: 20px;
  cursor: default;
  border: 1px dashed var(--es-border);
}
</style>
