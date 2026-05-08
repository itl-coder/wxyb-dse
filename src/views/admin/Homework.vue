<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📝 作业管理</div>
          <div class="admin-card-subtitle">卡片视图 · 课表联动 · JSON 导出</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-button size="small" type="primary" @click="openAssignDialog()">+ 布置作业</el-button>
          <el-button size="small" @click="generateFromTimetable" :disabled="!filterClass">📅 从课表生成</el-button>
          <el-button size="small" @click="showJsonExport = true">📤 JSON 导出</el-button>
          <el-button size="small" @click="showPrintView = true">🖨️ 打印通知</el-button>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center">
        <button v-for="tab in viewTabs" :key="tab.key" class="hw-view-tab" :class="{ active: activeView === tab.key }" @click="activeView = tab.key">{{ tab.label }}</button>
        <div style="display:flex;gap:6px;margin-left:auto">
          <el-select v-model="filterClass" size="small" placeholder="班级" style="width:100px" clearable @change="currentPage=1">
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-select v-model="filterSubject" size="small" placeholder="科目" style="width:100px" clearable @change="currentPage=1">
            <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="filterStatus" size="small" placeholder="状态" style="width:100px" clearable @change="currentPage=1">
            <el-option label="已提交" value="已提交" />
            <el-option label="未提交" value="未提交" />
            <el-option label="迟交" value="迟交" />
          </el-select>
        </div>
      </div>

      <!-- ===== DAY VIEW ===== -->
      <div v-if="activeView === 'day'" class="hw-day-view">
        <div v-if="!filterClass" style="text-align:center;padding:30px;color:var(--admin-text-muted);font-size:13px">请先选择班级查看当日作业</div>
        <template v-else>
          <div style="font-size:13px;font-weight:600;color:var(--admin-text);margin-bottom:12px">📅 {{ today }} · {{ filterClass }}班</div>
          <div v-if="todayTimetable.length === 0" style="text-align:center;padding:20px;color:var(--admin-text-muted);font-size:12px">今日无课程安排</div>
          <div v-for="t in todayTimetable" :key="t.id" class="hw-day-period">
            <div class="hw-period-header">
              <span class="hw-period-badge">第{{ t.period }}节</span>
              <span style="font-weight:500;color:var(--admin-text)">{{ subjectIcon(t.subject) }} {{ t.subject }}</span>
              <span style="font-size:11px;color:var(--admin-text-muted)">{{ t.teacher }} · {{ t.room }}</span>
              <el-button size="small" text type="primary" style="margin-left:auto" @click="quickAssign(t)">+ 布置</el-button>
            </div>
            <div v-if="getHomeworksForSubject(filterClass, t.subject).length === 0" style="font-size:11px;color:var(--admin-text-muted);padding:8px 12px">暂无作业</div>
            <HomeworkCard v-for="h in getHomeworksForSubject(filterClass, t.subject)" :key="h.id" :hw="h" @edit="openDialog" @delete="handleDelete" />
          </div>
        </template>
      </div>

      <!-- ===== WEEK VIEW ===== -->
      <div v-if="activeView === 'week'" class="hw-week-view">
        <div v-if="!filterClass" style="text-align:center;padding:30px;color:var(--admin-text-muted);font-size:13px">请先选择班级查看周作业</div>
        <div v-else class="hw-week-grid">
          <div v-for="d in weekDays" :key="d.date" class="hw-week-col" :class="{ today: d.date === today }">
            <div class="hw-week-col-header">
              <span>{{ d.label }}</span>
              <span style="font-size:10px;color:var(--admin-text-muted)">{{ d.date.slice(5) }}</span>
            </div>
            <div v-if="getHomeworksForDate(filterClass, d.date).length === 0" style="font-size:10px;color:var(--admin-text-muted);text-align:center;padding:8px">—</div>
            <div v-for="h in getHomeworksForDate(filterClass, d.date)" :key="h.id" class="hw-card-week" @click="openDialog(h)">
              <div class="hw-card-strip" :style="{background: subjectColor(h.subject)}"></div>
              <div style="font-size:11px;font-weight:500;color:var(--admin-text)">{{ h.title }}</div>
              <div style="font-size:10px;color:var(--admin-text-muted)">{{ h.subject }} · {{ h.studentName }}</div>
              <span class="admin-tag" :class="statusClass(h.status)" style="font-size:10px;margin-top:2px">{{ h.status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MONTH VIEW ===== -->
      <div v-if="activeView === 'month'" class="hw-month-view">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <el-button size="small" text @click="changeMonth(-1)">◀</el-button>
          <span style="font-size:13px;font-weight:600;color:var(--admin-text)">{{ monthYear }}</span>
          <el-button size="small" text @click="changeMonth(1)">▶</el-button>
        </div>
        <div class="hw-calendar">
          <div v-for="d in dayHeaders" :key="d" class="hw-cal-header">{{ d }}</div>
          <div v-for="cell in monthCells" :key="cell.key" class="hw-cal-cell" :class="{ today: cell.date === today, other: !cell.inMonth }" @click="cell.date && openDayDialog(cell.date)">
            <span class="hw-cal-date">{{ cell.label }}</span>
            <div v-if="cell.date && filterClass && getHomeworksForDate(filterClass, cell.date).length" class="hw-cal-dots">
              <span v-for="(h, i) in getHomeworksForDate(filterClass, cell.date).slice(0, 3)" :key="i" class="hw-cal-dot" :style="{background: statusColor(h.status)}"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== CARD LIST (all homeworks) ===== -->
    <div class="admin-card" style="margin-top:16px">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📋 全部作业</div>
          <div class="admin-card-subtitle">共 {{ totalFilteredHomeworks }} 条记录</div>
        </div>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[8,12,16,24]" :total="totalFilteredHomeworks" layout="total, sizes, prev, pager, next" size="small" background />
      </div>
      <div v-if="paginatedHomeworks.length === 0" style="text-align:center;padding:40px;color:var(--admin-text-muted)">暂无符合条件的作业记录</div>
      <div v-else class="hw-card-list">
        <HomeworkCard v-for="h in paginatedHomeworks" :key="h.id" :hw="h" :showStudent="true" @edit="openDialog" @delete="handleDelete" />
      </div>
    </div>

    <!-- Assign Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑作业记录' : '布置新作业'" width="640px" top="3vh">
      <div class="admin-form-group">
        <label>布置方式</label>
        <el-radio-group v-model="assignMode" size="small" @change="onAssignModeChange">
          <el-radio-button value="single">单个学生</el-radio-button>
          <el-radio-button value="multiple">多个学生</el-radio-button>
          <el-radio-button value="class">整个班级</el-radio-button>
        </el-radio-group>
      </div>
      <div class="admin-form-group" v-if="assignMode === 'single'">
        <label>学生</label>
        <el-select v-model="form.studentId" style="width:100%" filterable @change="onStudentSelect">
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-form-group" v-if="assignMode === 'multiple'">
        <label>选择学生（可多选）</label>
        <el-select v-model="form.studentIds" style="width:100%" multiple filterable>
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-form-group" v-if="assignMode === 'class'">
        <label>选择班级</label>
        <el-select v-model="form.classTarget" style="width:100%" @change="onClassTargetChange">
          <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
        </el-select>
        <div v-if="form.classTarget" style="font-size:11px;color:var(--admin-text-muted);margin-top:4px">
          将为 {{ classStudentCount(form.classTarget) }} 名学生统一布置
        </div>
      </div>
      <div class="admin-form-group">
        <label>作业标题 <span style="color:var(--admin-danger)">*</span></label>
        <el-input v-model="form.title" placeholder="例如：二次函数综合练习" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>科目</label>
          <el-select v-model="form.subject" style="width:100%">
            <el-option v-for="s in flatSubjectList" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>截止日期</label>
          <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </div>
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>时间段（如 19:30-21:05）</label>
          <el-input v-model="form.timeRange" placeholder="19:30-21:05" />
        </div>
        <div class="admin-form-group" v-if="editingId">
          <label>状态</label>
          <el-select v-model="form.status" style="width:100%">
            <el-option label="已提交" value="已提交" />
            <el-option label="未提交" value="未提交" />
            <el-option label="迟交" value="迟交" />
          </el-select>
        </div>
      </div>
      <div class="admin-form-group">
        <label>简短说明</label>
        <el-input v-model="form.content" type="textarea" :rows="2" placeholder="简短说明作业要求..." />
      </div>
      <div class="admin-form-group">
        <label>详细描述（支持 Markdown）</label>
        <MarkdownEditor v-model="form.description" :rows="5" placeholder="详细描述作业步骤、要求、参考资料等..." />
      </div>
      <div class="admin-form-group">
        <label>附件（图片/文件）</label>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="hw-attach-zone" @click="triggerAttachUpload">
            <input ref="attachInput" type="file" accept="image/*,.pdf" multiple style="display:none" @change="handleAttachUpload" />
            <span v-if="attachPreviews.length === 0" style="font-size:12px;color:var(--admin-text-muted)">📎 点击上传附件</span>
            <div v-else style="display:flex;gap:6px;flex-wrap:wrap">
              <img v-for="(p, i) in attachPreviews" :key="i" :src="p" class="hw-attach-thumb" />
            </div>
          </div>
          <el-button v-if="attachPreviews.length" size="small" type="danger" text @click="attachPreviews = []; form.attachments = []">清除</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">{{ editingId ? '保存修改' : '布置作业' }}</el-button>
      </template>
    </el-dialog>

    <!-- JSON Export Dialog -->
    <el-dialog v-model="showJsonExport" title="📤 JSON 导出（SpringBoot 对接格式）" width="700px" top="3vh">
      <div style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
        <el-select v-model="jsonExportClass" size="small" placeholder="选择班级" style="width:120px">
          <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
        </el-select>
        <el-date-picker v-model="jsonExportDate" type="date" value-format="YYYY-MM-DD" size="small" style="width:160px" />
        <el-button size="small" @click="generateJsonExport">生成 JSON</el-button>
      </div>
      <div class="hw-json-block" v-if="exportedJson">
        <pre style="margin:0;font-size:11px;line-height:1.6;white-space:pre-wrap;word-break:break-all">{{ exportedJson }}</pre>
      </div>
      <div v-else style="text-align:center;padding:30px;color:var(--admin-text-muted)">请选择班级和日期，点击「生成 JSON」</div>
      <template #footer>
        <el-button @click="showJsonExport = false">关闭</el-button>
        <el-button type="primary" @click="copyJson" :disabled="!exportedJson">📋 复制 JSON</el-button>
      </template>
    </el-dialog>

    <!-- Print Dialog -->
    <el-dialog v-model="showPrintView" title="📋 打印作业通知" width="700px" top="3vh">
      <div id="hw-print-area">
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:16px;font-weight:700;color:var(--admin-text)">{{ store.schoolName }} · 作业通知单</div>
          <div style="font-size:11px;color:var(--admin-text-muted)">{{ filterClass || '全部班级' }} · {{ today }}</div>
        </div>
        <div v-if="printGrouped.classAssignments.length">
          <div style="font-size:13px;font-weight:600;color:var(--admin-text);margin-bottom:8px;border-bottom:1px solid var(--admin-border);padding-bottom:6px">📅 班级统一作业</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
            <thead><tr style="background:var(--admin-bg)"><th style="padding:8px;border:1px solid var(--admin-border)">科目</th><th style="padding:8px;border:1px solid var(--admin-border)">作业内容</th><th style="padding:8px;border:1px solid var(--admin-border)">截止日期</th><th style="padding:8px;border:1px solid var(--admin-border)">完成</th></tr></thead>
            <tbody>
              <tr v-for="g in printGrouped.classAssignments" :key="g.key">
                <td style="padding:6px;border:1px solid var(--admin-border);font-weight:500">{{ g.subject }}</td>
                <td style="padding:6px;border:1px solid var(--admin-border)">{{ g.title }}</td>
                <td style="padding:6px;border:1px solid var(--admin-border)">{{ g.dueDate }}</td>
                <td style="padding:6px;border:1px solid var(--admin-border);text-align:center">{{ g.completedCount }}/{{ g.totalCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="printGrouped.individualAssignments.length">
          <div style="font-size:13px;font-weight:600;color:var(--admin-text);margin-bottom:8px;border-bottom:1px solid var(--admin-border);padding-bottom:6px">👤 个人作业</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="background:var(--admin-bg)"><th style="padding:8px;border:1px solid var(--admin-border)">学生</th><th style="padding:8px;border:1px solid var(--admin-border)">科目</th><th style="padding:8px;border:1px solid var(--admin-border)">作业</th><th style="padding:8px;border:1px solid var(--admin-border)">截止</th></tr></thead>
            <tbody>
              <tr v-for="h in printGrouped.individualAssignments" :key="h.id">
                <td style="padding:6px;border:1px solid var(--admin-border)">{{ h.studentName }}</td>
                <td style="padding:6px;border:1px solid var(--admin-border)">{{ h.subject }}</td>
                <td style="padding:6px;border:1px solid var(--admin-border)">{{ h.title }}</td>
                <td style="padding:6px;border:1px solid var(--admin-border)">{{ h.dueDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!printGrouped.classAssignments.length && !printGrouped.individualAssignments.length" style="text-align:center;padding:20px;color:var(--admin-text-muted)">请先选择班级查看作业</div>
      </div>
      <template #footer>
        <el-button @click="showPrintView = false">关闭</el-button>
        <el-button type="primary" @click="doPrint">🖨️ 打印</el-button>
      </template>
    </el-dialog>

    <!-- Day detail dialog -->
    <el-dialog v-model="dayDialogVisible" :title="`${dayDialogDate} · ${filterClass || ''}班作业详情`" width="560px" top="3vh">
      <div v-if="filterClass && dayDialogDate && getHomeworksForDate(filterClass, dayDialogDate).length">
        <HomeworkCard v-for="h in getHomeworksForDate(filterClass, dayDialogDate)" :key="h.id" :hw="h" :showStudent="true" @edit="openDialog" @delete="handleDelete" />
      </div>
      <div v-else style="text-align:center;padding:20px;color:var(--admin-text-muted)">当日无作业记录</div>
    </el-dialog>

    <!-- Stats -->
    <div class="admin-two-col" style="margin-top:16px">
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📊 作业提交统计</div>
        <div v-for="s in submitStats" :key="s.label" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:12px;width:48px;color:var(--admin-text-secondary)">{{ s.label }}</span>
          <div style="flex:1;height:8px;background:var(--admin-bg);border-radius:4px;overflow:hidden">
            <div :style="{width:s.rate+'%',background:s.color,height:'100%',borderRadius:'4px',transition:'width 0.4s'}"></div>
          </div>
          <span style="font-size:11px;color:var(--admin-text-muted);width:50px;text-align:right">{{ s.count }}人</span>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">⚠️ 未交作业提醒</div>
        <div v-for="d in defaulters.slice(0, 8)" :key="d.studentName + d.title" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--admin-border);font-size:12px">
          <span style="width:20px;text-align:center;color:var(--admin-danger)">●</span>
          <span style="flex:1;color:var(--admin-text)">{{ d.studentName }}</span>
          <span style="color:var(--admin-text-muted)">{{ d.class }}</span>
          <span style="color:var(--admin-text-muted);font-size:11px;text-align:right;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ d.title }}</span>
        </div>
        <div v-if="defaulters.length === 0" style="text-align:center;padding:16px;color:var(--admin-success);font-size:12px">🎉 全部作业已提交</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { homeworkService, studentService, courseService, timetableService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { getWatermarkHTML, getWatermarkStyle } from '@/utils/watermark'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import HomeworkCard from './HomeworkCard.vue'

const store = useAppStore()
const homeworks = ref([])
const studentList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const filterClass = ref('')
const filterSubject = ref('')
const filterStatus = ref('')
const activeView = ref('day')
const showPrintView = ref(false)
const showJsonExport = ref(false)
const dayDialogVisible = ref(false)
const dayDialogDate = ref('')
const monthOffset = ref(0)
const assignMode = ref('single')
const jsonExportClass = ref('')
const jsonExportDate = ref(new Date().toISOString().split('T')[0])
const exportedJson = ref('')

const today = new Date().toISOString().split('T')[0]
const viewTabs = [
  { key: 'day', label: '☀️ 日视图' },
  { key: 'week', label: '📅 周视图' },
  { key: 'month', label: '🗓️ 月视图' }
]

const subjectColorMap = { '数学':'#3b82f6', '中国语文':'#22c55e', '英国语文':'#8b5cf6', 'English Reading':'#8b5cf6', 'English Writing':'#a78bfa', 'English Listening':'#c4b5fd', 'English Speaking':'#ddd6fe', '物理':'#f59e0b', '化学':'#ef4444', '生物':'#10b981', '历史':'#78716c', '地理':'#06b6d4', '经济':'#f97316', '资讯及通讯科技':'#6366f1', '企业、会计与财务概论':'#14b8a6', '视觉艺术':'#ec4899', '体育':'#84cc16', '音乐':'#d946ef', '数学延伸M1':'#60a5fa', '数学延伸M2':'#93c5fd', '公民与社会发展':'#64748b' }
function subjectColor(s) { return subjectColorMap[s] || 'var(--admin-accent)' }
function statusClass(s) { return s === '已提交' ? 'success' : s === '迟交' ? 'warning' : 'danger' }
function statusColor(s) { return s === '已提交' ? 'var(--admin-success)' : s === '迟交' ? 'var(--admin-warning)' : 'var(--admin-danger)' }

const iconMap = { '数学':'📐', '中国语文':'📝', '英国语文':'🔤', 'English Reading':'📖', 'English Writing':'✍️', 'English Listening':'🎧', 'English Speaking':'🗣️', '物理':'⚡', '化学':'🧪', '生物':'🧬', '历史':'📜', '地理':'🌍', '经济':'📈', '资讯及通讯科技':'💻', '企业、会计与财务概论':'📊', '视觉艺术':'🎨', '体育':'⚽', '音乐':'🎵', '数学延伸M1':'📐', '数学延伸M2':'📐', '公民与社会发展':'🏛️' }
function subjectIcon(s) { return iconMap[s] || '📖' }

const subjectList = computed(() => courseService.getAllNames())
const flatSubjectList = computed(() => courseService.getAllNamesFlat())
const classList = computed(() => studentService.getClasses())

const attachInput = ref(null)
const attachPreviews = ref([])

function triggerAttachUpload() { attachInput.value?.click() }
function handleAttachUpload(e) {
  const files = e.target.files
  if (!files.length) return
  Array.from(files).forEach(file => {
    if (file.size > 10 * 1024 * 1024) { ElMessage.warning(`${file.name} 超过10MB限制`); return }
    const reader = new FileReader()
    reader.onload = () => {
      attachPreviews.value.push(reader.result)
      if (!form.value.attachments) form.value.attachments = []
      form.value.attachments.push(reader.result)
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

const form = ref({
  studentId: null, studentIds: [], classTarget: '', title: '', subject: '数学',
  class: '', studentName: '', dueDate: today, content: '', description: '',
  timeRange: '', status: '未提交', submitTime: '', attachments: []
})

onMounted(() => {
  studentList.value = studentService.getAll()
  homeworks.value = homeworkService.getAll()
})

// -- Filters --
const currentPage = ref(1)
const pageSize = ref(12)

const filteredHomeworks = computed(() => {
  return homeworks.value.filter(h => {
    if (filterClass.value && h.class !== filterClass.value) return false
    if (filterSubject.value && h.subject !== filterSubject.value) return false
    if (filterStatus.value && h.status !== filterStatus.value) return false
    return true
  })
})

const totalFilteredHomeworks = computed(() => filteredHomeworks.value.length)

const paginatedHomeworks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredHomeworks.value.slice(start, start + pageSize.value)
})

// -- Day view --
const todayTimetable = computed(() => {
  if (!filterClass.value) return []
  return timetableService.getByDay(today).filter(t => t.class === filterClass.value).sort((a, b) => a.period - b.period)
})

// -- Week view --
const weekDays = computed(() => {
  const d = new Date()
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  const days = []
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    days.push({ label: labels[i], date: date.toISOString().split('T')[0] })
  }
  return days
})

// -- Month view --
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
  for (let i = 0; i < firstDay; i++) cells.push({ label: '', date: null, inMonth: false, key: `empty-${i}` })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ label: d, date, inMonth: true, key: date })
  }
  return cells
})

function getHomeworksForSubject(cls, subject) {
  return homeworks.value.filter(h => h.class === cls && h.subject === subject)
}

function getHomeworksForDate(cls, date) {
  return homeworks.value.filter(h => h.class === cls && h.dueDate === date)
}

function classStudentCount(cls) {
  return studentService.getByClass(cls).length
}

function changeMonth(delta) { monthOffset.value += delta }

function openDayDialog(date) {
  dayDialogDate.value = date
  dayDialogVisible.value = true
}

// -- JSON Export --
function generateJsonExport() {
  if (!jsonExportClass.value) { ElMessage.warning('请选择班级'); return }
  if (!jsonExportDate.value) { ElMessage.warning('请选择日期'); return }
  const hwList = homeworks.value.filter(h => h.class === jsonExportClass.value)
  const subjectMap = new Map()
  hwList.forEach(h => {
    const key = h.subject + '|' + h.title
    if (!subjectMap.has(key)) {
      subjectMap.set(key, {
        subject: h.subject, title: h.title, description: h.description || h.content || '',
        dueDate: h.dueDate, timeRange: h.timeRange || '', status: h.status,
        submitted: 0, total: 0, lateCount: 0
      })
    }
    const entry = subjectMap.get(key)
    entry.total++
    if (h.status === '已提交') entry.submitted++
    if (h.status === '迟交') entry.lateCount++
  })
  const output = {
    classId: jsonExportClass.value,
    date: jsonExportDate.value,
    assignments: [...subjectMap.values()].map(e => ({
      subject: e.subject,
      title: e.title,
      description: e.description,
      dueDate: e.dueDate,
      timeRange: e.timeRange,
      status: e.status === '已提交' ? 'completed' : 'active',
      completion: { submitted: e.submitted, total: e.total, lateCount: e.lateCount }
    })),
    generatedAt: new Date().toISOString()
  }
  exportedJson.value = JSON.stringify(output, null, 2)
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(exportedJson.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动选择复制')
  }
}

// -- Print --
const printGrouped = computed(() => {
  if (!filterClass.value) return { classAssignments: [], individualAssignments: [] }
  const todayHw = homeworks.value.filter(h => h.class === filterClass.value && h.dueDate === today)
  const groupMap = new Map()
  todayHw.forEach(h => {
    const key = `${h.subject}|${h.title}|${h.dueDate}`
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key).push(h)
  })
  const classAssignments = []
  const individualAssignments = []
  groupMap.forEach((items, key) => {
    if (items.length >= 3) {
      const submitted = items.filter(h => h.status === '已提交').length
      classAssignments.push({ key, subject: items[0].subject, title: items[0].title, dueDate: items[0].dueDate, studentCount: items.length, completedCount: submitted, totalCount: items.length })
    } else {
      individualAssignments.push(...items)
    }
  })
  return { classAssignments, individualAssignments }
})

function doPrint() {
  const area = document.getElementById('hw-print-area')
  if (!area) return
  const w = window.open('', '_blank', 'width=700,height=600')
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>作业通知单</title><style>
    body{font-family:'Microsoft YaHei',sans-serif;padding:20px;color:#333}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{padding:8px;border:1px solid #ddd;text-align:left}
    th{background:#f5f5f5}
    @page{size:A4;margin:15mm}
    ${getWatermarkStyle()}
  </style></head><body>${area.innerHTML}${getWatermarkHTML()}</body></html>`)
  w.document.close()
  w.print()
}

// -- Assign --
function onAssignModeChange() {
  form.value.studentId = null
  form.value.studentIds = []
  form.value.classTarget = ''
}

function onClassTargetChange() {
  form.value.class = form.value.classTarget
  form.value.studentName = ''
}

function onStudentSelect() {
  const s = studentList.value.find(s => s.id === form.value.studentId)
  if (s) { form.value.studentName = s.name; form.value.class = s.class }
}

function openAssignDialog(studentId) {
  editingId.value = null
  assignMode.value = studentId ? 'single' : 'single'
  form.value = { studentId: studentId || null, studentIds: [], classTarget: '', title: '', subject: '数学', class: '', studentName: '', dueDate: today, content: '', description: '', timeRange: '', status: '未提交', submitTime: '', attachments: [] }
  attachPreviews.value = []
  if (studentId) {
    const s = studentList.value.find(s => s.id === studentId)
    if (s) { form.value.studentName = s.name; form.value.class = s.class }
  }
  dialogVisible.value = true
}

function openDialog(hw) {
  if (hw) {
    editingId.value = hw.id
    assignMode.value = 'single'
    form.value = { ...hw, studentId: hw.studentId, studentIds: [], classTarget: '', description: hw.description || '', timeRange: hw.timeRange || '', attachments: hw.attachments || [] }
    attachPreviews.value = hw.attachments || []
  } else {
    openAssignDialog(null)
  }
  dialogVisible.value = true
}

function saveRecord() {
  if (!form.value.title) { ElMessage.warning('请输入作业标题'); return }

  if (assignMode.value === 'single') {
    if (!form.value.studentId) { ElMessage.warning('请选择学生'); return }
    saveOne(form.value.studentId)
  } else if (assignMode.value === 'multiple') {
    if (!form.value.studentIds.length) { ElMessage.warning('请选择至少一个学生'); return }
    form.value.studentIds.forEach(id => saveOne(id))
  } else if (assignMode.value === 'class') {
    if (!form.value.classTarget) { ElMessage.warning('请选择班级'); return }
    const students = studentService.getByClass(form.value.classTarget)
    if (!students.length) { ElMessage.warning('该班级无学生'); return }
    students.forEach(s => saveOne(s.id))
  }

  dialogVisible.value = false
  homeworks.value = homeworkService.getAll()
}

function saveOne(studentId) {
  const s = studentList.value.find(s => s.id === studentId)
  if (!s) return
  const data = {
    studentId: s.id, studentName: s.name, class: s.class,
    title: form.value.title, subject: form.value.subject, dueDate: form.value.dueDate,
    content: form.value.content, description: form.value.description || '',
    timeRange: form.value.timeRange || '',
    status: '未提交', submitTime: null, assignDate: today,
    attachments: form.value.attachments || [],
    completedCount: 0, totalCount: 0
  }
  if (editingId.value) {
    data.status = form.value.status
    homeworkService.update(editingId.value, data)
  } else {
    homeworkService.create(data)
  }
}

function generateFromTimetable() {
  if (!filterClass.value) { ElMessage.warning('请先选择班级'); return }
  const tt = timetableService.getByDay(today).filter(t => t.class === filterClass.value)
  if (tt.length === 0) { ElMessage.warning('今日该班级无课程安排'); return }
  const students = studentService.getByClass(filterClass.value)
  if (students.length === 0) { ElMessage.warning('该班级无学生'); return }
  let created = 0
  tt.forEach(t => {
    students.forEach(s => {
      homeworkService.create({
        studentId: s.id, studentName: s.name, class: s.class,
        subject: t.subject, title: `${t.subject}课后练习`,
        dueDate: today, content: `根据第${t.period}节${t.subject}课程内容布置`,
        description: '', timeRange: '', status: '未提交', submitTime: null,
        assignDate: today, attachments: [], completedCount: 0, totalCount: students.length
      })
      created++
    })
  })
  homeworks.value = homeworkService.getAll()
  ElMessage.success(`已为 ${students.length} 名学生生成 ${tt.length} 门课的作业（共 ${created} 条）`)
}

function quickAssign(t) {
  assignMode.value = 'class'
  form.value = {
    studentId: null, studentIds: [], classTarget: filterClass.value,
    title: '', subject: t.subject, class: filterClass.value, studentName: '',
    dueDate: today, content: `第${t.period}节${t.subject}随堂作业`,
    description: '', timeRange: '', status: '未提交', submitTime: '', attachments: []
  }
  editingId.value = null
  attachPreviews.value = []
  dialogVisible.value = true
}

async function handleDelete(hw) {
  try {
    await ElMessageBox.confirm(`确定删除作业「${hw.title}」吗？`, '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    homeworkService.delete(hw.id)
    homeworks.value = homeworkService.getAll()
    ElMessage.success('已删除')
  } catch {}
}

// -- Stats --
const submitStats = computed(() => {
  const list = homeworks.value
  const submitted = list.filter(h => h.status === '已提交').length
  const pending = list.filter(h => h.status === '未提交').length
  const late = list.filter(h => h.status === '迟交').length
  const total = list.length || 1
  return [
    { label: '已提交', count: submitted, rate: Math.round(submitted / total * 100), color: 'var(--admin-success)' },
    { label: '未提交', count: pending, rate: Math.round(pending / total * 100), color: 'var(--admin-danger)' },
    { label: '迟交', count: late, rate: Math.round(late / total * 100), color: 'var(--admin-warning)' }
  ]
})

const defaulters = computed(() => homeworks.value.filter(h => h.status === '未提交'))
</script>

<style scoped>
.hw-view-tab { padding: 5px 16px; border: 1px solid var(--admin-border); background: var(--admin-surface); border-radius: 20px; font-size: 12px; cursor: pointer; color: var(--admin-text-muted); transition: all 0.2s; }
.hw-view-tab.active { background: var(--admin-primary); color: #fff; border-color: var(--admin-primary); }

.hw-day-period { background: var(--admin-bg); border-radius: 8px; padding: 8px 0; margin-bottom: 8px; }
.hw-period-header { display: flex; align-items: center; gap: 10px; padding: 0 12px 6px; border-bottom: 1px solid var(--admin-border); }
.hw-period-badge { background: var(--admin-accent); color: #1a2e3c; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }

.hw-card-list { display: flex; flex-direction: column; gap: 8px; }

.hw-week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; min-height: 300px; }
.hw-week-col { background: var(--admin-bg); border-radius: 8px; padding: 6px; }
.hw-week-col.today { border: 2px solid var(--admin-primary); }
.hw-week-col-header { text-align: center; font-size: 12px; font-weight: 600; color: var(--admin-text); padding: 4px 0; border-bottom: 1px solid var(--admin-border); margin-bottom: 4px; display: flex; flex-direction: column; }
.hw-card-week { background: var(--admin-surface); border-radius: 6px; padding: 6px 8px; margin-bottom: 4px; border: 1px solid var(--admin-border); display: flex; flex-direction: column; gap: 2px; cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden; }
.hw-card-week:hover { border-color: var(--admin-accent); box-shadow: 0 1px 6px rgba(0,0,0,0.06); }
.hw-card-strip { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: 3px 0 0 3px; }

.hw-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.hw-cal-header { text-align: center; font-size: 11px; font-weight: 600; color: var(--admin-text-muted); padding: 6px 0; }
.hw-cal-cell { aspect-ratio: 1; background: var(--admin-bg); border-radius: 6px; padding: 4px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.hw-cal-cell:hover { background: var(--admin-border); }
.hw-cal-cell.today { border: 2px solid var(--admin-primary); }
.hw-cal-cell.other { opacity: 0.3; pointer-events: none; }
.hw-cal-date { font-size: 11px; font-weight: 500; color: var(--admin-text); }
.hw-cal-dots { display: flex; gap: 2px; }
.hw-cal-dot { width: 5px; height: 5px; border-radius: 50%; }

.hw-json-block { background: var(--admin-bg); border: 1px solid var(--admin-border); border-radius: 8px; padding: 16px; max-height: 400px; overflow: auto; }

.hw-attach-zone {
  width: 100%; min-height: 44px; border: 2px dashed var(--admin-border);
  border-radius: 8px; display: flex; align-items: center;
  justify-content: center; cursor: pointer; padding: 8px; transition: border-color 0.2s;
}
.hw-attach-zone:hover { border-color: var(--admin-accent); }
.hw-attach-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--admin-border); }

@media (max-width: 768px) {
  .hw-week-grid { grid-template-columns: repeat(4, 1fr); }
}
</style>
