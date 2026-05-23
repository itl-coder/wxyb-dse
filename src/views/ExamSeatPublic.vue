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

        <div class="esp-dist-toggle">
          <button class="esp-dt-btn" :class="{ active: distMode === 'off' }" @click="distMode = 'off'">座位表</button>
          <button class="esp-dt-btn" :class="{ active: distMode === 's' }" @click="distMode = 's'">M型发卷</button>
          <button class="esp-dt-btn" :class="{ active: distMode === 'row' }" @click="distMode = 'row'">逐行发卷</button>
        </div>

        <div class="esp-top-actions">
          <el-dropdown trigger="click" @command="handleExportCommand" :disabled="exporting">
            <button class="esp-btn esp-btn-export" :disabled="exporting" :class="{ 'esp-exporting': exporting }">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ exporting ? '导出中…' : '导出' }}
              <svg class="esp-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="png">
                  <div class="esp-export-opt">
                    <span class="esp-export-fmt">PNG</span>
                    <span class="esp-export-hint">高清图片</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="jpg">
                  <div class="esp-export-opt">
                    <span class="esp-export-fmt">JPG</span>
                    <span class="esp-export-hint">小体积</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item command="pdf" divided>
                  <div class="esp-export-opt">
                    <span class="esp-export-fmt">PDF</span>
                    <span class="esp-export-hint">打印版</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <button class="esp-btn esp-btn-print" @click="doPrint(currentRoom)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            打印
          </button>
        </div>
      </div>

      <!-- 考试信息行 -->
      <div class="esp-info">
        <span class="esp-info-item"><b>{{ store.examName || currentRoom.examSubject || '考试座位表' }}</b></span>
        <span class="esp-info-sep">|</span>
        <span class="esp-info-item">监考：{{ currentRoom.proctor || '—' }}</span>
        <span class="esp-info-sep">|</span>
        <span class="esp-info-door">{{ (store.doorDirection || 'left') === 'left' ? '←' : '→' }} 前门进场</span>
        <span class="esp-info-sep" v-if="distMode !== 'off'">|</span>
        <span class="esp-dist-legend" v-if="distMode !== 'off'">发卷顺序 · 共 {{ distTotalSteps }} 份</span>
      </div>

      <!-- ======== 真实教室场景 ======== -->
      <div class="esp-classroom-scene">
        <!-- 天花板灯光 -->
        <div class="esp-ceiling">
          <div class="esp-light-fixture" v-for="i in lightCount" :key="i">
            <div class="esp-light-tube"></div>
            <div class="esp-light-glow"></div>
          </div>
        </div>

        <!-- 教室主体 -->
        <div class="esp-room">
          <!-- 左侧墙 -->
          <div class="esp-wall-left">
            <div class="esp-wall-window" v-for="i in windowCount" :key="i">
              <div class="esp-window-pane"></div>
            </div>
          </div>

          <!-- 右侧墙 -->
          <div class="esp-wall-right">
            <div class="esp-wall-notice">考场信息</div>
          </div>

          <!-- 后墙（顶部） -->
          <div class="esp-wall-back">
            <div class="esp-clock">🕐</div>
          </div>

          <!-- 前墙 + 黑板 -->
          <div class="esp-wall-front">
            <div class="esp-blackboard-frame">
              <div class="esp-blackboard">
                <div class="esp-blackboard-inner">
                  <span class="esp-blackboard-title">{{ store.examName || currentRoom.examSubject || '考试座位表' }}</span>
                  <span class="esp-blackboard-sub">{{ currentRoom.name }} · {{ currentRoom.rows }}×{{ currentRoom.cols }} · {{ getRoomCount(currentRoom.id) }}人</span>
                  <div class="esp-blackboard-line"></div>
                  <span class="esp-blackboard-rule">诚信考试 · 冷静作答</span>
                </div>
              </div>
              <!-- 粉笔槽 -->
              <div class="esp-chalk-tray">
                <div class="esp-chalk-stick" v-for="i in 4" :key="i" :style="{ background: chalkColors[i-1] }"></div>
                <div class="esp-eraser-box"></div>
              </div>
            </div>
            <div class="esp-flag-stand">
              <div class="esp-flag-pole"></div>
              <div class="esp-flag-cloth"></div>
            </div>
          </div>

          <!-- 地板 + 座位区 -->
          <div class="esp-floor">
            <!-- 课桌阵列 -->
            <div class="esp-desks-area">
              <div
                v-for="r in reversedRows(currentRoom)"
                :key="r"
                class="esp-desk-row"
                :class="{ 'esp-row-first': r === 1 }"
              >
                <div
                  v-for="c in currentRoom.cols"
                  :key="c"
                  class="esp-desk-cell"
                  :class="[deskCellClass(currentRoom, r, c), distCellClass(r, c)]"
                >
                  <!-- 门口标记 -->
                  <span v-if="isDoorCell(currentRoom, r, c)" class="esp-door-marker">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </span>

                  <!-- 屏蔽座位 -->
                  <template v-if="isBlocked(currentRoom, r, c)">
                    <div class="esp-desk-blocked">
                      <span class="esp-desk-blocked-x"></span>
                    </div>
                  </template>

                  <!-- 已安排考生 -->
                  <template v-else-if="getSeatStudent(currentRoom, r, c)">
                    <div class="esp-desk-real">
                      <div class="esp-desk-surface">
                        <span class="esp-desk-name" v-if="store.publicShowNames">{{ getSeatStudent(currentRoom, r, c).name }}</span>
                        <span class="esp-desk-meta" v-if="store.publicShowClass || store.publicShowElectives">{{ seatMetaText(currentRoom, r, c) }}</span>
                        <span class="esp-desk-seatno" v-if="distMode === 'off'">{{ colLabel(c) }}{{ r }}</span>
                        <span class="esp-desk-distno" v-else-if="distStep(r, c)">{{ distStep(r, c) }}</span>
                      </div>
                      <div class="esp-chair">
                        <div class="esp-chair-seat"></div>
                        <div class="esp-chair-back"></div>
                      </div>
                    </div>
                  </template>

                  <!-- 空位 -->
                  <template v-else>
                    <div class="esp-desk-empty">
                      <div class="esp-desk-surface-empty">
                        <span class="esp-desk-seatno-empty" v-if="distMode === 'off'">{{ colLabel(c) }}{{ r }}</span>
                        <span class="esp-desk-distno-empty" v-else-if="distStep(r, c)">{{ distStep(r, c) }}</span>
                      </div>
                      <div class="esp-chair-empty"></div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- 讲台（课桌与黑板之间） -->
            <div class="esp-podium-area">
              <div class="esp-podium-desk">
                <div class="esp-podium-top"></div>
                <div class="esp-podium-body">
                  <span class="esp-podium-label">讲 台</span>
                </div>
              </div>
            </div>

            <!-- 过道标记 -->
            <div class="esp-aisle-left"></div>
            <div class="esp-aisle-right"></div>
          </div>
        </div>
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
import { downloadRoomImageSVG, downloadRoomPDFSVG, printRoomSVG } from '@/views/admin/exams/exam-seat2/utils/exportPipeline'
import { getMShapeOrder, getRowOrder } from '@/views/admin/exams/exam-seat2/utils/seatAllocator'
import { ElMessage } from 'element-plus'

const store = useExamSeat2Store()
const exporting = ref(false)
const currentIdx = ref(0)
const distMode = ref('off')

const currentRoom = computed(() => store.rooms[currentIdx.value] || store.rooms[0] || {})

const dateStr = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric'
})

// 粉笔颜色
const chalkColors = ['#f5f0e8', '#e8d8c0', '#f0d8d0', '#d8e8f0']

// 天花板灯具数量（根据教室列数）
const lightCount = computed(() => Math.max(2, Math.ceil((currentRoom.value.cols || 5) / 2)))
// 窗户数量（根据教室行数）
const windowCount = computed(() => Math.max(1, Math.ceil((currentRoom.value.rows || 5) / 3)))

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

// ---- 发卷顺序 ----
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

function deskCellClass(room, r, c) {
  if (isBlocked(room, r, c)) return 'esp-desk-blocked'
  const s = getSeatStudent(room, r, c)
  if (!s) return 'esp-desk-empty'
  if (s.status === 'absent') return 'esp-desk-absent'
  if (s.status === 'special') return 'esp-desk-special'
  return 'esp-desk-occupied'
}

// ==================== 导出 ====================
const exportOpts = computed(() => ({
  examName: store.examName,
  doorDirection: store.doorDirection || 'left',
  doorSeatIndex: store.getDoorSeatIndex(currentRoom.value.id)
}))

async function handleExportCommand(format) {
  if (exporting.value || !currentRoom.value?.id) return
  exporting.value = true
  try {
    const room = currentRoom.value
    if (format === 'pdf') {
      await downloadRoomPDFSVG(room, store.students, store.assignments, store.blockedSeats, exportOpts.value)
    } else {
      await downloadRoomImageSVG(room, store.students, store.assignments, store.blockedSeats, format, exportOpts.value)
    }
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
   考场座位公开视图 · 真实教室场景
   ============================================ */
.esp-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 28px 48px;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  color: #3d3226;
  background: #faf8f4;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ---- 空状态 ---- */
.esp-empty { text-align: center; padding: 100px 20px; }
.esp-empty-icon { color: #c0c0c0; margin-bottom: 16px; }
.esp-empty-title { font-size: 16px; font-weight: 700; margin: 0 0 4px; color: #666; }
.esp-empty-desc { font-size: 13px; color: #999; margin: 0; }

/* ---- 顶部导航 ---- */
.esp-topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; margin-bottom: 14px;
  background: #fff; border: 1px solid #e8e3da;
  border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  flex-wrap: wrap;
}
.esp-nav { display: flex; align-items: center; gap: 8px; }
.esp-nav-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border: 1.5px solid #d5cec4;
  background: #fdfcf9; color: #5c4f3d; border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
}
.esp-nav-btn:hover:not(:disabled) { border-color: #8b7355; background: #f8f3ea; }
.esp-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.esp-nav-label { display: flex; align-items: baseline; gap: 6px; min-width: 120px; justify-content: center; }
.esp-nav-label strong { font-size: 15px; font-weight: 700; color: #3d3226; }
.esp-nav-hint { font-size: 11px; color: #999; font-family: "SF Mono","Consolas",monospace; }

.esp-top-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #8b7e6a; }
.esp-meta-sep { color: #d5cec4; }

.esp-top-actions { display: flex; gap: 8px; margin-left: auto; }
.esp-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border: 1.5px solid #d5cec4;
  background: #fdfcf9; color: #5c4f3d; cursor: pointer;
  font-size: 12px; font-weight: 600; font-family: inherit;
  border-radius: 8px; transition: all 0.15s;
}
.esp-btn:hover:not(:disabled) { border-color: #8b7355; background: #f8f3ea; }
.esp-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.esp-btn-export:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; background: #f5f4ff; }
.esp-btn-print:hover:not(:disabled) { border-color: #059669; color: #059669; background: #ecfdf5; }
.esp-exporting { opacity: 0.55; pointer-events: none; }
.esp-chevron { opacity: 0.5; transition: transform 0.2s; }
.esp-btn-export:hover:not(:disabled) .esp-chevron { opacity: 0.8; }

/* ---- 发卷切换 ---- */
.esp-dist-toggle {
  display: flex; gap: 2px; background: #f3f1ec;
  border-radius: 8px; padding: 3px;
}
.esp-dt-btn {
  padding: 6px 13px; border: none; background: transparent;
  color: #8b7e6a; font-size: 11px; font-weight: 600; font-family: inherit;
  border-radius: 6px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.esp-dt-btn:hover { color: #5c4f3d; }
.esp-dt-btn.active { background: #fff; color: #6366f1; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

/* ---- 信息行 ---- */
.esp-info {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0 4px;
  font-size: 12px; color: #8b7e6a; margin-bottom: 14px;
  padding: 0 4px;
}
.esp-info b { color: #3d3226; font-weight: 600; margin-right: 2px; }
.esp-info-sep { color: #d5cec4; margin: 0 6px; }
.esp-info-item { white-space: nowrap; }
.esp-info-door {
  margin-left: auto; font-size: 11px; color: #8b7e6a;
  background: #f8f3ea; padding: 3px 12px; border-radius: 20px;
  border: 1px solid #e8e3da;
}
.esp-dist-legend {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; color: #6366f1; font-weight: 600;
}

/* ============================================
   真实教室场景
   ============================================ */
.esp-classroom-scene {
  position: relative;
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 2px 8px rgba(0,0,0,0.06),
    0 8px 32px rgba(0,0,0,0.08),
    inset 0 0 0 1px rgba(0,0,0,0.04);
}

/* ---- 天花板 ---- */
.esp-ceiling {
  height: 40px;
  background: linear-gradient(180deg, #e8e0d5 0%, #f0ebe2 40%, #f5f1ea 100%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 60px;
  border-bottom: 1px solid #e0d8cc;
}
.esp-light-fixture {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.esp-light-tube {
  width: 56px; height: 8px;
  background: linear-gradient(180deg, #fffef9 0%, #f8f3e8 40%, #e8dcc8 100%);
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(255,248,230,0.9), 0 1px 2px rgba(0,0,0,0.1);
}
.esp-light-glow {
  width: 80px; height: 20px;
  background: radial-gradient(ellipse at 50% 0%, rgba(255,248,225,0.7) 0%, transparent 70%);
  margin-top: -2px;
}

/* ---- 教室主体 ---- */
.esp-room {
  display: flex;
  flex-wrap: wrap;
  position: relative;
  background: #faf6ef;
}

/* ---- 左侧墙壁 ---- */
.esp-wall-left {
  width: 36px;
  background: linear-gradient(90deg, #e8ddd0 0%, #f0e8db 30%, #f5efe4 100%);
  border-right: 1px solid #e0d6c8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  gap: 10px;
  flex-shrink: 0;
}
.esp-wall-window {
  width: 24px; height: 52px;
  background: linear-gradient(180deg, #c8dcf0 0%, #dce8f5 30%, #e8f0f8 50%, #dce8f5 70%, #c8dcf0 100%);
  border-radius: 3px;
  border: 2px solid #d5cec4;
  position: relative;
  box-shadow: inset 0 0 8px rgba(180,200,230,0.4);
}
.esp-window-pane {
  position: absolute;
  top: 50%; left: 2px; right: 2px;
  height: 1px;
  background: #c8bfb0;
}

/* ---- 右侧墙壁 ---- */
.esp-wall-right {
  width: 36px;
  background: linear-gradient(270deg, #e8ddd0 0%, #f0e8db 30%, #f5efe4 100%);
  border-left: 1px solid #e0d6c8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.esp-wall-notice {
  writing-mode: vertical-rl;
  font-size: 10px;
  color: #b8a890;
  letter-spacing: 4px;
  font-weight: 600;
  padding: 20px 0;
}

/* ---- 后墙（顶部横条） ---- */
.esp-wall-back {
  width: 100%;
  height: 32px;
  background: linear-gradient(180deg, #f0e8db 0%, #f5efe4 100%);
  border-bottom: 1px solid #e0d6c8;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 20px;
  order: -1;
}
.esp-clock {
  font-size: 18px;
  filter: grayscale(0.3);
  opacity: 0.7;
}

/* ---- 前墙 + 黑板 ---- */
.esp-wall-front {
  width: 100%;
  padding: 16px 40px 18px;
  background: linear-gradient(180deg, #f5efe4 0%, #f8f4ed 40%, #faf6ef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  border-top: 1px solid #e8e0d4;
  order: 10;
}

/* 黑板外框（实木边框） */
.esp-blackboard-frame {
  flex: 1;
  max-width: 760px;
  display: flex;
  flex-direction: column;
}

/* 黑板面 */
.esp-blackboard {
  background:
    radial-gradient(ellipse at 30% 20%, rgba(60,100,50,0.4) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 80%, rgba(40,70,30,0.3) 0%, transparent 50%),
    linear-gradient(175deg, #2d5a27 0%, #265022 25%, #2a5425 50%, #234a20 75%, #1f4520 100%);
  border-radius: 4px 4px 0 0;
  padding: 14px 10px 12px;
  border: 6px solid #b8956e;
  border-bottom: none;
  position: relative;
  box-shadow:
    inset 0 0 30px rgba(0,0,0,0.15),
    inset 0 2px 4px rgba(255,255,255,0.03);
}
/* 黑板顶部木框横条 */
.esp-blackboard::before {
  content: '';
  position: absolute;
  top: -10px; left: -6px; right: -6px;
  height: 6px;
  background: linear-gradient(180deg, #c4a078 0%, #b08860 100%);
  border-radius: 2px 2px 0 0;
}

.esp-blackboard-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 6px;
  position: relative;
  z-index: 1;
}
.esp-blackboard-title {
  font-size: 20px; font-weight: 700; color: #fff;
  letter-spacing: 6px;
  font-family: "Noto Serif SC", "STSong", "KaiTi", serif;
  text-shadow: 0 0 6px rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.2);
}
.esp-blackboard-sub {
  font-size: 12px; color: rgba(255,255,255,0.75);
  letter-spacing: 2px;
}
.esp-blackboard-line {
  width: 80px; height: 1px;
  background: rgba(255,255,255,0.2);
  margin: 2px 0;
}
.esp-blackboard-rule {
  font-size: 13px; color: rgba(255,255,200,0.85);
  letter-spacing: 8px;
  font-family: "Noto Serif SC", "STSong", "KaiTi", serif;
  text-shadow: 0 0 3px rgba(255,255,200,0.2);
}

/* ---- 粉笔槽 ---- */
.esp-chalk-tray {
  height: 22px;
  background: linear-gradient(180deg, #c4a078 0%, #b08860 30%, #a07850 100%);
  border-radius: 0 0 6px 6px;
  border: 4px solid #b8956e;
  border-top: 2px solid #d4b898;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  box-shadow:
    0 3px 6px rgba(0,0,0,0.15),
    inset 0 1px 0 rgba(255,255,255,0.15);
  position: relative;
}
/* 粉笔槽凹槽 */
.esp-chalk-tray::before {
  content: '';
  position: absolute;
  inset: 4px 8px 3px;
  background: rgba(0,0,0,0.15);
  border-radius: 2px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
}
.esp-chalk-stick {
  width: 24px; height: 7px;
  border-radius: 3px;
  position: relative;
  z-index: 1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3);
}
.esp-eraser-box {
  width: 34px; height: 10px;
  background: linear-gradient(180deg, #e8d8c0 0%, #d4c0a0 100%);
  border-radius: 2px;
  margin-left: auto;
  position: relative;
  z-index: 1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
/* 黑板擦毛毡 */
.esp-eraser-box::after {
  content: '';
  position: absolute;
  bottom: -4px; left: 2px; right: 2px;
  height: 4px;
  background: #c8c0b8;
  border-radius: 0 0 1px 1px;
}
.esp-flag-stand {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.esp-flag-pole {
  width: 2px; height: 48px;
  background: linear-gradient(180deg, #c0b0a0 0%, #a09080 100%);
  border-radius: 1px;
}
.esp-flag-cloth {
  width: 28px; height: 20px;
  background: linear-gradient(135deg, #d43030 0%, #c02020 100%);
  border-radius: 1px 2px 2px 1px;
  box-shadow: 1px 1px 2px rgba(0,0,0,0.15);
}

/* ---- 地板 ---- */
.esp-floor {
  flex: 1;
  min-width: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 79px,
      rgba(180,160,130,0.12) 79px,
      rgba(180,160,130,0.12) 80px
    ),
    linear-gradient(185deg, #ede4d4 0%, #e8ddcb 30%, #e4d8c4 60%, #e8ddcb 100%);
  padding: 12px 20px 20px;
  position: relative;
}

/* 讲台 */
.esp-podium-area {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}
.esp-podium-desk {
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(1px 3px 4px rgba(0,0,0,0.12));
}
.esp-podium-top {
  width: 240px; height: 14px;
  background: linear-gradient(180deg, #d4c0a0 0%, #c8b088 40%, #c0a878 100%);
  border-radius: 3px 3px 0 0;
  border: 1px solid #b8a078;
  border-bottom: none;
}
.esp-podium-body {
  width: 220px; height: 30px;
  background: linear-gradient(180deg, #c8b488 0%, #bfa878 50%, #b8a070 100%);
  border-radius: 0 0 4px 4px;
  border: 1px solid #b09870;
  border-top: 1px solid #d4c4a0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.esp-podium-label {
  font-size: 12px; font-weight: 600; letter-spacing: 8px;
  color: #6b5c45;
  font-family: "Noto Serif SC", serif;
}

/* ---- 课桌阵列 ---- */
.esp-desks-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.esp-desk-row {
  display: flex;
  gap: 14px;
}
.esp-row-first {
  margin-top: 4px;
}

/* ---- 单个课桌单元 ---- */
.esp-desk-cell {
  position: relative;
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 已安排考生课桌 */
.esp-desk-real {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.esp-desk-surface {
  width: 92px; min-height: 62px;
  background: linear-gradient(175deg, #f5ecd8 0%, #efe4cc 30%, #e8d8b8 70%, #e0d0b0 100%);
  border-radius: 5px 5px 3px 3px;
  border: 1.5px solid #c8b898;
  border-bottom: 3px solid #bfa878;
  box-shadow:
    0 3px 0 #c0a878,
    0 4px 6px rgba(0,0,0,0.08),
    inset 0 1px 0 rgba(255,255,255,0.5);
  padding: 10px 8px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  position: relative;
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: default;
}
.esp-desk-surface:hover {
  transform: translateY(-1px);
  box-shadow:
    0 4px 0 #c0a878,
    0 5px 8px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.5);
}

/* 木纹纹理 */
.esp-desk-surface::before {
  content: '';
  position: absolute;
  inset: 2px 3px;
  background:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 16px,
      rgba(180,150,100,0.08) 16px,
      rgba(180,150,100,0.08) 17px
    );
  border-radius: 2px;
  pointer-events: none;
}

.esp-desk-name {
  font-size: 14px; font-weight: 700; color: #3d3226;
  line-height: 1.3; text-align: center;
  position: relative; z-index: 1;
  overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; max-width: 82px;
}
.esp-desk-meta {
  font-size: 10px; color: #8b7e6a; line-height: 1.3;
  text-align: center; position: relative; z-index: 1;
  overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; max-width: 82px;
}
.esp-desk-seatno {
  position: absolute; bottom: 4px; right: 6px;
  font-size: 9px; color: #c0b090; font-family: "SF Mono","Consolas",monospace;
  font-weight: 500; z-index: 1;
}
.esp-desk-distno {
  position: absolute; top: 3px; right: 5px;
  font-size: 10px; font-weight: 700; font-family: "SF Mono","Consolas",monospace;
  color: #6366f1; z-index: 1;
}

/* 椅子 */
.esp-chair {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -1px;
}
.esp-chair-seat {
  width: 34px; height: 12px;
  background: linear-gradient(180deg, #d4c0a0 0%, #c8b090 100%);
  border-radius: 3px 3px 0 0;
  border: 1px solid #b8a080;
}
.esp-chair-back {
  width: 30px; height: 10px;
  background: linear-gradient(180deg, #c8b090 0%, #bfa880 100%);
  border-radius: 0 0 2px 2px;
  border: 1px solid #b09878;
  border-top: none;
}

/* ---- 空课桌 ---- */
.esp-desk-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.55;
}
.esp-desk-surface-empty {
  width: 92px; height: 56px;
  background: linear-gradient(175deg, #f8f4ec 0%, #f0ebe0 50%, #ebe4d6 100%);
  border-radius: 5px 5px 3px 3px;
  border: 1.5px dashed #d5c8b0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.esp-desk-seatno-empty {
  font-size: 12px; font-weight: 500; color: #c8bfa8;
  font-family: "SF Mono","Consolas",monospace;
}
.esp-desk-distno-empty {
  font-size: 11px; font-weight: 500; color: #c8bfa8;
  font-family: "SF Mono","Consolas",monospace;
}
.esp-chair-empty {
  width: 34px; height: 12px;
  background: #e8ddd0;
  border-radius: 3px 3px 0 0;
  border: 1px dashed #d5c8b0;
  margin-top: -1px;
}

/* ---- 屏蔽座位 ---- */
.esp-desk-blocked .esp-desk-blocked {
  width: 92px; height: 62px;
  background: linear-gradient(175deg, #e8e0d8 0%, #e0d8d0 100%);
  border-radius: 5px;
  border: 1.5px solid #d0c8c0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.esp-desk-blocked-x {
  display: block;
  width: 20px; height: 20px;
  position: relative;
  opacity: 0.3;
}
.esp-desk-blocked-x::before,
.esp-desk-blocked-x::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 18px; height: 2px;
  background: #a09080;
  border-radius: 1px;
}
.esp-desk-blocked-x::before { transform: translate(-50%, -50%) rotate(45deg); }
.esp-desk-blocked-x::after  { transform: translate(-50%, -50%) rotate(-45deg); }

/* ---- 状态变体 ---- */
.esp-desk-occupied .esp-desk-surface {
  border-left: 3px solid #6366f1;
}
.esp-desk-absent .esp-desk-surface {
  border-left: 3px solid #d97878;
  background: linear-gradient(175deg, #faf0ed 0%, #f5e8e4 70%, #f0e0dc 100%);
}
.esp-desk-special .esp-desk-surface {
  border-left: 3px solid #c4a84c;
  background: linear-gradient(175deg, #faf8ed 0%, #f5f0e0 70%, #f0e8d0 100%);
}

/* ---- 发卷模式高亮 ---- */
.esp-dist-first .esp-desk-distno { color: #10b981; font-size: 10px; }
.esp-dist-last .esp-desk-distno { color: #f43f5e; font-size: 10px; }
.esp-dist-first .esp-desk-surface { box-shadow: 0 3px 0 #c0a878, 0 4px 6px rgba(0,0,0,0.08), 0 0 0 2px rgba(16,185,129,0.3); }
.esp-dist-last .esp-desk-surface { box-shadow: 0 3px 0 #c0a878, 0 4px 6px rgba(0,0,0,0.08), 0 0 0 2px rgba(244,63,94,0.3); }

/* ---- 门口标记 ---- */
.esp-door-marker {
  position: absolute; top: -8px; right: -4px;
  color: #6366f1; z-index: 10;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
}

/* ---- 过道 ---- */
.esp-aisle-left, .esp-aisle-right {
  display: none; /* 移动端隐藏，桌面端可选开启 */
}

/* ---- 规则 ---- */
.esp-rules { margin: 10px 0 4px; padding: 8px 14px; font-size: 11px; color: #a09888; text-align: center; }

/* ---- 底部 ---- */
.esp-footer {
  display: flex; justify-content: space-between; padding-top: 8px;
  border-top: 1px solid #e8e3da; font-size: 10px; color: #c0b8a8;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .esp-page { padding: 12px 8px 24px; }
  .esp-topbar { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
  .esp-top-actions { margin-left: 0; }
  .esp-nav-label { min-width: auto; }
  .esp-wall-left, .esp-wall-right { width: 20px; }
  .esp-wall-window { width: 14px; height: 32px; }
  .esp-wall-back { height: 24px; }
  .esp-wall-front { padding: 10px 16px 12px; }
  .esp-blackboard-frame { max-width: 100%; }
  .esp-blackboard { padding: 10px 6px 8px; border-width: 4px; }
  .esp-blackboard-title { font-size: 14px; letter-spacing: 3px; }
  .esp-blackboard-sub { font-size: 9px; }
  .esp-blackboard-rule { font-size: 9px; letter-spacing: 4px; }
  .esp-chalk-tray { height: 16px; padding: 0 8px; }
  .esp-chalk-stick { width: 16px; height: 5px; }
  .esp-eraser-box { width: 24px; height: 7px; }
  .esp-blackboard::before { top: -7px; height: 4px; }
  .esp-podium-top { width: 160px; }
  .esp-podium-body { width: 144px; height: 24px; }
  .esp-podium-label { font-size: 10px; letter-spacing: 4px; }
  .esp-desk-cell { width: 64px; }
  .esp-desk-surface, .esp-desk-surface-empty, .esp-desk-blocked .esp-desk-blocked { width: 58px; min-height: 42px; }
  .esp-desk-surface-empty { height: 36px; }
  .esp-desk-name { font-size: 10px; max-width: 48px; }
  .esp-desk-meta { font-size: 7px; max-width: 48px; }
  .esp-desk-seatno { font-size: 7px; }
  .esp-desk-row { gap: 6px; }
  .esp-desks-area { gap: 10px; }
  .esp-floor { padding: 8px 8px 14px; }
  .esp-ceiling { height: 28px; padding: 0 20px; }
  .esp-light-tube { width: 36px; height: 5px; }
  .esp-light-glow { width: 50px; height: 12px; }
  .esp-dist-toggle { margin-left: 0; }
  .esp-flag-stand { display: none; }
  .esp-chair-seat { width: 22px; height: 8px; }
  .esp-chair-back { width: 18px; height: 6px; }
  .esp-chair-empty { width: 22px; height: 8px; }
}

/* 小屏进一步压缩 */
@media (max-width: 480px) {
  .esp-wall-left, .esp-wall-right { display: none; }
  .esp-wall-front { padding: 6px 8px 8px; }
  .esp-blackboard { padding: 6px 4px; border-width: 3px; }
  .esp-blackboard-title { font-size: 11px; letter-spacing: 2px; }
  .esp-blackboard-sub { font-size: 7px; }
  .esp-blackboard-rule { font-size: 7px; letter-spacing: 2px; }
  .esp-chalk-tray { height: 12px; }
  .esp-chalk-stick { width: 12px; height: 4px; }
  .esp-eraser-box { width: 18px; height: 5px; display: none; }
  .esp-desk-cell { width: 48px; }
  .esp-desk-surface, .esp-desk-surface-empty, .esp-desk-blocked .esp-desk-blocked { width: 44px; min-height: 36px; }
  .esp-desk-surface-empty { height: 30px; }
  .esp-desk-name { font-size: 9px; max-width: 36px; }
  .esp-desk-meta { font-size: 6px; max-width: 36px; }
  .esp-desk-row { gap: 4px; }
  .esp-desks-area { gap: 8px; }
  .esp-chair-seat { width: 16px; height: 6px; }
  .esp-chair-back { width: 14px; height: 4px; }
  .esp-chair-empty { width: 16px; height: 6px; }
  .esp-podium-top { width: 120px; height: 10px; }
  .esp-podium-body { width: 108px; height: 18px; }
  .esp-podium-label { font-size: 8px; letter-spacing: 3px; }
}

/* ---- 打印 ---- */
@media print {
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .esp-page { max-width: 100%; padding: 0; background: #fff; }
  .esp-topbar, .esp-info, .esp-rules, .esp-footer, .esp-ceiling, .esp-wall-left, .esp-wall-right, .esp-wall-back { display: none !important; }
  .esp-classroom-scene { box-shadow: none; border: 1px solid #ccc; border-radius: 0; }
  .esp-wall-front { background: #fff; border: none; padding: 8px 20px 10px; }
  .esp-blackboard-frame { max-width: 100%; }
  .esp-blackboard { border: 2px solid #999; box-shadow: none; }
  .esp-blackboard::before { display: none; }
  .esp-chalk-tray { display: none; }
  .esp-floor { background: #fff; }
  .esp-desk-surface { background: #fff; border: 1px solid #999; box-shadow: none; }
  .esp-desk-surface::before { display: none; }
  .esp-desk-surface-empty { background: #fafafa; border: 1px dashed #ccc; }
  .esp-desk-name { color: #000; }
  .esp-desk-meta { color: #666; }
  .esp-desk-seatno { color: #bbb; }
  .esp-dist-num, .esp-desk-distno, .esp-desk-distno-empty { display: none !important; }
  .esp-podium-area { margin-top: 8px; }
  .esp-podium-top, .esp-podium-body { background: #f8f8f8; border-color: #ccc; box-shadow: none; }
  .esp-chair, .esp-chair-empty { display: none; }
  @page { size: 297mm 210mm landscape; margin: 4mm; }
}
</style>

<style>
/* 导出下拉菜单 */
.esp-export-opt {
  display: flex; align-items: center; gap: 14px;
  padding: 2px 6px;
}
.esp-export-fmt {
  font-size: 13px; font-weight: 700; color: #1a1a1a;
  font-family: "SF Mono", "Consolas", monospace;
  width: 34px;
}
.esp-export-hint {
  font-size: 11px; color: #999;
}
</style>
