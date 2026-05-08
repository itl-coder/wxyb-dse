<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📅 课表管理</div>
          <div class="admin-card-subtitle">教师周课时分配 · 自动生成月课表 · 支持周六日</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <el-select v-model="currentClass" size="small" style="width:100px" @change="loadAll">
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-select v-model="currentMonth" size="small" style="width:130px" @change="onMonthChange">
            <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
          <el-switch v-model="showWeekend" size="small" active-text="周六日" inactive-text="仅工作日" />
          <el-button size="small" type="primary" @click="openBatchDialog">📋 批量分配</el-button>
          <el-button size="small" @click="applyToCurrentMonth">🔄 应用到本月</el-button>
          <el-button size="small" @click="showPrintDialog = true">🖨️ 打印课表</el-button>
        </div>
      </div>

      <!-- View Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button v-for="tab in viewTabs" :key="tab.key" class="tt-view-tab" :class="{ active: activeView === tab.key }" @click="activeView = tab.key">{{ tab.label }}</button>
      </div>

      <!-- === WEEK VIEW (Schedule Editor) === -->
      <div v-if="activeView === 'week'" class="tt-week-layout">
        <!-- Teacher Overview Panel -->
        <div class="tt-teacher-panel">
          <div class="tt-panel-title">👨‍🏫 教师周课时</div>
          <div v-for="t in teacherSummary" :key="t.teacher" class="tt-teacher-row" @click="highlightTeacher = highlightTeacher === t.teacher ? null : t.teacher" :class="{ active: highlightTeacher === t.teacher }">
            <div class="tt-teacher-name">{{ t.teacher }}</div>
            <div class="tt-teacher-subjects">{{ t.subjects }}</div>
            <div class="tt-teacher-total">{{ t.total }}节/周</div>
          </div>
          <div v-if="teacherSummary.length === 0" style="font-size:11px;color:var(--admin-text-muted);text-align:center;padding:12px">暂无教师数据</div>
        </div>

        <!-- Weekly Grid -->
        <div class="tt-grid-wrap">
          <div style="font-size:13px;font-weight:600;color:var(--admin-text);margin-bottom:8px;text-align:center">
            {{ currentClass }}班 · 周课表 · {{ currentMonthLabel }}
            <el-tag v-if="isCurrentMonth" size="small" type="success" style="margin-left:6px">当月</el-tag>
          </div>
          <div class="tt-grid">
            <div class="tt-grid-header">
              <div class="tt-corner">节次</div>
              <div v-for="d in activeWeekdays" :key="d.value" class="tt-day-header" :class="{ weekend: d.value >= 6 }">
                <div>{{ d.label }}</div>
              </div>
            </div>
            <div v-for="p in periods" :key="p.id" class="tt-grid-row">
              <div class="tt-period-cell">
                <div>{{ p.label }}</div>
                <div class="tt-period-time">{{ p.time }}</div>
              </div>
              <div v-for="d in activeWeekdays" :key="d.value" class="tt-lesson-cell" :class="{
                weekend: d.value >= 6,
                'has-lesson': getSchedule(d.value, p.id),
                highlighted: highlightTeacher && getSchedule(d.value, p.id)?.teacher === highlightTeacher
              }" @click="editCell(d.value, p.id)">
                <template v-if="getSchedule(d.value, p.id)">
                  <div class="tt-cell-subject">{{ getSchedule(d.value, p.id).subject }}</div>
                  <div class="tt-cell-teacher">{{ getSchedule(d.value, p.id).teacher }}</div>
                  <div class="tt-cell-room">{{ getSchedule(d.value, p.id).room }}</div>
                </template>
                <div v-else class="tt-cell-empty">+</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- === MONTH VIEW (Calendar) === -->
      <div v-if="activeView === 'month'" class="tt-month-view">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <el-button size="small" text @click="changeMonth(-1)">◀</el-button>
          <span style="font-size:13px;font-weight:600;color:var(--admin-text)">{{ monthYear }}</span>
          <el-button size="small" text @click="changeMonth(1)">▶</el-button>
          <span style="font-size:11px;color:var(--admin-text-muted);margin-left:auto">{{ currentClass }}班</span>
        </div>
        <div class="tt-calendar">
          <div v-for="dh in dayHeaders" :key="dh" class="tt-cal-header">{{ dh }}</div>
          <div v-for="cell in monthCells" :key="cell.key" class="tt-cal-cell" :class="{ today: cell.date === today, other: !cell.inMonth, weekend: cell.isWeekend }">
            <span class="tt-cal-date">{{ cell.label }}</span>
            <div v-if="cell.date" class="tt-cal-lessons">
              <span v-for="(l, i) in cell.lessons.slice(0, 4)" :key="i" class="tt-cal-tag" :style="{background: subjectColor(l.subject)}" :title="`第${l.period}节 ${l.subject} · ${l.teacher}`">{{ l.subject.slice(0,2) }}</span>
              <span v-if="cell.lessons.length > 4" style="font-size:9px;color:var(--admin-text-muted)">+{{ cell.lessons.length - 4 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Lesson Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑课程' : '添加课程'" width="480px">
      <div class="admin-form-group">
        <label>星期 <span style="color:var(--admin-danger)">*</span></label>
        <el-select v-model="lessonForm.weekday" style="width:100%">
          <el-option v-for="d in allWeekdays" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>节次 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="lessonForm.period" style="width:100%">
            <el-option v-for="p in periods" :key="p.id" :label="p.label" :value="p.id" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>科目 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="lessonForm.subject" style="width:100%">
            <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>教师</label>
          <el-input v-model="lessonForm.teacher" placeholder="教师姓名" />
        </div>
        <div class="admin-form-group">
          <label>教室</label>
          <el-input v-model="lessonForm.room" placeholder="教室编号" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>教室位置</label>
        <el-input v-model="lessonForm.location" placeholder="如：教学楼5层501室" />
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="editingId" size="small" type="danger" @click="deleteLesson" style="margin-right:auto">删除</el-button>
        <el-button type="primary" @click="saveLesson">{{ editingId ? '保存修改' : '添加课程' }}</el-button>
      </template>
    </el-dialog>

    <!-- Batch Assign Dialog -->
    <el-dialog v-model="batchDialogVisible" title="📋 批量分配课表" width="560px">
      <div class="admin-form-group">
        <label>选择教师</label>
        <el-input v-model="batchForm.teacher" placeholder="教师姓名" />
      </div>
      <div class="admin-form-group">
        <label>选择科目 <span style="color:var(--admin-danger)">*</span></label>
        <el-select v-model="batchForm.subject" style="width:100%">
          <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
      <div class="admin-form-group">
        <label>选择教室</label>
        <el-input v-model="batchForm.room" placeholder="教室编号" />
      </div>
      <div class="admin-form-group">
        <label>教室位置</label>
        <el-input v-model="batchForm.location" placeholder="如：教学楼5层501室" />
      </div>
      <div class="admin-form-group">
        <label>点击格子选择要分配的节次（可多选）</label>
        <div class="tt-batch-grid">
          <div class="tt-batch-header">
            <div></div>
            <div v-for="d in activeWeekdays" :key="d.value" class="tt-batch-day">{{ d.label }}</div>
          </div>
          <div v-for="p in periods" :key="p.id" class="tt-batch-row">
            <div class="tt-batch-period">{{ p.label }}</div>
            <div v-for="d in activeWeekdays" :key="d.value" class="tt-batch-cell" :class="{ selected: isBatchSelected(d.value, p.id), occupied: getSchedule(d.value, p.id) }" @click="toggleBatchCell(d.value, p.id)"></div>
          </div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--admin-text-muted);background:var(--admin-bg);padding:8px;border-radius:6px">
        💡 已选 {{ batchForm.cells.length }} 个时段。已有课程的格子将跳过，不会覆盖。
      </div>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatch">批量创建（{{ batchForm.cells.length }}个）</el-button>
      </template>
    </el-dialog>

    <!-- Print Dialog -->
    <el-dialog v-model="showPrintDialog" title="打印课表" width="460px">
      <div class="admin-form-group">
        <label>打印标题</label>
        <el-input v-model="printTitle" placeholder="如：威学一百 · 5D班课表" />
      </div>
      <div class="admin-form-group">
        <label>打印班级</label>
        <el-select v-model="printClass" style="width:100%">
          <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
        </el-select>
      </div>
      <div class="admin-form-group">
        <label>打印月份</label>
        <el-select v-model="printMonth" style="width:100%">
          <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="showPrintDialog = false">取消</el-button>
        <el-button type="primary" @click="doPrint">🖨️ 打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { timetableService, weeklyScheduleService, courseService, studentService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { getWatermarkHTML, getWatermarkStyle } from '@/utils/watermark'

const store = useAppStore()
const currentClass = ref('5D')
const currentMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
const activeView = ref('week')
const showWeekend = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const batchDialogVisible = ref(false)
const showPrintDialog = ref(false)
const printTitle = ref('')
const printClass = ref('5D')
const printMonth = ref('2026-05')
const highlightTeacher = ref(null)
const monthOffset = ref(0)

const today = new Date().toISOString().split('T')[0]
const allWeekdays = [
  { label: '周一', value: 1 }, { label: '周二', value: 2 }, { label: '周三', value: 3 },
  { label: '周四', value: 4 }, { label: '周五', value: 5 },
  { label: '周六', value: 6 }, { label: '周日', value: 7 }
]

const periods = [
  { id: 1, label: '第一节', time: '08:00-08:45' },
  { id: 2, label: '第二节', time: '08:55-09:40' },
  { id: 3, label: '第三节', time: '10:00-10:45' },
  { id: 4, label: '第四节', time: '10:55-11:40' },
  { id: 5, label: '第五节', time: '13:30-14:15' },
  { id: 6, label: '第六节', time: '14:25-15:10' },
  { id: 7, label: '第七节', time: '15:20-16:05' }
]

const viewTabs = [
  { key: 'week', label: '📅 周课表' },
  { key: 'month', label: '🗓️ 月视图' }
]

// Subject colors
const subjectColors = {
  '数学': '#3b82f6', '中国语文': '#22c55e', '英国语文': '#8b5cf6',
  'English Reading': '#8b5cf6', 'English Writing': '#8b5cf6', 'English Listening': '#8b5cf6', 'English Speaking': '#8b5cf6',
  '物理': '#f59e0b', '化学': '#ef4444', '生物': '#10b981', '历史': '#78716c',
  '地理': '#06b6d4', '经济': '#f97316', '资讯及通讯科技': '#6366f1',
  '企业、会计与财务概论': '#14b8a6', '视觉艺术': '#ec4899', '体育': '#84cc16', '音乐': '#a855f7',
  '公民与社会发展': '#64748b'
}
function subjectColor(s) { return subjectColors[s] || 'var(--admin-accent)' }

const weeklySchedules = ref([])
const monthLessons = ref([])
const classList = computed(() => studentService.getClasses())
const subjectList = computed(() => courseService.getEnabled().map(c => c.name))

const currentMonthLabel = computed(() => {
  const [y, m] = currentMonth.value.split('-')
  return `${y}年${parseInt(m)}月`
})

const isCurrentMonth = computed(() => {
  const now = new Date()
  const [y, m] = currentMonth.value.split('-').map(Number)
  return y === now.getFullYear() && m === now.getMonth() + 1
})

const monthOptions = computed(() => {
  const now = new Date()
  const options = []
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`
    options.push({ value, label })
  }
  return options
})

const activeWeekdays = computed(() => {
  if (showWeekend.value) return allWeekdays
  return allWeekdays.filter(d => d.value <= 5)
})

const teacherSummary = computed(() => weeklyScheduleService.getTeacherSummary(currentClass.value))

const lessonForm = ref({ weekday: 1, period: 1, subject: '数学', teacher: '', room: '', location: '' })

const batchForm = ref({ teacher: '', subject: '数学', room: '', location: '', cells: [] })

function getSchedule(weekday, period) {
  return weeklySchedules.value.find(w => w.weekday === weekday && w.period === period) || null
}

function loadAll() {
  weeklySchedules.value = weeklyScheduleService.getByClass(currentClass.value)
  loadMonthLessons()
}

function loadMonthLessons() {
  monthLessons.value = timetableService.getByClassAndMonth(currentClass.value, currentMonth.value)
}

function onMonthChange() {
  loadMonthLessons()
}

function editCell(weekday, period) {
  const existing = getSchedule(weekday, period)
  if (existing) {
    editingId.value = existing.id
    lessonForm.value = { weekday: existing.weekday, period: existing.period, subject: existing.subject, teacher: existing.teacher || '', room: existing.room || '', location: existing.location || '' }
  } else {
    editingId.value = null
    lessonForm.value = { weekday, period, subject: '数学', teacher: '', room: '', location: '' }
  }
  dialogVisible.value = true
}

function saveLesson() {
  if (!lessonForm.value.subject) { ElMessage.warning('请选择科目'); return }
  const data = { ...lessonForm.value, class: currentClass.value }
  if (editingId.value) {
    weeklyScheduleService.update(editingId.value, data)
    ElMessage.success('课程已更新')
  } else {
    weeklyScheduleService.create(data)
    ElMessage.success('课程已添加')
  }
  dialogVisible.value = false
  loadAll()
}

async function deleteLesson() {
  try {
    await ElMessageBox.confirm('确定删除此课程吗？', '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    weeklyScheduleService.delete(editingId.value)
    dialogVisible.value = false
    loadAll()
    ElMessage.success('课程已删除')
  } catch {}
}

// Batch assign
function openBatchDialog() {
  batchForm.value = { teacher: '', subject: '数学', room: '', location: '', cells: [] }
  batchDialogVisible.value = true
}

function isBatchSelected(weekday, period) {
  return batchForm.value.cells.some(c => c[0] === weekday && c[1] === period)
}

function toggleBatchCell(weekday, period) {
  const idx = batchForm.value.cells.findIndex(c => c[0] === weekday && c[1] === period)
  if (idx === -1) {
    batchForm.value.cells.push([weekday, period])
  } else {
    batchForm.value.cells.splice(idx, 1)
  }
}

function saveBatch() {
  if (!batchForm.value.subject) { ElMessage.warning('请选择科目'); return }
  if (batchForm.value.cells.length === 0) { ElMessage.warning('请至少选择一个时段'); return }

  let created = 0, skipped = 0
  batchForm.value.cells.forEach(([weekday, period]) => {
    const exists = weeklySchedules.value.find(w => w.weekday === weekday && w.period === period)
    if (exists) { skipped++; return }
    weeklyScheduleService.create({
      class: currentClass.value, weekday, period,
      subject: batchForm.value.subject,
      teacher: batchForm.value.teacher,
      room: batchForm.value.room,
      location: batchForm.value.location
    })
    created++
  })

  batchDialogVisible.value = false
  loadAll()
  ElMessage.success(`分配完成：新增 ${created} 条，跳过 ${skipped} 条已存在`)
}

// Apply weekly schedule to current month
function applyToCurrentMonth() {
  weeklyScheduleService.generateMonth(currentClass.value, currentMonth.value)
  loadMonthLessons()
  ElMessage.success(`已将周课表应用到 ${currentMonthLabel.value}`)
}

// Month view navigation
const monthYear = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() + monthOffset.value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})

const dayHeaders = ['日', '一', '二', '三', '四', '五', '六']

const monthCells = computed(() => {
  const base = new Date()
  base.setMonth(base.getMonth() + monthOffset.value)
  const year = base.getFullYear()
  const month = base.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ label: '', date: null, inMonth: false, isWeekend: false, lessons: [], key: `empty-${i}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month, d).getDay()
    cells.push({
      label: d, date, inMonth: true, isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      lessons: monthLessons.value.filter(l => l.day === date).sort((a, b) => a.period - b.period),
      key: date
    })
  }
  return cells
})

function changeMonth(delta) { monthOffset.value += delta }

// Print
function doPrint() {
  printTitle.value = printTitle.value || `${store.schoolName} · ${currentMonthLabel.value} · ${printClass.value}班课表`
  const printSchedules = weeklyScheduleService.getByClass(printClass.value)
  const w = window.open('', '_blank', 'width=1000,height=800')
  if (!w) return

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${printTitle.value}</title>
<style>
body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;margin:20px;color:#2c2416}
h1{text-align:center;font-size:20px;margin-bottom:4px}
.subtitle{text-align:center;font-size:13px;color:#888;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:center;vertical-align:top}
th{background:#f5f0e8;font-weight:600}
.period{background:#faf7f2;font-weight:500;width:80px}
.subject{font-weight:600}
.teacher{font-size:10px;color:#8b5e3c}
.room{font-size:10px;color:#999}
.empty{color:#ddd}
.weekend{background:#fafafa}
@page{size:A4 landscape;margin:12mm}
@media print{body{margin:0}}
${getWatermarkStyle()}
</style></head><body>
<h1>${printTitle.value}</h1>
<div class="subtitle">${printClass.value}班 · 打印日期：${today}</div>
<table><thead><tr><th>节次</th>`
  const weekdays = showWeekend.value ? allWeekdays : allWeekdays.filter(d => d.value <= 5)
  weekdays.forEach(d => { html += `<th>${d.label}</th>` })
  html += '</tr></thead><tbody>'

  periods.forEach(p => {
    html += '<tr>'
    html += `<td class="period">${p.label}<br/><span style="font-size:10px;color:#999">${p.time}</span></td>`
    weekdays.forEach(d => {
      const sched = printSchedules.find(w => w.weekday === d.value && w.period === p.id)
      if (sched) {
        html += `<td><div class="subject">${sched.subject}</div><div class="teacher">${sched.teacher || '—'}</div><div class="room">${sched.room || ''}${sched.location ? ' · ' + sched.location : ''}</div></td>`
      } else {
        html += '<td class="empty">—</td>'
      }
    })
    html += '</tr>'
  })

  html += '</tbody></table>'
  html += getWatermarkHTML()
  html += '</body></html>'
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 500)
}

onMounted(() => {
  loadAll()
  printClass.value = currentClass.value
  printMonth.value = currentMonth.value
})
</script>

<style scoped>
.tt-view-tab { padding: 5px 18px; border: 1px solid var(--admin-border); background: var(--admin-surface); border-radius: 20px; font-size: 12px; cursor: pointer; color: var(--admin-text-muted); transition: all 0.2s; }
.tt-view-tab.active { background: var(--admin-primary); color: #fff; border-color: var(--admin-primary); }

/* Week layout */
.tt-week-layout { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
.tt-teacher-panel { background: var(--admin-bg); border-radius: 10px; padding: 12px; max-height: 520px; overflow-y: auto; }
.tt-panel-title { font-size: 12px; font-weight: 600; color: var(--admin-text); margin-bottom: 10px; }
.tt-teacher-row { padding: 8px 10px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; transition: all 0.15s; border: 1px solid transparent; }
.tt-teacher-row:hover { background: var(--admin-surface-hover); }
.tt-teacher-row.active { background: var(--admin-surface-active); border-color: var(--admin-accent); }
.tt-teacher-name { font-size: 12px; font-weight: 600; color: var(--admin-text); }
.tt-teacher-subjects { font-size: 10px; color: var(--admin-text-muted); margin-top: 2px; }
.tt-teacher-total { font-size: 10px; color: var(--admin-accent); margin-top: 2px; }

/* Week Grid */
.tt-grid-wrap { min-width: 0; overflow-x: auto; }
.tt-grid { min-width: 500px; }
.tt-grid-header { display: grid; grid-template-columns: 90px repeat(7, 1fr); gap: 2px; margin-bottom: 2px; }
.tt-grid-header:has(+ .tt-grid-row .weekend) { /* handled dynamically */ }
.tt-corner { background: var(--admin-bg); padding: 8px; text-align: center; font-size: 11px; color: var(--admin-text-muted); border-radius: 6px; }
.tt-day-header { background: var(--admin-surface-active); padding: 8px; text-align: center; font-size: 13px; font-weight: 600; color: var(--admin-accent); border-radius: 6px; }
.tt-day-header.weekend { background: var(--admin-bg-secondary); color: var(--admin-text-muted); }

.tt-grid-row { display: grid; grid-template-columns: 90px repeat(7, 1fr); gap: 2px; margin-bottom: 2px; }
.tt-period-cell { background: var(--admin-bg); padding: 8px 6px; text-align: center; border-radius: 6px; font-size: 12px; color: var(--admin-text-secondary); }
.tt-period-time { font-size: 10px; color: var(--admin-text-muted); margin-top: 2px; }

.tt-lesson-cell { background: var(--admin-surface-hover); padding: 8px 6px; border-radius: 6px; cursor: pointer; transition: all 0.2s; min-height: 62px; display: flex; flex-direction: column; justify-content: center; }
.tt-lesson-cell:hover { background: var(--admin-surface-active); border: 1px solid var(--admin-border-light); }
.tt-lesson-cell.weekend { background: var(--admin-bg-secondary); opacity: 0.6; }
.tt-lesson-cell.has-lesson { background: var(--admin-surface); border: 1px solid var(--admin-border); }
.tt-lesson-cell.highlighted { border: 2px solid var(--admin-accent); background: rgba(201,160,80,0.08); }
.tt-lesson-cell .tt-cell-subject { font-size: 12px; font-weight: 600; color: var(--admin-text); margin-bottom: 2px; }
.tt-lesson-cell .tt-cell-teacher { font-size: 10px; color: var(--admin-accent); }
.tt-lesson-cell .tt-cell-room { font-size: 10px; color: var(--admin-text-muted); }
.tt-lesson-cell .tt-cell-empty { color: var(--admin-text-muted); font-size: 18px; opacity: 0.3; text-align: center; }

/* Month Calendar */
.tt-month-view { }
.tt-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.tt-cal-header { text-align: center; font-size: 11px; font-weight: 600; color: var(--admin-text-muted); padding: 6px 0; }
.tt-cal-cell { aspect-ratio: 1; background: var(--admin-bg); border-radius: 6px; padding: 4px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.tt-cal-cell:hover { background: var(--admin-border); }
.tt-cal-cell.today { border: 2px solid var(--admin-primary); }
.tt-cal-cell.other { opacity: 0.3; pointer-events: none; }
.tt-cal-cell.weekend { background: var(--admin-bg-secondary); }
.tt-cal-date { font-size: 11px; font-weight: 500; color: var(--admin-text); }
.tt-cal-lessons { display: flex; flex-wrap: wrap; gap: 1px; }
.tt-cal-tag { font-size: 9px; color: #fff; padding: 1px 4px; border-radius: 3px; white-space: nowrap; }

/* Batch grid */
.tt-batch-grid { border: 1px solid var(--admin-border); border-radius: 8px; overflow: hidden; }
.tt-batch-header { display: grid; grid-template-columns: 72px repeat(7, 1fr); background: var(--admin-bg); font-size: 11px; font-weight: 600; color: var(--admin-text-secondary); }
.tt-batch-day { padding: 6px; text-align: center; }
.tt-batch-row { display: grid; grid-template-columns: 72px repeat(7, 1fr); }
.tt-batch-period { padding: 6px; text-align: center; background: var(--admin-bg); font-size: 10px; color: var(--admin-text-muted); border-top: 1px solid var(--admin-border); display: flex; align-items: center; justify-content: center; }
.tt-batch-cell { aspect-ratio: 1; border-top: 1px solid var(--admin-border); border-left: 1px solid var(--admin-border); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
.tt-batch-cell:hover { background: var(--admin-surface-hover); }
.tt-batch-cell.selected { background: var(--admin-primary); color: #fff; }
.tt-batch-cell.selected::after { content: '✓'; font-size: 14px; }
.tt-batch-cell.occupied { background: var(--admin-border); cursor: not-allowed; }
.tt-batch-cell.occupied::after { content: '—'; color: var(--admin-text-muted); font-size: 12px; }

@media (max-width: 768px) {
  .tt-week-layout { grid-template-columns: 1fr; }
  .tt-grid-row, .tt-grid-header { grid-template-columns: 60px repeat(5, 1fr); }
  .tt-lesson-cell { min-height: 46px; padding: 4px; }
}
</style>
