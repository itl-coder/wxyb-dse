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

      <!-- 教室场景主体 -->
      <div v-if="currentRoom" class="mes-body" :class="'mes-' + orientation">
        <!-- 信息栏 + 图例 -->
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
          <span class="mes-door-arrow">→</span> 前门进场方向
          <span class="mes-door-dot-hint">● 第一位考生</span>
        </div>

        <!-- ======== 教室场景 ======== -->
        <div class="mes-classroom">
          <!-- 天花板灯光 -->
          <div class="mes-ceiling">
            <div class="mes-light-fixture" v-for="i in lightCount" :key="i">
              <div class="mes-light-tube"></div>
              <div class="mes-light-glow"></div>
            </div>
          </div>

          <div class="mes-room-interior">
            <!-- 左墙窗户 -->
            <div class="mes-wall-left">
              <div class="mes-wall-window" v-for="i in windowCount" :key="i">
                <div class="mes-window-pane"></div>
              </div>
            </div>

            <!-- 右墙 -->
            <div class="mes-wall-right">
              <span class="mes-wall-notice">考场</span>
            </div>

            <!-- 前墙黑板 -->
            <div class="mes-wall-front">
              <div class="mes-blackboard-frame">
                <div class="mes-blackboard">
                  <div class="mes-blackboard-inner">
                    <span class="mes-bb-title">{{ currentRoom.examSubject || '考试座位表' }}</span>
                    <span class="mes-bb-sub">{{ currentRoom.name }} · {{ currentRoom.rows }}×{{ currentRoom.cols }}</span>
                    <div class="mes-bb-line"></div>
                    <span class="mes-bb-rule">诚信考试 · 冷静作答</span>
                  </div>
                </div>
                <!-- 粉笔槽 -->
                <div class="mes-chalk-tray">
                  <div class="mes-chalk-stick" v-for="i in 4" :key="i" :style="{ background: ['#f5f0e8','#e8d8c0','#f0d8d0','#d8e8f0'][i-1] }"></div>
                  <div class="mes-eraser-box"></div>
                </div>
              </div>
            </div>

            <!-- 地板 + 座位 -->
            <div class="mes-floor">
              <!-- 课桌阵列 -->
              <div class="mes-desks-area">
                <div
                  v-for="r in displayRows"
                  :key="r"
                  class="mes-desk-row"
                  :class="{ 'mes-row-front': r === 1 }"
                >
                  <div
                    v-for="c in currentRoom.cols"
                    :key="c"
                    class="mes-desk-cell"
                    :class="[seatDeskClass(r, c)]"
                  >
                    <!-- 门口标记 -->
                    <span v-if="isFirstSeat(r, c)" class="mes-door-marker">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </span>

                    <!-- 屏蔽 -->
                    <template v-if="isBlocked(r, c)">
                      <div class="mes-desk-blocked-box">
                        <span class="mes-desk-blocked-x"></span>
                      </div>
                    </template>

                    <!-- 已安排 -->
                    <template v-else-if="getStudent(r, c)">
                      <div class="mes-desk-real">
                        <div class="mes-desk-surface">
                          <span class="mes-desk-name">{{ getStudent(r, c).name }}</span>
                          <span class="mes-desk-class" v-if="getStudent(r, c).className">{{ getStudent(r, c).className }}</span>
                          <span class="mes-desk-elective" v-if="seatElectiveText(r, c)">{{ seatElectiveText(r, c) }}</span>
                        </div>
                        <div class="mes-chair">
                          <div class="mes-chair-seat"></div>
                          <div class="mes-chair-back"></div>
                        </div>
                      </div>
                    </template>

                    <!-- 空位 -->
                    <template v-else>
                      <div class="mes-desk-empty-box">
                        <div class="mes-desk-surface-empty"></div>
                        <div class="mes-chair-empty"></div>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- 讲台（课桌与黑板之间） -->
              <div class="mes-podium-area">
                <div class="mes-podium-desk">
                  <div class="mes-podium-top"></div>
                  <div class="mes-podium-body">
                    <span class="mes-podium-label">讲 台</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

// 照明灯具数量
const lightCount = computed(() => Math.max(2, Math.ceil((currentRoom.value?.cols || 5) / 2)))
// 窗户数量
const windowCount = computed(() => Math.max(1, Math.ceil((currentRoom.value?.rows || 5) / 3)))

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
function seatDeskClass(r, c) {
  if (isBlocked(r, c)) return 'mes-cell-blocked'
  return getStudent(r, c) ? 'mes-cell-occupied' : 'mes-cell-empty'
}
function seatElectiveText(r, c) {
  if (isBlocked(r, c)) return ''
  const s = getStudent(r, c)
  return s?.electives?.length ? s.electives.slice(0, 2).join(' / ') : ''
}

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
  border-radius: 12px; padding: 14px 20px 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.mes-landscape { max-width: 1060px; }
.mes-portrait { max-width: 760px; margin: 0 auto; }

/* ====== Top Bar ====== */
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
.mes-ldot.occ { background: #f5ecd8; border: 1.5px solid #c8b898; border-left: 3px solid #6366f1; }
.mes-ldot.empty { background: #f8f4ec; border: 1px dashed #d5c8b0; }
.mes-ldot.blocked { background: #e8e0d8; border: 1.5px solid #d0c8c0; }
.mes-ldot.door { background: #6366f1; border-radius: 50%; width: 6px; height: 6px; }

/* ====== Door Bar ====== */
.mes-door-bar {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; color: var(--text-muted); padding: 0 2px 8px;
}
.mes-door-arrow { font-size: 14px; font-weight: 700; color: var(--accent); }
.mes-door-dot-hint { margin-left: auto; opacity: 0.6; }

/* ============================================
   真实教室场景
   ============================================ */
.mes-classroom {
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 2px 8px rgba(0,0,0,0.05),
    0 6px 24px rgba(0,0,0,0.06),
    inset 0 0 0 1px rgba(0,0,0,0.03);
  margin-bottom: 10px;
}

/* ---- 天花板 ---- */
.mes-ceiling {
  height: 34px;
  background: linear-gradient(180deg, #e8e0d5 0%, #f0ebe2 40%, #f5f1ea 100%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0 50px;
  border-bottom: 1px solid #e0d8cc;
}
.mes-light-fixture {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mes-light-tube {
  width: 48px; height: 7px;
  background: linear-gradient(180deg, #fffef9 0%, #f8f3e8 40%, #e8dcc8 100%);
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(255,248,230,0.8), 0 1px 2px rgba(0,0,0,0.1);
}
.mes-light-glow {
  width: 66px; height: 16px;
  background: radial-gradient(ellipse at 50% 0%, rgba(255,248,225,0.6) 0%, transparent 70%);
  margin-top: -2px;
}

/* ---- 教室内部 ---- */
.mes-room-interior {
  display: flex;
  flex-wrap: wrap;
  background: #faf6ef;
}

/* ---- 左墙 ---- */
.mes-wall-left {
  width: 28px;
  background: linear-gradient(90deg, #e8ddd0 0%, #f0e8db 30%, #f5efe4 100%);
  border-right: 1px solid #e0d6c8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 3px;
  gap: 8px;
  flex-shrink: 0;
}
.mes-wall-window {
  width: 20px; height: 40px;
  background: linear-gradient(180deg, #c8dcf0 0%, #dce8f5 30%, #e8f0f8 50%, #dce8f5 70%, #c8dcf0 100%);
  border-radius: 3px;
  border: 2px solid #d5cec4;
  box-shadow: inset 0 0 6px rgba(180,200,230,0.4);
}
.mes-window-pane {
  display: block;
  width: 100%; height: 1px;
  background: #c8bfb0;
  margin-top: 50%;
}

/* ---- 右墙 ---- */
.mes-wall-right {
  width: 28px;
  background: linear-gradient(270deg, #e8ddd0 0%, #f0e8db 30%, #f5efe4 100%);
  border-left: 1px solid #e0d6c8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mes-wall-notice {
  writing-mode: vertical-rl;
  font-size: 9px;
  color: #b8a890;
  letter-spacing: 3px;
  font-weight: 600;
}

/* ---- 前墙黑板 ---- */
.mes-wall-front {
  width: 100%;
  padding: 14px 32px 16px;
  background: linear-gradient(180deg, #f5efe4 0%, #f8f4ed 40%, #faf6ef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #e8e0d4;
  order: 10;
}
.mes-blackboard-frame {
  flex: 1;
  max-width: 680px;
  display: flex;
  flex-direction: column;
}
.mes-blackboard {
  background:
    radial-gradient(ellipse at 30% 20%, rgba(60,100,50,0.4) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 80%, rgba(40,70,30,0.3) 0%, transparent 50%),
    linear-gradient(175deg, #2d5a27 0%, #265022 25%, #2a5425 50%, #234a20 75%, #1f4520 100%);
  border-radius: 4px 4px 0 0;
  padding: 12px 8px 10px;
  border: 5px solid #b8956e;
  border-bottom: none;
  position: relative;
  box-shadow:
    inset 0 0 24px rgba(0,0,0,0.15),
    inset 0 2px 4px rgba(255,255,255,0.03);
}
.mes-blackboard::before {
  content: '';
  position: absolute;
  top: -8px; left: -5px; right: -5px;
  height: 5px;
  background: linear-gradient(180deg, #c4a078 0%, #b08860 100%);
  border-radius: 2px 2px 0 0;
}
.mes-blackboard-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 4px 10px 4px;
  position: relative;
  z-index: 1;
}
.mes-bb-title {
  font-size: 18px; font-weight: 700; color: #fff;
  letter-spacing: 5px;
  font-family: "Noto Serif SC", "STSong", "KaiTi", serif;
  text-shadow: 0 0 5px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2);
}
.mes-bb-sub {
  font-size: 11px; color: rgba(255,255,255,0.7);
  letter-spacing: 2px;
}
.mes-bb-line {
  width: 60px; height: 1px;
  background: rgba(255,255,255,0.2);
  margin: 2px 0;
}
.mes-bb-rule {
  font-size: 12px; color: rgba(255,255,200,0.8);
  letter-spacing: 7px;
  font-family: "Noto Serif SC", "STSong", "KaiTi", serif;
  text-shadow: 0 0 3px rgba(255,255,200,0.15);
}
/* 粉笔槽 */
.mes-chalk-tray {
  height: 20px;
  background: linear-gradient(180deg, #c4a078 0%, #b08860 30%, #a07850 100%);
  border-radius: 0 0 6px 6px;
  border: 4px solid #b8956e;
  border-top: 2px solid #d4b898;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15);
  position: relative;
}
.mes-chalk-tray::before {
  content: '';
  position: absolute;
  inset: 4px 6px 3px;
  background: rgba(0,0,0,0.15);
  border-radius: 2px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
}
.mes-chalk-stick {
  width: 22px; height: 6px;
  border-radius: 3px;
  position: relative;
  z-index: 1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3);
}
.mes-eraser-box {
  width: 30px; height: 9px;
  background: linear-gradient(180deg, #e8d8c0 0%, #d4c0a0 100%);
  border-radius: 2px;
  margin-left: auto;
  position: relative;
  z-index: 1;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.mes-eraser-box::after {
  content: '';
  position: absolute;
  bottom: -3px; left: 2px; right: 2px;
  height: 3px;
  background: #c8c0b8;
  border-radius: 0 0 1px 1px;
}

/* ---- 地板 ---- */
.mes-floor {
  flex: 1;
  min-width: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 69px,
      rgba(180,160,130,0.1) 69px,
      rgba(180,160,130,0.1) 70px
    ),
    linear-gradient(185deg, #ede4d4 0%, #e8ddcb 30%, #e4d8c4 60%, #e8ddcb 100%);
  padding: 10px 16px 16px;
}

/* ---- 讲台 ---- */
.mes-podium-area {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}
.mes-podium-desk {
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.1));
}
.mes-podium-top {
  width: 200px; height: 12px;
  background: linear-gradient(180deg, #d4c0a0 0%, #c8b088 40%, #c0a878 100%);
  border-radius: 3px 3px 0 0;
  border: 1px solid #b8a078;
  border-bottom: none;
}
.mes-podium-body {
  width: 184px; height: 26px;
  background: linear-gradient(180deg, #c8b488 0%, #bfa878 50%, #b8a070 100%);
  border-radius: 0 0 3px 3px;
  border: 1px solid #b09870;
  border-top: 1px solid #d4c4a0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mes-podium-label {
  font-size: 11px; font-weight: 600; letter-spacing: 6px;
  color: #6b5c45;
  font-family: "Noto Serif SC", serif;
}

/* ---- 课桌阵列 ---- */
.mes-desks-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.mes-desk-row {
  display: flex;
  gap: 12px;
}
.mes-row-front {
  margin-top: 2px;
}

/* ---- 单个课桌单元 ---- */
.mes-desk-cell {
  width: 94px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* ---- 课桌（真实3D风格） ---- */
.mes-desk-real {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mes-desk-surface {
  width: 86px; min-height: 60px;
  background: linear-gradient(175deg, #f5ecd8 0%, #efe4cc 30%, #e8d8b8 70%, #e0d0b0 100%);
  border-radius: 4px 4px 2px 2px;
  border: 1.5px solid #c8b898;
  border-bottom: 2.5px solid #bfa878;
  box-shadow:
    0 2.5px 0 #c0a878,
    0 3px 5px rgba(0,0,0,0.07),
    inset 0 1px 0 rgba(255,255,255,0.45);
  padding: 10px 7px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  transition: transform 0.12s, box-shadow 0.12s;
  cursor: default;
}
.mes-desk-surface:hover {
  transform: translateY(-1px);
  box-shadow:
    0 3px 0 #c0a878,
    0 4px 6px rgba(0,0,0,0.09),
    inset 0 1px 0 rgba(255,255,255,0.45);
}
.mes-desk-name {
  font-size: 14px; font-weight: 700; color: #3d3226;
  line-height: 1.3; text-align: center;
  overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; max-width: 76px;
}
.mes-desk-class {
  font-size: 9px; color: #8b7e6a; line-height: 1.2;
  text-align: center;
  overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; max-width: 76px;
}
.mes-desk-elective {
  font-size: 8px; color: #a09880; line-height: 1.15;
  text-align: center;
  overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; max-width: 76px;
}

/* 椅子 */
.mes-chair {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -1px;
}
.mes-chair-seat {
  width: 30px; height: 10px;
  background: linear-gradient(180deg, #d4c0a0 0%, #c8b090 100%);
  border-radius: 2px 2px 0 0;
  border: 1px solid #b8a080;
}
.mes-chair-back {
  width: 26px; height: 8px;
  background: linear-gradient(180deg, #c8b090 0%, #bfa880 100%);
  border-radius: 0 0 2px 2px;
  border: 1px solid #b09878;
  border-top: none;
}

/* ---- 空课桌 ---- */
.mes-desk-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.5;
}
.mes-desk-surface-empty {
  width: 86px; height: 52px;
  background: linear-gradient(175deg, #f8f4ec 0%, #f0ebe0 50%, #ebe4d6 100%);
  border-radius: 4px 4px 2px 2px;
  border: 1.5px dashed #d5c8b0;
}
.mes-chair-empty {
  width: 30px; height: 10px;
  background: #e8ddd0;
  border-radius: 2px 2px 0 0;
  border: 1px dashed #d5c8b0;
  margin-top: -1px;
}

/* ---- 屏蔽座位 ---- */
.mes-desk-blocked-box {
  width: 86px; height: 60px;
  background: linear-gradient(175deg, #e8e0d8 0%, #e0d8d0 100%);
  border-radius: 4px;
  border: 1.5px solid #d0c8c0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mes-desk-blocked-x {
  display: block;
  width: 18px; height: 18px;
  position: relative;
  opacity: 0.25;
}
.mes-desk-blocked-x::before,
.mes-desk-blocked-x::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 16px; height: 2px;
  background: #a09080;
  border-radius: 1px;
}
.mes-desk-blocked-x::before { transform: translate(-50%, -50%) rotate(45deg); }
.mes-desk-blocked-x::after  { transform: translate(-50%, -50%) rotate(-45deg); }

/* 状态变体 */
.mes-cell-occupied .mes-desk-surface { border-left: 3px solid #6366f1; }

/* ---- 门口标记 ---- */
.mes-door-marker {
  position: absolute; top: -7px; right: -2px;
  z-index: 10;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
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
  .mes-header, .mes-rooms, .mes-topbar, .mes-footer,
  .mes-ceiling, .mes-wall-left, .mes-wall-right, .mes-door-bar { display: none; }
  .mes-body { border: none; box-shadow: none; padding: 0; max-width: 100%; }
  .mes-page { max-width: 100%; padding: 0; }
  .mes-classroom { box-shadow: none; }
  .mes-wall-front { background: #fff; border: none; }
  .mes-blackboard-frame { max-width: 100%; }
  .mes-blackboard { border-color: #999; box-shadow: none; }
  .mes-blackboard::before { display: none; }
  .mes-chalk-tray { display: none; }
  .mes-floor { background: #fff; }
  .mes-desk-surface { background: #fff; border-color: #999; box-shadow: none; }
  .mes-desk-surface-empty { background: #fafafa; border-color: #ccc; }
  .mes-podium-top, .mes-podium-body { background: #f8f8f8; border-color: #ccc; }
  .mes-chair, .mes-chair-empty { display: none; }
  @page { size: A4 landscape; margin: 8mm; }
}

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .mes-header { flex-direction: column; align-items: flex-start; }
  .mes-header-actions { width: 100%; flex-wrap: wrap; }
  .mes-body { padding: 8px 6px 8px; }
  .mes-landscape, .mes-portrait { max-width: 100%; }
  .mes-wall-left, .mes-wall-right { width: 18px; }
  .mes-wall-window { width: 12px; height: 28px; }
  .mes-wall-front { padding: 8px 12px 10px; }
  .mes-blackboard-frame { max-width: 100%; }
  .mes-blackboard { padding: 8px 4px 6px; border-width: 4px; }
  .mes-blackboard::before { top: -6px; height: 3px; }
  .mes-bb-title { font-size: 13px; letter-spacing: 3px; }
  .mes-bb-sub { font-size: 8px; }
  .mes-bb-rule { font-size: 8px; letter-spacing: 4px; }
  .mes-chalk-tray { height: 14px; padding: 0 6px; }
  .mes-chalk-stick { width: 14px; height: 4px; }
  .mes-eraser-box { width: 20px; height: 6px; }
  .mes-podium-top { width: 140px; }
  .mes-podium-body { width: 128px; height: 20px; }
  .mes-podium-label { font-size: 9px; letter-spacing: 3px; }
  .mes-desk-cell { width: 58px; }
  .mes-desk-surface, .mes-desk-surface-empty, .mes-desk-blocked-box { width: 52px; min-height: 40px; }
  .mes-desk-surface-empty { height: 32px; }
  .mes-desk-name { font-size: 10px; max-width: 44px; }
  .mes-desk-class { font-size: 7px; max-width: 44px; }
  .mes-desk-elective { font-size: 6px; max-width: 44px; }
  .mes-desk-row { gap: 5px; }
  .mes-desks-area { gap: 10px; }
  .mes-floor { padding: 6px 8px 12px; }
  .mes-ceiling { height: 24px; padding: 0 20px; }
  .mes-light-tube { width: 30px; height: 5px; }
  .mes-light-glow { width: 40px; height: 10px; }
  .mes-chair-seat { width: 18px; height: 7px; }
  .mes-chair-back { width: 14px; height: 5px; }
  .mes-chair-empty { width: 18px; height: 7px; }
}

@media (max-width: 480px) {
  .mes-wall-left, .mes-wall-right { display: none; }
  .mes-wall-front { padding: 4px 6px 6px; }
  .mes-blackboard { padding: 4px 2px; border-width: 3px; }
  .mes-bb-title { font-size: 10px; letter-spacing: 2px; }
  .mes-bb-sub { font-size: 7px; }
  .mes-bb-rule { font-size: 7px; letter-spacing: 2px; }
  .mes-chalk-tray { height: 10px; }
  .mes-chalk-stick { width: 10px; height: 3px; }
  .mes-eraser-box { display: none; }
  .mes-desk-cell { width: 44px; }
  .mes-desk-surface, .mes-desk-surface-empty, .mes-desk-blocked-box { width: 40px; min-height: 34px; }
  .mes-desk-surface-empty { height: 26px; }
  .mes-desk-name { font-size: 9px; max-width: 34px; }
  .mes-desk-class { font-size: 6px; max-width: 34px; }
  .mes-desk-elective { font-size: 5px; max-width: 34px; }
  .mes-desk-row { gap: 3px; }
  .mes-desks-area { gap: 6px; }
  .mes-chair-seat { width: 14px; height: 5px; }
  .mes-chair-back { width: 12px; height: 4px; }
  .mes-chair-empty { width: 14px; height: 5px; }
  .mes-podium-top { width: 100px; height: 8px; }
  .mes-podium-body { width: 90px; height: 16px; }
  .mes-podium-label { font-size: 7px; letter-spacing: 2px; }
}
</style>
