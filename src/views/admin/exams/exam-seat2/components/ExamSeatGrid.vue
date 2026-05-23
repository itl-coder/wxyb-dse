<template>
  <div class="esg-root" v-if="room">
    <!-- 批量操作栏 -->
    <div class="esg-toolbar">
      <div class="esg-toolbar-left">
        <button class="esg-btn" @click="store.clearRoom(room.id)" :disabled="assignedInRoom === 0">清空教室</button>
        <button class="esg-btn" @click="store.lockAllInRoom(room.id)" :disabled="assignedInRoom === 0">全部锁定</button>
        <button class="esg-btn" @click="store.unlockAllInRoom(room.id)" :disabled="assignedInRoom === 0">全部解锁</button>
        <span class="esg-sep"></span>
        <span class="esg-sel-hint" v-if="selectedSeats.length > 0">{{ selectedSeats.length }} 座选中</span>
      </div>
      <ExamSeatLegend />
    </div>

    <!-- 门口指示 -->
    <div class="esg-door-bar">
      <span class="esg-door-arrow" :class="doorArrowClass">{{ doorArrowChar }}</span>
      <span class="esg-door-label">前 门</span>
      <span class="esg-door-hint">● 进场方向，第一位考生</span>
    </div>

    <!-- 座位表 -->
    <div
      class="esg-table-wrap"
      @dragover.prevent
      @drop.prevent
      @mousedown="onTableMouseDown"
      @mousemove="onTableMouseMove"
      @mouseup="onTableMouseUp"
      @mouseleave="onTableMouseUp"
    >
      <table class="esg-table">
        <!-- 列选择行 -->
        <thead>
          <tr>
            <th class="esg-corner-cell"></th>
            <th
              v-for="c in room.cols"
              :key="'ch-' + c"
              class="esg-col-header"
              @click="onSelectColumn(c)"
            >
              {{ colLabel(c) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in reversedRows"
            :key="r"
            class="esg-row"
            :class="{ 'esg-row-first': r === 1 }"
          >
            <!-- 行选择单元格 -->
            <td class="esg-row-header" @click="onSelectRow(r)">
              {{ r }}
            </td>
            <td
              v-for="c in room.cols"
              :key="c"
              class="esg-cell"
              :class="cellClasses(r, c)"
              :data-room-id="room.id"
              :data-seat-index="seatIdx(r, c)"
              :data-row="r"
              :data-col="c"
              @click.stop="onCellClick($event, r, c)"
              @contextmenu.prevent="onContextMenu($event, r, c)"
            >
              <ExamSeatCell
                :room-id="room.id"
                :seat-index="seatIdx(r, c)"
                :row="r"
                :col="c"
                :student="getStudent(r, c)"
                :is-blocked="store.isSeatBlocked(room.id, seatIdx(r, c))"
                :is-reserved="store.isSeatReserved(room.id, seatIdx(r, c))"
                :is-selected="isSeatSelected(r, c)"
                :is-batch-selected="isBatchSelected(r, c)"
                :is-locked="!!getAssignment(r, c)?.locked"
                :has-conflict="hasConflict(r, c)"
                :is-exclusive="!!room.exclusiveClassId"
                :seat-status="seatStatus(r, c)"
                :blocked-reason="getBlockedReason(r, c)"
                :reserved-reason="getReservedReason(r, c)"
                :reserved-info="store.getReservedInfo(room.id, seatIdx(r, c))"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.show"
        class="esg-ctx-menu"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        @click.stop
      >
        <template v-if="ctxMenu.mode === 'single'">
          <div class="esg-ctx-item" v-if="isContextOccupied" @click="onRemoveStudent">移除学生</div>
          <div class="esg-ctx-item" v-if="isContextOccupied && !isContextLocked" @click="onLockSeat">锁定座位</div>
          <div class="esg-ctx-item" v-if="isContextOccupied && isContextLocked" @click="onUnlockSeat">解锁座位</div>
          <div class="esg-ctx-item" v-if="!isContextBlocked && !isContextOccupied" @click="onReserveSeat">设置预留位</div>
          <div class="esg-ctx-item" v-if="isContextReserved" @click="onUnreserveSeat">取消预留位</div>
          <div class="esg-ctx-item" v-if="isContextReserved" @click="onSetReserveReason">设置预留原因</div>
          <div class="esg-ctx-item" v-if="isContextReserved && !isContextAllowExternal" @click="onToggleAllowExternal(true)">允许外班学生</div>
          <div class="esg-ctx-item" v-if="isContextReserved && isContextAllowExternal" @click="onToggleAllowExternal(false)">禁止外班学生</div>
          <div class="esg-ctx-sep"></div>
          <div class="esg-ctx-item" v-if="!isContextBlocked && !isContextOccupied" @click="onBlockSeat">屏蔽此座位</div>
          <div class="esg-ctx-item" v-if="isContextBlocked" @click="onUnblockSeat">解除屏蔽</div>
          <div class="esg-ctx-sep"></div>
          <div class="esg-ctx-item" v-if="!isContextDoor" @click="onSetDoor">设为门口</div>
          <div class="esg-ctx-item" v-else @click="onRemoveDoor">取消门口</div>
        </template>
        <template v-else>
          <div class="esg-ctx-item esg-ctx-dim" @click="clearSelection">取消选择</div>
        </template>
      </div>
    </Teleport>
  </div>

  <!-- 空状态 -->
  <div class="esg-empty" v-else>
    <div class="esg-empty-icon">座</div>
    <p class="esg-empty-title">考苑格韵 · 考场座位安排</p>
    <p class="esg-empty-hint">从左侧列表选择一间教室，查看并编排座位</p>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'
import ExamSeatCell from './ExamSeatCell.vue'
import ExamSeatLegend from './ExamSeatLegend.vue'
import { ElMessageBox } from 'element-plus'

const store = useExamSeat2Store()

const ctxMenu = ref({ show: false, x: 0, y: 0, row: 0, col: 0, mode: 'single' })

// 批量选择
const selectedSeats = ref([]) // Array of "roomId_seatIndex" keys（plain array for reliable Vue3 reactivity）
const dragSelecting = ref(false)
const dragStartCell = ref(null) // { row, col }

const room = computed(() => store.selectedRoom)

const reversedRows = computed(() => {
  if (!room.value) return []
  const rows = []
  for (let i = room.value.rows; i >= 1; i--) rows.push(i)
  return rows
})

const assignedInRoom = computed(() => {
  if (!room.value) return 0
  return store.assignments.filter(a => a.roomId === room.value.id).length
})

const conflictSeatSet = computed(() => {
  const set = new Set()
  if (!room.value) return set
  store.conflicts.forEach(c => {
    if (c.roomId === room.value.id) {
      c.seats.forEach(s => set.add(`${room.value.id}_${s}`))
    }
  })
  return set
})

function colLabel(c) { return String.fromCharCode(64 + c) }
function seatIdx(r, c) { return (r - 1) * room.value.cols + c }
function seatKey(r, c) { return `${room.value.id}_${seatIdx(r, c)}` }
function getAssignment(r, c) { return store.getAssignment(room.value.id, seatIdx(r, c)) }
function getStudent(r, c) {
  const a = getAssignment(r, c)
  if (!a) return null
  return store.students.find(s => s.id === a.studentId) || null
}
function hasConflict(r, c) { return conflictSeatSet.value.has(`${room.value.id}_${seatIdx(r, c)}`) }
function isSeatSelected(r, c) {
  return store.selectedSeat?.roomId === room.value.id && store.selectedSeat?.seatIndex === seatIdx(r, c)
}
function isBatchSelected(r, c) {
  return selectedSeats.value.includes(seatKey(r, c))
}
function seatStatus(r, c) {
  const a = getAssignment(r, c)
  if (!a) return 'empty'
  const s = store.students.find(s => s.id === a.studentId)
  return s?.status || 'normal'
}
function getBlockedReason(r, c) {
  const b = store.blockedSeats.find(x => x.roomId === room.value.id && x.seatIndex === seatIdx(r, c))
  return b?.reason || ''
}
function getReservedReason(r, c) {
  const rsv = store.getReservedInfo(room.value.id, seatIdx(r, c))
  return rsv?.reservedReason || ''
}

const doorDir = computed(() => store.doorDirection || 'left')
const isDoorCell = (r, c) => {
  if (!room.value) return false
  const customDoor = store.getDoorSeatIndex(room.value.id)
  if (customDoor !== null && customDoor !== undefined) {
    return seatIdx(r, c) === customDoor
  }
  if (r !== 1) return false
  if (doorDir.value === 'left') return c === 1
  return c === room.value.cols
}
const doorArrowClass = computed(() => doorDir.value === 'left' ? 'esg-door-left' : 'esg-door-right')
const doorArrowChar = computed(() => doorDir.value === 'left' ? '←' : '→')

function cellClasses(r, c) {
  return {
    'esg-door-cell': isDoorCell(r, c)
  }
}

// ========== 点击 ==========
function onCellClick(evt, r, c) {
  ctxMenu.value.show = false

  if (evt.ctrlKey || evt.metaKey) {
    // Ctrl+点击：多选切换
    const key = seatKey(r, c)
    const idx = selectedSeats.value.indexOf(key)
    if (idx > -1) {
      selectedSeats.value.splice(idx, 1)
    } else {
      selectedSeats.value.push(key)
    }
    return
  }

  // 普通点击：座位选择
  store.handleSeatClick(room.value.id, seatIdx(r, c))
  clearSelection()
}

// ========== 行/列批量选择 ==========
function onSelectRow(r) {
  const next = []
  for (let c = 1; c <= room.value.cols; c++) {
    next.push(seatKey(r, c))
  }
  selectedSeats.value = next
}
function onSelectColumn(c) {
  const next = []
  for (let r = 1; r <= room.value.rows; r++) {
    next.push(seatKey(r, c))
  }
  selectedSeats.value = next
}

function clearSelection() {
  selectedSeats.value = []
}

// ========== 框选（拖拽选择） ==========
function onTableMouseDown(e) {
  if (e.target.closest('.esg-cell')) return // 让单元格点击处理
  if (e.target.closest('.esg-row-header') || e.target.closest('.esg-col-header')) return
  dragSelecting.value = true
  dragStartCell.value = null
}
function onTableMouseMove(e) {
  if (!dragSelecting.value) return
  const cell = e.target.closest('.esg-cell')
  if (!cell) return
  const r = parseInt(cell.dataset.row)
  const c = parseInt(cell.dataset.col)
  if (!dragStartCell.value) {
    dragStartCell.value = { row: r, col: c }
    return
  }
  // 计算矩形范围
  const r1 = Math.min(dragStartCell.value.row, r)
  const r2 = Math.max(dragStartCell.value.row, r)
  const c1 = Math.min(dragStartCell.value.col, c)
  const c2 = Math.max(dragStartCell.value.col, c)
  const next = []
  for (let ri = r1; ri <= r2; ri++) {
    for (let ci = c1; ci <= c2; ci++) {
      next.push(seatKey(ri, ci))
    }
  }
  selectedSeats.value = next
}
function onTableMouseUp() {
  dragSelecting.value = false
  dragStartCell.value = null
}

// ========== 右键菜单 ==========
const isContextBlocked = computed(() => {
  if (!ctxMenu.value.show || !room.value) return false
  return store.isSeatBlocked(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
})
const isContextReserved = computed(() => {
  if (!ctxMenu.value.show || !room.value) return false
  return store.isSeatReserved(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
})
const isContextDoor = computed(() => {
  if (!ctxMenu.value.show || !room.value) return false
  return store.isDoorSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
})
const isContextOccupied = computed(() => {
  if (!ctxMenu.value.show || !room.value) return false
  return !!getStudent(ctxMenu.value.row, ctxMenu.value.col)
})
const isContextLocked = computed(() => {
  if (!ctxMenu.value.show || !room.value) return false
  const a = getAssignment(ctxMenu.value.row, ctxMenu.value.col)
  return !!a?.locked
})
const isContextAllowExternal = computed(() => {
  if (!ctxMenu.value.show || !room.value) return false
  const rsv = store.getReservedInfo(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  return !!rsv?.allowExternalStudent
})

function onContextMenu(e, r, c) {
  if (selectedSeats.value.length > 0 && isBatchSelected(r, c)) {
    ctxMenu.value = { show: true, x: e.clientX, y: e.clientY, row: r, col: c, mode: 'batch' }
  } else {
    ctxMenu.value = { show: true, x: e.clientX, y: e.clientY, row: r, col: c, mode: 'single' }
  }
}

function onBlockSeat() {
  store.blockSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  ctxMenu.value.show = false
}
function onUnblockSeat() {
  store.unblockSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  ctxMenu.value.show = false
}
function onReserveSeat() {
  store.reserveSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  ctxMenu.value.show = false
}
function onUnreserveSeat() {
  store.unreserveSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  ctxMenu.value.show = false
}
async function onSetReserveReason() {
  ctxMenu.value.show = false
  try {
    const { value } = await ElMessageBox.prompt('请输入该预留座位的原因', '设置预留原因', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: getReservedReason(ctxMenu.value.row, ctxMenu.value.col)
    })
    if (value != null) {
      const rsv = store.getReservedInfo(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
      if (rsv) {
        store.unreserveSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
        store.reserveSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col), rsv.reservedStudentId, value, rsv.allowExternalStudent)
      }
    }
  } catch { /* cancelled */ }
}
function onToggleAllowExternal(allow) {
  const rsv = store.getReservedInfo(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  if (!rsv) return
  store.unreserveSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  store.reserveSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col), rsv.reservedStudentId, rsv.reservedReason, allow)
  ctxMenu.value.show = false
}
function onLockSeat() {
  store.toggleLock(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  ctxMenu.value.show = false
}
function onUnlockSeat() {
  store.toggleLock(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  ctxMenu.value.show = false
}
function onRemoveStudent() {
  const a = getAssignment(ctxMenu.value.row, ctxMenu.value.col)
  if (a) store.unassignStudent(a.studentId)
  ctxMenu.value.show = false
}
function onSetDoor() {
  store.setDoorSeat(room.value.id, seatIdx(ctxMenu.value.row, ctxMenu.value.col))
  ctxMenu.value.show = false
}
function onRemoveDoor() {
  store.removeDoorSeat(room.value.id)
  ctxMenu.value.show = false
}

function closeCtxMenu() { ctxMenu.value.show = false }

// 切换教室时清除选择
watch(() => store.selectedRoomId, () => {
  clearSelection()
})

onMounted(() => {
  window.addEventListener('click', closeCtxMenu)
})
onUnmounted(() => {
  window.removeEventListener('click', closeCtxMenu)
})
</script>

<style scoped>
.esg-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

/* ---- 工具栏 ---- */
.esg-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.esg-toolbar-left { display: flex; gap: 6px; align-items: center; }
.esg-sep {
  width: 1px; height: 18px;
  background: var(--admin-border);
  opacity: 0.6;
}
.esg-btn {
  padding: 5px 12px;
  border: 1px solid var(--admin-border);
  background: var(--admin-surface);
  color: var(--admin-text-secondary);
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-family: var(--admin-font);
  transition: all 0.15s;
  white-space: nowrap;
}
.esg-btn:hover:not(:disabled) {
  border-color: var(--admin-accent);
  color: var(--admin-accent-light);
  background: rgba(99,102,241,0.06);
}
.esg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.esg-sel-hint {
  font-size: 10px;
  color: var(--admin-accent-light);
  font-weight: 600;
  white-space: nowrap;
}

/* ---- 门口指示 ---- */
.esg-door-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--admin-text-muted);
  padding: 2px 4px;
}
.esg-door-arrow { font-size: 14px; font-weight: 700; color: var(--admin-accent-light); }
.esg-door-label { font-weight: 600; color: var(--admin-text-secondary); letter-spacing: 1.5px; }
.esg-door-hint { font-size: 10px; color: var(--admin-text-muted); margin-left: auto; opacity: 0.7; }

/* ---- 座位表 ---- */
.esg-table-wrap {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-surface);
}
.esg-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: min-content;
}
.esg-row-first {
  border-top: 2px solid var(--admin-accent-light);
}

/* 列头 */
.esg-col-header {
  width: auto;
  text-align: center;
  font-size: 9px;
  font-weight: 600;
  color: var(--admin-text-muted);
  padding: 2px 0;
  border-bottom: 1px solid var(--admin-border);
  cursor: pointer;
  user-select: none;
  transition: color 0.12s;
}
.esg-col-header:hover { color: var(--admin-accent-light); }

/* 行头 */
.esg-row-header {
  width: 28px;
  text-align: center;
  font-size: 9px;
  font-weight: 600;
  color: var(--admin-text-muted);
  border-right: 1px solid var(--admin-border);
  cursor: pointer;
  user-select: none;
  transition: color 0.12s;
  padding: 0;
}
.esg-row-header:hover { color: var(--admin-accent-light); }

/* 角格 */
.esg-corner-cell {
  width: 28px;
  border-bottom: 1px solid var(--admin-border);
  border-right: 1px solid var(--admin-border);
}

/* 单元格 */
.esg-cell {
  width: auto;
  height: 68px;
  padding: 0;
  vertical-align: middle;
  border: 1px solid var(--admin-border);
  transition: box-shadow 0.15s ease, background 0.15s ease;
  position: relative;
}
.esg-cell:hover {
  z-index: 1;
  box-shadow: 0 0 0 2px var(--admin-accent-light);
}

/* 门口座位标记 */
.esg-door-cell { position: relative; }
.esg-door-cell::before {
  content: '';
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--admin-accent-light);
  z-index: 10;
  box-shadow: 0 0 6px rgba(129,140,248,0.5);
  animation: door-pulse 2s ease-in-out infinite;
}
.esg-door-cell[data-col="1"]::before { top: 4px; left: 4px; }
.esg-door-cell[data-col]:not([data-col="1"])::before { top: 4px; right: 4px; }

@keyframes door-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* ---- 右键菜单 ---- */
.esg-ctx-menu {
  position: fixed;
  z-index: 9999;
  background: var(--admin-surface, #1e293b);
  border: 1px solid var(--admin-border, #334155);
  border-radius: 7px;
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.esg-ctx-item {
  padding: 8px 14px;
  font-size: 12px;
  color: var(--admin-text);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.12s;
  font-family: var(--admin-font);
}
.esg-ctx-item:hover {
  background: rgba(99,102,241,0.1);
  color: var(--admin-accent-light);
}
.esg-ctx-dim { color: var(--admin-text-muted); }
.esg-ctx-sep {
  height: 1px;
  background: var(--admin-border);
  margin: 3px 6px;
  opacity: 0.5;
}

/* ---- 空状态 ---- */
.esg-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--admin-text-muted);
}
.esg-empty-icon {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--admin-text-muted);
  font-family: "Noto Serif SC", serif;
  margin-bottom: 16px;
}
.esg-empty-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--admin-text); }
.esg-empty-hint { margin: 6px 0 0; font-size: 12px; color: var(--admin-text-muted); }
</style>
