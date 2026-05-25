<template>
  <div>
    <div class="admin-card">
      <!-- Header -->
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">家长会预约管理</div>
          <div class="admin-card-subtitle">安排家长面谈 · 追踪沟通记录 · 按预约时间顺序排列</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-button size="small" @click="refreshData">刷新</el-button>
          <el-button size="small" type="primary" @click="openBookingDialog(null)">+ 新建预约</el-button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="pc-stats">
        <div class="pc-stat-item">
          <span class="pc-stat-num">{{ todayCount }}</span>
          <span class="pc-stat-label">今日预约</span>
        </div>
        <div class="pc-stat-item">
          <span class="pc-stat-num">{{ weekCount }}</span>
          <span class="pc-stat-label">本周预约</span>
        </div>
        <div class="pc-stat-item warn">
          <span class="pc-stat-num">{{ pendingList.length }}</span>
          <span class="pc-stat-label">待进行</span>
        </div>
        <div class="pc-stat-item done">
          <span class="pc-stat-num">{{ completedList.length }}</span>
          <span class="pc-stat-label">已完成</span>
        </div>
        <div class="pc-stat-item online">
          <span class="pc-stat-num">{{ onlineCount }}</span>
          <span class="pc-stat-label">线上</span>
        </div>
        <div class="pc-stat-item offline">
          <span class="pc-stat-num">{{ offlineCount }}</span>
          <span class="pc-stat-label">线下</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="pc-filters">
        <div class="pc-filter-row">
          <div class="pc-filter-group">
            <label>班级</label>
            <select v-model="filterClass" class="pc-select" @change="applyFilters">
              <option value="">全部班级</option>
              <option v-for="c in classOptions" :key="c" :value="c">{{ c }}班</option>
            </select>
          </div>
          <div class="pc-filter-group">
            <label>方式</label>
            <select v-model="filterMode" class="pc-select" @change="applyFilters">
              <option value="">全部方式</option>
              <option value="offline">线下</option>
              <option value="online">线上</option>
            </select>
          </div>
          <div class="pc-filter-group">
            <label>搜索</label>
            <input v-model="filterSearch" class="pc-search" placeholder="学生姓名..." @input="applyFilters" />
          </div>
          <button class="pc-filter-clear" v-if="hasFilters" @click="clearFilters">清除筛选</button>
        </div>
      </div>

      <!-- Summary info -->
      <div class="pc-summary-text" v-if="activeTab !== 'calendar' && filteredList.length">
        共 <b>{{ filteredList.length }}</b> 条{{ activeTab === 'pending' ? '待进行' : '已完成' }}预约，按时间{{ activeTab === 'pending' ? '从近到远' : '从新到旧' }}排列
      </div>

      <!-- Tabs -->
      <div class="pc-tabs">
        <button class="pc-tab" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
          待进行 <span class="pc-tab-count">{{ pendingList.length }}</span>
        </button>
        <button class="pc-tab" :class="{ active: activeTab === 'completed' }" @click="activeTab = 'completed'">
          已完成 <span class="pc-tab-count">{{ completedList.length }}</span>
        </button>
        <button class="pc-tab" :class="{ active: activeTab === 'calendar' }" @click="activeTab = 'calendar'">
          日历视图
        </button>
      </div>

      <!-- Timeline -->
      <div class="pc-timeline" v-if="activeTab !== 'calendar' && filteredList.length">
        <div v-for="(conf, idx) in filteredList" :key="conf.id" class="pc-timeline-item"
          :class="{ completed: conf.status === 'completed' }">
          <div class="pc-timeline-dot" :class="{ priority: conf.priority === 'urgent' }"></div>
          <div v-if="idx < filteredList.length - 1" class="pc-timeline-line"></div>
          <div class="pc-booking-card">
            <!-- Top: Student + Time -->
            <div class="pc-card-top">
              <div class="pc-student-info">
                <div class="pc-avatar" :style="{ background: avatarColor(conf.studentName) }">{{ conf.studentName?.charAt(0) }}</div>
                <div>
                  <div class="pc-name">
                    {{ conf.studentName }}
                    <span class="pc-priority" :class="conf.priority === 'urgent' ? 'is-priority' : 'is-normal'">{{ conf.priority === 'urgent' ? '优先' : '普通' }}</span>
                  </div>
                  <div class="pc-class">{{ conf.class }}班</div>
                </div>
              </div>
              <div class="pc-time-block">
                <div class="pc-time-main">{{ formatDate(conf.time) }}</div>
                <div class="pc-time-sub">{{ formatTime(conf.time) }} · {{ conf.duration || 30 }}分钟</div>
              </div>
            </div>

            <!-- Meta Row: mode + location + meeting ID -->
            <div class="pc-card-meta">
              <span class="pc-meta-tag" :class="conf.mode">
                {{ conf.mode === 'online' ? '💻 线上会议' : '🏫 线下见面' }}
              </span>
              <span v-if="conf.mode === 'offline'" class="pc-meta-detail">
                📍 {{ conf.room || '待定教室' }}
              </span>
              <span v-if="conf.mode === 'online' && conf.meetingId" class="pc-meta-detail">
                🔗 腾讯会议 {{ conf.meetingId }}
              </span>
            </div>

            <!-- Parent & Staff Row -->
            <div class="pc-card-info-grid">
              <div class="pc-info-cell">
                <span class="pc-info-icon">👥</span>
                <span>{{ conf.parentCount }}位家长</span>
                <span v-if="conf.parentName" class="pc-info-extra">· {{ conf.parentName }}</span>
                <span v-if="conf.parentPhone" class="pc-info-extra">· {{ conf.parentPhone }}</span>
              </div>
              <div class="pc-info-cell" v-if="conf.subject || conf.teacherName">
                <span class="pc-info-icon">📚</span>
                <span>{{ conf.subject || '学科老师' }}</span>
                <span v-if="conf.teacherName" class="pc-info-extra">· {{ conf.teacherName }}</span>
              </div>
              <div class="pc-info-cell" v-if="conf.saName">
                <span class="pc-info-tag sa">SA</span>
                <span>{{ conf.saName }}</span>
              </div>
              <div class="pc-info-cell" v-if="conf.ccName">
                <span class="pc-info-tag cc">CC</span>
                <span>{{ conf.ccName }}</span>
              </div>
            </div>

            <!-- Follow-up status bar -->
            <div class="pc-followup-row">
              <span class="pc-followup-dot" :class="{ done: conf.followUpStatus === 'done' }"></span>
              <span class="pc-followup-text">{{ conf.followUpStatus === 'done' ? '已跟进' : '待跟进' }}</span>
              <span v-if="conf.reminded" class="pc-reminded">已提醒</span>
              <span v-else class="pc-reminded not">未提醒</span>
            </div>

            <!-- Agenda / Notes -->
            <div v-if="conf.agenda" class="pc-agenda">
              <div class="pc-agenda-title">📋 会议议题</div>
              <div class="pc-agenda-text">{{ conf.agenda }}</div>
            </div>
            <div v-if="conf.notes" class="pc-notes">
              <span class="pc-notes-label">备注：</span>{{ conf.notes }}
            </div>

            <!-- Completion notes -->
            <div v-if="conf.status === 'completed' && conf.completionNotes" class="pc-completion">
              <span class="pc-completion-label">会议纪要：</span>{{ conf.completionNotes }}
            </div>

            <!-- Actions -->
            <div class="pc-card-actions">
              <el-button size="small" text @click="sendReminder(conf)" v-if="!conf.reminded && conf.status === 'pending'">
                📩 提醒
              </el-button>
              <el-button size="small" text @click="openBookingDialog(conf)">编辑</el-button>
              <el-button v-if="conf.status === 'pending'" size="small" text type="success"
                @click="markComplete(conf)">标记完成</el-button>
              <el-button size="small" text @click="exportBookingImage(conf)">📷 导出</el-button>
              <el-button size="small" text type="danger" @click="deleteBooking(conf)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="activeTab !== 'calendar' && !filteredList.length" class="pc-empty">
        <div class="pc-empty-icon">📅</div>
        <div class="pc-empty-title">
          {{ hasFilters ? '筛选结果为空' : (activeTab === 'pending' ? '暂无待进行的家长会预约' : '暂无已完成的家长会记录') }}
        </div>
        <div class="pc-empty-desc">
          {{ hasFilters ? '尝试调整筛选条件，或清除筛选查看全部' : '点击右上角「新建预约」开始安排家长面谈' }}
        </div>
      </div>

      <!-- Calendar View -->
      <div v-if="activeTab === 'calendar'" class="pc-calendar">
        <div class="pc-cal-header">
          <el-button size="small" @click="calMonth--">◀</el-button>
          <span class="pc-cal-title">{{ calYear }}年{{ calMonth }}月</span>
          <el-button size="small" @click="calMonth++">▶</el-button>
          <el-button size="small" @click="goToToday" style="margin-left:12px">今天</el-button>
        </div>
        <div class="pc-cal-legend">
          <span class="pc-legend-dot pending"></span> 待进行
          <span class="pc-legend-dot completed"></span> 已完成
          <span class="pc-legend-dot online"></span> 线上
          <span class="pc-legend-dot priority"></span> 优先
        </div>
        <div class="pc-cal-grid">
          <div class="pc-cal-day-header" v-for="d in ['日', '一', '二', '三', '四', '五', '六']" :key="d">{{ d }}</div>
          <div v-for="(day, i) in calDays" :key="i" class="pc-cal-day"
            :class="{ 'has-booking': day.bookings.length, 'is-today': day.isToday, 'is-other-month': !day.inMonth }"
            @click="day.bookings.length && showDayBookings(day)">
            <span class="pc-cal-num">{{ day.num }}</span>
            <div v-if="day.bookings.length" class="pc-cal-blocks">
              <div v-for="b in day.bookings.slice(0, 3)" :key="b.id" class="pc-cal-block"
                :class="{
                  completed: b.status === 'completed',
                  online: b.mode === 'online',
                  priority: b.priority === 'urgent'
                }"
                :title="`${b.studentName} · ${formatTime(b.time)} · ${b.parentCount}位家长${b.parentName ? ' · ' + b.parentName : ''}`"
                @click.stop="openBookingDialog(b)">
                {{ formatTimeShort(b.time) }} {{ b.studentName?.charAt(0) }}{{ b.parentCount }}人
              </div>
              <div v-if="day.bookings.length > 3" class="pc-cal-more" @click.stop="showDayBookings(day)">
                +{{ day.bookings.length - 3 }}条
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑预约' : '新建家长会预约'" width="640px" destroy-on-close>
      <div class="pc-dialog-body">
        <!-- 基本预约信息 -->
        <div class="pc-dialog-section">
          <div class="pc-dialog-section-icon">📋</div>
          <div class="pc-dialog-section-content">
            <div class="pc-dialog-grid-2">
              <div class="admin-form-group">
                <label>学生姓名 <span class="required">*</span></label>
                <el-input v-model="form.studentName" placeholder="请输入学生姓名" />
              </div>
              <div class="admin-form-group">
                <label>班级</label>
                <el-input v-model="form.class" placeholder="如：5D" />
              </div>
              <div class="admin-form-group">
                <label>日期时间 <span class="required">*</span></label>
                <el-date-picker v-model="form.time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                  placeholder="选择日期时间" style="width:100%" />
              </div>
              <div class="admin-form-group">
                <label>预计时长</label>
                <el-select v-model="form.duration" style="width:100%">
                  <el-option :value="15" label="15 分钟" />
                  <el-option :value="30" label="30 分钟" />
                  <el-option :value="45" label="45 分钟" />
                  <el-option :value="60" label="60 分钟" />
                  <el-option :value="90" label="90 分钟" />
                </el-select>
              </div>
              <div class="admin-form-group">
                <label>会议方式</label>
                <el-radio-group v-model="form.mode" style="padding-top:6px">
                  <el-radio value="offline" size="small">线下见面</el-radio>
                  <el-radio value="online" size="small">线上会议</el-radio>
                </el-radio-group>
              </div>
              <div class="admin-form-group">
                <label>优先级</label>
                <el-radio-group v-model="form.priority" style="padding-top:6px">
                  <el-radio value="normal" size="small">普通</el-radio>
                  <el-radio value="urgent" size="small">优先</el-radio>
                </el-radio-group>
              </div>
            </div>
          </div>
        </div>

        <!-- 出席人员 -->
        <div class="pc-dialog-section">
          <div class="pc-dialog-section-icon">👥</div>
          <div class="pc-dialog-section-content">
            <div class="pc-dialog-grid-2">
              <div class="admin-form-group">
                <label>家长姓名</label>
                <el-input v-model="form.parentName" placeholder="如：陈先生" />
              </div>
              <div class="admin-form-group">
                <label>家长电话</label>
                <el-input v-model="form.parentPhone" placeholder="手机号码" />
              </div>
              <div class="admin-form-group">
                <label>出席人数</label>
                <el-input-number v-model="form.parentCount" :min="1" :max="4" style="width:100%" />
              </div>
              <div class="admin-form-group">
                <label>学科老师</label>
                <el-input v-model="form.teacherName" placeholder="任课老师姓名" />
              </div>
              <div class="admin-form-group">
                <label>SA / 学习顾问</label>
                <el-input v-model="form.saName" placeholder="SA 姓名" />
              </div>
              <div class="admin-form-group">
                <label>CC / 班主任</label>
                <el-input v-model="form.ccName" placeholder="CC 姓名" />
              </div>
            </div>
          </div>
        </div>

        <!-- 地点与内容 -->
        <div class="pc-dialog-section">
          <div class="pc-dialog-section-icon">📍</div>
          <div class="pc-dialog-section-content">
            <div class="pc-dialog-grid-2" v-if="form.mode === 'offline'">
              <div class="admin-form-group">
                <label>会议地点</label>
                <el-select v-model="form.room" style="width:100%" filterable allow-create
                  placeholder="选择或输入教室">
                  <el-option v-for="r in roomOptions" :key="r" :label="r" :value="r" />
                </el-select>
              </div>
            </div>
            <div class="pc-dialog-grid-2" v-else>
              <div class="admin-form-group">
                <label>腾讯会议号</label>
                <el-input v-model="form.meetingId" placeholder="如：987-654-321" />
              </div>
            </div>
            <div class="admin-form-group">
              <label>会议议题</label>
              <el-input v-model="form.agenda" type="textarea" :rows="2"
                placeholder="计划讨论的议题，如：1. 近期成绩波动分析 2. 选科规划建议 3. 课后辅导安排" />
            </div>
            <div class="admin-form-group" style="margin-bottom:0">
              <label>备注 / 准备事项</label>
              <el-input v-model="form.notes" type="textarea" :rows="2"
                placeholder="需要提前准备的材料、关注要点..." />
            </div>
            <div v-if="editingId && form.status === 'completed'" class="admin-form-group" style="margin-top:14px">
              <label>会议纪要（已记录）</label>
              <el-input v-model="form.completionNotes" type="textarea" :rows="3"
                placeholder="家长会结束后记录的关键沟通内容和后续跟进计划..." />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="pc-dialog-footer">
          <span class="pc-dialog-footer-hint" v-if="!editingId">
            创建后将自动加入待进行列表，按时间排序
          </span>
          <div class="pc-dialog-footer-actions">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveBooking">
              {{ editingId ? '保存修改' : '创建预约' }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 家长会预约管理
 *
 * 功能：
 * - 按预约时间前后顺序展示（待进行：即将到来 → 已完成：最近在前）
 * - 统计栏：今日/本周/待进行/已完成/线上/线下
 * - 筛选：班级、方式（线上/线下）、学生姓名搜索
 * - 时间线视图：含学生信息、家长联系方式、教师/学科、会议议题、跟进状态
 * - 日历视图：按天分布、颜色区分状态、图例说明
 * - 预约凭证导出打印
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parentConferenceService } from '@/services/dataService'
import { getPrintWatermarkHTML, getPrintWatermarkStyle } from '@/utils/printTemplate'

// ======================== State ========================
const bookings = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const activeTab = ref('pending')
const filterClass = ref('')
const filterMode = ref('')
const filterSearch = ref('')

const roomOptions = ['教学楼302会议室', '教学楼305小会议室', '行政楼101接待室', '图书馆讨论室', '在线会议室']

const form = ref(createEmptyForm())

function createEmptyForm() {
  return {
    studentName: '', class: '', time: '', parentCount: 2, duration: 30,
    saAttend: false, ccAttend: false, mode: 'offline', room: '教学楼302会议室',
    meetingId: '', saName: '', ccName: '', notes: '', priority: 'normal',
    parentName: '', parentPhone: '', subject: '', teacherName: '',
    agenda: '', completionNotes: ''
  }
}

// ======================== Lifecycle ========================
onMounted(() => { refreshData() })

function refreshData() {
  bookings.value = parentConferenceService.getAll()
}

// ======================== Computed ========================
const pendingList = computed(() =>
  bookings.value
    .filter(b => b.status === 'pending')
    .sort((a, b) => a.time.localeCompare(b.time))
)

const completedList = computed(() =>
  bookings.value
    .filter(b => b.status === 'completed')
    .sort((a, b) => b.time.localeCompare(b.time))
)

const hasFilters = computed(() => filterClass.value || filterMode.value || filterSearch.value)

const filteredList = computed(() => {
  let list = activeTab.value === 'pending' ? pendingList.value : completedList.value
  if (filterClass.value) list = list.filter(b => b.class === filterClass.value)
  if (filterMode.value) list = list.filter(b => b.mode === filterMode.value)
  if (filterSearch.value) {
    const kw = filterSearch.value.toLowerCase()
    list = list.filter(b => b.studentName?.toLowerCase().includes(kw))
  }
  return list
})

const classOptions = computed(() => {
  const set = new Set(bookings.value.map(b => b.class).filter(Boolean))
  return [...set].sort()
})

const todayStr = new Date().toISOString().split('T')[0]
const todayCount = computed(() => bookings.value.filter(b => b.time?.startsWith(todayStr)).length)
const weekCount = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)
  return bookings.value.filter(b => {
    const d = new Date(b.time)
    return d >= startOfWeek && d < endOfWeek
  }).length
})
const onlineCount = computed(() => bookings.value.filter(b => b.mode === 'online').length)
const offlineCount = computed(() => bookings.value.filter(b => b.mode === 'offline').length)

// ======================== Methods ========================
function applyFilters() { /* reactive computed handles it */ }
function clearFilters() {
  filterClass.value = ''
  filterMode.value = ''
  filterSearch.value = ''
}

function openBookingDialog(conf) {
  if (conf) {
    editingId.value = conf.id
    form.value = {
      ...createEmptyForm(),
      ...conf,
      meetingId: conf.meetingId || '',
      saName: conf.saName || '',
      ccName: conf.ccName || '',
      parentName: conf.parentName || '',
      parentPhone: conf.parentPhone || '',
      subject: conf.subject || '',
      teacherName: conf.teacherName || '',
      agenda: conf.agenda || '',
      duration: conf.duration || 30,
      priority: conf.priority || 'normal',
      completionNotes: conf.completionNotes || ''
    }
  } else {
    editingId.value = null
    form.value = createEmptyForm()
  }
  dialogVisible.value = true
}

function saveBooking() {
  if (!form.value.studentName) { ElMessage.warning('请输入学生姓名'); return }
  if (!form.value.time) { ElMessage.warning('请选择日期时间'); return }
  const data = {
    ...form.value,
    status: editingId.value
      ? (bookings.value.find(b => b.id === editingId.value)?.status || 'pending')
      : 'pending',
    createdAt: editingId.value
      ? (bookings.value.find(b => b.id === editingId.value)?.createdAt || new Date().toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0]
  }
  if (editingId.value) {
    parentConferenceService.update(editingId.value, data)
    ElMessage.success('预约已更新')
  } else {
    parentConferenceService.create(data)
    ElMessage.success('预约已创建')
  }
  dialogVisible.value = false
  refreshData()
}

function markComplete(conf) {
  ElMessageBox.prompt('请输入会议纪要（可选）', '标记完成', {
    confirmButtonText: '确认完成',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputPlaceholder: '简要记录沟通要点和后续跟进计划...'
  }).then(({ value }) => {
    parentConferenceService.update(conf.id, {
      status: 'completed',
      completionNotes: value || conf.completionNotes || '',
      followUpStatus: 'done'
    })
    refreshData()
    ElMessage.success('已标记为完成')
  }).catch(() => {})
}

async function deleteBooking(conf) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${conf.studentName}」的家长会预约吗？\n时间：${formatDateTime(conf.time)}`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    parentConferenceService.delete(conf.id)
    refreshData()
    ElMessage.success('已删除')
  } catch { }
}

function sendReminder(conf) {
  ElMessageBox.confirm(
    `确认向「${conf.studentName}」的家长发送提醒？\n时间：${formatDateTime(conf.time)}${conf.parentPhone ? '\n电话：' + conf.parentPhone : ''}`,
    '发送提醒',
    { confirmButtonText: '发送', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    parentConferenceService.update(conf.id, { reminded: true })
    refreshData()
    ElMessage.success('提醒已发送')
  }).catch(() => {})
}

// ======================== Helpers ========================
function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${weekDays[d.getDay()]}`
}

function formatTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatTimeShort(dt) {
  return formatTime(dt)
}

function formatDateTime(dt) {
  return `${formatDate(dt)} ${formatTime(dt)}`
}

function avatarColor(name) {
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6']
  let hash = 0
  if (name) { for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash) }
  return colors[Math.abs(hash) % colors.length]
}

// ======================== Calendar ========================
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth() + 1)

function goToToday() {
  const now = new Date()
  calYear.value = now.getFullYear()
  calMonth.value = now.getMonth() + 1
}

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
    const dayBookings = bookings.value
      .filter(b => b.time && b.time.startsWith(dateStr))
      .sort((a, b) => a.time.localeCompare(b.time))
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
  const hasPending = day.bookings.some(b => b.status !== 'completed')
  activeTab.value = hasPending ? 'pending' : 'completed'
  ElMessage.info(`${day.num}日共 ${day.bookings.length} 条预约，已切换到列表视图`)
}

// ======================== Export ========================
function exportBookingImage(conf) {
  const modeLabel = conf.mode === 'online'
    ? `💻 线上会议${conf.meetingId ? ' · ' + conf.meetingId : ''}`
    : `🏫 ${conf.room || '线下'}`
  const saLabel = conf.saName ? `<p><b>SA：</b>${conf.saName}</p>` : ''
  const ccLabel = conf.ccName ? `<p><b>CC：</b>${conf.ccName}</p>` : ''
  const parentLabel = conf.parentName ? `<p><b>家长：</b>${conf.parentName}${conf.parentPhone ? ' · ' + conf.parentPhone : ''}</p>` : ''
  const subjectLabel = conf.subject ? `<p><b>学科：</b>${conf.subject}${conf.teacherName ? ' · ' + conf.teacherName : ''}</p>` : ''
  const agendaLabel = conf.agenda ? `<p><b>会议议题：</b>${conf.agenda}</p>` : ''
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>家长会预约</title><style>
    @page { size: A4 portrait; margin: 20mm; }
    body { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: #2c2c2c; text-align: center; }
    .card { border: 3px double #8b5e3c; border-radius: 16px; padding: 32px; max-width: 460px; margin: 40px auto; }
    .card h2 { font-size: 20px; color: #4a2c17; margin: 0 0 4px; }
    .card .sub { font-size: 12px; color: #888; margin-bottom: 20px; }
    .card .info { text-align: left; font-size: 14px; line-height: 2.4; }
    .card .info b { color: #4a2c17; }
    .card .footer { margin-top: 24px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
    ${getPrintWatermarkStyle()}
  </style></head><body>
  <div class="card">
    <h2>威学一百 · 家长会预约凭证</h2>
    <div class="sub">Parent-Teacher Conference Appointment</div>
    <div class="info">
      <p><b>学生：</b>${conf.studentName} · ${conf.class}班</p>
      <p><b>时间：</b>${formatDateTime(conf.time)} · 预计${conf.duration || 30}分钟</p>
      <p><b>家长人数：</b>${conf.parentCount}位</p>
      ${parentLabel}
      <p><b>方式：</b>${modeLabel}</p>
      ${subjectLabel}
      ${saLabel}
      ${ccLabel}
      ${agendaLabel}
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
/* ======================== Stats Bar ======================== */
.pc-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pc-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  flex: 1;
  min-width: 100px;
}

.pc-stat-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--admin-text);
  line-height: 1;
}

.pc-stat-label {
  font-size: 11px;
  color: var(--admin-text-muted);
}

.pc-stat-item.warn .pc-stat-num { color: var(--admin-warning); }
.pc-stat-item.done .pc-stat-num { color: var(--admin-success); }
.pc-stat-item.online .pc-stat-num { color: var(--admin-info); }
.pc-stat-item.offline .pc-stat-num { color: var(--admin-accent); }

/* ======================== Filters ======================== */
.pc-filters {
  margin-bottom: 14px;
}

.pc-filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.pc-filter-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pc-filter-group label {
  font-size: 10px;
  font-weight: 600;
  color: var(--admin-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pc-select,
.pc-search {
  height: 34px;
  padding: 4px 10px;
  border: 1px solid var(--admin-border);
  border-radius: 7px;
  font-size: 12px;
  font-family: inherit;
  color: var(--admin-text);
  background: var(--admin-surface);
  outline: none;
  transition: border-color 0.15s;
}

.pc-select:focus,
.pc-search:focus {
  border-color: var(--admin-accent);
}

.pc-search {
  width: 160px;
}

.pc-filter-clear {
  padding: 6px 14px;
  border: 1px solid var(--admin-border);
  background: transparent;
  border-radius: 7px;
  font-size: 11px;
  cursor: pointer;
  color: var(--admin-text-muted);
  transition: all 0.15s;
  font-family: inherit;
}

.pc-filter-clear:hover {
  border-color: var(--admin-danger);
  color: var(--admin-danger);
}

.pc-summary-text {
  font-size: 11px;
  color: var(--admin-text-muted);
  margin-bottom: 10px;
}

.pc-summary-text b {
  color: var(--admin-text);
}

/* ======================== Tabs ======================== */
.pc-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.pc-tab {
  padding: 6px 18px;
  border: 1px solid var(--admin-border);
  background: var(--admin-surface);
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  color: var(--admin-text-muted);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
}

.pc-tab.active {
  background: var(--admin-accent);
  color: #fff;
  border-color: var(--admin-accent);
}

.pc-tab-count {
  font-size: 10px;
  opacity: 0.75;
}

/* ======================== Timeline ======================== */
.pc-timeline {
  position: relative;
  padding-left: 32px;
}

.pc-timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.pc-timeline-dot {
  position: absolute;
  left: -32px;
  top: 22px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--admin-accent);
  border: 3px solid var(--admin-bg);
  z-index: 1;
  box-shadow: 0 0 0 2px var(--admin-border);
}

.pc-timeline-dot.priority {
  background: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35);
}

.pc-timeline-item.completed .pc-timeline-dot {
  background: var(--admin-success);
}

.pc-timeline-line {
  position: absolute;
  left: -26px;
  top: 36px;
  bottom: 0;
  width: 2px;
  background: var(--admin-border);
  border-radius: 1px;
}

/* ======================== Booking Card ======================== */
.pc-booking-card {
  --card-gradient: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.18), rgba(6,182,212,0.12));
  background:
    linear-gradient(var(--admin-surface), var(--admin-surface)) padding-box,
    var(--card-gradient) border-box;
  border-radius: 12px;
  padding: 16px 18px;
  border: 1px solid transparent;
  transition: all 0.25s;
}

.pc-booking-card:hover {
  --card-gradient: linear-gradient(135deg, rgba(99,102,241,0.45), rgba(139,92,246,0.35), rgba(6,182,212,0.25));
  box-shadow: 0 2px 16px rgba(99,102,241,0.08);
}

.pc-timeline-item:has(.pc-priority.is-priority) .pc-booking-card {
  --card-gradient: linear-gradient(135deg, rgba(245,158,11,0.35), rgba(249,115,22,0.25), rgba(239,68,68,0.12));
}

.pc-timeline-item:has(.pc-priority.is-priority) .pc-booking-card:hover {
  --card-gradient: linear-gradient(135deg, rgba(245,158,11,0.55), rgba(249,115,22,0.4), rgba(239,68,68,0.2));
  box-shadow: 0 2px 16px rgba(245,158,11,0.1);
}

.pc-timeline-item.completed .pc-booking-card {
  opacity: 0.6;
}

.pc-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.pc-student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pc-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.pc-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--admin-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.pc-priority {
  font-size: 9px;
  padding: 1px 7px;
  border-radius: 4px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.pc-priority.is-normal {
  background: rgba(148, 163, 184, 0.15);
  color: #64748b;
}

.pc-priority.is-priority {
  background: rgba(245, 158, 11, 0.18);
  color: #b45309;
}

.pc-class {
  font-size: 11px;
  color: var(--admin-text-muted);
}

.pc-time-block {
  text-align: right;
  flex-shrink: 0;
}

.pc-time-main {
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-text);
}

.pc-time-sub {
  font-size: 10px;
  color: var(--admin-text-muted);
}

/* ======================== Card Meta ======================== */
.pc-card-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.pc-meta-tag {
  font-size: 10px;
  padding: 2px 10px;
  border-radius: 5px;
  font-weight: 500;
}

.pc-meta-tag.offline {
  background: rgba(249, 115, 22, 0.12);
  color: #e65100;
}

.pc-meta-tag.online {
  background: rgba(6, 182, 212, 0.12);
  color: #0891b2;
}

.pc-meta-detail {
  font-size: 11px;
  color: var(--admin-text-muted);
}

/* ======================== Info Grid ======================== */
.pc-card-info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-bottom: 8px;
}

.pc-info-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--admin-text-secondary);
}

.pc-info-icon {
  font-size: 13px;
}

.pc-info-extra {
  color: var(--admin-text-muted);
}

.pc-info-tag {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
  color: #fff;
}

.pc-info-tag.sa { background: var(--admin-accent); }
.pc-info-tag.cc { background: #8b5cf6; }

/* ======================== Follow-up Row ======================== */
.pc-followup-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.pc-followup-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--admin-warning);
}

.pc-followup-dot.done {
  background: var(--admin-success);
}

.pc-followup-text {
  font-size: 10px;
  color: var(--admin-text-muted);
}

.pc-reminded {
  font-size: 9px;
  padding: 1px 7px;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.12);
  color: var(--admin-success);
  margin-left: 6px;
}

.pc-reminded.not {
  background: rgba(239, 68, 68, 0.08);
  color: var(--admin-danger);
}

/* ======================== Agenda / Notes ======================== */
.pc-agenda {
  background: rgba(99, 102, 241, 0.05);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 6px;
  border-left: 3px solid var(--admin-accent);
}

.pc-agenda-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--admin-accent);
  margin-bottom: 3px;
}

.pc-agenda-text {
  font-size: 12px;
  color: var(--admin-text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}

.pc-notes {
  font-size: 11px;
  color: var(--admin-text-muted);
  margin-bottom: 4px;
}

.pc-notes-label {
  font-weight: 600;
  color: var(--admin-text-secondary);
}

.pc-completion {
  font-size: 11px;
  color: var(--admin-success);
  background: rgba(16, 185, 129, 0.06);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  line-height: 1.5;
}

.pc-completion-label {
  font-weight: 600;
}

/* ======================== Actions ======================== */
.pc-card-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--admin-border);
}

/* ======================== Empty ======================== */
.pc-empty {
  text-align: center;
  padding: 48px 20px;
  color: var(--admin-text-muted);
}

.pc-empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.pc-empty-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text-secondary);
  margin-bottom: 6px;
}

.pc-empty-desc {
  font-size: 11px;
  color: var(--admin-text-muted);
}

/* ======================== Calendar ======================== */
.pc-calendar {
  margin-top: 8px;
}

.pc-cal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.pc-cal-title {
  font-weight: 700;
  font-size: 16px;
  color: var(--admin-text);
  min-width: 120px;
  text-align: center;
}

.pc-cal-legend {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 11px;
  color: var(--admin-text-muted);
}

.pc-legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.pc-legend-dot.pending { background: var(--admin-accent); }
.pc-legend-dot.completed { background: var(--admin-success); }
.pc-legend-dot.online { background: var(--admin-info); }
.pc-legend-dot.priority { background: #f59e0b; }

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
  border-radius: 10px;
  background: var(--admin-bg);
  padding: 6px;
  cursor: default;
  border: 1px solid transparent;
  transition: all 0.15s;
  min-height: 85px;
  display: flex;
  flex-direction: column;
}

.pc-cal-day:hover {
  border-color: var(--admin-border);
}

.pc-cal-day.is-other-month {
  opacity: 0.3;
}

.pc-cal-day.is-today {
  border-color: var(--admin-accent);
  background: rgba(99, 102, 241, 0.06);
}

.pc-cal-day.has-booking {
  background: rgba(99, 102, 241, 0.04);
}

.pc-cal-num {
  font-size: 13px;
  color: var(--admin-text-secondary);
  font-weight: 500;
  margin-bottom: 4px;
}

.pc-cal-day.is-today .pc-cal-num {
  color: var(--admin-accent);
  font-weight: 700;
}

.pc-cal-blocks {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.pc-cal-block {
  font-size: 9px;
  padding: 2px 5px;
  border-radius: 4px;
  cursor: pointer;
  background: rgba(99, 102, 241, 0.12);
  color: var(--admin-accent);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s;
}

.pc-cal-block:hover {
  background: rgba(99, 102, 241, 0.25);
}

.pc-cal-block.completed {
  background: rgba(16, 185, 129, 0.12);
  color: var(--admin-success);
}

.pc-cal-block.online {
  background: rgba(6, 182, 212, 0.12);
  color: var(--admin-info);
}

.pc-cal-block.priority {
  border-left: 2px solid #f59e0b;
}

.pc-cal-more {
  font-size: 9px;
  color: var(--admin-text-muted);
  cursor: pointer;
  text-align: center;
  padding: 1px 0;
  font-weight: 600;
}

.pc-cal-more:hover {
  color: var(--admin-accent);
}

/* ======================== Dialog ======================== */
.pc-dialog-section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--admin-text);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--admin-border);
  letter-spacing: 0.5px;
}

.pc-dialog-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
  margin-bottom: 4px;
}

.pc-dialog-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0 12px;
  margin-bottom: 4px;
}

.required {
  color: var(--admin-danger);
}

/* ======================== Responsive ======================== */
@media (max-width: 768px) {
  .pc-stats {
    gap: 8px;
  }
  .pc-stat-item {
    flex: 0 0 calc(50% - 4px);
    min-width: auto;
  }
  .pc-filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .pc-search {
    width: 100%;
  }
  .pc-dialog-grid-2,
  .pc-dialog-grid-3 {
    grid-template-columns: 1fr;
  }
  .pc-card-top {
    flex-direction: column;
    gap: 8px;
  }
  .pc-time-block {
    text-align: left;
  }
  .pc-card-info-grid {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
