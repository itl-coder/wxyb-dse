<template>
  <div class="et-page">
    <!-- Header -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">💡 做题技巧库</div>
          <div class="admin-card-subtitle">分科目 · 分题型 · 分学生问题 · 审核后发布至学生门户</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span v-if="pendingCount" style="font-size:11px;color:var(--admin-warning);font-weight:600">待审核 {{ pendingCount }} 条</span>
          <el-button size="small" type="primary" @click="openAddDialog">+ 新增技巧</el-button>
        </div>
      </div>
    </div>

    <div class="et-layout">
      <!-- Left: Filters -->
      <div class="et-sidebar">
        <div class="admin-card">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">🔍 筛选条件</div>
          <div class="admin-form-group">
            <label>科目</label>
            <el-select v-model="filterSubject" style="width:100%" clearable @change="onFilterChange">
              <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>题型</label>
            <div style="max-height:150px;overflow-y:auto">
              <el-checkbox v-for="t in availableQuestionTypes" :key="t" :model-value="filterQuestionTypes.includes(t)" size="small" style="display:block;margin-bottom:4px" @change="(v) => toggleFilterArr('questionTypes', t, v)">{{ t }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <label>学生问题</label>
            <div style="max-height:150px;overflow-y:auto">
              <el-checkbox v-for="p in availableStudentProblems" :key="p" :model-value="filterStudentProblems.includes(p)" size="small" style="display:block;margin-bottom:4px" @change="(v) => toggleFilterArr('studentProblems', p, v)">{{ p }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <label>审核状态</label>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <el-checkbox v-for="s in statusOptions" :key="s.value" :model-value="filterStatuses.includes(s.value)" size="small" @change="(v) => toggleFilterArr('statuses', s.value, v)">{{ s.label }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <el-input v-model="searchText" size="small" placeholder="搜索标题或内容..." clearable @change="currentPage=1" />
          </div>
        </div>
        <div class="admin-card" style="margin-top:8px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:10px">📊 技巧统计</div>
          <div style="font-size:11px;color:var(--admin-text-secondary);line-height:1.8">
            <div>总计：<b style="color:var(--admin-text)">{{ allTips.length }}</b> 条</div>
            <div>已通过：<b style="color:var(--admin-success)">{{ approvedCount }}</b> 条</div>
            <div>待审核：<b style="color:var(--admin-warning)">{{ pendingCount }}</b> 条</div>
            <div style="margin-top:6px" v-for="s in statsBySubject" :key="s.subject" :style="{display:'flex',alignItems:'center',gap:'6px'}">
              <span style="width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ s.subject }}</span>
              <div style="flex:1;height:4px;background:var(--admin-bg);border-radius:2px"><div :style="{width:s.pct+'%',background:subjectColor(s.subject),height:'100%',borderRadius:'2px'}"></div></div>
              <span style="min-width:20px;text-align:right">{{ s.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Tip Cards -->
      <div class="et-main">
        <div class="admin-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:var(--admin-text)">📝 技巧列表（{{ filteredTips.length }} 条）</span>
          </div>
          <div class="et-list">
            <div v-for="tip in paginatedTips" :key="tip.id" class="et-item" :class="{ rejected: tip.status === 'rejected' }">
              <div class="et-item-body">
                <div class="et-item-header">
                  <span class="et-subject-tag" :style="{background:subjectColor(tip.subject),color:'#fff'}">{{ tip.subject }}</span>
                  <span class="admin-tag" :class="statusClass(tip.status)" style="font-size:10px">{{ statusLabel(tip.status) }}</span>
                  <span class="admin-tag info" style="font-size:10px">{{ tip.questionType }}</span>
                  <span style="font-size:10px;color:var(--admin-text-muted);margin-left:auto">{{ tip.createdAt }}</span>
                </div>
                <div class="et-title">{{ tip.techniqueTitle }}</div>
                <div class="et-meta">
                  <span>学生问题：{{ tip.studentProblem }}</span>
                </div>
                <div class="et-preview">{{ stripMd(tip.content).slice(0, 120) }}{{ tip.content.length > 120 ? '...' : '' }}</div>
                <div v-if="tip.status === 'rejected' && tip.reviewComment" class="et-review-comment">
                  ⚠️ 驳回原因：{{ tip.reviewComment }}
                </div>
                <div class="et-actions">
                  <el-button size="small" text type="primary" @click="openEditDialog(tip)">编辑</el-button>
                  <el-button v-if="tip.status === 'pending'" size="small" text type="success" @click="approveTip(tip)">✅ 通过</el-button>
                  <el-button v-if="tip.status === 'pending'" size="small" text type="danger" @click="rejectTip(tip)">❌ 驳回</el-button>
                  <el-button v-if="tip.status === 'rejected'" size="small" text type="warning" @click="resubmitTip(tip)">🔄 重新提交</el-button>
                  <el-button size="small" text type="danger" @click="handleDelete(tip)">删除</el-button>
                </div>
              </div>
            </div>
            <div v-if="filteredTips.length === 0" style="text-align:center;padding:40px;color:var(--admin-text-muted)">
              暂无匹配技巧，请调整筛选条件或「新增技巧」
            </div>
          </div>
          <div style="margin-top:12px;display:flex;align-items:center;justify-content:flex-end">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[6,10,20,50]" :total="filteredTips.length" layout="total, sizes, prev, pager, next" size="small" background />
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑技巧' : '新增技巧'" width="720px" top="3vh" :close-on-click-modal="false">
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>科目 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="form.subject" style="width:100%">
            <el-option v-for="s in allSubjects" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>题型 <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="form.questionType" placeholder="如：推断题、选择题、计算题..." />
        </div>
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>学生常见问题</label>
          <el-input v-model="form.studentProblem" placeholder="如：凭感觉猜，不按原文找依据..." />
        </div>
        <div class="admin-form-group">
          <label>排序序号</label>
          <el-input-number v-model="form.sortOrder" :min="1" :max="999" size="small" style="width:100%" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>技巧标题 <span style="color:var(--admin-danger)">*</span></label>
        <el-input v-model="form.techniqueTitle" placeholder="如：推断题四步法——别脑补，找证据" />
      </div>
      <div class="admin-form-group">
        <label>技巧内容（Markdown） <span style="color:var(--admin-danger)">*</span></label>
        <MdEditor v-model="form.content" :theme="store.theme" language="zh-CN" previewTheme="github" :toolbars="mdToolbars" :noPrettier="true" :noMermaid="true" style="height:320px" />
      </div>
      <div v-if="editingId" class="admin-form-group">
        <label>当前状态</label>
        <span class="admin-tag" :class="statusClass(form.status)">{{ statusLabel(form.status) }}</span>
        <span v-if="form.reviewComment" style="font-size:11px;color:var(--admin-danger);margin-left:8px">驳回原因：{{ form.reviewComment }}</span>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="default" @click="saveTip('draft')">💾 保存草稿</el-button>
        <el-button type="primary" @click="saveTip('pending')">📤 提交审核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { examTipService, courseService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'

const store = useAppStore()

const mdToolbars = ['bold', 'italic', 'underline', 'strikeThrough', 'title', '|', 'quote', 'unorderedList', 'orderedList', 'codeRow', 'code', '|', 'link', 'katex', 'table', '|', 'revoke', 'next', 'save', 'preview']

const allTips = ref([])
const filterSubject = ref('')
const filterQuestionTypes = ref([])
const filterStudentProblems = ref([])
const filterStatuses = ref([])
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const editingId = ref(null)

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

const allSubjects = computed(() => courseService.getAllNames())
const subjects = computed(() => examTipService.getAllSubjects().sort())

const availableQuestionTypes = computed(() => examTipService.getQuestionTypes(filterSubject.value || null))
const availableStudentProblems = computed(() => examTipService.getStudentProblems(filterSubject.value || null))

const pendingCount = computed(() => allTips.value.filter(t => t.status === 'pending').length)
const approvedCount = computed(() => allTips.value.filter(t => t.status === 'approved').length)

const statsBySubject = computed(() => {
  const map = {}
  allTips.value.forEach(t => { map[t.subject] = (map[t.subject] || 0) + 1 })
  const total = allTips.value.length || 1
  return Object.entries(map).map(([subject, count]) => ({
    subject, count, pct: Math.round(count / total * 100)
  })).sort((a, b) => b.count - a.count)
})

const subjectColors = {
  '数学': '#3b82f6', '中国语文': '#22c55e', '英国语文': '#8b5cf6',
  'English Reading': '#8b5cf6', 'English Writing': '#8b5cf6', 'English Listening': '#8b5cf6', 'English Speaking': '#8b5cf6',
  '物理': '#f59e0b', '化学': '#ef4444', '生物': '#10b981', '历史': '#78716c',
  '地理': '#06b6d4', '经济': '#f97316', '资讯及通讯科技': '#6366f1',
  '企业、会计与财务概论': '#14b8a6', '视觉艺术': '#ec4899', '体育': '#84cc16',
  '音乐': '#a855f7', '公民与社会发展': '#64748b', '数学延伸M1': '#3b82f6', '数学延伸M2': '#3b82f6'
}
function subjectColor(s) { return subjectColors[s] || 'var(--admin-accent)' }

const form = ref({
  subject: '数学', questionType: '', studentProblem: '', techniqueTitle: '',
  content: '', sortOrder: 10, status: 'draft', reviewComment: ''
})

onMounted(() => {
  allTips.value = examTipService.getAll()
})

function onFilterChange() {
  filterQuestionTypes.value = []
  filterStudentProblems.value = []
  currentPage.value = 1
}

function toggleFilterArr(prop, val, checked) {
  const map = {
    questionTypes: filterQuestionTypes,
    studentProblems: filterStudentProblems,
    statuses: filterStatuses
  }
  const arr = map[prop]
  if (checked) { if (!arr.value.includes(val)) arr.value.push(val) }
  else { arr.value = arr.value.filter(v => v !== val) }
  currentPage.value = 1
}

const filteredTips = computed(() => {
  return allTips.value.filter(t => {
    if (filterSubject.value && t.subject !== filterSubject.value) return false
    if (filterQuestionTypes.value.length && !filterQuestionTypes.value.includes(t.questionType)) return false
    if (filterStudentProblems.value.length && !filterStudentProblems.value.includes(t.studentProblem)) return false
    if (filterStatuses.value.length && !filterStatuses.value.includes(t.status)) return false
    if (searchText.value) {
      const kw = searchText.value.toLowerCase()
      if (!(t.techniqueTitle || '').toLowerCase().includes(kw) && !(t.content || '').toLowerCase().includes(kw)) return false
    }
    return true
  })
})

const paginatedTips = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTips.value.slice(start, start + pageSize.value)
})

function statusLabel(s) {
  return { draft: '草稿', pending: '待审核', approved: '已通过', rejected: '已拒绝' }[s] || s
}
function statusClass(s) {
  return { draft: 'info', pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'info'
}

function stripMd(md) {
  if (!md) return ''
  return md.replace(/[#*>_`~\[\]|]/g, '').replace(/\n+/g, ' ').trim()
}

// -- Add / Edit --
function openAddDialog() {
  editingId.value = null
  form.value = { subject: '数学', questionType: '', studentProblem: '', techniqueTitle: '', content: '', sortOrder: 10, status: 'draft', reviewComment: '' }
  dialogVisible.value = true
}

function openEditDialog(tip) {
  editingId.value = tip.id
  form.value = {
    subject: tip.subject, questionType: tip.questionType, studentProblem: tip.studentProblem || '',
    techniqueTitle: tip.techniqueTitle, content: tip.content, sortOrder: tip.sortOrder || 10,
    status: tip.status, reviewComment: tip.reviewComment || ''
  }
  dialogVisible.value = true
}

function saveTip(newStatus) {
  if (!form.value.subject || !form.value.questionType || !form.value.techniqueTitle || !form.value.content) {
    ElMessage.warning('请填写科目、题型、标题和内容')
    return
  }
  const data = {
    subject: form.value.subject,
    questionType: form.value.questionType,
    studentProblem: form.value.studentProblem,
    techniqueTitle: form.value.techniqueTitle,
    content: form.value.content,
    sortOrder: form.value.sortOrder,
    status: newStatus,
    reviewComment: '',
    createdBy: '张老师',
    createdAt: new Date().toISOString().split('T')[0]
  }

  if (editingId.value) {
    const existing = allTips.value.find(t => t.id === editingId.value)
    const updated = {
      ...existing,
      ...data,
      id: editingId.value,
      createdBy: existing.createdBy || data.createdBy,
      createdAt: existing.createdAt || data.createdAt,
      reviewedBy: newStatus === 'approved' ? '张老师' : (existing.reviewedBy || ''),
      reviewedAt: newStatus === 'approved' ? data.createdAt : (existing.reviewedAt || '')
    }
    examTipService.update(editingId.value, updated)
  } else {
    data.reviewedBy = newStatus === 'approved' ? '张老师' : ''
    data.reviewedAt = newStatus === 'approved' ? data.createdAt : ''
    examTipService.create(data)
  }

  allTips.value = examTipService.getAll()
  dialogVisible.value = false
  ElMessage.success(newStatus === 'pending' ? '已提交审核' : '草稿已保存')
}

// -- Review workflow --
function approveTip(tip) {
  examTipService.update(tip.id, {
    ...tip,
    status: 'approved',
    reviewedBy: '张老师',
    reviewedAt: new Date().toISOString().split('T')[0],
    reviewComment: ''
  })
  allTips.value = examTipService.getAll()
  ElMessage.success('已通过审核')
}

async function rejectTip(tip) {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回技巧', {
      confirmButtonText: '驳回', cancelButtonText: '取消',
      inputPlaceholder: '说明为什么驳回，便于修改后重新提交...'
    })
    if (value !== undefined) {
      examTipService.update(tip.id, {
        ...tip,
        status: 'rejected',
        reviewComment: value,
        reviewedBy: '张老师',
        reviewedAt: new Date().toISOString().split('T')[0]
      })
      allTips.value = examTipService.getAll()
      ElMessage.success('已驳回')
    }
  } catch {}
}

function resubmitTip(tip) {
  examTipService.update(tip.id, { ...tip, status: 'pending', reviewComment: '' })
  allTips.value = examTipService.getAll()
  ElMessage.success('已重新提交审核')
}

async function handleDelete(tip) {
  try {
    await ElMessageBox.confirm(`确定删除技巧「${tip.techniqueTitle}」吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    examTipService.delete(tip.id)
    allTips.value = examTipService.getAll()
    ElMessage.success('已删除')
  } catch {}
}
</script>

<style scoped>
.et-page { }

.et-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 14px;
  align-items: start;
  margin-top: 14px;
}

.et-sidebar {
  position: sticky;
  top: 8px;
}

.et-main {
  min-width: 0;
}

/* Tip Cards */
.et-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.et-item {
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 14px 16px;
  background: var(--admin-surface);
  transition: all 0.2s;
}
.et-item:hover {
  border-color: var(--admin-accent);
  box-shadow: 0 2px 12px rgba(201,160,80,0.1);
}
.et-item.rejected {
  border-left: 3px solid var(--admin-danger);
  opacity: 0.85;
}

.et-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.et-subject-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 3px;
  white-space: nowrap;
}

.et-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--admin-text);
  margin-bottom: 4px;
}

.et-meta {
  font-size: 11px;
  color: var(--admin-text-secondary);
  margin-bottom: 6px;
}

.et-preview {
  font-size: 12px;
  color: var(--admin-text-muted);
  line-height: 1.6;
  margin-bottom: 8px;
}

.et-review-comment {
  font-size: 11px;
  color: var(--admin-danger);
  background: rgba(239, 68, 68, 0.06);
  padding: 6px 10px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.et-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .et-layout {
    grid-template-columns: 1fr;
  }
  .et-sidebar {
    position: static;
  }
}
</style>
