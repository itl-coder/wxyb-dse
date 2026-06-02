<template>
  <div class="hw-page">
    <!-- 顶部标题栏 -->
    <div class="hw-top-bar">
      <div>
        <div class="hw-top-title">作业管理</div>
      </div>
    </div>

    <!-- 水平筛选栏 + 快速统计 -->
    <div class="hw-filter-bar">
      <div class="hw-filter-row">
        <el-select v-model="filterClass" size="small" placeholder="班级" clearable style="width:120px">
          <el-option v-for="c in shared.classList.value" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filterSubject" size="small" placeholder="科目" clearable style="width:120px">
          <el-option-group label="核心">
            <el-option v-for="s in shared.coreSubjects" :key="s" :label="s" :value="s" />
          </el-option-group>
          <el-option-group label="选修">
            <el-option v-for="s in shared.electiveSubjects.value" :key="s" :label="s" :value="s" />
          </el-option-group>
        </el-select>
        <el-select v-model="filterStatus" size="small" placeholder="作业状态" clearable style="width:120px">
          <el-option v-for="s in shared.allHwStatuses" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-model="filterSubmit" size="small" placeholder="提交状态" clearable style="width:110px">
          <el-option label="已提交" value="已提交" />
          <el-option label="未提交" value="未提交" />
          <el-option label="已批改" value="已批改" />
        </el-select>
        <el-input v-model="filterSearch" size="small" placeholder="搜索学生姓名…" clearable style="width:160px" />
        <div class="hw-filter-stats">
          <span class="hw-fs-item">共 <b>{{ filteredList.length }}</b> 条</span>
          <span class="hw-fs-item" style="color:var(--admin-success)">已提交 <b>{{ submittedCount }}</b></span>
          <span class="hw-fs-item" style="color:var(--admin-danger)">待提交 <b>{{ pendingCount }}</b></span>
          <span class="hw-fs-item" style="color:var(--admin-warning)">未交 <b>{{ defaulters.length }}</b></span>
        </div>
        <div class="hw-filter-actions">
          <el-button size="small" @click="exportTable" :loading="exporting" plain>导出</el-button>
          <el-button v-if="canAssign" size="small" type="success" @click="openAssignDialog()">+ 布置</el-button>
        </div>
      </div>
      <!-- 表格工具栏 -->
      <div class="hw-filter-row hw-toolbar-row">
        <el-dropdown trigger="click" size="small">
          <el-button size="small" plain>⟺ 密度</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="d in densityOptions" :key="d.key" @click="table.density.value = d.key">
                <span :style="{fontWeight: table.density.value === d.key ? 700 : 400}">{{ d.label }}</span>
                <span style="color:var(--admin-text-muted);margin-left:8px;font-size:10px">{{ d.desc }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown trigger="click" size="small">
          <el-button size="small" plain>☰ 列配置</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="col in table.ALL_COLUMNS" :key="col.key" :disabled="col.required" @click.stop>
                <el-checkbox :model-value="table.isColumnVisible(col.key)" :disabled="col.required" @change="table.toggleColumn(col.key)">{{ col.label }}</el-checkbox>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 2 列布局 -->
    <div class="hw-body">
      <!-- 中列：主内容（表格/卡片/详情） -->
      <main class="hw-center">
        <!-- 详情模式 -->
        <AppWatermark v-if="selectedAssignment">
          <HomeworkDetail
            :assignment="selectedAssignment"
            :homeworks="homeworks"
            @close="selectedAssignment = null"
          />
        </AppWatermark>

        <!-- 表格模式 -->
        <AppWatermark>
          <el-table
            :data="pagedList" border stripe
            :size="table.density.value === 'compact' ? 'small' : table.density.value === 'loose' ? 'default' : 'small'"
            :style="{ fontSize: table.densityConfig().fontSize + 'px' }"
            max-height="520"
            :span-method="spanMethod" :row-class-name="rowClassName"
          >
            <el-table-column prop="seq" label="#" width="40" align="center" fixed="left" />
            <el-table-column
              v-if="table.isColumnVisible('subject')" prop="subject" label="科目" width="90" fixed="left"
            >
              <template #default="{ row }">
                <span :style="{color: shared.subjectColor(row.subject), fontWeight:600}">{{ row.subject }}</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="table.isColumnVisible('studentName')" prop="studentName" label="姓名" width="72" fixed="left"
            />
            <el-table-column
              v-if="table.isColumnVisible('title')" prop="title" label="作业内容" min-width="140"
            >
              <template #default="{ row }">
                <span class="hw-title-link" @click="openTrackingEdit(row)" :title="row.title + '（点击编辑）'">{{ row.title }}</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="table.isColumnVisible('submitStatus')" prop="submitStatus" label="提交" width="72" align="center"
            >
              <template #default="{ row }">
                <span :style="{color: row.submitStatus === '已提交' || row.submitStatus === '已批改' ? 'var(--admin-success)' : 'var(--admin-danger)'}">
                  {{ row.submitStatus || '—' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="table.isColumnVisible('quality')" prop="quality" label="质量" width="80" align="center"
            >
              <template #default="{ row }">
                <el-tag v-if="row.quality" size="small"
                  :type="row.quality === '优秀' ? 'success' : row.quality === '良好' ? 'primary' : row.quality === '一般' ? 'warning' : 'info'"
                  >{{ row.quality }}</el-tag>
                <span v-else style="color:var(--admin-text-muted)">—</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="table.isColumnVisible('accuracy')" prop="accuracy" label="正确率" width="80" align="center"
            >
              <template #default="{ row }">
                <el-tag v-if="row.accuracy != null" size="small" :type="row.accuracy >= 80 ? 'success' : row.accuracy >= 60 ? 'warning' : 'danger'">{{ row.accuracy }}%</el-tag>
                <span v-else style="color:var(--admin-text-muted)">—</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="table.isColumnVisible('status')" prop="status" label="状态" width="105" align="center"
            >
              <template #default="{ row }">
                <span class="hw-status-text" :class="'hw-status-' + (row.status || '未提交')">{{ row.status || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column
              v-if="table.isColumnVisible('errorSummary')" prop="errorSummary" label="错题总结" min-width="120" show-overflow-tooltip
            />
            <el-table-column
              v-if="table.isColumnVisible('teacherComment')" prop="teacherComment" label="点评" min-width="120" show-overflow-tooltip
            />
            <el-table-column label="操作" width="72" fixed="right" align="center">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="openTrackingEdit(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="hw-pagination">
            <el-pagination v-model:current-page="curPage" v-model:page-size="pageSize"
              :page-sizes="[10,15,20,50]" :total="filteredList.length"
              layout="total, sizes, prev, pager, next, jumper" size="small" background />
          </div>
        </AppWatermark>      </main>

    </div>

    <!-- 数据看板（表格下方全宽） -->
    <div class="hw-stats-section">
      <HomeworkStatsPanel :homeworks="homeworks" :assignments="assignments" />
    </div>

    <!-- 隐藏 A4 导出容器 -->
    <div class="hw-export-hidden" aria-hidden="true">
      <div id="hwExportContainer" class="hw-export-container">
        <div v-html="watermarkOverlayHTML"></div>
        <div class="hw-export-header">
          <h1>{{ store.schoolName }} · 作业追踪表</h1>
          <div class="hw-export-meta">
            <span>{{ shared.today }}</span>
            <span v-if="filterClass">{{ filterClass }}</span>
            <span v-if="filterSubject">{{ filterSubject }}</span>
          </div>
        </div>
        <el-table :data="filteredList" border size="small" style="font-size:10px" :span-method="exportSpanMethod">
          <el-table-column prop="seq" label="#" width="36" />
          <el-table-column prop="subject" label="科目" width="80" />
          <el-table-column prop="studentName" label="姓名" width="66" />
          <el-table-column prop="title" label="内容" min-width="120" />
          <el-table-column prop="submitStatus" label="提交" width="60" />
          <el-table-column prop="quality" label="质量" width="60" />
          <el-table-column prop="accuracy" label="正确率" width="60">
            <template #default="{ row }">
              {{ row.accuracy != null ? row.accuracy + '%' : '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" />
          <el-table-column prop="errorSummary" label="错题总结" min-width="100" />
          <el-table-column prop="teacherComment" label="点评" min-width="100" />
        </el-table>
        <div class="hw-export-footer">
          <span>DSE AI 智能学情分析</span>
          <span>打印时间：{{ shared.today }}</span>
        </div>
      </div>
    </div>

    <!-- 作业追踪编辑对话框 -->
    <el-dialog v-model="trackEditVisible" title="编辑作业追踪" width="520px" top="3vh">
      <div class="hw-edit-summary">{{ trackEditForm.subject }} · {{ trackEditForm.studentName }}</div>
      <div class="admin-form-group">
        <label>作业内容 <span style="font-size:10px;color:var(--admin-text-muted)">（修改后同步同科目所有学生）</span></label>
        <el-input v-model="trackEditForm.title" placeholder="作业内容" @change="syncTitleToSubject" />
      </div>
      <div class="admin-form-group">
        <label>作业状态</label>
        <el-select v-model="trackEditForm.status" style="width:100%">
          <el-option v-for="s in shared.allHwStatuses" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
      <div class="admin-form-group">
        <label>提交状态</label>
        <el-select v-model="trackEditForm.submitStatus" style="width:100%">
          <el-option label="已提交" value="已提交" />
          <el-option label="未提交" value="未提交" />
          <el-option label="已批改" value="已批改" />
        </el-select>
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>完成质量</label>
          <el-select v-model="trackEditForm.quality" style="width:100%">
            <el-option label="优秀" value="优秀" />
            <el-option label="良好" value="良好" />
            <el-option label="一般" value="一般" />
            <el-option label="需改进" value="需改进" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>正确率 (%)</label>
          <el-input-number v-model="trackEditForm.accuracy" :min="0" :max="100" style="width:100%" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>错题总结</label>
        <el-input v-model="trackEditForm.errorSummary" type="textarea" :rows="2" placeholder="常见错误类型、薄弱知识点…" />
      </div>
      <div class="admin-form-group">
        <label>教师点评</label>
        <el-input v-model="trackEditForm.teacherComment" type="textarea" :rows="2" placeholder="针对性反馈…" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <el-checkbox v-model="trackEditForm.movedToTA">搬到助教处</el-checkbox>
        </div>
        <div class="admin-form-group">
          <el-checkbox v-model="trackEditForm.retrieved">学生已领回</el-checkbox>
        </div>
      </div>
      <template #footer>
        <el-button @click="trackEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTrackingEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 布置作业对话框 -->
    <el-dialog v-model="assignVisible" title="布置作业" width="680px" top="3vh" @close="resetAssignForm" class="hw-assign-dialog">
      <div class="ha-form">
        <div class="ha-row">
          <div class="ha-field ha-field-half">
            <label>科目 <span class="ha-req">*</span></label>
            <el-select v-model="assignForm.subject" placeholder="选择科目">
              <el-option-group label="核心科目"><el-option v-for="s in assignableSubjects" :key="s" :label="s" :value="s" /></el-option-group>
              <el-option-group label="选修科目"><el-option v-for="s in assignableElectives" :key="s" :label="s" :value="s" /></el-option-group>
            </el-select>
          </div>
          <div class="ha-field ha-field-half">
            <label>班级 <span class="ha-req">*</span></label>
            <el-select v-model="assignForm.class" placeholder="选择班级" @change="onAssignClassChange">
              <el-option v-for="c in shared.classList.value" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
        </div>
        <div class="ha-field">
          <label>作业标题 <span class="ha-req">*</span></label>
          <el-input v-model="assignForm.title" placeholder="如：二次函数综合练习" />
        </div>
        <div class="ha-field">
          <label>作业内容</label>
          <el-input v-model="assignForm.content" type="textarea" :rows="2" placeholder="题目范围、页码、具体要求…" />
        </div>
        <div class="ha-row">
          <div class="ha-field ha-field-half">
            <label>截止日期 <span class="ha-req">*</span></label>
            <el-date-picker v-model="assignForm.dueDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
          </div>
          <div class="ha-field ha-field-half">
            <label>时间段</label>
            <el-input v-model="assignForm.timeRange" placeholder="如：19:30-21:05" />
          </div>
        </div>
        <div class="ha-field">
          <label>发放范围</label>
          <div class="ha-scope-tabs">
            <button type="button" class="ha-scope-btn" :class="{ active: assignForm.targetScope === 'auto' }" @click="assignForm.targetScope = 'auto'">
              <span class="ha-scope-icon">📚</span><span>全班分发</span><small>必修→全班 / 选修→选该科目的学生</small>
            </button>
            <button type="button" class="ha-scope-btn" :class="{ active: assignForm.targetScope === 'selected' }" @click="assignForm.targetScope = 'selected'">
              <span class="ha-scope-icon">👤</span><span>指定学生</span><small>手动选择接收人</small>
            </button>
          </div>
        </div>
        <div v-if="assignForm.targetScope === 'selected'" class="ha-field">
          <label>选择学生</label>
          <el-select v-model="assignForm.targetStudentIds" multiple placeholder="选择学生…" style="width:100%">
            <el-option v-for="s in classStudents" :key="s.id" :label="`${s.name} (${s.class})`" :value="s.id" />
          </el-select>
        </div>
        <div v-if="distPreview.length" class="ha-preview">
          <div class="ha-preview-title">分发预览 · {{ distPreview.length }} 人</div>
          <div class="ha-preview-list">{{ distPreview.join('、') }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign" :loading="assigning">确认布置</el-button>
      </template>
    </el-dialog>

    <!-- 编辑作业对话框 -->
    <el-dialog v-model="editVisible" title="编辑作业" width="560px" top="3vh">
      <div class="hw-edit-summary">
        {{ editForm.subject }} · {{ editForm.title }} · {{ editForm.class }}班
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>科目</label>
          <el-input :model-value="editForm.subject" disabled />
        </div>
        <div class="admin-form-group">
          <label>班级</label>
          <el-input :model-value="editForm.class" disabled />
        </div>
      </div>
      <div class="admin-form-group">
        <label>作业标题</label>
        <el-input v-model="editForm.title" />
      </div>
      <div class="admin-form-group">
        <label>作业内容</label>
        <el-input v-model="editForm.content" type="textarea" :rows="2" />
      </div>
      <div class="admin-form-group">
        <label>详细描述</label>
        <el-input v-model="editForm.description" type="textarea" :rows="2" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>截止日期</label>
          <el-date-picker v-model="editForm.dueDate" type="date" style="width:100%" value-format="YYYY-MM-DD" />
        </div>
        <div class="admin-form-group">
          <label>时间段</label>
          <el-input v-model="editForm.timeRange" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>备注</label>
        <el-input v-model="editForm.notes" type="textarea" :rows="1" />
      </div>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { homeworkService, homeworkAssignmentService, studentService, courseService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { getOverlayWatermarkHTML } from '@/composables/useWatermark'
import { useHomeworkShared } from '@/views/admin/homework/composables/useHomeworkShared'
import { useHomeworkTable } from '@/views/admin/homework/composables/useHomeworkTable'
import HomeworkStatsPanel from '@/views/admin/homework/components/HomeworkStatsPanel.vue'
import HomeworkDetail from '@/views/admin/homework/components/HomeworkDetail.vue'
import AppWatermark from '@/components/common/AppWatermark.vue'

const store = useAppStore()
const shared = useHomeworkShared()
const table = useHomeworkTable()

// ====== Data ======
const homeworks = ref([])
const assignments = ref([])
const exporting = ref(false)
const filterClass = ref('')
const filterSubject = ref('')
const filterStatus = ref('')
const filterSubmit = ref('')
const filterSearch = ref('')
const curPage = ref(1)
const pageSize = ref(15)
const trackEditVisible = ref(false)
const trackEditForm = ref({})
const assignVisible = ref(false)
const editVisible = ref(false)
const assigning = ref(false)
const classStudents = ref([])
const assFilterClass = ref('')
const assFilterSubject = ref('')
const assFilterSearch = ref('')
const selectedAssignment = ref(null)
const selectedAssignmentId = ref('')
const collapsedSections = ref([])
const assignForm = ref({
  subject: '', class: '', title: '', content: '', description: '',
  dueDate: '', timeRange: '', targetScope: 'auto', targetStudentIds: [], notes: ''
})
const editForm = ref({})

// ====== Permissions ======
const canAssign = computed(() => store.hasPermission("homework:view"))

const densityOptions = [
  { key: "compact", label: "紧" },
  { key: "comfortable", label: "适" },
  { key: "loose", label: "松" }
]

const assignableSubjects = shared.coreSubjects
const assignableElectives = shared.electiveSubjects

// ====== Computed ======
const totalCount = computed(() => homeworks.value.length)
const submittedCount = computed(() => homeworks.value.filter(h => h.submitStatus === '已提交' || h.submitStatus === '已批改').length)
const pendingCount = computed(() => homeworks.value.filter(h => h.submitStatus === '未提交' || h.status === '未提交' || h.status === '未完成').length)
const lostCount = computed(() => homeworks.value.filter(h => h.status === '书籍/作业丢失').length)
const avgAccuracy = computed(() => {
  const vals = homeworks.value.filter(h => h.accuracy != null)
  return vals.length ? Math.round(vals.reduce((s, h) => s + h.accuracy, 0) / vals.length) + '%' : '—'
})

const defaulters = computed(() => homeworks.value.filter(h =>
  h.status === '未提交' || h.status === '未完成' || h.submitStatus === '未提交'
))

const filteredList = computed(() => {
  let list = [...homeworks.value]
  if (filterClass.value) list = list.filter(h => h.class === filterClass.value)
  if (filterSubject.value) list = list.filter(h => h.subject === filterSubject.value)
  if (filterStatus.value) list = list.filter(h => h.status === filterStatus.value)
  if (filterSubmit.value) list = list.filter(h => (h.submitStatus || '') === filterSubmit.value)
  if (selectedAssignmentId.value) list = list.filter(h => h.assignmentId === selectedAssignmentId.value)
  if (filterSearch.value) {
    const kw = filterSearch.value.toLowerCase()
    list = list.filter(h => (h.studentName || '').toLowerCase().includes(kw))
  }
  list.sort((a, b) => {
    const sa = a.subject || '', sb = b.subject || ''
    if (sa !== sb) return sa.localeCompare(sb)
    return (a.studentName || '').localeCompare(b.studentName || '')
  })
  return list.map((h, i) => ({ ...h, seq: i + 1 }))
})

const pagedList = computed(() => {
  const start = (curPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const sortedAssignments = computed(() => {
  return [...assignments.value].sort((a, b) => {
    if (a.subject !== b.subject) return (a.subject || '').localeCompare(b.subject || '')
    return (b.dueDate || '').localeCompare(a.dueDate || '')
  })
})

const pagedAssignmentList = computed(() => sortedAssignments.value)

function assignmentSubmitRate(assignment) {
  const total = homeworks.value.filter(h => h.assignmentId === assignment.id).length
  if (!total) return 0
  const submitted = homeworks.value.filter(h =>
    h.assignmentId === assignment.id && (h.submitStatus === '已提交' || h.submitStatus === '已批改')
  ).length
  return Math.round((submitted / total) * 100)
}

function selectAssignment(a) {
  selectedAssignment.value = selectedAssignment.value?.id === a.id ? null : a
  curPage.value = 1
}

function onAssignmentFilterChange() {
  curPage.value = 1
}

const distPreview = computed(() => {
  const f = assignForm.value
  if (!f.class || !f.subject) return []
  const students = studentService.getAll().filter(s => s.class === f.class)
  let targets = []
  if (f.targetScope === 'selected') {
    targets = students.filter(s => f.targetStudentIds.includes(s.id))
  } else {
    const course = courseService.getAll().find(c => c.name === f.subject && !c.parentId)
    if (course?.category === 'elective') {
      targets = students.filter(s => {
        const electives = [s.elective1, s.elective2, s.elective3].filter(Boolean)
        return electives.includes(f.subject)
      })
    } else { targets = students }
  }
  return targets.map(s => s.name)
})

const watermarkOverlayHTML = computed(() => getOverlayWatermarkHTML())

// ====== Collapse ======
function toggleCollapse(section) {
  const idx = collapsedSections.value.indexOf(section)
  if (idx >= 0) {
    collapsedSections.value = collapsedSections.value.filter(s => s !== section)
  } else {
    collapsedSections.value = [...collapsedSections.value, section]
  }
}

function collapseIcon(section) {
  return collapsedSections.value.includes(section) ? 'hw-collapse-icon' : 'hw-collapse-icon open'
}

// ====== Table helpers ======
function spanMethod({ row, column, rowIndex }) {
  const list = pagedList.value
  if (!list.length) return { rowspan: 1, colspan: 1 }

  // 科目列合并
  if (column.property === 'subject' && table.isColumnVisible('subject')) {
    if (rowIndex === 0 || row.subject !== list[rowIndex - 1].subject) {
      let count = 1
      for (let i = rowIndex + 1; i < list.length && list[i].subject === row.subject; i++) count++
      return { rowspan: count, colspan: 1 }
    }
    return { rowspan: 0, colspan: 0 }
  }

  // 作业内容列合并（同一科目+同一标题）
  if (column.property === 'title' && table.isColumnVisible('title')) {
    if (rowIndex === 0 || row.subject !== list[rowIndex - 1].subject || row.title !== list[rowIndex - 1].title) {
      let count = 1
      for (let i = rowIndex + 1; i < list.length && list[i].subject === row.subject && list[i].title === row.title; i++) count++
      return { rowspan: count, colspan: 1 }
    }
    return { rowspan: 0, colspan: 0 }
  }

  return { rowspan: 1, colspan: 1 }
}

// 导出表格合并（同 spanMethod 逻辑，但数据源为 filteredList）
function exportSpanMethod({ row, column, rowIndex }) {
  const list = filteredList.value
  if (!list.length) return { rowspan: 1, colspan: 1 }
  if (column.property === 'subject') {
    if (rowIndex === 0 || row.subject !== list[rowIndex - 1].subject) {
      let count = 1
      for (let i = rowIndex + 1; i < list.length && list[i].subject === row.subject; i++) count++
      return { rowspan: count, colspan: 1 }
    }
    return { rowspan: 0, colspan: 0 }
  }
  if (column.property === 'title') {
    if (rowIndex === 0 || row.subject !== list[rowIndex - 1].subject || row.title !== list[rowIndex - 1].title) {
      let count = 1
      for (let i = rowIndex + 1; i < list.length && list[i].subject === row.subject && list[i].title === row.title; i++) count++
      return { rowspan: count, colspan: 1 }
    }
    return { rowspan: 0, colspan: 0 }
  }
  return { rowspan: 1, colspan: 1 }
}

function rowClassName({ row }) {
  if (row.status === '未提交' && (!row.submitStatus || row.submitStatus === '未提交')) return 'hw-track-row-danger'
  if (row.movedToTA && !row.retrieved) return 'hw-track-row-warning'
  return ''
}

// ====== Track Edit ======
function openTrackingEdit(row) {
  trackEditForm.value = {
    id: row.id, studentName: row.studentName, subject: row.subject, title: row.title,
    status: row.status || '未提交', submitStatus: row.submitStatus || '',
    quality: row.quality || '', accuracy: row.accuracy != null ? row.accuracy : null,
    errorSummary: row.errorSummary || '', teacherComment: row.teacherComment || '',
    movedToTA: row.movedToTA || false, retrieved: row.retrieved || false
  }
  trackEditVisible.value = true
}

function syncTitleToSubject() {
  const f = trackEditForm.value
  if (!f.title || !f.subject) return
  homeworks.value.forEach(h => {
    if (h.subject === f.subject) {
      homeworkService.update(h.id, { ...h, title: f.title })
    }
  })
  homeworks.value = homeworkService.getAll()
}

function saveTrackingEdit() {
  const data = { ...trackEditForm.value }
  if (data.id) {
    const existing = homeworks.value.find(h => h.id === data.id)
    if (existing) {
      const merged = { ...existing, title: data.title, status: data.status, submitStatus: data.submitStatus,
        quality: data.quality, accuracy: data.accuracy, errorSummary: data.errorSummary,
        teacherComment: data.teacherComment, movedToTA: data.movedToTA, retrieved: data.retrieved }
      homeworkService.update(data.id, merged)
    }
  }
  trackEditVisible.value = false
  homeworks.value = homeworkService.getAll()
  ElMessage.success('追踪信息已保存')
}

// ====== Export ======
async function exportTable() {
  exporting.value = true
  try {
    await new Promise(r => setTimeout(r, 300))
    const el = document.getElementById('hwExportContainer')
    if (!el) { ElMessage.warning('导出容器未找到'); exporting.value = false; return }
    const canvas = await html2canvas(el, {
      scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false,
      width: el.scrollWidth, height: el.scrollHeight
    })
    const link = document.createElement('a')
    link.download = `作业追踪表_${shared.today}_${filterClass.value || '全部班级'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('作业表已导出为高清图片')
  } catch (e) { ElMessage.error('导出失败，请重试') }
  exporting.value = false
}

// ====== Assign ======
function resetAssignForm() {
  assignForm.value = {
    subject: '', class: '', title: '', content: '', description: '',
    dueDate: '', timeRange: '', targetScope: 'auto', targetStudentIds: [], notes: ''
  }
  classStudents.value = []
}

function openAssignDialog() { resetAssignForm(); assignVisible.value = true }
function onAssignClassChange(cls) {
  classStudents.value = cls ? studentService.getAll().filter(s => s.class === cls) : []
  assignForm.value.targetStudentIds = []
}
function onScopeChange() { assignForm.value.targetStudentIds = [] }

function submitAssign() {
  const f = assignForm.value
  if (!f.subject) { ElMessage.warning('请选择科目'); return }
  if (!f.class) { ElMessage.warning('请选择班级'); return }
  if (!f.title.trim()) { ElMessage.warning('请输入作业标题'); return }
  if (!f.dueDate) { ElMessage.warning('请选择截止日期'); return }
  assigning.value = true
  try {
    const result = homeworkAssignmentService.assign({
      subject: f.subject, teacher: store.currentUser?.displayName || '',
      title: f.title.trim(), content: f.content.trim(), description: f.description.trim(),
      dueDate: f.dueDate, timeRange: f.timeRange, class: f.class,
      targetScope: f.targetScope,
      targetStudentIds: f.targetScope === 'selected' ? f.targetStudentIds : [],
      attachments: [], notes: f.notes.trim()
    })
    ElMessage.success(`作业已布置，分发给 ${result.distributedTo} 名学生`)
    assignVisible.value = false
    assignments.value = homeworkAssignmentService.getAll()
  } catch (e) { ElMessage.error('布置失败，请重试') }
  assigning.value = false
}

function openEditDialog(row) {
  editForm.value = {
    id: row.id, subject: row.subject, class: row.class, title: row.title,
    content: row.content || '', description: row.description || '',
    dueDate: row.dueDate, timeRange: row.timeRange || '', notes: row.notes || ''
  }
  editVisible.value = true
}

function submitEdit() {
  const f = editForm.value
  if (!f.title.trim()) { ElMessage.warning('请输入作业标题'); return }
  homeworkAssignmentService.update(f.id, {
    title: f.title.trim(), content: f.content.trim(), description: f.description.trim(),
    dueDate: f.dueDate, timeRange: f.timeRange, notes: f.notes.trim()
  })
  const hwList = homeworkService.getAll().filter(h => h.assignmentId === f.id)
  hwList.forEach(h => {
    homeworkService.update(h.id, { title: f.title.trim(), content: f.content.trim(), description: f.description.trim(), dueDate: f.dueDate, timeRange: f.timeRange })
  })
  editVisible.value = false
  assignments.value = homeworkAssignmentService.getAll()
  ElMessage.success('作业已更新')
}

// ====== Init ======
onMounted(() => {
  homeworks.value = homeworkService.getAll()
  assignments.value = homeworkAssignmentService.getAll()
})
</script>

<style scoped>
/* ====== Page Layout ====== */
.hw-page {
  display: flex; flex-direction: column; gap: 12px; height: 100%;
}
.hw-top-bar {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 12px; flex-wrap: wrap;
}
.hw-top-title { font-size: 18px; font-weight: 700; color: var(--admin-text); letter-spacing: 0.5px; }
.hw-top-subtitle { font-size: 11px; color: var(--admin-text-muted); margin-top: 2px; }
.hw-top-actions { display: flex; gap: 8px; flex-shrink: 0; }

.hw-body {
  display: flex; gap: 12px; flex: 1; overflow: hidden; min-height: 0;
}

/* ====== Filter Bar ====== */
.hw-filter-bar {
  background: var(--admin-surface); border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius); padding: 10px 14px;
  display: flex; flex-direction: column; gap: 8px; flex-shrink: 0;
}
.hw-filter-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.hw-filter-stats {
  display: flex; align-items: center; gap: 12px; margin-left: auto;
}
.hw-fs-item { font-size: 11px; color: var(--admin-text-muted); }
.hw-fs-item b { font-weight: 700; color: var(--admin-text); }
.hw-filter-actions {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
}
.hw-toolbar-row { padding-top: 4px; border-top: 1px solid var(--admin-border); }

/* ====== Center Column ====== */
.hw-center { flex: 1; overflow-y: auto; min-width: 0; display: flex; flex-direction: column; gap: 10px; }

/* Inline title editing */

.hw-pagination { padding: 10px 0; display: flex; align-items: center; }

/* ====== Card Mode ====== */
.hw-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  overflow-y: auto; flex: 1;
}
.hw-card {
  background: var(--admin-surface); border: 1px solid var(--admin-border);
  border-radius: 10px; padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
  transition: all 0.15s;
}
.hw-card:hover {
  border-color: var(--admin-border-active);
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
}
.hw-card-danger { border-left: 3px solid var(--admin-danger); }
.hw-card-warning { border-left: 3px solid var(--admin-warning); }
.hw-card-top { display: flex; justify-content: space-between; align-items: center; }
.hw-card-subject { font-size: 13px; font-weight: 700; }
.hw-card-body { flex: 1; }
.hw-card-name { font-size: 14px; font-weight: 600; color: var(--admin-text); margin-bottom: 4px; }
.hw-card-title { font-size: 12px; color: var(--admin-text-secondary); }
.hw-card-bottom { display: flex; align-items: center; gap: 8px; font-size: 11px; }
.hw-card-quality { color: var(--admin-text-muted); }
.hw-card-acc { font-weight: 600; }
.hw-card-edit { margin-left: auto; }

/* ====== Stats Section (below table, full width) ====== */
.hw-stats-section { flex-shrink: 0; margin-top: 4px; }

/* Row highlights */
:deep(.hw-track-row-danger) { background: rgba(240,72,72,0.06) !important; }
:deep(.hw-track-row-warning) { background: rgba(246,168,33,0.06) !important; }

/* ====== Edit summary ====== */
.hw-edit-summary {
  font-size: 12px; color: var(--admin-text-muted); margin-bottom: 14px;
  padding: 8px 12px; background: var(--admin-bg); border-radius: 6px;
}

/* ====== A4 Export (hidden) ====== */
.hw-export-hidden { position: absolute; left: -9999px; top: 0; width: 1400px; z-index: -1; }
.hw-export-container {
  background: #ffffff; padding: 28px 24px 24px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #222; box-sizing: border-box;
}
.hw-export-header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #333; }
.hw-export-header h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #111; letter-spacing: 2px; }
.hw-export-meta { display: flex; justify-content: center; gap: 24px; font-size: 12px; color: #555; flex-wrap: wrap; }
.hw-export-footer { display: flex; justify-content: space-between; margin-top: 18px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #888; }

.hw-export-container :deep(.el-table) { border: 1px solid #333 !important; }
.hw-export-container :deep(.el-table th.el-table__cell) { background: #f0f0f0 !important; color: #111 !important; font-weight: 700 !important; border-right: 1px solid #555 !important; border-bottom: 2px solid #333 !important; font-size: 12px !important; }
.hw-export-container :deep(.el-table td.el-table__cell) { border-right: 1px solid #555 !important; border-bottom: 1px solid #555 !important; color: #222 !important; font-size: 11px !important; }
.hw-export-container :deep(.el-table__row:nth-child(even) td) { background: #fafafa !important; }
.hw-export-container :deep(.hw-track-row-danger) { background: rgba(220, 38, 38, 0.06) !important; }
.hw-export-container :deep(.hw-track-row-warning) { background: rgba(217, 119, 6, 0.06) !important; }

/* Dist Preview */
/* ===== 布置作业对话框 ===== */
.ha-form { display: flex; flex-direction: column; gap: 14px; }
.ha-row { display: flex; gap: 14px; }
.ha-field { display: flex; flex-direction: column; gap: 4px; }
.ha-field label { font-size: 12px; font-weight: 600; color: var(--admin-text-secondary); }
.ha-req { color: var(--admin-danger); }
.ha-field-half { flex: 1; min-width: 0; }
.ha-field .el-select { width: 100%; }
.ha-field .el-date-editor { width: 100%; }

/* 发放范围 */
.ha-scope-tabs { display: flex; gap: 8px; }
.ha-scope-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 8px; border: 1px solid var(--admin-border); border-radius: 10px;
  background: var(--admin-bg); cursor: pointer; transition: all 0.2s;
  font-family: inherit; color: var(--admin-text-secondary); text-align: center;
}
.ha-scope-btn:hover { border-color: var(--admin-accent); background: rgba(99,102,241,0.04); }
.ha-scope-btn.active { border-color: var(--admin-accent); background: rgba(99,102,241,0.08); color: var(--admin-text); }
.ha-scope-icon { font-size: 20px; }
.ha-scope-btn span:nth-child(2) { font-size: 13px; font-weight: 600; }
.ha-scope-btn small { font-size: 10px; color: var(--admin-text-muted); display: block; }
.ha-scope-btn.active small { color: var(--admin-text-secondary); }

/* 分发预览 */
.ha-preview { margin-top: 4px; padding: 12px 14px; background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.15); border-radius: 8px; }
.ha-preview-title { font-size: 12px; font-weight: 600; color: #4ade80; margin-bottom: 6px; }
.ha-preview-list { font-size: 11px; color: var(--admin-text-secondary); line-height: 1.6; }
.hw-title-link { cursor: pointer; color: var(--admin-text); }
.hw-title-link:hover { color: var(--admin-accent-light); text-decoration: underline; }
.hw-status-text { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.hw-status-已提交,.hw-status-已批改 { background: rgba(34,197,94,0.1); color: #4ade80; }
.hw-status-未提交 { background: rgba(239,68,68,0.1); color: #f87171; }
.hw-status-补交,.hw-status-迟交 { background: rgba(245,158,11,0.1); color: #fbbf24; }
.hw-status-已退回 { background: rgba(148,163,184,0.1); color: #94a3b8; }

@media (max-width: 1024px) {
  .hw-body { flex-direction: column; }
}
</style>
