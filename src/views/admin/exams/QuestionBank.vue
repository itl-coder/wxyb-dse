<template>
  <div class="qb-page">
    <!-- Header -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📚 题库中心</div>
          <div class="admin-card-subtitle">浏览 · 筛选 · 选题 · 组卷</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-button size="small" type="primary" @click="openAddDialog">+ 新增题目</el-button>
          <el-button size="small" @click="clearSelection" :disabled="selectedIds.length===0">清空选题 ({{ selectedIds.length }})</el-button>
          <el-button size="small" type="primary" @click="showPaperPreview = true" :disabled="selectedIds.length===0">📄 组卷预览</el-button>
        </div>
      </div>
    </div>

    <div class="qb-layout">
      <!-- Left: Filters -->
      <div class="qb-sidebar">
        <div class="admin-card">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">🔍 筛选条件</div>
          <div class="admin-form-group">
            <label>科目</label>
            <el-select v-model="filterSubject" style="width:100%" clearable @change="onSubjectChange">
              <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>难度</label>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <el-checkbox v-for="d in difficulties" :key="d.value" :model-value="filterDifficulties.includes(d.value)" size="small" @change="(v) => toggleFilter('difficulties', d.value, v)">{{ d.label }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <label>题型</label>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <el-checkbox v-for="t in types" :key="t.value" :model-value="filterTypes.includes(t.value)" size="small" @change="(v) => toggleFilter('types', t.value, v)">{{ t.label }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <label>知识点</label>
            <div style="max-height:180px;overflow-y:auto">
              <el-checkbox v-for="t in availableTopics" :key="t" :model-value="filterTopics.includes(t)" size="small" style="display:block;margin-bottom:4px" @change="(v) => toggleFilter('topics', t, v)">{{ t }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <el-input v-model="searchText" size="small" placeholder="搜索题目内容..." clearable />
          </div>
        </div>
        <div class="admin-card" style="margin-top:8px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:10px">📊 题库统计</div>
          <div style="font-size:11px;color:var(--admin-text-secondary);line-height:1.8">
            <div>总题数：<b style="color:var(--admin-text)">{{ totalQuestions }}</b></div>
            <div v-for="s in statsBySubject" :key="s.subject" style="display:flex;align-items:center;gap:6px">
              <span style="width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ s.subject }}</span>
              <div style="flex:1;height:4px;background:var(--admin-bg);border-radius:2px"><div :style="{width:s.pct+'%',background:subjectColor(s.subject),height:'100%',borderRadius:'2px'}"></div></div>
              <span style="min-width:24px;text-align:right">{{ s.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Question List -->
      <div class="qb-main">
        <div class="admin-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:var(--admin-text)">📝 题目列表（{{ filteredQuestions.length }} 题）</span>
            <div style="display:flex;gap:6px">
              <el-button size="small" @click="selectAll">全选本页</el-button>
              <el-button size="small" @click="deselectAll">取消全选</el-button>
            </div>
          </div>
          <div class="qb-list">
            <div v-for="q in paginatedQuestions" :key="q.id" class="qb-item" :class="{ selected: selectedIds.includes(q.id) }" @click="toggleSelect(q.id)">
              <div class="qb-item-left">
                <el-checkbox :model-value="selectedIds.includes(q.id)" @click.stop @change="() => toggleSelect(q.id)" />
                <span class="qb-item-id">#{{ q.id }}</span>
              </div>
              <div class="qb-item-body">
                <div class="qb-item-header">
                  <span class="qb-subject-tag" :style="{background:subjectColor(q.subject),color:'#fff'}">{{ q.subject }}</span>
                  <span class="admin-tag" :class="diffClass(q.difficulty)" style="font-size:10px">{{ diffLabel(q.difficulty) }}</span>
                  <span class="admin-tag info" style="font-size:10px">{{ typeLabel(q.type) }}</span>
                  <span class="qb-topic-tag">{{ q.topic }}</span>
                  <span v-if="q.year" style="font-size:10px;color:var(--admin-text-muted);margin-left:auto">{{ q.year }}年</span>
                  <span style="font-size:10px;color:var(--admin-text-muted)">{{ q.score }}分 · {{ q.suggestedTime }}分钟</span>
                </div>
                <div class="qb-text">{{ q.text.slice(0, 120) }}{{ q.text.length > 120 ? '...' : '' }}</div>
                <div class="qb-meta">
                  <span>知识点：{{ q.knowledgePoint }}</span>
                  <span v-if="q.estimatedRate" style="margin-left:8px">预估正确率：{{ q.estimatedRate }}%</span>
                </div>
                <div class="qb-actions">
                  <el-button size="small" text type="primary" @click.stop="openEditDialog(q)">编辑</el-button>
                  <el-button size="small" text type="danger" @click.stop="handleDelete(q)">删除</el-button>
                </div>
              </div>
            </div>
            <div v-if="filteredQuestions.length === 0" style="text-align:center;padding:40px;color:var(--admin-text-muted)">暂无匹配题目，请调整筛选条件</div>
          </div>
          <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:11px;color:var(--admin-text-muted)">已选 {{ selectedIds.length }} / {{ filteredQuestions.length }} 题 <span v-if="lockedSubject" style="color:var(--admin-accent)">（已锁定科目：{{ lockedSubject }}）</span></span>
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,20,30,50]" :total="filteredQuestions.length" layout="total, sizes, prev, pager, next" size="small" background />
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit Question Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑题目' : '新增题目'" width="720px" top="3vh" :close-on-click-modal="false">
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>科目 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="form.subject" style="width:100%">
            <el-option v-for="s in allSubjects" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>题型 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="form.type" style="width:100%">
            <el-option v-for="t in allTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </div>
      </div>
      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>难度</label>
          <el-select v-model="form.difficulty" style="width:100%">
            <el-option v-for="d in difficulties" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>分值</label>
          <el-input-number v-model="form.score" :min="1" :max="100" size="small" style="width:100%" />
        </div>
        <div class="admin-form-group">
          <label>建议时长(分)</label>
          <el-input-number v-model="form.suggestedTime" :min="1" :max="60" size="small" style="width:100%" />
        </div>
      </div>
      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>知识点</label>
          <el-input v-model="form.topic" placeholder="如：二次函数" />
        </div>
        <div class="admin-form-group">
          <label>年份</label>
          <el-input v-model="form.year" placeholder="如：2024" />
        </div>
        <div class="admin-form-group">
          <label>预估正确率(%)</label>
          <el-input-number v-model="form.estimatedRate" :min="0" :max="100" size="small" style="width:100%" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>题干 <span style="color:var(--admin-danger)">*</span></label>
        <MdEditor v-model="form.text" :theme="store.theme" language="zh-CN" previewTheme="github" :toolbars="mdToolbars" :noPrettier="true" :noMermaid="true" />
      </div>
      <div class="admin-form-group" v-if="form.type === 'mc'">
        <label>选项（每行一个，格式如 A. 选项内容）</label>
        <el-input v-model="form.options" type="textarea" :rows="4" placeholder="A. 选项A&#10;B. 选项B&#10;C. 选项C&#10;D. 选项D" />
      </div>
      <div class="admin-form-group">
        <label>答案</label>
        <el-input v-model="form.answer" type="textarea" :rows="2" placeholder="正确答案..." />
      </div>
      <div class="admin-form-group">
        <label>解题步骤</label>
        <MdEditor v-model="form.steps" :theme="store.theme" language="zh-CN" previewTheme="github" :toolbars="mdToolbars" :noPrettier="true" :noMermaid="true" />
      </div>
      <div class="admin-form-group">
        <label>知识点说明</label>
        <el-input v-model="form.knowledgePoint" type="textarea" :rows="3" placeholder="如：二次函数顶点式 f(x)=a(x−h)²+k" />
      </div>
      <div class="admin-form-group">
        <label>常见错误</label>
        <el-input v-model="form.commonMistakes" type="textarea" :rows="3" placeholder="学生容易犯的错误..." />
      </div>
      <div class="admin-form-group">
        <label>图片附件 <span style="font-size:10px;color:var(--admin-text-muted)">（支持多张，每张 &lt; 5MB）</span></label>
        <div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap">
          <div v-for="(img, imgIdx) in form.images" :key="imgIdx" class="qb-image-upload" style="position:relative">
            <img :src="img" class="qb-image-preview" />
            <button class="qb-img-remove" @click="form.images.splice(imgIdx, 1)" title="移除">×</button>
          </div>
          <div class="qb-image-upload" @click="triggerImageUpload">
            <input ref="imageInput" type="file" accept="image/*" multiple style="display:none" @change="handleImageUpload" />
            <div class="qb-image-placeholder">
              <span style="font-size:24px">📷</span>
              <span style="font-size:10px;color:var(--admin-text-muted)">点击上传</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <el-button size="small" @click="triggerImageUpload">+ 添加图片</el-button>
            <el-button size="small" type="warning" @click="runOCR" :loading="ocrRunning" :disabled="!form.images.length">
              {{ ocrRunning ? '识别中...' : '🔍 OCR识别' }}
            </el-button>
          </div>
        </div>
        <div v-if="ocrResult" style="margin-top:8px;padding:10px;background:var(--admin-bg);border-radius:6px;font-size:11px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-weight:600">OCR 识别结果（置信度 {{ ocrResult.confidence }}%）</span>
            <el-button size="small" text @click="applyOCRResult">📝 填入题目内容</el-button>
          </div>
          <pre style="white-space:pre-wrap;color:var(--admin-text-secondary);max-height:120px;overflow-y:auto;margin:0">{{ ocrResult.text || '（未识别到文字）' }}</pre>
          <div v-if="ocrResult.questionNumbers.length" style="margin-top:4px;color:var(--admin-text-muted)">
            检测题号：{{ ocrResult.questionNumbers.join('、') }}
          </div>
          <div v-if="ocrResult.formulas.length" style="margin-top:2px;color:var(--admin-text-muted)">
            检测公式：{{ ocrResult.formulas.map(f => '$' + f + '$').join(' ') }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveQuestion">{{ editingId ? '保存修改' : '新增题目' }}</el-button>
      </template>
    </el-dialog>

    <!-- Paper Preview Dialog -->
    <el-dialog v-model="showPaperPreview" title="📄 组卷预览" width="800px" top="3vh" :close-on-click-modal="false">
      <div class="paper-preview" id="paperPreviewPrint">
        <div class="paper-header">
          <h1>{{ schoolName }} · 模拟试卷</h1>
          <div class="paper-meta">
            <span>共 {{ selectedQuestions.length }} 题</span>
            <span>总分 {{ totalScore }} 分</span>
            <span>建议时长 {{ totalTime }} 分钟</span>
            <span>{{ today }}</span>
          </div>
          <div class="paper-diff-stats">
            <span v-for="g in paperSubjectGroups" :key="g.subject" class="paper-subj-badge" :style="{background:subjectColor(g.subject)}">{{ g.subject }} {{ g.count }}题 {{ g.score }}分</span>
          </div>
        </div>
        <div v-for="(group, gi) in paperSubjectGroups" :key="gi" class="paper-subject-section">
          <div class="paper-section-title">{{ group.subject }}（共 {{ group.count }} 题，{{ group.score }} 分）</div>
          <div v-for="(q, idx) in group.questions" :key="q.id" class="paper-question">
            <div class="pq-header">
              <span class="pq-num">{{ gi + 1 }}.{{ idx + 1 }}</span>
              <span class="admin-tag" :class="diffClass(q.difficulty)" style="font-size:10px">{{ diffLabel(q.difficulty) }}</span>
              <span class="admin-tag info" style="font-size:10px">{{ typeLabel(q.type) }}</span>
              <span style="font-size:11px;color:var(--admin-text-muted)">{{ q.topic }}</span>
              <span style="font-size:10px;color:var(--admin-text-muted);margin-left:auto">（{{ q.score }}分）</span>
            </div>
            <div class="pq-text" v-html="marked.parse(q.text || '')"></div>
            <div v-if="q.images && q.images.length" class="pq-image">
              <img v-for="(img, ii) in q.images" :key="ii" :src="img" style="max-width:100%;max-height:200px;border-radius:6px;margin:4px 2px;display:inline-block" />
            </div>
            <div v-else-if="q.image" class="pq-image"><img :src="q.image" style="max-width:100%;border-radius:6px" /></div>
            <div v-if="q.options" class="pq-options">
              <div v-for="(opt, oi) in q.options.split('\n')" :key="oi" class="pq-opt">{{ opt }}</div>
            </div>
            <details class="pq-answer">
              <summary>查看答案与解析</summary>
              <div class="pq-answer-content">
                <div v-if="q.answer"><b>答案：</b>{{ q.answer }}</div>
                <div v-if="q.steps"><b>解题步骤：</b><pre style="white-space:pre-wrap;font-size:11px;margin:4px 0">{{ q.steps }}</pre></div>
                <div v-if="q.knowledgePoint"><b>知识点：</b>{{ q.knowledgePoint }}</div>
                <div v-if="q.commonMistakes"><b>常见错误：</b>{{ q.commonMistakes }}</div>
              </div>
            </details>
          </div>
        </div>
        <div class="paper-footer">
          <p>— 本试卷由题库自动组卷生成 —</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPaperPreview = false">关闭</el-button>
        <el-button type="primary" @click="printPaper">🖨️ 打印试卷</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 页面：题库中心
 * 功能：按科目、难度、题型、知识点筛选题目，支持选题组卷、新增/编辑/删除题目
 * 路由：/admin/question-bank
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { questionBankService, settingsService, courseService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { getPrintWatermarkHTML, getPrintWatermarkStyle } from '@/utils/printTemplate'
import { performOCR } from '@/composables/useOCR'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { marked } from 'marked'

const store = useAppStore()

const mdToolbars = ['bold', 'italic', 'underline', 'strikeThrough', 'title', '|', 'quote', 'unorderedList', 'orderedList', 'codeRow', 'code', '|', 'link', 'katex', 'table', '|', 'revoke', 'next', 'save', 'preview']

const questions = ref([])
const filterSubject = ref('')
const filterDifficulties = ref([])
const filterTypes = ref([])
const filterTopics = ref([])
const searchText = ref('')
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const showPaperPreview = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const imageInput = ref(null)
const today = new Date().toISOString().split('T')[0]
const schoolName = ref('威学一百')

const allSubjects = computed(() => courseService.getAllNames())
const allTypes = [
  { label: '选择题', value: 'mc' },
  { label: '计算题', value: 'calc' },
  { label: '应用题', value: 'app' },
  { label: '阅读理解', value: 'reading' },
  { label: '写作题', value: 'writing' },
  { label: '分析题', value: 'analysis' },
  { label: '填空题', value: 'fill' }
]

const subjects = computed(() => [...new Set(questions.value.map(q => q.subject))].sort())
const difficulties = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]
const types = [
  { label: '选择', value: 'mc' },
  { label: '计算', value: 'calc' },
  { label: '应用', value: 'app' },
  { label: '阅读', value: 'reading' },
  { label: '写作', value: 'writing' },
  { label: '分析', value: 'analysis' }
]

const form = ref({
  subject: '数学', type: 'mc', difficulty: 'medium', topic: '', year: '',
  score: 5, suggestedTime: 3, text: '', options: '', answer: '', steps: '',
  knowledgePoint: '', commonMistakes: '', estimatedRate: 70, images: []
})
const ocrRunning = ref(false)
const ocrResult = ref(null)

// Subject color mapping
const subjectColors = {
  '数学': '#3b82f6', '中国语文': '#22c55e', '英国语文': '#8b5cf6',
  'English Reading': '#8b5cf6', 'English Writing': '#8b5cf6', 'English Listening': '#8b5cf6', 'English Speaking': '#8b5cf6',
  '物理': '#f59e0b', '化学': '#ef4444', '生物': '#10b981', '历史': '#78716c',
  '地理': '#06b6d4', '经济': '#f97316', '资讯及通讯科技': '#6366f1',
  '企业、会计与财务概论': '#14b8a6', '视觉艺术': '#ec4899', '体育': '#84cc16',
  '音乐': '#a855f7', '公民与社会发展': '#64748b', '数学延伸M1': '#3b82f6', '数学延伸M2': '#3b82f6'
}
function subjectColor(s) { return subjectColors[s] || 'var(--admin-accent)' }

const availableTopics = computed(() => {
  let list = questions.value
  if (filterSubject.value) list = list.filter(q => q.subject === filterSubject.value)
  return [...new Set(list.map(q => q.topic).filter(Boolean))].sort()
})

// Subject lock for paper composition
const lockedSubject = computed(() => {
  if (selectedIds.value.length === 0) return null
  const first = questions.value.find(q => q.id === selectedIds.value[0])
  return first ? first.subject : null
})

function onSubjectChange() {
  filterTopics.value = []
}

function toggleFilter(prop, val, checked) {
  const arr = prop === 'difficulties' ? filterDifficulties :
              prop === 'types' ? filterTypes : filterTopics
  if (checked) { if (!arr.value.includes(val)) arr.value.push(val) }
  else { arr.value = arr.value.filter(v => v !== val) }
  currentPage.value = 1
}

const totalQuestions = computed(() => questions.value.length)

const statsBySubject = computed(() => {
  const map = {}
  questions.value.forEach(q => { map[q.subject] = (map[q.subject] || 0) + 1 })
  return Object.entries(map).map(([subject, count]) => ({
    subject, count, pct: Math.round(count / totalQuestions.value * 100)
  })).sort((a, b) => b.count - a.count)
})

const filteredQuestions = computed(() => {
  return questions.value.filter(q => {
    if (filterSubject.value && q.subject !== filterSubject.value) return false
    if (filterDifficulties.value.length && !filterDifficulties.value.includes(q.difficulty)) return false
    if (filterTypes.value.length && !filterTypes.value.includes(q.type)) return false
    if (filterTopics.value.length && !filterTopics.value.includes(q.topic)) return false
    if (searchText.value && !q.text.includes(searchText.value) && !q.knowledgePoint?.includes(searchText.value)) return false
    return true
  })
})

const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredQuestions.value.slice(start, start + pageSize.value)
})

const selectedQuestions = computed(() => {
  return questions.value.filter(q => selectedIds.value.includes(q.id))
})

const paperSubjectGroups = computed(() => {
  const groups = []
  const map = new Map()
  selectedQuestions.value.forEach(q => {
    if (!map.has(q.subject)) map.set(q.subject, [])
    map.get(q.subject).push(q)
  })
  map.forEach((questions, subject) => {
    groups.push({
      subject,
      questions,
      count: questions.length,
      score: questions.reduce((s, q) => s + (q.score || 0), 0)
    })
  })
  return groups
})

const totalScore = computed(() => selectedQuestions.value.reduce((s, q) => s + (q.score || 0), 0))
const totalTime = computed(() => selectedQuestions.value.reduce((s, q) => s + (q.suggestedTime || 0), 0))

function diffLabel(d) { return { easy:'简单', medium:'中等', hard:'困难' }[d] || d }
function diffClass(d) { return { easy:'success', medium:'warning', hard:'danger' }[d] || 'info' }
function typeLabel(t) {
  return { mc:'选择题', calc:'计算题', app:'应用题', reading:'阅读理解', writing:'写作题', analysis:'分析题', fill:'填空题' }[t] || t
}

function toggleSelect(id) {
  if (selectedIds.value.length === 0) {
    selectedIds.value.push(id)
    return
  }
  // Subject lock: only allow same subject
  const first = questions.value.find(q => q.id === selectedIds.value[0])
  const current = questions.value.find(q => q.id === id)
  if (first && current && current.subject !== first.subject) {
    ElMessage.warning(`组卷时只能选择同一科目的题目（当前已锁定：${first.subject}）`)
    return
  }
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function selectAll() {
  paginatedQuestions.value.forEach(q => {
    if (selectedIds.value.length > 0) {
      const first = questions.value.find(x => x.id === selectedIds.value[0])
      if (first && q.subject !== first.subject) return
    }
    if (!selectedIds.value.includes(q.id)) selectedIds.value.push(q.id)
  })
}

function deselectAll() {
  const pageIds = paginatedQuestions.value.map(q => q.id)
  selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
}

function clearSelection() {
  selectedIds.value = []
}

// -- Add / Edit --
function openAddDialog() {
  editingId.value = null
  ocrResult.value = null
  form.value = { subject: '数学', type: 'mc', difficulty: 'medium', topic: '', year: '', score: 5, suggestedTime: 3, text: '', options: '', answer: '', steps: '', knowledgePoint: '', commonMistakes: '', estimatedRate: 70, images: [] }
  dialogVisible.value = true
}

function openEditDialog(q) {
  editingId.value = q.id
  ocrResult.value = null
  form.value = {
    subject: q.subject, type: q.type, difficulty: q.difficulty, topic: q.topic || '',
    year: q.year || '', score: q.score || 5, suggestedTime: q.suggestedTime || 3,
    text: q.text || '', options: q.options || '', answer: q.answer || '',
    steps: q.steps || '', knowledgePoint: q.knowledgePoint || '',
    commonMistakes: q.commonMistakes || '', estimatedRate: q.estimatedRate || 70,
    images: q.images || (q.image ? [q.image] : [])
  }
  dialogVisible.value = true
}

function triggerImageUpload() { imageInput.value?.click() }

function handleImageUpload(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  let loaded = 0
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) { ElMessage.warning(`${file.name} 超过5MB，已跳过`); return }
    const reader = new FileReader()
    reader.onload = () => {
      form.value.images.push(reader.result)
      loaded++
      if (loaded === files.length && form.value.images.length > 0) {
        ElMessage.success(`已添加 ${form.value.images.length} 张图片`)
      }
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

async function runOCR() {
  if (!form.value.images.length) return
  ocrRunning.value = true
  ocrResult.value = null
  try {
    // Use the first image for OCR
    const result = await performOCR(form.value.images[0])
    ocrResult.value = result
    ElMessage.success(`识别完成，置信度 ${result.confidence}%`)
  } catch (e) {
    ElMessage.error('OCR识别失败，请重试')
  }
  ocrRunning.value = false
}

function applyOCRResult() {
  if (!ocrResult.value || !ocrResult.value.text.trim()) {
    ElMessage.warning('没有可填入的识别内容')
    return
  }
  // Append OCR text to the question text field
  const ocrText = ocrResult.value.text.trim()
  if (form.value.text && !form.value.text.includes(ocrText)) {
    form.value.text = form.value.text + '\n\n' + ocrText
  } else if (!form.value.text) {
    form.value.text = ocrText
  }
  ElMessage.success('已填入题目内容')
}

function saveQuestion() {
  if (!form.value.subject) { ElMessage.warning('请选择科目'); return }
  if (!form.value.text) { ElMessage.warning('请输入题干'); return }
  const data = {
    ...form.value,
    image: form.value.images[0] || null, // backwards compatibility: first image as main
    createdAt: new Date().toISOString().split('T')[0]
  }
  if (editingId.value) {
    questionBankService.update(editingId.value, data)
    ElMessage.success('题目已更新')
  } else {
    questionBankService.create(data)
    ElMessage.success('题目已新增')
  }
  dialogVisible.value = false
  questions.value = questionBankService.getAll()
}

async function handleDelete(q) {
  try {
    await ElMessageBox.confirm(`确定删除题目 #${q.id}「${q.text.slice(0, 40)}...」吗？`, '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    questionBankService.delete(q.id)
    selectedIds.value = selectedIds.value.filter(id => id !== q.id)
    questions.value = questionBankService.getAll()
    ElMessage.success('已删除')
  } catch {}
}

// -- Print --
function printPaper() {
  const area = document.getElementById('paperPreviewPrint')
  if (!area) return
  const w = window.open('', '_blank', 'width=800,height=600')
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>模拟试卷</title><style>
    body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;padding:32px;color:#2c2c2c;line-height:1.8;background:#fff}
    .paper-header{text-align:center;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:24px}
    .paper-header h1{font-size:20px;margin:0 0 8px;color:#2c2c2c}
    .paper-meta{font-size:12px;color:#888;display:flex;gap:20px;justify-content:center;flex-wrap:wrap}
    .paper-subj-badge{display:inline-block;padding:2px 10px;border-radius:4px;font-size:11px;color:#fff;margin:2px}
    .paper-section-title{font-size:14px;font-weight:700;color:#4a2c17;border-bottom:1px solid #ddd;padding-bottom:6px;margin:16px 0 10px}
    .paper-question{margin-bottom:16px;padding:12px;border:1px solid #eee;border-radius:8px;page-break-inside:avoid}
    .pq-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
    .pq-num{font-weight:700;font-size:15px;color:#2c2c2c}
    .pq-text{font-size:13px;margin:8px 0;color:#2c2c2c}
    .pq-text p{text-indent:2em;margin:6px 0}
    .pq-text ul,.pq-text ol{padding-left:2em;margin:6px 0}
    .pq-text blockquote{border-left:3px solid #c4a85c;margin:10px 0;padding:6px 14px;background:#faf7ee;font-style:italic;color:#5c3d1e}
    .pq-text blockquote p{text-indent:0}
    .pq-image{margin:8px 0;text-align:center}
    .pq-options{margin:8px 0;padding-left:2em}
    .pq-opt{font-size:13px;padding:2px 0;color:#2c2c2c}
    .pq-answer{margin-top:8px;font-size:12px}
    .pq-answer summary{cursor:pointer;color:#3b82f6;font-weight:500}
    .pq-answer-content{padding:8px;background:#f9f9f9;border-radius:6px;margin-top:4px;color:#2c2c2c}
    .pq-answer-content p{text-indent:2em;margin:6px 0}
    .pq-answer-content ul,.pq-answer-content ol{padding-left:2em;margin:6px 0}
    .pq-answer-content blockquote{border-left:3px solid #c4a85c;margin:10px 0;padding:6px 14px;background:#faf7ee;font-style:italic;color:#5c3d1e}
    .pq-answer-content blockquote p{text-indent:0}
    .paper-footer{text-align:center;font-size:11px;color:#aaa;margin-top:24px;border-top:1px solid #eee;padding-top:12px}
    @media print{body{margin:16px}}
    ${getPrintWatermarkStyle()}
  </style></head><body>${area.innerHTML}${getPrintWatermarkHTML()}</body></html>`)
  w.document.close()
  setTimeout(() => w.print(), 500)
}

onMounted(() => {
  questions.value = questionBankService.getAll()
  const s = settingsService.get()
  schoolName.value = s.schoolName || store.schoolName
})
</script>

<style scoped>
.qb-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; align-items: start; margin-top: 16px; }

.qb-list { max-height: calc(100vh - 360px); overflow-y: auto; }
.qb-item {
  display: flex; gap: 10px; padding: 12px; border: 1px solid var(--admin-border);
  border-radius: 8px; margin-bottom: 6px; cursor: pointer; transition: all 0.15s;
  position: relative;
}
.qb-item:hover { border-color: var(--admin-accent); background: var(--admin-surface-hover); }
.qb-item.selected { border-color: var(--admin-accent); background: rgba(201,160,80,0.06); }
.qb-item-left { display: flex; align-items: flex-start; gap: 6px; padding-top: 2px; }
.qb-item-id { font-size: 10px; color: var(--admin-text-muted); min-width: 28px; }
.qb-item-body { flex: 1; min-width: 0; }
.qb-item-header { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.qb-subject-tag { font-size: 10px; padding: 1px 8px; border-radius: 4px; font-weight: 500; }
.qb-topic-tag { font-size: 10px; color: var(--admin-accent); background: rgba(201,160,80,0.1); padding: 1px 6px; border-radius: 4px; }
.qb-text { font-size: 12px; color: var(--admin-text); line-height: 1.7; white-space: pre-wrap; }
.qb-meta { font-size: 10px; color: var(--admin-text-muted); margin-top: 6px; }
.qb-actions { display: flex; margin-top: 6px; gap: 4px; opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.3s ease, max-height 0.3s ease; }
.qb-item:hover .qb-actions { opacity: 1; max-height: 40px; }

/* Image upload */
.qb-image-upload {
  width: 100px; height: 80px; border: 2px dashed var(--admin-border);
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; transition: border-color 0.2s;
}
.qb-image-upload:hover { border-color: var(--admin-accent); }
.qb-image-preview { width: 100%; height: 100%; object-fit: cover; }
.qb-image-placeholder { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.qb-img-remove {
  position: absolute; top: -6px; right: -6px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--admin-danger); color: #fff; border: none;
  font-size: 12px; line-height: 1; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

/* Paper Preview */
.paper-preview { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: var(--admin-text); line-height: 1.9; }
.paper-header { text-align: center; border-bottom: 2px solid var(--admin-accent); padding-bottom: 16px; margin-bottom: 24px; }
.paper-header h1 { font-size: 20px; font-weight: 700; color: var(--admin-text); margin: 0 0 8px; }
.paper-meta { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; font-size: 12px; color: var(--admin-text-muted); }
.paper-diff-stats { margin-top: 10px; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.paper-subj-badge { padding: 2px 10px; border-radius: 4px; font-size: 11px; color: #fff; }
.paper-subject-section { margin-bottom: 10px; }
.paper-section-title { font-size: 14px; font-weight: 700; color: var(--admin-accent); border-bottom: 1px solid var(--admin-border); padding-bottom: 6px; margin: 16px 0 10px; }
.paper-question { padding: 14px; border: 1px solid var(--admin-border); border-radius: 8px; margin-bottom: 12px; page-break-inside: avoid; background: var(--admin-surface); }
.pq-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.pq-num { font-weight: 700; font-size: 15px; color: var(--admin-accent); }
.pq-text { font-size: 13px; margin: 8px 0; color: var(--admin-text); }
.pq-text :deep(p) { text-indent: 2em; margin: 6px 0; }
.pq-text :deep(ul), .pq-text :deep(ol) { padding-left: 2em; margin: 6px 0; }
.pq-text :deep(blockquote) { border-left: 3px solid var(--admin-accent); margin: 10px 0; padding: 6px 14px; background: var(--admin-bg); font-style: italic; }
.pq-text :deep(blockquote p) { text-indent: 0; }
.pq-image { margin: 8px 0; text-align: center; }
.pq-options { margin: 8px 0; padding-left: 16px; }
.pq-opt { font-size: 13px; padding: 2px 0; color: var(--admin-text-secondary); }
.pq-answer { margin-top: 10px; font-size: 12px; }
.pq-answer summary { cursor: pointer; color: var(--admin-primary); font-weight: 500; }
.pq-answer-content { padding: 10px; background: var(--admin-bg); border-radius: 6px; margin-top: 4px; line-height: 1.7; }
.paper-footer { text-align: center; font-size: 11px; color: var(--admin-text-muted); margin-top: 24px; border-top: 1px solid var(--admin-border); padding-top: 12px; }

@media (max-width: 768px) {
  .qb-layout { grid-template-columns: 1fr; }
  .qb-list { max-height: none; }
}
</style>
