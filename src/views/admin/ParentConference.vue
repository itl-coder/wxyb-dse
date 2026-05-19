<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">👨‍👩‍👧 家长会预约管理</div>
          <div class="admin-card-subtitle">安排家长面谈 · 追踪沟通记录</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-button size="small" type="primary" @click="openBookingDialog(null)">+ 新建预约</el-button>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <button class="pc-tab" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
          待进行 <span class="pc-tab-count">{{ pendingList.length }}</span>
        </button>
        <button class="pc-tab" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">
          已完成 <span class="pc-tab-count">{{ completedList.length }}</span>
        </button>
        <button class="pc-tab" :class="{ active: activeTab === 'calendar' }" @click="activeTab = 'calendar'">
          📅 日历视图
        </button>
      </div>

      <!-- Timeline -->
      <div class="pc-timeline" v-if="activeTab !== 'calendar' && filteredList.length">
        <div v-for="(conf, idx) in filteredList" :key="conf.id" class="pc-timeline-item"
          :class="{ completed: conf.status === 'completed' }">
          <div class="pc-timeline-dot"></div>
          <div v-if="idx < filteredList.length - 1" class="pc-timeline-line"></div>
          <div class="pc-booking-card">
            <div class="pc-card-top">
              <div class="pc-student-info">
                <div class="pc-avatar">{{ conf.studentName?.charAt(0) }}</div>
                <div>
                  <div class="pc-name">{{ conf.studentName }}</div>
                  <div class="pc-class">{{ conf.class }}班</div>
                </div>
              </div>
              <div class="pc-time-badge" :class="{ upcoming: isUpcoming(conf) }">
                {{ conf.time }}
              </div>
            </div>
            <div class="pc-card-meta">
              <span>👥 {{ conf.parentCount }}位家长</span>
              <span v-if="conf.mode === 'online'" class="pc-mode-badge online">💻 线上</span>
              <span v-else class="pc-mode-badge offline">🏫 {{ conf.room || '线下' }}</span>
              <span v-if="conf.meetingId" style="font-size:10px;color:var(--admin-text-muted)">🆔 {{ conf.meetingId
                }}</span>
              <span v-if="conf.saName" class="pc-role-badge">SA {{ conf.saName }}</span>
              <span v-if="conf.ccName" class="pc-role-badge cc">CC {{ conf.ccName }}</span>
            </div>
            <div v-if="conf.notes" class="pc-notes">{{ conf.notes }}</div>
            <div class="pc-card-actions">
              <el-button size="small" text @click="openBookingDialog(conf)">编辑</el-button>
              <el-button v-if="conf.status === 'pending'" size="small" text type="success"
                @click="markComplete(conf)">标记完成</el-button>
              <el-button size="small" text @click="exportBookingImage(conf)">📷 导出</el-button>
              <el-button size="small" text type="danger" @click="deleteBooking(conf)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
      <!-- Calendar View -->
      <div v-if="activeTab === 'calendar'" class="pc-calendar">
        <div class="pc-cal-header">
          <el-button size="small" @click="calMonth--">◀</el-button>
          <span style="font-weight:600;color:var(--admin-text)">{{ calYear }}年{{ calMonth }}月</span>
          <el-button size="small" @click="calMonth++">▶</el-button>
        </div>
        <div class="pc-cal-grid">
          <div class="pc-cal-day-header" v-for="d in ['日', '一', '二', '三', '四', '五', '六']" :key="d">{{ d }}</div>
          <div v-for="(day, i) in calDays" :key="i" class="pc-cal-day"
            :class="{ 'has-booking': day.bookings.length, 'is-today': day.isToday, 'is-other-month': !day.inMonth }"
            @click="day.bookings.length && showDayBookings(day)">
            <span class="pc-cal-num">{{ day.num }}</span>
            <div v-if="day.bookings.length" class="pc-cal-blocks">
              <div v-for="b in day.bookings.slice(0, 3)" :key="b.id" class="pc-cal-block"
                :class="{ completed: b.status === 'completed', online: b.mode === 'online' }"
                :title="`${b.studentName} · ${b.time?.slice(11, 16)} · ${b.parentCount}位家长`"
                @click.stop="openBookingDialog(b)">
                {{ b.studentName?.charAt(0) }}{{ b.time?.slice(11, 13) }}
              </div>
              <div v-if="day.bookings.length > 3" class="pc-cal-more" @click.stop="showDayBookings(day)">+{{
                day.bookings.length - 3 }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab !== 'calendar' && !filteredList.length" class="ph-empty">{{ activeTab === 'pending' ?
        '暂无待进行的家长会预约' : '暂无已完成的家长会记录' }}</div>
    </div>

    <!-- Booking Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑预约' : '新建家长会预约'" width="520px">
      <div class="admin-form-group">
        <label>学生 <span style="color:var(--admin-danger)">*</span></label>
        <el-select v-model="form.studentId" style="width:100%" filterable @change="onStudentSelect">
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>日期时间 <span style="color:var(--admin-danger)">*</span></label>
          <el-date-picker v-model="form.time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择日期时间"
            style="width:100%" />
        </div>
        <div class="admin-form-group">
          <label>家长人数</label>
          <el-input-number v-model="form.parentCount" :min="1" :max="4" size="small" style="width:100%" />
        </div>
        <div class="admin-form-group">
          <label>方式</label>
          <el-select v-model="form.mode" size="small" style="width:100%">
            <el-option label="🏫 线下" value="offline" />
            <el-option label="💻 线上" value="online" />
          </el-select>
        </div>
      </div>
      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>SA 参与</label>
          <el-switch v-model="form.saAttend" />
        </div>
        <div class="admin-form-group">
          <label>CC 参与</label>
          <el-switch v-model="form.ccAttend" />
        </div>
        <div class="admin-form-group">
          <label>教室</label>
          <el-select v-model="form.room" size="small" style="width:100%" :disabled="form.mode === 'online'">
            <el-option v-for="r in roomOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </div>
      </div>
      <div v-if="form.mode === 'online'" class="admin-form-group">
        <label>线上会议ID</label>
        <el-input v-model="form.meetingId" placeholder="如：Zoom 123 456 789 / 腾讯会议 987-654-321" />
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>SA 姓名</label>
          <el-input v-model="form.saName" placeholder="SA/学习顾问姓名" />
        </div>
        <div class="admin-form-group">
          <label>CC 姓名</label>
          <el-input v-model="form.ccName" placeholder="CC/班主任姓名" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>备注</label>
        <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="沟通要点、关注事项..." />
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBooking">{{ editingId ? '保存修改' : '创建预约' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parentConferenceService, studentService } from '@/services/dataService'
import { getPrintWatermarkHTML, getPrintWatermarkStyle } from '@/utils/printTemplate'

const bookings = ref([])
const studentList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const activeTab = ref('pending')

const roomOptions = ['教学楼302会议室', '教学楼305小会议室', '行政楼101接待室', '在线会议室']

const form = ref({
  studentId: null, studentName: '', class: '', time: '', parentCount: 2,
  saAttend: false, ccAttend: false, mode: 'offline', room: '教学楼302会议室',
  meetingId: '', saName: '', ccName: '', notes: ''
})

onMounted(() => {
  studentList.value = studentService.getAll()
  bookings.value = parentConferenceService.getAll()
})

const pendingList = computed(() => bookings.value.filter(b => b.status === 'pending').sort((a, b) => a.time.localeCompare(b.time)))
const completedList = computed(() => bookings.value.filter(b => b.status === 'completed').sort((a, b) => b.time.localeCompare(a.time)))
const filteredList = computed(() => activeTab.value === 'pending' ? pendingList.value : completedList.value)

function isUpcoming(conf) {
  return conf.status === 'pending' && new Date(conf.time) > new Date()
}

function onStudentSelect() {
  const s = studentList.value.find(s => s.id === form.value.studentId)
  if (s) { form.value.studentName = s.name; form.value.class = s.class }
}

function openBookingDialog(conf) {
  if (conf) {
    editingId.value = conf.id
    form.value = { ...conf, studentId: conf.studentId, meetingId: conf.meetingId || '', saName: conf.saName || '', ccName: conf.ccName || '' }
  } else {
    editingId.value = null
    form.value = { studentId: null, studentName: '', class: '', time: '', parentCount: 2, saAttend: false, ccAttend: false, mode: 'offline', room: '教学楼302会议室', meetingId: '', saName: '', ccName: '', notes: '' }
  }
  dialogVisible.value = true
}

function saveBooking() {
  if (!form.value.studentId) { ElMessage.warning('请选择学生'); return }
  if (!form.value.time) { ElMessage.warning('请选择日期时间'); return }
  const data = {
    ...form.value,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0]
  }
  if (editingId.value) {
    parentConferenceService.update(editingId.value, data)
    ElMessage.success('已更新')
  } else {
    parentConferenceService.create(data)
    ElMessage.success('预约已创建')
  }
  dialogVisible.value = false
  bookings.value = parentConferenceService.getAll()
}

function markComplete(conf) {
  parentConferenceService.update(conf.id, { status: 'completed' })
  bookings.value = parentConferenceService.getAll()
  ElMessage.success('已标记为完成')
}

async function deleteBooking(conf) {
  try {
    await ElMessageBox.confirm(`确定删除「${conf.studentName}」的家长会预约吗？`, '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    parentConferenceService.delete(conf.id)
    bookings.value = parentConferenceService.getAll()
    ElMessage.success('已删除')
  } catch { }
}

// Calendar
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth() + 1)

const calDays = computed(() => {
  const year = calYear.value
  const month = calMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const startDow = firstDay.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]
  const days = []

  for (let i = startDow - 1; i >= 0; i--) {
    days.push({ num: daysInPrevMonth - i, inMonth: false, isToday: false, bookings: [] })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayBookings = bookings.value.filter(b => b.time && b.time.startsWith(dateStr))
    days.push({ num: d, inMonth: true, isToday: dateStr === today, bookings: dayBookings })
  }
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ num: d, inMonth: false, isToday: false, bookings: [] })
    }
  }
  return days
})

function showDayBookings(day) {
  if (!day.bookings.length) return
  activeTab.value = day.bookings.some(b => b.status === 'completed') ? 'completed' : 'pending'
  // Show all bookings for this day in the timeline view
  ElMessage.info(`${day.num}日共 ${day.bookings.length} 条预约，已切换到列表视图`)
}

function exportBookingImage(conf) {
  const modeLabel = conf.mode === 'online' ? `💻 线上${conf.meetingId ? ' · ' + conf.meetingId : ''}` : `🏫 ${conf.room || '线下'}`
  const saLabel = conf.saName ? `SA: ${conf.saName}` : ''
  const ccLabel = conf.ccName ? `CC: ${conf.ccName}` : ''
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>家长会预约</title><style>
    @page { size: A4 portrait; margin: 20mm; }
    body { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: #2c2c2c; text-align: center; }
    .card { border: 3px double #8b5e3c; border-radius: 16px; padding: 32px; max-width: 420px; margin: 40px auto; }
    .card h2 { font-size: 20px; color: #4a2c17; margin: 0 0 4px; }
    .card .sub { font-size: 12px; color: #888; margin-bottom: 20px; }
    .card .info { text-align: left; font-size: 14px; line-height: 2.4; }
    .card .info b { color: #4a2c17; }
    .card .footer { margin-top: 24px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
    ${getPrintWatermarkStyle()}
  </style></head><body>
  <div class="card">
    <h2>📋 威学一百 · 家长会预约凭证</h2>
    <div class="sub">Parent-Teacher Conference Appointment</div>
    <div class="info">
      <p><b>学生：</b>${conf.studentName} · ${conf.class}班</p>
      <p><b>时间：</b>${conf.time}</p>
      <p><b>家长人数：</b>${conf.parentCount}位</p>
      <p><b>方式：</b>${modeLabel}</p>
      ${saLabel ? `<p><b>SA：</b>${conf.saName}</p>` : ''}
      ${ccLabel ? `<p><b>CC：</b>${conf.ccName}</p>` : ''}
      ${conf.notes ? `<p><b>备注：</b>${conf.notes}</p>` : ''}
    </div>
    <div class="footer">威学一百 DSE AI 智能学情分析 · ${new Date().toISOString().split('T')[0]}</div>
  </div>
  ${getPrintWatermarkHTML()}
  </body></html>`
  const w = window.open('', '_blank', 'width=500,height=700')
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 300)
}
</script>

<style scoped>
.pc-tab {
  padding: 5px 16px;
  border: 1px solid var(--admin-border);
  background: var(--admin-surface);
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  color: var(--admin-text-muted);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pc-tab.active {
  background: var(--admin-primary);
  color: #fff;
  border-color: var(--admin-primary);
}

.pc-tab-count {
  font-size: 10px;
  opacity: 0.7;
}

.ph-empty {
  font-size: 12px;
  color: var(--admin-text-muted);
  padding: 30px 0;
  text-align: center;
}

.pc-timeline {
  position: relative;
  padding-left: 28px;
}

.pc-timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.pc-timeline-dot {
  position: absolute;
  left: -28px;
  top: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--admin-primary);
  border: 2px solid var(--admin-bg);
  z-index: 1;
}

.pc-timeline-item.completed .pc-timeline-dot {
  background: var(--admin-text-muted);
}

.pc-timeline-line {
  position: absolute;
  left: -23px;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: var(--admin-border);
}

.pc-booking-card {
  background: var(--admin-bg);
  border-radius: 10px;
  padding: 14px;
  border: 1px solid var(--admin-border);
}

.pc-timeline-item.completed .pc-booking-card {
  opacity: 0.6;
  filter: grayscale(30%);
}

.pc-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.pc-student-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pc-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--admin-accent);
  color: #1a2e3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.pc-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.pc-class {
  font-size: 11px;
  color: var(--admin-text-muted);
}

.pc-time-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 6px;
  background: var(--admin-bg);
  color: var(--admin-text-muted);
  white-space: nowrap;
}

.pc-time-badge.upcoming {
  background: #e8f5e9;
  color: #2e7d32;
  font-weight: 500;
}

.pc-card-meta {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--admin-text-muted);
  margin-bottom: 6px;
  align-items: center;
}

.pc-mode-badge {
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 10px;
}

.pc-mode-badge.online {
  background: #e3f2fd;
  color: #1565c0;
}

.pc-mode-badge.offline {
  background: #fff3e0;
  color: #e65100;
}

.pc-role-badge {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  background: var(--admin-primary);
  color: #fff;
}

.pc-role-badge.cc {
  background: var(--admin-accent);
  color: #1a2e3c;
}

.pc-notes {
  font-size: 11px;
  color: var(--admin-text-muted);
  line-height: 1.5;
  margin-bottom: 6px;
}

.pc-card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* Calendar */
.pc-calendar {
  margin-top: 8px;
}

.pc-cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 14px;
}

.pc-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.pc-cal-day-header {
  text-align: center;
  font-size: 11px;
  color: var(--admin-text-muted);
  font-weight: 600;
  padding: 8px 0;
}

.pc-cal-day {
  border-radius: 8px;
  background: var(--admin-bg);
  padding: 6px;
  cursor: default;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid transparent;
  transition: all 0.2s;
  min-height: 80px;
}

.pc-cal-day:hover {
  border-color: var(--admin-border);
}

.pc-cal-day.is-other-month {
  opacity: 0.35;
}

.pc-cal-day.is-today {
  border-color: var(--admin-accent);
  background: var(--admin-surface-hover);
}

.pc-cal-day.has-booking {
  background: rgba(59, 130, 246, 0.05);
}

.pc-cal-num {
  font-size: 13px;
  color: var(--admin-text-secondary);
  font-weight: 500;
  margin-bottom: 4px;
  align-self: flex-start;
}

.pc-cal-day.is-today .pc-cal-num {
  color: var(--admin-accent);
  font-weight: 700;
}

.pc-cal-blocks {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.pc-cal-block {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  cursor: pointer;
  background: rgba(59, 130, 246, 0.15);
  color: var(--admin-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  transition: background 0.15s;
}

.pc-cal-block:hover {
  background: rgba(59, 130, 246, 0.3);
}

.pc-cal-block.completed {
  background: rgba(100, 180, 100, 0.15);
  color: var(--admin-success);
}

.pc-cal-block.online {
  background: rgba(6, 182, 212, 0.15);
  color: var(--admin-info);
}

.pc-cal-more {
  font-size: 8px;
  color: var(--admin-text-muted);
  cursor: pointer;
  text-align: center;
  padding: 1px 0;
}

.pc-cal-more:hover {
  color: var(--admin-accent);
}
</style>
