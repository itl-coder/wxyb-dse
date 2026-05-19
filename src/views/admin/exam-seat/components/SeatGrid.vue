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
      <div class="sg-legend">
        <span class="legend-item"><span class="legend-swatch empty"></span>空位</span>
        <span class="legend-item"><span class="legend-swatch occupied"></span>已占</span>
        <span class="legend-item"><span class="legend-swatch locked"></span>锁定</span>
        <span class="legend-item"><span class="legend-swatch conflict"></span>冲突</span>
        <span class="legend-item"><span class="legend-swatch blocked"></span>屏蔽</span>
      </div>
    </div>

    <!-- 讲台 -->
    <div class="sg-podium">
      <span class="podium-dash"></span>
      <span class="podium-text">讲 台</span>
      <span class="podium-dash"></span>
    </div>

    <!-- 批量操作 -->
    <div class="sg-batch-actions" v-if="assignedInRoom > 0">
      <button class="sg-batch-btn" @click="store.clearRoom(room.id)" title="清除本教室所有非锁定座位">清空</button>
      <button class="sg-batch-btn" @click="store.lockAllInRoom(room.id)" title="锁定本教室所有座位">全部锁定</button>
      <button class="sg-batch-btn" @click="store.unlockAllInRoom(room.id)" title="解锁本教室所有座位">全部解锁</button>
    </div>

    <div class="sg-wrapper">
      <div class="sg-col-labels">
        <div class="sg-corner"></div>
        <div v-for="c in room.cols" :key="c" class="sg-col-label">{{ colLetter(c) }}</div>
      </div>
      <div class="sg-grid" ref="gridEl" :key="gridKey" :data-room-id="room.id" @keydown.esc="store.deselectSeat()">
        <div v-for="r in room.rows" :key="r" class="sg-row" :data-row="r">
          <div class="sg-row-label">{{ r }}</div>
          <div
            v-for="c in room.cols" :key="c"
            class="sg-cell"
            :data-row="r" :data-col="c"
            :data-seat-index="(r-1)*room.cols + c"
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
              @toggle-lock="store.toggleLock(room.id, (r-1)*room.cols + c)"
              @remove="store.unassignStudent(getStudent(room.id, (r-1)*room.cols + c)?.id)"
              @click-seat="onSeatClick"
              @contextmenu="onSeatContextMenu"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="sg-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <div
          class="sg-context-item"
          v-if="!contextMenu.isBlocked"
          @click="onBlockSeat"
        >屏蔽此座位</div>
        <div
          class="sg-context-item"
          v-else
          @click="onUnblockSeat"
        >解除屏蔽</div>
      </div>
    </Teleport>
  </div>
  <div class="seat-grid-empty" v-else>
    <div class="empty-illustration">
      <div class="empty-glyph">贡</div>
    </div>
    <p class="empty-title">选择考场教室</p>
    <p class="empty-hint">从左侧列表中选择一间教室以查看座位布局</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useExamSeatStore } from '../store/examSeatStore.js'
import SeatCard from './SeatCard.vue'
import Sortable from 'sortablejs'

const store = useExamSeatStore()
const gridEl = ref(null)
const sortables = []
const gridKey = ref(0)

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

// 右键菜单
const contextMenu = ref({ show: false, x: 0, y: 0, roomId: null, seatIndex: null, isBlocked: false })

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

// 点击选座换位
function onSeatClick(roomId, seatIndex) {
  contextMenu.value.show = false
  store.handleSeatClick(roomId, seatIndex)
}

// 右键菜单
function onSeatContextMenu(event, roomId, seatIndex) {
  const isBlocked = store.isSeatBlocked(roomId, seatIndex)
  const hasStudent = getStudent(roomId, seatIndex)
  if (hasStudent && !isBlocked) return
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    roomId,
    seatIndex,
    isBlocked
  }
}

function onBlockSeat() {
  store.blockSeat(contextMenu.value.roomId, contextMenu.value.seatIndex)
  contextMenu.value.show = false
}

function onUnblockSeat() {
  store.unblockSeat(contextMenu.value.roomId, contextMenu.value.seatIndex)
  contextMenu.value.show = false
}

function closeContextMenu() {
  contextMenu.value.show = false
}

// Escape 取消选中
function onKeydown(e) {
  if (e.key === 'Escape') {
    store.deselectSeat()
    closeContextMenu()
  }
}

onMounted(() => {
  nextTick(initSortables)
  window.addEventListener('click', closeContextMenu)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  destroySortables()
  window.removeEventListener('click', closeContextMenu)
  window.removeEventListener('keydown', onKeydown)
})

function destroySortables() {
  sortables.forEach(s => s.destroy())
  sortables.length = 0
}

function calcSeatIndex(cellEl) {
  const rowEl = cellEl.closest('.sg-row')
  const gridEl = cellEl.closest('.sg-grid')
  if (!rowEl || !gridEl) return { roomId: null, seatIndex: null }
  const roomId = parseInt(gridEl.dataset.roomId)
  const rowNum = parseInt(rowEl.dataset.row)
  const room = store.rooms.find(r => r.id === roomId)
  if (!room || isNaN(rowNum)) return { roomId: null, seatIndex: null }
  const cells = [...rowEl.children].filter(c => c.classList.contains('sg-cell'))
  const colIndex = cells.indexOf(cellEl)
  if (colIndex === -1) return { roomId: null, seatIndex: null }
  const colNum = colIndex + 1
  return { roomId, seatIndex: (rowNum - 1) * room.cols + colNum }
}

function onSeatDragEnd(evt) {
  // 来源房间从 onStart 记录的 data-from-room 读取（SortableJS 移动后 DOM 位置已变）
  const fromRoomId = parseInt(evt.item.dataset.fromRoom)
  const oldSeatIndex = parseInt(evt.item.dataset.seatIndex)
  if (!fromRoomId || isNaN(oldSeatIndex)) return

  // 通过 DOM 位置计算目标 seatIndex
  const { roomId: toRoomId, seatIndex: newSeatIndex } = calcSeatIndex(evt.item)
  if (!toRoomId || isNaN(newSeatIndex)) return

  // 检查目标是否被屏蔽或锁定
  if (store.isSeatBlocked(toRoomId, newSeatIndex)) {
    gridKey.value++
    return
  }
  const targetAssignment = store.assignments.find(a => a.roomId === toRoomId && a.seatIndex === newSeatIndex)
  if (targetAssignment?.locked) {
    gridKey.value++
    return
  }

  if (fromRoomId === toRoomId && oldSeatIndex === newSeatIndex) {
    gridKey.value++
    return
  }

  store.swapSeats(fromRoomId, oldSeatIndex, toRoomId, newSeatIndex)
  gridKey.value++
}

function initSortables() {
  if (!gridEl.value) return
  destroySortables()

  const rows = gridEl.value.querySelectorAll('.sg-row')
  rows.forEach(row => {
    const s = Sortable.create(row, {
      group: { name: 'seats', pull: true, put: true },
      animation: 200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      draggable: '.sg-cell',
      filter: '.seat-card.locked, .seat-card.blocked, .sg-row-label',
      preventOnFilter: false,
      onStart(evt) {
        const fromGrid = evt.item.closest('.sg-grid')
        evt.item.setAttribute('data-dragging', 'true')
        evt.item.setAttribute('data-from-room', fromGrid?.dataset?.roomId || '')
      },
      onAdd(evt) {
        // 学生池拖入的克隆不是 .sg-cell，移除并交给 StudentPool 的 onEnd 处理数据
        if (!evt.item.classList.contains('sg-cell')) {
          evt.item.remove()
        }
      },
      setData(dataTransfer, dragEl) {
        const name = dragEl.querySelector('.seat-name')?.textContent || ''
        const cls = dragEl.querySelector('.seat-class')?.textContent || ''
        dataTransfer.setData('text/plain', `${name} · ${cls}`)
      },
      onEnd: onSeatDragEnd
    })
    sortables.push(s)
  })
}

watch(() => room.value?.id, () => nextTick(initSortables))
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
  margin-bottom: 10px;
  flex-wrap: wrap;
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
.sg-meta-subject {
  color: var(--es-gold);
}
.sg-legend {
  display: flex;
  gap: 14px;
  font-size: 10px;
  color: var(--es-text-muted);
  align-items: center;
  flex-wrap: wrap;
}
.legend-item { display: flex; align-items: center; gap: 5px; }
.legend-swatch {
  width: 9px; height: 9px;
  border-radius: 2px;
  display: inline-block;
}
.legend-swatch.empty { border: 1px dashed rgba(255,255,255,0.22); }
.legend-swatch.occupied { background: rgba(45,138,78,0.35); border: 1px solid rgba(45,138,78,0.3); }
.legend-swatch.locked { background: rgba(91,91,206,0.4); border: 1px solid rgba(91,91,206,0.4); }
.legend-swatch.conflict { background: rgba(196,30,58,0.45); border: 1px solid rgba(196,30,58,0.4); animation: es-pulse-conflict 2s ease-in-out infinite; }
.legend-swatch.blocked { background: rgba(196,30,58,0.12); border: 1px dashed rgba(196,30,58,0.35); }

/* 批量操作按钮 */
.sg-batch-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.sg-batch-btn {
  padding: 4px 12px;
  border: 1px solid var(--es-border);
  background: var(--es-surface-alt);
  color: var(--es-text-secondary);
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  transition: all 0.15s;
}
.sg-batch-btn:hover {
  border-color: var(--es-border-active);
  color: var(--es-text);
  background: var(--es-surface);
}

/* 讲台 */
.sg-podium {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 14px;
  margin: 0 40px 18px;
  border: 1px solid rgba(201,168,76,0.08);
  border-radius: var(--es-radius);
  background: linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.03) 30%, rgba(201,168,76,0.05) 50%, rgba(201,168,76,0.03) 70%, transparent 100%);
}
.podium-dash {
  width: 32px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(201,168,76,0.2));
}
.podium-text {
  font-size: 12px;
  letter-spacing: 6px;
  color: var(--es-text-muted);
  font-weight: 500;
}

.sg-wrapper { flex: 1; overflow: auto; }
.sg-col-labels { display: flex; margin-bottom: 4px; }
.sg-corner { width: 26px; flex-shrink: 0; }
.sg-col-label {
  flex: 1;
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--es-text-muted);
  font-family: "SF Mono", "Cascadia Code", monospace;
  padding: 3px 0;
  letter-spacing: 1px;
}
.sg-grid { display: flex; flex-direction: column; gap: 3px; }
.sg-row { display: flex; align-items: stretch; gap: 3px; }
.sg-row-label {
  width: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--es-text-muted);
  font-family: "SF Mono", "Cascadia Code", monospace;
}
.sg-cell {
  flex: 1;
  min-width: 66px;
  max-width: 96px;
}

/* 右键菜单 */
.sg-context-menu {
  position: fixed;
  z-index: 9999;
  background: #1a1d28;
  border: 1px solid var(--es-border);
  border-radius: 7px;
  padding: 4px;
  min-width: 120px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.sg-context-item {
  padding: 8px 14px;
  font-size: 12px;
  color: var(--es-text);
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.12s;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
.sg-context-item:hover {
  background: rgba(201,168,76,0.1);
  color: var(--es-gold);
}

/* 空状态 */
.seat-grid-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.empty-illustration {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--es-surface-alt);
  border: 1px solid var(--es-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.empty-glyph {
  font-size: 28px;
  color: var(--es-text-muted);
  font-family: "Noto Serif SC", "PingFang SC", serif;
}
.empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--es-text);
}
.empty-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--es-text-muted);
}
</style>
