<template>
  <div class="cf-layout">
    <!-- Left: Feedback List -->
    <div class="cf-left">
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <div class="admin-card-title">📝 课堂反馈记录</div>
            <div class="admin-card-subtitle">{{ feedbacks.length }} 条记录</div>
          </div>
          <div style="display:flex;gap:8px">
            <el-select v-model="filterCFClass" size="small" placeholder="班级" style="width:90px" clearable>
              <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
            </el-select>
            <el-select v-model="filterCFSubject" size="small" placeholder="科目" style="width:100px" clearable>
              <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
            </el-select>
            <el-button size="small" type="primary" @click="openForm()">+ 新增反馈</el-button>
          </div>
        </div>
        <div class="cf-list">
          <div v-for="f in filteredFeedbacks" :key="f.id" class="cf-item" :class="{ active: editingId === f.id }" @click="selectFeedback(f)">
            <div class="cf-item-header">
              <span style="font-weight:600;color:var(--admin-text);font-size:13px">{{ f.subject }}</span>
              <span style="font-size:11px;color:var(--admin-text-muted)">{{ f.date }}</span>
            </div>
            <div style="font-size:11px;color:var(--admin-text-secondary);margin-bottom:2px">{{ f.class }}班 · {{ f.teacher }} · {{ f.period }}</div>
            <div style="font-size:11px;color:var(--admin-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">{{ f.content }}</div>
            <div v-if="f.topics && f.topics.length" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
              <span v-for="t in f.topics" :key="t" class="cf-tag">{{ t }}</span>
            </div>
          </div>
        </div>
        <div class="cf-list-pagination" v-if="totalFilteredFeedbacks > pageSize" style="padding:8px 14px;display:flex;justify-content:center">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,15,20,50]" :total="totalFilteredFeedbacks" layout="total, sizes, prev, pager, next, jumper" size="small" background />
        </div>
      </div>
    </div>

    <!-- Right: Form + Question Generation -->
    <div class="cf-right">
      <!-- Feedback Form -->
      <div class="admin-card" style="margin-bottom:14px">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">{{ editingId ? '编辑反馈' : '新增反馈' }}</div>

        <!-- Quick input: free text mode -->
        <div class="admin-form-group">
          <label>快速输入 <span style="font-size:10px;color:var(--admin-text-muted)">（粘贴自由文本自动解析）</span></label>
          <el-input v-model="quickText" type="textarea" :rows="3" placeholder="粘贴课堂记录文本，系统自动解析科目/日期/班级/知识点等字段...&#10;例如：5月7日 5D班 数学 张老师 第1节 二次函数顶点式 学生掌握较好" />
          <el-button size="small" style="margin-top:6px" @click="parseQuickText" :disabled="!quickText.trim()">🔍 自动解析</el-button>
        </div>

        <div class="admin-three-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>班级</label>
            <el-select v-model="form.class" size="small" style="width:100%">
              <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>日期</label>
            <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
          </div>
          <div class="admin-form-group">
            <label>科目</label>
            <el-select v-model="form.subject" size="small" style="width:100%">
              <el-option v-for="s in flatSubjectList" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
        </div>
        <div class="admin-three-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>教师</label>
            <el-input v-model="form.teacher" />
          </div>
          <div class="admin-form-group">
            <label>上课时间</label>
            <el-input v-model="form.period" placeholder="如：19:30-21:05" />
          </div>
          <div class="admin-form-group">
            <label>知识点 Tags</label>
            <el-input v-model="form.topicsStr" placeholder="逗号分隔，如：二次函数,顶点式" />
          </div>
        </div>
        <div class="admin-form-group">
          <label>课堂内容</label>
          <el-input v-model="form.content" type="textarea" :rows="2" placeholder="本节课教学内容概述..." />
        </div>
        <div class="admin-form-group">
          <label>课堂表现记录</label>
          <el-input v-model="form.performanceNotes" type="textarea" :rows="3" placeholder="【准时度】\n【专注度】\n【掌握情况】\n【待加强】" />
        </div>
        <div style="display:flex;gap:8px">
          <el-button type="primary" size="small" @click="saveFeedback">{{ editingId ? '保存修改' : '保存反馈' }}</el-button>
          <el-button size="small" type="warning" @click="openPracticeDrawer" :disabled="!form.topicsStr">🎯 生成15分钟练习</el-button>
          <el-button v-if="editingId" size="small" text type="danger" @click="deleteFeedback(editingId)">删除</el-button>
        </div>
      </div>

      <!-- Practice Generation Drawer -->
      <el-drawer
        v-model="practiceDrawerVisible"
        :title="practiceQuestions.length ? '🎯 15分钟课堂练习' : '生成练习配置'"
        size="620px"
        :close-on-click-modal="false"
        direction="rtl"
      >
        <!-- Config Panel (shown before generation) -->
        <template v-if="!practiceQuestions.length">
          <div class="practice-config">
            <div class="admin-form-group">
              <label>知识点关键词 <span style="color:var(--admin-danger)">*</span></label>
              <el-input v-model="practiceConfig.topicsStr" placeholder="逗号分隔，如：二次函数,顶点式" />
            </div>
            <div class="admin-form-group">
              <label>题目数量</label>
              <el-input-number v-model="practiceConfig.count" :min="1" :max="15" size="small" style="width:100%" />
            </div>
            <div class="admin-form-group">
              <label>难度筛选</label>
              <div style="display:flex;gap:8px">
                <el-checkbox v-for="d in difficulties" :key="d.value" v-model="practiceConfig.difficulties[d.value]" :label="d.label" size="small" />
              </div>
            </div>
            <div class="admin-form-group">
              <label>题型筛选</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <el-checkbox v-for="t in practiceTypes" :key="t.value" v-model="practiceConfig.types[t.value]" :label="t.label" size="small" />
              </div>
            </div>
            <el-button type="primary" @click="doGeneratePractice" :disabled="!practiceConfig.topicsStr.trim()" style="width:100%">
              确认生成 {{ practiceConfig.count }} 题
            </el-button>
          </div>
        </template>

        <!-- Generated Questions (editable) -->
        <template v-else>
          <div style="font-size:11px;color:var(--admin-text-muted);margin-bottom:12px">
            科目：{{ form.subject }} | 知识点：{{ form.topicsStr }} | 预计用时：{{ practiceQuestions.reduce((s, q) => s + (q.suggestedTime || 3), 0) }} 分钟
          </div>
          <div v-for="(q, i) in practiceQuestions" :key="q._key || q.id" class="pq-edit-card">
            <div class="pq-edit-header">
              <span class="pq-edit-num">{{ i + 1 }}</span>
              <span class="pq-edit-topic">{{ q.topic }}</span>
              <span class="pq-edit-meta">{{ difficultyLabel(q.difficulty) }} · {{ typeLabel(q.type) }} · {{ q.score || 5 }}分</span>
              <div style="margin-left:auto;display:flex;gap:4px">
                <el-button size="small" text @click="q._editing = !q._editing">{{ q._editing ? '完成' : '✏️ 编辑' }}</el-button>
                <el-button size="small" text type="danger" @click="practiceQuestions.splice(i, 1)">移除</el-button>
              </div>
            </div>
            <!-- View mode -->
            <template v-if="!q._editing">
              <div class="pq-edit-body" v-html="marked.parse(q.text || '')"></div>
              <div v-if="q.options" class="pq-edit-options" v-html="marked.parse(q.options)"></div>
              <div v-if="q.showAnswer" class="pq-edit-answer">
                <div><b>答案：</b>{{ q.answer }}</div>
                <div v-if="q.steps"><b>解析：</b><span v-html="marked.parse(q.steps)"></span></div>
                <div v-if="q.knowledgePoint"><b>知识点：</b>{{ q.knowledgePoint }}</div>
                <div v-if="q.commonMistakes" style="color:var(--admin-warning)"><b>常见错误：</b>{{ q.commonMistakes }}</div>
              </div>
              <div style="margin-top:6px">
                <el-button size="small" text @click="q.showAnswer = !q.showAnswer">{{ q.showAnswer ? '隐藏答案' : '查看答案' }}</el-button>
              </div>
            </template>
            <!-- Edit mode -->
            <template v-else>
              <div class="admin-form-group" style="margin-top:8px">
                <label>题目内容</label>
                <el-input v-model="q.text" type="textarea" :rows="3" />
              </div>
              <div class="admin-form-group">
                <label>选项（仅选择题，每行一个）</label>
                <el-input v-model="q.options" type="textarea" :rows="2" />
              </div>
              <div class="admin-form-group">
                <label>答案</label>
                <el-input v-model="q.answer" type="textarea" :rows="1" />
              </div>
              <div class="admin-form-group">
                <label>解析/步骤</label>
                <el-input v-model="q.steps" type="textarea" :rows="2" />
              </div>
              <div class="admin-two-col">
                <div class="admin-form-group">
                  <label>难度</label>
                  <el-select v-model="q.difficulty" size="small" style="width:100%">
                    <el-option v-for="d in difficulties" :key="d.value" :label="d.label" :value="d.value" />
                  </el-select>
                </div>
                <div class="admin-form-group">
                  <label>建议用时(分)</label>
                  <el-input-number v-model="q.suggestedTime" :min="1" :max="15" size="small" style="width:100%" />
                </div>
              </div>
            </template>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px">
            <el-button size="small" @click="addCustomQuestion">+ 添加自定义题</el-button>
          </div>
          <div style="margin-top:16px;display:flex;gap:8px;border-top:1px solid var(--admin-border);padding-top:12px">
            <el-button size="small" @click="printStudentVersion">🖨️ 打印学生版</el-button>
            <el-button size="small" type="primary" @click="printTeacherVersion">🖨️ 打印教师版</el-button>
            <el-button size="small" type="warning" @click="practiceQuestions = []; practiceDrawerVisible = false">清空并关闭</el-button>
          </div>
        </template>
      </el-drawer>
    </div>

    <!-- Hidden print templates -->
    <div id="print-student" style="display:none"></div>
    <div id="print-teacher" style="display:none"></div>
  </div>
</template>

<script setup>
/**
 * 页面：课堂反馈记录
 * 功能：记录课堂表现与教学内容，支持自由文本自动解析，并基于知识点生成随堂练习题
 * 路由：/admin/course-feedback
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { courseFeedbackService, questionBankService, studentService, courseService } from '@/services/dataService'
import { getPrintWatermarkHTML, getPrintWatermarkStyle } from '@/utils/printTemplate'
import { marked } from 'marked'
import { renderRichContent } from '@/utils/renderContent'

const feedbacks = ref([])
const editingId = ref(null)
const filterCFClass = ref('')
const filterCFSubject = ref('')
const quickText = ref('')
const practiceQuestions = ref([])
const practiceDrawerVisible = ref(false)

const difficulties = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' }
]
const practiceTypes = [
  { label: '选择', value: 'mc' },
  { label: '计算', value: 'calc' },
  { label: '应用', value: 'app' },
  { label: '填空', value: 'fill' }
]

const practiceConfig = ref({
  topicsStr: '', count: 5,
  difficulties: { easy: true, medium: true, hard: false },
  types: { mc: true, calc: true, app: true, fill: true }
})

function openPracticeDrawer() {
  practiceConfig.value.topicsStr = form.value.topicsStr
  practiceConfig.value.count = 5
  practiceConfig.value.difficulties = { easy: true, medium: true, hard: false }
  practiceConfig.value.types = { mc: true, calc: true, app: true, fill: true }
  practiceDrawerVisible.value = true
}

function doGeneratePractice() {
  const topics = practiceConfig.value.topicsStr.split(/[,，、]/).filter(Boolean)
  if (!topics.length) { ElMessage.warning('请填写知识点关键词'); return }

  let pool = questionBankService.getBySubject(form.value.subject)
  if (pool.length === 0) pool = questionBankService.getAll()

  // Filter by enabled difficulties
  const enabledDiffs = Object.entries(practiceConfig.value.difficulties).filter(([, v]) => v).map(([k]) => k)
  if (enabledDiffs.length) pool = pool.filter(q => enabledDiffs.includes(q.difficulty))

  // Filter by enabled types
  const enabledTypes = Object.entries(practiceConfig.value.types).filter(([, v]) => v).map(([k]) => k)
  if (enabledTypes.length) pool = pool.filter(q => enabledTypes.includes(q.type))

  // Match topics
  const matched = pool.filter(q => topics.some(t => q.topic && q.topic.includes(t)))
  const selected = (matched.length >= practiceConfig.value.count ? matched : pool)
    .slice(0, practiceConfig.value.count)

  if (selected.length === 0) { ElMessage.warning('题库中暂无匹配题目，请在题库中心录入题目'); return }

  practiceQuestions.value = selected.map((q, i) => ({
    ...q, showAnswer: false, _editing: false, _key: `gen_${Date.now()}_${i}`
  }))
  ElMessage.success(`已生成 ${selected.length} 道练习题目`)
}

function addCustomQuestion() {
  practiceQuestions.value.push({
    _key: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    subject: form.value.subject, topic: form.value.topicsStr.split(/[,，、]/)[0] || '', text: '',
    type: 'calc', difficulty: 'medium', score: 5, suggestedTime: 3,
    options: '', answer: '', steps: '', knowledgePoint: '', commonMistakes: '',
    showAnswer: true, _editing: true
  })
}

const classList = computed(() => studentService.getClasses())
const subjectList = computed(() => courseService.getAllNames())
const flatSubjectList = computed(() => courseService.getAllNamesFlat())

const form = ref({
  class: '5D', date: new Date().toISOString().split('T')[0],
  subject: '数学', teacher: '张老师', period: '', content: '',
  performanceNotes: '', topicsStr: ''
})

onMounted(() => {
  feedbacks.value = courseFeedbackService.getAll()
  if (feedbacks.value.length > 0) selectFeedback(feedbacks.value[0])
})

const currentPage = ref(1)
const pageSize = ref(15)

const filteredFeedbacks = computed(() => {
  const list = feedbacks.value.filter(f => {
    if (filterCFClass.value && f.class !== filterCFClass.value) return false
    if (filterCFSubject.value && f.subject !== filterCFSubject.value) return false
    return true
  })
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

const totalFilteredFeedbacks = computed(() => {
  return feedbacks.value.filter(f => {
    if (filterCFClass.value && f.class !== filterCFClass.value) return false
    if (filterCFSubject.value && f.subject !== filterCFSubject.value) return false
    return true
  }).length
})

function selectFeedback(f) {
  editingId.value = f.id
  form.value = {
    class: f.class, date: f.date, subject: f.subject,
    teacher: f.teacher, period: f.period, content: f.content,
    performanceNotes: f.performanceNotes, topicsStr: (f.topics || []).join('、')
  }
}

function openForm() {
  editingId.value = null
  form.value = {
    class: '5D', date: new Date().toISOString().split('T')[0],
    subject: '数学', teacher: '张老师', period: '', content: '',
    performanceNotes: '', topicsStr: ''
  }
  practiceQuestions.value = []
}

function parseQuickText() {
  const txt = quickText.value
  const dateMatch = txt.match(/(\d{1,2})月(\d{1,2})日/)
  if (dateMatch) {
    const y = new Date().getFullYear()
    form.value.date = `${y}-${String(dateMatch[1]).padStart(2, '0')}-${String(dateMatch[2]).padStart(2, '0')}`
  }
  const classMatch = txt.match(/(\d+[A-Za-z])班/)
  if (classMatch) form.value.class = classMatch[1]

  for (const s of flatSubjectList.value) {
    if (txt.includes(s)) { form.value.subject = s; break }
  }
  const teacherMatch = txt.match(/([张李王陈刘吴林黄赵周]+)老师/)
  if (teacherMatch) form.value.teacher = teacherMatch[0].replace('老师', '')

  const periodMatch = txt.match(/第(\d+)节/)
  if (periodMatch) form.value.period = `第${periodMatch[1]}节`

  // Extract potential topics (noun phrases, key terms)
  const topicPatterns = ['二次函数', '三角函数', '不等式', '对数', '指数', '函数', '向量', '概率', '统计',
    '文言', '写作', '阅读', '翻译', '力学', '电学', '光学', '化学计量', '有机', '无机',
    '顶点式', '因式分解', '求根公式', '综合应用', '审题', '计算', '概念']
  const found = topicPatterns.filter(t => txt.includes(t))
  if (found.length) form.value.topicsStr = found.join('、')

  form.value.content = txt
  ElMessage.success(`已解析：${form.value.class}班 ${form.value.subject} ${form.value.teacher}老师`)
}

function saveFeedback() {
  if (!form.value.class || !form.value.subject) { ElMessage.warning('请填写班级和科目'); return }
  const data = {
    ...form.value,
    topics: form.value.topicsStr ? form.value.topicsStr.split(/[,，、]/).filter(Boolean) : [],
    createdAt: new Date().toLocaleString('zh-CN')
  }
  if (editingId.value) {
    courseFeedbackService.update(editingId.value, data)
    ElMessage.success('已更新')
  } else {
    courseFeedbackService.create(data)
    ElMessage.success('反馈已保存')
  }
  feedbacks.value = courseFeedbackService.getAll()
}

async function deleteFeedback(id) {
  try {
    await ElMessageBox.confirm('确定删除此反馈记录吗？', '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    courseFeedbackService.delete(id)
    feedbacks.value = courseFeedbackService.getAll()
    editingId.value = null
    openForm()
    ElMessage.success('已删除')
  } catch {}
}

function printStudentVersion() {
  const questions = practiceQuestions.value
  if (!questions.length) return
  let html = buildPrintHeader('学生版')
  html += `<div style="font-size:10px;color:#888;margin-bottom:10px">班级：_____ 姓名：_____ 日期：_____ 用时：_____</div>`
  questions.forEach((q, i) => {
    html += `<div style="margin-bottom:14px;page-break-inside:avoid">
      <div style="font-weight:600;margin-bottom:4px">${i + 1}. ${marked.parse(q.text || '')}</div>
      ${q.options ? `<div style="margin-left:16px">${q.options.replace(/\n/g,'<br>')}</div>` : ''}
      <div style="margin-top:40px;border-bottom:1px dashed #ddd"></div>
    </div>`
  })
  html += `</div>${getPrintWatermarkHTML()}</body></html>`
  openPrintWindow(html)
}

function printTeacherVersion() {
  const questions = practiceQuestions.value
  if (!questions.length) return
  let html = buildPrintHeader('教师版（含答案与解析）')
  html += `<div style="font-size:10px;color:#888;margin-bottom:10px">仅供教师使用</div>`
  questions.forEach((q, i) => {
    html += `<div style="margin-bottom:14px;page-break-inside:avoid">
      <div style="font-weight:600;margin-bottom:4px">${i + 1}. ${marked.parse(q.text || '')}</div>
      ${q.options ? `<div style="margin-left:16px">${q.options.replace(/\n/g,'<br>')}</div>` : ''}
      <div style="margin-top:8px;padding:8px;background:var(--admin-bg);border-left:3px solid var(--admin-primary)">
        <div><b>答案：</b>${marked.parse(q.answer || '')}</div>
        <div style="margin-top:4px"><b>解析：</b>${marked.parse(q.steps || '')}</div>
        <div style="margin-top:4px;color:#888"><b>知识点：</b>${q.knowledgePoint || ''}</div>
        <div style="margin-top:2px;color:#c96"><b>常见错误：</b>${q.commonMistakes || ''}</div>
        <div style="margin-top:2px;font-size:10px;color:#aaa">难度：${difficultyLabel(q.difficulty)} | 题型：${typeLabel(q.type)} | 建议用时：${q.suggestedTime || 3}分钟</div>
      </div>
    </div>`
  })
  html += `</div>${getPrintWatermarkHTML()}</body></html>`
  openPrintWindow(html)
}

function buildPrintHeader(title) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>课堂练习-${title}</title><style>
    body{font-family:'Microsoft YaHei',sans-serif;padding:20px;color:#333;max-width:700px;margin:0 auto}
    h2{text-align:center;margin-bottom:4px}
    p{text-indent:2em;margin:6px 0}
    ul,ol{padding-left:2em;margin:6px 0}
    blockquote{border-left:3px solid #c4a85c;margin:10px 0;padding:6px 14px;background:#faf7ee;font-style:italic;color:#5c3d1e}
    blockquote p{text-indent:0}
    @page{size:A4;margin:15mm}
    ${getPrintWatermarkStyle()}
  </style></head><body><h2>课堂练习 ${title}</h2>
  <div style="text-align:center;font-size:11px;color:#888;margin-bottom:12px">${form.value.subject} · ${form.value.class}班 · ${form.value.date}</div>`
}

function openPrintWindow(html) {
  const w = window.open('', '_blank', 'width=750,height=600')
  w.document.write(html)
  w.document.close()
  w.print()
}

function renderContent(text) {
  return marked.parse(text || '')
}

function difficultyLabel(d) {
  return { easy: '★☆☆', medium: '★★☆', hard: '★★★' }[d] || d
}

function typeLabel(t) {
  return { mc: '选择题', calc: '计算题', app: '应用题', proof: '证明题', reading: '阅读题', writing: '写作题' }[t] || t
}
</script>

<style scoped>
.cf-layout { display: grid; grid-template-columns: 380px 1fr; gap: 14px; align-items: start; }
@media (max-width: 1100px) { .cf-layout { grid-template-columns: 1fr; } }
.cf-left { min-width: 0; }
.cf-right { min-width: 0; }
.cf-list { max-height: calc(100vh - 220px); overflow-y: auto; }
.cf-item { padding: 10px 14px; border-bottom: 1px solid var(--admin-border); cursor: pointer; transition: background 0.15s; }
.cf-item:hover { background: var(--admin-bg); }
.cf-item.active { background: var(--admin-bg); border-left: 3px solid var(--admin-primary); padding-left: 11px; }
.cf-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
.cf-tag { background: var(--admin-accent); color: #1a2e3c; font-size: 10px; padding: 1px 6px; border-radius: 8px; }

/* Practice generation config */
.practice-config {
  padding: 0 4px;
}
.practice-config .admin-form-group {
  margin-bottom: 14px;
}
.practice-config .admin-form-group label {
  font-size: 12px; font-weight: 600; color: var(--admin-text); display: block; margin-bottom: 6px;
}

/* Editable practice question cards */
.pq-edit-card {
  background: var(--admin-bg); border-radius: 8px; padding: 14px;
  margin-bottom: 10px; border: 1px solid var(--admin-border);
}
.pq-edit-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
}
.pq-edit-num {
  background: var(--admin-primary); color: #fff;
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; flex-shrink: 0;
}
.pq-edit-topic {
  font-size: 11px; background: var(--admin-accent); color: #1a2e3c;
  padding: 1px 8px; border-radius: 4px;
}
.pq-edit-meta { font-size: 10px; color: var(--admin-text-muted); }
.pq-edit-body { font-size: 13px; line-height: 1.7; color: var(--admin-text); margin-bottom: 6px; }
.pq-edit-body :deep(p) { text-indent: 2em; margin: 6px 0; }
.pq-edit-body :deep(blockquote) {
  border-left: 3px solid var(--admin-accent); margin: 10px 0;
  padding: 6px 14px; background: var(--admin-bg); font-style: italic;
}
.pq-edit-body :deep(blockquote p) { text-indent: 0; }
.pq-edit-body :deep(ul), .pq-edit-body :deep(ol) { padding-left: 2em; margin: 6px 0; }
.pq-edit-options { font-size: 12px; line-height: 1.8; margin-left: 8px; color: var(--admin-text-secondary); }
.pq-edit-answer {
  margin-top: 10px; padding: 10px; background: #f0f9f0;
  border-radius: 6px; font-size: 12px; border-left: 3px solid var(--admin-success);
  line-height: 1.6;
}
.pq-edit-answer :deep(p) { text-indent: 2em; margin: 6px 0; }

/* Keep old pq classes for backward compatibility */
.pq-card { background: var(--admin-bg); border-radius: 8px; padding: 14px; margin-bottom: 10px; border: 1px solid var(--admin-border); }
.pq-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pq-num { background: var(--admin-primary); color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }
.pq-topic { font-size: 11px; background: var(--admin-accent); color: #1a2e3c; padding: 1px 8px; border-radius: 4px; }
.pq-meta { font-size: 10px; color: var(--admin-text-muted); margin-left: auto; }
.pq-body { font-size: 13px; line-height: 1.7; color: var(--admin-text); margin-bottom: 6px; }
.pq-options { font-size: 12px; line-height: 1.8; margin-left: 8px; color: var(--admin-text-secondary); }
.pq-answer { margin-top: 10px; padding: 10px; background: var(--admin-bg); border-radius: 6px; font-size: 12px; border-left: 3px solid var(--admin-success); color: var(--admin-text-secondary); }
.pq-answer-row { margin-bottom: 4px; line-height: 1.6; }
</style>
