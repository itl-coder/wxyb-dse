<template>
  <el-dialog
    v-model="visible"
    title="打印 / 导出座位表"
    width="860px"
    :close-on-click-modal="false"
    @close="$emit('close')"
    class="esp-dialog"
  >
    <el-tabs v-model="tab" class="esp-tabs">
      <!-- ========== 座位表 ========== -->
      <el-tab-pane label="座位表" name="chart">
        <div class="esp-chart-layout">
          <div class="esp-preview-pane">
            <div class="esp-preview-label">预览 — {{ chartRoom?.name || '请选择教室' }}</div>
            <div class="esp-preview-box" ref="chartPreviewBox">
              <div v-if="chartSvg" class="esp-svg-wrap" v-html="chartSvg" ref="chartSvgEl"></div>
              <div v-else class="esp-preview-empty">选择教室后自动预览</div>
            </div>
          </div>
          <div class="esp-action-pane">
            <div class="esp-action-label">导出 & 打印</div>
            <el-select v-model="chartRoomId" placeholder="选择教室" size="small" style="width:100%;margin-bottom:10px">
              <el-option v-for="r in store.rooms" :key="r.id" :label="r.name" :value="r.id" />
            </el-select>
            <button class="esp-big-btn esp-btn-png" :disabled="!chartRoom || dlChart" @click="downloadChart('png')">
              导出 PNG 高清图
            </button>
            <button class="esp-big-btn esp-btn-jpg" :disabled="!chartRoom || dlChart" @click="downloadChart('jpg')">
              导出 JPG
            </button>
            <button class="esp-big-btn esp-btn-pdf" :disabled="!chartRoom || dlChart" @click="downloadChart('pdf')">
              导出 PDF
            </button>
            <div class="esp-action-sep"></div>
            <button class="esp-big-btn esp-btn-print" :disabled="!chartRoom" @click="printChart">
              直接打印
            </button>
          </div>
        </div>
      </el-tab-pane>

      <!-- ========== 门贴 ========== -->
      <el-tab-pane label="门贴" name="doortag">
        <div class="esp-chart-layout">
          <div class="esp-preview-pane">
            <div class="esp-preview-label">门贴预览</div>
            <div class="esp-preview-box" ref="doorPreviewBox">
              <div class="esp-preview-scale" :style="{ transform: `scale(${doorScale})`, transformOrigin: 'top left' }">
                <div class="esp-door-preview-page" ref="doorPreviewContent"></div>
              </div>
              <div v-if="!doorPreviewReady" class="esp-preview-empty">选择教室后点击「刷新预览」</div>
            </div>
            <button class="esp-sm-btn" @click="refreshDoorPreview" :disabled="!doorTagRoomId">刷新预览</button>
          </div>
          <div class="esp-action-pane">
            <div class="esp-action-label">门贴操作</div>
            <el-select v-model="doorTagRoomId" placeholder="选择教室" size="small" style="width:100%;margin-bottom:10px">
              <el-option v-for="r in store.rooms" :key="r.id" :label="r.name" :value="r.id" />
            </el-select>
            <button class="esp-big-btn esp-btn-print" :disabled="!doorTagRoom" @click="printDoorTag">
              打印门贴
            </button>
          </div>
        </div>
      </el-tab-pane>

      <!-- ========== Excel 导出 ========== -->
      <el-tab-pane label="Excel 数据" name="excel">
        <div class="esp-excel-grid">
          <div class="esp-excel-card esp-excel-card-primary" @click="exportGridLayoutExcel">
            <div class="eec-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>
            </div>
            <div class="eec-title">考场网格布局导出</div>
            <div class="eec-desc">按实际座位行列排布 · 每个教室一个Sheet</div>
          </div>
          <div class="esp-excel-card" @click="exportSeatExcel">
            <div class="eec-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div class="eec-title">全部教室座位汇总</div>
            <div class="eec-desc">每个座位一行 · 教室 / 座号 / 姓名 / 班级 / 选修</div>
          </div>
          <div class="esp-excel-card" @click="exportRosterExcel">
            <div class="eec-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="eec-title">完整学生名单</div>
            <div class="eec-desc">已安排 + 未安排学生 · 含座位及选修信息</div>
          </div>
          <div class="esp-excel-card" @click="exportSummaryExcel">
            <div class="eec-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <div class="eec-title">教室汇总统计</div>
            <div class="eec-desc">容量 / 使用率 / 屏蔽 / 空余 · 一表汇总</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'
import {
  downloadRoomImageSVG, downloadRoomPDFSVG, printRoomSVG, buildSeatChartSVG,
  exportAllRoomsExcel, exportRoster, exportRoomSummary, exportGridExcel,
  buildDoorTagHTML
} from '../utils/exportPipeline'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close'])
const store = useExamSeat2Store()

const visible = ref(true)
const tab = ref('chart')
const dlChart = ref(false)

// ---- SVG 预览 ----
const chartPreviewBox = ref(null)
const chartSvg = ref('')
const chartSvgEl = ref(null)

// ---- 门贴预览 ----
const doorPreviewBox = ref(null)
const doorPreviewContent = ref(null)
const doorPreviewReady = ref(false)
const doorScale = ref(0.42)

const chartRoomId = ref(null)
const doorTagRoomId = ref(null)

watch(() => store.rooms, (rooms) => {
  if (rooms.length) {
    if (!chartRoomId.value) chartRoomId.value = rooms[0].id
    if (!doorTagRoomId.value) doorTagRoomId.value = rooms[0].id
  }
}, { immediate: true })

const chartRoom = computed(() => store.rooms.find(r => r.id === chartRoomId.value))
const doorTagRoom = computed(() => store.rooms.find(r => r.id === doorTagRoomId.value))

const svgOpts = computed(() => ({
  examName: store.examName,
  doorDirection: store.doorDirection,
  doorSeatIndex: chartRoom.value ? store.getDoorSeatIndex(chartRoom.value.id) : null,
  scale: 1
}))

// ========== SVG 预览（自动更新） ==========
function refreshChartSvg() {
  if (!chartRoom.value) { chartSvg.value = ''; return }
  const svg = buildSeatChartSVG(chartRoom.value, store.students, store.assignments, store.blockedSeats, svgOpts.value)
  chartSvg.value = svg
}

watch(chartRoomId, refreshChartSvg)
watch(() => store.assignments.length, refreshChartSvg)
watch(() => store.blockedSeats.length, refreshChartSvg)

// ========== 门贴预览 ==========
function parseAndMountHTML(html, targetEl) {
  if (!targetEl) return
  targetEl.innerHTML = ''
  const styleMatch = html.match(/<style>([\s\S]*)<\/style>/)
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/)
  if (styleMatch) {
    const styleEl = document.createElement('style')
    styleEl.textContent = styleMatch[1].replace(/width:\s*\d+px/g, 'width:100%')
    targetEl.appendChild(styleEl)
  }
  if (bodyMatch) {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = bodyMatch[1]
    targetEl.appendChild(wrapper)
  }
}

function refreshDoorPreview() {
  if (!doorTagRoom.value) return
  const html = buildDoorTagHTML(doorTagRoom.value, store.students, store.assignments)
  parseAndMountHTML(html, doorPreviewContent.value)
  doorPreviewReady.value = true
}

watch(doorTagRoomId, () => { if (tab.value === 'doortag') refreshDoorPreview() })
watch(tab, (t) => {
  if (t === 'chart' && chartRoom.value) refreshChartSvg()
  if (t === 'doortag' && doorTagRoom.value) refreshDoorPreview()
})

// ========== 导出（SVG 高清方案） ==========
async function downloadChart(format) {
  if (!chartRoom.value) return
  dlChart.value = true
  try {
    if (format === 'pdf') {
      await downloadRoomPDFSVG(chartRoom.value, store.students, store.assignments, store.blockedSeats, {
        examName: store.examName,
        doorDirection: store.doorDirection,
        doorSeatIndex: store.getDoorSeatIndex(chartRoom.value.id)
      })
    } else {
      await downloadRoomImageSVG(chartRoom.value, store.students, store.assignments, store.blockedSeats, format, {
        examName: store.examName,
        doorDirection: store.doorDirection,
        doorSeatIndex: store.getDoorSeatIndex(chartRoom.value.id)
      })
    }
    ElMessage.success(`${chartRoom.value.name} 已导出`)
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || '未知错误'))
  } finally { dlChart.value = false }
}

function printChart() {
  if (!chartRoom.value) return
  printRoomSVG(chartRoom.value, store.students, store.assignments, store.blockedSeats, {
    examName: store.examName,
    doorDirection: store.doorDirection,
    doorSeatIndex: store.getDoorSeatIndex(chartRoom.value.id)
  })
}

// ========== 门贴打印 ==========
function printDoorTag() {
  if (!doorTagRoom.value) return
  const room = doorTagRoom.value
  const ra = store.assignments.filter(a => a.roomId === room.id)
  const sMap = {}
  store.students.forEach(s => { sMap[s.id] = s })

  const rowsHTML = ra.map((a, i) => {
    const s = sMap[a.studentId]
    const row = Math.floor((a.seatIndex - 1) / room.cols) + 1
    const col = ((a.seatIndex - 1) % room.cols) + 1
    return `<tr>
      <td class="d-num">${i+1}</td>
      <td class="d-name">${s?s.name:'—'}</td>
      <td class="d-cname">${s?s.className||'':''}</td>
      <td class="d-seat">${String.fromCharCode(64+col)}${row}</td>
    </tr>`
  }).join('')

  const root = document.createElement('div')
  root.id = 'print-root'
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;display:flex;align-items:center;justify-content:center;'
  const style = document.createElement('style')
  style.textContent = `
    @page{size:A4 landscape;margin:0}
    @media print{html,body,#print-root{margin:0;padding:0;background:#fff!important;-webkit-print-color-adjust:exact}}
    .door-page{width:297mm;height:210mm;padding:8mm 12mm;box-sizing:border-box;font-family:"PingFang SC","Microsoft YaHei",sans-serif;color:#1a1a1a;background:#fff;overflow:hidden;display:flex;flex-direction:column}
    .door-hdr{text-align:center;border-bottom:2px solid #444;padding-bottom:6mm;margin-bottom:5mm}
    .door-hdr h1{font-size:6mm;font-weight:700;margin:0 0 1mm}
    .door-hdr .info{font-size:3mm;color:#555}
    .door-table{width:100%;border-collapse:collapse;font-size:3.2mm}
    .door-table th{background:#f5f5f5;border-bottom:0.5mm solid #999;padding:1.8mm 2mm;text-align:left;font-weight:700;font-size:2.8mm}
    .door-table td{padding:1.5mm 2mm;border-bottom:0.3mm solid #e0e0e0}
    tr:nth-child(even) td{background:#fafafa}
    .d-num{width:6mm;color:#888;text-align:center;font-family:monospace}
    .d-name{font-weight:700;font-size:3.5mm}
    .d-cname{color:#555}
    .d-seat{color:#666;font-family:monospace;width:8mm;text-align:center}
  `
  root.appendChild(style)
  root.innerHTML += `<div class="door-page">
    <div class="door-hdr"><h1>${room.name}</h1><div class="info">${room.examSubject||''} · 考生 ${ra.length} 人</div></div>
    <div class="door-table-wrap"><table class="door-table"><thead><tr><th class="d-num">#</th><th class="d-name">姓名</th><th class="d-cname">班级</th><th class="d-seat">座位</th></tr></thead><tbody>${rowsHTML}</tbody></table></div>
  </div>`
  document.body.appendChild(root)
  setTimeout(() => { window.print(); setTimeout(() => root.remove(), 500) }, 400)
}

// ========== Excel ==========
async function exportGridLayoutExcel() {
  try { await exportGridExcel(store.rooms, store.students, store.assignments, store.blockedSeats); ElMessage.success('考场网格布局已导出') }
  catch (e) { ElMessage.error('导出失败：' + (e.message || '未知错误')) }
}
async function exportSeatExcel() {
  try { await exportAllRoomsExcel(store.rooms, store.students, store.assignments, store.blockedSeats); ElMessage.success('座位汇总已导出') }
  catch (e) { ElMessage.error('导出失败：' + (e.message || '未知错误')) }
}
async function exportRosterExcel() {
  try { await exportRoster(store.rooms, store.students, store.assignments); ElMessage.success('完整名单已导出') }
  catch (e) { ElMessage.error('导出失败：' + (e.message || '未知错误')) }
}
async function exportSummaryExcel() {
  try { await exportRoomSummary(store.roomStats); ElMessage.success('教室统计已导出') }
  catch (e) { ElMessage.error('导出失败：' + (e.message || '未知错误')) }
}
</script>

<style scoped>
.esp-tabs { margin-top: -8px; }

.esp-chart-layout {
  display: flex; gap: 16px; min-height: 300px;
}

.esp-preview-pane {
  flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0;
}
.esp-preview-label {
  font-size: 11px; font-weight: 600; color: var(--admin-text-secondary);
}
.esp-preview-box {
  flex: 1; border: 1px solid var(--admin-border); border-radius: 6px;
  background: #888; overflow: auto; min-height: 240px;
  display: flex; align-items: center; justify-content: center;
}
.esp-svg-wrap {
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  min-width: 100%; min-height: 100%;
}
.esp-svg-wrap :deep(svg) {
  max-width: 100%; height: auto;
}
.esp-preview-scale { width: fit-content; min-width: 100%; background: #fff; }
.esp-door-preview-page {
  width: 297mm; height: 210mm; padding: 8mm 12px;
  box-sizing: border-box; background: #fff; color: #1a1a1a;
  font-family: "PingFang SC","Microsoft YaHei",sans-serif; overflow: hidden;
}
.esp-preview-empty {
  color: #fff; font-size: 13px;
}
.esp-sm-btn {
  padding: 5px 14px; border: 1px solid var(--admin-border);
  background: var(--admin-surface); color: var(--admin-text-secondary);
  border-radius: 5px; cursor: pointer; font-size: 11px; font-family: var(--admin-font);
  transition: all 0.15s; align-self: flex-start;
}
.esp-sm-btn:hover:not(:disabled) { border-color: var(--admin-accent); color: var(--admin-accent-light); }
.esp-sm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.esp-action-pane {
  width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 6px;
}
.esp-action-label {
  font-size: 10px; font-weight: 700; color: var(--admin-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px;
}
.esp-action-sep { height: 1px; background: var(--admin-border); margin: 4px 0; }
.esp-big-btn {
  width: 100%; padding: 9px 12px; border: 1px solid var(--admin-border);
  background: var(--admin-surface); color: var(--admin-text);
  border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;
  font-family: var(--admin-font); transition: all 0.18s; text-align: center;
}
.esp-big-btn:hover:not(:disabled) { border-color: var(--admin-accent); background: var(--admin-surface-hover); }
.esp-big-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.esp-btn-png { border-color: rgba(16,185,129,0.3); color: var(--admin-success); }
.esp-btn-png:hover:not(:disabled) { border-color: var(--admin-success); background: rgba(16,185,129,0.08); }
.esp-btn-jpg { border-color: rgba(245,158,11,0.3); color: var(--admin-warning); }
.esp-btn-jpg:hover:not(:disabled) { border-color: var(--admin-warning); background: rgba(245,158,11,0.08); }
.esp-btn-pdf { border-color: rgba(239,68,68,0.3); color: var(--admin-danger); }
.esp-btn-pdf:hover:not(:disabled) { border-color: var(--admin-danger); background: rgba(239,68,68,0.08); }
.esp-btn-print { border-color: var(--admin-border-light); }
.esp-btn-print:hover:not(:disabled) { border-color: var(--admin-accent-light); color: var(--admin-accent-light); }

/* Excel */
.esp-excel-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
}
.esp-excel-card {
  padding: 20px 14px; border: 1px solid var(--admin-border);
  border-radius: 10px; text-align: center; cursor: pointer;
  transition: all 0.2s; background: var(--admin-surface);
}
.esp-excel-card:hover {
  border-color: var(--admin-accent);
  box-shadow: 0 2px 16px rgba(99,102,241,0.12);
  transform: translateY(-2px);
}
.esp-excel-card-primary {
  border-color: rgba(99,102,241,0.25);
  background: rgba(99,102,241,0.04);
}
.eec-icon { color: var(--admin-accent-light); margin-bottom: 10px; }
.eec-title { font-size: 13px; font-weight: 600; color: var(--admin-text); margin-bottom: 4px; }
.eec-desc { font-size: 11px; color: var(--admin-text-muted); line-height: 1.5; }
</style>
