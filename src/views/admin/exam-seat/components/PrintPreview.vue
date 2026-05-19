<template>
  <el-dialog
    v-model="visible"
    title="🖨️ 打印 / 导出"
    width="700px"
    :close-on-click-modal="false"
    @close="$emit('close')"
  >
    <div class="print-tabs">
      <el-tabs v-model="activeTab">
        <!-- 座位表导出 -->
        <el-tab-pane label="座位表" name="chart">
          <div class="print-section">
            <p class="print-desc">按教室生成 A4 座位表，包含行列标号、讲台位置、学生姓名和班级信息。</p>
            <div class="print-room-list">
              <div
                v-for="room in store.rooms"
                :key="room.id"
                class="print-room-item"
              >
                <div class="print-room-info">
                  <span class="print-room-name">{{ room.name }}</span>
                  <span class="print-room-meta">
                    {{ room.rows }}×{{ room.cols }} ·
                    已安排 {{ getRoomAssignedCount(room.id) }} 人
                  </span>
                </div>
                <div class="print-room-actions">
                  <el-button size="small" @click="previewChart(room)">👁 预览</el-button>
                  <el-button size="small" type="primary" @click="printChart(room)">🖨️ 打印</el-button>
                </div>
              </div>
            </div>
            <el-button type="primary" @click="printAllCharts" style="margin-top:12px">
              🖨️ 打印全部教室
            </el-button>
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
                  <span class="print-room-meta">
                    考生 {{ getRoomAssignedCount(room.id) }} 人
                  </span>
                </div>
                <div class="print-room-actions">
                  <el-button size="small" @click="previewDoor(room)">👁 预览</el-button>
                  <el-button size="small" type="primary" @click="printDoor(room)">🖨️ 打印</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 学生名单 -->
        <el-tab-pane label="学生名单" name="roster">
          <div class="print-section">
            <p class="print-desc">导出包含所有学生及其座位安排的综合名单。</p>
            <el-button type="primary" @click="exportRoster" style="margin-top:8px">
              📥 导出 Excel
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useExamSeatStore } from '../store/examSeatStore.js'
import {
  buildSeatChartHTML,
  buildDoorTagHTML,
  openForPrint
} from '../utils/exportHelper.js'
import * as XLSX from 'xlsx'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['close'])
const store = useExamSeatStore()
const visible = ref(true)
const activeTab = ref('chart')

function getRoomAssignedCount(roomId) {
  const ids = new Set(
    store.assignments.filter(a => a.roomId === roomId).map(a => a.studentId)
  )
  return ids.size
}

function previewChart(room) {
  const html = buildSeatChartHTML(room, store.students, store.assignments)
  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function printChart(room) {
  const html = buildSeatChartHTML(room, store.students, store.assignments)
  openForPrint(html)
}

function printAllCharts() {
  if (!store.rooms.length) {
    ElMessage.warning('没有教室数据')
    return
  }
  store.rooms.forEach(room => {
    const html = buildSeatChartHTML(room, store.students, store.assignments)
    openForPrint(html)
  })
}

function previewDoor(room) {
  const html = buildDoorTagHTML(room, store.students, store.assignments)
  const win = window.open('', '_blank', 'width=700,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function printDoor(room) {
  const html = buildDoorTagHTML(room, store.students, store.assignments)
  openForPrint(html)
}

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
      '选修科目': (s?.electives || []).join(', '),
      '锁定': a.locked ? '是' : ''
    }
  })

  // 添加未安排学生
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
  ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 6 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '座位安排名单')
  XLSX.writeFile(wb, `考试座位安排_${new Date().toISOString().slice(0,10)}.xlsx`)
  ElMessage.success('已导出')
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
}
</style>
