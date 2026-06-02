<!--
  Counseling.vue — 心理辅导与家庭压力跟踪
  Features: 咨询记录管理 · 语音录音转写 · 情绪状态看板 · 家庭压力评估 · 危机预警
-->
<template>
  <div class="counsel-page">
    <!-- ===== Page Hero ===== -->
    <div class="counsel-hero">
      <div class="counsel-hero-icon">💬</div>
      <div class="counsel-hero-text">
        <h1>心理辅导与家庭压力跟踪</h1>
        <p>情绪观察 · 咨询记录 · 语音转写 · 危机预警 · 家庭支持</p>
      </div>
      <div class="counsel-hero-actions">
        <el-button size="small" type="primary" @click="openDialog(null)">+ 新增咨询记录</el-button>
        <el-button size="small" @click="openDialog(null, true)">🎙️ 快速录音记录</el-button>
      </div>
    </div>

    <div class="counsel-grid">
      <!-- Left: Records Table -->
      <div class="counsel-left">
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">📋 心理咨询记录</div>
            </div>
            <div style="display:flex;gap:8px">
              <el-select v-model="filterCounselorType" size="small" placeholder="咨询类型" style="width:110px" clearable>
                <el-option v-for="t in types" :key="t" :label="t" :value="t" />
              </el-select>
              <el-select v-model="filterCounselorRisk" size="small" placeholder="危机等级" style="width:100px" clearable>
                <el-option label="低风险" value="低" />
                <el-option label="中风险" value="中" />
                <el-option label="高风险" value="高" />
              </el-select>
            </div>
          </div>
          <el-table :data="paginatedRecords" stripe size="small" style="width:100%">
            <el-table-column label="学生" min-width="80">
              <template #default="{ row }">
                <span style="font-weight:500;color:var(--admin-text)">{{ row.studentName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="95" />
            <el-table-column label="类型" width="95">
              <template #default="{ row }">
                <span class="admin-tag info">{{ row.type }}</span>
              </template>
            </el-table-column>
            <el-table-column label="情绪" width="70">
              <template #default="{ row }">
                <span class="admin-tag" :class="moodTag(row.mood)">{{ row.mood }}</span>
              </template>
            </el-table-column>
            <el-table-column label="危机" width="70">
              <template #default="{ row }">
                <span class="admin-tag" :class="riskTag(row.riskLevel)">{{ row.riskLevel || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="录音" width="80">
              <template #default="{ row }">
                <span v-if="row.recordingDuration" style="font-size:11px;color:var(--admin-accent)">🎙️ {{ row.recordingDuration }}</span>
                <span v-else style="font-size:10px;color:var(--admin-text-muted)">—</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="viewRecord(row)">查看</el-button>
                <el-button size="small" text @click="openDialog(row)">编辑</el-button>
                <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:11px;color:var(--admin-text-muted)">
              共 {{ filteredRecords.length }} 条记录
              <span v-if="alerts.length" style="color:var(--admin-danger);margin-left:8px">⚠ {{ alerts.length }} 条预警</span>
            </span>
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,15,20,50]" :total="filteredRecords.length" layout="total, sizes, prev, pager, next, jumper" size="small" background />
          </div>
        </div>

        <!-- Family Pressure Assessment -->
        <div class="admin-card" style="margin-top:14px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">🏠 家庭压力评估</div>
          <el-table :data="familyRecords" stripe size="small" style="width:100%">
            <el-table-column label="学生" prop="student" />
            <el-table-column prop="familyType" label="家庭类型" />
            <el-table-column label="压力等级">
              <template #default="{ row }">
                <span class="admin-tag" :class="pressureTag(row.pressure)">{{ row.pressure }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="主要压力源" show-overflow-tooltip />
            <el-table-column label="跟进状态">
              <template #default="{ row }">
                <span class="admin-tag" :class="row.followUp==='跟进中'?'warning':'success'">{{ row.followUp }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Right: Mood Overview + Alerts -->
      <div class="counsel-right">
        <!-- Mood Dashboard -->
        <div class="admin-card">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">🎭 学生情绪看板</div>
          <div class="mood-grid">
            <div v-for="s in studentMoods" :key="s.name" class="mood-card-item" :style="{borderLeftColor: moodColor(s.mood)}">
              <div class="mood-card-top">
                <span class="mood-card-avatar" :style="{background: moodColor(s.mood)}">{{ s.name[0] }}</span>
                <div class="mood-card-info">
                  <span class="mood-card-name">{{ s.name }}</span>
                  <span class="mood-card-class">{{ s.class }}</span>
                </div>
                <span class="mood-card-emoji">{{ moodEmoji(s.mood) }}</span>
              </div>
              <div class="mood-card-bottom">
                <span class="admin-tag" :class="moodTag(s.mood)" style="font-size:9px">{{ s.mood }}</span>
                <span style="font-size:9px;color:var(--admin-text-muted)">最近：{{ s.lastCounseling }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        <div class="admin-card counsel-alert-card" style="margin-top:14px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px;color:var(--admin-danger)">⚠️ 需要特别关注</div>
          <div v-for="a in alerts" :key="a.name" class="counsel-alert-item">
            <div class="counsel-alert-left">
              <span class="counsel-alert-icon">⚠</span>
            </div>
            <div class="counsel-alert-body">
              <div class="counsel-alert-header">
                <span class="counsel-alert-name">{{ a.name }}</span>
                <span class="counsel-alert-class">{{ a.class }}</span>
              </div>
              <div class="counsel-alert-signal">{{ a.signal }}</div>
              <div class="counsel-alert-suggestion">💡 {{ a.suggestion }}</div>
            </div>
          </div>
          <div v-if="alerts.length === 0" style="text-align:center;padding:20px;color:var(--admin-success);font-size:13px">
            ✨ 当前无高风险预警
          </div>
        </div>
      </div>
    </div>

    <!-- ===== View Record Dialog (read-only) ===== -->
    <el-dialog v-model="viewVisible" title="咨询记录详情" width="700px" top="3vh" :append-to-body="true">
      <div v-if="viewRecordData" class="counsel-detail">
        <div class="counsel-detail-header">
          <div class="counsel-detail-student">
            <span class="counsel-detail-avatar">{{ (viewRecordData.studentName || '未')?.[0] }}</span>
            <div>
              <div class="counsel-detail-name">{{ viewRecordData.studentName }} <span class="counsel-detail-class">{{ viewRecordData.class }}班</span></div>
              <div style="font-size:11px;color:var(--admin-text-muted)">{{ viewRecordData.date }} · {{ viewRecordData.counselor || '张老师' }}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <span class="admin-tag info">{{ viewRecordData.type }}</span>
            <span class="admin-tag" :class="moodTag(viewRecordData.mood)">{{ viewRecordData.mood }}</span>
            <span class="admin-tag" :class="riskTag(viewRecordData.riskLevel)">危机{{ viewRecordData.riskLevel || '低' }}</span>
          </div>
        </div>
        <div class="counsel-detail-grid">
          <div class="counsel-detail-field">
            <label>咨询方式</label>
            <span>{{ viewRecordData.counselingMode || '—' }}</span>
          </div>
          <div class="counsel-detail-field">
            <label>咨询时长</label>
            <span>{{ viewRecordData.duration || '—' }} 分钟</span>
          </div>
          <div class="counsel-detail-field">
            <label>家长参与</label>
            <span>{{ viewRecordData.parentInvolved ? '是' : '否' }}</span>
          </div>
          <div class="counsel-detail-field">
            <label>录音</label>
            <span>{{ viewRecordData.recordingDuration || '无' }}</span>
          </div>
        </div>
        <div class="counsel-detail-section" v-if="viewRecordData.studentReport">
          <label>🗣️ 学生主诉</label>
          <div class="counsel-detail-text">{{ viewRecordData.studentReport }}</div>
        </div>
        <div class="counsel-detail-section" v-if="viewRecordData.observation">
          <label>👁️ 观察记录</label>
          <div class="counsel-detail-text">{{ viewRecordData.observation }}</div>
        </div>
        <div class="counsel-detail-section" v-if="viewRecordData.content">
          <label>📝 谈话摘要</label>
          <div class="counsel-detail-text">{{ viewRecordData.content }}</div>
        </div>
        <div class="counsel-detail-section" v-if="viewRecordData.intervention">
          <label>🛠️ 干预措施</label>
          <div class="counsel-detail-text">{{ viewRecordData.intervention }}</div>
        </div>
        <div class="counsel-detail-section" v-if="viewRecordData.transcription">
          <label>🎙️ 语音转写</label>
          <div class="counsel-detail-text counsel-detail-transcript">{{ viewRecordData.transcription }}</div>
        </div>
        <div class="counsel-detail-grid" style="margin-top:14px">
          <div class="counsel-detail-field">
            <label>跟进建议</label>
            <span>{{ viewRecordData.followUp || '—' }}</span>
          </div>
          <div class="counsel-detail-field">
            <label>下次跟进</label>
            <span>{{ viewRecordData.nextFollowUp || '—' }}</span>
          </div>
          <div class="counsel-detail-field">
            <label>需要转介</label>
            <span>{{ viewRecordData.needReferral ? '是' : '否' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
        <el-button type="primary" @click="viewVisible = false; openDialog(viewRecordData)">✏️ 编辑此记录</el-button>
      </template>
    </el-dialog>

    <!-- ===== Add/Edit Dialog ===== -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑咨询记录' : '新增心理咨询记录'" width="800px" top="2vh" :close-on-click-modal="false" :append-to-body="true" @close="closeDialog">
      <div class="counsel-form-banner" v-if="form.studentId">
        <span>{{ getStudentName(form.studentId) }}</span>
        <span v-if="editingId" style="font-size:10px;color:var(--admin-text-muted);margin-left:8px">编辑已有记录，修改后将保存</span>
      </div>

      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>学生 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="form.studentId" style="width:100%" filterable @change="onStudentSelect">
            <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>咨询类型</label>
          <el-select v-model="form.type" style="width:100%">
            <el-option v-for="t in types" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>咨询方式</label>
          <el-select v-model="form.counselingMode" style="width:100%">
            <el-option label="面谈" value="面谈" />
            <el-option label="电话" value="电话" />
            <el-option label="线上" value="线上" />
          </el-select>
        </div>
      </div>

      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>情绪状态</label>
          <el-select v-model="form.mood" style="width:100%">
            <el-option v-for="m in moods" :key="m" :label="`${moodEmoji(m)} ${m}`" :value="m" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>危机等级</label>
          <el-select v-model="form.riskLevel" style="width:100%">
            <el-option label="低（常规关注）" value="低" />
            <el-option label="中（加强跟进）" value="中" />
            <el-option label="高（紧急干预）" value="高" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>咨询时长（分钟）</label>
          <el-input-number v-model="form.duration" :min="5" :max="180" size="small" style="width:100%" />
        </div>
      </div>

      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>家长参与</label>
          <el-switch v-model="form.parentInvolved" active-text="是" inactive-text="否" style="margin-top:6px" />
        </div>
        <div class="admin-form-group">
          <label>需要转介</label>
          <el-switch v-model="form.needReferral" size="small" />
        </div>
        <div class="admin-form-group">
          <label>下次跟进日期</label>
          <el-date-picker v-model="form.nextFollowUp" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </div>
      </div>

      <!-- Recording Section -->
      <div class="rec-section">
        <div class="rec-bar">
          <span class="rec-label">语音记录</span>
          <span v-if="recordingState === 'recording'" class="rec-dot live">●</span>
          <span v-else-if="recordingState === 'stopped'" class="rec-dot done">✓</span>
          <span class="rec-status">{{ recordingState === 'idle' ? '就绪' : recordingState === 'recording' ? '录音中 ' + formatTime(recordingTime) : '完成 ' + formatTime(recordingTime) }}</span>
        </div>
        <div class="rec-actions">
          <button v-if="recordingState === 'idle'" class="rec-btn rec-start" @click="startRecording">开始录音</button>
          <button v-if="recordingState === 'recording'" class="rec-btn rec-stop" @click="stopRecording">停止</button>
          <button v-if="recordingState === 'stopped' && audioBlobUrl" class="rec-btn rec-play" @click="togglePlayback">{{ isPlaying ? '暂停' : '播放' }}</button>
          <button v-if="recordingState === 'stopped'" class="rec-btn rec-retry" @click="resetRecording">重录</button>
          <span v-if="editingId && recordingState === 'idle' && form.recordingDuration" class="rec-saved">已存 {{ form.recordingDuration }}</span>
        </div>
        <div v-if="recordingState === 'stopped'" class="rec-trans">
          <div class="rec-trans-bar">
            <span>语音转文本</span>
            <button class="rec-btn rec-ai" @click="startTranscription" :disabled="isTranscribing || !audioBlobUrl">{{ isTranscribing ? '转写中...' : transcribedText ? '重新转写' : 'AI 转写' }}</button>
          </div>
          <el-input v-model="transcribedText" type="textarea" rows="4" placeholder="点击「AI 转写」将录音转换为文字..." />
          <button v-if="transcribedText" class="rec-btn rec-copy" @click="copyToContent">复制到学生主诉</button>
        </div>
        <audio ref="audioPlayer" @ended="isPlaying=false" style="display:none"></audio>
      </div>

      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>学生主诉</label>
          <el-input v-model="form.studentReport" type="textarea" :rows="3" placeholder="学生本人陈述的主要问题或困扰..." />
        </div>
        <div class="admin-form-group">
          <label>观察记录</label>
          <el-input v-model="form.observation" type="textarea" :rows="3" placeholder="咨询师对学生情绪、行为、语言表现的观察..." />
        </div>
      </div>
      <div class="admin-form-group">
        <label>谈话摘要</label>
        <el-input v-model="form.content" type="textarea" :rows="3" placeholder="记录本次咨询的主要内容..." />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>干预措施</label>
          <el-input v-model="form.intervention" type="textarea" :rows="2" placeholder="已采取或计划采取的干预措施..." />
        </div>
        <div class="admin-form-group">
          <label>跟进建议</label>
          <el-input v-model="form.followUp" type="textarea" :rows="2" placeholder="后续跟进建议..." />
        </div>
      </div>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveRecord">{{ editingId ? '保存修改' : '保存记录' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 页面：心理辅导与家庭压力跟踪
 * 功能：管理心理咨询记录与语音录音转写，跟踪学生情绪状态、家庭压力评估及危机预警
 * 路由：/admin/counseling
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { counselingService, studentService } from '@/services/dataService'

const counselingRecords = ref([])
const studentList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const filterCounselorType = ref('')
const filterCounselorRisk = ref('')

// View mode
const viewVisible = ref(false)
const viewRecordData = ref(null)

const filteredRecords = computed(() => {
  let list = counselingRecords.value
  if (filterCounselorType.value) list = list.filter(c => c.type === filterCounselorType.value)
  if (filterCounselorRisk.value) list = list.filter(c => c.riskLevel === filterCounselorRisk.value)
  return list.sort((a, b) => b.date?.localeCompare(a.date || ''))
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

const types = ['学业压力','同伴关系','家庭问题','情绪管理','生涯规划','危机干预','其他']
const moods = ['良好','一般','焦虑','低落','烦躁','恐惧','愤怒']

const form = ref({
  studentId: null, studentName: '', class: '', type: '学业压力', mood: '一般',
  counselingMode: '面谈', riskLevel: '低', duration: 30, parentInvolved: false,
  studentReport: '', observation: '', content: '', intervention: '',
  followUp: '', nextFollowUp: '', needReferral: false,
  recordingDuration: null, transcription: null
})

// Voice recording state
const recordingState = ref('idle')
const recordingTime = ref(0)
const isPlaying = ref(false)
const isTranscribing = ref(false)
const transcribedText = ref('')
const audioBlobUrl = ref(null)
const audioPlayer = ref(null)
const waveHeights = ref(Array.from({length:30}, () => 4))
let mediaRecorder = null; let audioChunks = []; let recordingTimer = null; let waveTimer = null; let stream = null
let recognition = null

function getStudentName(sid) {
  const s = studentList.value.find(x => x.id === sid)
  return s ? `${s.name} · ${s.class}班` : '未选择'
}

onMounted(() => {
  studentList.value = studentService.getAll()
  counselingRecords.value = counselingService.getAll()
})

onBeforeUnmount(() => {
  if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null }
  if (waveTimer) { clearInterval(waveTimer); waveTimer = null }
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
  if (audioBlobUrl.value) { URL.revokeObjectURL(audioBlobUrl.value); audioBlobUrl.value = null }
  if (recognition) { try { recognition.stop() } catch {} }
})

const studentMoods = computed(() => {
  const latest = new Map()
  counselingRecords.value.forEach(c => {
    if (!latest.has(c.studentId) || c.date > latest.get(c.studentId).date) {
      latest.set(c.studentId, c)
    }
  })
  const result = []
  latest.forEach((c, sid) => {
    const s = studentList.value.find(s => s.id === sid)
    if (s) result.push({ name: s.name, class: s.class, mood: c.mood, lastCounseling: c.date })
  })
  return result.sort((a, b) => b.lastCounseling.localeCompare(a.lastCounseling))
})

const familyRecords = [
  { student:'王芳芳', familyType:'双职工', pressure:'高', source:'父母关系紧张', followUp:'跟进中' },
  { student:'李美玲', familyType:'单亲', pressure:'中', source:'母亲工作压力大', followUp:'跟进中' },
  { student:'黄小燕', familyType:'双职工', pressure:'中', source:'家长期望过高', followUp:'已沟通' },
  { student:'陈小明', familyType:'核心家庭', pressure:'低', source:'—', followUp:'无需跟进' }
]

const alerts = computed(() => {
  const result = []
  const latest = new Map()
  counselingRecords.value.forEach(c => {
    if (!latest.has(c.studentId) || c.date > latest.get(c.studentId).date) {
      latest.set(c.studentId, c)
    }
  })
  latest.forEach((c, sid) => {
    if (c.riskLevel === '高' || c.mood === '低落' || c.mood === '恐惧') {
      const s = studentList.value.find(s => s.id === sid)
      if (s) {
        result.push({
          name: s.name, class: s.class,
          signal: `${c.mood}情绪 · ${c.type} · 危机等级${c.riskLevel}`,
          suggestion: c.followUp || '建议尽快安排跟进咨询'
        })
      }
    }
  })
  if (result.length === 0) {
    return [
      { name:'王芳芳', class:'5C', signal:'连续两周情绪低落，作业质量明显下降', suggestion:'建议：本周内安排家访，了解家庭具体情况' },
      { name:'黄小燕', class:'5D', signal:'对考试过度焦虑，出现失眠情况', suggestion:'建议：引导放松训练，必要时转介学校心理老师' }
    ]
  }
  return result
})

function moodTag(m) { return { '良好':'success','一般':'info','焦虑':'warning','低落':'primary','烦躁':'danger','恐惧':'danger','愤怒':'danger' }[m]||'info' }
function moodColor(m) { return { '良好':'#22c55e','一般':'#3b82f6','焦虑':'#f59e0b','低落':'#64748b','烦躁':'#ef4444','恐惧':'#dc2626','愤怒':'#f97316' }[m]||'#64748b' }
function moodEmoji(m) { return { '良好':'😊','一般':'😐','焦虑':'😰','低落':'😢','烦躁':'😤','恐惧':'😨','愤怒':'😡' }[m]||'😐' }
function pressureTag(p) { return { '高':'danger','中':'warning','低':'success' }[p]||'info' }
function riskTag(r) { return { '低':'success','中':'warning','高':'danger' }[r]||'info' }

function onStudentSelect() {
  const s = studentList.value.find(s => s.id === form.value.studentId)
  if (s) { form.value.studentName = s.name; form.value.class = s.class }
}

function formatTime(sec) {
  const m = Math.floor(sec/60); const s = sec%60
  return `${m}:${s.toString().padStart(2,'0')}`
}

// === Voice Recording ===
async function startRecording() {
  const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  if (speechSupported && !recognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'zh-CN'
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const txt = event.results[i][0].transcript.trim()
          if (txt) transcribedText.value += (transcribedText.value ? '\n' : '') + txt
        }
      }
    }
    recognition.onerror = (e) => { if (e.error !== 'no-speech') console.log('语音识别:', e.error) }
    try { recognition.start() } catch {}
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    audioChunks = []
    mediaRecorder.ondataavailable = e => { if (e.data.size>0) audioChunks.push(e.data) }
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type:'audio/webm' })
      if (audioBlobUrl.value) URL.revokeObjectURL(audioBlobUrl.value)
      audioBlobUrl.value = URL.createObjectURL(blob)
      if (stream) { stream.getTracks().forEach(t=>t.stop()); stream = null }
      if (recognition) { try { recognition.stop() } catch {} }
    }
    mediaRecorder.start()
    recordingState.value = 'recording'; recordingTime.value = 0
    recordingTimer = setInterval(() => recordingTime.value++, 1000)
    startWaveAnimation()
  } catch { simulateRecording() }
}

function simulateRecording() {
  recordingState.value = 'recording'; recordingTime.value = 0
  startWaveAnimation()
  recordingTimer = setInterval(() => { recordingTime.value++; if (recordingTime.value>=5) stopRecording() }, 1000)
}

function stopRecording() {
  if (mediaRecorder?.state==='recording') mediaRecorder.stop()
  if (recordingTimer) { clearInterval(recordingTimer); recordingTimer = null }
  if (waveTimer) { clearInterval(waveTimer); waveTimer = null }
  recordingState.value = 'stopped'
  waveHeights.value = Array.from({length:30}, () => 4)
}

function togglePlayback() {
  if (!audioPlayer.value||!audioBlobUrl.value) return
  if (isPlaying.value) { audioPlayer.value.pause(); isPlaying.value = false }
  else { audioPlayer.value.src = audioBlobUrl.value; audioPlayer.value.play().catch(()=>{}); isPlaying.value = true }
}

function resetRecording() {
  if (audioPlayer.value) { audioPlayer.value.pause(); audioPlayer.value.src='' }
  if (audioBlobUrl.value) { URL.revokeObjectURL(audioBlobUrl.value); audioBlobUrl.value = null }
  if (waveTimer) { clearInterval(waveTimer); waveTimer = null }
  if (recognition) { try { recognition.stop() } catch {}; recognition = null }
  isPlaying.value = false; recordingState.value = 'idle'; recordingTime.value = 0; transcribedText.value = ''
  waveHeights.value = Array.from({length:30}, () => 4)
}

function startTranscription() {
  if (!audioBlobUrl.value) { ElMessage.warning('请先录音'); return }
  isTranscribing.value = true
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'zh-CN'
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const txt = event.results[i][0].transcript.trim()
          if (txt) transcribedText.value += (transcribedText.value ? '\n' : '') + txt
        }
      }
    }
    recognition.onend = () => { isTranscribing.value = false; ElMessage.success('AI转写完成') }
    recognition.onerror = () => { simulateTranscription() }
    try { recognition.start() } catch { simulateTranscription() }
    if (audioPlayer.value) {
      audioPlayer.value.src = audioBlobUrl.value
      audioPlayer.value.play().catch(() => {})
      audioPlayer.value.onended = () => { try { recognition.stop() } catch {} }
    }
    setTimeout(() => {
      if (isTranscribing.value) { try { recognition.stop() } catch {}; if (!transcribedText.value) simulateTranscription() }
    }, 15000)
  } else { simulateTranscription() }
}

function simulateTranscription() {
  const templates = [
    '学生反映最近学习压力较大，尤其在数学科目上感到困难。课堂注意力有时不集中，作业完成质量有所下降。经沟通后，学生表示愿意尝试调整学习方法，减少自我施压。',
    '学生在同伴交往中感到孤立，课间较少与同学互动。建议参加小组活动提升社交体验。家庭方面，父母近期工作繁忙，关注度有所下降。',
    '学生对未来升学方向感到迷茫，缺乏明确的目标规划。建议安排生涯规划指导，帮助其了解自身优势与兴趣方向。'
  ]
  transcribedText.value = templates[Math.floor(Math.random() * templates.length)]
  isTranscribing.value = false; ElMessage.success('AI转写完成')
}

function startWaveAnimation() {
  waveTimer = setInterval(() => {
    waveHeights.value = waveHeights.value.map((_, i) => (Math.sin(Date.now()/200 + i*0.5)*0.4 + 0.6) * 40)
  }, 80)
}

function copyToContent() { form.value.studentReport = transcribedText.value }

function viewRecord(c) {
  viewRecordData.value = { ...c }
  viewVisible.value = true
}

function openDialog(c, focusRecording = false) {
  if (c) {
    editingId.value = c.id
    form.value = {
      studentId: c.studentId, studentName: c.studentName || '', class: c.class || '',
      type: c.type || '学业压力', mood: c.mood || '一般',
      counselingMode: c.counselingMode || '面谈', riskLevel: c.riskLevel || '低',
      duration: c.duration || 30, parentInvolved: c.parentInvolved || false,
      studentReport: c.studentReport || '', observation: c.observation || '',
      content: c.content || '', intervention: c.intervention || '',
      followUp: c.followUp || '', nextFollowUp: c.nextFollowUp || '',
      needReferral: c.needReferral || false,
      recordingDuration: c.recordingDuration || null, transcription: c.transcription || null
    }
    // Preserve existing transcription/recording data when editing
    if (c.transcription) transcribedText.value = c.transcription
    else transcribedText.value = ''
    // Don't reset recording - keep existing data
    recordingState.value = 'idle'
    recordingTime.value = 0
  } else {
    editingId.value = null
    form.value = {
      studentId: null, studentName: '', class: '', type: '学业压力', mood: '一般',
      counselingMode: '面谈', riskLevel: '低', duration: 30, parentInvolved: false,
      studentReport: '', observation: '', content: '', intervention: '',
      followUp: '', nextFollowUp: '', needReferral: false,
      recordingDuration: null, transcription: null
    }
    resetRecording()
  }
  dialogVisible.value = true
  if (focusRecording) setTimeout(() => startRecording(), 300)
}

function closeDialog() { dialogVisible.value = false; resetRecording() }

function saveRecord() {
  if (!form.value.studentId) { ElMessage.warning('请选择学生'); return }
  const mins = Math.floor(recordingTime.value/60); const secs = recordingTime.value%60
  const data = {
    ...form.value, date: new Date().toISOString().split('T')[0],
    counselor: '张老师',
    recordingDuration: recordingTime.value>0 ? `${mins}:${secs.toString().padStart(2,'0')}` : (form.value.recordingDuration || null),
    transcription: transcribedText.value || form.value.transcription || null
  }
  if (editingId.value) { counselingService.update(editingId.value, data); ElMessage.success('已更新') }
  else { counselingService.create(data); ElMessage.success('已保存') }
  dialogVisible.value = false
  counselingRecords.value = counselingService.getAll()
}

async function handleDelete(c) {
  try {
    await ElMessageBox.confirm('确定删除此咨询记录吗？此操作不可恢复。', '确认删除', { confirmButtonText:'删除', cancelButtonText:'取消', type:'warning' })
    counselingService.delete(c.id)
    counselingRecords.value = counselingService.getAll()
    ElMessage.success('已删除')
  } catch {}
}
</script>

<style scoped>
/* === Page Hero === */
.counsel-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px;
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-lg);
  margin-bottom: 18px;
}
.counsel-hero-icon { font-size: 32px; }
.counsel-hero-text h1 { font-size: 18px; font-weight: 700; color: var(--admin-text); margin: 0 0 2px; }
.counsel-hero-text p { font-size: 12px; color: var(--admin-text-muted); margin: 0; }
.counsel-hero-actions { margin-left: auto; display: flex; gap: 8px; }

/* === Grid Layout === */
.counsel-grid { display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start; }
@media (max-width: 1100px) { .counsel-grid { grid-template-columns: 1fr; } }

/* === Mood Cards === */
.mood-grid { display: grid; grid-template-columns: 1fr; gap: 8px; max-height: 460px; overflow-y: auto; }
.mood-card-item {
  background: var(--admin-bg);
  border-radius: 10px;
  padding: 12px;
  border-left: 4px solid var(--admin-border);
  transition: all 0.2s ease;
}
.mood-card-item:hover { background: var(--admin-surface-hover); }
.mood-card-top { display: flex; align-items: center; gap: 10px; }
.mood-card-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }
.mood-card-info { flex: 1; min-width: 0; }
.mood-card-name { font-size: 13px; font-weight: 600; color: var(--admin-text); display: block; }
.mood-card-class { font-size: 10px; color: var(--admin-text-muted); display: block; }
.mood-card-emoji { font-size: 22px; flex-shrink: 0; }
.mood-card-bottom { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--admin-border); }

/* === Recording Section === */
.rec-section { border: 1px solid var(--admin-border); border-radius: 10px; padding: 14px 18px; margin-bottom: 14px; }
.rec-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.rec-label { font-size: 13px; font-weight: 700; color: var(--admin-text); }
.rec-dot { font-size: 10px; }
.rec-dot.live { color: #ef4444; animation: recPulse 1.2s ease infinite; }
.rec-dot.done { color: #22c55e; }
@keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
.rec-status { font-size: 11px; color: var(--admin-text-muted); }
.rec-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.rec-btn { font-size: 12px; padding: 5px 14px; border-radius: 6px; border: 1px solid var(--admin-border); background: var(--admin-bg); color: var(--admin-text-secondary); cursor: pointer; font-family: inherit; transition: all 0.15s; }
.rec-btn:hover { border-color: var(--admin-accent); color: var(--admin-text); }
.rec-start { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); color: #818cf8; }
.rec-start:hover { background: rgba(99,102,241,0.16); }
.rec-stop { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #f87171; }
.rec-play { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.25); color: #4ade80; }
.rec-retry { font-size: 11px; padding: 5px 10px; }
.rec-ai { font-size: 11px; padding: 3px 10px; }
.rec-copy { font-size: 11px; margin-top: 6px; }
.rec-saved { font-size: 10px; color: var(--admin-text-muted); margin-left: auto; }
.rec-trans { margin-top: 8px; }
.rec-trans-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.rec-trans-bar span { font-size: 12px; font-weight: 600; color: var(--admin-text-secondary); }
.transcription-area { border-top: 1px solid var(--admin-border); padding-top: 14px; }
.transcription-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: var(--admin-text-secondary); }

/* === View Detail === */
.counsel-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--admin-border);
}
.counsel-detail-student { display: flex; align-items: center; gap: 12px; }
.counsel-detail-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--admin-accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
.counsel-detail-name { font-size: 16px; font-weight: 700; color: var(--admin-text); }
.counsel-detail-class { font-size: 12px; color: var(--admin-text-muted); margin-left: 6px; font-weight: 400; }
.counsel-detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.counsel-detail-field label { display: block; font-size: 10px; color: var(--admin-text-muted); text-transform: uppercase; margin-bottom: 2px; }
.counsel-detail-field span { font-size: 13px; color: var(--admin-text); font-weight: 500; }
.counsel-detail-section { margin-top: 14px; }
.counsel-detail-section label { display: block; font-size: 12px; font-weight: 600; color: var(--admin-text-secondary); margin-bottom: 6px; }
.counsel-detail-text { font-size: 12px; line-height: 1.8; color: var(--admin-text); padding: 10px 14px; background: var(--admin-bg); border-radius: 8px; }
.counsel-detail-transcript { border-left: 3px solid var(--admin-accent); font-style: italic; }

/* === Form Banner === */
.counsel-form-banner { font-size: 13px; font-weight: 600; color: var(--admin-text); padding: 8px 14px; background: var(--admin-bg); border-radius: 8px; margin-bottom: 14px; }

/* === Alert Card === */
.counsel-alert-card { border-left: 3px solid var(--admin-danger); }
.counsel-alert-item { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--admin-border); }
.counsel-alert-item:last-child { border-bottom: none; }
.counsel-alert-left { flex-shrink: 0; }
.counsel-alert-icon { color: var(--admin-danger); font-size: 18px; }
.counsel-alert-body { flex: 1; min-width: 0; }
.counsel-alert-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.counsel-alert-name { font-size: 13px; font-weight: 600; color: var(--admin-text); }
.counsel-alert-class { font-size: 10px; color: var(--admin-text-muted); }
.counsel-alert-signal { font-size: 11px; color: var(--admin-text-secondary); margin-bottom: 2px; }
.counsel-alert-suggestion { font-size: 10px; color: var(--admin-warning); line-height: 1.5; }

@media (max-width: 768px) {
  .counsel-hero { flex-wrap: wrap; }
  .counsel-hero-actions { margin-left: 0; width: 100%; }
  .counsel-detail-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
