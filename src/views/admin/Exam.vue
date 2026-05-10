<template>
  <div>
    <!-- Stats -->
    <div class="admin-card" style="margin-bottom:14px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        <div v-for="s in errorStats" :key="s.label" style="background:var(--admin-bg);border-radius:10px;padding:14px;text-align:center">
          <div :style="{fontSize:'24px',fontWeight:700,color:s.color}">{{ s.value }}</div>
          <div style="font-size:11px;color:var(--admin-text-muted);margin-top:2px">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="admin-card">
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center">
        <button v-for="tab in tabs" :key="tab.key" class="ex-tab" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.label }}</button>
        <div style="display:flex;gap:6px;margin-left:auto">
          <el-select v-model="errorFilterSubject" size="small" placeholder="科目" style="width:110px" clearable>
            <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="errorFilterSourceType" size="small" placeholder="来源" style="width:100px" clearable>
            <el-option label="考试" value="exam" /><el-option label="作业" value="homework" /><el-option label="测验" value="test" />
          </el-select>
          <el-select v-model="errorFilterClass" size="small" placeholder="班级" style="width:90px" clearable>
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-button size="small" type="primary" @click="openErrorDialog(null)">+ 添加错题</el-button>
        </div>
      </div>

      <!-- === TAB: 按科目分组 === -->
      <div v-if="activeTab === 'bySubject'">
        <div v-for="grp in errorsBySubject" :key="grp.subject" class="ex-subject-group">
          <div class="ex-group-header" @click="grp.expanded = !grp.expanded">
            <span class="ex-group-arrow">{{ grp.expanded ? '▼' : '▶' }}</span>
            <span class="ex-group-subject" :style="{color:subjectColor(grp.subject)}">{{ grp.subject }}</span>
            <span class="ex-group-count">{{ grp.errors.length }}题</span>
            <span style="flex:1"></span>
            <el-button size="small" text @click.stop="grp.expanded = true; selectAllInGroup(grp)">全选</el-button>
          </div>
          <div v-if="grp.expanded" class="ex-group-body">
            <div v-for="e in grp.errors" :key="e.id" class="ex-error-card">
              <div class="ex-card-top">
                <el-checkbox v-model="e._selected" style="margin-right:8px" />
                <span class="admin-tag" :class="errorTagClass(e.errorType)" style="font-size:10px">{{ errorTypeLabel(e.errorType) }}</span>
                <span class="ex-source-tag">{{ sourceTypeLabel(e.sourceType) }}: {{ e.source }}</span>
                <span style="font-size:10px;color:var(--admin-text-muted);margin-left:auto">{{ e.lastDate }}</span>
              </div>
              <div class="ex-card-body">
                <div class="ex-card-question">{{ e.question }}</div>
                <div v-if="e.correctAnswer" class="ex-card-answer">答案：{{ e.correctAnswer }}</div>
                <div class="ex-card-meta">
                  <span>关联学生：{{ e.studentNames }}</span>
                  <span v-if="e.inBank" class="admin-tag success" style="font-size:9px">已入库</span>
                  <span v-if="e.assignedTo" class="admin-tag info" style="font-size:9px">已分配给{{ e.assignedTo }}</span>
                </div>
              </div>
              <div class="ex-card-actions">
                <el-button size="small" text @click="openErrorDialog(e)">编辑</el-button>
                <el-button size="small" text v-if="!e.inBank" type="success" @click="addOneToBank(e)">加入题库</el-button>
                <el-button size="small" text type="warning" @click="openAssignDialog(e)">分配</el-button>
                <el-button size="small" text type="danger" @click="deleteError(e)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredErrors.length === 0" style="text-align:center;padding:30px;color:var(--admin-text-muted)">暂无错题记录</div>
      </div>

      <!-- === TAB: 按学生分组 === -->
      <div v-if="activeTab === 'byStudent'">
        <div v-for="grp in errorsByStudent" :key="grp.studentName" class="ex-subject-group">
          <div class="ex-group-header" @click="grp.expanded = !grp.expanded">
            <span class="ex-group-arrow">{{ grp.expanded ? '▼' : '▶' }}</span>
            <span class="ex-group-subject">{{ grp.studentName }}</span>
            <span style="font-size:10px;color:var(--admin-text-muted)">{{ grp.class }}</span>
            <span class="ex-group-count">{{ grp.errors.length }}题</span>
          </div>
          <div v-if="grp.expanded" class="ex-group-body">
            <div v-for="e in grp.errors" :key="e.id" class="ex-error-card">
              <div class="ex-card-top">
                <span class="admin-tag" :class="errorTagClass(e.errorType)" style="font-size:10px">{{ errorTypeLabel(e.errorType) }}</span>
                <span class="ex-subj-badge" :style="{background:subjectColor(e.subject)}">{{ e.subject }}</span>
                <span style="font-size:10px;color:var(--admin-text-muted);margin-left:auto">{{ e.lastDate }}</span>
              </div>
              <div class="ex-card-body">
                <div class="ex-card-question">{{ e.question }}</div>
                <div class="ex-card-meta">
                  <span>知识点：{{ e.topic }}</span>
                  <span>来源：{{ e.source }}</span>
                </div>
              </div>
              <div class="ex-card-actions">
                <el-button size="small" text @click="openErrorDialog(e)">编辑</el-button>
                <el-button size="small" text v-if="!e.inBank" type="success" @click="addOneToBank(e)">加入题库</el-button>
                <el-button size="small" text type="danger" @click="deleteError(e)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- === TAB: 全部列表 === -->
      <div v-if="activeTab === 'all'">
        <el-table :data="paginatedErrors" stripe size="small" style="width:100%">
          <el-table-column type="selection" width="40" />
          <el-table-column label="科目" width="90">
            <template #default="{ row }">
              <span :style="{color:subjectColor(row.subject),fontWeight:600,fontSize:'12px'}">{{ row.subject }}</span>
            </template>
          </el-table-column>
          <el-table-column label="题目" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.question }}</template>
          </el-table-column>
          <el-table-column label="错误类型" width="100">
            <template #default="{ row }">
              <span class="admin-tag" :class="errorTagClass(row.errorType)" style="font-size:10px">{{ errorTypeLabel(row.errorType) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="topic" label="知识点" width="90" />
          <el-table-column label="来源" width="110">
            <template #default="{ row }">{{ sourceTypeLabel(row.sourceType) }}: {{ row.source }}</template>
          </el-table-column>
          <el-table-column prop="studentNames" label="关联学生" width="130" />
          <el-table-column prop="lastDate" label="日期" width="100" />
          <el-table-column label="操作" fixed="right" width="180">
            <template #default="{ row }">
              <el-button size="small" text @click="openErrorDialog(row)">编辑</el-button>
              <el-button size="small" text v-if="!row.inBank" type="success" @click="addOneToBank(row)">入库</el-button>
              <el-button size="small" text type="danger" @click="deleteError(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:11px;color:var(--admin-text-muted)">共 {{ totalErrors }} 道错题</span>
          <el-pagination v-model:current-page="errorCurrentPage" v-model:page-size="errorPageSize" :page-sizes="[10,15,20,50]" :total="totalErrors" layout="total, sizes, prev, pager, next" size="small" background />
        </div>
      </div>

      <!-- === TAB: 考试成绩 === -->
      <div v-if="activeTab === 'exams'">
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <el-select v-model="examFilterSubject" size="small" placeholder="科目" style="width:110px" clearable>
            <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
          </el-select>
          <el-select v-model="examFilterStudent" size="small" placeholder="学生" style="width:120px" clearable filterable>
            <el-option v-for="s in studentList" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <span style="flex:1"></span>
          <el-button size="small" type="primary" @click="openExamDialog(null)">+ 录入成绩</el-button>
        </div>
        <el-table :data="filteredExams" stripe size="small" style="width:100%">
          <el-table-column prop="studentName" label="学生" fixed width="100" />
          <el-table-column prop="subject" label="科目" width="100" />
          <el-table-column prop="examType" label="类型" width="80" />
          <el-table-column label="得分" width="80">
            <template #default="{ row }">
              <b :style="{color:scoreColor(row.score, row.total)}">{{ row.score }}</b><span style="color:var(--admin-text-muted);font-size:10px">/{{ row.total }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="date" label="日期" width="100" />
          <el-table-column label="反馈" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">{{ row.teacherFeedback || '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="120">
            <template #default="{ row }">
              <el-button size="small" text @click="openExamDialog(row)">编辑</el-button>
              <el-button size="small" text type="danger" @click="deleteExam(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:11px;color:var(--admin-text-muted)">共 {{ totalFilteredExams }} 条记录</span>
          <el-pagination v-model:current-page="examCurrentPage" v-model:page-size="examPageSize" :page-sizes="[10,15,20,50]" :total="totalFilteredExams" layout="total, sizes, prev, pager, next" size="small" background />
        </div>
      </div>

      <!-- Bottom actions -->
      <div style="display:flex;gap:8px;margin-top:12px" v-if="activeTab !== 'exams'">
        <el-button size="small" @click="printErrors">🖨️ 打印错题卷</el-button>
        <el-button size="small" type="warning" @click="printErrorRedo">🔁 错题重做（无答案版）</el-button>
        <el-button size="small" type="success" @click="batchAddToBank">📦 批量加入题库</el-button>
      </div>
    </div>

    <!-- === Error Edit Dialog === -->
    <el-dialog v-model="errorDialogVisible" :title="errorEditingId ? '编辑错题' : '添加错题'" width="700px" top="3vh" :close-on-click-modal="false">
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>科目 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="errorForm.subject" style="width:100%">
            <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>知识点</label>
          <el-input v-model="errorForm.topic" placeholder="如：二次函数" />
        </div>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>错误类型</label>
          <el-select v-model="errorForm.errorType" style="width:100%">
            <el-option v-for="et in errorTypes" :key="et.value" :label="et.label" :value="et.value" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>关联学生</label>
          <el-select v-model="errorForm.studentIds" style="width:100%" multiple filterable>
            <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
          </el-select>
        </div>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>来源类型</label>
          <el-select v-model="errorForm.sourceType" style="width:100%">
            <el-option label="考试" value="exam" /><el-option label="作业" value="homework" /><el-option label="测验" value="test" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>来源描述</label>
          <el-input v-model="errorForm.source" placeholder="如：2026年5月月考" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>题目内容 <span style="color:var(--admin-danger)">*</span></label>
        <MdEditor v-model="errorForm.question" :theme="store.theme" language="zh-CN" :toolbars="mdToolbars" :noPrettier="true" :noMermaid="true" />
      </div>
      <div class="admin-form-group">
        <label>正确答案</label>
        <MdEditor v-model="errorForm.correctAnswer" :theme="store.theme" language="zh-CN" previewTheme="github" :toolbars="mdToolbars" :noPrettier="true" :noMermaid="true" />
      </div>
      <div class="admin-form-group">
        <label>解析（Markdown）</label>
        <MdEditor v-model="errorForm.analysis" :theme="store.theme" language="zh-CN" previewTheme="github" :toolbars="mdToolbars" :noPrettier="true" :noMermaid="true" />
      </div>
      <template #footer>
        <el-button @click="errorDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveError">{{ errorEditingId ? '保存修改' : '添加错题' }}</el-button>
      </template>
    </el-dialog>

    <!-- === Exam Dialog (simplified) === -->
    <el-dialog v-model="examDialogVisible" :title="examEditingId ? '编辑考试成绩' : '录入考试成绩'" width="560px">
      <div class="admin-form-group">
        <label>学生 <span style="color:var(--admin-danger)">*</span></label>
        <el-select v-model="examForm.studentId" style="width:100%" filterable>
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>科目</label>
          <el-select v-model="examForm.subject" style="width:100%">
            <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>类型</label>
          <el-select v-model="examForm.examType" style="width:100%">
            <el-option v-for="t in examTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>日期</label>
          <el-date-picker v-model="examForm.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </div>
      </div>
      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group"><label>满分</label><el-input-number v-model="examForm.total" :min="1" :max="300" size="small" style="width:100%" /></div>
        <div class="admin-form-group"><label>得分</label><el-input-number v-model="examForm.score" :min="0" :max="examForm.total" size="small" style="width:100%" /></div>
        <div class="admin-form-group"><label>错题数</label><el-input-number v-model="examForm.mistakes" :min="0" :max="50" size="small" style="width:100%" /></div>
      </div>
      <div class="admin-form-group">
        <label>教师反馈</label>
        <el-input v-model="examForm.teacherFeedback" type="textarea" :rows="3" placeholder="对学生的评价与建议..." />
      </div>
      <template #footer>
        <el-button @click="examDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveExam">{{ examEditingId ? '保存修改' : '录入成绩' }}</el-button>
      </template>
    </el-dialog>

    <!-- Assign dialog -->
    <el-dialog v-model="assignDialogVisible" title="分配错题" width="440px">
      <div class="admin-form-group">
        <label>分配给学生</label>
        <el-select v-model="assignForm.studentId" style="width:100%" filterable clearable placeholder="选择学生">
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-form-group">
        <label>或分配给班级</label>
        <el-select v-model="assignForm.class" style="width:100%" clearable placeholder="选择班级">
          <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doAssign">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { examService, studentService, courseService, errorBookService, questionBankService } from '@/services/dataService'
import { getPrintWatermarkHTML, getPrintWatermarkStyle } from '@/utils/printTemplate'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { marked } from 'marked'
import { useAppStore } from '@/stores/app'

const store = useAppStore()

const mdToolbars = ['bold', 'italic', 'underline', 'strikeThrough', 'title', '|', 'quote', 'unorderedList', 'orderedList', 'codeRow', 'code', '|', 'link', 'katex', 'table', '|', 'revoke', 'next', 'save', 'preview']

const exams = ref([])
const errors = ref([])
const studentList = ref([])
const activeTab = ref('bySubject')
const errorFilterSubject = ref('')
const errorFilterSourceType = ref('')
const errorFilterClass = ref('')
const examFilterSubject = ref('')
const examFilterStudent = ref('')

const tabs = [
  { key: 'bySubject', label: '📂 按科目分组' },
  { key: 'byStudent', label: '👤 按学生分组' },
  { key: 'all', label: '📋 全部列表' },
  { key: 'exams', label: '📊 考试成绩' }
]

const subjectList = computed(() => courseService.getAllNames())
const classList = computed(() => studentService.getClasses())
const examTypes = ['月考', '期中', '期末', '模考', 'DSE真题', '课堂测验']

const errorTypes = [
  { label: '计算失误', value: 'calc' },
  { label: '概念不清', value: 'concept' },
  { label: '审题偏差', value: 'reading' },
  { label: '粗心', value: 'careless' },
  { label: '综合能力不足', value: 'comprehensive' }
]
const errorTypeMap = { calc:'计算失误', concept:'概念不清', reading:'审题偏差', careless:'粗心', comprehensive:'综合能力不足' }
function errorTypeLabel(t) { return errorTypeMap[t] || t }
function sourceTypeLabel(t) { return { exam:'考试', homework:'作业', test:'测验' }[t] || t }

// Subject colors
const subjectColors = {
  '数学':'#3b82f6','中国语文':'#22c55e','英国语文':'#8b5cf6','物理':'#f59e0b','化学':'#ef4444','生物':'#10b981','历史':'#78716c','地理':'#06b6d4','经济':'#f97316','资讯及通讯科技':'#6366f1'
}
function subjectColor(s) { return subjectColors[s] || 'var(--admin-accent)' }

// -- Error CRUD --
const errorDialogVisible = ref(false)
const errorEditingId = ref(null)
const assignDialogVisible = ref(false)
const assignForm = ref({ errorId: null, studentId: null, class: '' })
const errorForm = ref({
  subject:'数学', topic:'', errorType:'calc', studentIds:[], studentNames:'',
  sourceType:'exam', source:'', question:'', correctAnswer:'', analysis:'',
  inBank: false, assignedTo:'', assignedClass:''
})

function openErrorDialog(e) {
  if (e) {
    errorEditingId.value = e.id
    errorForm.value = {
      subject: e.subject, topic: e.topic || '', errorType: e.errorType,
      studentIds: e.studentIds || [], studentNames: e.studentNames || '',
      sourceType: e.sourceType || 'exam', source: e.source || '',
      question: e.question || '', correctAnswer: e.correctAnswer || '',
      analysis: e.analysis || '', inBank: e.inBank || false,
      assignedTo: e.assignedTo || '', assignedClass: e.assignedClass || ''
    }
  } else {
    errorEditingId.value = null
    errorForm.value = { subject:'数学', topic:'', errorType:'calc', studentIds:[], studentNames:'', sourceType:'exam', source:'', question:'', correctAnswer:'', analysis:'', inBank:false, assignedTo:'', assignedClass:'' }
  }
  errorDialogVisible.value = true
}

function saveError() {
  if (!errorForm.value.question) { ElMessage.warning('请输入错题内容'); return }
  const ids = errorForm.value.studentIds || []
  const names = ids.map(id => studentList.value.find(s => s.id === id)?.name || '').filter(Boolean)
  const classes = ids.map(id => studentList.value.find(s => s.id === id)?.class || '').filter(Boolean)
  const data = {
    ...errorForm.value,
    studentIds: ids,
    studentNames: names.join('、'),
    count: ids.length || 1,
    lastDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    assignedClass: errorForm.value.assignedClass || (classes.length === 1 ? classes[0] : '')
  }
  if (errorEditingId.value) {
    errorBookService.update(errorEditingId.value, data)
    ElMessage.success('错题已更新')
  } else {
    errorBookService.create(data)
    ElMessage.success('错题已添加')
  }
  errorDialogVisible.value = false
  loadErrors()
}

async function deleteError(e) {
  try {
    await ElMessageBox.confirm('确定删除此错题吗？', '确认删除', { confirmButtonText:'删除', cancelButtonText:'取消', type:'warning' })
    errorBookService.delete(e.id)
    loadErrors()
    ElMessage.success('已删除')
  } catch {}
}

// -- Assign --
function openAssignDialog(e) {
  assignForm.value = { errorId: e.id, studentId: null, class: '' }
  assignDialogVisible.value = true
}

function doAssign() {
  const e = errors.value.find(x => x.id === assignForm.value.errorId)
  if (!e) return
  if (assignForm.value.studentId) {
    const s = studentList.value.find(x => x.id === assignForm.value.studentId)
    if (s) {
      errorBookService.update(e.id, { assignedTo: s.name, assignedClass: s.class })
    }
  } else if (assignForm.value.class) {
    errorBookService.update(e.id, { assignedClass: assignForm.value.class })
  }
  assignDialogVisible.value = false
  loadErrors()
  ElMessage.success('已分配')
}

// -- Add to bank --
function addOneToBank(e) {
  if (!e.question) { ElMessage.warning('题目内容为空'); return }
  questionBankService.create({
    subject: e.subject, topic: e.topic, type: 'mc', difficulty: 'medium',
    score: 5, suggestedTime: 3, text: e.question, answer: e.correctAnswer || '',
    steps: e.analysis || '', knowledgePoint: e.topic || '',
    commonMistakes: errorTypeLabel(e.errorType),
    estimatedRate: 60, source: 'error_book', createdAt: new Date().toISOString().split('T')[0]
  })
  errorBookService.update(e.id, { inBank: true })
  loadErrors()
  ElMessage.success('已加入题库')
}

function batchAddToBank() {
  let count = 0
  errors.value.forEach(e => {
    if (e._selected && !e.inBank) {
      addOneToBank(e)
      count++
    }
  })
  if (count === 0) {
    // Add all visible
    filteredErrors.value.filter(e => !e.inBank).forEach(e => { addOneToBank(e); count++ })
  }
  if (count === 0) { ElMessage.warning('没有可入库的错题'); return }
  ElMessage.success(`已将 ${count} 道错题加入题库`)
}

function selectAllInGroup(grp) {
  const allSelected = grp.errors.every(e => e._selected)
  grp.errors.forEach(e => e._selected = !allSelected)
}

// -- Filtered errors --
const filteredErrors = computed(() => {
  return errors.value.filter(e => {
    if (errorFilterSubject.value && e.subject !== errorFilterSubject.value) return false
    if (errorFilterSourceType.value && e.sourceType !== errorFilterSourceType.value) return false
    if (errorFilterClass.value && e.assignedClass !== errorFilterClass.value) return false
    return true
  })
})

const totalErrors = computed(() => filteredErrors.value.length)

const errorsBySubject = computed(() => {
  const map = new Map()
  filteredErrors.value.forEach(e => {
    if (!map.has(e.subject)) map.set(e.subject, [])
    map.get(e.subject).push({ ...e, _selected: false })
  })
  return [...map.entries()].map(([subject, errors]) => ({
    subject, errors, expanded: true
  })).sort((a, b) => b.errors.length - a.errors.length)
})

const errorsByStudent = computed(() => {
  const map = new Map()
  filteredErrors.value.forEach(e => {
    const names = e.studentNames ? e.studentNames.split('、') : ['未知']
    names.forEach(name => {
      if (!map.has(name)) map.set(name, [])
      map.get(name).push(e)
    })
  })
  return [...map.entries()].map(([studentName, errors]) => ({
    studentName, class: errors[0]?.assignedClass || '', errors, expanded: false
  })).sort((a, b) => a.studentName.localeCompare(b.studentName, 'zh'))
})

const errorCurrentPage = ref(1)
const errorPageSize = ref(15)
const paginatedErrors = computed(() => {
  const start = (errorCurrentPage.value - 1) * errorPageSize.value
  return filteredErrors.value.slice(start, start + errorPageSize.value)
})

// -- Exam CRUD (simplified) --
const examDialogVisible = ref(false)
const examEditingId = ref(null)
const examForm = ref({ studentId:null, subject:'数学', examType:'月考', total:100, score:0, mistakes:0, date:new Date().toISOString().split('T')[0], teacherFeedback:'' })
const examCurrentPage = ref(1)
const examPageSize = ref(15)

const filteredExams = computed(() => {
  return exams.value.filter(e => {
    if (examFilterSubject.value && e.subject !== examFilterSubject.value) return false
    if (examFilterStudent.value && e.studentName !== examFilterStudent.value) return false
    return true
  })
})

const totalFilteredExams = computed(() => filteredExams.value.length)

function openExamDialog(exam) {
  if (exam) {
    examEditingId.value = exam.id
    examForm.value = { studentId:exam.studentId, subject:exam.subject, examType:exam.examType, total:exam.total, score:exam.score, mistakes:exam.mistakes, date:exam.date, teacherFeedback:exam.teacherFeedback || '' }
  } else {
    examEditingId.value = null
    examForm.value = { studentId:null, subject:'数学', examType:'月考', total:100, score:0, mistakes:0, date:new Date().toISOString().split('T')[0], teacherFeedback:'' }
  }
  examDialogVisible.value = true
}

function saveExam() {
  if (!examForm.value.studentId) { ElMessage.warning('请选择学生'); return }
  const s = studentList.value.find(x => x.id === examForm.value.studentId)
  const data = { ...examForm.value, studentName: s?.name || '', topics: [] }
  if (examEditingId.value) {
    examService.update(examEditingId.value, data); ElMessage.success('已更新')
  } else {
    examService.create(data); ElMessage.success('已录入')
  }
  examDialogVisible.value = false
  exams.value = examService.getAll()
}

async function deleteExam(exam) {
  try {
    await ElMessageBox.confirm(`确定删除「${exam.studentName}」的${exam.subject}成绩吗？`, '确认删除', { confirmButtonText:'删除', cancelButtonText:'取消', type:'warning' })
    examService.delete(exam.id); exams.value = examService.getAll(); ElMessage.success('已删除')
  } catch {}
}

// Stats
const errorStats = computed(() => {
  const all = errors.value
  const inBank = all.filter(e => e.inBank).length
  return [
    { label:'错题总数', value:all.length, color:'var(--admin-warning)' },
    { label:'涉及科目', value:[...new Set(all.map(e=>e.subject))].length, color:'var(--admin-primary)' },
    { label:'已入题库', value:inBank, color:'var(--admin-success)' },
    { label:'已分配', value:all.filter(e=>e.assignedTo||e.assignedClass).length, color:'var(--admin-info)' }
  ]
})

function scoreColor(score, total) {
  const r = score / total
  return r >= 0.9?'var(--admin-success)':r >= 0.75?'var(--admin-primary)':r >= 0.6?'var(--admin-warning)':'var(--admin-danger)'
}
function errorTagClass(t) { return { calc:'warning', concept:'primary', reading:'info', careless:'warning', comprehensive:'danger' }[t] || 'info' }

// Print
function printErrors() {
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>错题卷</title><style>
    body{font-family:'Microsoft YaHei',sans-serif;padding:24px;color:#2c2c2c;max-width:800px;margin:0 auto;line-height:1.8}
    h2{text-align:center;margin-bottom:4px}
    .err-item{margin-bottom:16px;padding:12px;border:1px solid #eee;border-radius:8px;page-break-inside:avoid}
    .err-num{font-weight:700;font-size:14px;margin-bottom:6px}
    .err-meta{font-size:11px;color:#888;margin-bottom:4px}
    .err-body p{text-indent:2em;margin:6px 0}
    .err-body ul,.err-body ol{padding-left:2em;margin:6px 0}
    .err-body blockquote{border-left:3px solid #c4a85c;margin:10px 0;padding:6px 14px;background:#faf7ee;font-style:italic;color:#5c3d1e}
    .err-body blockquote p{text-indent:0}
    @page{size:A4;margin:15mm}
    ${getPrintWatermarkStyle()}
  </style></head><body><h2>错题汇总卷</h2>`
  filteredErrors.value.forEach((e, i) => {
    html += `<div class="err-item"><div class="err-num">${i+1}. [${e.subject} · ${e.topic}] <span style="color:#888;font-size:11px">${errorTypeLabel(e.errorType)}</span></div><div class="err-body">${marked.parse(e.question || '')}</div><div class="err-meta">来源：${e.source} · 关联学生：${e.studentNames}</div></div>`
  })
  html += getPrintWatermarkHTML() + '</body></html>'
  const w = window.open('', '_blank', 'width=750,height=600')
  w.document.write(html); w.document.close()
  setTimeout(() => w.print(), 300)
}

function printErrorRedo() {
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>错题重做</title><style>
    body{font-family:'Microsoft YaHei',sans-serif;padding:20px;color:#333;max-width:700px;margin:0 auto;line-height:1.8}
    h2{text-align:center;margin-bottom:4px}
    .err-item{margin-bottom:18px;page-break-inside:avoid}
    .err-num{font-weight:700;margin-bottom:4px}
    .answer-space{margin-top:30px;border-bottom:1px dashed #ddd;height:40px}
    .err-body p{text-indent:2em;margin:6px 0}
    .err-body ul,.err-body ol{padding-left:2em;margin:6px 0}
    .err-body blockquote{border-left:3px solid #c4a85c;margin:10px 0;padding:6px 14px;background:#faf7ee;font-style:italic;color:#5c3d1e}
    .err-body blockquote p{text-indent:0}
    @page{size:A4;margin:15mm}
    ${getPrintWatermarkStyle()}
  </style></head><body><h2>错题重做练习卷</h2>`
  filteredErrors.value.forEach((e, i) => {
    html += `<div class="err-item"><div class="err-num">${i+1}. <span style="color:#666;font-size:11px">[${e.subject} · ${e.topic}]</span></div><div class="err-body">${marked.parse(e.question || '')}</div><div class="answer-space"></div></div>`
  })
  html += getPrintWatermarkHTML() + '</body></html>'
  const w = window.open('', '_blank', 'width=750,height=600')
  w.document.write(html); w.document.close()
  setTimeout(() => w.print(), 300)
}

function loadErrors() {
  errors.value = errorBookService.getAll()
}

onMounted(() => {
  studentList.value = studentService.getAll()
  exams.value = examService.getAll()
  loadErrors()
})
</script>

<style scoped>
.ex-tab { padding:5px 16px; border:1px solid var(--admin-border); background:var(--admin-surface); border-radius:20px; font-size:12px; cursor:pointer; color:var(--admin-text-muted); transition:all 0.2s; }
.ex-tab.active { background:var(--admin-primary); color:#fff; border-color:var(--admin-primary); }

.ex-subject-group { margin-bottom:8px; }
.ex-group-header { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--admin-bg); border-radius:8px; cursor:pointer; user-select:none; transition:background 0.15s; }
.ex-group-header:hover { background:var(--admin-surface-hover); }
.ex-group-arrow { font-size:10px; color:var(--admin-text-muted); width:16px; }
.ex-group-subject { font-size:13px; font-weight:600; }
.ex-group-count { font-size:11px; color:var(--admin-text-muted); background:var(--admin-surface); padding:1px 8px; border-radius:10px; }

.ex-error-card { background:var(--admin-surface); border:1px solid var(--admin-border); border-radius:8px; padding:10px 12px; margin-bottom:6px; }
.ex-card-top { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
.ex-source-tag { font-size:10px; color:var(--admin-text-muted); background:var(--admin-bg); padding:1px 6px; border-radius:4px; }
.ex-subj-badge { font-size:9px; color:#fff; padding:1px 6px; border-radius:4px; }
.ex-card-body { margin-bottom:6px; }
.ex-card-question { font-size:12px; color:var(--admin-text); line-height:1.7; margin-bottom:4px; }
.ex-card-answer { font-size:11px; color:var(--admin-success); background:rgba(34,197,94,0.06); padding:4px 8px; border-radius:4px; margin-bottom:4px; }
.ex-card-meta { font-size:10px; color:var(--admin-text-muted); display:flex; gap:10px; }
.ex-card-actions { display:flex; gap:4px; padding-top:0; border-top:1px solid transparent; opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.3s ease, max-height 0.3s ease, padding-top 0.3s ease, border-color 0.3s ease; }
.ex-error-card .ex-card-actions { opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s ease; }
</style>
