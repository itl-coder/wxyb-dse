<template>
  <div class="seat-grid-container" v-if="room">
    <div class="sg-header">
      <div class="sg-title">
        <h3>{{ room.name }}</h3>
        <div class="sg-meta-row">
          <span>{{ room.rows }} × {{ room.cols }} 座</span>
          <span class="sg-meta-sep">·</span>
          <span>已安排 {{ assignedInRoom }} 人</span>
          <span class="sg-meta-sep">·</span>
          <span>屏蔽 {{ blockedInRoom }} 座</span>
          <template v-if="room.examSubject">
            <span class="sg-meta-sep">·</span>
            <span class="sg-meta-subject">{{ room.examSubject }}</span>
          </template>
          <template v-if="room.examTime">
            <span class="sg-meta-sep">·</span>
            <span>{{ room.examTime }}</span>
          </template>
        </div>
      </div>
      <div class="sg-header-right">
        <div class="sg-header-controls">
          <div class="sg-pattern-select">
            <label class="sg-pattern-label">排列</label>
            <select v-model="seatPattern" class="sg-pattern-dropdown">
              <option value="standard">标准逐行</option>
              <option value="snake">S 形蛇形</option>
              <option value="random">随机散列</option>
            </select>
          </div>
          <button class="sg-layout-toggle" @click="toggleLayout" :title="layoutMode === 'horizontal' ? '切换为竖直排列' : '切换为水平排列'">
            {{ layoutMode === 'horizontal' ? '⇅ 竖直' : '⇄ 水平' }}
          </button>
        </div>
        <div class="sg-legend">
          <span class="legend-item"><span class="legend-swatch empty"></span>空位</span>
          <span class="legend-item"><span class="legend-swatch occupied"></span>已占</span>
          <span class="legend-item"><span class="legend-swatch locked"></span>锁定</span>
          <span class="legend-item"><span class="legend-swatch conflict"></span>冲突</span>
          <span class="legend-item"><span class="legend-swatch blocked"></span>屏蔽</span>
          <span class="legend-item" v-if="room.exclusiveClassId"><span class="legend-swatch exclusive"></span>专属</span>
        </div>
      </div>
    </div>

    <!-- 考试信息栏 -->
    <div class="sg-exam-info" v-if="room.examSubject || room.examTime || room.proctor">
      <div class="sg-exam-info-row">
        <span v-if="room.examSubject" class="sg-exam-badge">{{ room.examSubject }}</span>
        <span v-if="room.examTime" class="sg-exam-badge sg-exam-time">{{ room.examTime }}</span>
        <span v-if="room.proctor" class="sg-exam-badge sg-exam-proctor">监考：{{ room.proctor }}</span>
      </div>
      <div class="sg-exam-reminders">
        <span class="sg-reminder">开考后 15 分钟禁止入场</span>
        <span class="sg-reminder">结束前 5 分钟提醒收卷</span>
      </div>
    </div>

    <!-- 门口指示 -->
    <div class="sg-door-indicator">
      <span class="door-arrow">&#10132;</span>
      <span class="door-label">前 门</span>
      <span class="door-dot-hint">● 第一位考生座位</span>
    </div>

    <!-- 讲台 -->
    <div class="sg-podium">
      <span class="podium-dash"></span>
      <span class="podium-text">讲 台</span>
      <span class="podium-dash"></span>
    </div>

    <!-- 批量操作 -->
    <div class="sg-batch-actions" v-if="assignedInRoom > 0">
      <button class="sg-batch-btn" @click="store.clearRoom(room.id)">清空</button>
      <button class="sg-batch-btn" @click="store.lockAllInRoom(room.id)">全部锁定</button>
      <button class="sg-batch-btn" @click="store.unlockAllInRoom(room.id)">全部解锁</button>
    </div>

    <div class="sg-table-wrapper">
      <table class="sg-table" :data-room-id="room.id">
        <thead>
          <tr>
            <th class="sg-th-corner"></th>
            <th v-for="c in room.cols" :key="c" class="sg-th-col">{{ colLetter(c) }}</th>
          </tr>
        </thead>
        <tbody ref="gridEl">
          <tr v-for="r in room.rows" :key="r" class="sg-row" :data-row="r">
            <td class="sg-td-row">{{ r }}</td>
            <td
              v-for="c in room.cols" :key="c"
              class="sg-td-seat"
              :class="{ 'sg-door-seat': (r === 1 && c === 1) }"
              :data-row="r" :data-col="c"
              :data-seat-index="(r-1)*room.cols + c"
              :draggable="!!getStudent(room.id, (r-1)*room.cols + c) && !getAssignment(room.id, (r-1)*room.cols + c)?.locked"
              @dragstart="onSeatDragStart($event, room.id, (r-1)*room.cols + c)"
              @dragover="onSeatDragOver"
              @drop="onSeatDrop($event, room.id, (r-1)*room.cols + c)"
              @dragend="onSeatDragEnd"
            >
              <SeatCard
                :room-id="room.id"
                :seat-index="(r-1)*room.cols + c"
                :row="r" :col="c"
                :student="getStudent(room.id, (r-1)*room.cols + c)"
                :assignment="getAssignment(room.id, (r-1)*room.cols + c)"
                :has-conflict="hasSeatConflict(room.id, (r-1)*room.cols + c)"
                :is-blocked="store.isSeatBlocked(room.id, (r-1)*room.cols + c)"
                :is-selected="isSeatSelected(room.id, (r-1)*room.cols + c)"
                :class-color="classColor(getStudent(room.id, (r-1)*room.cols + c)?.className || '')"
                :is-exclusive="!!room.exclusiveClassId"
                :is-door-seat="(r === 1 && c === 1)"
                @remove="store.unassignStudent(getStudent(room.id, (r-1)*room.cols + c)?.id)"
                @toggle-lock="onToggleLock"
                @click-seat="onSeatClick"
                @contextmenu="onSeatContextMenu"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="sg-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <div class="sg-context-item" v-if="contextMenu.hasStudent" @click="onRemoveStudent">移除学生</div>
        <div class="sg-context-item" v-if="!contextMenu.isBlocked" @click="onBlockSeat">屏蔽此座位</div>
        <div class="sg-context-item" v-else @click="onUnblockSeat">解除屏蔽</div>
        <div class="sg-context-sep"></div>
        <div class="sg-context-item" v-if="!contextMenu.isDoor" @click="onSetDoor">设为门口</div>
        <div class="sg-context-item" v-else @click="onRemoveDoor">取消门口</div>
      </div>
    </Teleport>
  </div>
  <div class="seat-grid-empty" v-else>
    <div class="empty-illustration">
      <div class="empty-glyph">贡</div>
    </div>
    <p class="empty-title">考苑格韵 · 考场座位安排</p>
    <p class="empty-hint">从左侧列表中选择一间教室以查看座位布局</p>
    <div class="empty-guide">
      <div class="guide-section">
        <div class="guide-section-title">功能说明</div>
        <ul class="guide-list">
          <li><b>拖拽排座</b> — 直接拖动学生卡片到目标座位，或拖动已占座位交换位置</li>
          <li><b>点击换位</b> — 先点击已占座位选中，再点击另一个座位进行交换或移动</li>
          <li><b>自动排座</b> — 点击上方「自动排座」一键智能分配，优先打散同班、分离相同选修</li>
          <li><b>锁定座位</b> — 点击座位上的锁图标锁定，锁定后不可拖拽或自动重排</li>
          <li><b>屏蔽座位</b> — 右键空座位可屏蔽（坏桌椅/保留位），屏蔽后在排座时自动跳过</li>
          <li><b>冲突检测</b> — 自动检测相邻座位是否有相同选修科目的考生，高亮显示冲突</li>
        </ul>
      </div>
      <div class="guide-section">
        <div class="guide-section-title">排座原则</div>
        <ul class="guide-list">
          <li>1. 同班学生尽量分散，避免相邻就座</li>
          <li>2. 相同选修科目考生尽量不安排在相邻位置</li>
          <li>3. 核心科目考场按班级均匀分布</li>
          <li>4. 选修科目考场仅安排选修该科目的学生</li>
          <li>5. 考场容量不足时优先保证已锁定座位不动</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useExamSeatStore } from '@/views/admin/exams/exam-seat/store/examSeatStore.js'
import SeatCard from './SeatCard.vue'

const store = useExamSeatStore()
const gridEl = ref(null)
const seatPattern = ref('standard')
const dragActive = ref(false)
const layoutMode = ref(localStorage.getItem('es_layout_mode') || 'horizontal')

const classColors = {}
function classColor(className) {
  if (!className) return 'transparent'
  if (classColors[className]) return classColors[className]
  const palette = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
    '#3b82f6', '#2563eb', '#7c3aed', '#c026d3'
  ]
  let hash = 0
  for (let i = 0; i < className.length; i++) {
    hash = className.charCodeAt(i) + ((hash << 5) - hash)
  }
  classColors[className] = palette[Math.abs(hash) % palette.length]
  return classColors[className]
}

const room = computed(() => store.selectedRoom)

const assignedInRoom = computed(() => {
  if (!room.value) return 0
  return store.assignments.filter(a => a.roomId === room.value.id).length
})

const blockedInRoom = computed(() => {
  if (!room.value) return 0
  return store.blockedSeats.filter(b => b.roomId === room.value.id).length
})

const conflictSeats = computed(() => {
  if (!room.value) return new Set()
  const set = new Set()
  store.conflicts.forEach(c => {
    if (c.roomId === room.value.id) {
      c.seats.forEach(s => set.add(`${room.value.id}_${s}`))
    }
  })
  return set
})

const contextMenu = ref({ show: false, x: 0, y: 0, roomId: null, seatIndex: null, isBlocked: false, isDoor: false, hasStudent: false })

function colLetter(c) { return String.fromCharCode(64 + c) }
function getAssignment(roomId, seatIndex) {
  return store.assignments.find(a => a.roomId === roomId && a.seatIndex === seatIndex) || null
}
function getStudent(roomId, seatIndex) {
  const a = getAssignment(roomId, seatIndex)
  if (!a) return null
  return store.students.find(s => s.id === a.studentId) || null
}
function hasSeatConflict(roomId, seatIndex) {
  return conflictSeats.value.has(`${roomId}_${seatIndex}`)
}
function isSeatSelected(roomId, seatIndex) {
  return store.selectedSeat?.roomId === roomId && store.selectedSeat?.seatIndex === seatIndex
}

function onSeatClick(roomId, seatIndex) {
  contextMenu.value.show = false
  store.handleSeatClick(roomId, seatIndex)
}

function onToggleLock(roomId, seatIndex) {
  store.toggleLock(roomId, seatIndex)
}

function onSeatContextMenu(event, roomId, seatIndex) {
  const isBlocked = store.isSeatBlocked(roomId, seatIndex)
  const hasStudent = getStudent(roomId, seatIndex)
  const isDoor = store.isDoorSeat(roomId, seatIndex)
  contextMenu.value = { show: true, x: event.clientX, y: event.clientY, roomId, seatIndex, isBlocked, isDoor, hasStudent }
}

function onBlockSeat() {
  store.blockSeat(contextMenu.value.roomId, contextMenu.value.seatIndex)
  contextMenu.value.show = false
}
function onUnblockSeat() {
  store.unblockSeat(contextMenu.value.roomId, contextMenu.value.seatIndex)
  contextMenu.value.show = false
}
function onSetDoor() {
  store.setDoorSeat(contextMenu.value.roomId, contextMenu.value.seatIndex)
  contextMenu.value.show = false
}
function onRemoveDoor() {
  store.removeDoorSeat(contextMenu.value.roomId)
  contextMenu.value.show = false
}
function onRemoveStudent() {
  const s = getStudent(contextMenu.value.roomId, contextMenu.value.seatIndex)
  if (s) store.unassignStudent(s.id)
  contextMenu.value.show = false
}
function closeContextMenu() { contextMenu.value.show = false }

function onKeydown(e) {
  if (e.key === 'Escape') { store.deselectSeat(); closeContextMenu() }
}

onMounted(() => {
  window.addEventListener('click', closeContextMenu)
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
  window.removeEventListener('keydown', onKeydown)
})

function onSeatDragStart(e, roomId, seatIndex) {
  const a = getAssignment(roomId, seatIndex)
  if (!a || a.locked) { e.preventDefault(); return }
  dragActive.value = true
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', JSON.stringify({ roomId, seatIndex, studentId: a.studentId }))
}

function onSeatDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onSeatDrop(e, toRoomId, toSeatIndex) {
  e.preventDefault()
  dragActive.value = false
  const raw = e.dataTransfer.getData('text/plain')
  if (!raw) return
  let fromData
  try { fromData = JSON.parse(raw) } catch { return }
  const { roomId: fromRoomId, seatIndex: fromSeatIndex, studentId } = fromData

  // Pool→grid drop
  if (studentId && fromRoomId === undefined) {
    if (!store.isSeatBlocked(toRoomId, toSeatIndex)) {
      store.assignStudent(studentId, toRoomId, toSeatIndex)
    }
    return
  }

  // Grid→grid swap
  if (fromRoomId && fromSeatIndex) {
    if (fromRoomId === toRoomId && fromSeatIndex === toSeatIndex) return
    if (store.isSeatBlocked(toRoomId, toSeatIndex)) return
    store.swapSeats(fromRoomId, fromSeatIndex, toRoomId, toSeatIndex)
  }
}

function onSeatDragEnd() {
  dragActive.value = false
}

function toggleLayout() {
  layoutMode.value = layoutMode.value === 'horizontal' ? 'vertical' : 'horizontal'
  localStorage.setItem('es_layout_mode', layoutMode.value)
}

</script>

<style scoped>
.seat-grid-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.sg-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}
.sg-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.sg-title h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--es-text);
  letter-spacing: 0.5px;
}
.sg-meta-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--es-text-secondary);
  margin-top: 3px;
}
.sg-meta-sep { color: var(--es-text-muted); }
.sg-meta-subject { color: var(--es-gold); }

/* 排列模式选择器 */
.sg-header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sg-layout-toggle {
  padding: 4px 10px;
  border: 1px solid var(--es-border);
  background: var(--es-surface-alt);
  color: var(--es-text-secondary);
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  transition: all 0.15s;
  white-space: nowrap;
}
.sg-layout-toggle:hover {
  border-color: var(--es-gold);
  color: var(--es-gold);
  background: rgba(201,168,76,0.06);
}
.sg-pattern-select {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sg-pattern-label {
  font-size: 10px;
  color: var(--es-text-muted);
  font-weight: 500;
  letter-spacing: 0.5px;
}
.sg-pattern-dropdown {
  padding: 3px 8px;
  font-size: 11px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--es-surface);
  color: var(--es-text-secondary);
  border: 1px solid var(--es-border);
  border-radius: 5px;
  cursor: pointer;
  outline: none;
}
.sg-pattern-dropdown:focus {
  border-color: var(--es-gold);
  box-shadow: 0 0 0 2px rgba(201,168,76,0.15);
}

.sg-legend {
  display: flex;
  gap: 14px;
  font-size: 10px;
  color: var(--es-text-muted);
  align-items: center;
  flex-wrap: wrap;
}

/* 考试信息栏 */
.sg-exam-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.015);
  border: 1px solid var(--es-border);
  border-radius: 8px;
}
.sg-exam-info-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.sg-exam-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  background: rgba(201,168,76,0.1);
  color: var(--es-gold);
  border: 1px solid rgba(201,168,76,0.15);
}
.sg-exam-badge.sg-exam-time {
  background: rgba(45,138,78,0.1);
  color: var(--es-jade);
  border-color: rgba(45,138,78,0.15);
}
.sg-exam-badge.sg-exam-proctor {
  background: rgba(91,91,206,0.1);
  color: var(--es-indigo);
  border-color: rgba(91,91,206,0.15);
}
.sg-exam-reminders {
  display: flex;
  gap: 16px;
  font-size: 10px;
  color: var(--es-text-muted);
}
.sg-reminder {
  display: flex;
  align-items: center;
  gap: 4px;
}
.sg-reminder::before {
  content: '⏱';
  font-size: 11px;
}

/* 门口指示 */
.sg-door-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  padding: 0 4px;
  font-size: 11px;
  color: var(--es-text-muted);
}
.door-arrow {
  font-size: 14px;
  color: var(--es-gold);
  animation: door-pulse 2s ease-in-out infinite;
}
@keyframes door-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.door-label {
  font-weight: 700;
  color: var(--es-text-secondary);
  letter-spacing: 2px;
}
.door-dot-hint {
  font-size: 9px;
  color: var(--es-text-muted);
  margin-left: auto;
}
.legend-item { display: flex; align-items: center; gap: 5px; }
.legend-swatch {
  width: 9px; height: 9px;
  border-radius: 2px;
  display: inline-block;
}
.legend-swatch.empty { background: var(--es-seat-empty-bg, rgba(255,255,255,0.015)); border: 1px dashed var(--es-seat-empty-border, rgba(255,255,255,0.08)); }
.legend-swatch.occupied { background: var(--es-seat-occupied-bg, rgba(255,255,255,0.025)); border: 1px solid var(--es-seat-occupied-border, rgba(255,255,255,0.09)); }
.legend-swatch.locked { background: var(--es-seat-locked-bg, rgba(91,91,206,0.04)); border: 1px solid var(--es-seat-locked-border, rgba(91,91,206,0.3)); }
.legend-swatch.conflict { background: var(--es-seat-conflict-bg, rgba(196,30,58,0.06)); border: 1px solid var(--es-seat-conflict-border, var(--es-vermillion)); animation: es-pulse-conflict 2s ease-in-out infinite; }
.legend-swatch.blocked { background: var(--es-seat-blocked-bg, rgba(255,255,255,0.015)); border: 1px dashed var(--es-seat-blocked-border, rgba(196,30,58,0.15)); }
.legend-swatch.exclusive { background: var(--es-seat-exclusive-bg, rgba(45,138,78,0.04)); border: 1px solid var(--es-seat-exclusive-border, rgba(45,138,78,0.12)); }

/* 批量操作 */
.sg-batch-actions { display: flex; gap: 6px; margin-bottom: 10px; }
.sg-batch-btn {
  padding: 4px 12px; border: 1px solid var(--es-border); background: var(--es-surface-alt);
  color: var(--es-text-secondary); border-radius: 5px; cursor: pointer; font-size: 11px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif; transition: all 0.15s;
}
.sg-batch-btn:hover { border-color: var(--es-border-active); color: var(--es-text); background: var(--es-surface); }

/* 讲台 */
.sg-podium {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  padding: 14px; margin: 0 40px 18px;
  border: 1px solid rgba(201,168,76,0.08); border-radius: var(--es-radius);
  background: linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.03) 30%, rgba(201,168,76,0.05) 50%, rgba(201,168,76,0.03) 70%, transparent 100%);
}
.podium-dash { width: 32px; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,168,76,0.2)); }
.podium-text { font-size: 12px; letter-spacing: 6px; color: var(--es-text-muted); font-weight: 500; }

/* 表格容器 */
.sg-table-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
}

.sg-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* 列表头 */
.sg-th-corner { width: 32px; padding: 0; }
.sg-th-col {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--es-text-muted);
  font-family: "SF Mono", "Cascadia Code", monospace;
  padding: 6px 0;
  letter-spacing: 2px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(201,168,76,0.15);
}

/* 行标 */
.sg-td-row {
  width: 32px;
  text-align: center;
  vertical-align: middle;
  font-size: 10px;
  font-weight: 700;
  color: var(--es-text-muted);
  font-family: "SF Mono", "Cascadia Code", monospace;
  padding: 0;
  border-right: 1px solid rgba(201,168,76,0.12);
}

/* 座位单元格 */
.sg-td-seat {
  min-width: 72px;
  width: auto;
  height: 64px;
  padding: 1px;
  vertical-align: middle;
  border: 1px solid rgba(255,255,255,0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.sg-td-seat:hover {
  transform: translateY(-1px);
  z-index: 2;
}
/* 门口座位（进门左手第一个） */
.sg-door-seat {
  position: relative;
}
.sg-door-seat::before {
  content: '🚪';
  position: absolute;
  top: -9px;
  left: -12px;
  font-size: 14px;
  z-index: 10;
  filter: drop-shadow(0 0 4px rgba(201,168,76,0.4));
  animation: door-marker-pulse 2s ease-in-out infinite;
}
@keyframes door-marker-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* 右键菜单 */
.sg-context-menu {
  position: fixed; z-index: 9999;
  background: #1a1d28; border: 1px solid var(--es-border); border-radius: 7px;
  padding: 4px; min-width: 120px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.sg-context-item {
  padding: 8px 14px; font-size: 12px; color: var(--es-text); cursor: pointer;
  border-radius: 4px; transition: background 0.12s; font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.sg-context-item:hover { background: rgba(201,168,76,0.1); color: var(--es-gold); }
.sg-context-sep {
  height: 1px;
  background: var(--es-border);
  margin: 3px 6px;
  opacity: 0.4;
}

/* 空状态 */
.seat-grid-empty {
  height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.empty-illustration {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--es-surface-alt); border: 1px solid var(--es-border);
  display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
}
.empty-glyph { font-size: 28px; color: var(--es-text-muted); font-family: "Noto Serif SC", "PingFang SC", serif; }
.empty-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--es-text); }
.empty-hint { margin: 6px 0 0; font-size: 12px; color: var(--es-text-muted); }
.empty-guide { margin-top: 24px; max-width: 560px; text-align: left; }
.guide-section { margin-bottom: 20px; }
.guide-section-title {
  font-size: 13px; font-weight: 700; color: var(--es-gold);
  border-bottom: 1px solid rgba(201,168,76,0.12);
  padding-bottom: 6px; margin-bottom: 10px; letter-spacing: 1px;
}
.guide-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
.guide-list li { font-size: 12px; color: var(--es-text-secondary); line-height: 1.6; padding-left: 4px; }
.guide-list li b { color: var(--es-text); font-weight: 600; }
</style>
