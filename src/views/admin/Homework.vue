<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📝 作业追踪</div>
          <div class="admin-card-subtitle">作业提交统计 · 未交作业提醒 · 核心/选修分类追踪</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-button size="small" type="primary" @click="exportTable" :loading="exporting">
            {{ exporting ? '导出中...' : '🖨️ 导出A4打印' }}
          </el-button>
        </div>
      </div>

      <!-- Filters -->
      <div class="hw-track-filters">
        <div class="hw-filter-row">
          <el-select v-model="trackClass" size="small" placeholder="班级" style="width:100px" clearable>
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-select v-model="trackSubject" size="small" placeholder="科目" style="width:130px" clearable>
            <el-option-group label="核心科目">
              <el-option v-for="s in coreSubjects" :key="s" :label="s" :value="s" />
            </el-option-group>
            <el-option-group label="选修科目">
              <el-option v-for="s in electiveSubjects" :key="s" :label="s" :value="s" />
            </el-option-group>
          </el-select>
          <el-select v-model="trackStatus" size="small" placeholder="作业状态" style="width:130px" clearable>
            <el-option v-for="s in allHwStatuses" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="trackSubmitFilter" size="small" placeholder="提交状态" style="width:110px" clearable>
            <el-option label="已提交" value="已提交" />
            <el-option label="未提交" value="未提交" />
            <el-option label="已批改" value="已批改" />
          </el-select>
          <el-input v-model="trackSearch" size="small" placeholder="搜索学生姓名…" style="width:160px" clearable />
        </div>
        <div class="hw-filter-meta">
          共 {{ trackedHomeworks.length }} 条 · 核心: {{ coreSubjects.join('、') }} · 选修: {{ electiveSubjects.join('、') }}
        </div>
      </div>

      <!-- Tracking Table -->
      <div class="hw-track-table-wrap">
        <el-watermark v-if="elWmProps" v-bind="elWmProps" style="width:100%">
          <el-table :data="trackedHomeworks" border stripe size="small" style="width:100%;font-size:11px"
          :span-method="trackSpanMethod" :row-class-name="trackRowClassName" max-height="520">
          <el-table-column prop="seq" label="序号" width="46" align="center" fixed="left" />
          <el-table-column prop="subject" label="科目" width="95" fixed="left">
            <template #default="{ row }">
              <span :style="{color: subjectColor(row.subject), fontWeight:600}">{{ row.subject }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="studentName" label="学生姓名" width="78" fixed="left" />
          <el-table-column prop="title" label="作业内容" min-width="150" show-overflow-tooltip />
          <el-table-column prop="submitStatus" label="是否提交" width="88" align="center">
            <template #default="{ row }">
              <span :style="{color: row.submitStatus === '已提交' ? 'var(--admin-success)' : row.submitStatus === '未提交' ? 'var(--admin-danger)' : 'var(--admin-text-muted)'}">{{ row.submitStatus || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quality" label="完成质量" width="95" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.quality" size="small" :type="row.quality === '优秀' ? 'success' : row.quality === '良好' ? 'primary' : row.quality === '一般' ? 'warning' : 'info'" effect="plain">{{ row.quality }}</el-tag>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="accuracy" label="正确率" width="78" align="center">
            <template #default="{ row }">
              <span v-if="row.accuracy != null" :style="{color: row.accuracy >= 80 ? 'var(--admin-success)' : row.accuracy >= 60 ? 'var(--admin-warning)' : 'var(--admin-danger)', fontWeight:600}">{{ row.accuracy }}%</span>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="errorSummary" label="错题总结" min-width="130" show-overflow-tooltip />
          <el-table-column prop="teacherComment" label="教师点评" min-width="130" show-overflow-tooltip />
          <el-table-column prop="movedToTA" label="搬到助教" width="88" align="center">
            <template #default="{ row }">
              <span v-if="row.movedToTA === true" style="color:var(--admin-primary)">✓</span>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="retrieved" label="已领回" width="78" align="center">
            <template #default="{ row }">
              <span v-if="row.retrieved === true" style="color:var(--admin-success)">✓</span>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="作业状态" width="115" fixed="right" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="hwStatusTagType(row.status)" effect="dark">{{ row.status || '—' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="84" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="openTrackingEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        </el-watermark>
        <template v-else>
          <el-table :data="trackedHomeworks" border stripe size="small" style="width:100%;font-size:11px"
          :span-method="trackSpanMethod" :row-class-name="trackRowClassName" max-height="520">
          <el-table-column prop="seq" label="序号" width="46" align="center" fixed="left" />
          <el-table-column prop="subject" label="科目" width="95" fixed="left">
            <template #default="{ row }">
              <span :style="{color: subjectColor(row.subject), fontWeight:600}">{{ row.subject }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="studentName" label="学生姓名" width="78" fixed="left" />
          <el-table-column prop="title" label="作业内容" min-width="150" show-overflow-tooltip />
          <el-table-column prop="submitStatus" label="是否提交" width="88" align="center">
            <template #default="{ row }">
              <span :style="{color: row.submitStatus === '已提交' ? 'var(--admin-success)' : row.submitStatus === '未提交' ? 'var(--admin-danger)' : 'var(--admin-text-muted)'}">{{ row.submitStatus || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="quality" label="完成质量" width="95" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.quality" size="small" :type="row.quality === '优秀' ? 'success' : row.quality === '良好' ? 'primary' : row.quality === '一般' ? 'warning' : 'info'" effect="plain">{{ row.quality }}</el-tag>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="accuracy" label="正确率" width="78" align="center">
            <template #default="{ row }">
              <span v-if="row.accuracy != null" :style="{color: row.accuracy >= 80 ? 'var(--admin-success)' : row.accuracy >= 60 ? 'var(--admin-warning)' : 'var(--admin-danger)', fontWeight:600}">{{ row.accuracy }}%</span>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="errorSummary" label="错题总结" min-width="130" show-overflow-tooltip />
          <el-table-column prop="teacherComment" label="教师点评" min-width="130" show-overflow-tooltip />
          <el-table-column prop="movedToTA" label="搬到助教" width="88" align="center">
            <template #default="{ row }">
              <span v-if="row.movedToTA === true" style="color:var(--admin-primary)">✓</span>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="retrieved" label="已领回" width="78" align="center">
            <template #default="{ row }">
              <span v-if="row.retrieved === true" style="color:var(--admin-success)">✓</span>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="作业状态" width="115" fixed="right" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="hwStatusTagType(row.status)" effect="dark">{{ row.status || '—' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="84" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="openTrackingEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        </template>
        <div class="hw-pagination" style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:11px;color:var(--admin-text-muted)">共 {{ trackedHomeworks.length }} 条记录</span>
          <el-pagination v-model:current-page="hwCurrentPage" v-model:page-size="hwPageSize" :page-sizes="[10,15,20,50]" :total="trackedHomeworks.length" layout="total, sizes, prev, pager, next, jumper" size="small" background />
        </div>
      </div>

      <!-- Hidden A4 Export Container -->
      <div class="hw-export-hidden" aria-hidden="true">
        <div id="hwExportContainer" class="hw-export-container">
          <div v-html="watermarkOverlayHTML"></div>
          <div class="hw-export-header">
            <h1>{{ store.schoolName }} · 作业追踪表</h1>
            <div class="hw-export-meta">
              <span>班级：{{ trackClass || '全部' }}</span>
              <span>科目：{{ trackSubject || '全部' }}</span>
              <span>状态：{{ trackStatus || '全部' }}</span>
              <span>导出日期：{{ today }}</span>
            </div>
          </div>
          <el-table
            :data="trackedHomeworks"
            border
            size="small"
            style="width:100%;font-size:12px"
            :span-method="trackSpanMethod"
            :row-class-name="trackRowClassName"
          >
            <el-table-column prop="seq" label="序号" width="52" align="center" />
            <el-table-column prop="subject" label="科目" width="105" align="center">
              <template #default="{ row }">
                <span :style="{color: '#333', fontWeight:700}">{{ row.subject }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="studentName" label="学生姓名" width="85" />
            <el-table-column prop="title" label="作业内容" min-width="150" show-overflow-tooltip />
            <el-table-column prop="submitStatus" label="是否提交" width="88" align="center">
              <template #default="{ row }">
                <span :style="{color: row.submitStatus === '已提交' ? '#16a34a' : row.submitStatus === '未提交' ? '#dc2626' : '#888'}">{{ row.submitStatus || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="quality" label="完成质量" width="95" align="center">
              <template #default="{ row }">
                <span v-if="row.quality" :style="{color: row.quality === '优秀' ? '#16a34a' : row.quality === '良好' ? '#2563eb' : row.quality === '一般' ? '#d97706' : '#888'}">{{ row.quality }}</span>
                <span v-else style="color:#888">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="accuracy" label="正确率" width="78" align="center">
              <template #default="{ row }">
                <span v-if="row.accuracy != null" :style="{color: row.accuracy >= 80 ? '#16a34a' : row.accuracy >= 60 ? '#d97706' : '#dc2626', fontWeight:600}">{{ row.accuracy }}%</span>
                <span v-else style="color:#888">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="errorSummary" label="错题总结" min-width="130" show-overflow-tooltip />
            <el-table-column prop="teacherComment" label="教师点评" min-width="130" show-overflow-tooltip />
            <el-table-column prop="movedToTA" label="搬到助教" width="88" align="center">
              <template #default="{ row }">
                <span v-if="row.movedToTA === true" style="color:#2563eb">✓</span>
                <span v-else style="color:#888">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="retrieved" label="已领回" width="78" align="center">
              <template #default="{ row }">
                <span v-if="row.retrieved === true" style="color:#16a34a">✓</span>
                <span v-else style="color:#888">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="作业状态" width="115" align="center">
              <template #default="{ row }">
                <span :style="{color: hwStatusTagColor(row.status), fontWeight:600}">{{ row.status || '—' }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="hw-export-footer">
            <span>{{ store.schoolName }} · 作业追踪系统</span>
            <span>共 {{ trackedHomeworks.length }} 条记录</span>
          </div>
        </div>
      </div>

      <!-- Tracking Edit Dialog -->
      <el-dialog v-model="trackEditVisible" title="📝 编辑作业追踪" width="580px" top="3vh">
        <div class="hw-edit-summary">
          {{ trackEditForm.studentName }} · {{ trackEditForm.subject }} · {{ trackEditForm.title }}
        </div>
        <div class="admin-two-col">
          <div class="admin-form-group">
            <label>作业状态</label>
            <el-select v-model="trackEditForm.status" style="width:100%">
              <el-option v-for="s in allHwStatuses" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>是否提交</label>
            <el-select v-model="trackEditForm.submitStatus" style="width:100%" clearable>
              <el-option label="已提交" value="已提交" />
              <el-option label="未提交" value="未提交" />
              <el-option label="已批改" value="已批改" />
            </el-select>
          </div>
        </div>
        <div class="admin-two-col">
          <div class="admin-form-group">
            <label>完成质量</label>
            <el-select v-model="trackEditForm.quality" style="width:100%" clearable>
              <el-option label="优秀" value="优秀" />
              <el-option label="良好" value="良好" />
              <el-option label="一般" value="一般" />
              <el-option label="待提升" value="待提升" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>正确率 (%)</label>
            <el-input-number v-model="trackEditForm.accuracy" :min="0" :max="100" size="small" style="width:100%" />
          </div>
        </div>
        <div class="admin-form-group">
          <label>错题总结</label>
          <el-input v-model="trackEditForm.errorSummary" type="textarea" :rows="2" placeholder="总结错误类型和薄弱知识点…" />
        </div>
        <div class="admin-form-group">
          <label>教师点评</label>
          <el-input v-model="trackEditForm.teacherComment" type="textarea" :rows="2" placeholder="对作业的点评和改进建议…" />
        </div>
        <div class="admin-two-col">
          <div class="admin-form-group">
            <label>是否搬到助教</label>
            <el-switch v-model="trackEditForm.movedToTA" />
          </div>
          <div class="admin-form-group">
            <label>是否已经领回</label>
            <el-switch v-model="trackEditForm.retrieved" />
          </div>
        </div>
        <template #footer>
          <el-button @click="trackEditVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTrackingEdit">保存</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- Stats Row -->
    <div class="admin-two-col" style="margin-top:16px">
      <!-- Submit Stats -->
      <div class="admin-card hw-stats-card">
        <div class="hw-stats-header">📊 作业提交统计</div>
        <div class="hw-stats-body">
          <div v-for="s in submitStats" :key="s.label" class="hw-stats-row">
            <span class="hw-stats-label">{{ s.label }}</span>
            <div class="hw-stats-bar-bg">
              <div class="hw-stats-bar-fill" :style="{width: s.rate + '%', background: s.color}"></div>
            </div>
            <span class="hw-stats-count">{{ s.count }}人</span>
          </div>
        </div>
      </div>

      <!-- Defaulter Reminder -->
      <div class="admin-card hw-defaulter-card">
        <div class="hw-stats-header">⚠️ 未交作业提醒</div>
        <div class="hw-defaulter-body">
          <div v-for="d in defaulters.slice(0, 8)" :key="d.studentName + d.title" class="hw-defaulter-row">
            <span class="hw-defaulter-dot">●</span>
            <span class="hw-defaulter-name">{{ d.studentName }}</span>
            <span class="hw-defaulter-class">{{ d.class }}</span>
            <span class="hw-defaulter-title">{{ d.title }}</span>
          </div>
          <div v-if="defaulters.length === 0" class="hw-defaulter-empty">🎉 全部作业已提交</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { homeworkService, studentService, courseService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { getOverlayWatermarkHTML, getElWatermarkProps } from '@/utils/printTemplate'

const store = useAppStore()
const homeworks = ref([])
const studentList = ref([])
const exporting = ref(false)

// Tracking filters
const trackClass = ref('')
const trackSubject = ref('')
const trackStatus = ref('')
const trackSubmitFilter = ref('')
const trackSearch = ref('')
const hwCurrentPage = ref(1)
const hwPageSize = ref(15)
const trackEditVisible = ref(false)
const trackEditForm = ref({})

// Core vs Elective subjects
const coreSubjects = ['中国语文', '英国语文', '数学', '公民与社会发展']
const electiveSubjects = computed(() => flatSubjectList.value.filter(s => !coreSubjects.includes(s)))

const allHwStatuses = ['已完成', '未完成', '部分完成', '未到截止时间', '已提交', '未提交', '已批改', '书籍/作业丢失']

const today = new Date().toISOString().split('T')[0]
const watermarkOverlayHTML = computed(() => getOverlayWatermarkHTML())
const elWmProps = computed(() => getElWatermarkProps())

const subjectColorMap = { '数学':'#3b82f6', '中国语文':'#22c55e', '英国语文':'#8b5cf6', 'English Reading':'#8b5cf6', 'English Writing':'#a78bfa', 'English Listening':'#c4b5fd', 'English Speaking':'#ddd6fe', '物理':'#f59e0b', '化学':'#ef4444', '生物':'#10b981', '历史':'#78716c', '地理':'#06b6d4', '经济':'#f97316', '资讯及通讯科技':'#6366f1', '企业、会计与财务概论':'#14b8a6', '视觉艺术':'#ec4899', '体育':'#84cc16', '音乐':'#d946ef', '数学延伸M1':'#60a5fa', '数学延伸M2':'#93c5fd', '公民与社会发展':'#64748b' }
function subjectColor(s) { return subjectColorMap[s] || 'var(--admin-accent)' }

const flatSubjectList = computed(() => courseService.getAllNamesFlat())
const classList = computed(() => studentService.getClasses())

onMounted(() => {
  studentList.value = studentService.getAll()
  homeworks.value = homeworkService.getAll()
})

// Stats
const submitStats = computed(() => {
  const list = homeworks.value
  const total = list.length || 1
  const groups = {}
  list.forEach(h => {
    const s = h.status || '未知'
    groups[s] = (groups[s] || 0) + 1
  })
  const statusColors = {
    '已完成': 'var(--admin-success)', '已提交': 'var(--admin-success)', '已批改': 'var(--admin-primary)',
    '未完成': 'var(--admin-danger)', '未提交': 'var(--admin-danger)', '书籍/作业丢失': 'var(--admin-danger)',
    '部分完成': 'var(--admin-warning)', '迟交': 'var(--admin-warning)',
    '未到截止时间': 'var(--admin-info)'
  }
  return Object.entries(groups).map(([label, count]) => ({
    label, count, rate: Math.round(count / total * 100),
    color: statusColors[label] || 'var(--admin-text-muted)'
  })).sort((a, b) => b.count - a.count)
})

const defaulters = computed(() => homeworks.value.filter(h => h.status === '未提交' || h.status === '未完成'))

// Tracking Table
const trackedHomeworks = computed(() => {
  let list = [...homeworks.value]

  if (trackClass.value) list = list.filter(h => h.class === trackClass.value)
  if (trackSubject.value) list = list.filter(h => h.subject === trackSubject.value)
  if (trackStatus.value) list = list.filter(h => h.status === trackStatus.value)
  if (trackSubmitFilter.value) list = list.filter(h => (h.submitStatus || '') === trackSubmitFilter.value)
  if (trackSearch.value) {
    const kw = trackSearch.value.toLowerCase()
    list = list.filter(h => (h.studentName || '').toLowerCase().includes(kw))
  }

  list.sort((a, b) => {
    const sa = a.subject || ''
    const sb = b.subject || ''
    if (sa !== sb) return sa.localeCompare(sb)
    const na = a.studentName || ''
    const nb = b.studentName || ''
    if (na !== nb) return na.localeCompare(nb)
    return (a.title || '').localeCompare(b.title || '')
  })

  return list.map((h, i) => ({ ...h, seq: i + 1 }))
})

function trackSpanMethod({ row, column, rowIndex }) {
  const list = trackedHomeworks.value

  if (column.property === 'subject') {
    if (rowIndex === 0 || row.subject !== list[rowIndex - 1].subject) {
      let count = 1
      for (let i = rowIndex + 1; i < list.length && list[i].subject === row.subject; i++) count++
      return { rowspan: count, colspan: 1 }
    }
    return { rowspan: 0, colspan: 0 }
  }

  if (column.property === 'title') {
    if (rowIndex === 0 || row.title !== list[rowIndex - 1].title || row.subject !== list[rowIndex - 1].subject) {
      let count = 1
      for (let i = rowIndex + 1; i < list.length && list[i].title === row.title && list[i].subject === row.subject; i++) count++
      return { rowspan: count, colspan: 1 }
    }
    return { rowspan: 0, colspan: 0 }
  }

  return { rowspan: 1, colspan: 1 }
}

function trackRowClassName({ row }) {
  if (row.status === '未提交' && (!row.submitStatus || row.submitStatus === '未提交')) return 'hw-track-row-danger'
  if (row.movedToTA && !row.retrieved) return 'hw-track-row-warning'
  return ''
}

function hwStatusTagType(status) {
  const map = {
    '已完成': 'success', '未完成': 'danger', '部分完成': 'warning',
    '未到截止时间': 'info', '已提交': 'success', '未提交': 'danger',
    '已批改': 'primary', '书籍/作业丢失': 'danger'
  }
  return map[status] || 'info'
}

function hwStatusTagColor(status) {
  const map = {
    '已完成': '#16a34a', '未完成': '#dc2626', '部分完成': '#d97706',
    '未到截止时间': '#0891b2', '已提交': '#16a34a', '未提交': '#dc2626',
    '已批改': '#2563eb', '书籍/作业丢失': '#dc2626'
  }
  return map[status] || '#888'
}

function openTrackingEdit(row) {
  trackEditForm.value = {
    id: row.id,
    studentName: row.studentName,
    subject: row.subject,
    title: row.title,
    status: row.status || '未提交',
    submitStatus: row.submitStatus || '',
    quality: row.quality || '',
    accuracy: row.accuracy != null ? row.accuracy : null,
    errorSummary: row.errorSummary || '',
    teacherComment: row.teacherComment || '',
    movedToTA: row.movedToTA || false,
    retrieved: row.retrieved || false
  }
  trackEditVisible.value = true
}

function saveTrackingEdit() {
  const data = { ...trackEditForm.value }
  if (data.id) {
    const existing = homeworks.value.find(h => h.id === data.id)
    if (existing) {
      const merged = { ...existing }
      merged.status = data.status
      merged.submitStatus = data.submitStatus
      merged.quality = data.quality
      merged.accuracy = data.accuracy
      merged.errorSummary = data.errorSummary
      merged.teacherComment = data.teacherComment
      merged.movedToTA = data.movedToTA
      merged.retrieved = data.retrieved
      homeworkService.update(data.id, merged)
    }
  }
  trackEditVisible.value = false
  homeworks.value = homeworkService.getAll()
  ElMessage.success('追踪信息已保存')
}

async function exportTable() {
  exporting.value = true
  try {
    await new Promise(r => setTimeout(r, 300))
    const el = document.getElementById('hwExportContainer')
    if (!el) { ElMessage.warning('导出容器未找到'); exporting.value = false; return }
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight
    })
    const link = document.createElement('a')
    link.download = `作业追踪表_${today}_${trackClass.value || '全部班级'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('作业表已导出为高清A4图片')
  } catch (e) {
    ElMessage.error('导出失败，请重试')
  }
  exporting.value = false
}
</script>

<style scoped>
/* Filters */
.hw-track-filters {
  background: var(--admin-bg);
  border-radius: var(--admin-radius);
  padding: 14px 16px;
  margin-bottom: 14px;
}

.hw-filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.hw-filter-meta {
  font-size: 11px;
  color: var(--admin-text-muted);
  margin-top: 8px;
}

/* Table */
.hw-track-table-wrap {
  border-radius: var(--admin-radius);
  overflow: hidden;
  border: 1px solid var(--admin-border);
}

/* Row highlights */
:deep(.hw-track-row-danger) { background: rgba(240,72,72,0.06) !important; }
:deep(.hw-track-row-warning) { background: rgba(246,168,33,0.06) !important; }

/* Edit summary */
.hw-edit-summary {
  font-size: 12px;
  color: var(--admin-text-muted);
  margin-bottom: 14px;
  padding: 8px 12px;
  background: var(--admin-bg);
  border-radius: 6px;
}

/* Stats Card */
.hw-stats-card {
  /* uses admin-card */
}

.hw-stats-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
  margin-bottom: 14px;
}

.hw-stats-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hw-stats-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hw-stats-label {
  font-size: 12px;
  color: var(--admin-text-secondary);
  width: 52px;
  flex-shrink: 0;
}

.hw-stats-bar-bg {
  flex: 1;
  height: 8px;
  background: var(--admin-bg);
  border-radius: 4px;
  overflow: hidden;
}

.hw-stats-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.hw-stats-count {
  font-size: 11px;
  color: var(--admin-text-muted);
  width: 44px;
  text-align: right;
  flex-shrink: 0;
}

/* Defaulter Card */
.hw-defaulter-card {
  /* uses admin-card */
}

.hw-defaulter-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hw-defaulter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 0;
  border-bottom: 1px solid var(--admin-border);
  font-size: 12px;
}

.hw-defaulter-row:last-child {
  border-bottom: none;
}

.hw-defaulter-dot {
  width: 20px;
  text-align: center;
  color: var(--admin-danger);
  flex-shrink: 0;
}

.hw-defaulter-name {
  color: var(--admin-text);
  font-weight: 500;
  flex-shrink: 0;
}

.hw-defaulter-class {
  color: var(--admin-text-muted);
  flex-shrink: 0;
}

.hw-defaulter-title {
  color: var(--admin-text-muted);
  font-size: 11px;
  text-align: right;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hw-defaulter-empty {
  text-align: center;
  padding: 20px;
  color: var(--admin-success);
  font-size: 13px;
}

/* A4 Export Container (hidden offscreen) */
.hw-export-hidden {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 1400px;
  z-index: -1;
}

.hw-export-container {
  background: #ffffff;
  padding: 28px 24px 24px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #222;
  box-sizing: border-box;
}

.hw-export-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #333;
}

.hw-export-header h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #111;
  letter-spacing: 2px;
}

.hw-export-meta {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 12px;
  color: #555;
  flex-wrap: wrap;
}

/* Export el-table styling — clear borders for A4 print */
.hw-export-container :deep(.el-table) {
  border: 1px solid #333 !important;
}

.hw-export-container :deep(.el-table th.el-table__cell) {
  background: #f0f0f0 !important;
  color: #111 !important;
  font-weight: 700 !important;
  border-right: 1px solid #555 !important;
  border-bottom: 2px solid #333 !important;
  font-size: 12px !important;
}

.hw-export-container :deep(.el-table td.el-table__cell) {
  border-right: 1px solid #555 !important;
  border-bottom: 1px solid #555 !important;
  color: #222 !important;
  font-size: 11px !important;
}

.hw-export-container :deep(.el-table__row:nth-child(even) td) {
  background: #fafafa !important;
}

.hw-export-container :deep(.hw-track-row-danger) {
  background: rgba(220, 38, 38, 0.06) !important;
}

.hw-export-container :deep(.hw-track-row-warning) {
  background: rgba(217, 119, 6, 0.06) !important;
}

.hw-export-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid #ccc;
  font-size: 10px;
  color: #888;
}

@media (max-width: 768px) {
  .hw-filter-row { flex-direction: column; }
  .hw-defaulter-row { flex-wrap: wrap; }
  .hw-defaulter-title { max-width: 100%; }
}
</style>
