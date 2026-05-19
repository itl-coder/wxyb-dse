<template>
  <div class="esp-shell">
    <div class="esp-grain"></div>

    <!-- Masthead -->
    <header class="esp-masthead">
      <router-link to="/" class="esp-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>返回首页</span>
      </router-link>

      <div class="esp-masthead-body">
        <div class="esp-masthead-ornament">
          <span class="esp-orn-line"></span>
          <span class="esp-orn-mark">&#9670;</span>
          <span class="esp-orn-line"></span>
        </div>
        <h1 class="esp-pagetitle">考场座位安排</h1>
        <p class="esp-pagedate">{{ dateStr }}</p>
      </div>

      <div class="esp-masthead-actions">
        <button class="esp-btn-export-all" @click="exportAll" :disabled="exporting">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ exporting ? '生成中...' : '导出全部考场' }}
        </button>
      </div>
    </header>

    <!-- Empty state -->
    <div class="esp-empty" v-if="rooms.length === 0">
      <div class="esp-empty-stamp">&#36716;</div>
      <p class="esp-empty-title">暂无座位安排</p>
      <p class="esp-empty-desc">请前往管理后台导入考生并完成排座后查看</p>
    </div>

    <main class="esp-dockets" v-else>
      <article
        v-for="(room, ri) in rooms"
        :key="room.id"
        class="esp-docket"
        :style="{ animationDelay: `${ri * 0.07}s` }"
      >
        <div class="esp-docket-hd">
          <div class="esp-docket-hd-main">
            <div class="esp-docket-num">NO. {{ ri + 1 }}</div>
            <h2 class="esp-docket-title">{{ room.name }}</h2>
            <div class="esp-docket-tags">
              <span v-if="room.location" class="esp-dtag">{{ room.location }}</span>
              <span v-if="room.examSubject" class="esp-dtag esp-dtag--red">{{ room.examSubject }}</span>
              <span v-if="room.examTime" class="esp-dtag">{{ room.examTime }}</span>
              <span class="esp-dtag esp-dtag--muted">{{ room.rows }}行 × {{ room.cols }}列 · {{ getRoomCount(room.id) }}人</span>
            </div>
          </div>
          <div class="esp-docket-hd-actions">
            <button class="esp-btn-export" @click="exportRoom(room)" :disabled="exporting" title="导出高清图片">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              导出座位表
            </button>
          </div>
        </div>

        <div class="esp-podium">
          <span class="esp-podium-bar"></span>
          <span class="esp-podium-text">讲 台</span>
          <span class="esp-podium-bar"></span>
        </div>

        <div class="esp-grid-shell">
          <div class="esp-grid" :style="gridStyle(room)">
            <div class="esp-gc esp-gc--corner"></div>
            <div v-for="c in room.cols" :key="'h'+c" class="esp-gc esp-gc--colhead">
              <span>{{ colLetter(c) }}</span>
            </div>

            <template v-for="r in room.rows" :key="'r'+r">
              <div class="esp-gc esp-gc--rowhead">
                <span>{{ r }}</span>
              </div>
              <div
                v-for="c in room.cols"
                :key="'c'+c"
                class="esp-gc esp-gc--seat"
                :class="getSeatClass(room.id, (r-1)*room.cols + c)"
              >
                <template v-if="getSeatStudent(room.id, (r-1)*room.cols + c)">
                  <span class="esp-seat-name">{{ getSeatStudent(room.id, (r-1)*room.cols + c).name }}</span>
                  <span v-if="showClass && getSeatStudent(room.id, (r-1)*room.cols + c).className" class="esp-seat-meta">{{ getSeatStudent(room.id, (r-1)*room.cols + c).className }}</span>
                  <span v-if="showElectives && getSeatStudent(room.id, (r-1)*room.cols + c).electives?.length" class="esp-seat-elecs">
                    <i v-for="e in getSeatStudent(room.id, (r-1)*room.cols + c).electives.slice(0,3)" :key="e" class="esp-elec">{{ e }}</i>
                  </span>
                </template>
                <template v-else>
                  <span class="esp-seat-coord">{{ colLetter(c) }}{{ r }}</span>
                </template>
              </div>
            </template>
          </div>
        </div>

        <div class="esp-docket-ft">
          <span class="esp-docket-ft-text">DSE 智能学情分析 · 座位安排</span>
          <span class="esp-docket-stamp">{{ dateStr }}</span>
        </div>
      </article>
    </main>

    <footer class="esp-page-ft">
      <span>DSE AI 智能学情分析系统</span>
    </footer>

    <div ref="captureTarget" class="esp-capture-target"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { loadRooms, loadStudents, loadAssignments } from './admin/exam-seat/utils/localCache.js'

const rooms = ref([])
const students = ref([])
const assignments = ref([])
const showClass = ref(true)
const showElectives = ref(true)
const exporting = ref(false)
const captureTarget = ref(null)

const dateStr = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric'
})

onMounted(() => {
  rooms.value = loadRooms()
  students.value = loadStudents()
  assignments.value = loadAssignments()
  try {
    const raw = localStorage.getItem('dse_schoolSettings')
    if (raw) {
      const s = JSON.parse(raw)
      showClass.value = s.seatShowClass !== false
      showElectives.value = s.seatShowElectives !== false
    }
  } catch {}
})

function colLetter(c) { return String.fromCharCode(64 + c) }

const studentMap = computed(() => {
  const m = {}
  students.value.forEach(s => { m[s.id] = s })
  return m
})

const seatLookup = computed(() => {
  const l = {}
  assignments.value.forEach(a => {
    l[`${a.roomId}_${a.seatIndex}`] = a
  })
  return l
})

function getRoomCount(roomId) {
  return new Set(assignments.value.filter(a => a.roomId === roomId).map(a => a.studentId)).size
}

function getSeatStudent(roomId, seatIndex) {
  const a = seatLookup.value[`${roomId}_${seatIndex}`]
  return a ? studentMap.value[a.studentId] || null : null
}

function getSeatClass(roomId, seatIndex) {
  return getSeatStudent(roomId, seatIndex) ? 'is-taken' : 'is-free'
}

function gridStyle(room) {
  const w = room.cols > 12 ? 110 : room.cols > 8 ? 120 : 130
  return { gridTemplateColumns: `34px repeat(${room.cols}, ${w}px)` }
}

// ---- html2canvas A4 export ----

let _hc = null
async function getHc() {
  if (_hc) return _hc
  const m = await import('html2canvas')
  _hc = m.default || m
  return _hc
}

function buildExportHTML(room, showCls, showEle, docketNo) {
  const sMap = {}
  students.value.forEach(s => { sMap[s.id] = s })
  const aMap = {}
  assignments.value.forEach(a => {
    aMap[`${a.roomId}_${a.seatIndex}`] = a
  })

  const cw = room.cols > 12 ? 64 : room.cols > 8 ? 72 : 78
  const fz = room.cols > 12 ? 14 : 16
  const mz = room.cols > 12 ? 10 : 11

  let rows = ''
  for (let r = 1; r <= room.rows; r++) {
    let cells = `<td class="p-rl">${r}</td>`
    for (let c = 1; c <= room.cols; c++) {
      const si = (r - 1) * room.cols + c
      const a = aMap[`${room.id}_${si}`]
      const s = a ? sMap[a.studentId] : null
      if (s) {
        let inner = `<span class="p-sn">${s.name}</span>`
        if (showCls && s.className) inner += `<span class="p-sc">${s.className}</span>`
        if (showEle && s.electives?.length) inner += `<span class="p-se">${s.electives.slice(0, 3).join(' · ')}</span>`
        cells += `<td class="p-st p-occ">${inner}</td>`
      } else {
        cells += `<td class="p-st p-vac"><span class="p-co">${String.fromCharCode(64 + c)}${r}</span></td>`
      }
    }
    rows += `<tr>${cells}</tr>`
  }

  let head = '<td class="p-cr"></td>'
  for (let c = 1; c <= room.cols; c++) head += `<td class="p-ch">${String.fromCharCode(64 + c)}</td>`

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${room.name} 座位表</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
  background:#fff;color:#1c1c1c;padding:32px 28px;
  width:794px;
}
.hd{text-align:center;margin-bottom:20px}
.hd .dno{font-size:10px;color:#c41e3a;letter-spacing:3px;margin-bottom:6px;font-weight:600}
.hd h1{font-size:24px;font-weight:700;color:#1c1c1c;letter-spacing:3px;margin-bottom:8px;font-family:"Noto Serif SC","PingFang SC",serif}
.hd .tags{font-size:12px;color:#666}
.hd .tags span{margin:0 8px}
.pd{text-align:center;padding:14px;margin:0 40px 20px;background:#f8f5ee;border:1px solid #e8e2d4;border-radius:4px;font-size:12px;color:#999;letter-spacing:10px;font-weight:500}
table{margin:0 auto;border-collapse:collapse}
td{border:1px solid #d5ceb8;text-align:center;vertical-align:middle;padding:6px 8px}
td.p-cr{border:none}
td.p-rl,td.p-ch{background:#f5f2ea;font-size:10px;font-weight:700;color:#8c8270;border:none;font-family:"SF Mono","Consolas",monospace}
td.p-rl{min-width:26px}
td.p-ch{min-width:${cw}px;height:auto;padding:5px 0}
td.p-st{min-width:${cw}px;height:54px}
td.p-vac{background:#fafaf7}
td.p-occ{background:#fffefb}
.p-sn{font-size:${fz}px;font-weight:700;color:#1c1c1c;display:block;line-height:1.4;white-space:nowrap}
.p-sc{font-size:${mz}px;color:#666;display:block;margin-top:2px;line-height:1.3;white-space:nowrap}
.p-se{font-size:9px;color:#999;display:block;margin-top:2px;white-space:nowrap}
.p-co{font-size:9px;color:#ddd;font-family:"SF Mono","Consolas",monospace}
.ft{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid #e8e2d4;font-size:9px;color:#bbb}
.ft .stamp{font-size:9px;color:#c41e3a;border:1px solid #c41e3a;padding:2px 10px;border-radius:2px;letter-spacing:1px;font-weight:600;transform:rotate(-2deg)}
</style></head><body>
<div class="hd">
  <div class="dno">EXAMINATION DOCKET · NO.${docketNo}</div>
  <h1>${room.name} 座位表</h1>
  <div class="tags">
    ${room.examSubject ? '<span>'+room.examSubject+'</span>' : ''}
    ${room.examTime ? '<span>'+room.examTime+'</span>' : ''}
    <span>${room.rows}行×${room.cols}列 · ${room.rows*room.cols}座</span>
  </div>
</div>
<div class="pd">讲 台</div>
<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
<div class="ft"><span>DSE AI 智能学情分析</span><span class="stamp">${today}</span></div>
</body></html>`
}

async function captureRoom(room) {
  const html2canvas = await getHc()
  const idx = rooms.value.findIndex(r => r.id === room.id)
  const html = buildExportHTML(room, showClass.value, showElectives.value, idx + 1)

  const el = captureTarget.value
  if (!el) throw new Error('capture target missing')
  el.innerHTML = html
  await new Promise(r => setTimeout(r, 200))

  const canvas = await html2canvas(el.firstElementChild || el, {
    scale: 3,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false
  })

  el.innerHTML = ''
  return canvas
}

async function exportRoom(room) {
  if (exporting.value) return
  exporting.value = true
  try {
    const canvas = await captureRoom(room)
    const link = document.createElement('a')
    link.download = `${room.name}_座位表.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('Export failed:', err)
  } finally {
    exporting.value = false
  }
}

async function exportAll() {
  if (exporting.value) return
  exporting.value = true
  try {
    for (const room of rooms.value) {
      const canvas = await captureRoom(room)
      const link = document.createElement('a')
      link.download = `${room.name}_座位表.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      await new Promise(r => setTimeout(r, 300))
    }
  } catch (err) {
    console.error('Export all failed:', err)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
/* ==============================================
   EXAMINATION DOCKET · 考场卷宗
   Vermillion-on-cream · Official document aesthetic
   ============================================== */

.esp-shell {
  position: relative;
  min-height: 100vh;
  background: #faf7f0;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  color: #1c1c1c;
  padding-bottom: 60px;
  -webkit-font-smoothing: antialiased;
  isolation: isolate;
}

/* ---- Grain texture ---- */
.esp-grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

/* ---- Masthead ---- */
.esp-masthead {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px;
  background: rgba(250,247,240,0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid #e8e2d4;
}

.esp-back {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #b5ad98;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: color 0.2s;
}
.esp-back:hover { color: #c41e3a; }

.esp-masthead-body { text-align: center; }

.esp-masthead-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.esp-orn-line {
  display: block;
  width: 36px; height: 1px;
  background: linear-gradient(90deg, transparent, #c41e3a66, transparent);
}

.esp-orn-mark { font-size: 6px; color: #c41e3a55; }

.esp-pagetitle {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #1c1c1c;
  font-family: "Noto Serif SC", "PingFang SC", serif;
}

.esp-pagedate {
  margin: 2px 0 0;
  font-size: 10px;
  color: #b5ad98;
  letter-spacing: 1.5px;
}

.esp-masthead-actions { display: flex; gap: 8px; }

.esp-btn-export-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1px solid #1e3a5f;
  background: #1e3a5f;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 1px;
  transition: all 0.2s;
}
.esp-btn-export-all:hover {
  background: #162d4a;
  border-color: #162d4a;
  box-shadow: 0 2px 12px rgba(30,58,95,0.2);
}
.esp-btn-export-all:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ---- Empty ---- */
.esp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 55vh;
  gap: 12px;
  position: relative;
  z-index: 1;
}
.esp-empty-stamp {
  font-size: 48px;
  color: #e0dac8;
  font-family: "Noto Serif SC", serif;
  margin-bottom: 4px;
}
.esp-empty-title { margin: 0; font-size: 15px; font-weight: 600; color: #b5ad98; letter-spacing: 1px; }
.esp-empty-desc { margin: 0; font-size: 12px; color: #ccc1a8; }

/* ---- Dockets ---- */
.esp-dockets {
  position: relative;
  z-index: 1;
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 44px;
}

.esp-docket {
  background: #fffefb;
  border: 1px solid #e5dfcc;
  border-radius: 6px;
  padding: 28px 28px 22px;
  position: relative;
  animation: dk-enter 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.03),
    0 6px 24px rgba(0,0,0,0.025);
}

.esp-docket::before {
  content: '';
  position: absolute;
  top: 0; left: 28px; right: 28px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #c41e3a44, #c41e3a44, transparent);
}

@keyframes dk-enter {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- Docket header ---- */
.esp-docket-hd {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f0ebdd;
}

.esp-docket-hd-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.esp-docket-num {
  font-size: 10px;
  font-weight: 700;
  color: #c41e3a;
  letter-spacing: 3px;
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
}

.esp-docket-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #1c1c1c;
  font-family: "Noto Serif SC", "PingFang SC", serif;
}

.esp-docket-tags { display: flex; gap: 8px; flex-wrap: wrap; }

.esp-dtag {
  font-size: 11px;
  color: #8c8270;
  padding: 3px 10px;
  background: #f7f4ec;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.esp-dtag--red { color: #c41e3a; background: #fef5f5; font-weight: 600; }
.esp-dtag--muted { color: #b5ad98; background: transparent; padding-left: 0; }

.esp-docket-hd-actions { display: flex; gap: 8px; flex-shrink: 0; }

.esp-btn-export {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border: 1px solid #1e3a5f;
  background: #1e3a5f;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.2s;
  letter-spacing: 1px;
}
.esp-btn-export:hover {
  background: #162d4a;
  border-color: #162d4a;
  box-shadow: 0 2px 8px rgba(30,58,95,0.18);
}
.esp-btn-export:disabled { opacity: 0.45; cursor: not-allowed; }

/* ---- Podium ---- */
.esp-podium {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px;
  margin: 0 40px 18px;
}

.esp-podium-bar {
  width: 44px; height: 1px;
  background: linear-gradient(90deg, transparent, #c41e3a33, transparent);
}

.esp-podium-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 10px;
  color: #b5ad98;
  font-family: "Noto Serif SC", serif;
}

/* ---- Grid ---- */
.esp-grid-shell {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.esp-grid {
  display: grid;
  gap: 6px;
  margin: 0 auto;
  justify-content: center;
}

.esp-gc {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  min-height: 62px;
  padding: 6px 8px;
}

.esp-gc--corner { min-width: 30px; }

.esp-gc--colhead,
.esp-gc--rowhead {
  font-size: 10px;
  font-weight: 700;
  color: #b5ad98;
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  letter-spacing: 1.5px;
  height: auto;
  min-height: 22px;
  padding: 4px 0;
}

.esp-gc--rowhead { min-width: 30px; }

/* Free seat */
.esp-gc--seat.is-free {
  border: 1px dashed #e8e2d4;
  background: #fdfcf9;
  transition: border-color 0.2s, background 0.2s;
}
.esp-gc--seat.is-free:hover {
  border-color: #d5ceb8;
  background: #faf7f0;
}

.esp-seat-coord {
  font-size: 9px;
  color: #e0dac8;
  font-family: "SF Mono", "Cascadia Code", monospace;
  letter-spacing: 1px;
}

/* Taken seat */
.esp-gc--seat.is-taken {
  border: 1px solid #d5ceb8;
  background: #fffefb;
  position: relative;
  transition: all 0.18s;
}
.esp-gc--seat.is-taken:hover {
  border-color: #c41e3a55;
  box-shadow: 0 1px 6px rgba(196,30,58,0.06);
  transform: translateY(-1px);
  z-index: 2;
}

.esp-gc--seat.is-taken::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 18px;
  border-radius: 1px;
  background: #c41e3a44;
}

.esp-seat-name {
  font-weight: 700;
  font-size: 14px;
  color: #1c1c1c;
  line-height: 1.4;
  white-space: nowrap;
}

.esp-seat-meta {
  font-size: 11px;
  color: #8c8270;
  margin-top: 2px;
  line-height: 1.3;
  white-space: nowrap;
}

.esp-seat-elecs {
  display: flex;
  gap: 3px;
  margin-top: 2px;
  flex-wrap: nowrap;
  justify-content: center;
}

.esp-elec {
  font-size: 10px;
  font-style: normal;
  padding: 1px 6px;
  border-radius: 3px;
  background: #fef5f5;
  color: #c41e3a99;
  line-height: 1.6;
  white-space: nowrap;
}

/* ---- Docket footer ---- */
.esp-docket-ft {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0ebdd;
}

.esp-docket-ft-text {
  font-size: 10px;
  color: #d5ceb8;
  letter-spacing: 0.5px;
}

.esp-docket-stamp {
  font-size: 9px;
  font-weight: 600;
  color: #c41e3a88;
  border: 1px solid #c41e3a33;
  padding: 2px 12px;
  border-radius: 2px;
  letter-spacing: 1px;
  transform: rotate(-1.5deg);
  font-family: "Noto Serif SC", serif;
}

/* ---- Page footer ---- */
.esp-page-ft {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 32px 0 24px;
  font-size: 10px;
  color: #d5ceb8;
  letter-spacing: 1px;
}

/* ---- Capture target (hidden) ---- */
.esp-capture-target {
  position: fixed;
  left: -9999px;
  top: 0;
  z-index: 99999;
  pointer-events: none;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .esp-masthead { padding: 14px 16px; }
  .esp-masthead-body { display: none; }
  .esp-dockets { padding: 20px 10px; gap: 28px; }
  .esp-docket { padding: 18px 12px 16px; border-radius: 4px; }
  .esp-docket::before { left: 12px; right: 12px; }
  .esp-docket-title { font-size: 18px; letter-spacing: 2px; }
  .esp-docket-hd { flex-direction: column; gap: 12px; }
  .esp-docket-hd-actions { align-self: flex-end; }
  .esp-gc { min-height: 48px; }
  .esp-seat-name { font-size: 12px; }
  .esp-seat-meta { font-size: 10px; }
  .esp-podium { margin: 0 16px 12px; }
}

/* ---- Ctrl+P fallback ---- */
@media print {
  .esp-shell { background: #fff !important; }
  .esp-grain, .esp-masthead, .esp-page-ft,
  .esp-docket-hd-actions, .esp-docket-num, .esp-masthead-ornament { display: none !important; }
  .esp-dockets { padding: 0; gap: 8px; max-width: none; }
  .esp-docket {
    box-shadow: none; border: 1px solid #ccc; border-radius: 0;
    padding: 12px 14px; break-inside: avoid; animation: none;
  }
  .esp-docket::before { display: none; }
  .esp-docket::after { display: none; }
  .esp-docket-title { font-size: 16px; }
  .esp-docket-hd { border-bottom-color: #ddd; padding-bottom: 10px; }
  .esp-docket-ft { border-top-color: #ddd; }
  .esp-dtag { background: #f5f5f5; }
  .esp-dtag--red { background: #fff5f5; }
  .esp-gc--seat.is-free { border-color: #ddd; background: #fafafa; }
  .esp-gc--seat.is-taken { border-color: #bbb; }
  .esp-gc--seat.is-taken::after { display: none; }
  .esp-seat-coord { color: #eee; }
  .esp-podium-bar { display: none; }
  .esp-podium-text { color: #aaa; }
  @page { size: A4 portrait; margin: 6mm; }
}
</style>
