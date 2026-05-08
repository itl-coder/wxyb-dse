<template>
  <div>
    <!-- Stats cards -->
    <div class="admin-stats-grid">
      <div class="admin-stat-card clickable" @click="$router.push('/admin/settings')">
        <div>
          <div class="stat-value">{{ classCount }}</div>
          <div class="stat-label">教学班</div>
          <div class="stat-change" style="color:var(--admin-text-muted)">6个年级</div>
        </div>
        <div class="stat-icon amber">📚</div>
      </div>
      <div class="admin-stat-card clickable" @click="$router.push('/admin/attendance')">
        <div>
          <div class="stat-value">94.2%</div>
          <div class="stat-label">今日出勤率</div>
          <div class="stat-change down">↓ 2.1% vs 昨日</div>
        </div>
        <div class="stat-icon teal">📋</div>
      </div>
      <div class="admin-stat-card clickable" @click="$router.push('/admin/homework')">
        <div>
          <div class="stat-value">{{ pendingHomework }}</div>
          <div class="stat-label">待批作业</div>
          <div class="stat-change up">5D班 数学</div>
        </div>
        <div class="stat-icon gold">📝</div>
      </div>
      <div class="admin-stat-card clickable" @click="$router.push('/admin/counseling')">
        <div>
          <div class="stat-value">3</div>
          <div class="stat-label">异常预警</div>
          <div class="stat-change down">心理 · 缺勤 · 违纪</div>
        </div>
        <div class="stat-icon red">⚠️</div>
      </div>
    </div>

    <div class="admin-two-col">
      <!-- Recent behaviors -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <div class="admin-card-title">📋 近期课堂表现</div>
            <div class="admin-card-subtitle">近7天各班级课堂行为记录</div>
          </div>
          <div style="display:flex;gap:8px">
            <el-button size="small" type="primary" @click="generateDailyReport">📄 生成今日日报</el-button>
            <el-button size="small" @click="$router.push('/admin/behavior')">查看全部</el-button>
          </div>
        </div>
        <el-table :data="recentBehaviors" stripe size="small" style="width:100%">
          <el-table-column label="学生" fixed>
            <template #default="{ row }">
              <span style="color:var(--admin-text)">{{ row.student }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="class" label="班级" />
          <el-table-column prop="subject" label="科目" />
          <el-table-column label="行为">
            <template #default="{ row }">
              <span class="admin-tag" :class="row.type">{{ row.behavior }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="评分" />
          <el-table-column prop="time" label="时间" />
        </el-table>
      </div>

      <!-- Recent Discipline Timeline -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <div class="admin-card-title">📋 近期处理记录</div>
            <div class="admin-card-subtitle">纪律台账 · 最新优先</div>
          </div>
          <el-button size="small" @click="$router.push('/admin/discipline')">查看全部</el-button>
        </div>
        <div class="dashboard-timeline" v-if="recentDiscipline.length">
          <div v-for="d in recentDiscipline" :key="d.id" class="dashboard-timeline-item">
            <div class="dtl-time">{{ d.date }}</div>
            <div class="dtl-dot" :class="d.level === '严重' ? 'danger' : d.level === '一般' ? 'warning' : 'info'"></div>
            <div class="dtl-content">
              <span class="dtl-student">{{ d.studentName }}</span>
              <span class="dtl-class-tag">{{ d.class }}</span>
              <span class="dtl-vio">{{ d.violation }}</span>
              <span class="admin-tag" :class="d.status==='已处理'?'success':'warning'" style="font-size:10px;margin-left:4px">{{ d.status }}</span>
            </div>
          </div>
        </div>
        <div v-else style="font-size:12px;color:var(--admin-text-muted);text-align:center;padding:16px">
          暂无纪律记录
        </div>
      </div>
    </div>

    <!-- Custom Quick Actions -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">⚡ 快捷操作</div>
          <div class="admin-card-subtitle">常用功能快速入口（支持自定义添加/删除）</div>
        </div>
        <el-button size="small" type="primary" @click="showAddAction = true">+ 自定义快捷</el-button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        <div v-for="a in quickActions" :key="a.id" class="quick-action-btn" @click="$router.push(a.path)">
          <div style="text-align:center">
            <div style="font-size:20px;margin-bottom:4px">{{ a.icon }}</div>
            <div style="font-size:11px">{{ a.label }}</div>
          </div>
          <button class="qa-delete" @click.stop="removeAction(a)" title="删除">×</button>
        </div>
        <div v-if="quickActions.length === 0" style="color:var(--admin-text-muted);font-size:12px;padding:20px;text-align:center;width:100%">
          暂无快捷操作，点击「自定义快捷」添加
        </div>
      </div>
    </div>

    <!-- Add Action Dialog -->
    <el-dialog v-model="showAddAction" title="添加快捷操作" width="460px">
      <div class="admin-form-group">
        <label>图标</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          <span v-for="icon in iconPool" :key="icon" class="icon-option" :class="{ selected: newAction.icon === icon }" @click="newAction.icon = icon">{{ icon }}</span>
        </div>
      </div>
      <div class="admin-form-group">
        <label>名称</label>
        <el-input v-model="newAction.label" size="small" placeholder="如：家长会准备" />
      </div>
      <div class="admin-form-group">
        <label>跳转路径</label>
        <el-select v-model="newAction.path" style="width:100%" filterable allow-create>
          <el-option v-for="r in routeOptions" :key="r.path" :label="r.label" :value="r.path" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="showAddAction = false">取消</el-button>
        <el-button type="primary" @click="addAction">添加</el-button>
      </template>
    </el-dialog>

    <!-- Daily Report Dialog -->
    <el-dialog v-model="showDailyReport" title="📄 今日成长日报" width="700px" top="5vh">
      <div v-if="dailyReportData" class="daily-report" id="dailyReportPrint">
        <div class="dr-header">
          <h1>{{ dailyReportData.schoolName }} · 每日成长日报</h1>
          <div class="dr-meta">{{ dailyReportData.date }} · {{ dailyReportData.dayOfWeek }}</div>
        </div>
        <div class="dr-section">
          <h3>📋 今日考勤概况</h3>
          <div class="dr-stats-row">
            <div class="dr-stat"><span class="dr-val">{{ dailyReportData.attendance.total }}</span><span class="dr-lbl">应到</span></div>
            <div class="dr-stat"><span class="dr-val green">{{ dailyReportData.attendance.present }}</span><span class="dr-lbl">实到</span></div>
            <div class="dr-stat"><span class="dr-val orange">{{ dailyReportData.attendance.late }}</span><span class="dr-lbl">迟到</span></div>
            <div class="dr-stat"><span class="dr-val red">{{ dailyReportData.attendance.absent }}</span><span class="dr-lbl">缺勤</span></div>
          </div>
        </div>
        <div class="dr-section">
          <h3>📝 作业情况</h3>
          <p>今日布置作业 {{ dailyReportData.homework.assigned }} 份，已提交 {{ dailyReportData.homework.submitted }} 份，待批改 {{ dailyReportData.homework.pending }} 份。</p>
        </div>
        <div class="dr-section">
          <h3>⭐ 今日亮点</h3>
          <ul v-if="dailyReportData.highlights.length">
            <li v-for="(h, i) in dailyReportData.highlights" :key="i">{{ h }}</li>
          </ul>
          <p v-else style="color:var(--admin-text-muted)">今日暂无特别记录，一切平稳运行。</p>
        </div>
        <div class="dr-section">
          <h3>⚠️ 需关注事项</h3>
          <ul v-if="dailyReportData.concerns.length">
            <li v-for="(c, i) in dailyReportData.concerns" :key="i">{{ c }}</li>
          </ul>
          <p v-else style="color:var(--admin-text-muted)">今日暂无需要特别关注的事项。</p>
        </div>
        <div class="dr-footer">此日报由 DSE 智能学情管理系统 自动生成 · {{ dailyReportData.date }}</div>
      </div>
      <template #footer>
        <el-button @click="showDailyReport = false">关闭</el-button>
        <el-button type="primary" @click="printDailyReport">🖨️ 打印日报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { quickActionService, studentService, attendanceService, homeworkService, behaviorService, disciplineService } from '@/services/dataService'

const quickActions = ref([])
const showAddAction = ref(false)
const studentCount = ref(0)
const classCount = ref(0)
const pendingHomework = ref(18)
const disciplineRecords = ref([])

function loadDiscipline() {
  disciplineRecords.value = disciplineService.getAll()
}

const newAction = ref({ icon: '📌', label: '', path: '/admin/conference' })

const iconPool = quickActionService.getIconPool()
const routeOptions = [
  { path: '/admin', label: '数据看板' },
  { path: '/admin/timetable', label: '课表管理' },
  { path: '/admin/behavior', label: '课堂表现' },
  { path: '/admin/homework', label: '作业管理' },
  { path: '/admin/discipline', label: '纪律台账' },
  { path: '/admin/phone', label: '手机管理' },
  { path: '/admin/attendance', label: '考勤请假' },
  { path: '/admin/reports', label: '成长日报' },
  { path: '/admin/exam', label: '试卷错题' },
  { path: '/admin/questions', label: '智能出题' },
  { path: '/admin/counseling', label: '心理辅导' },
  { path: '/admin/conference', label: '家长会准备' },
  { path: '/admin/voice', label: '语音记录' },
  { path: '/admin/students', label: '学生信息' },
  { path: '/admin/settings', label: '系统设置' }
]

onMounted(() => {
  quickActions.value = quickActionService.getAll()
  const students = studentService.getAll()
  studentCount.value = students.length
  classCount.value = new Set(students.map(s => s.class)).size
  loadDiscipline()
})

const recentBehaviors = [
  { id:1, student:'陈小明', class:'5D', subject:'数学', behavior:'积极发言', type:'success', score:'A', time:'09:30' },
  { id:2, student:'李美玲', class:'5D', subject:'中文', behavior:'走神', type:'warning', score:'C', time:'10:15' },
  { id:3, student:'张伟豪', class:'5D', subject:'英文', behavior:'优秀答题', type:'success', score:'A+', time:'11:00' },
  { id:4, student:'黄小燕', class:'5D', subject:'物理', behavior:'迟到', type:'danger', score:'D', time:'08:05' },
  { id:5, student:'林志远', class:'5D', subject:'化学', behavior:'实验认真', type:'success', score:'A', time:'14:20' }
]

const recentDiscipline = computed(() => {
  return [...disciplineRecords.value].sort((a, b) => b.date?.localeCompare(a.date) || 0).slice(0, 8)
})

function addAction() {
  if (!newAction.value.label) { ElMessage.warning('请输入名称'); return }
  quickActionService.create({ ...newAction.value })
  quickActions.value = quickActionService.getAll()
  showAddAction.value = false
  newAction.value = { icon: '📌', label: '', path: '/admin/conference' }
  ElMessage.success('已添加')
}

// Daily Report
const showDailyReport = ref(false)
const dailyReportData = ref(null)

function generateDailyReport() {
  const today = new Date().toISOString().split('T')[0]
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const students = studentService.getAll()
  const todayAttendance = attendanceService.getAll().filter(a => a.date === today)
  const allHomework = homeworkService.getAll()
  const todayBehaviors = behaviorService.getAll().filter(b => b.time && b.time.startsWith(today))

  const highlights = []
  const concerns = []

  if (todayBehaviors.length) {
    const positive = todayBehaviors.filter(b => b.type === 'success')
    const negative = todayBehaviors.filter(b => b.type === 'warning' || b.type === 'danger')
    if (positive.length) highlights.push(`今日共记录 ${positive.length} 条积极课堂表现，涉及学生积极参与、优秀答题等`)
    if (negative.length) concerns.push(`今日记录 ${negative.length} 条需关注行为（走神/迟到等），建议相关班主任跟进`)
  }

  if (todayAttendance.length) {
    const lates = todayAttendance.filter(a => a.status === '迟到')
    const absents = todayAttendance.filter(a => a.status === '缺勤')
    if (lates.length) concerns.push(`今日迟到 ${lates.length} 人：${lates.map(a => a.studentName || a.student).join('、')}`)
    if (absents.length) concerns.push(`今日缺勤 ${absents.length} 人：${absents.map(a => a.studentName || a.student).join('、')}`)
  }

  const pendingHw = allHomework.filter(h => h.status !== '已提交' && h.status !== '已批改').length
  if (pendingHw > 5) concerns.push(`当前仍有 ${pendingHw} 份作业待提交/批改，请关注作业进度`)

  if (highlights.length === 0) highlights.push('今日课堂秩序良好，各班级教学活动正常进行')

  dailyReportData.value = {
    schoolName: '威学一百',
    date: today,
    dayOfWeek: dayNames[new Date().getDay()],
    attendance: {
      total: students.length,
      present: todayAttendance.filter(a => a.status === '正常').length || Math.round(students.length * 0.94),
      late: todayAttendance.filter(a => a.status === '迟到').length || 0,
      absent: todayAttendance.filter(a => a.status === '缺勤').length || 0
    },
    homework: {
      assigned: allHomework.filter(h => h.dueDate === today).length || 3,
      submitted: allHomework.filter(h => h.status === '已提交').length,
      pending: pendingHw
    },
    highlights,
    concerns
  }
  showDailyReport.value = true
}

function printDailyReport() {
  const el = document.getElementById('dailyReportPrint')
  if (!el) return
  const w = window.open('', '_blank', 'width=800,height=600')
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>每日成长日报</title>
<style>
body { font-family:'PingFang SC','Microsoft YaHei',sans-serif; margin:40px; color:#2c2c2c; line-height:1.8; }
h1 { text-align:center; font-size:20px; color:#4a2c17; }
.dr-meta { text-align:center; font-size:13px; color:#888; margin-bottom:20px; }
.dr-section { margin-bottom:20px; }
.dr-section h3 { font-size:15px; color:#8b5e3c; border-bottom:1px solid #ddd; padding-bottom:6px; }
.dr-stats-row { display:flex; gap:24px; justify-content:center; }
.dr-stat { text-align:center; }
.dr-val { display:block; font-size:28px; font-weight:700; }
.dr-val.green { color:#22c55e; } .dr-val.orange { color:#e67e22; } .dr-val.red { color:#ef4444; }
.dr-lbl { font-size:12px; color:#888; }
.dr-footer { text-align:center; font-size:10px; color:#aaa; margin-top:30px; border-top:1px solid #eee; padding-top:12px; }
@media print { body { margin:20px; } }
</style></head><body>${el.innerHTML}</body></html>`)
  w.document.close()
  setTimeout(() => w.print(), 500)
}

async function removeAction(action) {
  try {
    await ElMessageBox.confirm(`确定删除快捷操作「${action.label}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    quickActionService.delete(action.id)
    quickActions.value = quickActionService.getAll()
    ElMessage.success('已删除')
  } catch {}
}
</script>

<style scoped>
.admin-stat-card.clickable { cursor: pointer; }
.admin-stat-card.clickable:hover { border-color: var(--admin-accent); box-shadow: 0 4px 16px rgba(201,160,80,0.15); }

.quick-action-btn {
  position: relative;
  padding: 12px 20px;
  background: var(--admin-bg);
  border: 1px solid var(--admin-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--admin-text-secondary);
}
.quick-action-btn:hover {
  border-color: var(--admin-accent);
  background: var(--admin-surface-hover);
  color: var(--admin-text);
}
.qa-delete {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: var(--admin-danger);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.quick-action-btn:hover .qa-delete { display: flex; }

.icon-option {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; cursor: pointer; font-size: 18px;
  border: 2px solid transparent; background: var(--admin-bg); transition: all 0.15s;
}
.icon-option:hover { border-color: var(--admin-border-light); }
.icon-option.selected { border-color: var(--admin-accent); background: rgba(201,160,80,0.1); }

/* Daily Report */
.daily-report { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: var(--admin-text); line-height: 1.8; }
.dr-header { text-align: center; margin-bottom: 20px; }
.dr-header h1 { font-size: 18px; color: var(--admin-accent); margin: 0 0 6px; }
.dr-meta { font-size: 12px; color: var(--admin-text-muted); }
.dr-section { margin-bottom: 18px; }
.dr-section h3 { font-size: 14px; color: var(--admin-accent); border-bottom: 1px solid var(--admin-border); padding-bottom: 6px; margin-bottom: 10px; }
.dr-section p { font-size: 13px; margin: 4px 0; }
.dr-section ul { padding-left: 1.5em; font-size: 13px; }
.dr-section li { margin: 4px 0; }
.dr-stats-row { display: flex; gap: 28px; justify-content: center; }
.dr-stat { text-align: center; }
.dr-val { display: block; font-size: 26px; font-weight: 700; }
.dr-val.green { color: var(--admin-success); }
.dr-val.orange { color: var(--admin-warning); }
.dr-val.red { color: var(--admin-danger); }
.dr-lbl { font-size: 11px; color: var(--admin-text-muted); }
.dr-footer { text-align: center; font-size: 10px; color: var(--admin-text-muted); margin-top: 24px; border-top: 1px solid var(--admin-border); padding-top: 10px; }

/* Discipline Timeline */
.dashboard-timeline {
  max-height: 280px;
  overflow-y: auto;
}
.dashboard-timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--admin-border);
  font-size: 12px;
}
.dashboard-timeline-item:last-child { border-bottom: none; }
.dtl-time {
  font-size: 10px;
  color: var(--admin-text-muted);
  white-space: nowrap;
  min-width: 80px;
}
.dtl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
.dtl-dot.danger { background: var(--admin-danger); }
.dtl-dot.warning { background: var(--admin-warning); }
.dtl-dot.info { background: var(--admin-info); }
.dtl-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dtl-student { font-weight: 500; color: var(--admin-text); }
.dtl-class-tag { font-size: 10px; color: var(--admin-text-muted); background: var(--admin-bg); padding: 1px 6px; border-radius: 4px; }
.dtl-vio { color: var(--admin-text-secondary); }
</style>
