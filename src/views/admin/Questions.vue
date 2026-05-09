<template>
  <div class="qp-layout">
    <!-- Left: Controls + Analytics -->
    <div class="qp-sidebar">
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:2px">🎯 智能出题</div>
        <div class="admin-card-subtitle" style="margin-bottom:12px">题库 {{ totalQuestions }}题 · DSE真题风格</div>

        <!-- Student Selection (compact) -->
        <div class="admin-form-group">
          <el-select v-model="selectedStudentId" size="small" style="width:100%" @change="onStudentChange" filterable placeholder="选择学生以分析学情...">
            <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
          </el-select>
        </div>

        <!-- Student Info (inline compact) -->
        <div v-if="selectedStudent" class="qp-student-card">
          <span class="qp-student-avatar">{{ selectedStudent.name.charAt(0) }}</span>
          <span style="font-size:12px;font-weight:600;color:var(--admin-text)">{{ selectedStudent.name }}</span>
          <span style="font-size:10px;color:var(--admin-text-muted)">{{ selectedStudent.class }}班</span>
        </div>

        <!-- Recent Scores (compact, expandable) -->
        <div v-if="studentExams.length" style="margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;cursor:pointer" @click="showMoreScores = !showMoreScores">
            <span style="font-size:11px;font-weight:600;color:var(--admin-text-secondary)">📊 近期成绩</span>
            <span style="font-size:10px;color:var(--admin-text-muted)">{{ showMoreScores ? '收起' : '展开' }}</span>
          </div>
          <div v-for="e in studentExams.slice(0, showMoreScores ? studentExams.length : 2)" :key="e.id" class="qp-score-row">
            <span class="qp-score-subj">{{ e.subject }}</span>
            <span class="qp-score-val" :style="{color: scoreColor(e.score, e.total)}">{{ e.score }}/{{ e.total }}</span>
            <span class="qp-score-date">{{ e.date.slice(5) }}</span>
          </div>
        </div>

        <!-- Weak Topics (tag cloud) -->
        <div v-if="weakTopics.length && selectedStudent" style="margin-bottom:10px">
          <div style="font-size:11px;font-weight:600;color:var(--admin-warning);margin-bottom:4px">
            ⚡ 薄弱知识点
            <span style="font-size:10px;font-weight:400;cursor:pointer;margin-left:4px" @click="genConfig.topics = [...new Set([...genConfig.topics, ...weakTopics])]">全选</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            <span v-for="t in weakTopics" :key="t" class="qp-weak-tag" @click="toggleWeakTopic(t)" :class="{ active: genConfig.topics.includes(t) }">{{ t }}</span>
          </div>
        </div>

        <!-- Generation Config (collapsible) -->
        <div style="font-size:11px;font-weight:600;color:var(--admin-text-secondary);margin-bottom:6px;cursor:pointer;display:flex;align-items:center;gap:4px" @click="configExpanded = !configExpanded">
          ⚙️ 出题配置 <span style="font-size:10px;font-weight:400">{{ configExpanded ? '收起' : '展开' }}</span>
        </div>
        <div v-if="configExpanded">
          <div class="admin-form-group">
            <el-select v-model="genConfig.subject" size="small" style="width:100%" @change="onSubjectChange">
              <el-option v-for="s in allSubjects" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <el-select v-model="genConfig.topics" size="small" style="width:100%" multiple filterable placeholder="选择知识点...">
              <el-option v-for="t in availableTopics" :key="t" :label="t" :value="t" />
            </el-select>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <div style="flex:1">
              <label style="font-size:10px;display:block;margin-bottom:4px">数量</label>
              <el-input-number v-model="genConfig.count" :min="1" :max="20" size="small" style="width:100%" />
            </div>
            <div style="flex:1">
              <label style="font-size:10px;display:block;margin-bottom:4px">难度</label>
              <el-select v-model="genConfig.difficulty" size="small" style="width:100%">
                <el-option label="★ 基础" value="easy" />
                <el-option label="★★ 中等" value="medium" />
                <el-option label="★★★ 困难" value="hard" />
              </el-select>
            </div>
            <div style="flex:1">
              <label style="font-size:10px;display:block;margin-bottom:4px">题型</label>
              <el-select v-model="genConfig.questionType" size="small" style="width:100%">
                <el-option v-for="t in questionTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </div>
          </div>
        </div>
        <el-button type="primary" size="small" style="width:100%;margin-top:4px" @click="generateQuestions">🤖 生成题目</el-button>
      </div>

      <!-- Analytics (collapsible) -->
      <div class="admin-card" style="margin-top:14px">
        <div class="admin-card-title" style="font-size:13px;margin-bottom:4px;cursor:pointer;display:flex;align-items:center;gap:4px" @click="analyticsExpanded = !analyticsExpanded">
          📊 薄弱知识点 TOP5 <span style="font-size:10px;font-weight:400">{{ analyticsExpanded ? '收起' : '展开' }}</span>
        </div>
        <div v-if="analyticsExpanded">
          <div v-for="(w, i) in classWeakness" :key="w.topic" class="qp-weakness-row">
            <span class="qp-weakness-rank">{{ i + 1 }}</span>
            <span class="qp-weakness-name">{{ w.topic }}</span>
            <div class="qp-weakness-bar">
              <div :style="{width:w.errorRate+'%',background:w.errorRate>60?'var(--admin-danger)':'var(--admin-warning)'}"></div>
            </div>
            <span class="qp-weakness-rate">{{ w.errorRate }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Generated Questions -->
    <div class="qp-main">
      <!-- Trend Chart -->
      <div class="admin-card" v-if="selectedStudent && actualTrendData.length" style="margin-bottom:14px">
        <div class="admin-card-title" style="font-size:13px;margin-bottom:12px">📈 {{ selectedStudent.name }} · {{ genConfig.subject }} 成绩趋势</div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <el-button size="small" :type="chartMode === 'bar' ? 'primary' : ''" @click="chartMode = 'bar'">柱状图</el-button>
          <el-button size="small" :type="chartMode === 'line' ? 'primary' : ''" @click="chartMode = 'line'">折线图</el-button>
        </div>
        <div v-if="chartMode === 'bar'" style="display:flex;align-items:flex-end;gap:12px;height:130px;padding:0 10px">
          <div v-for="d in actualTrendData" :key="d.week" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <span style="font-size:12px;font-weight:600;color:var(--admin-text)">{{ d.score }}%</span>
            <div :style="{height:d.score*1.1+'px',width:'36px',background:d.score>=80?'var(--admin-success)':d.score>=60?'var(--admin-warning)':'var(--admin-danger)',borderRadius:'4px 4px 0 0'}"></div>
            <span style="font-size:10px;color:var(--admin-text-muted)">{{ d.week }}</span>
          </div>
        </div>
        <div v-else style="position:relative;height:130px;padding:10px 0">
          <svg width="100%" height="120" style="overflow:visible">
            <polyline :points="linePoints" fill="none" stroke="var(--admin-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle v-for="(d, i) in actualTrendData" :key="d.week" :cx="linePointX(i)" :cy="linePointY(d.score)" r="4" fill="var(--admin-accent)" />
            <text v-for="(d, i) in actualTrendData" :key="'t'+d.week" :x="linePointX(i)" :y="linePointY(d.score) - 8" text-anchor="middle" font-size="11" fill="var(--admin-text)" font-weight="600">{{ d.score }}%</text>
          </svg>
          <div style="display:flex;gap:12px;padding-left:5px">
            <span v-for="d in actualTrendData" :key="d.week" style="flex:1;font-size:10px;color:var(--admin-text-muted);text-align:center">{{ d.week }}</span>
          </div>
        </div>
      </div>

      <!-- Photo OCR Entry Card -->
      <div class="admin-card" style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--admin-text)">📷 拍照录入题目</div>
            <div style="font-size:10px;color:var(--admin-text-muted);margin-top:2px">拍摄试卷/练习册题目，AI自动识别题目内容和LaTeX公式</div>
          </div>
          <el-button type="primary" size="small" @click="openOcrDialog">📸 拍照录入</el-button>
        </div>
        <div style="display:flex;gap:16px;margin-top:8px;font-size:10px;color:var(--admin-text-muted)">
          <span>✓ 自动识别科目、知识点</span>
          <span>✓ 解析 LaTeX 数学公式</span>
          <span>✓ 提取选项和答案</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="questions.length === 0 && !selectedStudent" class="admin-card" style="text-align:center;padding:60px 20px">
        <div style="font-size:48px;margin-bottom:12px">🎯</div>
        <div style="font-size:15px;font-weight:600;color:var(--admin-text)">智能出题系统</div>
        <div style="font-size:12px;color:var(--admin-text-muted);margin-top:6px">请先选择学生，系统将自动分析薄弱知识点并生成针对性练习</div>
      </div>

      <div v-if="questions.length === 0 && selectedStudent && !hasGenerated" class="admin-card" style="text-align:center;padding:40px 20px">
        <div style="font-size:36px;margin-bottom:8px">📋</div>
        <div style="font-size:13px;color:var(--admin-text-secondary)">已选择 {{ selectedStudent.name }}，配置出题参数后点击生成</div>
      </div>

      <!-- Questions -->
      <div v-if="questions.length > 0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:13px;font-weight:600;color:var(--admin-text)">
            生成结果 ({{ questions.length }}题)
          </span>
          <span style="font-size:10px;color:var(--admin-text-muted)">
            {{ genConfig.subject }} · {{ diffLabel(genConfig.difficulty) }} · 预计{{ questions.reduce((s, q) => s + (q.suggestedTime || 3), 0) }}分钟
          </span>
        </div>
        <div v-for="(q, i) in questions" :key="i" class="qp-question-card">
          <div class="qp-q-header">
            <span class="qp-q-num">{{ i + 1 }}</span>
            <span class="qp-q-topic">{{ q.topic }}</span>
            <span class="admin-tag" :class="diffTagClass(q.difficulty)" style="font-size:9px">{{ diffLabel(q.difficulty) }}</span>
            <span class="admin-tag" style="font-size:9px;background:var(--admin-bg);color:var(--admin-text-secondary)">{{ typeLabel(q.type) }}</span>
            <span style="font-size:10px;color:var(--admin-text-muted);margin-left:auto">{{ q.score }}分 · {{ q.suggestedTime || 3 }}分钟</span>
            <span style="font-size:10px;color:var(--admin-text-muted);margin-left:4px">
              预估得分: <b :style="{color: rateColor(q.estimatedRate)}">{{ q.estimatedRate || 70 }}%</b>
            </span>
          </div>
          <div class="qp-q-body" v-html="renderRichContent(q.text)"></div>
          <div v-if="q.options" class="qp-q-options">
            <div v-for="(opt, oi) in q.options.split('\n').filter(Boolean)" :key="oi" class="qp-q-opt">{{ opt }}</div>
          </div>
          <div v-if="q.showAnswer" class="qp-answer-panel">
            <div class="qp-answer-row"><b>答案：</b>{{ q.answer }}</div>
            <div v-if="q.steps" class="qp-answer-row" v-html="renderText(q.steps)"></div>
            <div class="qp-answer-row" style="color:var(--admin-primary)"><b>知识点：</b>{{ q.knowledgePoint }}</div>
            <div class="qp-answer-row" style="color:var(--admin-warning)"><b>常见错误：</b>{{ q.commonMistakes }}</div>
          </div>
          <div class="qp-q-actions">
            <el-button size="small" text @click="q.showAnswer = !q.showAnswer">{{ q.showAnswer ? '隐藏答案' : '显示答案' }}</el-button>
            <el-button size="small" text type="success" @click="addToPaper(q)">{{ paper.includes(q) ? '✓ 已加入练习卷' : '+ 加入练习卷' }}</el-button>
            <el-button size="small" text type="warning" @click="regenerateQuestion(i)">🔄 换一题</el-button>
          </div>
        </div>

        <!-- Paper Actions -->
        <div style="display:flex;gap:10px;margin-top:14px" v-if="paper.length > 0">
          <el-button type="primary" @click="exportPaper">📤 导出练习卷PDF</el-button>
          <el-button @click="printPaper">🖨️ 打印练习卷</el-button>
          <el-button @click="paper = []">清除练习卷 ({{ paper.length }}题)</el-button>
        </div>
      </div>
    </div>

    <!-- OCR Photo Upload Dialog -->
    <el-dialog v-model="ocrVisible" title="📷 拍照录入题目" width="720px" @closed="resetOcr">
      <div style="display:grid;grid-template-columns:260px 1fr;gap:20px">
        <!-- Left: Upload Area -->
        <div>
          <div class="ocr-upload-zone" @click="triggerOcrUpload" :style="{borderColor: ocrImage ? 'var(--admin-success)' : 'var(--admin-border)'}">
            <input ref="ocrFileInput" type="file" accept="image/*" style="display:none" @change="handleOcrImage" />
            <img v-if="ocrImage" :src="ocrImage" class="ocr-preview-img" />
            <div v-else class="ocr-placeholder">
              <span style="font-size:40px">📸</span>
              <span style="font-size:12px;color:var(--admin-text-muted);margin-top:6px">点击上传题目照片</span>
              <span style="font-size:10px;color:var(--admin-text-muted)">支持 JPG/PNG，≤10MB</span>
            </div>
          </div>
          <div v-if="ocrImage" style="display:flex;gap:8px;margin-top:8px">
            <el-button size="small" @click="triggerOcrUpload" style="flex:1">重新上传</el-button>
            <el-button size="small" type="danger" @click="ocrImage = null; ocrRecognized = false">移除</el-button>
          </div>
          <el-button v-if="ocrImage && !ocrRecognized" type="primary" size="small" style="width:100%;margin-top:8px" @click="startOcr" :loading="ocrRecognizing">
            {{ ocrRecognizing ? '识别中...' : '🔍 开始OCR识别' }}
          </el-button>
          <div v-if="ocrRecognized" style="margin-top:8px;padding:8px 12px;background:var(--admin-bg);border-radius:6px;font-size:11px;color:var(--admin-success);text-align:center">
            ✓ 识别完成，请核对右侧字段
          </div>
        </div>

        <!-- Right: Recognized Fields -->
        <div style="max-height:420px;overflow-y:auto">
          <div class="admin-form-group">
            <label>科目</label>
            <el-select v-model="ocrForm.subject" size="small" style="width:100%">
              <el-option v-for="s in allSubjects" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div class="admin-two-col" style="margin-bottom:0">
            <div class="admin-form-group">
              <label>知识点</label>
              <el-input v-model="ocrForm.topic" size="small" placeholder="如：二次函数" />
            </div>
            <div class="admin-form-group">
              <label>题目类型</label>
              <el-select v-model="ocrForm.type" size="small" style="width:100%">
                <el-option v-for="t in questionTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
              </el-select>
            </div>
          </div>
          <div class="admin-two-col" style="margin-bottom:0">
            <div class="admin-form-group">
              <label>难度</label>
              <el-select v-model="ocrForm.difficulty" size="small" style="width:100%">
                <el-option label="★ 基础" value="easy" />
                <el-option label="★★ 中等" value="medium" />
                <el-option label="★★★ 困难" value="hard" />
              </el-select>
            </div>
            <div class="admin-form-group">
              <label>分值 / 建议用时(分)</label>
              <div style="display:flex;gap:6px">
                <el-input-number v-model="ocrForm.score" :min="1" :max="30" size="small" style="flex:1" />
                <el-input-number v-model="ocrForm.suggestedTime" :min="1" :max="45" size="small" style="flex:1" />
              </div>
            </div>
          </div>
          <div class="admin-form-group">
            <label>题目内容 <span style="font-size:10px;color:var(--admin-text-muted)">（支持 Markdown / LaTeX）</span></label>
            <el-input v-model="ocrForm.text" type="textarea" :rows="3" size="small" placeholder="题目内容，支持 $latex$ 公式..." />
          </div>
          <div class="admin-form-group">
            <label>选项 <span style="font-size:10px;color:var(--admin-text-muted)">（选择题填写，每行一个选项）</span></label>
            <el-input v-model="ocrForm.options" type="textarea" :rows="2" size="small" placeholder="A. 选项一&#10;B. 选项二" />
          </div>
          <div class="admin-form-group">
            <label>答案</label>
            <el-input v-model="ocrForm.answer" size="small" placeholder="标准答案" />
          </div>
          <div class="admin-form-group">
            <label>解析步骤 <span style="font-size:10px;color:var(--admin-text-muted)">（支持 LaTeX）</span></label>
            <el-input v-model="ocrForm.steps" type="textarea" :rows="2" size="small" placeholder="解题步骤，支持 $latex$ 公式..." />
          </div>
          <div class="admin-form-group">
            <label>考查知识点</label>
            <el-input v-model="ocrForm.knowledgePoint" size="small" placeholder="核心考点说明" />
          </div>
          <div class="admin-form-group">
            <label>常见错误</label>
            <el-input v-model="ocrForm.commonMistakes" size="small" placeholder="学生常犯错误" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="ocrVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOcrToBank" :disabled="!ocrForm.text.trim()">📥 确认入库</el-button>
      </template>
    </el-dialog>

    <!-- Paper Preview Dialog -->
    <el-dialog v-model="paperVisible" title="练习卷预览" width="800px" :fullscreen="true">
      <div style="background:#fff;padding:32px 48px;font-family:'PingFang SC','Microsoft YaHei',serif;color:#2c2c2c" id="paperPrintArea">
        <h2 style="text-align:center;margin-bottom:8px">DSE 针对性练习卷</h2>
        <div style="text-align:center;font-size:12px;color:#666;margin-bottom:20px">
          {{ schoolName }} · {{ selectedStudent?.name || '' }} · {{ genConfig.subject }} · {{ diffLabel(genConfig.difficulty) }} · {{ new Date().toISOString().split('T')[0] }}
        </div>
        <div v-for="(q, i) in paper" :key="i" style="margin-bottom:20px;page-break-inside:avoid">
          <p style="font-weight:700;margin-bottom:4px">{{ i+1 }}. [{{ q.topic }}] {{ q.score }}分</p>
          <p style="line-height:1.8;text-indent:0" v-html="renderRichContent(q.text)"></p>
          <div v-if="q.options" style="padding-left:20px">
            <p v-for="(opt, oi) in q.options.split('\n').filter(Boolean)" :key="oi" style="margin:2px 0">{{ opt }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="paperVisible = false">关闭</el-button>
        <el-button type="primary" @click="printPaperArea">🖨️ 打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { studentService, examService, questionBankService, courseService, settingsService } from '@/services/dataService'
import { getWatermarkHTML, getWatermarkStyle } from '@/utils/watermark'
import { renderRichContent } from '@/utils/renderContent'

const studentList = ref([])
const selectedStudentId = ref(null)
const selectedStudent = ref(null)
const studentExams = ref([])
const questions = ref([])
const paper = ref([])
const paperVisible = ref(false)
const hasGenerated = ref(false)
const showMoreScores = ref(false)
const configExpanded = ref(true)
const analyticsExpanded = ref(true)
const schoolName = ref('威学一百')
const allQuestionBank = ref([])

// OCR state
const ocrVisible = ref(false)
const ocrImage = ref(null)
const ocrRecognizing = ref(false)
const ocrRecognized = ref(false)
const ocrFileInput = ref(null)
const ocrForm = ref({
  subject: '数学', topic: '', type: 'calc', difficulty: 'medium',
  score: 5, suggestedTime: 5, text: '', options: '', answer: '',
  steps: '', knowledgePoint: '', commonMistakes: ''
})

const allSubjects = computed(() => courseService.getAllNames())

const subjectTypeMap = {
  '中国语文': [{ value: 'reading', label: '阅读题' }, { value: 'writing', label: '写作题' }, { value: 'translation', label: '翻译题' }, { value: 'mc', label: '选择题' }],
  '英国语文': [{ value: 'reading', label: 'Reading' }, { value: 'writing', label: 'Writing' }, { value: 'listening', label: 'Listening' }, { value: 'speaking', label: 'Speaking' }],
  '数学': [{ value: 'mc', label: '选择题' }, { value: 'calc', label: '计算题' }, { value: 'proof', label: '证明题' }, { value: 'app', label: '应用题' }],
  '数学延伸M1': [{ value: 'mc', label: '选择题' }, { value: 'calc', label: '计算题' }, { value: 'proof', label: '证明题' }, { value: 'app', label: '应用题' }],
  '数学延伸M2': [{ value: 'mc', label: '选择题' }, { value: 'calc', label: '计算题' }, { value: 'proof', label: '证明题' }, { value: 'app', label: '应用题' }],
  _science: [{ value: 'mc', label: '选择题' }, { value: 'calc', label: '计算题' }, { value: 'experiment', label: '实验题' }, { value: 'app', label: '应用题' }],
  _humanities: [{ value: 'essay', label: '论述题' }, { value: 'analysis', label: '分析题' }, { value: 'short', label: '简答题' }]
}
const scienceSubjects = ['物理', '化学', '生物']
const humanitiesSubjects = ['历史', '地理', '经济', '中国历史', '资讯及通讯科技', '企业、会计与财务概论', '视觉艺术']

const questionTypeOptions = computed(() => {
  const subj = genConfig.value.subject
  if (subjectTypeMap[subj]) return [{ value: 'all', label: '全部类型' }, ...subjectTypeMap[subj]]
  if (scienceSubjects.includes(subj)) return [{ value: 'all', label: '全部类型' }, ...subjectTypeMap._science]
  if (humanitiesSubjects.includes(subj)) return [{ value: 'all', label: '全部类型' }, ...subjectTypeMap._humanities]
  return [{ value: 'all', label: '全部类型' }, { value: 'mc', label: '选择题' }, { value: 'calc', label: '计算题' }, { value: 'app', label: '应用题' }]
})

const availableTopics = computed(() => questionBankService.getTopicsBySubject(genConfig.value.subject))
const totalQuestions = computed(() => allQuestionBank.value.length)

const genConfig = ref({
  subject: '数学', topics: [], count: 3, difficulty: 'medium', questionType: 'all'
})

const weakTopics = computed(() => {
  if (!selectedStudent.value || studentExams.value.length === 0) return []
  const subject = genConfig.value.subject
  const exams = studentExams.value.filter(e => e.subject === subject)
  if (exams.length === 0) return []
  const topicScores = {}
  exams.forEach(e => {
    const rate = e.score / e.total * 100
    if (e.topics && e.topics.length) {
      e.topics.forEach(t => {
        if (!topicScores[t]) topicScores[t] = []
        topicScores[t].push(rate)
      })
    }
  })
  return Object.entries(topicScores)
    .filter(([, rates]) => rates.reduce((a, b) => a + b, 0) / rates.length < 70)
    .sort((a, b) => (a[1].reduce((x, y) => x + y, 0) / a[1].length) - (b[1].reduce((x, y) => x + y, 0) / b[1].length))
    .map(([t]) => t)
    .slice(0, 5)
})

onMounted(() => {
  studentList.value = studentService.getAll()
  allQuestionBank.value = questionBankService.getAll()
  const settings = settingsService.get()
  schoolName.value = settings.schoolName || '威学一百'
})

function onStudentChange() {
  selectedStudent.value = studentList.value.find(s => s.id === selectedStudentId.value)
  if (selectedStudent.value) {
    studentExams.value = examService.getByStudent(selectedStudentId.value)
  } else {
    studentExams.value = []
  }
  hasGenerated.value = false
}

function onSubjectChange() {
  genConfig.value.topics = []
  genConfig.value.questionType = 'all'
}

function toggleWeakTopic(t) {
  const idx = genConfig.value.topics.indexOf(t)
  if (idx >= 0) genConfig.value.topics.splice(idx, 1)
  else genConfig.value.topics.push(t)
}

function scoreColor(score, total) {
  const r = score / total
  return r >= 0.9 ? 'var(--admin-success)' : r >= 0.75 ? 'var(--admin-primary)' : r >= 0.6 ? 'var(--admin-warning)' : 'var(--admin-danger)'
}
function rateColor(r) { return r >= 80 ? 'var(--admin-success)' : r >= 60 ? 'var(--admin-warning)' : 'var(--admin-danger)' }
function diffTagClass(d) { return { easy: 'success', medium: 'info', hard: 'warning', dse: 'danger' }[d] || 'info' }
function diffLabel(d) { return { easy: '基础巩固', medium: '中等提升', hard: '难点突破', dse: 'DSE真题' }[d] || d }
function typeLabel(t) {
  const map = { mc: '选择', calc: '计算', proof: '证明', app: '应用', reading: '阅读', writing: '写作', translation: '翻译', listening: '听力', speaking: '口语', experiment: '实验', essay: '论述', analysis: '分析', short: '简答', all: '综合' }
  return map[t] || t
}
function renderText(text) {
  return renderRichContent(text)
}

function generateQuestions() {
  const subject = genConfig.value.subject
  const diff = genConfig.value.difficulty
  let pool = questionBankService.getBySubject(subject)
  if (pool.length === 0) pool = allQuestionBank.value

  let candidates = pool.filter(q => q.difficulty === diff)
  if (candidates.length === 0) candidates = pool

  if (genConfig.value.topics.length > 0) {
    const topicFiltered = candidates.filter(q => genConfig.value.topics.some(t => q.topic && q.topic.includes(t)))
    if (topicFiltered.length > 0) candidates = topicFiltered
  }

  if (genConfig.value.questionType !== 'all') {
    const typeFiltered = candidates.filter(q => q.type === genConfig.value.questionType)
    if (typeFiltered.length > 0) candidates = typeFiltered
  }

  const count = Math.min(genConfig.value.count, candidates.length || 1)
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  questions.value = shuffled.slice(0, count).map(q => ({ ...q, showAnswer: false }))
  paper.value = []
  hasGenerated.value = true
  ElMessage.success(`已生成 ${questions.value.length} 道题目`)
}

function regenerateQuestion(index) {
  const pool = questionBankService.getBySubject(genConfig.value.subject)
  if (pool.length > 0) {
    const newQ = pool[Math.floor(Math.random() * pool.length)]
    questions.value[index] = { ...newQ, showAnswer: false }
  }
}

// -- OCR Photo Upload --
function openOcrDialog() {
  resetOcr()
  ocrVisible.value = true
}

function resetOcr() {
  ocrImage.value = null
  ocrRecognizing.value = false
  ocrRecognized.value = false
  ocrForm.value = {
    subject: genConfig.value.subject || '数学', topic: '', type: 'calc', difficulty: 'medium',
    score: 5, suggestedTime: 5, text: '', options: '', answer: '',
    steps: '', knowledgePoint: '', commonMistakes: ''
  }
}

function triggerOcrUpload() {
  ocrFileInput.value?.click()
}

function handleOcrImage(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) { ElMessage.warning('图片大小不能超过10MB'); return }
  if (!file.type.startsWith('image/')) { ElMessage.warning('请选择图片文件'); return }
  const reader = new FileReader()
  reader.onload = () => {
    ocrImage.value = reader.result
    ocrRecognized.value = false
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function startOcr() {
  if (!ocrImage.value) return
  ocrRecognizing.value = true
  // Simulate OCR with AI recognition delay
  setTimeout(() => {
    ocrRecognizing.value = false
    ocrRecognized.value = true
    // Simulate OCR: generate plausible content based on subject
    const subj = ocrForm.value.subject
    const ocrResults = generateSimulatedOcr(subj)
    ocrForm.value = { ...ocrForm.value, ...ocrResults }
    ElMessage.success('AI识别完成，请核对并修改后入库')
  }, 1800)
}

function generateSimulatedOcr(subject) {
  const templates = {
    '数学': [
      { topic: '二次函数', type: 'calc', difficulty: 'medium', score: 8, suggestedTime: 6,
        text: '已知二次函数 $f(x) = x^2 - 6x + 5$，求：\n（1）$f(x)$ 的顶点坐标和对称轴方程\n（2）$f(x)$ 在区间 $[1, 4]$ 上的最大值和最小值',
        options: '', answer: '（1）顶点 $(3, -4)$，对称轴 $x = 3$\n（2）最大值 $f(1) = 0$，最小值 $f(3) = -4$',
        steps: '配方：$f(x) = (x-3)^2 - 4$\n顶点 $(3, -4)$，对称轴 $x = 3$\n在 $[1,4]$ 上，$f(1) = 0$，$f(3) = -4$，$f(4) = -3$\n最大值 $0$，最小值 $-4$',
        knowledgePoint: '二次函数顶点式与区间最值', commonMistakes: '忽略区间端点值的比较，仅取顶点作为最值' },
      { topic: '三角函数', type: 'calc', difficulty: 'medium', score: 6, suggestedTime: 5,
        text: '已知 $\\sin\\theta = \\frac{4}{5}$，$\\theta$ 在第二象限，求 $\\cos\\theta$ 和 $\\tan\\theta$ 的值',
        options: '', answer: '$\\cos\\theta = -\\frac{3}{5}$，$\\tan\\theta = -\\frac{4}{3}$',
        steps: '$\\sin^2\\theta + \\cos^2\\theta = 1$\n$\\cos^2\\theta = 1 - \\frac{16}{25} = \\frac{9}{25}$\n$\\theta$ 在第二象限，$\\cos\\theta < 0$，故 $\\cos\\theta = -\\frac{3}{5}$\n$\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta} = -\\frac{4}{3}$',
        knowledgePoint: '同角三角函数关系与象限符号', commonMistakes: '忽略象限对三角函数正负号的影响' },
      { topic: '不等式', type: 'mc', difficulty: 'easy', score: 4, suggestedTime: 3,
        text: '不等式 $|2x - 3| \\leq 5$ 的解集是：',
        options: 'A. $[-1, 4]$\nB. $[-4, 1]$\nC. $(-\\infty, -1] \\cup [4, +\\infty)$\nD. $(-1, 4)$',
        answer: 'A', steps: '$|2x-3| \\leq 5 \\Leftrightarrow -5 \\leq 2x-3 \\leq 5$\n$-2 \\leq 2x \\leq 8 \\Rightarrow -1 \\leq x \\leq 4$\n解集为 $[-1, 4]$',
        knowledgePoint: '含绝对值不等式的解法', commonMistakes: '忘记将绝对值不等式转化为双向不等式' }
    ],
    '中国语文': [
      { topic: '文言翻译', type: 'reading', difficulty: 'medium', score: 8, suggestedTime: 10,
        text: '阅读下面的文言文，翻译画线句子：\n\n楚人有涉江者，其剑自舟中坠于水，遽契其舟，曰："是吾剑之所从坠。"舟止，从其所契者入水求之。\n\n翻译："是吾剑之所从坠"',
        options: '', answer: '这里是我的剑掉下去的地方。',
        steps: '"是"：指示代词，这/这里\n"吾剑"：我的剑\n"所从坠"：所字结构，掉下去的地方\n全句：这里是我的剑掉下去的地方',
        knowledgePoint: '文言文"所"字结构与指示代词', commonMistakes: '将"是"误解为判断词，实为指示代词' },
      { topic: '议论文写作', type: 'writing', difficulty: 'hard', score: 20, suggestedTime: 30,
        text: '以"传统与创新的平衡"为题，写一篇不少于600字的议论文。要求：观点明确，论据充分，结构完整。',
        options: '', answer: '【评分参考】论点明确（5分）、论据充实（5分）、论证逻辑（5分）、语言表达（5分）。言之成理即可。',
        steps: '立意：传统是根基，创新是发展，二者相辅相成\n分论点1：传统提供智慧和经验积累\n分论点2：创新推动社会进步\n分论点3：脱离传统的创新缺乏根基，固守传统则停滞不前\n结论：在传承中创新，在创新中传承',
        knowledgePoint: '议论文的立论、论证结构与素材运用', commonMistakes: '片面强调一方，缺乏辩证分析' }
    ],
    '物理': [
      { topic: '力学', type: 'calc', difficulty: 'medium', score: 8, suggestedTime: 6,
        text: '一个质量为 $2\\text{ kg}$ 的物体，在水平面上受到 $F = 10\\text{ N}$ 的水平拉力作用，物体与水平面间的动摩擦因数 $\\mu = 0.2$，$g = 10\\text{ m/s}^2$。求：\n（1）物体受到的摩擦力大小\n（2）物体的加速度',
        options: '', answer: '（1）$f = 4\\text{ N}$\n（2）$a = 3\\text{ m/s}^2$',
        steps: '$f = \\mu mg = 0.2 \\times 2 \\times 10 = 4\\text{ N}$\n$F_合 = F - f = 10 - 4 = 6\\text{ N}$\n$a = F_合 / m = 6 / 2 = 3\\text{ m/s}^2$',
        knowledgePoint: '牛顿第二定律与摩擦力综合应用', commonMistakes: '忘记减去摩擦力，直接用拉力除以质量求加速度' }
    ],
    '化学': [
      { topic: '化学计量', type: 'calc', difficulty: 'medium', score: 6, suggestedTime: 5,
        text: '将 $10.6\\text{ g}$ 的 $\\text{Na}_2\\text{CO}_3$ 溶于水，配成 $500\\text{ mL}$ 溶液。求该溶液的物质的量浓度。（$M(\\text{Na}_2\\text{CO}_3) = 106\\text{ g/mol}$）',
        options: '', answer: '$0.2\\text{ mol/L}$',
        steps: '$n = m / M = 10.6 / 106 = 0.1\\text{ mol}$\n$c = n / V = 0.1 / 0.5 = 0.2\\text{ mol/L}$',
        knowledgePoint: '物质的量浓度计算 $c = n/V$', commonMistakes: '体积单位换算（mL → L）遗漏或错误' }
    ],
    '经济': [
      { topic: '供需理论', type: 'analysis', difficulty: 'medium', score: 10, suggestedTime: 12,
        text: '运用供需理论，分析香港政府对住宅市场实施"辣招"（额外印花税）对楼市的短期和长期影响。',
        options: '', answer: '短期：（1）需求曲线左移（投机需求减少）；（2）成交量下降；（3）价格小幅回落。\n长期：（1）市场回归用家主导；（2）供给弹性较低，价格趋稳；（3）若撤销辣招需防范反弹。',
        steps: '画供需图：初始均衡 → 加税后需求减少（D左移）→ 新均衡价格和交易量均下降\n长期：供给增加缓慢（建楼周期长），需求由用家支撑，市场渐趋稳定',
        knowledgePoint: '需求曲线移动对均衡价格和数量的影响', commonMistakes: '只分析价格变化，忽略交易量的变动' }
    ]
  }

  // Default for subjects without specific templates
  const defaultTemplates = [
    { topic: '基础知识', type: 'mc', difficulty: 'easy', score: 4, suggestedTime: 3,
      text: `[OCR识别] ${subject}相关题目内容，请根据原始图片进行核对修改`,
      options: '', answer: '请根据图片填写答案',
      steps: '请根据图片填写解析步骤', knowledgePoint: '请核对并填写知识点', commonMistakes: '请根据教学经验填写' }
  ]

  const pool = templates[subject] || defaultTemplates
  const result = pool[Math.floor(Math.random() * pool.length)]
  return { ...result, text: `[OCR识别自图片] ${result.text}` }
}

function saveOcrToBank() {
  if (!ocrForm.value.text.trim()) { ElMessage.warning('请输入题目内容'); return }
  questionBankService.create({
    ...ocrForm.value,
    estimatedRate: ocrForm.value.difficulty === 'easy' ? 85 : ocrForm.value.difficulty === 'medium' ? 65 : 40,
    source: 'photo_ocr'
  })
  allQuestionBank.value = questionBankService.getAll()
  ElMessage.success('题目已录入题库')
  ocrVisible.value = false
}

function addToPaper(q) {
  if (paper.value.includes(q)) {
    paper.value = paper.value.filter(p => p !== q)
  } else {
    paper.value.push(q)
    ElMessage.success(`已加入练习卷（共${paper.value.length}题）`)
  }
}

function exportPaper() { paperVisible.value = true }
function printPaper() {
  const wmStyle = getWatermarkStyle()
  if (wmStyle) {
    const styleEl = document.createElement('style')
    styleEl.textContent = wmStyle
    document.head.appendChild(styleEl)
  }
  const wmHTML = getWatermarkHTML()
  if (wmHTML) {
    const div = document.createElement('div')
    div.innerHTML = wmHTML
    document.body.appendChild(div)
  }
  paperVisible.value = true
  setTimeout(() => {
    window.print()
    if (wmStyle) styleEl.remove()
    if (wmHTML) div.remove()
  }, 300)
}
function printPaperArea() {
  const area = document.getElementById('paperPrintArea')
  if (area) {
    const win = window.open('', '_blank', 'width=800,height=600')
    win.document.write(`<html><head><title>练习卷</title><style>body{font-family:'PingFang SC','Microsoft YaHei',serif;padding:32px 48px;color:#2c2c2c;line-height:1.8}h2{text-align:center}p{text-indent:2em;margin:6px 0}ul,ol{padding-left:2em;margin:6px 0}blockquote{border-left:3px solid #c4a85c;margin:10px 0;padding:6px 14px;background:#faf7ee;font-style:italic;color:#5c3d1e}blockquote p{text-indent:0}${getWatermarkStyle()}</style></head><body>${area.innerHTML}${getWatermarkHTML()}</body></html>`)
    win.document.close()
    win.print()
  }
}

const classWeakness = computed(() => {
  const topicCount = {}
  allQuestionBank.value.forEach(q => {
    if (!topicCount[q.topic]) topicCount[q.topic] = { count: 0, estRate: 0 }
    topicCount[q.topic].count++
    topicCount[q.topic].estRate += (q.estimatedRate || 70)
  })
  return Object.entries(topicCount)
    .map(([topic, d]) => ({ topic, errorRate: Math.round(100 - d.estRate / d.count) }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5)
})

const chartMode = ref('bar')

const actualTrendData = computed(() => {
  if (!selectedStudent.value || studentExams.value.length === 0) return []
  const subject = genConfig.value.subject
  const exams = studentExams.value
    .filter(e => e.subject === subject)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-6)
  if (exams.length === 0) return []
  return exams.map((e, i) => ({
    week: `W${i + 1}`,
    score: Math.round(e.score / e.total * 100)
  }))
})

const linePoints = computed(() => {
  if (actualTrendData.value.length === 0) return ''
  return actualTrendData.value.map((d, i) => `${linePointX(i)},${linePointY(d.score)}`).join(' ')
})
function linePointX(i) {
  if (actualTrendData.value.length <= 1) return 50
  return 10 + (i / (actualTrendData.value.length - 1)) * 80
}
function linePointY(score) {
  return 110 - (score / 100) * 90
}
</script>

<style scoped>
.qp-layout { display: grid; grid-template-columns: 340px 1fr; gap: 14px; align-items: start; }
@media (max-width: 1100px) { .qp-layout { grid-template-columns: 1fr; } }

.qp-sidebar { min-width: 0; }
.qp-main { min-width: 0; }

.qp-student-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; background: var(--admin-bg); border-radius: 10px;
  margin-bottom: 14px; border: 1px solid var(--admin-border);
}
.qp-student-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--admin-accent); color: #1a2e3c;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px; flex-shrink: 0;
}
.qp-student-name { font-size: 14px; font-weight: 600; color: var(--admin-text); }
.qp-student-meta { font-size: 11px; color: var(--admin-text-muted); margin-top: 1px; }

.qp-score-row { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
.qp-score-row:nth-child(odd) { background: var(--admin-bg); }
.qp-score-subj { color: var(--admin-text); font-weight: 500; width: 36px; }
.qp-score-type { color: var(--admin-text-muted); width: 40px; font-size: 10px; }
.qp-score-val { font-weight: 700; width: 48px; text-align: right; }
.qp-score-date { color: var(--admin-text-muted); font-size: 10px; margin-left: auto; }

.qp-weak-tag {
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: var(--admin-bg); color: var(--admin-warning); cursor: pointer;
  transition: all 0.15s;
}
.qp-weak-tag.active { background: var(--admin-warning); color: #fff; }
.qp-weak-tag:hover { opacity: 0.8; }

/* Weakness */
.qp-weakness-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.qp-weakness-rank { font-size: 10px; color: var(--admin-text-muted); width: 16px; text-align: center; }
.qp-weakness-name { font-size: 11px; color: var(--admin-text); width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qp-weakness-bar { flex: 1; height: 5px; background: var(--admin-border); border-radius: 3px; overflow: hidden; }
.qp-weakness-bar div { height: 100%; border-radius: 3px; }
.qp-weakness-rate { font-size: 10px; color: var(--admin-text-muted); width: 36px; text-align: right; }

/* Question Cards */
.qp-question-card {
  background: var(--admin-bg); border-radius: 12px; padding: 16px;
  margin-bottom: 10px; border: 1px solid var(--admin-border);
  transition: border-color 0.15s;
}
.qp-question-card:hover { border-color: var(--admin-accent); }
.qp-q-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.qp-q-num {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--admin-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.qp-q-topic { font-size: 11px; background: var(--admin-accent); color: #1a2e3c; padding: 2px 10px; border-radius: 10px; font-weight: 500; }
.qp-q-body { font-size: 14px; line-height: 1.9; color: var(--admin-text); margin-bottom: 8px; }
.qp-q-options { padding-left: 16px; margin-bottom: 8px; }
.qp-q-opt { font-size: 13px; line-height: 2; color: var(--admin-text-secondary); }
.qp-answer-panel {
  margin-top: 10px; padding: 12px 14px;
  background: var(--admin-bg);
  border: 1px solid var(--admin-border);
  border-radius: 8px; font-size: 12px; line-height: 1.8; color: var(--admin-text-secondary);
}
.qp-answer-row { margin-bottom: 4px; }
.qp-q-actions { display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--admin-border); }

.ocr-upload-zone {
  width: 100%; height: 220px; border: 2px dashed var(--admin-border);
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; transition: border-color 0.2s; background: var(--admin-bg);
}
.ocr-upload-zone:hover { border-color: var(--admin-accent); }
.ocr-preview-img { width: 100%; height: 100%; object-fit: contain; }
.ocr-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; }
</style>
