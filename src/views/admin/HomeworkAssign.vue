<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📝 布置作业</div>
          <div class="admin-card-subtitle">必修科目自动分发全班 · 选修科目匹配选课学生</div>
        </div>
        <button class="ha-btn-assign" @click="openAssignDialog()" v-if="canAssign">+ 布置作业</button>
      </div>

      <!-- Filters -->
      <div class="ha-filters">
        <el-select v-model="filterClass" size="small" placeholder="班级" style="width:110px" clearable>
          <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filterSubject" size="small" placeholder="科目" style="width:140px" clearable>
          <el-option-group label="核心科目">
            <el-option v-for="s in coreSubjects" :key="s" :label="s" :value="s" />
          </el-option-group>
          <el-option-group label="选修科目">
            <el-option v-for="s in electiveSubjects" :key="s" :label="s" :value="s" />
          </el-option-group>
        </el-select>
        <el-input v-model="filterSearch" size="small" placeholder="搜索作业标题…" style="width:180px" clearable />
        <span class="ha-filter-meta">共 {{ filteredAssignments.length }} 项作业</span>
      </div>

      <!-- Assignment Table -->
      <div class="ha-table-wrap">
        <el-table :data="pagedAssignments" border stripe size="small" style="width:100%;font-size:12px" max-height="480">
          <el-table-column prop="subject" label="科目" width="105">
            <template #default="{ row }">
              <span :style="{color: subjectColor(row.subject), fontWeight:700}">{{ row.subject }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="作业标题" min-width="150" show-overflow-tooltip />
          <el-table-column prop="content" label="作业内容" min-width="170" show-overflow-tooltip />
          <el-table-column prop="dueDate" label="截止日期" width="110" align="center" />
          <el-table-column prop="teacher" label="任课老师" width="95" align="center" />
          <el-table-column prop="class" label="班级" width="75" align="center" />
          <el-table-column prop="courseType" label="课程类型" width="95" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.courseType === 'core' ? '' : 'warning'" effect="plain">
                {{ row.courseType === 'core' ? '必修' : '选修' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="分发学生" width="140">
            <template #default="{ row }">
              <el-popover v-if="row.targetStudentNames && row.targetStudentNames.length" trigger="hover" placement="left" :width="200">
                <template #reference>
                  <span class="ha-student-link">{{ row.targetCount }}人 <span style="font-size:10px">▾</span></span>
                </template>
                <div class="ha-student-pop">
                  <div v-for="(name, i) in row.targetStudentNames" :key="i" class="ha-student-pop-item">{{ i + 1 }}. {{ name }}</div>
                </div>
              </el-popover>
              <span v-else style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" min-width="100" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="布置时间" width="145" align="center" />
          <el-table-column label="操作" width="80" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="openEditDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="ha-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 15, 20, 50]"
            :total="filteredAssignments.length"
            layout="total, sizes, prev, pager, next, jumper"
            size="small" background
          />
        </div>
      </div>

      <!-- Stats Row -->
      <div class="admin-two-col" style="margin-top:16px">
        <div class="admin-card ha-stats-card">
          <div class="hw-stats-header">📊 作业分发统计</div>
          <div class="hw-stats-body">
            <div v-for="s in subjectStats" :key="s.subject" class="hw-stats-row">
              <span class="hw-stats-label" :style="{color: subjectColor(s.subject)}">{{ s.subject }}</span>
              <div class="hw-stats-bar-bg">
                <div class="hw-stats-bar-fill" :style="{width: s.rate + '%', background: subjectColor(s.subject)}"></div>
              </div>
              <span class="hw-stats-count">{{ s.count }}项</span>
            </div>
          </div>
        </div>
        <div class="admin-card ha-stats-card">
          <div class="hw-stats-header">📋 最近布置</div>
          <div class="ha-recent-body">
            <div v-for="a in recentAssignments" :key="a.id" class="ha-recent-row">
              <span class="ha-recent-subject" :style="{color: subjectColor(a.subject)}">{{ a.subject }}</span>
              <span class="ha-recent-title">{{ a.title }}</span>
              <span class="ha-recent-date">{{ a.dueDate }}</span>
            </div>
            <div v-if="recentAssignments.length === 0" class="hw-defaulter-empty">暂无作业记录</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Dialog -->
    <el-dialog v-model="assignVisible" title="📝 布置作业" width="620px" top="3vh" @close="resetAssignForm">
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>科目 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="assignForm.subject" style="width:100%" placeholder="选择科目" :disabled="!canAssignAnySubject">
            <el-option-group label="核心科目">
              <el-option v-for="s in assignableSubjects" :key="s" :label="s" :value="s" />
            </el-option-group>
            <el-option-group label="选修科目">
              <el-option v-for="s in assignableElectives" :key="s" :label="s" :value="s" />
            </el-option-group>
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>班级 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="assignForm.class" style="width:100%" placeholder="选择班级" @change="onAssignClassChange">
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
      </div>
      <div class="admin-form-group">
        <label>作业标题 <span style="color:var(--admin-danger)">*</span></label>
        <el-input v-model="assignForm.title" placeholder="如：二次函数综合练习" />
      </div>
      <div class="admin-form-group">
        <label>作业内容</label>
        <el-input v-model="assignForm.content" type="textarea" :rows="2" placeholder="作业具体内容…" />
      </div>
      <div class="admin-form-group">
        <label>详细描述</label>
        <el-input v-model="assignForm.description" type="textarea" :rows="2" placeholder="详细要求、步骤说明…" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>截止日期 <span style="color:var(--admin-danger)">*</span></label>
          <el-date-picker v-model="assignForm.dueDate" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
        </div>
        <div class="admin-form-group">
          <label>时间段</label>
          <el-input v-model="assignForm.timeRange" placeholder="如：19:30-21:05" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>发放范围</label>
        <el-radio-group v-model="assignForm.targetScope" @change="onScopeChange">
          <el-radio value="auto">自动匹配（必修→全班 / 选修→选课学生）</el-radio>
          <el-radio value="selected">指定学生</el-radio>
        </el-radio-group>
      </div>
      <div v-if="assignForm.targetScope === 'selected'" class="admin-form-group">
        <label>选择学生</label>
        <el-select v-model="assignForm.targetStudentIds" style="width:100%" multiple placeholder="选择学生…">
          <el-option v-for="s in classStudents" :key="s.id" :label="`${s.name} (${s.class})`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-form-group">
        <label>备注</label>
        <el-input v-model="assignForm.notes" type="textarea" :rows="1" placeholder="补充说明…" />
      </div>
      <div v-if="distPreview.length > 0" class="ha-dist-preview">
        <div class="ha-dist-preview-title">📋 分发预览 — 将分发给以下 {{ distPreview.length }} 名学生：</div>
        <div class="ha-dist-preview-list">{{ distPreview.join('、') }}</div>
      </div>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign" :loading="assigning">确认布置</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="editVisible" title="✏️ 编辑作业" width="560px" top="3vh">
      <div class="ha-edit-summary">
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
import { homeworkAssignmentService, homeworkService, studentService, courseService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const assignments = ref([])
const assignVisible = ref(false)
const editVisible = ref(false)
const assigning = ref(false)
const filterClass = ref('')
const filterSubject = ref('')
const filterSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(15)
const classStudents = ref([])

const assignForm = ref({
  subject: '', class: '', title: '', content: '', description: '',
  dueDate: '', timeRange: '', targetScope: 'auto', targetStudentIds: [], notes: ''
})

const editForm = ref({})

const coreSubjects = ['中国语文', '英国语文', '数学', '公民与社会发展']
const electiveSubjects = computed(() => {
  const all = courseService.getAllNamesFlat()
  return all.filter(s => !coreSubjects.includes(s))
})

const classList = computed(() => studentService.getClasses())

const isAdmin = computed(() => store.currentRole?.name === '超级管理员' || store.currentRole?.name === '教务主任')
const isHomeroom = computed(() => store.currentRole?.name === '班主任/教师')
const canAssignAnySubject = computed(() => isAdmin.value || isHomeroom.value)
const canAssign = computed(() => store.hasPermission('homework.assign'))

const teacherSubjects = computed(() => {
  if (canAssignAnySubject.value) return [...coreSubjects, ...electiveSubjects.value]
  const teacherName = store.currentUser?.displayName || ''
  try {
    const timetable = JSON.parse(localStorage.getItem('dse_timetable') || '[]')
    return [...new Set(timetable.filter(t => t.teacher === teacherName).map(t => t.subject))]
  } catch { return [] }
})

const assignableSubjects = computed(() => {
  if (canAssignAnySubject.value) return coreSubjects
  return coreSubjects.filter(s => teacherSubjects.value.includes(s))
})

const assignableElectives = computed(() => {
  if (canAssignAnySubject.value) return electiveSubjects.value
  return electiveSubjects.value.filter(s => teacherSubjects.value.includes(s))
})

const subjectColorMap = {
  '数学':'#3b82f6','中国语文':'#22c55e','英国语文':'#8b5cf6',
  'English Reading':'#8b5cf6','English Writing':'#a78bfa','English Listening':'#c4b5fd','English Speaking':'#ddd6fe',
  '物理':'#f59e0b','化学':'#ef4444','生物':'#10b981','历史':'#78716c','地理':'#06b6d4',
  '经济':'#f97316','资讯及通讯科技':'#6366f1','企业、会计与财务概论':'#14b8a6',
  '视觉艺术':'#ec4899','体育':'#84cc16','音乐':'#d946ef',
  '数学延伸M1':'#60a5fa','数学延伸M2':'#93c5fd','公民与社会发展':'#64748b'
}
function subjectColor(s) { return subjectColorMap[s] || 'var(--admin-accent)' }

onMounted(() => {
  assignments.value = homeworkAssignmentService.getAll()
})

const filteredAssignments = computed(() => {
  let list = [...assignments.value]
  if (filterClass.value) list = list.filter(a => a.class === filterClass.value)
  if (filterSubject.value) list = list.filter(a => a.subject === filterSubject.value)
  if (filterSearch.value) {
    const kw = filterSearch.value.toLowerCase()
    list = list.filter(a => (a.title || '').toLowerCase().includes(kw))
  }
  list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  return list
})

const pagedAssignments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredAssignments.value.slice(start, start + pageSize.value)
})

const subjectStats = computed(() => {
  const map = {}
  assignments.value.forEach(a => {
    map[a.subject] = (map[a.subject] || 0) + 1
  })
  const total = assignments.value.length || 1
  return Object.entries(map).map(([subject, count]) => ({
    subject, count, rate: Math.round(count / total * 100)
  })).sort((a, b) => b.count - a.count)
})

const recentAssignments = computed(() => {
  return [...assignments.value].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5)
})

function resetAssignForm() {
  assignForm.value = {
    subject: '', class: '', title: '', content: '', description: '',
    dueDate: '', timeRange: '', targetScope: 'auto', targetStudentIds: [], notes: ''
  }
  classStudents.value = []
}

function openAssignDialog() {
  resetAssignForm()
  assignVisible.value = true
}

function onAssignClassChange(cls) {
  if (cls) {
    classStudents.value = studentService.getAll().filter(s => s.class === cls)
  } else {
    classStudents.value = []
  }
  assignForm.value.targetStudentIds = []
}

function onScopeChange() {
  assignForm.value.targetStudentIds = []
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
    } else {
      targets = students
    }
  }
  return targets.map(s => s.name)
})

function submitAssign() {
  const f = assignForm.value
  if (!f.subject) { ElMessage.warning('请选择科目'); return }
  if (!f.class) { ElMessage.warning('请选择班级'); return }
  if (!f.title.trim()) { ElMessage.warning('请输入作业标题'); return }
  if (!f.dueDate) { ElMessage.warning('请选择截止日期'); return }

  assigning.value = true
  try {
    const result = homeworkAssignmentService.assign({
      subject: f.subject,
      teacher: store.currentUser?.displayName || '',
      title: f.title.trim(),
      content: f.content.trim(),
      description: f.description.trim(),
      dueDate: f.dueDate,
      timeRange: f.timeRange,
      class: f.class,
      targetScope: f.targetScope,
      targetStudentIds: f.targetScope === 'selected' ? f.targetStudentIds : [],
      attachments: [],
      notes: f.notes.trim()
    })
    ElMessage.success(`作业已布置，分发给 ${result.distributedTo} 名学生`)
    assignVisible.value = false
    assignments.value = homeworkAssignmentService.getAll()
  } catch (e) {
    ElMessage.error('布置失败，请重试')
  }
  assigning.value = false
}

function openEditDialog(row) {
  editForm.value = {
    id: row.id,
    subject: row.subject,
    class: row.class,
    title: row.title,
    content: row.content || '',
    description: row.description || '',
    dueDate: row.dueDate,
    timeRange: row.timeRange || '',
    notes: row.notes || ''
  }
  editVisible.value = true
}

function submitEdit() {
  const f = editForm.value
  if (!f.title.trim()) { ElMessage.warning('请输入作业标题'); return }

  homeworkAssignmentService.update(f.id, {
    title: f.title.trim(),
    content: f.content.trim(),
    description: f.description.trim(),
    dueDate: f.dueDate,
    timeRange: f.timeRange,
    notes: f.notes.trim()
  })

  const hwList = homeworkService.getAll().filter(h => h.assignmentId === f.id)
  hwList.forEach(h => {
    homeworkService.update(h.id, {
      title: f.title.trim(),
      content: f.content.trim(),
      description: f.description.trim(),
      dueDate: f.dueDate,
      timeRange: f.timeRange
    })
  })

  editVisible.value = false
  assignments.value = homeworkAssignmentService.getAll()
  ElMessage.success('作业已更新')
}
</script>

<style scoped>
.ha-btn-assign {
  padding: 8px 20px; border-radius: 8px;
  border: none; background: var(--admin-accent); color: #fff;
  font-size: 13px; font-family: inherit; cursor: pointer;
  transition: all 0.2s;
}
.ha-btn-assign:hover { filter: brightness(1.15); }

.ha-filters {
  background: var(--admin-bg);
  border-radius: var(--admin-radius);
  padding: 12px 16px;
  margin-bottom: 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.ha-filter-meta {
  font-size: 11px;
  color: var(--admin-text-muted);
  margin-left: auto;
}

.ha-table-wrap {
  border-radius: var(--admin-radius);
  overflow: hidden;
  border: 1px solid var(--admin-border);
}

.ha-pagination {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: var(--admin-bg);
}

.ha-student-link {
  color: var(--admin-accent);
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
}
.ha-student-link:hover { text-decoration: underline; }

.ha-student-pop { max-height: 200px; overflow-y: auto; }
.ha-student-pop-item {
  padding: 3px 0;
  font-size: 11px;
  color: var(--admin-text);
  border-bottom: 1px solid var(--admin-border);
}
.ha-student-pop-item:last-child { border-bottom: none; }

.ha-dist-preview {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--admin-bg);
  border-radius: 8px;
  border: 1px solid var(--admin-border);
}

.ha-dist-preview-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--admin-accent);
  margin-bottom: 6px;
}

.ha-dist-preview-list {
  font-size: 11px;
  color: var(--admin-text-secondary);
  line-height: 1.6;
}

.ha-edit-summary {
  font-size: 12px;
  color: var(--admin-text-muted);
  margin-bottom: 14px;
  padding: 8px 12px;
  background: var(--admin-bg);
  border-radius: 6px;
}

/* Stats */
.ha-stats-card { }

.hw-stats-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
  margin-bottom: 14px;
}

.hw-stats-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hw-stats-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hw-stats-label {
  font-size: 12px;
  color: var(--admin-text-secondary);
  width: 60px;
  flex-shrink: 0;
  font-weight: 600;
}

.hw-stats-bar-bg {
  flex: 1;
  height: 7px;
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
  width: 40px;
  text-align: right;
  flex-shrink: 0;
}

.ha-recent-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ha-recent-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--admin-border);
  font-size: 12px;
}

.ha-recent-row:last-child { border-bottom: none; }

.ha-recent-subject {
  font-weight: 600;
  width: 55px;
  flex-shrink: 0;
}

.ha-recent-title {
  color: var(--admin-text);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ha-recent-date {
  color: var(--admin-text-muted);
  font-size: 11px;
}

.hw-defaulter-empty {
  text-align: center;
  padding: 20px;
  color: var(--admin-text-muted);
  font-size: 13px;
}

@media (max-width: 768px) {
  .ha-filters { flex-direction: column; }
}
</style>
