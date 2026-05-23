<template>
  <el-dialog
    v-model="visible"
    title="打印 / 导出"
    width="720px"
    :close-on-click-modal="false"
    @close="$emit('close')"
  >
    <AppWatermark content="" :opacity="0.04">
      <div class="print-tabs">
        <el-tabs v-model="activeTab">
          <!-- 座位表导出 -->
          <el-tab-pane label="座位表" name="chart">
            <div class="print-section">
              <p class="print-desc">按教室生成 A4 横版座位表，包含行列标号、讲台位置。</p>
              <div class="print-room-list">
                <div
                  v-for="room in store.rooms"
                  :key="room.id"
                  class="print-room-item"
                >
                  <div class="print-room-info">
                    <span class="print-room-name">{{ room.name }}</span>
                    <span class="print-room-meta">
                      {{ room.rows }}×{{ room.cols }} · 已安排 {{ getRoomAssignedCount(room.id) }} 人
                    </span>
                  </div>
                  <div class="print-room-actions">
                    <el-button size="small" @click="previewChart(room)">预览</el-button>
                    <el-button size="small" type="primary" @click="downloadChartImage(room)" :loading="downloading === room.id">
                      {{ downloading === room.id ? '导出中...' : 'PNG' }}
                    </el-button>
                    <el-button size="small" @click="downloadChartJPG(room)" :loading="downloading === room.id">
                      {{ downloading === room.id ? '导出中...' : 'JPG' }}
                    </el-button>
                    <el-button size="small" @click="printChart(room)">打印</el-button>
                  </div>
                </div>
              </div>
              <div class="print-batch-row">
                <el-button type="primary" @click="downloadAllChartImages" :loading="downloadingAll">
                  {{ downloadingAll ? '导出中...' : '下载全部教室高清图' }}
                </el-button>
                <el-button @click="printAllCharts">打印全部教室</el-button>
              </div>
            </div>
          </el-tab-pane>

          <!-- 门贴导出 -->
          <el-tab-pane label="门贴" name="door">
            <div class="print-section">
              <p class="print-desc">按教室生成门贴，包含考生名单和座位号，可打印后贴在教室门上。</p>
              <div class="print-room-list">
                <div
                  v-for="room in store.rooms"
                  :key="room.id"
                  class="print-room-item"
                >
                  <div class="print-room-info">
                    <span class="print-room-name">{{ room.name }}</span>
                    <span class="print-room-meta">考生 {{ getRoomAssignedCount(room.id) }} 人</span>
                  </div>
                  <div class="print-room-actions">
                    <el-button size="small" @click="previewDoor(room)">预览</el-button>
                    <el-button size="small" type="primary" @click="printDoor(room)">打印</el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Excel 综合导出 -->
          <el-tab-pane label="Excel 导出" name="excel">
            <div class="print-section">
              <p class="print-desc">将所有教室座位安排一键导出为 Excel 文件，方便本地人员维护和管理。</p>
              <div class="print-export-grid">
                <div class="print-export-card" @click="exportAllRoomsExcel">
                  <div class="pec-icon">📊</div>
                  <div class="pec-title">全部教室座位表</div>
                  <div class="pec-desc">所有教室的座位安排汇总，包含教室、座位号、姓名、学号、班级、选修科目、锁定状态</div>
                </div>
                <div class="print-export-card" @click="exportRoster">
                  <div class="pec-icon">📋</div>
                  <div class="pec-title">完整学生名单</div>
                  <div class="pec-desc">已安排 + 未安排学生完整名单，方便核对遗漏和整体排查</div>
                </div>
                <div class="print-export-card" @click="exportRoomSummary">
                  <div class="pec-icon">📈</div>
                  <div class="pec-title">教室汇总统计</div>
                  <div class="pec-desc">各教室容量、已安排、屏蔽、空余座位数量一览表</div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </AppWatermark>

    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useExamSeatStore } from '@/views/admin/exams/exam-seat/store/examSeatStore.js'
import {
  buildSeatChartHTML,
  buildDoorTagHTML,
  openPreview,
  openForPrint,
  captureChartImage,
  captureChartJPG,
  printAllCharts as printAllChartsMerged,
  downloadAllChartImages as downloadAllRoomImages
} from '@/views/admin/exams/exam-seat/utils/exportHelper.js'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'
import AppWatermark from '@/components/common/AppWatermark.vue'

const emit = defineEmits(['close'])
const store = useExamSeatStore()
const visible = ref(true)
const activeTab = ref('chart')
const downloading = ref(null)
const downloadingAll = ref(false)

function getRoomAssignedCount(roomId) {
  const ids = new Set(
    store.assignments.filter(a => a.roomId === roomId).map(a => a.studentId)
  )
  return ids.size
}

function previewChart(room) {
  const html = buildSeatChartHTML(room, store.students, store.assignments, store.blockedSeats)
  openPreview(html)
}

function printChart(room) {
  const html = buildSeatChartHTML(room, store.students, store.assignments, store.blockedSeats)
  openForPrint(html)
}

async function downloadChartImage(room) {
  downloading.value = room.id
  try {
    const dataUrl = await captureChartImage(room, store.students, store.assignments, store.blockedSeats)
    const link = document.createElement('a')
    link.download = `${room.name}_座位表_A4横版.png`
    link.href = dataUrl
    link.click()
    ElMessage.success(`${room.name} 座位表已下载`)
  } catch (e) {
    ElMessage.error('导出失败，请重试')
  }
  downloading.value = null
}

async function downloadChartJPG(room) {
  downloading.value = room.id
  try {
    const dataUrl = await captureChartJPG(room, store.students, store.assignments, store.blockedSeats)
    const link = document.createElement('a')
    link.download = `${room.name}_座位表_A4横版.jpg`
    link.href = dataUrl
    link.click()
    ElMessage.success(`${room.name} 座位表 JPG 已下载`)
  } catch (e) {
    ElMessage.error('导出失败，请重试')
  }
  downloading.value = null
}

async function downloadAllChartImages() {
  downloadingAll.value = true
  try {
    await downloadAllRoomImages(store.rooms, store.students, store.assignments, store.blockedSeats)
    ElMessage.success('全部教室座位表已下载')
  } catch (e) {
    ElMessage.error('导出失败')
  }
  downloadingAll.value = false
}

function printAllCharts() {
  if (!store.rooms.length) {
    ElMessage.warning('没有教室数据')
    return
  }
  printAllChartsMerged(store.rooms, store.students, store.assignments, store.blockedSeats)
}

function previewDoor(room) {
  const html = buildDoorTagHTML(room, store.students, store.assignments, store.blockedSeats)
  openPreview(html)
}

function printDoor(room) {
  const html = buildDoorTagHTML(room, store.students, store.assignments, store.blockedSeats)
  openForPrint(html)
}

// Excel: 全部教室座位汇总
function exportAllRoomsExcel() {
  const studentMap = {}
  store.students.forEach(s => { studentMap[s.id] = s })

  const allData = []
  store.rooms.forEach(room => {
    const roomAssignments = store.assignments.filter(a => a.roomId === room.id)
    roomAssignments.forEach(a => {
      const s = studentMap[a.studentId]
      const row = Math.floor((a.seatIndex - 1) / room.cols) + 1
      const col = ((a.seatIndex - 1) % room.cols) + 1
      const colLetter = String.fromCharCode(64 + col)
      allData.push({
        '教室': room.name,
        '座位号': `${colLetter}${row}`,
        '座位索引': a.seatIndex,
        '姓名': s?.name || '',
        '学号': s?.classNo || '',
        '班级': s?.className || '',
        '选修科目': (s?.electives || []).join('\n'),
        '锁定': a.locked ? '是' : '否'
      })
    })
    // 空座位
    for (let si = 1; si <= room.rows * room.cols; si++) {
      const occupied = roomAssignments.some(a => a.seatIndex === si)
      const blocked = store.blockedSeats.some(b => b.roomId === room.id && b.seatIndex === si)
      if (!occupied) {
        const row = Math.floor((si - 1) / room.cols) + 1
        const col = ((si - 1) % room.cols) + 1
        const colLetter = String.fromCharCode(64 + col)
        allData.push({
          '教室': room.name,
          '座位号': `${colLetter}${row}`,
          '座位索引': si,
          '姓名': blocked ? '[屏蔽]' : '',
          '学号': '',
          '班级': '',
          '选修科目': '',
          '锁定': blocked ? '屏蔽' : ''
        })
      }
    }
  })

  const ws = XLSX.utils.json_to_sheet(allData)
  ws['!cols'] = [
    { wch: 14 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 22 }, { wch: 8 }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '全部座位安排')
  XLSX.writeFile(wb, `全部教室座位安排_${new Date().toISOString().slice(0, 10)}.xlsx`)
  ElMessage.success('全部教室座位表已导出为 Excel')
}

// Excel: 完整学生名单（已有，增强）
function exportRoster() {
  const studentMap = {}
  store.students.forEach(s => { studentMap[s.id] = s })

  const data = store.assignments.map(a => {
    const s = studentMap[a.studentId]
    const room = store.rooms.find(r => r.id === a.roomId)
    const row = Math.floor((a.seatIndex - 1) / (room?.cols || 5)) + 1
    const col = ((a.seatIndex - 1) % (room?.cols || 5)) + 1
    const colLetter = String.fromCharCode(64 + col)
    return {
      '教室': room?.name || '',
      '座位号': `${colLetter}${row}`,
      '姓名': s?.name || '',
      '学号': s?.classNo || '',
      '班级': s?.className || '',
      '选修科目': (s?.electives || []).join('\n'),
      '锁定': a.locked ? '是' : ''
    }
  })

  const assignedIds = new Set(store.assignments.map(a => a.studentId))
  store.students.filter(s => !assignedIds.has(s.id)).forEach(s => {
    data.push({
      '教室': '未安排',
      '座位号': '',
      '姓名': s.name,
      '学号': s.classNo || '',
      '班级': s.className || '',
      '选修科目': (s.electives || []).join(', '),
      '锁定': ''
    })
  })

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 8 }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '座位安排名单')
  XLSX.writeFile(wb, `考试座位安排_${new Date().toISOString().slice(0, 10)}.xlsx`)
  ElMessage.success('名单已导出')
}

// Excel: 教室汇总统计
function exportRoomSummary() {
  const data = store.roomStats.map(r => ({
    '教室': r.name,
    '行数': r.rows,
    '列数': r.cols,
    '总容量': r.totalCapacity,
    '已安排': r.assignedCount,
    '屏蔽座位': r.blockedCount,
    '空余': r.emptyCount,
    '使用率': r.totalCapacity > 0 ? Math.round(r.assignedCount / (r.totalCapacity - r.blockedCount) * 100) + '%' : '0%'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 16 }, { wch: 8 }, { wch: 8 },
    { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '教室统计')
  XLSX.writeFile(wb, `教室汇总统计_${new Date().toISOString().slice(0, 10)}.xlsx`)
  ElMessage.success('教室统计已导出')
}
</script>

<style scoped>
.print-desc {
  font-size: 13px;
  color: var(--admin-text-secondary, #94a3b8);
  margin: 0 0 12px;
  line-height: 1.6;
}
.print-room-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.print-room-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
}
.print-room-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.print-room-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--admin-text, #e2e8f0);
}
.print-room-meta {
  font-size: 12px;
  color: var(--admin-text-secondary, #94a3b8);
}
.print-room-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.print-batch-row {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

/* Excel export cards */
.print-export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
}
.print-export-card {
  padding: 18px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.print-export-card:hover {
  border-color: var(--admin-accent-light);
  background: rgba(99,102,241,0.06);
  transform: translateY(-2px);
}
.pec-icon { font-size: 28px; margin-bottom: 10px; }
.pec-title { font-size: 14px; font-weight: 600; color: var(--admin-text, #e2e8f0); margin-bottom: 6px; }
.pec-desc { font-size: 11px; color: var(--admin-text-muted, #94a3b8); line-height: 1.5; }
</style>
