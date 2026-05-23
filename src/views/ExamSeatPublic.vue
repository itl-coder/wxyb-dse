<template>
  <div class="esp-page">
    <!-- 空状态 -->
    <div v-if="store.rooms.length === 0" class="esp-empty">
      <div class="esp-empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
      </div>
      <p class="esp-empty-title">暂无座位安排</p>
      <p class="esp-empty-desc">请前往管理后台导入考生并完成排座后查看</p>
    </div>

    <template v-else>
      <!-- 顶部导航栏 -->
      <div class="esp-topbar">
        <div class="esp-nav">
          <button class="esp-nav-btn" :disabled="currentIdx === 0" @click="currentIdx--">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="esp-nav-label">
            <strong>{{ currentRoom.name }}</strong>
            <span class="esp-nav-hint" v-if="store.rooms.length > 1">{{ currentIdx + 1 }} / {{ store.rooms.length }}</span>
          </span>
          <button class="esp-nav-btn" :disabled="currentIdx === store.rooms.length - 1" @click="currentIdx++">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="esp-top-meta">
          <span>{{ getRoomCount(currentRoom.id) }} 人</span>
          <span class="esp-meta-sep">·</span>
          <span>{{ currentRoom.rows }}×{{ currentRoom.cols }}</span>
        </div>

        <!-- 发卷路线切换 -->
        <div class="esp-dist-toggle">
          <button class="esp-dt-btn" :class="{ active: distMode === 'off' }" @click="distMode = 'off'">座位表</button>
          <button class="esp-dt-btn" :class="{ active: distMode === 's' }" @click="distMode = 's'">M型发卷</button>
          <button class="esp-dt-btn" :class="{ active: distMode === 'row' }" @click="distMode = 'row'">逐行发卷</button>
        </div>

        <div class="esp-top-actions">
          <button class="esp-btn esp-btn-img" @click="exportRoomImage(currentRoom)" :disabled="exporting">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            导出PNG
          </button>
          <button class="esp-btn esp-btn-print" @click="doPrint(currentRoom)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            打印
          </button>
        </div>
      </div>

      <!-- 考试信息 + 发卷图例 -->
      <div class="esp-info">
        <span class="esp-info-item"><b>{{ store.examName || currentRoom.examSubject || '考试座位表' }}</b></span>
        <span class="esp-info-sep">|</span>
        <span class="esp-info-item">监考：{{ currentRoom.proctor || '—' }}</span>
        <span class="esp-info-sep">|</span>
        <span class="esp-info-door">{{ (store.doorDirection || 'left') === 'left' ? '←' : '→' }} 前门进场</span>
        <span class="esp-info-sep" v-if="distMode !== 'off'">|</span>
        <span class="esp-dist-legend" v-if="distMode !== 'off'">
          发卷顺序 · 共 {{ distTotalSteps }} 份
        </span>
      </div>

      <!-- 座位表容器（26px padding） -->
      <div class="esp-grid-outer" :class="{ 'esp-dist-active': distMode !== 'off' }">
        <div class="esp-grid-inner">
          <table class="esp-grid">
            <thead>
              <tr>
                <th class="esp-th-corner"></th>
                <th v-for="c in currentRoom.cols" :key="c" class="esp-th-col">{{ colLabel(c) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in reversedRows(currentRoom)" :key="r" :class="{ 'esp-row-door': r === 1 }">
                <td class="esp-td-row">{{ r }}</td>
                <td
                  v-for="c in currentRoom.cols"
                  :key="c"
                  class="esp-td-seat"
                  :class="[seatCellClass(currentRoom, r, c), distCellClass(r, c)]"
                >
                  <span v-if="isDoorCell(currentRoom, r, c)" class="esp-door-dot"></span>

                  <template v-if="isBlocked(currentRoom, r, c)">
                    <span class="esp-seat-cross"></span>
                  </template>

                  <template v-else-if="getSeatStudent(currentRoom, r, c)">
                    <span v-if="store.publicShowNames" class="esp-seat-name">{{ getSeatStudent(currentRoom, r, c).name }}</span>
                    <span v-if="store.publicShowClass || store.publicShowElectives" class="esp-seat-meta">{{ seatMetaText(currentRoom, r, c) }}</span>
                    <span class="esp-seat-idx" v-if="distMode === 'off'">{{ colLabel(c) }}{{ r }}</span>
                    <span class="esp-dist-num" v-else-if="distStep(r, c)">{{ distStep(r, c) }}</span>
                  </template>

                  <template v-else>
                    <span class="esp-seat-idx-empty" v-if="distMode === 'off'">{{ colLabel(c) }}{{ r }}</span>
                    <span class="esp-dist-num-empty" v-else-if="distStep(r, c)">{{ distStep(r, c) }}</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 讲台 -->
      <div class="esp-podium">
        <span class="esp-podium-text">讲 台</span>
      </div>

      <!-- 考场规则 -->
      <div class="esp-rules">
        <span>考场规则：禁止携带手机、智能手表等电子设备 · 对号入座，保持安静 · 听从监考老师安排</span>
      </div>

      <!-- 底部 -->
      <div class="esp-footer">
        <span>DSE 智能学情分析 · {{ dateStr }}</span>
        <span>共 {{ currentRoom.rows * currentRoom.cols }} 座</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamSeat2Store } from '@/views/admin/exams/exam-seat2/store/examSeat2Store'
import { downloadRoomImageSVG, printRoomSVG } from '@/views/admin/exams/exam-seat2/utils/exportPipeline'
import { getMShapeOrder, getRowOrder } from '@/views/admin/exams/exam-seat2/utils/seatAllocator'
import { ElMessage } from 'element-plus'

const store = useExamSeat2Store()
const exporting = ref(false)
const currentIdx = ref(0)
const distMode = ref('off') // 'off' | 's' | 'row'

const currentRoom = computed(() => store.rooms[currentIdx.value] || store.rooms[0] || {})

const dateStr = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric'
})

// ---- 查找表 ----
const studentMap = computed(() => {
  const m = {}
  store.students.forEach(s => { m[s.id] = s })
  return m
})

const seatLookup = computed(() => {
  const l = {}
  store.assignments.forEach(a => { l[`${a.roomId}_${a.seatIndex}`] = a })
  return l
})

const blockedLookup = computed(() => {
  const l = {}
  store.blockedSeats.forEach(b => {
    if (!l[b.roomId]) l[b.roomId] = new Set()
    l[b.roomId].add(b.seatIndex)
  })
  return l
})

// ---- 发卷顺序计算 ----
const distOrder = computed(() => {
  const room = currentRoom.value
  if (!room || distMode.value === 'off') return { lookup: {}, order: [], totalSteps: 0 }

  const blocked = blockedLookup.value[room.id] || null
  const doorDir = store.doorDirection || 'left'

  if (distMode.value === 's') {
    return getMShapeOrder(room.rows, room.cols, doorDir, store.getDoorSeatIndex(room.id), blocked)
  }
  return getRowOrder(room.rows, room.cols, blocked)
})

const distTotalSteps = computed(() => distOrder.value.totalSteps)

function distStep(r, c) {
  if (distMode.value === 'off') return 0
  return distOrder.value.lookup[`${r}_${c}`] || 0
}

function distCellClass(r, c) {
  const step = distStep(r, c)
  if (!step) return ''
  if (step === 1) return 'esp-dist-first'
  if (step === distTotalSteps.value) return 'esp-dist-last'
  return 'esp-dist-step'
}

// ---- 座位计算 ----
function seatIdx(room, r, c) {
  return (r - 1) * room.cols + c
}

function getSeatStudent(room, r, c) {
  const a = seatLookup.value[`${room.id}_${seatIdx(room, r, c)}`]
  return a ? studentMap.value[a.studentId] || null : null
}

function seatMetaText(room, r, c) {
  const s = getSeatStudent(room, r, c)
  if (!s) return ''
  const parts = []
  if (store.publicShowClass && s.className) parts.push(s.className)
  if (store.publicShowElectives && s.electives?.length) parts.push(s.electives.slice(0, 2).join(' / '))
  return parts.join(' · ')
}

function isBlocked(room, r, c) {
  const set = blockedLookup.value[room.id]
  return set ? set.has(seatIdx(room, r, c)) : false
}

function getRoomCount(roomId) {
  return new Set(store.assignments.filter(a => a.roomId === roomId).map(a => a.studentId)).size
}

function reversedRows(room) {
  const rows = []
  for (let i = room.rows; i >= 1; i--) rows.push(i)
  return rows
}

function colLabel(n) {
  return String.fromCharCode(64 + n)
}

function isDoorCell(room, r, c) {
  const customDoor = store.getDoorSeatIndex(room.id)
  if (customDoor !== null && customDoor !== undefined) {
    return seatIdx(room, r, c) === customDoor
  }
  if (r !== 1) return false
  if ((store.doorDirection || 'left') === 'left') return c === 1
  return c === room.cols
}

function seatCellClass(room, r, c) {
  if (isBlocked(room, r, c)) return 'esp-cell-blocked'
  const s = getSeatStudent(room, r, c)
  if (!s) return 'esp-cell-empty'
  if (s.status === 'absent') return 'esp-cell-absent'
  if (s.status === 'special') return 'esp-cell-special'
  return 'esp-cell-occupied'
}

// ==================== 导出 ====================
async function exportRoomImage(room) {
  if (exporting.value || !room?.id) return
  exporting.value = true
  try {
    await downloadRoomImageSVG(room, store.students, store.assignments, store.blockedSeats, 'png', {
      examName: store.examName,
      doorDirection: store.doorDirection || 'left',
      doorSeatIndex: store.getDoorSeatIndex(room.id)
    })
    ElMessage.success(`${room.name} 座位表已导出`)
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || '未知错误'))
  } finally {
    exporting.value = false
  }
}

function doPrint(room) {
  if (!room?.id) return
  printRoomSVG(room, store.students, store.assignments, store.blockedSeats, {
    examName: store.examName,
    doorDirection: store.doorDirection || 'left',
    doorSeatIndex: store.getDoorSeatIndex(room.id)
  })
}
</script>

<style scoped>
/* ============================================
   考场座位公开视图 · 纯色风格 · 发卷路线
   ============================================ */
.esp-page {
  max-width: 1100px; margin: 0 auto; padding: 24px 28px 48px;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  color: #1a1a1a; background: #fff; line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ---- 空状态 ---- */
.esp-empty { text-align: center; padding: 100px 20px; }
.esp-empty-icon { color: #c0c0c0; margin-bottom: 16px; }
.esp-empty-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; color: #555; }
.esp-empty-desc { font-size: 13px; color: #999; margin: 0; }

/* ---- 顶部导航 ---- */
.esp-topbar {
  display: flex; align-items: center; gap: 12px;
  padding-bottom: 12px; border-bottom: 2px solid #e8e8e8; margin-bottom: 10px;
  flex-wrap: wrap;
}
.esp-nav { display: flex; align-items: center; gap: 8px; }
.esp-nav-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border: 1.5px solid #d0d0d0;
  background: #fff; color: #333; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
}
.esp-nav-btn:hover:not(:disabled) { border-color: #1a1a1a; background: #f5f5f5; }
.esp-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.esp-nav-label { display: flex; align-items: baseline; gap: 6px; min-width: 120px; justify-content: center; }
.esp-nav-label strong { font-size: 15px; font-weight: 700; color: #1a1a1a; }
.esp-nav-hint { font-size: 11px; color: #999; font-family: "SF Mono","Consolas",monospace; }

.esp-top-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #777; }
.esp-meta-sep { color: #ccc; }

.esp-top-actions { display: flex; gap: 8px; margin-left: auto; }
.esp-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border: 1.5px solid #d0d0d0;
  background: #fff; color: #333; cursor: pointer;
  font-size: 12px; font-weight: 600; font-family: inherit;
  border-radius: 8px; transition: all 0.15s;
}
.esp-btn:hover:not(:disabled) { border-color: #1a1a1a; background: #f8f8f8; }
.esp-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.esp-btn-img:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #f0f4ff; }
.esp-btn-print:hover:not(:disabled) { border-color: #059669; color: #059669; background: #ecfdf5; }

/* ---- 发卷切换 ---- */
.esp-dist-toggle {
  display: flex; gap: 2px; background: #f3f4f6;
  border-radius: 8px; padding: 3px;
}
.esp-dt-btn {
  padding: 6px 13px; border: none; background: transparent;
  color: #777; font-size: 11px; font-weight: 600; font-family: inherit;
  border-radius: 6px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.esp-dt-btn:hover { color: #333; }
.esp-dt-btn.active { background: #fff; color: #6366f1; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

/* ---- 信息行 + 发卷图例 ---- */
.esp-info {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0 4px;
  font-size: 12px; color: #777; margin-bottom: 12px;
}
.esp-info b { color: #1a1a1a; font-weight: 600; margin-right: 2px; }
.esp-info-sep { color: #ddd; margin: 0 6px; }
.esp-info-item { white-space: nowrap; }
.esp-info-door {
  margin-left: auto; font-size: 11px; color: #888;
  background: #f5f5f5; padding: 2px 10px; border-radius: 4px; border: 1px solid #e8e8e8;
}
.esp-dist-legend {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--admin-accent-light, #6366f1); font-weight: 600;
}

/* ---- 座位表容器 ---- */
.esp-grid-outer {
  background: #fff; border: 1px solid #e8e8e8;
  border-radius: 10px; padding: 26px;
}
.esp-grid-inner { overflow-x: auto; position: relative; }

.esp-grid { margin: 0 auto; border-collapse: separate; border-spacing: 4px 4px; table-layout: fixed; }

.esp-th-corner { background: transparent; width: 28px; min-width: 28px; }
.esp-th-col {
  font-size: 11px; font-weight: 700; color: #999; text-align: center;
  padding: 2px 0 6px; font-family: "SF Mono","Consolas",monospace;
  width: 74px; min-width: 52px;
}
.esp-td-row {
  font-size: 11px; font-weight: 700; color: #999; text-align: center;
  font-family: "SF Mono","Consolas",monospace; width: 28px; vertical-align: middle;
}

/* 座位格 */
.esp-td-seat {
  text-align: center; vertical-align: middle; padding: 6px 8px;
  width: 74px; height: 58px; position: relative;
  background: #fafafa; border: 1.5px solid #e0e0e0;
  border-radius: 6px; transition: transform 0.15s, box-shadow 0.15s, border-color 0.25s;
}
.esp-td-seat:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-color: #c0c0c0; }
.esp-row-door .esp-td-seat { border-bottom: 2.5px solid #c0c0c0; }

.esp-cell-occupied { background: #fff; border-color: #d0d0d0; border-left: 3px solid #6366f1; }
.esp-cell-empty { background: #fdfdfd; border: 1.5px dashed #e5e5e5; }
.esp-cell-blocked { background: #f0f0f0; border: 1.5px solid #e5e5e5; }
.esp-cell-absent { background: #fefafa; border-color: #e5d0d0; border-left: 3px solid #d97878; }
.esp-cell-special { background: #fefdf8; border-color: #ddd8c0; border-left: 3px solid #c4b84c; }

/* 座号（非发卷模式） */
.esp-seat-idx {
  position: absolute; top: 3px; right: 5px;
  font-size: 8px; font-weight: 500; font-family: "SF Mono","Consolas",monospace;
  color: #c0c0c0; line-height: 1;
}
.esp-seat-idx-empty { font-size: 11px; font-weight: 500; color: #d5d5d5; font-family: "SF Mono","Consolas",monospace; }

.esp-seat-name {
  display: block; font-size: 13px; font-weight: 700; color: #1a1a1a;
  line-height: 1.3; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; margin-bottom: 3px;
}
.esp-seat-meta {
  display: block; font-size: 10px; color: #999; line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ---- 发卷序号（精巧小标） ---- */
.esp-dist-num {
  position: absolute; top: 2px; right: 4px;
  font-size: 9px; font-weight: 700; font-family: "SF Mono","Consolas",monospace;
  color: #6366f1; line-height: 1; opacity: 0.8;
}
.esp-dist-first .esp-dist-num { color: #10b981; font-size: 10px; }
.esp-dist-last .esp-dist-num { color: #f43f5e; font-size: 10px; }
.esp-dist-num-empty {
  font-size: 10px; font-weight: 500; font-family: "SF Mono","Consolas",monospace;
  color: #c0c0c0;
}

/* 屏蔽 */
.esp-seat-cross {
  display: inline-block; width: 14px; height: 14px; position: relative; opacity: 0.22;
}
.esp-seat-cross::before, .esp-seat-cross::after {
  content: ''; position: absolute; top: 50%; left: 50%;
  width: 12px; height: 1.5px; background: #999;
}
.esp-seat-cross::before { transform: translate(-50%, -50%) rotate(45deg); }
.esp-seat-cross::after  { transform: translate(-50%, -50%) rotate(-45deg); }

.esp-door-dot {
  position: absolute; top: 5px; left: 8px;
  width: 5px; height: 5px; border-radius: 50%;
  background: #6366f1; z-index: 5;
}

/* 讲台 */
.esp-podium {
  text-align: center; margin: 16px 0; padding: 11px 0;
  background: linear-gradient(180deg, #f8f7f5 0%, #f3f2ef 50%, #f8f7f5 100%);
  border: 1px solid #e0ddd8; border-radius: 6px;
  box-shadow: 1px 1px 0 0 #e8e5e0, 1px 2px 3px rgba(0,0,0,0.03);
}
.esp-podium-text {
  font-size: 13px; font-weight: 600; letter-spacing: 14px;
  color: #8b8680; font-family: "Noto Serif SC","STSong",serif;
}

.esp-rules { margin: 10px 0 4px; padding: 6px 12px; font-size: 11px; color: #aaa; text-align: center; }

.esp-footer {
  display: flex; justify-content: space-between; padding-top: 8px;
  border-top: 1px solid #eee; font-size: 10px; color: #c0c0c0;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .esp-page { padding: 16px 10px 24px; }
  .esp-topbar { flex-wrap: wrap; gap: 8px; }
  .esp-top-actions { margin-left: 0; }
  .esp-nav-label { min-width: auto; }
  .esp-grid-outer { padding: 12px; }
  .esp-td-seat { width: 52px; min-width: 46px; height: 46px; padding: 3px 4px; }
  .esp-th-col { width: 52px; min-width: 40px; font-size: 10px; }
  .esp-seat-name { font-size: 11px; margin-bottom: 2px; }
  .esp-seat-meta { font-size: 8px; }
  .esp-seat-idx { font-size: 7px; top: 2px; right: 3px; }
  .esp-dist-toggle { margin-left: 0; }
  .esp-dist-num { font-size: 8px; top: 1px; right: 2px; }
  .esp-dist-arrow { width: 10px; height: 10px; }
}

/* ---- 打印 ---- */
@media print {
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .esp-page { max-width: 100%; padding: 0; background: #fff; }
  .esp-topbar, .esp-info, .esp-rules, .esp-footer { display: none !important; }
  .esp-grid-outer { border: none; border-radius: 0; padding: 26px; }
  .esp-grid { border-spacing: 2px 2px; }
  .esp-th-col { font-size: 9px; padding: 2px 0; width: 56px; min-width: 42px; }
  .esp-td-row { font-size: 9px; width: 22px; }
  .esp-td-seat {
    width: 56px; height: 38px; padding: 3px 5px;
    background: #fff; border: 1px solid #999; box-shadow: none; border-radius: 2px;
  }
  .esp-row-door .esp-td-seat { border-bottom: 2px solid #666; }
  .esp-cell-empty { background: #fafafa; border: 1px dashed #ccc; }
  .esp-cell-blocked { background: #eee; border: 1px solid #ccc; }
  .esp-cell-occupied { border-left: 2px solid #666; }
  .esp-cell-absent { border-left: 2px solid #999; }
  .esp-cell-special { border-left: 2px solid #999; }
  .esp-seat-name { font-size: 11px; font-weight: 600; margin-bottom: 2px; }
  .esp-seat-meta { font-size: 7px; color: #888; }
  .esp-seat-idx { font-size: 6px; color: #bbb; top: 2px; right: 3px; }
  .esp-seat-idx-empty { font-size: 8px; color: #ddd; }
  .esp-door-dot { top: 3px; left: 5px; width: 4px; height: 4px; }
  .esp-dist-num, .esp-dist-num-empty, .esp-dist-arrow { display: none !important; }
  .esp-podium { margin: 8px 0; padding: 5px 0; border-color: #ccc; background: #f8f8f8; box-shadow: none; border-radius: 2px; }
  .esp-podium-text { font-size: 10px; letter-spacing: 6px; }
  @page { size: 297mm 210mm landscape; margin: 4mm; }
}
</style>
