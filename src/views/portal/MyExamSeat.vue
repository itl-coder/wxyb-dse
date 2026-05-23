<template>
  <div class="mes-page">
    <!-- 空状态 -->
    <div v-if="!rooms.length" class="mes-empty">
      <div class="mes-empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      </div>
      <h3>暂无考场座位安排</h3>
      <p>请联系班主任完成座位编排后查看</p>
    </div>

    <template v-else>
      <!-- 顶部栏 -->
      <header class="mes-header">
        <h1 class="mes-title">考场座位预览</h1>
        <div class="mes-header-actions">
          <div class="mes-orient-toggle">
            <button class="mes-ori-btn" :class="{ active: orientation === 'landscape' }" @click="orientation = 'landscape'">横版</button>
            <button class="mes-ori-btn" :class="{ active: orientation === 'portrait' }" @click="orientation = 'portrait'">竖版</button>
          </div>
          <button class="mes-act-btn" @click="doPrint">打印</button>
          <button class="mes-act-btn mes-act-primary" @click="doExport('png')" :disabled="dl === 'png'">{{ dl === 'png' ? '导出中…' : 'PNG' }}</button>
          <button class="mes-act-btn" @click="doExport('jpg')" :disabled="dl === 'jpg'">{{ dl === 'jpg' ? '导出中…' : 'JPG' }}</button>
        </div>
      </header>

      <!-- 教室选择 -->
      <nav class="mes-rooms">
        <button
          v-for="r in rooms" :key="r.id"
          class="mes-room-chip"
          :class="{ active: currentRoomId === r.id }"
          @click="currentRoomId = r.id"
        >{{ r.name }}<small>{{ r.rows }}×{{ r.cols }} · {{ r.rows * r.cols }}座</small></button>
      </nav>

      <!-- 座位表主体 -->
      <div v-if="currentRoom" class="mes-body" :class="'mes-' + orientation" :style="bodyStyle">
        <!-- 信息栏 + 图例（同一行） -->
        <div class="mes-topbar">
          <div class="mes-info">
            <span v-if="currentRoom.examSubject" class="mes-tag">{{ currentRoom.examSubject }}</span>
            <span v-if="currentRoom.examTime" class="mes-tag">{{ currentRoom.examTime }}</span>
            <span v-if="currentRoom.proctor" class="mes-tag">监考：{{ currentRoom.proctor }}</span>
          </div>
          <div class="mes-legend">
            <span class="mes-legend-item"><i class="mes-ldot occ"></i>已安排</span>
            <span class="mes-legend-item"><i class="mes-ldot empty"></i>空位</span>
            <span class="mes-legend-item" v-if="cfg.showBlockedSeats"><i class="mes-ldot blocked"></i>屏蔽</span>
            <span class="mes-legend-item"><i class="mes-ldot door"></i>门口</span>
          </div>
        </div>

        <!-- 门口指示 -->
        <div class="mes-door-bar">
          <span class="mes-door-arrow">→</span> 前门 · 进场方向
          <span class="mes-door-dot-hint">● 第一位考生</span>
        </div>

        <!-- 座位表 -->
        <div class="mes-grid-wrap">
          <table class="mes-grid">
            <colgroup>
              <col v-if="cfg.showRowColLabels" class="mes-col-rowlabel">
              <col v-for="c in currentRoom.cols" :key="c" class="mes-col-seat">
            </colgroup>
            <thead v-if="cfg.showRowColLabels">
              <tr>
                <th class="mes-th-corner"></th>
                <th v-for="c in currentRoom.cols" :key="c" class="mes-th-col">{{ colLabel(c) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in displayRows" :key="r">
                <td v-if="cfg.showRowColLabels" class="mes-td-row">{{ r }}</td>
                <td
                  v-for="c in currentRoom.cols" :key="c"
                  class="mes-td-seat"
                  :class="seatCellClass(r, c)"
                  :style="cellStyle"
                >
                  <span v-if="isFirstSeat(r, c)" class="mes-door-dot">●</span>
                  <template v-if="isBlocked(r, c)">
                    <span class="mes-seat-blocked">—</span>
                  </template>
                  <template v-else-if="getStudent(r, c)">
                    <span class="mes-seat-name">{{ getStudent(r, c).name }}</span>
                    <span class="mes-seat-class" v-if="getStudent(r, c).className">{{ getStudent(r, c).className }}</span>
                    <span class="mes-seat-elective" v-if="seatElectiveText(r, c)">{{ seatElectiveText(r, c) }}</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 底部 -->
        <div class="mes-footer">
          <label class="mes-cfg-item">
            <input type="checkbox" v-model="cfg.showRowColLabels" @change="saveConfig"> 行列标号
          </label>
          <label class="mes-cfg-item">
            <input type="checkbox" v-model="cfg.showBlockedSeats" @change="saveConfig"> 显示屏蔽
          </label>
          <label class="mes-cfg-item">
            <input type="checkbox" v-model="cfg.watermarkEnabled" @change="saveConfig"> 导出水印
          </label>
          <span class="mes-footer-stat">共 {{ currentRoom.rows * currentRoom.cols }} 座 · 已安排 {{ roomAssigned }} 人 · {{ currentRoom.name }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamSeat2Store } from '@/views/admin/exams/exam-seat2/store/examSeat2Store'
import { useExamSeatPreview } from '@/composables/useExamSeatPreview'

const {
  cfg, currentRoomId, currentRoom, rooms,
  saveConfig, downloadImage, printPreview
} = useExamSeatPreview()

const seatStore = useExamSeat2Store()
const dl = ref(null)
const orientation = ref('landscape')

// ---- 座位索引 ----
const seatMap = computed(() => {
  const m = {}
  seatStore.assignments.forEach(a => { m[`${a.roomId}_${a.seatIndex}`] = a })
  return m
})
const studentMap = computed(() => {
  const m = {}
  seatStore.students.forEach(s => { m[s.id] = s })
  return m
})
const blockedSet = computed(() => {
  const s = new Set()
  if (!currentRoom.value) return s
  ;(seatStore.blockedSeats || []).filter(b => b.roomId === currentRoom.value.id).forEach(b => s.add(b.seatIndex))
  return s
})
const roomAssigned = computed(() => {
  if (!currentRoom.value) return 0
  return seatStore.assignments.filter(a => a.roomId === currentRoom.value.id).length
})

// 反转行：第1行在底部（靠近讲台）
const displayRows = computed(() => {
  if (!currentRoom.value) return []
  const rows = []
  for (let i = currentRoom.value.rows; i >= 1; i--) rows.push(i)
  return rows
})

function seatIdx(r, c) { return (r - 1) * currentRoom.value.cols + c }
function getStudent(r, c) {
  const a = seatMap.value[`${currentRoom.value.id}_${seatIdx(r, c)}`]
  return a ? studentMap.value[a.studentId] : null
}
function isBlocked(r, c) { return blockedSet.value.has(seatIdx(r, c)) }
function seatCellClass(r, c) {
  if (isBlocked(r, c)) return 'seat-blocked'
  return getStudent(r, c) ? 'seat-occupied' : 'seat-empty'
}
function seatElectiveText(r, c) {
  if (isBlocked(r, c)) return ''
  const s = getStudent(r, c)
  return s?.electives?.length ? s.electives.slice(0, 2).join(' / ') : ''
}

// 门口：优先使用教室指定门口座位，否则第一个有学生的非屏蔽座位
const firstSeatIndex = computed(() => {
  if (!currentRoom.value) return -1
  const rid = currentRoom.value.id
  const customDoor = seatStore.getDoorSeatIndex(rid)
  if (customDoor !== null && customDoor !== undefined) return customDoor
  for (let si = 1; si <= currentRoom.value.rows * currentRoom.value.cols; si++) {
    if (seatMap.value[`${rid}_${si}`] && !blockedSet.value.has(si)) return si
  }
  return -1
})
function isFirstSeat(r, c) { return seatIdx(r, c) === firstSeatIndex.value }
function colLabel(n) { return String.fromCharCode(64 + n) }

// ---- 格子尺寸（填满可用宽度，限制最大尺寸防止大屏过大） ----
const A4_USABLE_W = 1060
const ROW_LABEL_W = 30
const CELL_MAX_W = 110 // 单格最大宽度
const CELL_MAX_H = 86  // 单格最大高度

const bodyStyle = computed(() => {
  if (!currentRoom.value) return {}
  const cols = currentRoom.value.cols
  const isPortrait = orientation.value === 'portrait'
  const maxW = isPortrait ? 740 : A4_USABLE_W
  const rawW = Math.floor((maxW - (cfg.showRowColLabels ? ROW_LABEL_W : 0)) / cols)
  const cellW = Math.min(rawW, CELL_MAX_W)
  const cellH = Math.floor(Math.min(cellW * 0.78, CELL_MAX_H))
  return {
    '--cell-w': cellW + 'px',
    '--cell-h': cellH + 'px'
  }
})

const cellStyle = computed(() => ({
  width: 'var(--cell-w)',
  height: 'var(--cell-h)'
}))

// ---- 导出 ----
async function doExport(format) {
  if (!currentRoom.value) return
  dl.value = format
  try { await downloadImage(currentRoom.value, format) }
  finally { dl.value = null }
}
function doPrint() {
  if (currentRoom.value) printPreview(currentRoom.value)
}
</script>

<style scoped>
.mes-page {
  max-width: 1100px; margin: 0 auto; padding: 0 20px 40px;
}

/* ====== 空状态 ====== */
.mes-empty { text-align: center; padding: 80px 20px; color: var(--text-muted); }
.mes-empty-icon { color: #c0c8d4; margin-bottom: 12px; }
.mes-empty h3 { font-size: 14px; color: var(--text-secondary); margin: 0 0 4px; font-weight: 600; }
.mes-empty p { font-size: 12px; margin: 0; }

/* ====== Header ====== */
.mes-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 0 12px; gap: 16px; flex-wrap: wrap;
}
.mes-title {
  font-size: 18px; font-weight: 700; color: var(--text-primary);
  margin: 0; letter-spacing: 0.5px;
}
.mes-header-actions { display: flex; gap: 8px; align-items: center; }

.mes-orient-toggle {
  display: flex; border: 1px solid var(--border-base); border-radius: 6px; overflow: hidden;
}
.mes-ori-btn {
  padding: 5px 14px; border: none; background: var(--card-bg);
  color: var(--text-secondary); font-size: 11px; cursor: pointer;
  font-family: inherit; transition: all 0.15s;
}
.mes-ori-btn + .mes-ori-btn { border-left: 1px solid var(--border-base); }
.mes-ori-btn.active { background: var(--accent); color: #fff; font-weight: 600; }

.mes-act-btn {
  padding: 6px 14px; border: 1px solid var(--border-base); background: var(--card-bg);
  color: var(--text-secondary); border-radius: 6px; cursor: pointer;
  font-size: 11px; font-family: inherit; transition: all 0.15s;
}
.mes-act-btn:hover { border-color: var(--accent); color: var(--accent); }
.mes-act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mes-act-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.mes-act-primary:hover { background: var(--primary-l); color: #fff; }

/* ====== Room Chips ====== */
.mes-rooms { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.mes-room-chip {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 7px 18px; border: 1px solid var(--border-base); background: var(--card-bg);
  border-radius: 7px; cursor: pointer; font-family: inherit;
  font-size: 13px; font-weight: 600; color: var(--text-secondary);
  transition: all 0.18s; min-width: 90px;
}
.mes-room-chip small { font-size: 10px; font-weight: 400; opacity: 0.65; }
.mes-room-chip:hover { border-color: var(--accent-l); }
.mes-room-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.mes-room-chip.active small { opacity: 0.85; }

/* ====== Body ====== */
.mes-body {
  background: var(--card-bg); border: 1px solid var(--border-base);
  border-radius: 10px; padding: 14px 20px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.mes-landscape { max-width: 1060px; }
.mes-portrait { max-width: 760px; margin: 0 auto; }

/* ====== Top Bar (info + legend) ====== */
.mes-topbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px; gap: 12px; flex-wrap: wrap;
}
.mes-info { display: flex; gap: 6px; flex-wrap: wrap; }
.mes-tag {
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 3px;
  background: #eef2ff; color: #4f5de4;
}

/* ====== Legend ====== */
.mes-legend { display: flex; gap: 14px; font-size: 10px; color: var(--text-muted); }
.mes-legend-item { display: flex; align-items: center; gap: 4px; }
.mes-ldot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
.mes-ldot.occ { background: #fff; border: 2px solid #6366f1; border-left-width: 4px; }
.mes-ldot.empty { background: #fafbfd; border: 1px solid #dde1ea; }
.mes-ldot.blocked { background: #f4f5f7; border: 1px solid #c8cdd8; border-left: 3px solid #6e7a8a; }
.mes-ldot.door { background: #e85d75; border-radius: 50%; width: 6px; height: 6px; }

/* ====== Door Bar ====== */
.mes-door-bar {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; color: var(--text-muted); padding: 0 2px 6px;
}
.mes-door-arrow { font-size: 14px; font-weight: 700; color: var(--accent); }
.mes-door-dot-hint { margin-left: auto; opacity: 0.6; }

/* ====== Grid ====== */
.mes-grid-wrap { overflow-x: auto; margin-bottom: 8px; }
.mes-grid { margin: 0 auto; border-collapse: collapse; }
.mes-col-rowlabel { width: 28px; }
.mes-col-seat { width: var(--cell-w); }

.mes-th-corner { background: none; border: none; }
.mes-th-col {
  background: #f8f9fb; font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-align: center; padding: 2px 0; font-family: "SF Mono", "Consolas", monospace;
  border: 1px solid #e8ecf2;
}
.mes-td-row {
  background: #f8f9fb; font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-align: center; font-family: "SF Mono", "Consolas", monospace;
  border: 1px solid #e8ecf2;
}

/* 座位格（尺寸由CSS变量控制，自适应A4比例） */
.mes-td-seat {
  border: 1px solid #dde1ea;
  text-align: center; vertical-align: middle;
  padding: 4px 6px; position: relative;
  transition: background 0.12s;
  width: var(--cell-w);
  height: var(--cell-h);
  min-width: var(--cell-w);
  min-height: var(--cell-h);
}
.mes-td-seat:hover { background: #f8f9ff; }

.seat-empty { background: #fafbfd; }
.seat-occupied {
  background: #fff;
  border-left: 3px solid #6366f1;
}
.seat-blocked { background: #f4f5f7; }

.mes-seat-name {
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  display: block; line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-bottom: 3px;
}
.mes-seat-class {
  font-size: 9px; color: var(--text-secondary);
  display: block; line-height: 1.25;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mes-seat-elective {
  font-size: 8px; color: var(--text-muted);
  display: block; line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mes-seat-blocked { font-size: 13px; color: #c0c8d8; }

.mes-door-dot {
  position: absolute; top: 2px; right: 3px;
  font-size: 7px; color: #e85d75; line-height: 1;
}

/* 座位格微立体 */
.mes-td-seat.seat-occupied {
  box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset, 1px 2px 0 #e8ecf2, 1px 2px 3px rgba(0,0,0,0.04);
}

/* ====== Footer ====== */
.mes-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
  padding-top: 8px; border-top: 1px solid var(--border-light);
  font-size: 10px; color: var(--text-muted);
}
.mes-cfg-item {
  display: flex; align-items: center; gap: 3px; cursor: pointer;
  font-size: 10px; color: var(--text-muted);
}
.mes-cfg-item input[type="checkbox"] { accent-color: var(--accent); cursor: pointer; }
.mes-footer-stat { margin-left: auto; opacity: 0.7; }

/* ====== Print ====== */
@media print {
  .mes-header, .mes-rooms, .mes-topbar, .mes-footer { display: none; }
  .mes-body { border: none; box-shadow: none; padding: 0; max-width: 100%; }
  .mes-page { max-width: 100%; padding: 0; }
  .mes-grid-wrap { overflow: visible; }
  @page { size: A4 landscape; margin: 8mm; }
}

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .mes-header { flex-direction: column; align-items: flex-start; }
  .mes-header-actions { width: 100%; flex-wrap: wrap; }
  .mes-body { padding: 8px 6px 8px; }
  .mes-landscape, .mes-portrait { max-width: 100%; }
}
</style>
