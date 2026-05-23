<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">✓ 考勤与请假管理</div>
          <div class="admin-card-subtitle">班级批量签到 · 请假审批 · 异常预警 · 数据看板</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-select v-model="filterClass" size="small" placeholder="班级" style="width:100px" clearable>
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-date-picker v-model="selectedDate" size="small" type="date" style="width:140px" />
          <el-button size="small" type="primary" @click="openBatchDialog">📋 批量记录</el-button>
          <el-button size="small" @click="openDialog(null)">+ 单个记录</el-button>
        </div>
      </div>

      <!-- Stats Dashboard -->
      <div class="att-dashboard">
        <div class="att-dash-card" v-for="s in overviewStats" :key="s.label" :style="{borderTopColor: s.color}">
          <div class="att-dash-val" :style="{color: s.color}">
            {{ s.value }}
            <span v-if="s.diff !== 0" class="att-dash-diff" :class="s.diff > 0 ? 'up' : 'down'">{{ s.diff > 0 ? '↑' : '↓' }}{{ Math.abs(s.diff) }}%</span>
          </div>
          <div class="att-dash-label">{{ s.label }}</div>
          <div class="att-dash-sub">{{ s.sub }}</div>
        </div>
      </div>

      <!-- Class Attendance Rate Chart -->
      <div class="att-chart-section" v-if="classStats.length">
        <div class="admin-card-title" style="font-size:13px;margin-bottom:10px">📊 各班出勤率</div>
        <div class="att-chart-grid">
          <div v-for="c in classStats" :key="c.class" class="att-chart-item">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:12px;font-weight:500;color:var(--admin-text)">{{ c.class }}</span>
              <span style="font-size:11px;" :style="{color: c.rate >= 95 ? 'var(--admin-success)' : c.rate >= 85 ? 'var(--admin-warning)' : 'var(--admin-danger)'}">{{ c.rate }}%</span>
            </div>
            <div class="att-bar-bg"><div class="att-bar-fill" :style="{width:c.rate+'%',background:c.rate>=95?'var(--admin-success)':c.rate>=85?'var(--admin-warning)':'var(--admin-danger)'}"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--admin-text-muted);margin-top:2px">
              <span>正常 {{ c.normal }}</span><span>异常 {{ c.abnormal }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Records Table -->
      <el-table
        :data="paginatedAttendance"
        stripe
        size="small"
        style="width:100%;margin-top:12px"
        @selection-change="(rows) => selectedIds = rows.map(r => r.id)"
        row-key="id"
        :row-class-name="({ row }) => selectedIds.includes(row.id) ? 'row-selected' : consecutiveLateStudents.includes(row.studentId) ? 'row-late-warn' : ''"
      >
        <el-table-column type="selection" width="40" />
        <el-table-column prop="studentName" label="学生" fixed>
          <template #default="{ row }">
            <span style="color:var(--admin-text);font-weight:500">{{ row.studentName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="class" label="班级" />
        <el-table-column prop="date" label="日期" />
        <el-table-column label="到校时间">
          <template #default="{ row }">
            {{ row.status === '正常' ? row.arrivalTime : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <span class="admin-tag" :class="statusTag(row.status)">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="请假类型">
          <template #default="{ row }">
            {{ row.reason || '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.remark || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button size="small" text @click="openDialog(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;gap:6px">
          <el-button size="small" type="success" @click="batchSetStatus('正常')" :disabled="selectedIds.length===0">批量正常</el-button>
          <el-button size="small" type="warning" @click="batchSetStatus('迟到')" :disabled="selectedIds.length===0">批量迟到</el-button>
          <el-button size="small" type="info" @click="batchSetStatus('请假')" :disabled="selectedIds.length===0">批量请假</el-button>
          <el-button size="small" type="danger" @click="batchDelete" :disabled="selectedIds.length===0">批量删除</el-button>
        </div>
        <span style="font-size:11px;color:var(--admin-text-muted)">共 {{ totalFiltered }} 条记录</span>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,15,20,50]" :total="totalFiltered" layout="total, sizes, prev, pager, next, jumper" size="small" background />
      </div>
    </div>

    <!-- Individual Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑考勤记录' : '记录考勤'" width="480px">
      <div class="admin-form-group">
        <label>学生</label>
        <el-select v-model="form.studentId" style="width:100%" filterable @change="onStudentSelect">
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>日期</label>
          <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </div>
        <div class="admin-form-group">
          <label>状态</label>
          <el-select v-model="form.status" style="width:100%">
            <el-option label="正常" value="正常" />
            <el-option label="迟到" value="迟到" />
            <el-option label="请假" value="请假" />
            <el-option label="缺勤" value="缺勤" />
          </el-select>
        </div>
      </div>
      <div class="admin-form-group" v-if="form.status === '正常' || form.status === '迟到'">
        <label>到校时间</label>
        <el-time-picker v-model="form.arrivalTime" value-format="HH:mm" style="width:100%" />
      </div>
      <div class="admin-form-group" v-if="form.status === '请假'">
        <label>请假原因</label>
        <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="请假原因..." />
      </div>
      <div class="admin-form-group">
        <label>备注</label>
        <el-input v-model="form.remark" placeholder="备选备注" />
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">{{ editingId ? '保存修改' : '添加记录' }}</el-button>
      </template>
    </el-dialog>

    <!-- Batch Class Dialog -->
    <el-dialog v-model="batchDialogVisible" title="📋 批量记录考勤" width="700px" :close-on-click-modal="false">
      <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;align-items:flex-end">
        <div class="admin-form-group" style="margin-bottom:0">
          <label>选择班级</label>
          <el-select v-model="batchClass" size="small" style="width:110px" @change="loadBatchStudents">
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="admin-form-group" style="margin-bottom:0">
          <label>日期</label>
          <el-date-picker v-model="batchDate" size="small" type="date" value-format="YYYY-MM-DD" style="width:140px" />
        </div>
        <el-button size="small" type="success" @click="batchSetAll('正常')">全部正常</el-button>
        <el-button size="small" type="warning" @click="batchSetAll('迟到')">全部迟到</el-button>
        <el-button size="small" type="info" @click="copyFromPrevDay" :disabled="!prevDayRecords.length">从上一日复制</el-button>
        <span style="font-size:11px;color:var(--admin-text-muted)">{{ batchStudents.length }} 名学生</span>
      </div>
      <el-table :data="batchStudents" stripe size="small" max-height="380" style="width:100%">
        <el-table-column label="姓名" fixed>
          <template #default="{ row }">
            <span style="color:var(--admin-text);font-weight:500">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-select v-model="row.status" size="small" style="width:100px">
              <el-option label="正常" value="正常" />
              <el-option label="迟到" value="迟到" />
              <el-option label="请假" value="请假" />
              <el-option label="缺勤" value="缺勤" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="到校时间" width="120">
          <template #default="{ row }">
            <el-input v-model="row.arrivalTime" size="small" style="width:100px" placeholder="07:50" :disabled="row.status !== '正常' && row.status !== '迟到'" />
          </template>
        </el-table-column>
        <el-table-column label="请假原因" min-width="140">
          <template #default="{ row }">
            <el-input v-model="row.reason" size="small" placeholder="原因" :disabled="row.status !== '请假'" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.remark" size="small" placeholder="备注" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatch">保存全部 ({{ batchStudents.length }} 条)</el-button>
      </template>
    </el-dialog>
  </div>
</template>

/**
 * 页面：考勤与请假管理
 * 功能：班级批量签到、请假审批、异常预警与出勤数据看板
 * 路由：/admin/attendance
 */
<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { attendanceService, studentService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { useScopedData } from '@/composables/useScopedData'
const store = useAppStore()
const { filterByScope } = useScopedData()

const attendance = ref([])
const studentList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const filterClass = ref('')
const selectedDate = ref(new Date())
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(15)
const batchDialogVisible = ref(false)
const batchClass = ref('')
const batchDate = ref(new Date().toISOString().split('T')[0])
const batchStudents = ref([])

const classList = computed(() => studentService.getClasses())

const form = ref({
  studentId: null, studentName: '', class: '', date: new Date().toISOString().split('T')[0],
  status: '正常', arrivalTime: '07:50', reason: '', remark: ''
})

onMounted(() => {
  studentList.value = filterByScope(studentService.getAll(), store.currentRole?.dataScope)
  attendance.value = filterByScope(attendanceService.getAll(), store.currentRole?.dataScope)
})

const filteredAttendance = computed(() => {
  let list = attendance.value
  if (filterClass.value) list = list.filter(a => a.class === filterClass.value)
  return list.sort((a, b) => b.date.localeCompare(a.date))
})

const totalFiltered = computed(() => filteredAttendance.value.length)

const paginatedAttendance = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredAttendance.value.slice(start, start + pageSize.value)
})

const overviewStats = computed(() => {
  const list = filteredAttendance.value
  const total = list.length || 1
  const yesterday = getYesterday()
  const prevList = attendance.value.filter(a => a.date === yesterday)
  const prevTotal = prevList.length || 1

  const normalCount = list.filter(a => a.status === '正常').length
  const lateCount = list.filter(a => a.status === '迟到').length
  const leaveCount = list.filter(a => a.status === '请假').length
  const absentCount = list.filter(a => a.status === '缺勤').length

  const prevNormal = prevList.filter(a => a.status === '正常').length
  const prevLate = prevList.filter(a => a.status === '迟到').length

  const normalDiff = prevTotal > 1 ? Math.round((normalCount/total - prevNormal/prevTotal) * 100) : 0
  const lateDiff = prevTotal > 1 ? Math.round((lateCount/total - prevLate/prevTotal) * 100) : 0

  return [
    { label: '正常到校', value: normalCount, color: 'var(--admin-success)', sub: Math.round(normalCount / total * 100) + '%', diff: normalDiff },
    { label: '迟到', value: lateCount, color: 'var(--admin-warning)', sub: Math.round(lateCount / total * 100) + '%', diff: lateDiff },
    { label: '请假', value: leaveCount, color: 'var(--admin-primary)', sub: Math.round(leaveCount / total * 100) + '%', diff: 0 },
    { label: '缺勤', value: absentCount, color: 'var(--admin-danger)', sub: Math.round(absentCount / total * 100) + '%', diff: 0 }
  ]
})

function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

const classStats = computed(() => {
  const classes = classList.value
  return classes.map(cls => {
    const recs = attendance.value.filter(a => a.class === cls)
    const normal = recs.filter(a => a.status === '正常').length
    const total = recs.length || 1
    return { class: cls, normal, abnormal: total - normal, rate: Math.round(normal / total * 100) }
  }).sort((a, b) => b.rate - a.rate)
})

function statusTag(s) {
  return { '正常': 'success', '迟到': 'warning', '请假': 'info', '缺勤': 'danger' }[s] || 'info'
}

function onStudentSelect() {
  const s = studentList.value.find(s => s.id === form.value.studentId)
  if (s) { form.value.studentName = s.name; form.value.class = s.class }
}

function openDialog(record) {
  if (record) {
    editingId.value = record.id
    form.value = { ...record, studentId: record.studentId }
  } else {
    editingId.value = null
    form.value = {
      studentId: null, studentName: '', class: '', date: new Date().toISOString().split('T')[0],
      status: '正常', arrivalTime: '07:50', reason: '', remark: ''
    }
  }
  dialogVisible.value = true
}

function saveRecord() {
  if (!form.value.studentId) { ElMessage.warning('请选择学生'); return }
  const data = { ...form.value }
  if (editingId.value) {
    attendanceService.update(editingId.value, data)
    ElMessage.success('记录已更新')
  } else {
    attendanceService.create(data)
    ElMessage.success('记录已添加')
  }
  dialogVisible.value = false
  attendance.value = attendanceService.getAll()
}

async function handleDelete(record) {
  try {
    await ElMessageBox.confirm('确定删除此考勤记录吗？', '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    attendanceService.delete(record.id)
    attendance.value = attendanceService.getAll()
    selectedIds.value = selectedIds.value.filter(id => id !== record.id)
    ElMessage.success('已删除')
  } catch {}
}

const allSelected = computed(() => {
  return paginatedAttendance.value.length > 0 && selectedIds.value.length === paginatedAttendance.value.length
})

function toggleAll(e) {
  if (e.target.checked) {
    selectedIds.value = paginatedAttendance.value.map(a => a.id)
  } else {
    selectedIds.value = []
  }
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function batchSetStatus(status) {
  if (selectedIds.value.length === 0) { ElMessage.warning('请先勾选记录'); return }
  selectedIds.value.forEach(id => {
    const update = { status }
    if (status === '正常') update.arrivalTime = '07:50'
    if (status === '请假') update.arrivalTime = ''
    attendanceService.update(id, update)
  })
  attendance.value = attendanceService.getAll()
  ElMessage.success(`已将 ${selectedIds.value.length} 条记录状态更新为「${status}」`)
  selectedIds.value = []
}

async function batchDelete() {
  if (selectedIds.value.length === 0) { ElMessage.warning('请先勾选记录'); return }
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条考勤记录吗？`, '批量删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    selectedIds.value.forEach(id => attendanceService.delete(id))
    attendance.value = attendanceService.getAll()
    ElMessage.success(`已删除 ${selectedIds.value.length} 条记录`)
    selectedIds.value = []
  } catch {}
}

// Batch class recording
function openBatchDialog() {
  batchClass.value = filterClass.value || classList.value[0] || ''
  batchDate.value = new Date().toISOString().split('T')[0]
  loadBatchStudents()
  batchDialogVisible.value = true
}

function loadBatchStudents() {
  if (!batchClass.value) { batchStudents.value = []; return }
  const students = studentService.getAll().filter(s => s.class === batchClass.value)
  batchStudents.value = students.map(s => ({
    studentId: s.id, name: s.name, class: s.class, status: '正常', arrivalTime: '07:50', reason: '', remark: ''
  }))
}

function batchSetAll(status) {
  batchStudents.value.forEach(bs => {
    bs.status = status
    if (status === '正常') bs.arrivalTime = '07:50'
    if (status === '迟到') bs.arrivalTime = '08:00'
    if (status === '请假') bs.arrivalTime = ''
    if (status === '缺勤') bs.arrivalTime = ''
  })
}

// Previous day records for quick copy
const prevDayRecords = computed(() => {
  return attendance.value.filter(a => a.date === getYesterday() && a.class === batchClass.value)
})

function copyFromPrevDay() {
  if (prevDayRecords.value.length === 0) { ElMessage.warning('上一日无考勤记录'); return }
  batchStudents.value.forEach(bs => {
    const prev = prevDayRecords.value.find(r => r.studentId === bs.studentId)
    if (prev) {
      bs.status = prev.status
      bs.arrivalTime = prev.arrivalTime || ''
      bs.reason = prev.reason || ''
      bs.remark = prev.remark || ''
    }
  })
  ElMessage.success(`已从 ${getYesterday()} 复制考勤状态`)
}

function saveBatch() {
  if (batchStudents.value.length === 0) { ElMessage.warning('没有学生数据'); return }
  let created = 0
  let updated = 0
  batchStudents.value.forEach(bs => {
    // Upsert: check for existing record on same date
    const existing = attendance.value.find(a =>
      a.studentId === bs.studentId && a.date === batchDate.value
    )
    const data = {
      studentId: bs.studentId, studentName: bs.name, class: bs.class,
      date: batchDate.value, status: bs.status,
      arrivalTime: bs.arrivalTime, reason: bs.reason, remark: bs.remark
    }
    if (existing) {
      attendanceService.update(existing.id, data)
      updated++
    } else {
      attendanceService.create(data)
      created++
    }
  })
  attendance.value = attendanceService.getAll()
  batchDialogVisible.value = false
  ElMessage.success(`已为 ${batchClass.value} 班新增 ${created} 条、更新 ${updated} 条考勤记录`)
}

// Consecutive late detection
const consecutiveLateStudents = computed(() => {
  const students = studentService.getAll()
  const records = attendance.value
  return students.filter(s => {
    const studentRecords = records
      .filter(r => r.studentId === s.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    let streak = 0
    for (const r of studentRecords) {
      if (r.status === '迟到') { streak++ }
      else break
    }
    return streak >= 3
  }).map(s => s.id)
})
</script>

<style scoped>
.att-dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}
.att-dash-card {
  background: var(--admin-bg);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  border-top: 3px solid var(--admin-border);
}
.att-dash-val { font-size: 26px; font-weight: 700; }
.att-dash-label { font-size: 11px; color: var(--admin-text-secondary); margin-top: 2px; }
.att-dash-sub { font-size: 10px; color: var(--admin-text-muted); margin-top: 1px; }

.att-chart-section { margin-bottom: 8px; }
.att-chart-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
.att-chart-item { background: var(--admin-bg); border-radius: 8px; padding: 10px 12px; }
.att-bar-bg { height: 6px; background: var(--admin-border); border-radius: 3px; overflow: hidden; }
.att-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }

.batch-student-table { max-height: 400px; overflow-y: auto; }
.batch-student-table table th { position: sticky; top: 0; background: var(--admin-surface-active); z-index: 1; }

.row-selected td { background: rgba(201,160,80,0.08) !important; }
.row-late-warn td { background: rgba(239,68,68,0.06) !important; border-left: 3px solid var(--admin-danger); }
.att-dash-diff { font-size: 11px; margin-left: 4px; font-weight: 500; }
.att-dash-diff.up { color: var(--admin-success); }
.att-dash-diff.down { color: var(--admin-danger); }

@media (max-width: 768px) {
  .att-dashboard { grid-template-columns: repeat(2, 1fr); }
  .att-chart-grid { grid-template-columns: 1fr; }
}
</style>
