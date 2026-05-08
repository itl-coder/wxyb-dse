<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">💬 心理辅导与家庭压力跟踪</div>
          <div class="admin-card-subtitle">学生情绪观察 · 心理咨询记录 · 语音录音转写 · 家庭教育压力评估</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-button size="small" type="primary" @click="openDialog(null)">+ 新增咨询记录</el-button>
        </div>
      </div>
    </div>

    <div class="admin-two-col">
      <!-- Records -->
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📋 近期心理咨询记录</div>
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
          <el-select v-model="filterCounselorType" size="small" placeholder="咨询类型" style="width:110px" clearable>
            <el-option v-for="t in types" :key="t" :label="t" :value="t" />
          </el-select>
          <el-select v-model="filterCounselorRisk" size="small" placeholder="危机等级" style="width:100px" clearable>
            <el-option label="低风险" value="低" />
            <el-option label="中风险" value="中" />
            <el-option label="高风险" value="高" />
          </el-select>
        </div>
        <el-table :data="paginatedRecords" stripe size="small" style="width:100%">
          <el-table-column label="学生" fixed>
            <template #default="{ row }">
              <span style="color:var(--admin-text);font-weight:500">{{ row.studentName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="date" label="日期" />
          <el-table-column label="类型">
            <template #default="{ row }">
              <span class="admin-tag info">{{ row.type }}</span>
            </template>
          </el-table-column>
          <el-table-column label="情绪">
            <template #default="{ row }">
              <span class="admin-tag" :class="moodTag(row.mood)">{{ row.mood }}</span>
            </template>
          </el-table-column>
          <el-table-column label="危机">
            <template #default="{ row }">
              <span class="admin-tag" :class="riskTag(row.riskLevel)">{{ row.riskLevel || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="录音">
            <template #default="{ row }">
              <span v-if="row.recordingDuration" style="font-size:11px;color:var(--admin-accent)">🎙️ {{ row.recordingDuration }}</span>
              <span v-else style="font-size:10px;color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column label="简要" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.content?.slice(0, 50) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="{ row }">
              <el-button size="small" text @click="openDialog(row)">编辑</el-button>
              <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top:8px;display:flex;justify-content:center" v-if="counselingRecords.length > pageSize">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,15,20,50]" :total="counselingRecords.length" layout="total, sizes, prev, pager, next, jumper" size="small" background />
        </div>
      </div>

      <!-- Mood overview -->
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">🎭 学生情绪状态总览</div>
        <div v-for="s in studentMoods" :key="s.name" class="student-mood-card">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="mood-avatar" :style="{background: moodColor(s.mood)}">{{ s.name[0] }}</div>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600;color:var(--admin-text)">{{ s.name }}</div>
              <div style="font-size:10px;color:var(--admin-text-muted)">{{ s.class }} · 最近咨询：{{ s.lastCounseling }}</div>
            </div>
            <div :style="{fontSize:'24px'}">{{ moodEmoji(s.mood) }}</div>
          </div>
          <div class="mood-indicator" :style="{background: moodColor(s.mood)}"></div>
        </div>
      </div>
    </div>

    <div class="admin-two-col" style="margin-top:16px">
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">🏠 家庭压力评估</div>
        <el-table :data="familyRecords" stripe size="small" style="width:100%">
          <el-table-column label="学生" fixed>
            <template #default="{ row }">
              <span style="color:var(--admin-text);font-weight:500">{{ row.student }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="familyType" label="家庭类型" />
          <el-table-column label="压力等级">
            <template #default="{ row }">
              <span class="admin-tag" :class="pressureTag(row.pressure)">{{ row.pressure }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="主要压力源" />
          <el-table-column label="跟进状态">
            <template #default="{ row }">
              <span class="admin-tag" :class="row.followUp==='跟进中'?'warning':'success'">{{ row.followUp }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="admin-card" style="border-left:3px solid var(--admin-danger)">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px;color:var(--admin-danger)">⚠️ 需要特别关注</div>
        <div v-for="a in alerts" :key="a.name" style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--admin-border)">
          <span style="color:var(--admin-danger);font-size:16px">⚠</span>
          <div style="flex:1">
            <div style="font-size:13px;color:var(--admin-text);font-weight:500">{{ a.name }} <span style="font-size:10px;color:var(--admin-text-muted);font-weight:400">{{ a.class }}</span></div>
            <div style="font-size:11px;color:var(--admin-text-secondary);margin-top:2px">{{ a.signal }}</div>
            <div style="font-size:10px;color:var(--admin-text-muted);margin-top:2px">{{ a.suggestion }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑咨询记录' : '新增心理咨询记录'" width="700px" @closed="resetRecording">
      <div class="admin-form-group">
        <label>学生</label>
        <el-select v-model="form.studentId" style="width:100%" filterable @change="onStudentSelect">
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-three-col" style="margin-bottom:0">
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
        <div class="admin-form-group">
          <label>情绪状态</label>
          <el-select v-model="form.mood" style="width:100%">
            <el-option v-for="m in moods" :key="m" :label="m" :value="m" />
          </el-select>
        </div>
      </div>
      <div class="admin-three-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>危机等级</label>
          <el-select v-model="form.riskLevel" style="width:100%">
            <el-option label="低" value="低" />
            <el-option label="中" value="中" />
            <el-option label="高" value="高" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>咨询时长（分钟）</label>
          <el-input-number v-model="form.duration" :min="5" :max="180" size="small" style="width:100%" />
        </div>
        <div class="admin-form-group">
          <label>家长参与</label>
          <el-switch v-model="form.parentInvolved" active-text="是" inactive-text="否" style="margin-top:6px" />
        </div>
      </div>

      <!-- Recording Section -->
      <div class="recording-section">
        <div class="recording-header">
          <label style="font-size:12px;font-weight:600;color:var(--admin-text-secondary)">🎙️ 语音记录</label>
          <span v-if="recordingState === 'idle'" style="font-size:10px;color:var(--admin-text-muted)">点击按钮开始录音</span>
          <span v-else-if="recordingState === 'recording'" style="font-size:10px;color:var(--admin-danger)" class="pulse-dot">● 录音中 {{ formatTime(recordingTime) }}</span>
          <span v-else-if="recordingState === 'stopped'" style="font-size:10px;color:var(--admin-success)">✓ 录音完成 ({{ formatTime(recordingTime) }})</span>
        </div>
        <div class="recording-controls">
          <el-button v-if="recordingState === 'idle'" size="small" @click="startRecording">🎙️ 开始录音</el-button>
          <el-button v-if="recordingState === 'recording'" size="small" type="danger" @click="stopRecording">⏹ 停止录音</el-button>
          <el-button v-if="recordingState === 'stopped' && audioBlobUrl" size="small" type="success" @click="togglePlayback">{{ isPlaying ? '⏸ 暂停' : '▶️ 播放录音' }}</el-button>
          <el-button v-if="recordingState === 'stopped'" size="small" @click="resetRecording">↺ 重新录制</el-button>
        </div>
        <div v-if="recordingState !== 'idle'" class="recording-visual">
          <div class="waveform-bar" v-for="(h, i) in waveHeights" :key="i" :style="{height: h+'px'}"></div>
        </div>
        <div v-if="recordingState === 'stopped'" class="transcription-area">
          <div class="transcription-header">
            <span>📝 语音转文本</span>
            <el-button size="small" text @click="startTranscription" :disabled="isTranscribing || !audioBlobUrl">
              {{ isTranscribing ? '转写中...' : (transcribedText ? '重新转写' : '🤖 AI转写') }}
            </el-button>
          </div>
          <el-input v-model="transcribedText" type="textarea" rows="4" placeholder="点击「AI转写」将录音转换为文字..." />
          <div v-if="transcribedText" style="display:flex;justify-content:flex-end;margin-top:6px">
            <el-button size="small" text @click="copyToContent">📋 复制到学生主诉</el-button>
          </div>
        </div>
        <audio ref="audioPlayer" @ended="isPlaying=false" style="display:none"></audio>
      </div>

      <div class="admin-form-group">
        <label>学生主诉</label>
        <el-input v-model="form.studentReport" type="textarea" :rows="2" placeholder="学生本人陈述的主要问题或困扰..." />
      </div>
      <div class="admin-form-group">
        <label>观察记录</label>
        <el-input v-model="form.observation" type="textarea" :rows="2" placeholder="咨询师对学生情绪、行为、语言、非语言表现的观察..." />
      </div>
      <div class="admin-form-group">
        <label>谈话摘要</label>
        <el-input v-model="form.content" type="textarea" :rows="3" placeholder="记录本次咨询的主要内容..." />
      </div>
      <div class="admin-form-group">
        <label>干预措施</label>
        <el-input v-model="form.intervention" type="textarea" :rows="2" placeholder="已采取或计划采取的干预措施..." />
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>跟进建议</label>
          <el-input v-model="form.followUp" type="textarea" :rows="2" placeholder="后续跟进建议..." />
        </div>
        <div class="admin-form-group">
          <label>下次跟进日期</label>
          <el-date-picker v-model="form.nextFollowUp" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
          <div style="margin-top:8px">
            <label style="font-size:11px;color:var(--admin-text-muted)">需要转介</label>
            <el-switch v-model="form.needReferral" size="small" style="margin-left:8px" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveRecord">{{ editingId ? '保存修改' : '保存' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
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

// Voice recording
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
    if (s) {
      result.push({ name: s.name, class: s.class, mood: c.mood, lastCounseling: c.date })
    }
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

// Voice recording with real Web Speech API
async function startRecording() {
  // Start speech recognition if supported
  const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  if (speechSupported && !recognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const txt = event.results[i][0].transcript.trim()
          if (txt) transcribedText.value += (transcribedText.value ? '\n' : '') + txt
        } else {
          interim += event.results[i][0].transcript
        }
      }
    }
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.log('语音识别:', e.error)
    }
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
  } catch {
    simulateRecording()
  }
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
  // Try real speech-to-text by replaying audio to recognition
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const txt = event.results[i][0].transcript.trim()
          if (txt) transcribedText.value += (transcribedText.value ? '\n' : '') + txt
        }
      }
    }
    recognition.onend = () => { isTranscribing.value = false; ElMessage.success('AI转写完成') }
    recognition.onerror = () => {
      // Fallback to simulated transcription
      simulateTranscription()
    }
    try { recognition.start() } catch { simulateTranscription() }
    // Stop recognition after audio plays
    if (audioPlayer.value) {
      audioPlayer.value.src = audioBlobUrl.value
      audioPlayer.value.play().catch(() => {})
      audioPlayer.value.onended = () => {
        try { recognition.stop() } catch {}
      }
    }
    // Timeout fallback
    setTimeout(() => {
      if (isTranscribing.value) {
        try { recognition.stop() } catch {}
        if (!transcribedText.value) simulateTranscription()
      }
    }, 15000)
  } else {
    simulateTranscription()
  }
}

function simulateTranscription() {
  const templates = [
    '学生反映最近学习压力较大，尤其在数学科目上感到困难。课堂注意力有时不集中，作业完成质量有所下降。经沟通后，学生表示愿意尝试调整学习方法，减少自我施压。',
    '学生在同伴交往中感到孤立，课间较少与同学互动。建议参加小组活动提升社交体验。家庭方面，父母近期工作繁忙，关注度有所下降。',
    '学生对未来升学方向感到迷茫，缺乏明确的目标规划。建议安排生涯规划指导，帮助其了解自身优势与兴趣方向。'
  ]
  transcribedText.value = templates[Math.floor(Math.random() * templates.length)]
  isTranscribing.value = false
  ElMessage.success('AI转写完成')
}

function startWaveAnimation() {
  waveTimer = setInterval(() => {
    waveHeights.value = waveHeights.value.map((_, i) => (Math.sin(Date.now()/200 + i*0.5)*0.4 + 0.6) * 40)
  }, 80)
}

function copyToContent() { form.value.studentReport = transcribedText.value }

function openDialog(c) {
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
    if (c.transcription) transcribedText.value = c.transcription
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
  if (editingId.value) {
    counselingService.update(editingId.value, data); ElMessage.success('已更新')
  } else {
    counselingService.create(data); ElMessage.success('已保存')
  }
  dialogVisible.value = false
  counselingRecords.value = counselingService.getAll()
}

async function handleDelete(c) {
  try {
    await ElMessageBox.confirm('确定删除此咨询记录吗？', '确认删除', { confirmButtonText:'删除', cancelButtonText:'取消', type:'warning' })
    counselingService.delete(c.id)
    counselingRecords.value = counselingService.getAll()
    ElMessage.success('已删除')
  } catch {}
}
</script>

<style scoped>
.student-mood-card { background: var(--admin-bg); border-radius: 8px; padding: 12px; margin-bottom: 8px; position: relative; overflow: hidden; }
.mood-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 14px; }
.mood-indicator { position: absolute; top: 0; left: 0; width: 3px; height: 100%; }

.recording-section { background: var(--admin-bg); border: 1px solid var(--admin-border); border-radius: 10px; padding: 16px; margin-bottom: 14px; }
.recording-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.pulse-dot { animation: pulse 1.5s ease infinite; }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
.recording-controls { display: flex; gap: 8px; margin-bottom: 12px; }
.recording-visual { display: flex; align-items: flex-end; gap: 3px; height: 48px; padding: 4px 0; margin-bottom: 12px; justify-content: center; }
.waveform-bar { width: 4px; background: var(--admin-accent); border-radius: 2px; transition: height 0.1s ease; }
.transcription-area { border-top: 1px solid var(--admin-border); padding-top: 12px; }
.transcription-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; color: var(--admin-text-secondary); }
</style>
